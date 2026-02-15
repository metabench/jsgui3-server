const jsgui = require('jsgui3-html'),
	http = require('http'),
	https = require('https'),
	{ prop, read_only } = require('obext'),
	fs = require('fs'),
	Resource = jsgui.Resource,
	Server_Resource_Pool = require('./resources/server-resource-pool'),
	Router = jsgui.Router,
	Website_Resource = require('./resources/website-resource'),
	Info = require('./resources/local-server-info-resource'),
	Server_Page_Context = require('./page-context'),
	{
		Evented_Class,
		each,
		tof
	} = jsgui;


const lib_path = require('path');
const Web_Admin_Page_Control = require('./controls/page/admin');
const Web_Admin_Panel_Control = require('./controls/panel/admin');
const Website = require('./website/website');
const HTTP_Website_Publisher = require('./publishers/http-website-publisher');
const Webpage = require('./website/webpage');
const HTTP_Webpage_Publisher = require('./publishers/http-webpage-publisher');
const HTTP_Function_Publisher = require('./publishers/http-function-publisher');
const HTTP_Observable_Publisher = require('./publishers/http-observable-publisher');
const HTTP_SSE_Publisher = require('./publishers/http-sse-publisher');
const Process_Resource = require('./resources/process-resource');
const Remote_Process_Resource = require('./resources/remote-process-resource');

const Static_Route_HTTP_Responder = require('./http/responders/static/Static_Route_HTTP_Responder');

const Publishers = require('./publishers/Publishers');

class JSGUI_Single_Process_Server extends Evented_Class {
	constructor(spec = {
		website: true
	}, __type_name) {
		super();
		this.http_servers = [];
		let disk_path_client_js;
		if (spec.disk_path_client_js) {
			disk_path_client_js = spec.disk_path_client_js;
		} else if (spec.src_path_client_js) {
			disk_path_client_js = spec.src_path_client_js;
		} else if (spec.source_path_client_js) {
			disk_path_client_js = spec.source_path_client_js;
		};


		if (spec.debug !== undefined) {
			this.debug = spec.debug;
		}

		const style_config = spec.style;
		const bundler_config = spec.bundler;

		// or src_path_client_js as well...

		Object.defineProperty(this, 'disk_path_client_js', { get: () => disk_path_client_js, set: (value) => disk_path_client_js = value });
		Object.defineProperty(this, 'src_path_client_js', { get: () => disk_path_client_js, set: (value) => disk_path_client_js = value });
		Object.defineProperty(this, 'source_path_client_js', { get: () => disk_path_client_js, set: (value) => disk_path_client_js = value });

		let Ctrl = spec.Ctrl || undefined
		Object.defineProperty(this, 'Ctrl', { get: () => Ctrl, set: value => Ctrl = value })
		let name = spec.name || undefined;
		Object.defineProperty(this, 'name', { get: () => name, set: value => name = value })
		this.__type_name = __type_name || 'server';

		// Middleware pipeline — an ordered array of (req, res, next) functions
		// that run before every request reaches the router.  Populated via
		// server.use(fn).  See docs/middleware-guide.md for details.
		this._middleware = [];

		const resource_pool = this.resource_pool = new Server_Resource_Pool({
			'access': {
				'full': ['server_admin']
			}
		});
		const server_router = this.server_router = new Router({
			'name': 'Server Router',
			'pool': resource_pool
		});
		resource_pool.add(server_router);
		this.https_options = spec.https_options || undefined;

		// Admin Module Setup
		// Admin Module Setup
		const Admin_Module = require('./admin-ui/server');
		this.admin = new Admin_Module(this);
		this.admin.attach_to_router(server_router);

		// Register Admin Page Route
		let Admin_Page_Control;
		try {
			console.log('DEBUG: Attempting to load Admin_Page_Control...');
			Admin_Page_Control = require('./admin-ui/client').controls.Admin_Page;
			console.log('DEBUG: Admin_Page_Control type:', typeof Admin_Page_Control);
		} catch (e) {
			console.warn('DEBUG: Failed to load Admin_Page_Control', e);
		}

		if (Admin_Page_Control) {
			console.log('DEBUG: Creating Admin Webpage...');
			const admin_app = new Webpage({
				content: Admin_Page_Control,
				title: 'jsgui3 Admin'
			});

			const HTTP_Webpage_Publisher = require('./publishers/http-webpage-publisher');
			console.log('DEBUG: Creating Admin Publisher...');
			const admin_publisher = new HTTP_Webpage_Publisher({
				name: 'Admin_Publisher',
				webpage: admin_app,
				//src_path_client_js: require('path').join(__dirname, 'admin-ui/client.js')
			});
			// Fix for Resource_Pool.add(undefined) error
			admin_publisher.name = 'Admin_Publisher';

			admin_publisher.on('ready', (res_ready) => {
				if (res_ready._arr) {
					for (const bundle_item of res_ready._arr) {
						const { route } = bundle_item;
						const Static_Route_HTTP_Responder = require('./http/responders/static/Static_Route_HTTP_Responder');
						const responder = new Static_Route_HTTP_Responder(bundle_item);
						server_router.set_route(route, responder, responder.handle_http);
					}
				}
			});

			server_router.set_route('/admin', admin_publisher, admin_publisher.handle_http);
			console.log('DEBUG: Adding admin_publisher to pool:', !!admin_publisher);
			if (admin_publisher) {
				resource_pool.add(admin_publisher);
			} else {
				console.error('DEBUG: admin_publisher is undefined!');
			}
		} else {
			console.warn('Skipping /admin route registration due to missing control.');
		}

		// ─── Admin UI V1 (Dashboard with Stat Cards) ─────────
		// Configurable via spec.admin:
		//   spec.admin === false              → disable admin entirely
		//   spec.admin = { enabled: false }   → disable admin entirely
		//   spec.admin = { sections: [...] }  → add custom sidebar sections
		//   spec.admin = { endpoints: [...] } → add custom protected endpoints
		const admin_config = spec.admin !== undefined ? spec.admin : {};
		const admin_enabled = admin_config !== false && (admin_config.enabled !== false);

		const Admin_Module_V1 = require('./admin-ui/v1/server');
		if (admin_enabled) {
		this.admin_v1 = new Admin_Module_V1(typeof admin_config === 'object' ? admin_config : {});
		this.admin_v1.init(this);

		// Register Admin V1 Page Route
		let Admin_Shell_Control;
		try {
			Admin_Shell_Control = require('./admin-ui/v1/client').controls.Admin_Shell;
		} catch (e) {
			console.warn('Failed to load Admin_Shell control:', e.message || e);
		}

		if (Admin_Shell_Control) {
			const admin_v1_app = new Webpage({
				content: Admin_Shell_Control,
				title: 'jsgui3 Admin Dashboard'
			});

			const admin_v1_publisher = new HTTP_Webpage_Publisher({
				name: 'Admin_V1_Publisher',
				webpage: admin_v1_app,
				src_path_client_js: lib_path.join(__dirname, 'admin-ui/v1/client.js')
			});
			admin_v1_publisher.name = 'Admin_V1_Publisher';

			const is_dev_defaults = !process.env.ADMIN_V1_PASSWORD && process.env.NODE_ENV !== 'production';
			const login_hint = is_dev_defaults
				? '<div class="hint dev-creds">Dev defaults active — username: <code>admin</code> password: <code>admin</code></div><div class="hint">Set ADMIN_V1_USER / ADMIN_V1_PASSWORD env vars for production.</div>'
				: '<div class="hint">Sign in with your configured credentials.</div>';
			const login_html = `<!doctype html>
<html>
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Admin Login</title>
	<style>
		body { margin:0; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; background:#111428; color:#e8e8f0; display:flex; align-items:center; justify-content:center; min-height:100vh; }
		.card { width: 340px; background:#1b1f38; border:1px solid #2f3358; border-radius:10px; padding:20px; }
		h1 { margin:0 0 16px; font-size:1rem; }
		label { display:block; margin:10px 0 6px; font-size:0.8rem; color:#9aa0c8; }
		input { width:100%; box-sizing:border-box; background:#13162a; border:1px solid #2e345c; color:#e8e8f0; border-radius:6px; padding:8px 10px; }
		button { margin-top:14px; width:100%; border:1px solid #4facfe; background:#224267; color:#d3ebff; border-radius:6px; padding:8px 10px; cursor:pointer; }
		.err { margin-top:10px; color:#ff8e9f; font-size:0.8rem; min-height:1.1rem; }
		.hint { margin-top:12px; color:#7f86b3; font-size:0.75rem; }
		.dev-creds { color:#43e97b; }
		code { background:#13162a; padding:2px 6px; border-radius:4px; font-size:0.8rem; }
	</style>
</head>
<body>
	<div class="card">
		<h1>jsgui3 Admin Login</h1>
		<form id="login-form">
			<label for="username">Username</label>
			<input id="username" autocomplete="username" required />
			<label for="password">Password</label>
			<input id="password" type="password" autocomplete="current-password" required />
			<button type="submit">Sign In</button>
			<div class="err" id="err"></div>
			${login_hint}
		</form>
	</div>
	<script>
		(async () => {
			try {
				const session = await fetch('/api/admin/v1/auth/session', { credentials: 'same-origin' }).then(r => r.json());
				if (session && session.authenticated) {
					location.replace('/admin/v1');
					return;
				}
			} catch (e) {}

			const form = document.getElementById('login-form');
			const err = document.getElementById('err');
			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				err.textContent = '';
				const username = document.getElementById('username').value;
				const password = document.getElementById('password').value;
				try {
					const res = await fetch('/api/admin/v1/auth/login', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						credentials: 'same-origin',
						body: JSON.stringify({ username, password })
					});
					const data = await res.json();
					if (!res.ok || !data.ok) {
						err.textContent = data && data.error ? data.error : 'Login failed';
						return;
					}
					location.replace('/admin/v1');
				} catch (e2) {
					err.textContent = 'Network error';
				}
			});
		})();
	</script>
</body>
</html>`;

			const serve_admin_v1_page = (req, res) => {
				if (req && typeof req.url === 'string' && req.url.startsWith('/admin/v1/login')) {
					res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
					res.end(login_html);
					return;
				}

				if (!this.admin_v1 || !this.admin_v1.is_admin_read_request(req)) {
					res.writeHead(302, { Location: '/admin/v1/login' });
					res.end();
					return;
				}
				if (admin_v1_cached_html) {
					res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
					res.end(admin_v1_cached_html);
				} else {
					res.writeHead(503, { 'Content-Type': 'text/plain' });
					res.end('Admin UI v1 is loading, please retry...');
				}
			};

			server_router.set_route('/admin/v1/login', null, (req, res) => {
				res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
				res.end(login_html);
			});

			// Namespace admin v1 assets under /admin/v1/ to avoid
			// colliding with the main app's /js/js.js and /css/css.css.
			let admin_v1_cached_html = null;

			admin_v1_publisher.on('ready', (res_ready) => {
				if (res_ready && res_ready._arr) {
					for (const bundle_item of res_ready._arr) {
						const { type } = bundle_item;
						if (type === 'HTML') {
							// Rewrite asset references so browser fetches
							// the admin-specific JS/CSS, not the main app's.
							let html = bundle_item.text || '';
							html = html.replace(
								/href="\/css\/css\.css"/g,
								'href="/admin/v1/css/css.css"'
							);
							html = html.replace(
								/src="\/js\/js\.js"/g,
								'src="/admin/v1/js/js.js"'
							);
							// Inject viewport meta for mobile rendering
							if (!html.includes('name="viewport"')) {
								html = html.replace(
									/<head([^>]*)>/i,
									'<head$1><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'
								);
							}
							admin_v1_cached_html = html;
						} else {
							// JS → /admin/v1/js/js.js, CSS → /admin/v1/css/css.css
							const namespaced_route =
								type === 'JavaScript' ? '/admin/v1/js/js.js' :
								type === 'CSS'        ? '/admin/v1/css/css.css' :
								'/admin/v1' + bundle_item.route;
							const responder = new Static_Route_HTTP_Responder(bundle_item);
							server_router.set_route(namespaced_route, responder, responder.handle_http);
						}
					}

					// Serve authenticated admin page at /admin/v1
					server_router.set_route('/admin/v1', null, serve_admin_v1_page);
				}
			});

			// Temporary handler until the publisher finishes bundling
			server_router.set_route('/admin/v1', null, serve_admin_v1_page);
			resource_pool.add(admin_v1_publisher);
		} else {
			console.warn('Skipping /admin/v1 route registration due to missing Admin_Shell control.');
		}
		} else {
			// admin_enabled === false
			this.admin_v1 = null;
		}

		if (spec.routes) {
			throw 'NYI - will use Website class rather than Website_Resource here'
			each(spec.routes, (app_spec, route) => {
				var app = this.app = new Website_Resource(app_spec);
				resource_pool.add(app);
				server_router.set_route(route, app, app.process);
			});
		}
		const opts_website = {
			'name': this.name || 'Website'
		};
		const opts_webpage = {
			'name': this.name || 'Website'
		};

		if (Ctrl) {


			const wp_app = new Webpage({ content: Ctrl });

			const opts_wp_publisher = {
				'webpage': wp_app

			};
			if (bundler_config !== undefined) opts_wp_publisher.bundler = bundler_config;

			if (this.debug) {
				opts_wp_publisher.debug = this.debug;
			}

			if (disk_path_client_js) opts_wp_publisher.src_path_client_js = disk_path_client_js;
			if (style_config !== undefined) opts_wp_publisher.style = style_config;



			// HTTP_Webpage_Publisher probably needs to build the JavaScript. Possibly other assets too.
			const wp_publisher = new HTTP_Webpage_Publisher(opts_wp_publisher);
			// Specific options for when that publisher is in debug mode.


			console.log('waiting for wp_publisher ready');
			wp_publisher.on('ready', (wp_ready_res) => {
				//console.log('wp publisher is ready');
				if (wp_ready_res._arr) {


					for (const bundle_item of wp_ready_res._arr) {
						//console.log('Object.keys(bundle_item)', Object.keys(bundle_item));
						const { type, extension, text, route, response_buffers, response_headers } = bundle_item;
						const bundle_item_http_responder = new Static_Route_HTTP_Responder(bundle_item);


						server_router.set_route(route, bundle_item_http_responder, bundle_item_http_responder.handle_http);


					}


					//console.trace();
					//throw 'stop';

				} else {
					console.trace();
					throw 'NYI';
				}

				const ws_resource = new Website_Resource({
					'name': 'Website_Resource - Single Webpage',
					'webpage': wp_app
				});
				console.log('DEBUG: Adding ws_resource to pool:', !!ws_resource);
				if (ws_resource) {
					resource_pool.add(ws_resource);
				} else {
					console.error('DEBUG: ws_resource is undefined!');
				}
				this.raise('ready');
			});


		} else {
			// Check if this is an API-only server (no website needed)
			if (spec.website === false) {
				// API-only server: emit ready immediately after router setup
				this.raise('ready');
				return;
			}

			// Ahhh the web page publisher may be used instead of the website publisher.
			//   See about making use of relevant shared abstractions.


			const ws_app = this.app = this.website = new Website(opts_website);
			// Be able to treat Webpage as an app?

			const opts_ws_publisher = {
				'website': ws_app
			};
			if (disk_path_client_js) {
				opts_ws_publisher.disk_path_client_js = disk_path_client_js;
			}
			if (bundler_config !== undefined) {
				opts_ws_publisher.bundler = bundler_config;
			}
			if (style_config !== undefined) {
				opts_ws_publisher.style = style_config;
			}
			const ws_publisher = new HTTP_Website_Publisher(opts_ws_publisher);
			this._ws_publisher = ws_publisher;
			ws_publisher.on('ready', () => {
				console.log('ws publisher is ready');
				const ws_resource = new Website_Resource({
					'name': 'Website Resource',
					'website': ws_app
				});
				resource_pool.add(ws_resource);
				server_router.set_route('/*', ws_publisher, ws_publisher.handle_http);
				this.raise('ready');
			});
		}


		Object.defineProperty(this, 'router', { get: () => server_router })
	}

	publish(name, fn) {
		// Get the function publisher.
		//   Possibly ensure it exists.
		//const fn_publisher = this.function_publisher;
		//fn_publisher.add(name, fn);
		const fpub = new HTTP_Function_Publisher({ name, fn });

		this.function_publishers = this.function_publishers || [];
		this.function_publishers.push(fpub);

		// Auto-prefix /api/ for simple names
		// If name already starts with '/', use as-is for full route control
		const full_route = name.startsWith('/') ? name : '/api/' + name;
		this.server_router.set_route(full_route, fpub, fpub.handle_http);
	}

	publish_observable(route, obs, options = {}) {
		const publisher = new HTTP_Observable_Publisher({
			obs,
			...options
		});
		// Auto-prefix /api/ for simple names (like publish() does)
		// If route already starts with '/', use as-is for backward compatibility
		const full_route = route.startsWith('/') ? route : '/api/' + route;
		this.server_router.set_route(full_route, publisher, publisher.handle_http);
		return publisher;
	}

	publishObservable(route, obs, options) {
		return this.publish_observable(route, obs, options);
	}

	/**
	 * Register middleware to run before every request is routed.
	 *
	 * Middleware signature: `function (req, res, next) { ... }`
	 * Call `next()` to continue to the next middleware / router.
	 * Call `next(err)` to short-circuit into the error handler.
	 *
	 * @param {function} fn  Middleware function.
	 * @returns {this}       The server instance (for chaining).
	 *
	 * @example
	 * const { compression } = require('jsgui3-server/middleware');
	 * server.use(compression());
	 */
	use(fn) {
		if (typeof fn !== 'function') {
			throw new Error('Middleware must be a function (req, res, next).');
		}
		this._middleware.push(fn);
		return this;
	}

	get resource_names() {
		return this.resource_pool.resource_names;
	}
	'start'(port, callback, fnProcessRequest) {
		// Guard against double-start which causes EADDRINUSE
		if (this._started) {
			console.warn('Server.start() called but server already started. Ignoring duplicate call.');
			if (callback) callback(null, true);
			return;
		}
		this._started = true;

		if (tof(port) !== 'number') {
			console.log('Invalid port:', port);
			console.trace();
			throw 'stop';
		}
		const rp = this.resource_pool;
		if (!rp) {
			throw 'stop';
		}
		this.raise('starting');
		rp.start(err => {
			if (err) {
				throw err;
			} else {
				const lsi = rp.get_resource('Local Server Info');
				const server_router = rp.get_resource('Server Router');
				lsi.getters.net((err, net) => {
					if (err) {
						callback(err);
					} else {
						// NEW: Filter addresses by allowed_addresses if specified.
						let arr_ipv4_addresses = [];
						each(net, (arr_addresses, name) => {
							each(arr_addresses, (obj_address) => {
								if (obj_address.family === 'IPv4') {
									arr_ipv4_addresses.push(obj_address.address);
								}
							});
						});
						if (this.allowed_addresses && this.allowed_addresses.length) {
							arr_ipv4_addresses = arr_ipv4_addresses.filter(a => this.allowed_addresses.indexOf(a) > -1);
						}
						arr_ipv4_addresses = [...new Set(arr_ipv4_addresses)];
						console.log('IPv4 addresses to bind:', arr_ipv4_addresses);
						let num_to_start = arr_ipv4_addresses.length;
						let started_count = 0;
						let last_error = null;
						let ready_raised = false;
						if (num_to_start === 0) {
							callback('No allowed network interfaces found.');
							return;
						}
						const finalize_start = (err) => {
							if (num_to_start !== 0) return;
							if (started_count > 0) {
								if (!ready_raised) {
									console.log('Server ready');
									this.raise('listening'); // Changed from 'ready' to avoid double-fire
									ready_raised = true;
								}
								if (callback) callback(null, true);
								return;
							}
							const final_error = err || last_error || new Error('No servers started.');
							if (callback) callback(final_error);
						};
						const respond_not_found = (res) => {
							if (!res.headersSent) {
								const body = 'Not Found';
								res.statusCode = 404;
								res.setHeader('Content-Type', 'text/plain; charset=utf-8');
								res.setHeader('Content-Length', Buffer.byteLength(body));
								res.end(body);
							} else if (!res.writableEnded) {
								res.end();
							}
						};

						const respond_error = (res, err) => {
							console.error('router error:', err);
							if (!res.headersSent) {
								const body = 'Internal Server Error';
								res.statusCode = 500;
								res.setHeader('Content-Type', 'text/plain; charset=utf-8');
								res.setHeader('Content-Length', Buffer.byteLength(body));
								res.end(body);
							} else if (!res.writableEnded) {
								res.end();
							}
						};

						// Central request handler — runs the middleware chain then
						// forwards to the router.  If the middleware array is empty
						// (the common case before server.use() is called), the
						// router is invoked directly with zero overhead.
						const process_request = (req, res) => {
							const route_request = () => {
								let outcome;
								try {
									outcome = server_router.process(req, res);
								} catch (err) {
									respond_error(res, err);
									return;
								}
								if (!outcome) {
									if (!res.writableEnded) {
										respond_not_found(res);
									}
									return;
								}
								if (typeof outcome === 'object') {
									if (outcome.status === 'error') {
										if (!res.writableEnded) {
											respond_error(res, outcome.error);
										}
									} else if (outcome.handled !== true && outcome.status === 'not-found') {
										if (!res.writableEnded) {
											respond_not_found(res);
										}
									}
								} else if (outcome === false && !res.writableEnded) {
									respond_not_found(res);
								}
							};

							// ── Middleware chain ──────────────────────────
							// Walk through this._middleware in order.  Each
							// middleware calls next() to advance; next(err)
							// short-circuits into respond_error.  After the
							// last middleware calls next(), route_request()
							// hands off to the router.
							const middleware = this._middleware;
							if (!middleware.length) {
								route_request();
								return;
							}
							let idx = 0;
							const next = (err) => {
								if (err) { respond_error(res, err); return; }
								if (idx >= middleware.length) { route_request(); return; }
								const mw = middleware[idx++];
								try {
									mw(req, res, next);
								} catch (e) {
									respond_error(res, e);
								}
							};
							next();
						};

						if (this.https_options) {
							each(arr_ipv4_addresses, (ipv4_address) => {
								try {
									var https_server = https.createServer(this.https_options, function (req, res) {
										process_request(req, res);
									});
									this.http_servers.push(https_server);
									https_server.on('error', (err) => {
										last_error = err;
										if (err.code === 'EACCES') {
											console.error('Permission denied:', err.message);
										} else if (err.code === 'EADDRINUSE') {
											console.error(`Address ${ipv4_address}:${port} already in use; skipping.`);
										} else {
											console.error('https_server error:', err);
										}
										num_to_start--;
										finalize_start(err);
									});
									https_server.timeout = 10800000;
									https_server.listen(port, ipv4_address, () => {
										console.log('* Server running at https://' + ipv4_address + ':' + port + '/');
										started_count++;
										num_to_start--;
										finalize_start(null);
									});
								} catch (err) {
									console.log('https_server err', err);
									num_to_start--;
									finalize_start(err);
								}
							});
						} else {
							each(arr_ipv4_addresses, (ipv4_address) => {
								try {
									var http_server = http.createServer(function (req, res) {
										process_request(req, res);
									});
									this.http_servers.push(http_server);
									http_server.on('error', (err) => {
										last_error = err;
										if (err.code === 'EACCES') {
											console.error('Permission denied:', err.message);
										} else if (err.code === 'EADDRINUSE') {
											console.error(`Address ${ipv4_address}:${port} already in use; skipping.`);
										} else {
											console.error('http_server error:', err);
										}
										num_to_start--;
										finalize_start(err);
									});
									http_server.timeout = 10800000;
									http_server.listen(port, ipv4_address, () => {
										console.log('* Server running at http://' + ipv4_address + ':' + port + '/');
										started_count++;
										num_to_start--;
										finalize_start(null);
									});
								} catch (err) {
									console.log('http_server err', err);
									num_to_start--;
									finalize_start(err);
								}
							});
						}
					}
				});
			}
		});
	}

	close(callback) {
		const invoke_stop = (target, done) => {
			if (!target || typeof target.stop !== 'function') {
				done(null);
				return;
			}

			if (target.stop.length >= 1) {
				target.stop((error) => done(error || null));
				return;
			}

			try {
				const stop_result = target.stop();
				if (stop_result && typeof stop_result.then === 'function') {
					stop_result.then(() => done(null), (error) => done(error || null));
					return;
				}
				done(null);
			} catch (error) {
				done(error);
			}
		};

		const close_http_servers = (done) => {
			let count = this.http_servers.length;
			if (count === 0) {
				this.http_servers = [];
				done();
				return;
			}

			this.http_servers.forEach(server => {
				server.close(() => {
					count--;
					if (count === 0) {
						this.http_servers = [];
						done();
					}
				});
			});
		};

		const finalize_close = (error) => {
			if (callback) callback(error || null);
		};

		const stop_targets = [];
		if (this.resource_pool) {
			stop_targets.push(this.resource_pool);
		}
		if (this.sse_publisher) {
			stop_targets.push(this.sse_publisher);
		}
		if (this.admin_v1 && typeof this.admin_v1.destroy === 'function') {
			this.admin_v1.destroy();
		}

		if (stop_targets.length === 0) {
			close_http_servers(() => finalize_close(null));
			return;
		}

		let pending_stops = stop_targets.length;
		const stop_errors = [];
		const on_stop_complete = (error) => {
			if (error) {
				stop_errors.push(error);
			}
			pending_stops--;
			if (pending_stops > 0) {
				return;
			}
			const first_error = stop_errors.length > 0 ? stop_errors[0] : null;
			close_http_servers(() => finalize_close(first_error));
		};

		stop_targets.forEach((target) => {
			invoke_stop(target, on_stop_complete);
		});
	}
}

JSGUI_Single_Process_Server.jsgui = jsgui;

JSGUI_Single_Process_Server.Resource = Resource;
JSGUI_Single_Process_Server.Resource.Process = Process_Resource;
JSGUI_Single_Process_Server.Resource.Remote_Process = Remote_Process_Resource;
JSGUI_Single_Process_Server.Page_Context = Server_Page_Context;
JSGUI_Single_Process_Server.Server_Page_Context = Server_Page_Context;
JSGUI_Single_Process_Server.Website_Resource = Website_Resource;
JSGUI_Single_Process_Server.Publishers = Publishers;
JSGUI_Single_Process_Server.Process_Resource = Process_Resource;
JSGUI_Single_Process_Server.Remote_Process_Resource = Remote_Process_Resource;
JSGUI_Single_Process_Server.HTTP_SSE_Publisher = HTTP_SSE_Publisher;

// Admin UI extensibility exports
JSGUI_Single_Process_Server.Admin_Module_V1 = require('./admin-ui/v1/server');
JSGUI_Single_Process_Server.Admin_Auth_Service = require('./admin-ui/v1/admin_auth_service');
JSGUI_Single_Process_Server.Admin_User_Store = require('./admin-ui/v1/admin_user_store');

// Built-in middleware — accessed as Server.middleware.compression etc.
// See docs/middleware-guide.md for the full API reference.
JSGUI_Single_Process_Server.middleware = require('./middleware');

JSGUI_Single_Process_Server.serve = require('./serve-factory')(JSGUI_Single_Process_Server);

module.exports = JSGUI_Single_Process_Server;


if (require.main === module) {
	const args = process.argv.slice(2);
	let port = 80;
	if (args.length === 1) {
		const i = parseInt(args[0]);
		if (typeof i === 'number') {
			port = i;
		}
	}
	const server = new JSGUI_Single_Process_Server({
		name: 'jsgui3 server (command line)'
	});
	const current = () => {
		server.start(8080);
	}
	current();

} else { }

// 

const summary = {
	"classes": [
		"JSGUI_Single_Process_Server",
		"Server_Resource_Pool",
		"Router",
		"Website_Resource",
		"Server_Page_Context",
		"Web_Admin_Page_Control",
		"Web_Admin_Panel_Control",
		"Website",
		"HTTP_Website_Publisher",
		"Webpage"
	],
	"methods": {
		"JSGUI_Single_Process_Server": [
			"constructor",
			"start",
			"stop"
		],
		"Server_Resource_Pool": [
			"constructor"
		],
		"Router": [
			"constructor",
			"set_route",
			"unset_route"
		],
		"Website_Resource": [
			"constructor",
			"process"
		],
		"Server_Page_Context": [
			"constructor",
			"respond_string"
		],
		"Web_Admin_Page_Control": [
			"constructor"
		],
		"Web_Admin_Panel_Control": [
			"constructor"
		],
		"Website": [
			"constructor",
			"add_page",
			"add_page_resource",
			"add_page_resource_from_webpage"
		],
		"HTTP_Website_Publisher": [
			"constructor"
		],
		"Webpage": [
			"constructor"
		]
	}
}

JSGUI_Single_Process_Server.summary = summary;
