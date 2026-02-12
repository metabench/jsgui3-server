const assert = require('assert');
const http = require('http');
const { describe, it, beforeEach, afterEach } = require('mocha');

const Remote_Process_Resource = require('../resources/remote-process-resource');
const { get_free_port } = require('../port-utils');

const wait_for_event = (event_source, event_name, timeout_ms = 5000) => {
    return new Promise((resolve, reject) => {
        const timeout_handle = setTimeout(() => {
            cleanup();
            reject(new Error(`Timed out waiting for event: ${event_name}`));
        }, timeout_ms);

        const event_handler = (event_data) => {
            cleanup();
            resolve(event_data);
        };

        const cleanup = () => {
            clearTimeout(timeout_handle);
            event_source.off(event_name, event_handler);
        };

        event_source.on(event_name, event_handler);
    });
};

describe('Remote_Process_Resource', function() {
    this.timeout(15000);

    let mock_server = null;
    let mock_port = null;
    let mock_state = 'stopped';
    let should_fail_status = false;

    const start_mock_server = async () => {
        mock_port = await get_free_port();
        mock_server = http.createServer((req, res) => {
            const request_method = String(req.method || 'GET').toUpperCase();
            const request_path = (req.url || '').split('?')[0];

            if (request_path === '/' && request_method === 'GET') {
                if (should_fail_status) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'forced failure' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    state: mock_state,
                    pid: mock_state === 'running' ? 9999 : null,
                    uptime: mock_state === 'running' ? 1234 : 0,
                    restartCount: 0,
                    memoryUsage: mock_state === 'running' ? { rssBytes: 1024 } : null
                }));
                return;
            }

            if (request_path === '/api/start' && request_method === 'POST') {
                mock_state = 'running';
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, state: mock_state }));
                return;
            }

            if (request_path === '/api/stop' && request_method === 'POST') {
                mock_state = 'stopped';
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, state: mock_state }));
                return;
            }

            if (request_path === '/api/health' && request_method === 'GET') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ healthy: true }));
                return;
            }

            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'not found' }));
        });

        await new Promise((resolve, reject) => {
            mock_server.listen(mock_port, '127.0.0.1', (error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    };

    beforeEach(async () => {
        mock_state = 'stopped';
        should_fail_status = false;
        await start_mock_server();
    });

    afterEach(async () => {
        if (mock_server) {
            await new Promise((resolve) => mock_server.close(resolve));
            mock_server = null;
        }
    });

    it('polls remote status and emits state_change transitions', async () => {
        const remote_resource = new Remote_Process_Resource({
            name: 'remote-worker',
            host: '127.0.0.1',
            port: mock_port,
            pollIntervalMs: 50,
            httpTimeoutMs: 1000,
            endpoints: {
                status: '/',
                start: '/api/start',
                stop: '/api/stop'
            }
        });

        await remote_resource.start();
        assert.strictEqual(remote_resource.status.state, 'running');
        assert.strictEqual(remote_resource.status.pid, 9999);

        const state_change_promise = wait_for_event(remote_resource, 'state_change', 5000);
        mock_state = 'crashed';

        const state_change_data = await state_change_promise;
        assert.strictEqual(state_change_data.to, 'crashed');

        await remote_resource.stop();
        assert.strictEqual(remote_resource.status.state, 'stopped');
    });

    it('emits unreachable and recovered when polling fails then recovers', async () => {
        const remote_resource = new Remote_Process_Resource({
            name: 'remote-unreachable-test',
            host: '127.0.0.1',
            port: mock_port,
            pollIntervalMs: 50,
            httpTimeoutMs: 1000,
            unreachableFailuresBeforeEvent: 2
        });

        await remote_resource.start();
        should_fail_status = true;

        const unreachable_event = await wait_for_event(remote_resource, 'unreachable', 6000);
        assert(unreachable_event.consecutiveFailures >= 2);
        assert.strictEqual(remote_resource.status.state, 'unreachable');

        should_fail_status = false;
        mock_state = 'running';

        const recovered_event = await wait_for_event(remote_resource, 'recovered', 6000);
        assert(recovered_event.timestamp);
        assert.strictEqual(remote_resource.status.state, 'running');

        await remote_resource.stop();
    });
});
