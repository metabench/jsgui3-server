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
    
        const port = Number.isFinite(serve_options.port) ? Number(serve_options.port) : (process.env.PORT ? Number(process.env.PORT) : 8080);
        if (!Number.isFinite(port)) {
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
            for (const [name, handler] of Object.entries(serve_options.api)) {
                if (typeof handler === 'function') {
                    server_instance.publish(name, handler);
                }
            }
        }
    
        return new Promise((resolve, reject) => {
            const start_server = () => {
                if (has_started) return;
                has_started = true;
                server_instance.start(port, (err) => {
                    if (err) return settle(reject, err);
                    const message = host ? `Serving on http://${Array.isArray(host) ? host[0] : host}:${port || 0}/` : `Serving on port ${port || 0} (all IPv4 interfaces)`;
                    console.log(message);
                    console.log('Server ready');
                    settle(resolve, server_instance);
                });
            };
    
            server_instance.on('ready', () => {
                Promise.allSettled(extra_page_promises).then(results => {
                    const rejected_entry = results.find(result => result.status === 'rejected');
                    if (rejected_entry) {
                        return settle(reject, rejected_entry.reason);
                    }
                    start_server();
                }).catch(err => settle(reject, err));
            });
    
            setTimeout(() => {
                // Fallback in case ready event never fires (should not happen, but guard just in case)
                if (!has_started) {
                    start_server();
                }
            }, 2000).unref?.();
        });
    };
    return serve;
}
