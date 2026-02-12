const assert = require('assert');
const { describe, it } = require('mocha');
const { Resource } = require('jsgui3-html');

const Server_Resource_Pool = require('../resources/server-resource-pool');

class Dummy_Managed_Resource extends Resource {
    constructor(spec = {}) {
        super(spec);
        this.current_state = spec.initial_state || 'stopped';
        this.start_calls = 0;
        this.stop_calls = 0;
    }

    start(callback) {
        const previous_state = this.current_state;
        this.start_calls += 1;
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
        const previous_state = this.current_state;
        this.stop_calls += 1;
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

describe('Server_Resource_Pool lifecycle', function() {
    it('forwards resource state events and supports removal with stop()', async () => {
        const resource_pool = new Server_Resource_Pool();
        const managed_resource = new Dummy_Managed_Resource({
            name: 'managed_resource_one'
        });

        resource_pool.add(managed_resource);

        const forwarded_events = [];
        resource_pool.on('resource_state_change', (event_data) => {
            forwarded_events.push(event_data);
        });

        await managed_resource.start();
        assert(forwarded_events.some((event_data) => event_data.resourceName === 'managed_resource_one' && event_data.to === 'running'));

        const did_remove = await resource_pool.remove('managed_resource_one');
        assert.strictEqual(did_remove, true);
        assert.strictEqual(managed_resource.stop_calls > 0, true);
        assert.strictEqual(resource_pool.has_resource('managed_resource_one'), false);
    });

    it('supports stop-all and summary aggregation', async () => {
        const resource_pool = new Server_Resource_Pool();

        const resource_one = new Dummy_Managed_Resource({
            name: 'managed_resource_a',
            initial_state: 'running'
        });
        const resource_two = new Dummy_Managed_Resource({
            name: 'managed_resource_b',
            initial_state: 'crashed'
        });

        resource_pool.add(resource_one);
        resource_pool.add(resource_two);

        const by_constructor = resource_pool.get_resources_by_type(Dummy_Managed_Resource);
        const by_name = resource_pool.get_resources_by_type('Dummy_Managed_Resource');
        assert.strictEqual(by_constructor.length >= 2, true);
        assert.strictEqual(by_name.length >= 2, true);

        const summary_before_stop = resource_pool.summary;
        assert(summary_before_stop.byType.Dummy_Managed_Resource);
        assert(summary_before_stop.byType.Dummy_Managed_Resource.some((entry) => entry.name === 'managed_resource_a'));

        await resource_pool.stop();
        assert.strictEqual(resource_one.stop_calls > 0, true);
        assert.strictEqual(resource_two.stop_calls > 0, true);
    });
});
