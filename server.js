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
const HTTP_Webpage_Publisher = require('./publishing/http-webpage-publisher');

class JSGUI_Server extends Evented_Class {
	constructor(spec = {
		website: true
	}, __type_name) {
		super();
		let disk_path_client_js;
		if (spec.disk_path_client_js) {
			disk_path_client_js = spec.disk_path_client_js;
		};
		Object.defineProperty(this, 'disk_path_client_js', {get: () => disk_path_client_js, set: (value) => disk_path_client_js = value})
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
			// could be a web page, not a web site.
			//  But a site can contain one page. Easy enough default?
			//   Though more directly serving a page seems simpler. More logical too, if we are not serving a site with it.
			//opts_website.content = Ctrl;
			//opts_webpage.content = Ctrl;

			// set up a web page with the ctrl, and a web page publisher.

			const wp_app = new Webpage({content: Ctrl});
			const opts_wp_publisher = {
				'webpage': wp_app
			};
			const wp_publisher = new HTTP_Webpage_Publisher(opts_wp_publisher);
			console.log('waiting for wp_publisher ready');
			wp_publisher.on('ready', () => {
				console.log('wp publisher is ready');
				const wp_resource = new Website_Resource({
					'name': 'Webpage Resource',
					'webpage': wp_app
				});
				resource_pool.add(wp_resource);
				server_router.set_route('/', wp_publisher, wp_publisher.handle_http);
				this.raise('ready');
			});


		} else {
			const ws_app = this.app = new Website(opts_website);
			// Be able to treat Webpage as an app?

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


		
		Object.defineProperty(this, 'router', { get: () => server_router })
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

} else {}

// 

const summary = {
    "classes": [
        "JSGUI_Server",
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
        "JSGUI_Server": [
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
