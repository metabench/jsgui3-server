/**
 * Tests for the OpenAPI / Swagger integration.
 *
 * Covers:
 *   - OpenAPI spec generation from server._api_registry
 *   - Schema conversion (simple schema → OpenAPI schema)
 *   - Swagger HTML generation
 *   - End-to-end route serving (/api/openapi.json, /api/docs)
 */

'use strict';

const assert = require('assert');
const http = require('http');
const net = require('net');
const { describe, it, before, after } = require('node:test');

// ── Unit tests for openapi.js ────────────────────────────────

const { generate_openapi_spec, collect_api_entries, simple_schema_to_openapi } = require('../openapi');
const { generate_swagger_html } = require('../publishers/swagger-ui');

describe('simple_schema_to_openapi', () => {
    it('should convert a flat params map to an OpenAPI schema', () => {
        const schema = simple_schema_to_openapi({
            page: { type: 'integer', description: 'Page number', default: 1 },
            name: { type: 'string', description: 'User name' }
        });

        assert.strictEqual(schema.type, 'object');
        assert.strictEqual(schema.properties.page.type, 'integer');
        assert.strictEqual(schema.properties.page.description, 'Page number');
        assert.strictEqual(schema.properties.page.default, 1);
        assert.strictEqual(schema.properties.name.type, 'string');
    });

    it('should pass through a raw type definition', () => {
        const schema = simple_schema_to_openapi({ type: 'array', items: { type: 'string' } });
        assert.strictEqual(schema.type, 'array');
        assert.deepStrictEqual(schema.items, { type: 'string' });
    });

    it('should handle null / undefined gracefully', () => {
        assert.strictEqual(simple_schema_to_openapi(null), null);
        assert.strictEqual(simple_schema_to_openapi(undefined), null);
    });

    it('should collect required fields', () => {
        const schema = simple_schema_to_openapi({
            id: { type: 'integer', required: true },
            name: { type: 'string' }
        });
        assert.deepStrictEqual(schema.required, ['id']);
    });
});

describe('generate_openapi_spec', () => {
    it('should produce a valid minimal spec from a mock server', () => {
        const mock_server = {
            name: 'Test Server',
            _api_registry: [
                {
                    path: '/api/users',
                    method: 'POST',
                    meta: {
                        summary: 'List users',
                        description: 'Returns all users',
                        tags: ['Users'],
                        params: {
                            page: { type: 'integer', default: 1 }
                        },
                        returns: {
                            rows: { type: 'array', items: { type: 'object' } },
                            total_count: { type: 'integer' }
                        }
                    },
                    schema: {}
                }
            ],
            get_listening_endpoints: () => []
        };

        const spec = generate_openapi_spec(mock_server);

        assert.strictEqual(spec.openapi, '3.0.3');
        assert.strictEqual(spec.info.title, 'Test Server');
        assert.ok(spec.paths['/api/users']);
        assert.ok(spec.paths['/api/users'].post);
        assert.strictEqual(spec.paths['/api/users'].post.summary, 'List users');
        assert.deepStrictEqual(spec.paths['/api/users'].post.tags, ['Users']);

        // Request body should exist for POST
        assert.ok(spec.paths['/api/users'].post.requestBody);
        const req_schema = spec.paths['/api/users'].post.requestBody.content['application/json'].schema;
        assert.strictEqual(req_schema.type, 'object');
        assert.strictEqual(req_schema.properties.page.type, 'integer');

        // Response schema
        const res_schema = spec.paths['/api/users'].post.responses['200'].content['application/json'].schema;
        assert.strictEqual(res_schema.type, 'object');
        assert.ok(res_schema.properties.rows);
        assert.ok(res_schema.properties.total_count);
    });

    it('should produce a valid spec even with zero metadata', () => {
        const mock_server = {
            name: 'Bare Server',
            _api_registry: [
                {
                    path: '/api/ping',
                    method: 'GET',
                    meta: {},
                    schema: {}
                }
            ],
            get_listening_endpoints: () => []
        };

        const spec = generate_openapi_spec(mock_server);
        assert.strictEqual(spec.openapi, '3.0.3');
        assert.ok(spec.paths['/api/ping']);
        assert.ok(spec.paths['/api/ping'].get);
        assert.ok(spec.paths['/api/ping'].get.responses['200']);
    });

    it('should skip swagger own routes', () => {
        const mock_server = {
            name: 'Test',
            _api_registry: [
                { path: '/api/openapi.json', method: 'GET', meta: {} },
                { path: '/api/docs', method: 'GET', meta: {} },
                { path: '/api/hello', method: 'GET', meta: {} }
            ],
            get_listening_endpoints: () => []
        };

        const spec = generate_openapi_spec(mock_server);
        assert.ok(!spec.paths['/api/openapi.json']);
        assert.ok(!spec.paths['/api/docs']);
        assert.ok(spec.paths['/api/hello']);
    });
});

describe('collect_api_entries', () => {
    it('should merge entries from _api_registry and function_publishers', () => {
        const mock_server = {
            _api_registry: [
                { path: '/api/a', method: 'POST', meta: { summary: 'A' } }
            ],
            function_publishers: [
                {
                    name: 'b',
                    api_meta: { summary: 'B' },
                    schema: {}
                }
            ]
        };

        const entries = collect_api_entries(mock_server);
        assert.strictEqual(entries.length, 2);
    });

    it('should not duplicate if same route exists in both sources', () => {
        const mock_server = {
            _api_registry: [
                { path: '/api/a', method: 'POST', meta: { summary: 'A from registry' } }
            ],
            function_publishers: [
                {
                    name: 'a',
                    api_meta: { summary: 'A from publisher', method: 'POST' },
                    schema: {}
                }
            ]
        };

        const entries = collect_api_entries(mock_server);
        // Registry takes precedence
        assert.strictEqual(entries.length, 1);
        assert.strictEqual(entries[0].meta.summary, 'A from registry');
    });
});

describe('generate_swagger_html', () => {
    it('should return valid HTML with swagger-ui CDN links', () => {
        const html = generate_swagger_html({ title: 'My API' });
        assert.ok(html.includes('<!doctype html>'));
        assert.ok(html.includes('swagger-ui-bundle.js'));
        assert.ok(html.includes('swagger-ui.css'));
        assert.ok(html.includes('/api/openapi.json'));
        assert.ok(html.includes('My API'));
    });

    it('should use custom spec_url', () => {
        const html = generate_swagger_html({ spec_url: '/custom/spec.json' });
        assert.ok(html.includes('/custom/spec.json'));
    });
});

// ── Integration test: actual HTTP server ─────────────────────

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

describe('Swagger routes integration (Server.serve)', function () {
    let server_instance;
    let port;

    // Inject fake publishers to avoid jsgui3-html bundling
    const path = require('path');
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
                'test/hello': {
                    handler: (input) => ({ message: 'Hello', input }),
                    method: 'POST',
                    summary: 'Say hello',
                    description: 'Returns a greeting',
                    tags: ['Test'],
                    params: {
                        name: { type: 'string', description: 'Your name' }
                    },
                    returns: {
                        message: { type: 'string' }
                    }
                },
                'test/ping': {
                    handler: () => ({ pong: true }),
                    method: 'GET',
                    summary: 'Ping endpoint'
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

    it('GET /api/openapi.json should return valid OpenAPI spec', async () => {
        const { status, headers, body } = await http_get(port, '/api/openapi.json');
        assert.strictEqual(status, 200);
        assert.ok(headers['content-type'].includes('application/json'));

        const spec = JSON.parse(body);
        assert.strictEqual(spec.openapi, '3.0.3');
        assert.ok(spec.paths['/api/test/hello']);
        assert.ok(spec.paths['/api/test/ping']);
        assert.strictEqual(spec.paths['/api/test/hello'].post.summary, 'Say hello');
        assert.deepStrictEqual(spec.paths['/api/test/hello'].post.tags, ['Test']);
    });

    it('GET /api/docs should return Swagger UI HTML', async () => {
        const { status, headers, body } = await http_get(port, '/api/docs');
        assert.strictEqual(status, 200);
        assert.ok(headers['content-type'].includes('text/html'));
        assert.ok(body.includes('swagger-ui'));
        assert.ok(body.includes('/api/openapi.json'));
    });

    it('spec should not include its own documentation routes', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        assert.ok(!spec.paths['/api/openapi.json']);
        assert.ok(!spec.paths['/api/docs']);
    });
});
