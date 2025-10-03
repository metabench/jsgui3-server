const http = require('http');
const net = require('net');
const assert = require('assert');
const path = require('path');
const EventEmitter = require('events');

const dummy_client_path = require.resolve('./dummy-client.js');

const fake_webpage_publisher_path = require.resolve('../publishers/http-webpage-publisher');
const fake_website_publisher_path = require.resolve('../publishers/http-website-publisher');

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
        setImmediate(() => {
            this.emit('ready', {
                _arr: [{
                    type: this.type,
                    extension: this.extension,
                    route: this.route,
                    response_headers: this.response_headers,
                    response_buffers: this.response_buffers
                }]
            });
        });
    }

    handle_http(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Length': Buffer.byteLength(this.html_body, 'utf8')
        });
        res.end(this.html_body);
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

describe('Server.serve', function() {
    this.timeout(10000);
    let server_instance;

    afterEach(async () => {
        if (server_instance) {
            await new Promise(resolve => server_instance.close(resolve));
            server_instance = null;
        }
    });

    it('should serve a simple control', async () => {
        const port = await get_free_port();
        server_instance = await Server.serve({
            Ctrl: Dummy_Control,
            src_path_client_js: dummy_client_path,
            host: '127.0.0.1',
            port
        });
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
});
