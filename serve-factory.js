const {
    truthy,
    guess_caller_file,
    find_default_client_path,
    load_default_control_from_client,
    ensure_route_leading_slash
} = require('./serve-helpers');
const lib_path = require('path');
const Webpage = require('./website/webpage');
const HTTP_Webpage_Publisher = require('./publishers/http-webpage-publisher');
const HTTP_SSE_Publisher = require('./publishers/http-sse-publisher');
const Static_Route_HTTP_Responder = require('./http/responders/static/Static_Route_HTTP_Responder');
const Process_Resource = require('./resources/process-resource');
const Remote_Process_Resource = require('./resources/remote-process-resource');
const { get_port_or_free } = require('./port-utils');

const prepare_webpage_route = (server, route, page_options = {}, defaults = {}) => {
    return new Promise((resolve, reject) => {
        try {
            const {
                title,
                name
            } = page_options;
            const content_ctrl = page_options.content || page_options.ctrl || page_options.Ctrl;
            if (typeof content_ctrl !== 'function') {
                return reject(new Error(`Page at route "${route}" requires a control constructor as content.`));
            }

            const caller_dir = defaults.caller_dir || process.cwd();
            const explicit_client_path = page_options.clientPath || page_options.src_path_client_js || page_options.disk_path_client_js;
            const guessed_client_path = find_default_client_path(explicit_client_path, caller_dir);

            const webpage = new Webpage({
                name: name || title || `Page ${route}`,
                title,
                content: content_ctrl,
                path: route
            });

            const publisher_options = {
                webpage
            };
            if (guessed_client_path) publisher_options.src_path_client_js = guessed_client_path;
            if (truthy(defaults.debug)) publisher_options.debug = true;
            if (defaults.style !== undefined) publisher_options.style = defaults.style;
            if (defaults.bundler !== undefined) publisher_options.bundler = defaults.bundler;

            const webpage_publisher = new HTTP_Webpage_Publisher(publisher_options);
            webpage_publisher.on('ready', (bundle) => {
                try {
                    if (bundle && bundle._arr) {
                        for (const item of bundle._arr) {
                            const static_responder = new Static_Route_HTTP_Responder(item);
                            server.router.set_route(item.route, static_responder, static_responder.handle_http);
                        }
                        resolve();
                        return;
                    }
                    reject(new Error(`Unexpected bundle format when preparing route ${route}`));
                } catch (error) {
                    reject(error);
                }
            });
            webpage_publisher.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

const invoke_resource_method = (resource, method_name) => {
    if (!resource || typeof resource[method_name] !== 'function') {
        return Promise.resolve(true);
    }

    if (resource[method_name].length >= 1) {
        return new Promise((resolve, reject) => {
            resource[method_name]((error, result) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(result);
            });
        });
    }

    const method_result = resource[method_name]();
    if (method_result && typeof method_result.then === 'function') {
        return method_result;
    }

    return Promise.resolve(method_result);
};

const is_resource_like = (resource_value) => {
    return !!resource_value
        && typeof resource_value === 'object'
        && (typeof resource_value.start === 'function'
            || typeof resource_value.meets_requirements === 'function'
            || typeof resource_value.get_abstract === 'function');
};

const instantiate_custom_resource = (resource_name, resource_spec, resource_constructor) => {
    const constructor_spec = resource_spec && typeof resource_spec.spec === 'object'
        ? {
            ...resource_spec.spec
        }
        : {
            ...resource_spec
        };

    if (!constructor_spec.name) {
        constructor_spec.name = resource_name;
    }

    delete constructor_spec.type;
    delete constructor_spec.class;
    delete constructor_spec.Ctor;
    delete constructor_spec.constructor_fn;
    delete constructor_spec.instance;
    delete constructor_spec.resource;
    delete constructor_spec.spec;

    return new resource_constructor(constructor_spec);
};

const create_configured_resource = (resource_name, resource_spec = {}) => {
    if (is_resource_like(resource_spec)) {
        if (!resource_spec.name) {
            resource_spec.name = resource_name;
        }
        return resource_spec;
    }

    if (typeof resource_spec === 'function') {
        return instantiate_custom_resource(resource_name, {}, resource_spec);
    }

    const normalized_spec = {
        ...resource_spec,
        name: resource_spec.name || resource_name
    };

    const explicit_instance = normalized_spec.instance || normalized_spec.resource;
    if (is_resource_like(explicit_instance)) {
        if (!explicit_instance.name) {
            explicit_instance.name = normalized_spec.name;
        }
        return explicit_instance;
    }

    const resource_constructor = normalized_spec.class || normalized_spec.Ctor || normalized_spec.constructor_fn;
    if (typeof resource_constructor === 'function') {
        return instantiate_custom_resource(resource_name, normalized_spec, resource_constructor);
    }

    const resource_type = String(normalized_spec.type || 'process').toLowerCase();
    if (resource_type === 'process' || resource_type === 'local') {
        return new Process_Resource(normalized_spec);
    }
    if (resource_type === 'remote' || resource_type === 'http') {
        return new Remote_Process_Resource(normalized_spec);
    }
    if (resource_type === 'resource' || resource_type === 'in_process' || resource_type === 'in-process') {
        throw new Error(
            `resources.${resource_name} requires one of: { instance }, { resource }, { class }, { constructor_fn }, or a resource object directly.`
        );
    }

    if (normalized_spec.command || normalized_spec.processManager) {
        return new Process_Resource(normalized_spec);
    }
    if (normalized_spec.host || normalized_spec.endpoints) {
        return new Remote_Process_Resource(normalized_spec);
    }

    throw new Error(`Unsupported resources.${resource_name}.type: ${normalized_spec.type}`);
};

const normalize_resource_entries = (resources_option) => {
    if (!resources_option) {
        return [];
    }

    if (Array.isArray(resources_option)) {
        return resources_option.map((resource_spec, index) => {
            const inferred_name = (resource_spec && resource_spec.name) || `resource_${index + 1}`;
            return [inferred_name, resource_spec || {}];
        });
    }

    if (typeof resources_option === 'object') {
        return Object.entries(resources_option);
    }

    throw new Error('`resources` must be an object map or an array.');
};

module.exports = (Server) => {
    const serve = function(input, maybe_options, maybe_callback) {
        let callback = null;
        if (typeof maybe_options === 'function') {
            callback = maybe_options;
            maybe_options = undefined;
        } else if (typeof maybe_callback === 'function') {
            callback = maybe_callback;
        }

        let serve_options = {};
        if (typeof input === 'function') {
            serve_options.ctrl = input;
        } else if (input && typeof input === 'object') {
            serve_options = {
                ...input
            };
        } else if (input !== undefined) {
            throw new Error('First argument to Server.serve must be a control constructor or options object.');
        }

        if (maybe_options && typeof maybe_options === 'object') {
            serve_options = {
                ...serve_options,
                ...maybe_options
            };
        }

        const caller_file = serve_options.caller_file || serve_options.callerFile || guess_caller_file();
        const caller_dir = serve_options.root
            ? lib_path.resolve(process.cwd(), serve_options.root)
            : (caller_file ? lib_path.dirname(caller_file) : process.cwd());

        if (!serve_options.ctrl && serve_options.Ctrl) serve_options.ctrl = serve_options.Ctrl;
        if (!serve_options.ctrl && serve_options.page) {
            const page_config = serve_options.page;
            serve_options.ctrl = page_config.content || page_config.ctrl || page_config.Ctrl;
            serve_options.page_route = ensure_route_leading_slash(page_config.route || '/');
            serve_options.page_config = page_config;
        }

        let additional_pages = [];
        if (!serve_options.ctrl && serve_options.pages && typeof serve_options.pages === 'object') {
            const page_entries = Object.entries(serve_options.pages);
            if (!page_entries.length) {
                throw new Error('`pages` option requires at least one entry.');
            }

            const normalized_pages = page_entries.map(([route, cfg]) => [ensure_route_leading_slash(route), cfg || {}]);
            const root_entry = normalized_pages.find(([route]) => route === '/') || normalized_pages[0];
            serve_options.ctrl = (root_entry[1].content || root_entry[1].ctrl || root_entry[1].Ctrl);
            serve_options.page_route = root_entry[0];
            serve_options.page_config = root_entry[1];
            additional_pages = normalized_pages.filter(([route]) => route !== serve_options.page_route);
        }

        const explicit_client_path = serve_options.clientPath || serve_options.client_path || serve_options.src_path_client_js || serve_options.disk_path_client_js;
        const root_client_path = find_default_client_path(explicit_client_path, caller_dir);

        if (typeof serve_options.ctrl !== 'function' && root_client_path) {
            const auto_ctrl = load_default_control_from_client(root_client_path);
            if (typeof auto_ctrl === 'function') {
                serve_options.ctrl = auto_ctrl;
            }
        }

        if (serve_options.page_config && typeof serve_options.ctrl !== 'function') {
            throw new Error('`page` option requires a control constructor.');
        }
        if (additional_pages.length && typeof serve_options.ctrl !== 'function') {
            throw new Error('`pages` option requires at least one control constructor.');
        }

        const port = Number.isFinite(serve_options.port)
            ? Number(serve_options.port)
            : (serve_options.port === 'auto' ? 0 : (process.env.PORT ? Number(process.env.PORT) : 8080));
        const auto_port = serve_options.autoPort !== false && (port === 0 || serve_options.port === 'auto' || serve_options.autoPort === true);
        if (!Number.isFinite(port) && serve_options.port !== 'auto') {
            throw new Error('Invalid port specified for Server.serve');
        }

        const host = serve_options.host || process.env.HOST || null;
        const debug_enabled = serve_options.debug !== undefined ? truthy(serve_options.debug) : truthy(process.env.JSGUI_DEBUG);
        const style_config = serve_options.style;
        const bundler_config = serve_options.bundler;

        const server_spec = {
            name: serve_options.name || 'jsgui3 server',
            debug: debug_enabled
        };
        if (style_config !== undefined) server_spec.style = style_config;
        if (bundler_config !== undefined) server_spec.bundler = bundler_config;

        if (typeof serve_options.ctrl === 'function') {
            server_spec.Ctrl = serve_options.ctrl;
        } else if (serve_options.api && typeof serve_options.api === 'object') {
            server_spec.website = false;
        }

        if (root_client_path) {
            server_spec.src_path_client_js = root_client_path;
        }

        const server_instance = new Server(server_spec);
        if (host) {
            server_instance.allowed_addresses = Array.isArray(host) ? host : [host];
        }

        const configured_resources = [];
        const resource_entries = normalize_resource_entries(serve_options.resources);
        if (resource_entries.length) {
            for (const [resource_name, resource_spec] of resource_entries) {
                configured_resources.push(create_configured_resource(resource_name, resource_spec || {}));
            }
            server_instance.configured_resources = configured_resources;
        }

        if (serve_options.events) {
            const event_options = typeof serve_options.events === 'object' ? serve_options.events : {};
            const events_route = ensure_route_leading_slash(event_options.route || '/events');
            const sse_publisher = new HTTP_SSE_Publisher({
                name: event_options.name || 'events',
                ...event_options
            });

            server_instance.sse_publisher = sse_publisher;
            server_instance.server_router.set_route(events_route, sse_publisher, sse_publisher.handle_http);

            const pool_event_names = ['resource_state_change', 'crashed', 'unhealthy', 'unreachable', 'recovered'];
            pool_event_names.forEach((event_name) => {
                server_instance.resource_pool.on(event_name, (event_data) => {
                    sse_publisher.broadcast(event_name, event_data);
                });
            });
        }

        const attach_configured_resources = () => {
            for (const resource of configured_resources) {
                if (!server_instance.resource_pool.has_resource(resource.name)) {
                    server_instance.resource_pool.add(resource);
                }
            }
        };

        const start_configured_resources = async () => {
            if (!configured_resources.length) {
                return;
            }

            attach_configured_resources();
            await Promise.all(configured_resources.map((resource) => invoke_resource_method(resource, 'start')));
        };

        const startup_ready_timeout_ms = Number.isFinite(serve_options.readyTimeoutMs) && Number(serve_options.readyTimeoutMs) > 0
            ? Number(serve_options.readyTimeoutMs)
            : 120000;

        const extra_page_promises = additional_pages.map(([route, cfg]) => prepare_webpage_route(server_instance, route, cfg, {
            caller_dir,
            debug: debug_enabled,
            style: style_config,
            bundler: bundler_config
        }));

        if (serve_options.page_config && serve_options.page_route && serve_options.page_route !== '/') {
            extra_page_promises.unshift(prepare_webpage_route(server_instance, serve_options.page_route, serve_options.page_config, {
                caller_dir,
                debug: debug_enabled,
                style: style_config,
                bundler: bundler_config
            }));
        }

        if (serve_options.api && typeof serve_options.api === 'object') {
            for (const [name, handler] of Object.entries(serve_options.api)) {
                if (typeof handler === 'function') {
                    server_instance.publish(name, handler);
                }
            }
        }

        return new Promise((resolve, reject) => {
            let has_started = false;
            let has_settled = false;
            let ready_timeout_handle = null;

            const settle = (resolver, value) => {
                if (has_settled) {
                    return;
                }
                has_settled = true;
                if (ready_timeout_handle) {
                    clearTimeout(ready_timeout_handle);
                    ready_timeout_handle = null;
                }

                if (callback) {
                    try {
                        callback(resolver === reject ? value : null, resolver === resolve ? value : undefined);
                    } catch {
                        // Ignore callback errors after settlement.
                    }
                }
                resolver(value);
            };

            const start_server = async () => {
                if (has_started || has_settled) return;
                has_started = true;

                let actual_port = port;
                if (auto_port) {
                    try {
                        const check_host = host || '127.0.0.1';
                        actual_port = await get_port_or_free(port, Array.isArray(check_host) ? check_host[0] : check_host);
                    } catch (error) {
                        return settle(reject, error);
                    }
                }

                server_instance.port = actual_port;

                server_instance.start(actual_port, (error) => {
                    if (error) {
                        return settle(reject, error);
                    }

                    start_configured_resources().then(() => {
                        settle(resolve, server_instance);
                    }).catch((resource_error) => {
                        settle(reject, resource_error);
                    });
                });
            };

            server_instance.on('ready', () => {
                if (has_settled) {
                    return;
                }
                Promise.allSettled(extra_page_promises).then((results) => {
                    const rejected_entry = results.find((result) => result.status === 'rejected');
                    if (rejected_entry) {
                        return settle(reject, rejected_entry.reason);
                    }
                    start_server();
                }).catch((error) => {
                    settle(reject, error);
                });
            });

            if (serve_options.api && typeof serve_options.api === 'object' && !serve_options.ctrl) {
                server_instance.raise('ready');
            }

            ready_timeout_handle = setTimeout(() => {
                if (!has_settled && !has_started) {
                    settle(reject, new Error(
                        `Server.serve timed out waiting for "ready" before start (${startup_ready_timeout_ms}ms).`
                    ));
                }
            }, startup_ready_timeout_ms);
            ready_timeout_handle.unref?.();
        });
    };

    return serve;
};
