const jsgui = require('jsgui3-html');

const Local_Server_Info = require('./local-server-info-resource');

const { Resource_Pool } = jsgui;

const to_error = (error_value) => {
    if (!error_value) return new Error('Unknown resource error');
    if (error_value instanceof Error) return error_value;
    return new Error(String(error_value));
};

class Server_Resource_Pool extends Resource_Pool {
    constructor(spec = {}) {
        super(spec);

        this._resource_event_handlers = new WeakMap();

        const local_server_info = new Local_Server_Info({
            name: 'Local Server Info',
            startup_type: 'auto',
            access: {
                full: ['server_admin']
            },
            pool: this
        });
        this.add(local_server_info);
    }

    add(resource) {
        if (!this._resource_event_handlers) {
            this._resource_event_handlers = new WeakMap();
        }
        const add_result = super.add(resource);
        this._bind_resource_events(resource);
        return add_result;
    }

    push(resource) {
        return this.add(resource);
    }

    _bind_resource_events(resource) {
        if (!resource || typeof resource.on !== 'function') {
            return;
        }

        if (!this._resource_event_handlers) {
            this._resource_event_handlers = new WeakMap();
        }

        if (this._resource_event_handlers.has(resource)) {
            return;
        }

        const bound_handlers = {
            state_change: (change_data = {}) => {
                this.raise('resource_state_change', {
                    resourceName: resource.name,
                    ...change_data
                });
            },
            crashed: (event_data = {}) => {
                this.raise('crashed', {
                    resourceName: resource.name,
                    ...event_data
                });
            },
            unhealthy: (event_data = {}) => {
                this.raise('unhealthy', {
                    resourceName: resource.name,
                    ...event_data
                });
            },
            unreachable: (event_data = {}) => {
                this.raise('unreachable', {
                    resourceName: resource.name,
                    ...event_data
                });
            },
            recovered: (event_data = {}) => {
                this.raise('recovered', {
                    resourceName: resource.name,
                    ...event_data
                });
            }
        };

        Object.entries(bound_handlers).forEach(([event_name, handler_fn]) => {
            resource.on(event_name, handler_fn);
        });

        this._resource_event_handlers.set(resource, bound_handlers);
    }

    _unbind_resource_events(resource) {
        if (!resource || typeof resource.off !== 'function') {
            return;
        }

        if (!this._resource_event_handlers) {
            this._resource_event_handlers = new WeakMap();
            return;
        }

        const bound_handlers = this._resource_event_handlers.get(resource);
        if (!bound_handlers) {
            return;
        }

        Object.entries(bound_handlers).forEach(([event_name, handler_fn]) => {
            resource.off(event_name, handler_fn);
        });

        this._resource_event_handlers.delete(resource);
    }

    _invoke_resource_stop(resource) {
        if (!resource || typeof resource.stop !== 'function') {
            return Promise.resolve(false);
        }

        if (resource.stop.length >= 1) {
            return new Promise((resolve, reject) => {
                resource.stop((error) => {
                    if (error) {
                        reject(to_error(error));
                        return;
                    }
                    resolve(true);
                });
            });
        }

        const stop_result = resource.stop();
        if (stop_result && typeof stop_result.then === 'function') {
            return stop_result.then(() => true);
        }

        return Promise.resolve(true);
    }

    _invoke_resource_start(resource) {
        if (!resource || typeof resource.start !== 'function') {
            return Promise.resolve(false);
        }

        if (resource.start.length >= 1) {
            return new Promise((resolve, reject) => {
                resource.start((error) => {
                    if (error) {
                        reject(to_error(error));
                        return;
                    }
                    resolve(true);
                });
            });
        }

        const start_result = resource.start();
        if (start_result && typeof start_result.then === 'function') {
            return start_result.then(() => true);
        }

        return Promise.resolve(true);
    }

    _resource_meets_requirements(resource) {
        if (!resource) {
            return false;
        }

        if (typeof resource.meets_requirements !== 'function') {
            return true;
        }

        try {
            return resource.meets_requirements() !== false;
        } catch (error) {
            throw to_error(error);
        }
    }

    async _start_internal() {
        const resources_to_start = [];
        this.resources.each((resource) => {
            if (this._resource_meets_requirements(resource)) {
                resources_to_start.push(resource);
            }
        });

        const start_results = await Promise.allSettled(
            resources_to_start.map((resource) => this._invoke_resource_start(resource))
        );
        const first_rejection = start_results.find((result) => result.status === 'rejected');
        if (first_rejection) {
            throw to_error(first_rejection.reason);
        }

        return true;
    }

    start(callback) {
        const start_promise = this._start_internal();

        if (typeof callback === 'function') {
            start_promise.then(
                () => callback(null, true),
                (error) => callback(error)
            );
            return;
        }

        return start_promise;
    }

    async _remove_internal(resource_name) {
        const resource = this.get_resource(resource_name);
        if (!resource) {
            return false;
        }

        if (typeof resource.stop === 'function') {
            await this._invoke_resource_stop(resource);
        }

        this._unbind_resource_events(resource);
        this.resources.remove(resource);

        this.raise('removed', {
            resourceName: resource_name,
            timestamp: Date.now()
        });

        return true;
    }

    remove(resource_name, callback) {
        const remove_promise = this._remove_internal(resource_name);

        if (typeof callback === 'function') {
            remove_promise.then(
                (did_remove) => callback(null, did_remove),
                (error) => callback(error)
            );
            return;
        }

        return remove_promise;
    }

    async _stop_internal() {
        const resources_to_stop = [];
        this.resources.each((resource) => {
            if (resource && typeof resource.stop === 'function') {
                resources_to_stop.push(resource);
            }
        });

        const stop_results = await Promise.allSettled(
            resources_to_stop.map((resource) => this._invoke_resource_stop(resource))
        );

        const first_rejection = stop_results.find((result) => result.status === 'rejected');
        if (first_rejection) {
            throw to_error(first_rejection.reason);
        }

        return true;
    }

    stop(callback) {
        const stop_promise = this._stop_internal();

        if (typeof callback === 'function') {
            stop_promise.then(
                () => callback(null, true),
                (error) => callback(error)
            );
            return;
        }

        return stop_promise;
    }

    get_resources_by_type(type_value) {
        const matching_resources = [];

        this.resources.each((resource) => {
            if (!resource) {
                return;
            }

            if (typeof type_value === 'function') {
                if (resource instanceof type_value) {
                    matching_resources.push(resource);
                }
                return;
            }

            if (typeof type_value === 'string') {
                const constructor_name = resource.constructor && resource.constructor.name;
                if (constructor_name === type_value || resource.__type_name === type_value || resource.type === type_value) {
                    matching_resources.push(resource);
                }
            }
        });

        return matching_resources;
    }

    get summary() {
        const summary = {
            total: 0,
            running: 0,
            stopped: 0,
            crashed: 0,
            unreachable: 0,
            byType: {}
        };

        this.resources.each((resource) => {
            if (!resource) {
                return;
            }

            summary.total += 1;

            const resource_status = resource.status || {};
            const resource_state = resource_status.state || resource.state || 'unknown';
            if (summary[resource_state] !== undefined) {
                summary[resource_state] += 1;
            }

            const type_name = (resource.constructor && resource.constructor.name) || 'Unknown';
            if (!summary.byType[type_name]) {
                summary.byType[type_name] = [];
            }

            if (typeof resource.get_abstract === 'function') {
                summary.byType[type_name].push(resource.get_abstract());
            } else {
                summary.byType[type_name].push({
                    name: resource.name,
                    state: resource_state
                });
            }
        });

        return summary;
    }
}

module.exports = Server_Resource_Pool;
