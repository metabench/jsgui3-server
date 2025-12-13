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
const Static_Route_HTTP_Responder = require('./http/responders/static/Static_Route_HTTP_Responder');
const { get_port_or_free } = require('./port-utils');


const prepare_webpage_route = (server, route, page_options = {}, defaults = {}) => {
	return new Promise((resolve, reject) => {
		try {
			const {
				title,
				name,
				description
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
				title: title,
				content: content_ctrl,
				path: route
			});

			const publisher_options = {
				webpage
			};
			if (guessed_client_path) publisher_options.src_path_client_js = guessed_client_path;
			if (truthy(defaults.debug)) publisher_options.debug = true;

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
				} catch (err) {
					reject(err);
				}
			});
			webpage_publisher.on('error', reject);
		} catch (err) {
			reject(err);
		}
	});
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
            serve_options = { ...input
            };
        } else if (input !== undefined) {
            throw new Error('First argument to Server.serve must be a control constructor or options object.');
        }
        if (maybe_options && typeof maybe_options === 'object') {
            serve_options = { ...serve_options,
                ...maybe_options
            };
        }
    
        const caller_file = serve_options.caller_file || serve_options.callerFile || guess_caller_file();
        const caller_dir = serve_options.root ? lib_path.resolve(process.cwd(), serve_options.root) : (caller_file ? lib_path.dirname(caller_file) : process.cwd());
    
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
    
        const port = Number.isFinite(serve_options.port) ? Number(serve_options.port) : (serve_options.port === 'auto' ? 0 : (process.env.PORT ? Number(process.env.PORT) : 8080));
        const auto_port = serve_options.autoPort !== false && (port === 0 || serve_options.port === 'auto' || serve_options.autoPort === true);
        
        if (!Number.isFinite(port) && serve_options.port !== 'auto') {
            throw new Error('Invalid port specified for Server.serve');
        }
    
        const host = serve_options.host || process.env.HOST || null;
        const debug_enabled = serve_options.debug !== undefined ? truthy(serve_options.debug) : truthy(process.env.JSGUI_DEBUG);
    
        const server_spec = {
            name: serve_options.name || 'jsgui3 server',
            debug: debug_enabled
        };
        if (typeof serve_options.ctrl === 'function') {
            server_spec.Ctrl = serve_options.ctrl;
        } else if (serve_options.api && typeof serve_options.api === 'object') {
            // API-only server: explicitly disable website setup
            server_spec.website = false;
        }
        if (root_client_path) {
            server_spec.src_path_client_js = root_client_path;
        }
    
        const server_instance = new Server(server_spec);
        if (host) {
            server_instance.allowed_addresses = Array.isArray(host) ? host : [host];
        }

        const settle = (resolver, value) => {
            if (callback) {
                try {
                    callback(resolver === reject ? value : null, resolver === resolve ? value : undefined);
                } catch (err) {
                    // Swallow callback errors after resolution
                }
            }
            return resolver(value);
        };

        let has_started = false;

        const extra_page_promises = additional_pages.map(([route, cfg]) => prepare_webpage_route(server_instance, route, cfg, {
            caller_dir,
            debug: debug_enabled
        }));
        if (serve_options.page_config && serve_options.page_route && serve_options.page_route !== '/') {
            extra_page_promises.unshift(prepare_webpage_route(server_instance, serve_options.page_route, serve_options.page_config, {
                caller_dir,
                debug: debug_enabled
            }));
        }

        if (serve_options.api && typeof serve_options.api === 'object') {
            console.log('🔍 DEBUG: Setting up API routes');
            for (const [name, handler] of Object.entries(serve_options.api)) {
                if (typeof handler === 'function') {
                    console.log(`🔍 DEBUG: Publishing API route: ${name}`);
                    server_instance.publish(name, handler);
                }
            }
            console.log('🔍 DEBUG: API routes setup complete');
        }

        return new Promise((resolve, reject) => {
            const start_server = async () => {
                if (has_started) return;
                has_started = true;
                
                // Determine the actual port to use
                let actual_port = port;
                if (auto_port) {
                    try {
                        const check_host = host || '127.0.0.1';
                        actual_port = await get_port_or_free(port, Array.isArray(check_host) ? check_host[0] : check_host);
                        if (actual_port !== port && port !== 0) {
                            console.log(`Port ${port} was in use, using port ${actual_port} instead`);
                        }
                    } catch (err) {
                        console.error('Failed to find free port:', err);
                        return settle(reject, err);
                    }
                }
                
                // Store the actual port on the server instance for reference
                server_instance.port = actual_port;
                
                console.log('🔍 DEBUG: Calling server_instance.start()');
                server_instance.start(actual_port, (err) => {
                    if (err) {
                        console.log('🔍 DEBUG: server_instance.start() failed:', err);
                        return settle(reject, err);
                    }
                    console.log('🔍 DEBUG: server_instance.start() succeeded');
                    const message = host ? `Serving on http://${Array.isArray(host) ? host[0] : host}:${actual_port}/` : `Serving on port ${actual_port} (all IPv4 interfaces)`;
                    console.log(message);
                    console.log('Server ready');
                    settle(resolve, server_instance);
                });
            };

            console.log('🔍 DEBUG: Setting up ready event listener');
            server_instance.on('ready', () => {
                console.log('🔍 DEBUG: Ready event fired');
                Promise.allSettled(extra_page_promises).then(results => {
                    const rejected_entry = results.find(result => result.status === 'rejected');
                    if (rejected_entry) {
                        console.log('🔍 DEBUG: Extra page promise rejected:', rejected_entry.reason);
                        return settle(reject, rejected_entry.reason);
                    }
                    console.log('🔍 DEBUG: All extra page promises resolved, calling start_server()');
                    start_server();
                }).catch(err => {
                    console.log('🔍 DEBUG: Extra page promises error:', err);
                    settle(reject, err);
                });
            });

            // For API-only servers, trigger ready immediately after API setup
            if (serve_options.api && typeof serve_options.api === 'object' && !serve_options.ctrl) {
                console.log('🔍 DEBUG: API-only server detected, triggering ready event');
                server_instance.raise('ready');
            }

            console.log('🔍 DEBUG: Setting up fallback timeout');
            setTimeout(() => {
                // Fallback in case ready event never fires (should not happen, but guard just in case)
                console.log('🔍 DEBUG: Fallback timeout triggered, has_started:', has_started);
                if (!has_started) {
                    console.log('🔍 DEBUG: Calling start_server() from fallback');
                    start_server();
                }
            }, 2000).unref?.();
        });
    };
    return serve;
}
