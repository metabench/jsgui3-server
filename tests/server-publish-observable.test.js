const assert = require('assert');
const { describe, it, before, after } = require('mocha');
const http = require('http');
const Server = require('../server');
const { observable } = require('fnl');
const { get_free_port } = require('../port-utils');

describe('Server.publish_observable API', function () {
    this.timeout(10000);

    let server;
    let port;
    let baseUrl;

    before(async () => {
        port = await get_free_port();
        baseUrl = `http://localhost:${port}`;

        server = new Server({
            website: false,
            name: 'Test Server'
        });

        // Create an infinite observable
        const obs = observable((next) => {
            let i = 0;
            const timer = setInterval(() => {
                next({ count: ++i });
            }, 50); // Fast interval for testing
            return [() => clearInterval(timer)]; // Cleanup
        });

        // Use the new API
        // Test snake_case version
        server.publish_observable('/api/stream', obs);
        // Test camelCase alias
        server.publishObservable('/api/stream-alias', obs);

        // Start server
        await new Promise((resolve, reject) => {
            server.start(port, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    });

    after((done) => {
        if (server) {
            // Close server and wait a bit for connections to drain
            server.close(() => {
                setTimeout(done, 100);
            });
        } else {
            done();
        }
    });

    it('should stream data via /api/stream (publish_observable)', (done) => {
        const req = http.get(`${baseUrl}/api/stream`, (res) => {
            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.headers['content-type'], 'text/event-stream');

            let data = '';
            res.on('data', chunk => {
                data += chunk.toString();
                // Check for data: {"count":...} pattern
                if (data.includes('"count":')) {
                    req.destroy(); // Stop request
                    done();
                }
            });
        });

        req.on('error', (err) => {
            if (err.code !== 'ECONNRESET') done(err);
        });
    });

    it('should stream data via /api/stream-alias (publishObservable)', (done) => {
        const req = http.get(`${baseUrl}/api/stream-alias`, (res) => {
            assert.strictEqual(res.statusCode, 200);
            assert.strictEqual(res.headers['content-type'], 'text/event-stream');

            let data = '';
            res.on('data', chunk => {
                data += chunk.toString();
                if (data.includes('"count":')) {
                    req.destroy();
                    done();
                }
            });
        });

        req.on('error', (err) => {
            if (err.code !== 'ECONNRESET') done(err);
        });
    });
});
