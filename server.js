const jsgui = require('jsgui3-html'),
	http = require('http'),
	https = require('https'),
    {prop, read_only} = require('obext'),
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
const HTTP_Website_Publisher = require('./publishing/http-website-publisher');
const Webpage = require('./website/webpage');
class JSGUI_Server extends Evented_Class {
	constructor(spec = {
		website: true
	}, __type_name) {
		super();
		let disk_path_client_js;
		if (spec.disk_path_client_js) {
			disk_path_client_js = spec.disk_path_client_js;
		};
		Object.defineProperty(this, 'disk_path_client_js', {
			get() {
				return disk_path_client_js;
			},
			set(value) {
				disk_path_client_js = value;
			}
		});
		let Ctrl;
		if (spec.Ctrl) {
			Ctrl = spec.Ctrl;
		};


		Object.defineProperty(this, 'Ctrl', {
			get() {
				return Ctrl;
			},
			set(value) {
				Ctrl = value;
			}
		});

        
		let name;
		if (spec.name) {
			name = spec.name;
		};
		Object.defineProperty(this, 'name', {
			get() {
				return name;
			},
			set(value) {
				name = value;
			}
		});
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
		if (spec.https_options) {
			this.https_options = spec.https_options;
		}
		if (spec.routes) {
			throw 'NYI - will use Website class rather than Website_Resource here'
			each(spec.routes, (app_spec, route) => {
				var app = this.app = new Website_Resource(app_spec);
				resource_pool.add(app);
				server_router.set_route(route, app, app.process);
			});
		}
		if (true) {
			const old = () => {
				const app = this.app = new Website_Resource({
					name: 'Website'
				});
				resource_pool.add(app);
				server_router.set_route('/*', app.process);
			}
			const current = () => {
				const opts_website = {
					'name': this.name || 'Website'
				};
				if (Ctrl) {
					opts_website.content = Ctrl;
				}
				const ws_app = this.app = new Website(opts_website);
				const opts_ws_publisher = {
					'website': ws_app
				};
				if (disk_path_client_js) {
					opts_ws_publisher.disk_path_client_js = disk_path_client_js;
				}
				const ws_publisher = new HTTP_Website_Publisher(opts_ws_publisher);
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
			current();
		}
		Object.defineProperty(this, 'router', {
			get() {
				return server_router;
			}
		});
	}
	get resource_names() {
		return this.resource_pool.resource_names;
	}
	'start' (port, callback, fnProcessRequest) {
		if (tof(port) !== 'number') {
			console.trace();
			throw 'stop';
		}
		const rp = this.resource_pool;
		if (!rp) {
			throw 'stop';
		}
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
						var arr_ipv4_addresses = [];
						each(net, (arr_addresses, name) => {
							each(arr_addresses, (obj_address) => {
								if (obj_address.family === 'IPv4') {
									arr_ipv4_addresses.push(obj_address.address);
								}
							})
						});
						let num_to_start = arr_ipv4_addresses.length;
						if (this.https_options) {
							each(arr_ipv4_addresses, (ipv4_address) => {
								var https_server = https.createServer(this.https_options, function(req, res) {
									var server_routing_res = server_router.process(req, res);
								});
								https_server.timeout = 10800000;
								https_server.listen(port, ipv4_address);
								console.log('* Server running at https://' + ipv4_address + ':' + port + '/');
								num_to_start--;
								if (num_to_start === 0) {
									if (callback) callback(null, true);
								}
							});
						} else {
							each(arr_ipv4_addresses, (ipv4_address) => {
								var http_server = http.createServer(function(req, res) {
									var server_routing_res = server_router.process(req, res);
								});
								http_server.timeout = 10800000;
								http_server.listen(port, ipv4_address);
								console.log('* Server running at http://' + ipv4_address + ':' + port + '/');
								num_to_start--;
								if (num_to_start === 0) {
									if (callback) callback(null, true);
								}
							});
						}
					}
				});
			}
		});
	}
	'process_request' (req, res) {
		throw 'request should be processed elsewhere, such as the router'
		var url = req.url;
		var s_url = url.split('/');
		var a_path = [];
		each(s_url, (v, i) => {
			if (v.length > 0) {
				a_path.push(v);
			}
		});
		var router = this.get('router');
		if (a_path.length > 0) {
			var routing_res = router.process(req, res);
		} else {
			console.log('need to process short path');
		}
	}
	'serve_document' (req, res, jsgui_html_document) {
		throw 'deprecating.';
		var html = jsgui_html_document.all_html_render();
		var mime_type = 'text/html';
		res.writeHead(200, {
			'Content-Type': mime_type
		});
		res.end(html, 'utf-8');
	}
}
JSGUI_Server.HTML = require('jsgui3-html');
JSGUI_Server.Resource = Resource;
JSGUI_Server.Page_Context = Server_Page_Context;
JSGUI_Server.Server_Page_Context = Server_Page_Context;
JSGUI_Server.Website_Resource = Website_Resource;
module.exports = JSGUI_Server;
if (require.main === module) {
	const args = process.argv.slice(2);
	let port = 80;
	if (args.length === 1) {
		const i = parseInt(args[0]);
		if (typeof i === 'number') {
			port = i;
		}
	}
	const server = new JSGUI_Server({
		name: 'jsgui3 server (command line)'
	});
	const current = () => {
		server.start(8080);
	}
	current();
	const old = () => {
		const app_admin = new Website_Resource({
			name: 'Admin Website'
		});
		server.resource_pool.add(app_admin);
		let js = app_admin.resource_pool['Site JavaScript'];
		let js_client = lib_path.resolve('./controls/page/admin.js');
		let o_serve_package = {
			'babel': 'mini'
		}
		js.serve_package('admin/js/app.js', js_client, o_serve_package, (err, served) => {
			if (err) {
				console.log('err', err);
				throw 'stop';
			} else {
				if (served) {
					console.log('served', served);
					const prepare_app = () => {
						const server_router = server.router;
						if (!server_router) {
							throw 'no server_router';
						}
						var routing_tree = server_router.routing_tree;
						routing_tree.set('admin', (req, res) => {
							const o_spc = {
								'req': req,
								'res': res,
								'resource_pool': app_admin.resource_pool
							}
							if (this.include_server_ref_in_page_context) o_spc.server = this;
							var server_page_context = new Server_Page_Context(o_spc);
							if (this.context_data) {
								Object.assign(server_page_context, this.context_data);
							}
							var hd = new jsgui.Client_HTML_Document({
								'context': server_page_context
							});
							hd.include_client_css();
							hd.include_css('/admin/css/basic.css');
							if (this.css) {
								each(this.css, (path, serve_as) => {
									hd.include_css('/admin/css/' + serve_as);
								});
							}
							const body = hd.body;
							let o_params = this.params || {};
							Object.assign(o_params, {
								'context': server_page_context
							});
							const ctrl = this.ctrl = new Web_Admin_Panel_Control(o_params);
							ctrl.active();
							body.add(ctrl);
							hd.include_js('/admin/js/app.js');
							let statement_rsr;
							let statement_context_data;
							let statements = [];
							if (app_admin.def_resource_publishers) {
								const c = Object.keys(app_admin.def_resource_publishers).length;
								if (c > 0) {
									statement_rsr = `jsgui.register_server_resources(${JSON.stringify(app_admin.def_resource_publishers)});`;
									statements.push(statement_rsr);
								}
							}
							if (statements.length > 0) {
								let resources_script = new jsgui.script({
									context: server_page_context
								});
								const strc = new jsgui.String_Control({
									context: server_page_context,
									text: statements.join('')
								});
								resources_script.add(strc);
								body.add(resources_script);
							}
							hd.all_html_render(function(err, deferred_html) {
								if (err) {
									throw err;
								} else {
									var mime_type = 'text/html';
									res.writeHead(200, {
										'Content-Type': mime_type
									});
									res.end('<!DOCTYPE html>' + deferred_html, 'utf-8');
								}
							});
						});
					}
					prepare_app();
					server.start(port, (err, obj_start) => {
						if (err) {
							console.log('There was an error starting the server: \n', err);
						} else {
							console.log('Server started on port: ' + port);
						}
					});
				} else {
					throw 'stop';
				}
			}
		});
		const start_it = () => {
			server.start(port, (err, obj_start) => {
				if (err) {
					console.log('There was an error starting the server: \n', err);
				} else {
					console.log('Server started on port: ' + port);
					const do_more_post_start = () => {
						let wr = server.resource_pool.get_resource('Website Resource');
						console.log('server.resource_pool', server.resource_pool);
						console.log('wr', wr);
						throw 'stop';
						server.router.set_route('admin', (req, res) => {
							const pc = new Server_Page_Context({
								req: req,
								res: res
							});
							const hd = new Web_Admin_Page_Control({
								'context': pc
							});
							hd.include_client_css();
							hd.include_css('/css/basic.css');
							hd.include_css('/css/controls.css');
							hd.include_js('/js/app.js');
							hd.all_html_render(function(err, deferred_html) {
								if (err) {
									throw err;
								} else {
									var mime_type = 'text/html';
									res.writeHead(200, {
										'Content-Type': mime_type
									});
									res.end('<!DOCTYPE html>' + deferred_html, 'utf-8');
								}
							});
						});
					}
				}
			});
		}
	}
} else {}