/**
 * Comprehensive E2E tests for the Swagger Publisher system.
 *
 * Covers:
 *   - Swagger_Publisher lifecycle (construction, ready event, type, caching)
 *   - handle_http routing (spec, docs, 404, 405, query strings)
 *   - OpenAPI spec richness with realistic example APIs
 *   - Schema edge cases (nested, arrays, enums, required, defaults)
 *   - Tag auto-detection
 *   - Multi-method endpoints
 *   - Publisher registry integration
 *   - Full integration tests with a real HTTP server
 */

'use strict';

const assert = require('assert');
const http = require('http');
const net = require('net');
const { describe, it, before, after } = require('node:test');

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

const http_request = (port, path, method) => new Promise((resolve, reject) => {
    const req = http.request({
        hostname: '127.0.0.1',
        port,
        path,
        method
    }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
});

// ── Utility module imports ───────────────────────────────────

const { generate_openapi_spec, collect_api_entries, simple_schema_to_openapi } = require('../openapi');
const { generate_swagger_html } = require('../publishers/swagger-ui');

// ══════════════════════════════════════════════════════════════
// 1. Swagger_Publisher Unit Tests
// ══════════════════════════════════════════════════════════════

describe('Swagger_Publisher unit', () => {
    const Swagger_Publisher = require('../publishers/swagger-publisher');

    it('should be a constructor extending HTTP_Publisher', () => {
        assert.strictEqual(typeof Swagger_Publisher, 'function');
        const HTTP_Publisher = require('../publishers/http-publisher');
        assert.ok(Swagger_Publisher.prototype instanceof HTTP_Publisher);
    });

    it('should set type to "swagger"', () => {
        const pub = new Swagger_Publisher({
            server: { _api_registry: [], get_listening_endpoints: () => [] }
        });
        assert.strictEqual(pub.type, 'swagger');
    });

    it('should store server reference', () => {
        const fake_server = { _api_registry: [], get_listening_endpoints: () => [] };
        const pub = new Swagger_Publisher({ server: fake_server });
        assert.strictEqual(pub.server, fake_server);
    });

    it('should use default routes when not specified', () => {
        const pub = new Swagger_Publisher({
            server: { _api_registry: [], get_listening_endpoints: () => [] }
        });
        assert.strictEqual(pub.spec_route, '/api/openapi.json');
        assert.strictEqual(pub.docs_route, '/api/docs');
    });

    it('should accept custom routes', () => {
        const pub = new Swagger_Publisher({
            server: { _api_registry: [], get_listening_endpoints: () => [] },
            spec_route: '/v2/spec.json',
            docs_route: '/v2/docs'
        });
        assert.strictEqual(pub.spec_route, '/v2/spec.json');
        assert.strictEqual(pub.docs_route, '/v2/docs');
    });

    it('should cache HTML buffer on construction', () => {
        const pub = new Swagger_Publisher({
            server: { _api_registry: [], get_listening_endpoints: () => [] }
        });
        assert.ok(Buffer.isBuffer(pub._html_buffer));
        assert.ok(pub._html_buffer.length > 100);
        const html = pub._html_buffer.toString('utf8');
        assert.ok(html.includes('swagger-ui'));
    });

    it('should store spec_options from constructor args', () => {
        const pub = new Swagger_Publisher({
            server: { _api_registry: [], get_listening_endpoints: () => [] },
            title: 'My API',
            version: '3.0.0',
            description: 'Custom desc'
        });
        assert.strictEqual(pub.spec_options.title, 'My API');
        assert.strictEqual(pub.spec_options.version, '3.0.0');
        assert.strictEqual(pub.spec_options.description, 'Custom desc');
    });

    it('should emit ready event', (_, done) => {
        const pub = new Swagger_Publisher({
            server: { _api_registry: [], get_listening_endpoints: () => [] }
        });
        pub.on('ready', () => {
            done();
        });
    });
});

// ══════════════════════════════════════════════════════════════
// 2. handle_http Routing Tests
// ══════════════════════════════════════════════════════════════

describe('Swagger_Publisher handle_http', () => {
    const Swagger_Publisher = require('../publishers/swagger-publisher');

    const mock_server = {
        name: 'Test API',
        _api_registry: [
            { path: '/api/hello', method: 'GET', meta: { summary: 'Hello' }, schema: {} }
        ],
        get_listening_endpoints: () => []
    };

    let pub;
    before(() => {
        pub = new Swagger_Publisher({ server: mock_server });
    });

    const mock_response = () => {
        const res = {
            _status: null,
            _headers: {},
            _body: '',
            writeHead(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
            end(body) { res._body = body || ''; }
        };
        return res;
    };

    it('should serve OpenAPI JSON on spec route', () => {
        const res = mock_response();
        pub.handle_http({ method: 'GET', url: '/api/openapi.json' }, res);
        assert.strictEqual(res._status, 200);
        assert.ok(res._headers['Content-Type'].includes('application/json'));
        const spec = JSON.parse(res._body);
        assert.strictEqual(spec.openapi, '3.0.3');
        assert.ok(spec.paths['/api/hello']);
    });

    it('should serve Swagger UI HTML on docs route', () => {
        const res = mock_response();
        pub.handle_http({ method: 'GET', url: '/api/docs' }, res);
        assert.strictEqual(res._status, 200);
        assert.ok(res._headers['Content-Type'].includes('text/html'));
        assert.ok(res._body.toString().includes('swagger-ui'));
    });

    it('should return 404 for unknown routes', () => {
        const res = mock_response();
        pub.handle_http({ method: 'GET', url: '/api/unknown' }, res);
        assert.strictEqual(res._status, 404);
    });

    it('should return 405 for POST on spec route', () => {
        const res = mock_response();
        pub.handle_http({ method: 'POST', url: '/api/openapi.json' }, res);
        assert.strictEqual(res._status, 405);
        assert.strictEqual(res._headers['Allow'], 'GET');
    });

    it('should return 405 for DELETE on docs route', () => {
        const res = mock_response();
        pub.handle_http({ method: 'DELETE', url: '/api/docs' }, res);
        assert.strictEqual(res._status, 405);
    });

    it('should handle HEAD requests (same as GET)', () => {
        const res = mock_response();
        pub.handle_http({ method: 'HEAD', url: '/api/openapi.json' }, res);
        assert.strictEqual(res._status, 200);
    });

    it('should strip query strings for route matching', () => {
        const res = mock_response();
        pub.handle_http({ method: 'GET', url: '/api/openapi.json?t=123' }, res);
        assert.strictEqual(res._status, 200);
        const spec = JSON.parse(res._body);
        assert.strictEqual(spec.openapi, '3.0.3');
    });

    it('should use spec_options for title/version', () => {
        const custom_pub = new Swagger_Publisher({
            server: mock_server,
            title: 'Custom Title',
            version: '5.0.0'
        });
        const res = mock_response();
        custom_pub.handle_http({ method: 'GET', url: '/api/openapi.json' }, res);
        const spec = JSON.parse(res._body);
        assert.strictEqual(spec.info.title, 'Custom Title');
        assert.strictEqual(spec.info.version, '5.0.0');
    });
});

// ══════════════════════════════════════════════════════════════
// 3. Rich Example APIs — Spec Accuracy
// ══════════════════════════════════════════════════════════════

describe('OpenAPI spec with rich example APIs', () => {

    const rich_server = {
        name: 'E-Commerce API',
        _api_registry: [
            // ── Products ──
            {
                path: '/api/products/search',
                method: 'POST',
                meta: {
                    summary: 'Search products',
                    description: 'Full-text search across the product catalog with pagination.',
                    tags: ['Products'],
                    operationId: 'searchProducts',
                    params: {
                        query: { type: 'string', description: 'Search query', required: true },
                        page: { type: 'integer', description: 'Page number', default: 1 },
                        page_size: { type: 'integer', description: 'Results per page', default: 25 },
                        sort: { type: 'string', description: 'Sort field', enum: ['name', 'price', 'date'] },
                        category: { type: 'string', description: 'Filter by category' }
                    },
                    returns: {
                        rows: { type: 'array', items: { type: 'object' } },
                        total_count: { type: 'integer', description: 'Total matching results' },
                        page: { type: 'integer' },
                        has_more: { type: 'boolean' }
                    }
                }
            },
            {
                path: '/api/products/create',
                method: 'POST',
                meta: {
                    summary: 'Create product',
                    tags: ['Products'],
                    params: {
                        name: { type: 'string', required: true, description: 'Product name' },
                        price: { type: 'number', required: true, description: 'Price in USD' },
                        description: { type: 'string', description: 'Product description' },
                        category: { type: 'string', description: 'Category' },
                        in_stock: { type: 'boolean', default: true }
                    },
                    returns: {
                        id: { type: 'integer' },
                        name: { type: 'string' }
                    }
                }
            },
            {
                path: '/api/products',
                method: 'GET',
                meta: {
                    summary: 'List all products',
                    tags: ['Products'],
                    returns: {
                        rows: { type: 'array', items: { type: 'object' } }
                    }
                }
            },
            {
                path: '/api/products/delete',
                method: 'DELETE',
                meta: {
                    summary: 'Delete a product (deprecated)',
                    tags: ['Products'],
                    deprecated: true,
                    params: {
                        id: { type: 'integer', required: true }
                    }
                }
            },
            // ── Users ──
            {
                path: '/api/users/list',
                method: 'POST',
                meta: {
                    summary: 'List users',
                    description: 'Returns paginated user list with role filtering.',
                    tags: ['Users'],
                    params: {
                        role: { type: 'string', enum: ['admin', 'editor', 'viewer'] },
                        active: { type: 'boolean', default: true }
                    },
                    returns: {
                        users: { type: 'array', items: { type: 'object' } },
                        count: { type: 'integer' }
                    }
                }
            },
            {
                path: '/api/users/profile',
                method: 'GET',
                meta: {
                    summary: 'Get user profile',
                    tags: ['Users'],
                    returns: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string' },
                        role: { type: 'string' },
                        created: { type: 'string', description: 'ISO 8601 date' }
                    }
                }
            },
            // ── System ──
            {
                path: '/api/health',
                method: 'GET',
                meta: {
                    summary: 'Health check',
                    tags: ['System'],
                    response_description: 'Server health status',
                    returns: {
                        status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
                        uptime: { type: 'number', description: 'Uptime in seconds' },
                        memory: { type: 'object' }
                    }
                }
            },
            {
                path: '/api/version',
                method: 'GET',
                meta: {
                    summary: 'API version',
                    tags: ['System']
                }
            }
        ],
        get_listening_endpoints: () => [
            { url: 'http://localhost:3000', protocol: 'http', host: 'localhost', port: 3000 }
        ]
    };

    it('should include all 8 endpoints in the spec', () => {
        const spec = generate_openapi_spec(rich_server);
        const paths = Object.keys(spec.paths);
        assert.strictEqual(paths.length, 8);
    });

    it('should use correct HTTP methods for each endpoint', () => {
        const spec = generate_openapi_spec(rich_server);
        assert.ok(spec.paths['/api/products/search'].post);
        assert.ok(spec.paths['/api/products/create'].post);
        assert.ok(spec.paths['/api/products'].get);
        assert.ok(spec.paths['/api/products/delete'].delete);
        assert.ok(spec.paths['/api/users/list'].post);
        assert.ok(spec.paths['/api/users/profile'].get);
        assert.ok(spec.paths['/api/health'].get);
        assert.ok(spec.paths['/api/version'].get);
    });

    it('should preserve summaries and descriptions', () => {
        const spec = generate_openapi_spec(rich_server);
        assert.strictEqual(spec.paths['/api/products/search'].post.summary, 'Search products');
        assert.ok(spec.paths['/api/products/search'].post.description.includes('Full-text'));
        assert.strictEqual(spec.paths['/api/users/list'].post.summary, 'List users');
    });

    it('should set custom operationId', () => {
        const spec = generate_openapi_spec(rich_server);
        assert.strictEqual(spec.paths['/api/products/search'].post.operationId, 'searchProducts');
    });

    it('should mark deprecated endpoints', () => {
        const spec = generate_openapi_spec(rich_server);
        assert.strictEqual(spec.paths['/api/products/delete'].delete.deprecated, true);
        assert.strictEqual(spec.paths['/api/products/search'].post.deprecated, undefined);
    });

    it('should collect all tags alphabetically', () => {
        const spec = generate_openapi_spec(rich_server);
        const tag_names = spec.tags.map(t => t.name);
        assert.deepStrictEqual(tag_names, ['Products', 'System', 'Users']);
    });

    it('should include server URLs', () => {
        const spec = generate_openapi_spec(rich_server);
        assert.strictEqual(spec.servers.length, 1);
        assert.strictEqual(spec.servers[0].url, 'http://localhost:3000');
    });

    it('should use custom response_description', () => {
        const spec = generate_openapi_spec(rich_server);
        assert.strictEqual(
            spec.paths['/api/health'].get.responses['200'].description,
            'Server health status'
        );
    });

    it('should generate requestBody for POST methods with params', () => {
        const spec = generate_openapi_spec(rich_server);
        const search = spec.paths['/api/products/search'].post;
        assert.ok(search.requestBody);
        const schema = search.requestBody.content['application/json'].schema;
        assert.strictEqual(schema.type, 'object');
        assert.ok(schema.properties.query);
        assert.ok(schema.properties.page);
        assert.ok(schema.properties.sort);
    });

    it('should NOT generate requestBody for GET methods without params', () => {
        const spec = generate_openapi_spec(rich_server);
        const version = spec.paths['/api/version'].get;
        assert.strictEqual(version.requestBody, undefined);
    });

    it('should generate response schema from returns metadata', () => {
        const spec = generate_openapi_spec(rich_server);
        const profile = spec.paths['/api/users/profile'].get;
        const schema = profile.responses['200'].content['application/json'].schema;
        assert.strictEqual(schema.type, 'object');
        assert.ok(schema.properties.id);
        assert.ok(schema.properties.name);
        assert.ok(schema.properties.email);
    });

    it('should include 500 error response for all operations', () => {
        const spec = generate_openapi_spec(rich_server);
        for (const [, methods] of Object.entries(spec.paths)) {
            for (const [, op] of Object.entries(methods)) {
                assert.ok(op.responses['500'], 'Missing 500 response');
                assert.ok(op.responses['500'].content['application/json'].schema.properties.error);
            }
        }
    });
});

// ══════════════════════════════════════════════════════════════
// 4. Schema Edge Cases
// ══════════════════════════════════════════════════════════════

describe('Schema edge cases', () => {
    it('should handle enum fields', () => {
        const schema = simple_schema_to_openapi({
            status: { type: 'string', enum: ['active', 'inactive', 'pending'] }
        });
        assert.deepStrictEqual(schema.properties.status.enum, ['active', 'inactive', 'pending']);
    });

    it('should handle required fields from multiple properties', () => {
        const schema = simple_schema_to_openapi({
            name: { type: 'string', required: true },
            email: { type: 'string', required: true },
            bio: { type: 'string' }
        });
        assert.deepStrictEqual(schema.required.sort(), ['email', 'name']);
    });

    it('should handle default values of different types', () => {
        const schema = simple_schema_to_openapi({
            count: { type: 'integer', default: 0 },
            enabled: { type: 'boolean', default: false },
            name: { type: 'string', default: '' }
        });
        assert.strictEqual(schema.properties.count.default, 0);
        assert.strictEqual(schema.properties.enabled.default, false);
        assert.strictEqual(schema.properties.name.default, '');
    });

    it('should handle array type with items', () => {
        const schema = simple_schema_to_openapi({
            tags: { type: 'array', items: { type: 'string' } }
        });
        assert.strictEqual(schema.properties.tags.type, 'array');
        assert.deepStrictEqual(schema.properties.tags.items, { type: 'string' });
    });

    it('should handle nested object type', () => {
        const schema = simple_schema_to_openapi({
            address: {
                type: 'object',
                properties: {
                    street: { type: 'string' },
                    city: { type: 'string' }
                }
            }
        });
        assert.strictEqual(schema.properties.address.type, 'object');
    });

    it('should normalise unknown types to string', () => {
        const schema = simple_schema_to_openapi({
            field: { type: 'datetime' }
        });
        assert.strictEqual(schema.properties.field.type, 'string');
    });

    it('should handle bare values as string type', () => {
        const schema = simple_schema_to_openapi({
            name: 'just a value'
        });
        assert.strictEqual(schema.properties.name.type, 'string');
    });

    it('should handle pass-through for raw OpenAPI array schema', () => {
        const schema = simple_schema_to_openapi({
            type: 'array',
            items: { type: 'object' }
        });
        assert.strictEqual(schema.type, 'array');
        assert.deepStrictEqual(schema.items, { type: 'object' });
    });

    it('should handle empty object schema', () => {
        const schema = simple_schema_to_openapi({});
        assert.strictEqual(schema.type, 'object');
        assert.deepStrictEqual(schema.properties, {});
    });
});

// ══════════════════════════════════════════════════════════════
// 5. Tag Auto-Detection
// ══════════════════════════════════════════════════════════════

describe('Tag auto-detection', () => {
    it('should derive tag from first path segment after /api/', () => {
        const server = {
            _api_registry: [
                { path: '/api/users/list', method: 'GET', meta: {} },
                { path: '/api/products/search', method: 'GET', meta: {} }
            ],
            get_listening_endpoints: () => []
        };
        const spec = generate_openapi_spec(server);
        assert.deepStrictEqual(spec.paths['/api/users/list'].get.tags, ['users']);
        assert.deepStrictEqual(spec.paths['/api/products/search'].get.tags, ['products']);
    });

    it('should use explicit tags over auto-detected ones', () => {
        const server = {
            _api_registry: [
                { path: '/api/users/list', method: 'GET', meta: { tags: ['User Management'] } }
            ],
            get_listening_endpoints: () => []
        };
        const spec = generate_openapi_spec(server);
        assert.deepStrictEqual(spec.paths['/api/users/list'].get.tags, ['User Management']);
    });

    it('should handle root-level paths', () => {
        const server = {
            _api_registry: [
                { path: '/health', method: 'GET', meta: {} }
            ],
            get_listening_endpoints: () => []
        };
        const spec = generate_openapi_spec(server);
        assert.deepStrictEqual(spec.paths['/health'].get.tags, ['health']);
    });
});

// ══════════════════════════════════════════════════════════════
// 6. Multi-Method Endpoints
// ══════════════════════════════════════════════════════════════

describe('Multi-method endpoints', () => {
    it('should support GET and POST on the same path', () => {
        const server = {
            _api_registry: [
                { path: '/api/items', method: 'GET', meta: { summary: 'List items' } },
                { path: '/api/items', method: 'POST', meta: { summary: 'Create item' } }
            ],
            get_listening_endpoints: () => []
        };
        const spec = generate_openapi_spec(server);
        assert.ok(spec.paths['/api/items'].get);
        assert.ok(spec.paths['/api/items'].post);
        assert.strictEqual(spec.paths['/api/items'].get.summary, 'List items');
        assert.strictEqual(spec.paths['/api/items'].post.summary, 'Create item');
    });

    it('should support PUT and DELETE on the same path', () => {
        const server = {
            _api_registry: [
                { path: '/api/items', method: 'PUT', meta: { summary: 'Update item' } },
                { path: '/api/items', method: 'DELETE', meta: { summary: 'Delete item' } }
            ],
            get_listening_endpoints: () => []
        };
        const spec = generate_openapi_spec(server);
        assert.ok(spec.paths['/api/items'].put);
        assert.ok(spec.paths['/api/items'].delete);
    });
});

// ══════════════════════════════════════════════════════════════
// 7. Publisher Registry
// ══════════════════════════════════════════════════════════════

describe('Publisher registry integration', () => {
    it('should be registered as "swagger" in Publishers', () => {
        const Publishers = require('../publishers/Publishers');
        assert.ok(Publishers.swagger);
        assert.strictEqual(typeof Publishers.swagger, 'function');
    });

    it('should create a working instance from the registry', () => {
        const Publishers = require('../publishers/Publishers');
        const pub = new Publishers.swagger({
            server: { _api_registry: [], get_listening_endpoints: () => [] }
        });
        assert.strictEqual(pub.type, 'swagger');
    });
});

// ══════════════════════════════════════════════════════════════
// 8. No-Metadata Fallback
// ══════════════════════════════════════════════════════════════

describe('No-metadata fallback', () => {
    it('should produce valid entries for endpoints with empty meta', () => {
        const server = {
            _api_registry: [
                { path: '/api/bare1', method: 'POST', meta: {}, schema: {} },
                { path: '/api/bare2', method: 'GET', meta: {} }
            ],
            get_listening_endpoints: () => []
        };
        const spec = generate_openapi_spec(server);
        assert.ok(spec.paths['/api/bare1'].post);
        assert.ok(spec.paths['/api/bare2'].get);
        assert.ok(spec.paths['/api/bare1'].post.responses['200']);
        assert.ok(spec.paths['/api/bare2'].get.responses['200']);
    });

    it('should auto-generate operationId from path', () => {
        const server = {
            _api_registry: [
                { path: '/api/users/list', method: 'GET', meta: {} }
            ],
            get_listening_endpoints: () => []
        };
        const spec = generate_openapi_spec(server);
        assert.ok(spec.paths['/api/users/list'].get.operationId);
        assert.ok(typeof spec.paths['/api/users/list'].get.operationId === 'string');
        assert.ok(spec.paths['/api/users/list'].get.operationId.length > 0);
    });
});

// ══════════════════════════════════════════════════════════════
// 9. Swagger HTML Theme Tests
// ══════════════════════════════════════════════════════════════

describe('Swagger HTML generation', () => {
    it('should include dark theme CSS variables', () => {
        const html = generate_swagger_html();
        assert.ok(html.includes('--swagger-bg'));
        assert.ok(html.includes('--swagger-surface'));
        assert.ok(html.includes('--swagger-accent'));
    });

    it('should include default spec URL', () => {
        const html = generate_swagger_html();
        assert.ok(html.includes('/api/openapi.json'));
    });

    it('should include CDN links for swagger-ui', () => {
        const html = generate_swagger_html();
        assert.ok(html.includes('unpkg.com/swagger-ui-dist'));
        assert.ok(html.includes('swagger-ui-bundle.js'));
        assert.ok(html.includes('swagger-ui.css'));
    });

    it('should HTML-escape the title', () => {
        const html = generate_swagger_html({ title: 'Test <script>alert(1)</script>' });
        assert.ok(!html.includes('<script>alert(1)</script>'));
        assert.ok(html.includes('&lt;script&gt;'));
    });

    it('should accept custom spec_url', () => {
        const html = generate_swagger_html({ spec_url: '/v2/api.json' });
        assert.ok(html.includes('/v2/api.json'));
    });

    // ── Theme-specific tests ──

    it('should include all 5 built-in theme data-theme selectors', () => {
        const html = generate_swagger_html();
        assert.ok(html.includes('[data-theme="wlilo"]'));
        assert.ok(html.includes('[data-theme="midnight"]'));
        assert.ok(html.includes('[data-theme="light"]'));
        assert.ok(html.includes('[data-theme="nord"]'));
        assert.ok(html.includes('[data-theme="high-contrast"]'));
    });

    it('should set wlilo as default data-theme on html element', () => {
        const html = generate_swagger_html();
        assert.ok(html.includes('data-theme="wlilo"'));
    });

    it('should set custom default_theme on html element', () => {
        const html = generate_swagger_html({ default_theme: 'light' });
        assert.ok(html.includes('<html lang="en" data-theme="light">'));
    });

    it('should include theme-selector widget JS', () => {
        const html = generate_swagger_html();
        assert.ok(html.includes('theme-selector'));
        assert.ok(html.includes('theme-select'));
        assert.ok(html.includes('swagger-theme')); // localStorage key
    });

    it('should include localStorage persistence code', () => {
        const html = generate_swagger_html();
        assert.ok(html.includes('localStorage'));
        assert.ok(html.includes('STORAGE_KEY'));
    });

    it('should include all theme labels in selector options', () => {
        const html = generate_swagger_html();
        assert.ok(html.includes('WLILO Dark'));
        assert.ok(html.includes('Midnight'));
        assert.ok(html.includes('Light'));
        assert.ok(html.includes('Nord'));
        assert.ok(html.includes('High Contrast'));
    });

    it('should include CSS transitions for smooth theme switching', () => {
        const html = generate_swagger_html();
        assert.ok(html.includes('transition'));
    });

    it('should accept custom themes via options', () => {
        const html = generate_swagger_html({
            themes: {
                ocean: {
                    label: 'Ocean Blue',
                    vars: {
                        '--swagger-bg': '#0a192f',
                        '--swagger-accent': '#64ffda'
                    }
                }
            }
        });
        assert.ok(html.includes('[data-theme="ocean"]'));
        assert.ok(html.includes('#0a192f'));
        assert.ok(html.includes('#64ffda'));
        assert.ok(html.includes('Ocean Blue'));
    });

    it('should include unique colours for each theme', () => {
        const html = generate_swagger_html();
        // WLILO gold accent
        assert.ok(html.includes('#c9a84c'));
        // Midnight blue accent
        assert.ok(html.includes('#4facfe'));
        // Light mode white background
        assert.ok(html.includes('#f8f9fa'));
        // Nord accent
        assert.ok(html.includes('#88c0d0'));
        // High contrast yellow accent
        assert.ok(html.includes('#ffff00'));
    });

    it('should include aria-label on theme select for accessibility', () => {
        const html = generate_swagger_html();
        assert.ok(html.includes('aria-label'));
        assert.ok(html.includes('Select theme'));
    });

    it('should include --swagger-danger and --swagger-success variables', () => {
        const html = generate_swagger_html();
        assert.ok(html.includes('--swagger-danger'));
        assert.ok(html.includes('--swagger-success'));
    });

    it('BUILTIN_THEMES export should contain all 5 themes', () => {
        const { BUILTIN_THEMES } = require('../publishers/swagger-ui');
        const names = Object.keys(BUILTIN_THEMES);
        assert.deepStrictEqual(names.sort(), ['high-contrast', 'light', 'midnight', 'nord', 'wlilo']);
        // Each theme should have a label and vars
        for (const [, theme] of Object.entries(BUILTIN_THEMES)) {
            assert.ok(theme.label);
            assert.ok(theme.vars);
            assert.ok(theme.vars['--swagger-bg']);
            assert.ok(theme.vars['--swagger-accent']);
        }
    });
});

// ══════════════════════════════════════════════════════════════
// 10. Full Integration Test (Real HTTP Server)
// ══════════════════════════════════════════════════════════════

describe('Full integration (real HTTP server)', function () {
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
                'products/search': {
                    handler: (input) => ({
                        rows: [{ id: 1, name: 'Widget' }],
                        total_count: 1,
                        page: input?.page || 1
                    }),
                    method: 'POST',
                    summary: 'Search products',
                    description: 'Full-text product search with pagination.',
                    tags: ['Products'],
                    params: {
                        query: { type: 'string', required: true },
                        page: { type: 'integer', default: 1 },
                        page_size: { type: 'integer', default: 25 }
                    },
                    returns: {
                        rows: { type: 'array', items: { type: 'object' } },
                        total_count: { type: 'integer' },
                        page: { type: 'integer' }
                    }
                },
                'products/create': {
                    handler: (input) => ({ id: 42, name: input?.name }),
                    method: 'POST',
                    summary: 'Create a product',
                    tags: ['Products'],
                    params: {
                        name: { type: 'string', required: true },
                        price: { type: 'number', required: true }
                    },
                    returns: {
                        id: { type: 'integer' },
                        name: { type: 'string' }
                    }
                },
                'users/list': {
                    handler: () => ({ users: [], count: 0 }),
                    method: 'POST',
                    summary: 'List users',
                    tags: ['Users'],
                    params: {
                        role: { type: 'string', enum: ['admin', 'editor', 'viewer'] },
                        active: { type: 'boolean', default: true }
                    },
                    returns: {
                        users: { type: 'array', items: { type: 'object' } },
                        count: { type: 'integer' }
                    }
                },
                'users/profile': {
                    handler: () => ({ id: 1, name: 'Alice', email: 'alice@example.com' }),
                    method: 'GET',
                    summary: 'Get user profile',
                    tags: ['Users'],
                    returns: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string' }
                    }
                },
                'health': {
                    handler: () => ({ status: 'ok', uptime: process.uptime() }),
                    method: 'GET',
                    summary: 'Health check',
                    tags: ['System'],
                    returns: {
                        status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
                        uptime: { type: 'number' }
                    }
                },
                'version': {
                    handler: () => ({ version: '1.0.0' }),
                    method: 'GET',
                    summary: 'API version',
                    tags: ['System']
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

    // ── Spec tests ──

    it('GET /api/openapi.json returns 200 with JSON', async () => {
        const { status, headers } = await http_get(port, '/api/openapi.json');
        assert.strictEqual(status, 200);
        assert.ok(headers['content-type'].includes('application/json'));
    });

    it('spec contains all 6 example API paths', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        assert.ok(spec.paths['/api/products/search']);
        assert.ok(spec.paths['/api/products/create']);
        assert.ok(spec.paths['/api/users/list']);
        assert.ok(spec.paths['/api/users/profile']);
        assert.ok(spec.paths['/api/health']);
        assert.ok(spec.paths['/api/version']);
    });

    it('spec excludes swagger own routes', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        assert.strictEqual(spec.paths['/api/openapi.json'], undefined);
        assert.strictEqual(spec.paths['/api/docs'], undefined);
    });

    it('spec has correct tags', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        const tag_names = spec.tags.map(t => t.name);
        assert.ok(tag_names.includes('Products'));
        assert.ok(tag_names.includes('Users'));
        assert.ok(tag_names.includes('System'));
    });

    it('spec includes requestBody schemas', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        const search = spec.paths['/api/products/search'].post;
        assert.ok(search.requestBody);
        const schema = search.requestBody.content['application/json'].schema;
        assert.strictEqual(schema.properties.query.type, 'string');
        assert.strictEqual(schema.properties.page.type, 'integer');
        assert.strictEqual(schema.properties.page.default, 1);
    });

    it('spec includes required fields', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        const schema = spec.paths['/api/products/search'].post.requestBody.content['application/json'].schema;
        assert.ok(schema.required.includes('query'));
    });

    it('spec includes enum fields', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        const schema = spec.paths['/api/users/list'].post.requestBody.content['application/json'].schema;
        assert.deepStrictEqual(schema.properties.role.enum, ['admin', 'editor', 'viewer']);
    });

    it('spec includes response schemas', async () => {
        const { body } = await http_get(port, '/api/openapi.json');
        const spec = JSON.parse(body);
        const profile = spec.paths['/api/users/profile'].get;
        const schema = profile.responses['200'].content['application/json'].schema;
        assert.strictEqual(schema.properties.id.type, 'integer');
        assert.strictEqual(schema.properties.name.type, 'string');
    });

    // ── Docs tests ──

    it('GET /api/docs returns 200 with HTML', async () => {
        const { status, headers } = await http_get(port, '/api/docs');
        assert.strictEqual(status, 200);
        assert.ok(headers['content-type'].includes('text/html'));
    });

    it('docs HTML includes swagger-ui CDN link', async () => {
        const { body } = await http_get(port, '/api/docs');
        assert.ok(body.includes('swagger-ui-bundle.js'));
        assert.ok(body.includes('swagger-ui.css'));
    });

    it('docs HTML references /api/openapi.json', async () => {
        const { body } = await http_get(port, '/api/docs');
        assert.ok(body.includes('/api/openapi.json'));
    });

    // ── Method enforcement ──

    it('POST /api/openapi.json returns 405', async () => {
        const { status } = await http_request(port, '/api/openapi.json', 'POST');
        assert.strictEqual(status, 405);
    });

    it('DELETE /api/docs returns 405', async () => {
        const { status } = await http_request(port, '/api/docs', 'DELETE');
        assert.strictEqual(status, 405);
    });

    // ── Cache-Control ──

    it('spec has no-cache header', async () => {
        const { headers } = await http_get(port, '/api/openapi.json');
        assert.ok(headers['cache-control'].includes('no-cache'));
    });

    it('docs has no-cache header', async () => {
        const { headers } = await http_get(port, '/api/docs');
        assert.ok(headers['cache-control'].includes('no-cache'));
    });

    // ── Swagger_Publisher on server ──

    it('server._swagger_publisher is a Swagger_Publisher instance', () => {
        assert.ok(server_instance._swagger_publisher);
        assert.strictEqual(server_instance._swagger_publisher.type, 'swagger');
    });

    // ── API endpoints still work ──

    it('actual API endpoints still respond (GET /api/health)', async () => {
        const { status, body } = await http_get(port, '/api/health');
        assert.strictEqual(status, 200);
        const data = JSON.parse(body);
        assert.strictEqual(data.status, 'ok');
    });
});
