const assert = require('assert');
const http = require('http');
const { describe, it, afterEach, after } = require('mocha');
const EventEmitter = require('events');
const { Resource } = require('jsgui3-html');

const fake_webpage_publisher_path = require.resolve('../publishers/http-webpage-publisher');
const fake_website_publisher_path = require.resolve('../publishers/http-website-publisher');
const original_webpage_publisher_module = require.cache[fake_webpage_publisher_path];
const original_website_publisher_module = require.cache[fake_website_publisher_path];

class Fake_Publisher_Base extends EventEmitter {
    constructor(html_route, html_body) {
        super();
        const body_buffer = Buffer.from(html_body, 'utf8');
        this.route = html_route;
        this.response_headers = {
            identity: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Length': body_buffer.length
            }
        };
        this.response_buffers = {
            identity: body_buffer
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
        const body_buffer = this.response_buffers.identity;
        res.writeHead(200, this.response_headers.identity);
        res.end(body_buffer);
    }

    meets_requirements() {
        return true;
    }

    start(callback) {
        if (typeof callback === 'function') {
            callback(null, true);
        }
        return Promise.resolve(true);
    }

    stop(callback) {
        if (typeof callback === 'function') {
            callback(null, true);
        }
        return Promise.resolve(true);
    }
}

class Fake_Webpage_Publisher extends Fake_Publisher_Base {
    constructor(options = {}) {
        const webpage = options.webpage || {};
        const route = webpage.path || '/';
        const title = webpage.title || webpage.name || 'Fake Page';
        const html_body = `<html><head><title>${title}</title></head><body>${route}</body></html>`;
        super(route, html_body);
    }
}

class Fake_Website_Publisher extends Fake_Publisher_Base {
    constructor(options = {}) {
        const title = (options.website && options.website.name) || 'Fake Site';
        const html_body = `<html><head><title>${title}</title></head><body>site</body></html>`;
        super('/*', html_body);
    }
}

require.cache[fake_webpage_publisher_path] = { exports: Fake_Webpage_Publisher };
require.cache[fake_website_publisher_path] = { exports: Fake_Website_Publisher };

const Server = require('../server');
const { get_free_port } = require('../port-utils');

class In_Process_Test_Resource extends Resource {
    constructor(spec = {}) {
        super(spec);
        this.current_state = 'stopped';
        this.start_calls = 0;
        this.stop_calls = 0;
    }

    start(callback) {
        this.start_calls += 1;
        const previous_state = this.current_state;
        this.current_state = 'running';
        this.raise('state_change', {
            from: previous_state,
            to: this.current_state,
            timestamp: Date.now()
        });
        if (typeof callback === 'function') callback(null, true);
        return Promise.resolve(true);
    }

    stop(callback) {
        this.stop_calls += 1;
        const previous_state = this.current_state;
        this.current_state = 'stopped';
        this.raise('state_change', {
            from: previous_state,
            to: this.current_state,
            timestamp: Date.now()
        });
        if (typeof callback === 'function') callback(null, true);
        return Promise.resolve(true);
    }

    get status() {
        return {
            state: this.current_state
        };
    }

    get_abstract() {
        return {
            name: this.name,
            state: this.current_state
        };
    }
}

const get_http_response = (port, path_name) => {
    return new Promise((resolve, reject) => {
        const request = http.get({
            hostname: '127.0.0.1',
            port,
            path: path_name
        }, (response) => {
            let body_text = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => {
                body_text += chunk;
            });
            response.on('end', () => {
                resolve({
                    response,
                    body_text
                });
            });
        });
        request.on('error', reject);
    });
};

describe('Server.serve resources integration', function() {
    this.timeout(20000);

    const started_servers = [];

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
        while (started_servers.length > 0) {
            const server_instance = started_servers.pop();
            await new Promise((resolve) => {
                server_instance.close(() => resolve());
            });
        }
    });

    it('supports in-process resource instances and stops them on server close', async () => {
        const port = await get_free_port();
        const in_process_resource = new In_Process_Test_Resource({
            name: 'in_process_resource'
        });

        const server_instance = await Server.serve({
            host: '127.0.0.1',
            port,
            api: {
                ping: () => 'pong'
            },
            resources: {
                in_process_resource
            }
        });
        started_servers.push(server_instance);

        assert.strictEqual(in_process_resource.start_calls, 1);
        assert.strictEqual(in_process_resource.status.state, 'running');

        const { response, body_text } = await get_http_response(port, '/api/ping');
        assert.strictEqual(response.statusCode, 200);
        assert.strictEqual(body_text, 'pong');

        await new Promise((resolve) => server_instance.close(() => resolve()));
        started_servers.pop();

        assert.strictEqual(in_process_resource.stop_calls >= 1, true);
        assert.strictEqual(in_process_resource.status.state, 'stopped');
    });

    it('supports direct process resources with consistent status API', async () => {
        const port = await get_free_port();
        let server_instance = null;

        server_instance = await Server.serve({
            host: '127.0.0.1',
            port,
            api: {
                process_status: () => {
                    const process_resource = server_instance.resource_pool.get_resource('worker_process');
                    return process_resource ? process_resource.status : null;
                }
            },
            resources: {
                worker_process: {
                    type: 'process',
                    command: process.execPath,
                    args: ['-e', 'setInterval(() => {}, 1000);']
                }
            }
        });
        started_servers.push(server_instance);

        const process_resource = server_instance.resource_pool.get_resource('worker_process');
        assert(process_resource, 'Expected worker_process resource in the pool');

        const process_status = process_resource.status;
        assert.strictEqual(process_status.state, 'running');
        assert.strictEqual(typeof process_status.processManager.type, 'string');
        assert.strictEqual(process_status.processManager.type, 'direct');
        assert(Number.isFinite(process_status.pid), 'Expected running process PID');

        const { response, body_text } = await get_http_response(port, '/api/process_status');
        assert.strictEqual(response.statusCode, 200);

        const parsed_status = JSON.parse(body_text);
        assert.strictEqual(parsed_status.state, 'running');
        assert.strictEqual(typeof parsed_status.restartCount, 'number');
        assert('memoryUsage' in parsed_status);
        assert('lastHealthCheck' in parsed_status);

        await new Promise((resolve) => server_instance.close(() => resolve()));
        started_servers.pop();

        assert.strictEqual(process_resource.status.state, 'stopped');
    });
});
