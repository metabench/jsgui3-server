/**
 * Tests for the 4 server.publish() enhancements:
 *
 * 1. Raw handler passthrough (meta.raw: true)
 * 2. URL path parameter support
 * 3. Query string parsing for GET handlers
 * 4. OpenAPI query parameter schema for GET endpoints
 */

'use strict';

const assert = require('assert');
const http = require('http');
const net = require('net');
const { describe, it, before, after } = require('node:test');
const { generate_openapi_spec, collect_api_entries, simple_schema_to_openapi } = require('../openapi');

// ── Helpers ──────────────────────────────────────────────────

const get_free_port = () => new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
        const port = srv.address().port;
        srv.close(() => resolve(port));
    });
    srv.on('error', reject);
});

const http_get = (port, path) => new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
});

const http_request = (port, path, method, body_obj) => new Promise((resolve, reject) => {
    const body_str = body_obj ? JSON.stringify(body_obj) : '';
    const req = http.request({
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: body_obj ? {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body_str)
        } : {}
    }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    if (body_str) req.write(body_str);
    req.end();
});

// ══════════════════════════════════════════════════════════════
// 1. Raw Handler Passthrough — Unit Tests
// ══════════════════════════════════════════════════════════════

describe('Enhancement 1: Raw handler passthrough (meta.raw)', () => {

    describe('openapi spec with raw endpoints', () => {
        const server = {
            _api_registry: [
                {
                    path: '/api/events/stream',
                    method: 'GET',
                    meta: {
                        raw: true,
                        summary: 'Stream events as NDJSON',
                        tags: ['Events'],
                        returns: {
                            event: { type: 'string' },
                            data: { type: 'object' }
                        }
                    },
                    schema: {}
                },
                {
                    path: '/api/data/export',
                    method: 'GET',
                    meta: {
                        raw: true,
                        summary: 'Export data as gzip',
                        tags: ['Data']
                    },
                    schema: {}
                }
            ],
            get_listening_endpoints: () => []
        };

        it('should include raw endpoints in the spec', () => {
            const spec = generate_openapi_spec(server);
            assert.ok(spec.paths['/api/events/stream']);
            assert.ok(spec.paths['/api/events/stream'].get);
            assert.strictEqual(spec.paths['/api/events/stream'].get.summary, 'Stream events as NDJSON');
        });

        it('should include returns schema for raw endpoints', () => {
            const spec = generate_openapi_spec(server);
            const schema = spec.paths['/api/events/stream'].get.responses['200'].content['application/json'].schema;
            assert.ok(schema.properties.event);
            assert.ok(schema.properties.data);
        });

        it('should collect tags from raw endpoints', () => {
            const spec = generate_openapi_spec(server);
            const tag_names = spec.tags.map(t => t.name);
            assert.ok(tag_names.includes('Events'));
            assert.ok(tag_names.includes('Data'));
        });
    });
});

// ══════════════════════════════════════════════════════════════
// 2. URL Path Parameters — Unit Tests
// ══════════════════════════════════════════════════════════════

describe('Enhancement 2: URL path parameters', () => {

    describe('OpenAPI path conversion', () => {
        const server = {
            _api_registry: [
                {
                    path: '/api/item/:id/detail',
                    method: 'GET',
                    meta: {
                        summary: 'Get item detail',
                        params: {
                            id: { type: 'integer', description: 'Item ID' }
                        }
                    }
                },
                {
                    path: '/api/domain/:domain/status',
                    method: 'GET',
                    meta: {
                        summary: 'Get domain status',
                        params: {
                            domain: { type: 'string', description: 'Domain name' }
                        }
                    }
                },
                {
                    path: '/api/user/:userId/post/:postId',
                    method: 'GET',
                    meta: {
                        summary: 'Get user post',
                        tags: ['Posts']
                    }
                }
            ],
            get_listening_endpoints: () => []
        };

        it('should convert :param to {param} in OpenAPI paths', () => {
            const spec = generate_openapi_spec(server);
            assert.ok(spec.paths['/api/item/{id}/detail']);
            assert.ok(spec.paths['/api/domain/{domain}/status']);
            assert.ok(spec.paths['/api/user/{userId}/post/{postId}']);
            // Should NOT have the :param versions
            assert.strictEqual(spec.paths['/api/item/:id/detail'], undefined);
        });

        it('should emit path parameters with in: "path"', () => {
            const spec = generate_openapi_spec(server);
            const params = spec.paths['/api/item/{id}/detail'].get.parameters;
            assert.ok(params);
            const id_param = params.find(p => p.name === 'id');
            assert.ok(id_param);
            assert.strictEqual(id_param.in, 'path');
            assert.strictEqual(id_param.required, true);
        });

        it('should use description from meta.params for path parameters', () => {
            const spec = generate_openapi_spec(server);
            const params = spec.paths['/api/item/{id}/detail'].get.parameters;
            const id_param = params.find(p => p.name === 'id');
            assert.strictEqual(id_param.description, 'Item ID');
        });

        it('should handle multiple path parameters', () => {
            const spec = generate_openapi_spec(server);
            const params = spec.paths['/api/user/{userId}/post/{postId}'].get.parameters;
            assert.ok(params);
            assert.ok(params.find(p => p.name === 'userId'));
            assert.ok(params.find(p => p.name === 'postId'));
            assert.ok(params.every(p => p.in === 'path'));
        });

        it('should separate path params from query params', () => {
            const spec = generate_openapi_spec(server);
            const params = spec.paths['/api/item/{id}/detail'].get.parameters;
            const path_p = params.filter(p => p.in === 'path');
            const query_p = params.filter(p => p.in === 'query');
            // 'id' is in the path, so it should be a path param not a query param
            assert.strictEqual(path_p.length, 1);
            assert.strictEqual(path_p[0].name, 'id');
            assert.strictEqual(query_p.length, 0);
        });
    });

    describe('Path + query params combined', () => {
        it('should emit both path and query params for GET with mixed params', () => {
            const server = {
                _api_registry: [{
                    path: '/api/users/:userId/posts',
                    method: 'GET',
                    meta: {
                        summary: 'Get user posts',
                        params: {
                            userId: { type: 'integer', description: 'User ID' },
                            page: { type: 'integer', default: 1, description: 'Page number' },
                            limit: { type: 'integer', default: 10 }
                        }
                    }
                }],
                get_listening_endpoints: () => []
            };
            const spec = generate_openapi_spec(server);
            const params = spec.paths['/api/users/{userId}/posts'].get.parameters;
            assert.ok(params);
            const path_p = params.filter(p => p.in === 'path');
            const query_p = params.filter(p => p.in === 'query');
            assert.strictEqual(path_p.length, 1);
            assert.strictEqual(path_p[0].name, 'userId');
            assert.strictEqual(query_p.length, 2);
            assert.ok(query_p.find(p => p.name === 'page'));
            assert.ok(query_p.find(p => p.name === 'limit'));
        });
    });

    describe('POST with path params still uses requestBody', () => {
        it('should emit requestBody for POST and path params in parameters', () => {
            const server = {
                _api_registry: [{
                    path: '/api/items/:id/update',
                    method: 'POST',
                    meta: {
                        summary: 'Update item',
                        params: {
                            id: { type: 'integer', description: 'Item ID' },
                            name: { type: 'string', required: true },
                            value: { type: 'number' }
                        }
                    }
                }],
                get_listening_endpoints: () => []
            };
            const spec = generate_openapi_spec(server);
            const op = spec.paths['/api/items/{id}/update'].post;
            assert.ok(op.requestBody, 'POST should have requestBody');
            assert.ok(op.parameters, 'POST with :id should have parameters');
            const path_p = op.parameters.filter(p => p.in === 'path');
            assert.strictEqual(path_p.length, 1);
            assert.strictEqual(path_p[0].name, 'id');
        });
    });
});

// ══════════════════════════════════════════════════════════════
// 3. Query String Parsing — Unit Tests
// ══════════════════════════════════════════════════════════════

describe('Enhancement 3: Query string parsing', () => {
    // These tests need a real server to verify HTTP behaviour.
    // Unit-level spec tests are covered in #4. Integration tests below.
});

// ══════════════════════════════════════════════════════════════
// 4. OpenAPI Query Parameter Schema — Unit Tests
// ══════════════════════════════════════════════════════════════

describe('Enhancement 4: OpenAPI query parameter schema', () => {

    it('should emit GET params as query parameters, not requestBody', () => {
        const server = {
            _api_registry: [{
                path: '/api/search',
                method: 'GET',
                meta: {
                    summary: 'Search',
                    params: {
                        q: { type: 'string', required: true, description: 'Search query' },
                        limit: { type: 'integer', default: 10 }
                    }
                }
            }],
            get_listening_endpoints: () => []
        };
        const spec = generate_openapi_spec(server);
        const op = spec.paths['/api/search'].get;
        assert.strictEqual(op.requestBody, undefined, 'GET should NOT have requestBody');
        assert.ok(op.parameters, 'GET should have parameters');
        const q_param = op.parameters.find(p => p.name === 'q');
        assert.ok(q_param);
        assert.strictEqual(q_param.in, 'query');
        assert.strictEqual(q_param.required, true);
        assert.strictEqual(q_param.description, 'Search query');
        assert.strictEqual(q_param.schema.type, 'string');

        const limit_param = op.parameters.find(p => p.name === 'limit');
        assert.ok(limit_param);
        assert.strictEqual(limit_param.in, 'query');
        assert.strictEqual(limit_param.required, false);
        assert.strictEqual(limit_param.schema.default, 10);
    });

    it('should include enum in query parameter schema', () => {
        const server = {
            _api_registry: [{
                path: '/api/list',
                method: 'GET',
                meta: {
                    params: {
                        sort: { type: 'string', enum: ['name', 'date', 'price'] }
                    }
                }
            }],
            get_listening_endpoints: () => []
        };
        const spec = generate_openapi_spec(server);
        const sort_param = spec.paths['/api/list'].get.parameters.find(p => p.name === 'sort');
        assert.deepStrictEqual(sort_param.schema.enum, ['name', 'date', 'price']);
    });

    it('should still emit POST params as requestBody (no regression)', () => {
        const server = {
            _api_registry: [{
                path: '/api/create',
                method: 'POST',
                meta: {
                    params: {
                        name: { type: 'string', required: true },
                        value: { type: 'number' }
                    }
                }
            }],
            get_listening_endpoints: () => []
        };
        const spec = generate_openapi_spec(server);
        const op = spec.paths['/api/create'].post;
        assert.ok(op.requestBody, 'POST should have requestBody');
        assert.strictEqual(op.parameters, undefined, 'POST without path params should NOT have parameters');
    });

    it('DELETE with params should emit as query parameters', () => {
        const server = {
            _api_registry: [{
                path: '/api/cleanup',
                method: 'DELETE',
                meta: {
                    params: {
                        older_than: { type: 'string', description: 'ISO date' }
                    }
                }
            }],
            get_listening_endpoints: () => []
        };
        const spec = generate_openapi_spec(server);
        const op = spec.paths['/api/cleanup'].delete;
        assert.strictEqual(op.requestBody, undefined, 'DELETE should NOT have requestBody');
        assert.ok(op.parameters);
        assert.strictEqual(op.parameters[0].in, 'query');
    });
});


// ══════════════════════════════════════════════════════════════
// Integration Tests (Real HTTP Server)
// ══════════════════════════════════════════════════════════════

describe('Integration: All 4 enhancements with real HTTP server', function () {
    let server_instance;
    let port;

    // FakePublisher to avoid jsgui3-html heavy loading
    const fake_webpage_publisher_path = require.resolve('../publishers/http-webpage-publisher');
    const fake_website_publisher_path = require.resolve('../publishers/http-webpageorsite-publisher');
    const original_webpage = require.cache[fake_webpage_publisher_path];
    const original_website = require.cache[fake_website_publisher_path];
    const { Evented_Class } = require('lang-tools');

    class FakePublisher extends Evented_Class {
        constructor() {
            super();
            const self = this;
            setImmediate(() => self.raise('ready', { _arr: [] }));
        }
        handle_http(req, res) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><body>fake</body></html>');
        }
        meets_requirements() { return true; }
        start(cb) { cb && cb(null); }
        stop(cb) { cb && cb(null); }
    }

    require.cache[fake_webpage_publisher_path] = { exports: FakePublisher };
    require.cache[fake_website_publisher_path] = { exports: FakePublisher };

    const Server = require('../server');

    before(async () => {
        port = await get_free_port();
        server_instance = await Server.serve({
            host: '127.0.0.1',
            port,
            swagger: true,
            website: false,
            api: {
                // ── Enhancement 1: Raw handler ──
                'events/stream': {
                    handler: (req, res) => {
                        res.writeHead(200, { 'Content-Type': 'application/x-ndjson' });
                        res.write(JSON.stringify({ event: 'start', ts: Date.now() }) + '\n');
                        res.write(JSON.stringify({ event: 'data', value: 42 }) + '\n');
                        res.write(JSON.stringify({ event: 'end' }) + '\n');
                        res.end();
                    },
                    method: 'GET',
                    raw: true,
                    summary: 'Stream events as NDJSON',
                    tags: ['Events'],
                    returns: {
                        event: { type: 'string' },
                        ts: { type: 'integer' }
                    }
                },

                // ── Enhancement 2: Path parameters ──
                'item/:id/detail': {
                    handler: (input) => ({
                        id: input.id,
                        name: `Item ${input.id}`,
                        found: true
                    }),
                    method: 'GET',
                    summary: 'Get item detail by ID',
                    tags: ['Items'],
                    params: {
                        id: { type: 'string', description: 'Item ID' }
                    },
                    returns: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        found: { type: 'boolean' }
                    }
                },

                // ── Enhancement 3: Query string parsing ──
                'search': {
                    handler: (input) => ({
                        query: input && input.q,
                        limit: input && input.limit,
                        results: []
                    }),
                    method: 'GET',
                    summary: 'Search items',
                    tags: ['Search'],
                    params: {
                        q: { type: 'string', required: true, description: 'Search query' },
                        limit: { type: 'integer', default: 10, description: 'Max results' }
                    },
                    returns: {
                        query: { type: 'string' },
                        limit: { type: 'string' },
                        results: { type: 'array', items: { type: 'object' } }
                    }
                },

                // ── Enhancement 4: POST still uses requestBody ──
                'items/create': {
                    handler: (input) => ({
                        id: 99,
                        name: input && input.name
                    }),
                    method: 'POST',
                    summary: 'Create item',
                    tags: ['Items'],
                    params: {
                        name: { type: 'string', required: true },
                        category: { type: 'string' }
                    },
                    returns: {
                        id: { type: 'integer' },
                        name: { type: 'string' }
                    }
                },

                // ── Combined: Path param + query string ──
                'users/:userId/posts': {
                    handler: (input) => ({
                        userId: input && input.userId,
                        page: input && input.page,
                        posts: []
                    }),
                    method: 'GET',
                    summary: 'Get user posts',
                    tags: ['Users'],
                    params: {
                        userId: { type: 'string', description: 'User ID' },
                        page: { type: 'integer', default: 1 }
                    },
                    returns: {
                        userId: { type: 'string' },
                        page: { type: 'string' },
                        posts: { type: 'array', items: { type: 'object' } }
                    }
                }
            }
        });
    });

    after(async () => {
        if (original_webpage) require.cache[fake_webpage_publisher_path] = original_webpage;
        if (original_website) require.cache[fake_website_publisher_path] = original_website;
        if (server_instance && typeof server_instance.close === 'function') {
            await new Promise(r => server_instance.close(r));
        }
    });

    // ── Enhancement 1: Raw handler tests ──

    it('raw handler streams NDJSON', async () => {
        const { status, headers, body } = await http_get(port, '/api/events/stream');
        assert.strictEqual(status, 200);
        assert.ok(headers['content-type'].includes('application/x-ndjson'));
        const lines = body.trim().split('\n');
        assert.strictEqual(lines.length, 3);
        const first = JSON.parse(lines[0]);
        assert.strictEqual(first.event, 'start');
        const last = JSON.parse(lines[2]);
        assert.strictEqual(last.event, 'end');
    });

    it('raw handler appears in OpenAPI spec', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        assert.ok(spec.paths['/api/events/stream']);
        assert.ok(spec.paths['/api/events/stream'].get);
        assert.strictEqual(spec.paths['/api/events/stream'].get.summary, 'Stream events as NDJSON');
    });

    it('raw handler enforces method (POST → 405)', async () => {
        const { status } = await http_request(port, '/api/events/stream', 'POST');
        assert.strictEqual(status, 405);
    });

    // ── Enhancement 2: Path parameter tests ──

    it('path param handler receives params in input', async () => {
        const { status, body } = await http_get(port, '/api/item/42/detail');
        assert.strictEqual(status, 200);
        const data = JSON.parse(body);
        assert.strictEqual(data.id, '42');
        assert.strictEqual(data.name, 'Item 42');
        assert.strictEqual(data.found, true);
    });

    it('path param appears as {id} in OpenAPI spec', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        assert.ok(spec.paths['/api/item/{id}/detail']);
        assert.strictEqual(spec.paths['/api/item/:id/detail'], undefined);
        const params = spec.paths['/api/item/{id}/detail'].get.parameters;
        assert.ok(params);
        const id_param = params.find(p => p.name === 'id');
        assert.ok(id_param);
        assert.strictEqual(id_param.in, 'path');
        assert.strictEqual(id_param.required, true);
    });

    it('path param with different values returns correct data', async () => {
        const { body: body1 } = await http_get(port, '/api/item/100/detail');
        const { body: body2 } = await http_get(port, '/api/item/abc/detail');
        assert.strictEqual(JSON.parse(body1).id, '100');
        assert.strictEqual(JSON.parse(body2).id, 'abc');
    });

    // ── Enhancement 3: Query string tests ──

    it('GET with query string passes params to handler', async () => {
        const { status, body } = await http_get(port, '/api/search?q=test&limit=10');
        assert.strictEqual(status, 200);
        const data = JSON.parse(body);
        assert.strictEqual(data.query, 'test');
        assert.strictEqual(data.limit, '10');
    });

    it('GET without query string still works', async () => {
        const { status } = await http_get(port, '/api/search');
        assert.strictEqual(status, 200);
    });

    it('combined path param + query string', async () => {
        const { status, body } = await http_get(port, '/api/users/42/posts?page=3');
        assert.strictEqual(status, 200);
        const data = JSON.parse(body);
        assert.strictEqual(data.userId, '42');
        assert.strictEqual(data.page, '3');
    });

    it('POST body still works (regression check)', async () => {
        const { status, body } = await http_request(port, '/api/items/create', 'POST', { name: 'Widget' });
        assert.strictEqual(status, 200);
        const data = JSON.parse(body);
        assert.strictEqual(data.id, 99);
        assert.strictEqual(data.name, 'Widget');
    });

    it('POST with query string merges (body wins)', async () => {
        const { status, body } = await http_request(port, '/api/items/create?name=FromQuery&extra=yes', 'POST', { name: 'FromBody' });
        assert.strictEqual(status, 200);
        const data = JSON.parse(body);
        assert.strictEqual(data.name, 'FromBody'); // body wins over query
    });

    // ── Enhancement 4: OpenAPI query params ──

    it('GET endpoint shows params as query parameters in spec', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        const op = spec.paths['/api/search'].get;
        assert.strictEqual(op.requestBody, undefined, 'GET should NOT have requestBody');
        assert.ok(op.parameters, 'GET should have parameters');
        const q_param = op.parameters.find(p => p.name === 'q');
        assert.ok(q_param);
        assert.strictEqual(q_param.in, 'query');
        assert.strictEqual(q_param.required, true);
    });

    it('POST endpoint still shows params as requestBody in spec', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        const op = spec.paths['/api/items/create'].post;
        assert.ok(op.requestBody, 'POST should have requestBody');
    });

    it('combined path + query shows both parameter types', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        const op = spec.paths['/api/users/{userId}/posts'].get;
        assert.ok(op.parameters);
        const path_p = op.parameters.filter(p => p.in === 'path');
        const query_p = op.parameters.filter(p => p.in === 'query');
        assert.strictEqual(path_p.length, 1);
        assert.strictEqual(path_p[0].name, 'userId');
        assert.ok(query_p.length >= 1);
        assert.ok(query_p.find(p => p.name === 'page'));
    });

    it('spec has default values in query param schema', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        const params = spec.paths['/api/search'].get.parameters;
        const limit_param = params.find(p => p.name === 'limit');
        assert.strictEqual(limit_param.schema.default, 10);
    });

    // ── No regressions ──

    it('all swagger routes still work', async () => {
        const { status: spec_status } = await http_get(port, '/api/openapi.json');
        const { status: docs_status } = await http_get(port, '/api/docs');
        assert.strictEqual(spec_status, 200);
        assert.strictEqual(docs_status, 200);
    });
});
