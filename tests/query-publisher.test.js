const assert = require('assert');
const http = require('http');
const { describe, it, after, afterEach } = require('mocha');

const Array_Adapter = require('../resources/adapters/array-adapter');
const Query_Resource = require('../resources/query-resource');
const Query_Publisher = require('../publishers/query-publisher');

// ── Sample data ────────────────────────────────────────────────
const SAMPLE_DATA = [
    { id: 1, name: 'Alice', role: 'Engineer', score: 95 },
    { id: 2, name: 'Bob', role: 'Designer', score: 82 },
    { id: 3, name: 'Charlie', role: 'Engineer', score: 78 },
    { id: 4, name: 'Diana', role: 'Manager', score: 91 },
    { id: 5, name: 'Eve', role: 'Engineer', score: 88 },
    { id: 6, name: 'Frank', role: 'Designer', score: 74 },
    { id: 7, name: 'Grace', role: 'Manager', score: 97 },
    { id: 8, name: 'Hank', role: 'Engineer', score: 63 },
    { id: 9, name: 'Ivy', role: 'Designer', score: 85 },
    { id: 10, name: 'Jack', role: 'Manager', score: 90 }
];

// ── Array_Adapter tests ────────────────────────────────────────
describe('Array_Adapter', function () {
    it('returns all rows with default params', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const result = await adapter.query();

        assert.strictEqual(result.total_count, 10);
        assert.strictEqual(result.rows.length, 10);
        assert.strictEqual(result.page, 1);
        assert.strictEqual(result.page_size, 25);
    });

    it('paginates correctly', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const result = await adapter.query({ page: 2, page_size: 3 });

        assert.strictEqual(result.total_count, 10);
        assert.strictEqual(result.rows.length, 3);
        assert.strictEqual(result.page, 2);
        assert.strictEqual(result.page_size, 3);
        assert.strictEqual(result.rows[0].name, 'Diana');
    });

    it('handles page beyond data range', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const result = await adapter.query({ page: 100, page_size: 5 });

        assert.strictEqual(result.total_count, 10);
        assert.strictEqual(result.rows.length, 0);
        assert.strictEqual(result.page, 100);
    });

    it('sorts ascending by string', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const result = await adapter.query({ sort: { key: 'name', dir: 'asc' } });

        assert.strictEqual(result.rows[0].name, 'Alice');
        assert.strictEqual(result.rows[result.rows.length - 1].name, 'Jack');
    });

    it('sorts descending by number', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const result = await adapter.query({ sort: { key: 'score', dir: 'desc' } });

        assert.strictEqual(result.rows[0].name, 'Grace');
        assert.strictEqual(result.rows[0].score, 97);
    });

    it('filters with contains op', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const result = await adapter.query({
            filters: { name: { op: 'contains', value: 'a' } }
        });

        // Alice, Charlie, Diana, Frank, Grace, Jack — names containing 'a'
        for (const row of result.rows) {
            assert(row.name.toLowerCase().includes('a'), `Expected ${row.name} to contain 'a'`);
        }
        assert.strictEqual(result.total_count, result.rows.length);
    });

    it('filters with equals op', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const result = await adapter.query({
            filters: { role: { op: 'equals', value: 'Engineer' } }
        });

        assert.strictEqual(result.total_count, 4);
        for (const row of result.rows) {
            assert.strictEqual(row.role, 'Engineer');
        }
    });

    it('filters with gt op', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const result = await adapter.query({
            filters: { score: { op: 'gt', value: 90 } }
        });

        for (const row of result.rows) {
            assert(row.score > 90, `Expected ${row.score} > 90`);
        }
    });

    it('combines filter + sort + pagination', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const result = await adapter.query({
            filters: { role: { op: 'equals', value: 'Engineer' } },
            sort: { key: 'score', dir: 'desc' },
            page: 1,
            page_size: 2
        });

        assert.strictEqual(result.total_count, 4); // 4 engineers
        assert.strictEqual(result.rows.length, 2);  // page_size 2
        assert.strictEqual(result.rows[0].name, 'Alice'); // score 95
        assert.strictEqual(result.rows[1].name, 'Eve');   // score 88
    });

    it('handles shorthand filter (string value implies contains)', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const result = await adapter.query({
            filters: { name: 'bob' }
        });

        assert.strictEqual(result.total_count, 1);
        assert.strictEqual(result.rows[0].name, 'Bob');
    });

    it('set_data replaces the data', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        adapter.set_data([{ id: 99, name: 'Zara' }]);
        const result = await adapter.query();
        assert.strictEqual(result.total_count, 1);
        assert.strictEqual(result.rows[0].name, 'Zara');
    });
});

// ── Query_Resource tests ───────────────────────────────────────
describe('Query_Resource', function () {
    it('requires an adapter with query method', function () {
        assert.throws(() => {
            new Query_Resource({ name: 'test' });
        }, /adapter with a query/);
    });

    it('normalizes params and delegates to adapter', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const resource = new Query_Resource({
            name: 'test',
            adapter,
            schema: { default_page_size: 5 }
        });

        const result = await resource.query({ page: '2' });
        assert.strictEqual(result.page, 2);
        assert.strictEqual(result.page_size, 5);
        assert(Array.isArray(result.rows));
        assert(Number.isFinite(result.total_count));
    });

    it('clamps page_size to MAX_PAGE_SIZE', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const resource = new Query_Resource({ name: 'test', adapter });

        const result = await resource.query({ page_size: 99999 });
        assert.strictEqual(result.page_size, Query_Resource.MAX_PAGE_SIZE);
    });

    it('defaults invalid page to 1', async function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const resource = new Query_Resource({ name: 'test', adapter });

        const result = await resource.query({ page: -5 });
        assert.strictEqual(result.page, 1);
    });

    it('start and stop delegate to adapter', async function () {
        let started = false;
        let stopped = false;
        const adapter = {
            start: () => { started = true; return Promise.resolve(); },
            stop: () => { stopped = true; return Promise.resolve(); },
            query: async () => ({ rows: [], total_count: 0 })
        };
        const resource = new Query_Resource({ name: 'test', adapter });

        await new Promise((resolve) => resource.start(resolve));
        assert.strictEqual(started, true);

        await new Promise((resolve) => resource.stop(resolve));
        assert.strictEqual(stopped, true);
    });

    it('start/stop work when adapter has no lifecycle methods', async function () {
        const adapter = {
            query: async () => ({ rows: [], total_count: 0 })
        };
        const resource = new Query_Resource({ name: 'test', adapter });

        await new Promise((resolve) => resource.start(resolve));
        await new Promise((resolve) => resource.stop(resolve));
        // No error thrown
    });
});

// ── Query_Publisher tests ──────────────────────────────────────
describe('Query_Publisher', function () {
    it('requires a query_fn', function () {
        assert.throws(() => {
            new Query_Publisher({ name: 'test' });
        }, /query_fn/);
    });

    it('creates with a query_fn', function () {
        const pub = new Query_Publisher({
            name: 'test',
            query_fn: async () => ({ rows: [], total_count: 0 })
        });
        assert.strictEqual(pub.type, 'query');
        assert.strictEqual(pub.name, 'test');
    });

    it('from_resource creates a publisher from a resource', function () {
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });
        const resource = new Query_Resource({ name: 'items', adapter });
        const pub = Query_Publisher.from_resource(resource);

        assert.strictEqual(pub.name, 'items');
        assert.strictEqual(pub.type, 'query');
    });

    it('from_resource requires a resource with query method', function () {
        assert.throws(() => {
            Query_Publisher.from_resource({});
        }, /query.*method/);
    });
});

// ── Integration: serve-factory data option ─────────────────────
describe('Server.serve with data option', function () {
    this.timeout(20000);

    // Stub out webpage/website publishers to avoid needing real controls.
    const fake_webpage_publisher_path = require.resolve('../publishers/http-webpage-publisher');
    const fake_website_publisher_path = require.resolve('../publishers/http-website-publisher');
    const original_wp_module = require.cache[fake_webpage_publisher_path];
    const original_ws_module = require.cache[fake_website_publisher_path];

    const EventEmitter = require('events');

    class Fake_Publisher extends EventEmitter {
        constructor() {
            super();
            this.type = 'html';
            this.extension = 'html';
            setImmediate(() => this.emit('ready', { _arr: [] }));
        }
        handle_http(req, res) { res.writeHead(200); res.end('ok'); }
        meets_requirements() { return true; }
        start(cb) { if (cb) cb(null, true); return Promise.resolve(true); }
        stop(cb) { if (cb) cb(null, true); return Promise.resolve(true); }
    }

    require.cache[fake_webpage_publisher_path] = { exports: Fake_Publisher };
    require.cache[fake_website_publisher_path] = { exports: Fake_Publisher };

    const Server = require('../server');
    const { get_free_port } = require('../port-utils');

    const started_servers = [];

    after(() => {
        if (original_wp_module) {
            require.cache[fake_webpage_publisher_path] = original_wp_module;
        } else {
            delete require.cache[fake_webpage_publisher_path];
        }
        if (original_ws_module) {
            require.cache[fake_website_publisher_path] = original_ws_module;
        } else {
            delete require.cache[fake_website_publisher_path];
        }
        delete require.cache[require.resolve('../server')];
    });

    afterEach(async () => {
        while (started_servers.length > 0) {
            const s = started_servers.pop();
            await new Promise((resolve) => s.close(() => resolve()));
        }
    });

    const http_post = (port, path, body) => {
        return new Promise((resolve, reject) => {
            const body_str = JSON.stringify(body);
            const options = {
                hostname: '127.0.0.1',
                port,
                path,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body_str)
                }
            };
            const req = http.request(options, (res) => {
                let data = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    resolve({ statusCode: res.statusCode, body: data });
                });
            });
            req.on('error', reject);
            req.write(body_str);
            req.end();
        });
    };

    it('serves a data endpoint with array data', async function () {
        const port = await get_free_port();
        const server = await Server.serve({
            host: '127.0.0.1',
            port,
            data: {
                people: {
                    data: SAMPLE_DATA,
                    schema: {
                        columns: [
                            { key: 'name', label: 'Name' },
                            { key: 'role', label: 'Role' }
                        ]
                    }
                }
            }
        });
        started_servers.push(server);

        const { statusCode, body } = await http_post(port, '/api/data/people', {
            page: 1,
            page_size: 3
        });

        assert.strictEqual(statusCode, 200);
        const parsed = JSON.parse(body);
        assert.strictEqual(parsed.total_count, 10);
        assert.strictEqual(parsed.rows.length, 3);
        assert.strictEqual(parsed.page, 1);
        assert.strictEqual(parsed.page_size, 3);
    });

    it('serves a data endpoint with query_fn', async function () {
        const port = await get_free_port();
        const server = await Server.serve({
            host: '127.0.0.1',
            port,
            data: {
                custom: {
                    query_fn: async (params) => {
                        return {
                            rows: [{ value: 'hello' }],
                            total_count: 1
                        };
                    }
                }
            }
        });
        started_servers.push(server);

        const { statusCode, body } = await http_post(port, '/api/data/custom', {});

        assert.strictEqual(statusCode, 200);
        const parsed = JSON.parse(body);
        assert.strictEqual(parsed.total_count, 1);
        assert.strictEqual(parsed.rows[0].value, 'hello');
    });

    it('serves a data endpoint with adapter', async function () {
        const port = await get_free_port();
        const adapter = new Array_Adapter({ data: SAMPLE_DATA });

        const server = await Server.serve({
            host: '127.0.0.1',
            port,
            data: {
                items: {
                    adapter,
                    schema: {}
                }
            }
        });
        started_servers.push(server);

        const { statusCode, body } = await http_post(port, '/api/data/items', {
            sort: { key: 'score', dir: 'desc' },
            page_size: 2
        });

        assert.strictEqual(statusCode, 200);
        const parsed = JSON.parse(body);
        assert.strictEqual(parsed.rows.length, 2);
        assert.strictEqual(parsed.rows[0].name, 'Grace'); // highest score
    });

    it('filters data via the endpoint', async function () {
        const port = await get_free_port();
        const server = await Server.serve({
            host: '127.0.0.1',
            port,
            data: {
                team: { data: SAMPLE_DATA }
            }
        });
        started_servers.push(server);

        const { statusCode, body } = await http_post(port, '/api/data/team', {
            filters: { role: { op: 'equals', value: 'Engineer' } }
        });

        assert.strictEqual(statusCode, 200);
        const parsed = JSON.parse(body);
        assert.strictEqual(parsed.total_count, 4);
        for (const row of parsed.rows) {
            assert.strictEqual(row.role, 'Engineer');
        }
    });
});
