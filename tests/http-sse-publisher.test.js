const assert = require('assert');
const http = require('http');
const { describe, it, beforeEach, afterEach } = require('mocha');

const HTTP_SSE_Publisher = require('../publishers/http-sse-publisher');
const { get_free_port } = require('../port-utils');

const wait_for_condition = async (condition_fn, timeout_ms = 5000, interval_ms = 20) => {
    const started_at = Date.now();
    while ((Date.now() - started_at) < timeout_ms) {
        if (condition_fn()) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, interval_ms));
    }
    return false;
};

const connect_sse_client = (port, path = '/events', headers = {}) => {
    return new Promise((resolve, reject) => {
        const state = {
            data: ''
        };

        const request = http.get({
            hostname: '127.0.0.1',
            port,
            path,
            headers
        }, (response) => {
            response.setEncoding('utf8');
            response.on('data', (chunk) => {
                state.data += chunk;
            });
            resolve({
                request,
                response,
                state,
                destroy: () => {
                    try {
                        request.destroy();
                    } catch {
                        // Ignore destroy errors.
                    }
                }
            });
        });

        request.on('error', reject);
    });
};

describe('HTTP_SSE_Publisher', function() {
    this.timeout(15000);

    let sse_publisher = null;
    let http_server = null;
    let server_port = null;

    beforeEach(async () => {
        server_port = await get_free_port();
        sse_publisher = new HTTP_SSE_Publisher({
            name: 'events',
            keepaliveIntervalMs: 40,
            maxClients: 10,
            eventHistorySize: 20
        });

        http_server = http.createServer((req, res) => {
            if ((req.url || '').startsWith('/events')) {
                sse_publisher.handle_http(req, res);
                return;
            }

            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        });

        await new Promise((resolve, reject) => {
            http_server.listen(server_port, '127.0.0.1', (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    });

    afterEach(async () => {
        if (sse_publisher) {
            await sse_publisher.stop();
            sse_publisher = null;
        }

        if (http_server) {
            await new Promise((resolve) => http_server.close(resolve));
            http_server = null;
        }
    });

    it('broadcasts events, supports targeted sends, keepalive, and Last-Event-ID replay', async () => {
        const client_alpha = await connect_sse_client(server_port, '/events?clientId=alpha');
        const client_beta = await connect_sse_client(server_port, '/events?clientId=beta');

        const did_connect_two_clients = await wait_for_condition(() => sse_publisher.client_count === 2, 3000, 20);
        assert.strictEqual(did_connect_two_clients, true);

        sse_publisher.broadcast('update', { value: 1 });

        const alpha_received_update = await wait_for_condition(() => client_alpha.state.data.includes('event: update'), 4000, 20);
        const beta_received_update = await wait_for_condition(() => client_beta.state.data.includes('event: update'), 4000, 20);
        assert.strictEqual(alpha_received_update, true);
        assert.strictEqual(beta_received_update, true);

        sse_publisher.send('alpha', 'private', { only: 'alpha' });
        const alpha_received_private = await wait_for_condition(() => client_alpha.state.data.includes('event: private'), 3000, 20);
        await new Promise((resolve) => setTimeout(resolve, 120));
        const beta_received_private = client_beta.state.data.includes('event: private');

        assert.strictEqual(alpha_received_private, true);
        assert.strictEqual(beta_received_private, false);

        const alpha_received_keepalive = await wait_for_condition(() => client_alpha.state.data.includes(':keepalive'), 4000, 20);
        assert.strictEqual(alpha_received_keepalive, true);

        client_alpha.destroy();

        const replay_client = await connect_sse_client(server_port, '/events?clientId=replay', {
            'Last-Event-ID': '0'
        });

        const replay_received_update = await wait_for_condition(() => replay_client.state.data.includes('event: update'), 4000, 20);
        assert.strictEqual(replay_received_update, true);

        replay_client.destroy();
        client_beta.destroy();
    });
});
