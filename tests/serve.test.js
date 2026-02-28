const http = require('http');
const net = require('net');
const assert = require('assert');
const path = require('path');
const EventEmitter = require('events');

const dummy_client_path = require.resolve('./dummy-client.js');

const fake_webpage_publisher_path = require.resolve('../publishers/http-webpage-publisher');
const fake_website_publisher_path = require.resolve('../publishers/http-website-publisher');
const original_webpage_publisher_module = require.cache[fake_webpage_publisher_path];
const original_website_publisher_module = require.cache[fake_website_publisher_path];

class Fake_Publisher_Base extends EventEmitter {
    constructor(html_route, html_body) {
        super();
        this.html_route = html_route;
        this.html_body = html_body;
        const buffer = Buffer.from(this.html_body, 'utf8');
        const headers_identity = {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': Buffer.byteLength(this.html_body, 'utf8')
        };
        this.route = this.html_route;
        this.response_headers = {
            identity: headers_identity,
            gzip: {
                'Content-Type': headers_identity['Content-Type'],
                'Content-Length': 0,
                'Content-Encoding': 'gzip'
            },
            br: {
                'Content-Type': headers_identity['Content-Type'],
                'Content-Length': 0,
                'Content-Encoding': 'br'
            }
        };
        this.response_buffers = {
            identity: buffer,
            gzip: Buffer.alloc(0),
            br: Buffer.alloc(0)
        };
        this.type = 'html';
        this.extension = 'html';
        const ready_delay_ms = Number(this.constructor.ready_delay_ms) || 0;
        const emit_ready = () => {
            this.emit('ready', {
                _arr: [{
                    type: this.type,
                    extension: this.extension,
                    route: this.route,
                    response_headers: this.response_headers,
                    response_buffers: this.response_buffers
                }]
            });
        };

        if (ready_delay_ms > 0) {
            setTimeout(emit_ready, ready_delay_ms);
        } else {
            setImmediate(emit_ready);
        }
    }

    handle_http(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': Buffer.byteLength(this.html_body, 'utf8')
        });
        res.end(this.html_body);
    }

    meets_requirements() {
        return true;
    }

    start(callback) {
        if (typeof callback === 'function') callback(null, true);
        return Promise.resolve(true);
    }

    stop(callback) {
        if (typeof callback === 'function') callback(null, true);
        return Promise.resolve(true);
    }
}

class Fake_Webpage_Publisher extends Fake_Publisher_Base {
    constructor(opts = {}) {
        const webpage = opts.webpage || {};
        const route = (webpage.path && webpage.path.length) ? webpage.path : '/';
        const title = webpage.title || webpage.name || 'Test Page';
        const body = `<html><head><title>${title}</title></head><body><div class="dummy-control">${route}</div></body></html>`;
        super(route, body);
    }
}

class Fake_Website_Publisher extends Fake_Publisher_Base {
    constructor(opts = {}) {
        const route = '/*';
        const title = (opts.website && opts.website.name) || 'Test Website';
        const body = `<html><head><title>${title}</title></head><body><div class="dummy-control">website</div></body></html>`;
        super(route, body);
    }
}

Fake_Webpage_Publisher.ready_delay_ms = 0;
Fake_Website_Publisher.ready_delay_ms = 0;

require.cache[fake_webpage_publisher_path] = { exports: Fake_Webpage_Publisher };
require.cache[fake_website_publisher_path] = { exports: Fake_Website_Publisher };

const Server = require('../server');
const jsgui = require('jsgui3-html');

class Dummy_Control extends jsgui.Control {
    constructor(spec) {
        super(spec);
        this.add_class('dummy-control');
    }
}

const get_free_port = () => new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.listen(0, '127.0.0.1', () => {
        const { port } = probe.address();
        probe.close(err => err ? reject(err) : resolve(port));
    });
    probe.on('error', reject);
});

const get_http_response = (port, route_path = '/') => new Promise((resolve, reject) => {
    const req = http.get({
        hostname: '127.0.0.1',
        port,
        path: route_path,
        headers: {
            'Accept-Encoding': 'identity'
        }
    }, res => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ res, body }));
    });
    req.on('error', reject);
});

describe('Server.serve', function () {
    this.timeout(10000);
    let server_instance;

    after(() => {
        if (original_webpage_publisher_module) {
            require.cache[fake_webpage_publisher_path] = original_webpage_publisher_module;
        } else {
            delete require.cache[fake_webpage_publisher_path];
        }

        if (original_website_publisher_module) {
            require.cache[fake_website_publisher_path] = original_website_publisher_module;
        } else {
            delete require.cache[fake_website_publisher_path];
        }

        delete require.cache[require.resolve('../server')];
    });

    afterEach(async () => {
        Fake_Webpage_Publisher.ready_delay_ms = 0;
        Fake_Website_Publisher.ready_delay_ms = 0;

        if (server_instance) {
            await new Promise(resolve => server_instance.close(resolve));
            server_instance = null;
        }
    });

    it('helper methods are safe before start and after close', async () => {
        const manual_server = new Server({ website: false });

        assert.deepStrictEqual(manual_server.get_listening_endpoints(), []);
        assert.strictEqual(manual_server.get_primary_endpoint(), null);
        assert.deepStrictEqual(
            manual_server.print_endpoints({ logger: () => { } }),
            []
        );
        assert.strictEqual(manual_server.get_startup_diagnostics(), null);

        const port = await get_free_port();
        await new Promise((resolve, reject) => {
            manual_server.on('ready', () => {
                manual_server.start(port, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            manual_server.raise('ready');
        });

        const startup_diagnostics = manual_server.get_startup_diagnostics();
        assert(startup_diagnostics);
        assert.strictEqual(startup_diagnostics.requested_port, port);

        await new Promise((resolve) => manual_server.close(resolve));

        assert.deepStrictEqual(manual_server.get_listening_endpoints(), []);
        assert.strictEqual(manual_server.get_primary_endpoint(), null);
        assert.strictEqual(manual_server.get_startup_diagnostics(), null);
    });

    it('should serve a simple control', async () => {
        const port = await get_free_port();
        server_instance = await Server.serve({
            Ctrl: Dummy_Control,
            src_path_client_js: dummy_client_path,
            host: '127.0.0.1',
            port
        });
        const endpoints = server_instance.get_listening_endpoints();
        assert(Array.isArray(endpoints));
        assert(endpoints.length >= 1);
        assert.strictEqual(endpoints[0].port, port);
        assert.strictEqual(endpoints[0].protocol, 'http');
        assert.strictEqual(server_instance.get_primary_endpoint(), endpoints[0].url);

        const printed_lines = [];
        const returned_lines = server_instance.print_endpoints({
            logger: (line) => printed_lines.push(line),
            include_index: true
        });
        assert(Array.isArray(returned_lines));
        assert(returned_lines.length >= 1);
        assert.strictEqual(printed_lines[0], returned_lines[0]);
        assert(printed_lines[0].includes(endpoints[0].url));

        const { res, body } = await get_http_response(port);
        assert.strictEqual(res.statusCode, 200);
        assert(body.includes('<div class="dummy-control"'));
    });

    it('should serve on a provided port', async () => {
        const port = await get_free_port();
        server_instance = await Server.serve({
            Ctrl: Dummy_Control,
            src_path_client_js: dummy_client_path,
            host: '127.0.0.1',
            port
        });
        const { res } = await get_http_response(port);
        assert.strictEqual(res.statusCode, 200);
    });

    it('should honour pages configuration', async () => {
        const port = await get_free_port();
        server_instance = await Server.serve({
            pages: {
                '/': {
                    content: Dummy_Control,
                    title: 'Home Page'
                },
                '/about': {
                    content: Dummy_Control,
                    title: 'About Page'
                }
            },
            src_path_client_js: dummy_client_path,
            host: '127.0.0.1',
            port
        });
        const home = await get_http_response(port, '/');
        assert(home.body.includes('dummy-control">/</div>'));
        const about = await get_http_response(port, '/about');
        assert(about.body.includes('dummy-control">/about</div>'));
    });

    it('should publish provided api handlers', async () => {
        const port = await get_free_port();
        server_instance = await Server.serve({
            ctrl: Dummy_Control,
            src_path_client_js: dummy_client_path,
            host: '127.0.0.1',
            api: {
                'status': () => 'ok'
            },
            port
        });
        const { res: api_res, body } = await get_http_response(port, '/api/status');
        assert.strictEqual(api_res.statusCode, 200);
        assert.strictEqual(body, 'ok');
    });

    it('should return 404 for unknown routes', async () => {
        const port = await get_free_port();
        server_instance = await Server.serve({
            Ctrl: Dummy_Control,
            src_path_client_js: dummy_client_path,
            host: '127.0.0.1',
            port
        });
        const { res, body } = await get_http_response(port, '/missing');
        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(body, 'Not Found');
    });

    it('falls back to auto-loopback port on conflict when configured', async () => {
        const blocked_port = await get_free_port();
        const blocker = net.createServer();

        await new Promise((resolve, reject) => {
            blocker.listen(blocked_port, '127.0.0.1', resolve);
            blocker.on('error', reject);
        });

        try {
            server_instance = await Server.serve({
                Ctrl: Dummy_Control,
                src_path_client_js: dummy_client_path,
                host: '127.0.0.1',
                port: blocked_port,
                on_port_conflict: 'auto-loopback'
            });

            assert.notStrictEqual(
                server_instance.port,
                blocked_port,
                'Expected fallback to choose a different free port'
            );

            const { res, body } = await get_http_response(server_instance.port, '/');
            assert.strictEqual(res.statusCode, 200);
            assert(body.includes('<div class="dummy-control"'));

            assert(server_instance.startup_diagnostics);
            assert.strictEqual(server_instance.startup_diagnostics.requested_port, blocked_port);
            assert.strictEqual(server_instance.startup_diagnostics.fallback_host, '127.0.0.1');
            assert(server_instance.startup_diagnostics.fallback_port > 0);
            const diagnostics = server_instance.get_startup_diagnostics();
            assert(diagnostics);
            assert.strictEqual(diagnostics.fallback_host, '127.0.0.1');
            assert.strictEqual(
                server_instance.get_primary_endpoint(),
                `http://127.0.0.1:${server_instance.startup_diagnostics.fallback_port}/`
            );
        } finally {
            await new Promise(resolve => blocker.close(resolve));
        }
    });

    it('waits for webpage publisher readiness before resolving serve()', async () => {
        Fake_Webpage_Publisher.ready_delay_ms = 2600;

        const port = await get_free_port();
        const started_at = Date.now();

        server_instance = await Server.serve({
            Ctrl: Dummy_Control,
            src_path_client_js: dummy_client_path,
            host: '127.0.0.1',
            port,
            readyTimeoutMs: 12000
        });

        const elapsed_ms = Date.now() - started_at;
        assert(
            elapsed_ms >= 2400,
            `Expected serve() to wait for delayed readiness, elapsed=${elapsed_ms}ms`
        );

        const { res, body } = await get_http_response(port, '/');
        assert.strictEqual(res.statusCode, 200);
        assert(body.includes('<div class="dummy-control"'));
    });

    it('serves a webpage-like input object at its declared path without forcing root', async () => {
        const port = await get_free_port();
        const webpage_like = {
            [Symbol.for('jsgui3.webpage')]: true,
            name: 'About Page',
            path: '/about',
            ctrl: Dummy_Control
        };

        server_instance = await Server.serve({
            ...webpage_like,
            src_path_client_js: dummy_client_path,
            host: '127.0.0.1',
            port
        });

        const about_response = await get_http_response(port, '/about');
        assert.strictEqual(about_response.res.statusCode, 200);
        assert(about_response.body.includes('dummy-control">/about</div>'));

        assert(server_instance.website_manifest);
        assert.strictEqual(server_instance.website_manifest.source, 'webpage');
        assert.deepStrictEqual(
            server_instance.publication_summary.page_routes,
            ['/about']
        );
    });

    it('serves website-like inputs with base_path pages and endpoint metadata', async () => {
        const port = await get_free_port();
        const website_like = {
            [Symbol.for('jsgui3.website')]: true,
            name: 'Docs Site',
            base_path: '/docs',
            pages: [
                { path: '/', content: Dummy_Control, title: 'Docs Home' },
                { path: '/guide', content: Dummy_Control, title: 'Guide' }
            ],
            api_endpoints: [
                {
                    name: 'status',
                    method: 'POST',
                    handler: () => 'ok'
                },
                {
                    name: 'health',
                    method: 'GET',
                    path: '/healthz',
                    handler: () => 'up'
                }
            ]
        };

        server_instance = await Server.serve({
            ...website_like,
            src_path_client_js: dummy_client_path,
            host: '127.0.0.1',
            port
        });

        const docs_root_response = await get_http_response(port, '/docs');
        assert.strictEqual(docs_root_response.res.statusCode, 200);
        assert(docs_root_response.body.includes('dummy-control">/docs</div>'));

        const docs_guide_response = await get_http_response(port, '/docs/guide');
        assert.strictEqual(docs_guide_response.res.statusCode, 200);
        assert(docs_guide_response.body.includes('dummy-control">/docs/guide</div>'));

        const api_status_get_response = await get_http_response(port, '/docs/api/status');
        assert.strictEqual(api_status_get_response.res.statusCode, 405);

        const api_status_post_response = await new Promise((resolve) => {
            const req = http.request({
                hostname: '127.0.0.1',
                port,
                path: '/docs/api/status',
                method: 'POST'
            }, res => {
                let body = '';
                res.setEncoding('utf8');
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve({ res, body }));
            });
            req.end();
        });
        assert.strictEqual(api_status_post_response.res.statusCode, 200);
        assert.strictEqual(api_status_post_response.body, 'ok');

        const api_health_response = await get_http_response(port, '/healthz');
        assert.strictEqual(api_health_response.res.statusCode, 200);
        assert.strictEqual(api_health_response.body, 'up');

        assert(server_instance.website_manifest);
        assert.strictEqual(server_instance.website_manifest.base_path, '/docs');
        assert.deepStrictEqual(
            server_instance.publication_summary.page_routes,
            ['/docs', '/docs/guide']
        );
        assert(
            server_instance.publication_summary.warnings.some((warning_message) => warning_message.includes('non-GET methods'))
        );
    });

    it('enforces HTTP methods on API endpoints and returns 405 for mismatched methods', async () => {
        const port = await get_free_port();
        const website_like = {
            [Symbol.for('jsgui3.website')]: true,
            name: 'API Enforcement Site',
            api_endpoints: [
                {
                    name: 'submit_data',
                    method: 'POST',
                    path: '/api/submit',
                    handler: () => 'submitted'
                },
                {
                    name: 'get_data',
                    method: 'GET',
                    path: '/api/data',
                    handler: () => 'data'
                },
                {
                    name: 'any_method',
                    method: 'ANY',
                    path: '/api/any',
                    handler: () => 'any'
                }
            ]
        };

        server_instance = await Server.serve({
            ...website_like,
            src_path_client_js: dummy_client_path,
            host: '127.0.0.1',
            port
        });

        const get_submit_res = await get_http_response(port, '/api/submit');
        assert.strictEqual(get_submit_res.res.statusCode, 405);
        assert.strictEqual(get_submit_res.res.headers['allow'], 'POST');
        assert.strictEqual(get_submit_res.body, 'Method Not Allowed');

        const post_submit_opts = {
            hostname: '127.0.0.1',
            port,
            path: '/api/submit',
            method: 'POST',
            headers: { 'Accept-Encoding': 'identity' }
        };
        const post_submit_res = await new Promise((resolve) => {
            const req = http.request(post_submit_opts, res => {
                let body = '';
                res.setEncoding('utf8');
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve({ res, body }));
            });
            req.end();
        });
        assert.strictEqual(post_submit_res.res.statusCode, 200);
        assert.strictEqual(post_submit_res.body, 'submitted');

        const post_data_opts = {
            hostname: '127.0.0.1',
            port,
            path: '/api/data',
            method: 'POST'
        };
        const post_data_res = await new Promise((resolve) => {
            const req = http.request(post_data_opts, res => resolve({ res }));
            req.end();
        });
        assert.strictEqual(post_data_res.res.statusCode, 405);
        assert.strictEqual(post_data_res.res.headers['allow'], 'GET');

        const get_data_res = await get_http_response(port, '/api/data');
        assert.strictEqual(get_data_res.res.statusCode, 200);

        const get_any_res = await get_http_response(port, '/api/any');
        assert.strictEqual(get_any_res.res.statusCode, 200);

        const post_any_res = await new Promise((resolve) => {
            const req = http.request({ ...post_data_opts, path: '/api/any' }, res => resolve({ res }));
            req.end();
        });
        assert.strictEqual(post_any_res.res.statusCode, 200);
    });

    it('rejects duplicate normalized page routes', async () => {
        const port = await get_free_port();
        await assert.rejects(
            async () => {
                await Server.serve({
                    pages: {
                        '/about': {
                            content: Dummy_Control
                        },
                        '/about/': {
                            content: Dummy_Control
                        }
                    },
                    src_path_client_js: dummy_client_path,
                    host: '127.0.0.1',
                    port
                });
            },
            /duplicate_route: \/about/
        );
    });
});
