const assert = require('assert');
const { describe, it, afterEach } = require('mocha');

const Process_Resource = require('../resources/process-resource');

const wait_for_condition = async (condition_fn, timeout_ms = 4000, interval_ms = 20) => {
    const started_at = Date.now();
    while ((Date.now() - started_at) < timeout_ms) {
        if (condition_fn()) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, interval_ms));
    }
    return false;
};

const wait_for_event = (event_source, event_name, timeout_ms = 4000) => {
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

describe('Process_Resource', function() {
    this.timeout(15000);

    const started_resources = [];

    afterEach(async () => {
        for (const resource of started_resources.splice(0)) {
            try {
                await resource.stop();
            } catch {
                // Best-effort cleanup.
            }
        }
    });

    it('supports direct start and stop lifecycle', async () => {
        const resource = new Process_Resource({
            name: 'direct-lifecycle-test',
            command: process.execPath,
            args: ['-e', 'setInterval(() => {}, 1000);']
        });
        started_resources.push(resource);

        await resource.start();

        assert.strictEqual(resource.status.state, 'running');
        assert(Number.isFinite(resource.status.pid), 'Expected a running PID in direct mode');

        await resource.stop();
        assert.strictEqual(resource.status.state, 'stopped');
    });

    it('auto-restarts after crash and transitions to crashed after max restarts', async () => {
        const resource = new Process_Resource({
            name: 'crash-restart-test',
            command: process.execPath,
            args: ['-e', 'setTimeout(() => process.exit(1), 40);'],
            autoRestart: true,
            maxRestarts: 1,
            restartBackoffBaseMs: 10
        });
        started_resources.push(resource);

        await resource.start();

        const crashed_event = wait_for_event(resource, 'crashed', 6000);
        const did_crash = await wait_for_condition(() => resource.status.state === 'crashed', 6000, 25);
        assert.strictEqual(did_crash, true, 'Expected resource to transition to crashed');

        const crashed_data = await crashed_event;
        assert(crashed_data.restartCount >= 2, 'Expected restart count to exceed max restarts');
    });

    it('defaults PM2 command resolution without requiring pm2Path', () => {
        const resource = new Process_Resource({
            name: 'pm2-default-path-test',
            processManager: {
                type: 'pm2'
            }
        });

        const resolved_pm2_command = resource._resolve_pm2_command();
        assert.strictEqual(typeof resolved_pm2_command, 'string');
        assert(resolved_pm2_command.length > 0, 'Expected PM2 command resolution to return a non-empty command string');
    });

    it('remains stable under rapid lifecycle command bursts', async () => {
        const resource = new Process_Resource({
            name: 'rapid-lifecycle-test',
            command: process.execPath,
            args: ['-e', 'setInterval(() => {}, 1000);']
        });
        started_resources.push(resource);

        const operation_sequence = [
            'start', 'restart', 'stop', 'start', 'restart',
            'stop', 'start', 'stop', 'start', 'restart',
            'restart', 'stop', 'start', 'stop', 'start',
            'restart', 'stop', 'start', 'restart', 'stop'
        ];

        const operation_promises = operation_sequence.map((operation_name) => {
            return resource[operation_name]();
        });
        const operation_results = await Promise.allSettled(operation_promises);

        const rejected_results = operation_results.filter((result) => result.status === 'rejected');
        assert.strictEqual(
            rejected_results.length,
            0,
            `Expected all lifecycle operations to settle without rejection: ${rejected_results.map((entry) => entry.reason && entry.reason.message).join(' | ')}`
        );

        await resource.start();
        assert.strictEqual(resource.status.state, 'running');
        assert(Number.isFinite(resource.status.pid), 'Expected a running PID after burst lifecycle operations');

        await resource.stop();
        assert.strictEqual(resource.status.state, 'stopped');
    });
});
