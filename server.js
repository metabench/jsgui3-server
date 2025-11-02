const jsgui = require('jsgui3-html'),
	http = require('http'),
	https = require('https'),
    {prop, read_only} = require('obext'),
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

		// or src_path_client_js as well...

		Object.defineProperty(this, 'disk_path_client_js', {get: () => disk_path_client_js, set: (value) => disk_path_client_js = value});
		Object.defineProperty(this, 'src_path_client_js', {get: () => disk_path_client_js, set: (value) => disk_path_client_js = value});
		Object.defineProperty(this, 'source_path_client_js', {get: () => disk_path_client_js, set: (value) => disk_path_client_js = value});

		let Ctrl = spec.Ctrl || undefined
		Object.defineProperty(this, 'Ctrl', {get: () => Ctrl, set: value => Ctrl = value})
		let name = spec.name || undefined;
		Object.defineProperty(this, 'name', {get: () => name, set: value => name = value})
		this.__type_name = __type_name || 'server';
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


			const wp_app = new Webpage({content: Ctrl});

			const opts_wp_publisher = {
				'webpage': wp_app

			};

			if (this.debug) {
				opts_wp_publisher.debug = this.debug;
			}

			if (disk_path_client_js) opts_wp_publisher.src_path_client_js = disk_path_client_js;



			// HTTP_Webpage_Publisher probably needs to build the JavaScript. Possibly other assets too.
			const wp_publisher = new HTTP_Webpage_Publisher(opts_wp_publisher);
			// Specific options for when that publisher is in debug mode.


			console.log('waiting for wp_publisher ready');
			wp_publisher.on('ready', (wp_ready_res) => {
				//console.log('wp publisher is ready');
				if (wp_ready_res._arr) {


					for (const bundle_item of wp_ready_res._arr) {
						//console.log('Object.keys(bundle_item)', Object.keys(bundle_item));
						const {type, extension, text, route, response_buffers, response_headers} = bundle_item;
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
				resource_pool.add(ws_resource);

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
		const fpub = new HTTP_Function_Publisher({name, fn});

		this.function_publishers = this.function_publishers || [];
		this.function_publishers.push(fpub);

		this.server_router.set_route('/api/' + name, fpub, fpub.handle_http);
	}


	get resource_names() {
		return this.resource_pool.resource_names;
	}
	'start' (port, callback, fnProcessRequest) {
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
						if (num_to_start === 0) {
							callback('No allowed network interfaces found.');
							return;
						}
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

						const process_request = (req, res) => {
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

						if (this.https_options) {
							each(arr_ipv4_addresses, (ipv4_address) => {
								try {
									var https_server = https.createServer(this.https_options, function(req, res) {
										process_request(req, res);
									});
									this.http_servers.push(https_server);
									https_server.on('error', (err) => {
										if (err.code === 'EACCES') {
											console.error('Permission denied:', err.message);
										} else if (err.code === 'EADDRINUSE') {
											console.error(`Address ${ipv4_address}:${port} already in use; skipping.`);
										} else {
											console.error('https_server error:', err);
										}
										num_to_start--;
										if (num_to_start === 0 && callback) callback(null, true);
									});
									https_server.timeout = 10800000;
									https_server.listen(port, ipv4_address, () => {
										console.log('* Server running at https://' + ipv4_address + ':' + port + '/');
										num_to_start--;
										if (num_to_start === 0) {
											console.log('Server ready');
											this.raise('ready');
											if (callback) callback(null, true);
										}
									});
								} catch (err) {
									console.log('https_server err', err);
									num_to_start--;
									if (num_to_start === 0 && callback) callback(null, true);
								}
							});
						} else {
						each(arr_ipv4_addresses, (ipv4_address) => {
								try {
								var http_server = http.createServer(function(req, res) {
									process_request(req, res);
								});
									this.http_servers.push(http_server);
									http_server.on('error', (err) => {
										if (err.code === 'EACCES') {
											console.error('Permission denied:', err.message);
										} else if (err.code === 'EADDRINUSE') {
											console.error(`Address ${ipv4_address}:${port} already in use; skipping.`);
										} else {
											console.error('http_server error:', err);
										}
										num_to_start--;
										if (num_to_start === 0 && callback) callback(null, true);
									});
									http_server.timeout = 10800000;
									http_server.listen(port, ipv4_address, () => {
										console.log('* Server running at http://' + ipv4_address + ':' + port + '/');
										num_to_start--;
										if (num_to_start === 0) {
											console.log('Server ready');
											this.raise('ready');
											if (callback) callback(null, true);
										}
									});
								} catch (err) {
									console.log('http_server err', err);
									num_to_start--;
									if (num_to_start === 0 && callback) callback(null, true);
								}
							});
						}
					}
				});
			}
		});
	}

	close(callback) {
		let count = this.http_servers.length;
		if (count === 0) {
			if (callback) process.nextTick(callback);
			return;
		}
		this.http_servers.forEach(server => {
			server.close(() => {
				count--;
				if (count === 0) {
					this.http_servers = [];
					if (callback) callback();
				}
			});
		});
	}
}

JSGUI_Single_Process_Server.jsgui = jsgui;

JSGUI_Single_Process_Server.Resource = Resource;
JSGUI_Single_Process_Server.Page_Context = Server_Page_Context;
JSGUI_Single_Process_Server.Server_Page_Context = Server_Page_Context;
JSGUI_Single_Process_Server.Website_Resource = Website_Resource;
JSGUI_Single_Process_Server.Publishers = Publishers;
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

} else {}

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
