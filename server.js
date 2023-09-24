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
const HTTP_Website_Publisher = require('./publishers/http-website-publisher');
const Webpage = require('./website/webpage');
const HTTP_Webpage_Publisher = require('./publishers/http-webpage-publisher');

// A class that contains resources and publishers?
// Is the server itself a publisher?
// Is this a Server_Process, whereby a Server could hold multiple processes?

// Think this is / should be a Server. Not sure though.
// Maybe Single_Process_Server ????
// Could make for cleaner debugs if we have multiples of them and maybe a Multi_Process_Coordinator_Server ???
//  Multi_Single_Process_Server_Coordinater_Server ???





class JSGUI_Single_Process_Server extends Evented_Class {
	constructor(spec = {
		website: true
	}, __type_name) {
		super();
		let disk_path_client_js;
		if (spec.disk_path_client_js) {
			disk_path_client_js = spec.disk_path_client_js;
		} else if (spec.src_path_client_js) {
			disk_path_client_js = spec.src_path_client_js;
		} else if (spec.source_path_client_js) {
			disk_path_client_js = spec.source_path_client_js;
		};

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

		// Seems like a decent mechanism already in here at the moment, but may want to make the API more powerful and flexible.


		
		if (Ctrl) {
			// could be a web page, not a web site.
			//  But a site can contain one page. Easy enough default?
			//   Though more directly serving a page seems simpler. More logical too, if we are not serving a site with it.
			//opts_website.content = Ctrl;
			//opts_webpage.content = Ctrl;

			// set up a web page with the ctrl, and a web page publisher.

			// But does that Webpage need (automatically or not) to include the necessary (built) JS client file?


			// May need to process / get info on the referenced JS first.
			//  Better to make something like a JS_File_Info_Provider than to do it here.
			//  Want a really DRY framework and to make it so slower parts can be upgraded as files and swapped as files.




			// Tell the webpage it needs to have a built version of the referenced client JS?

			// The Webpage is an app???


			// And give it the src_path_client_js ...?
			//  Best to be specific with the API, but make it fairly short and simple on the top level.

			// But the webpage needs to have stuff in its head that references the JS.
			//  But maybe the publisher could insert that.

			// Basically need to put everything in the relevant lower level abstraction and use it there.
			//  Need to make it very clear what is being done, but concise too.
			//  Really need to get it simply serving JS clients, extracting CSS from JS too.
			//   Want to make it easy to make some really interesting demos with very simple idiomatic code
			//   that is clear how it works both on client and server.

			// Could get more into 'undo button' type transformations, that's something React and Redux can do well,
			//  would be worth going into UI_Action classes or similar.
			//  UI_Action_Result too - but def want to keep it really simple on the top level, simple enough on the 2nd level,
			//  and then it can be moderately to very complex on 3rd level down (though there could be options like choosing which
			//  js build system to use).

			// Def looks like a fair bit more work to be done to get all the abstractions made and working to run simple apps,
			//   with really simple and efficient defaults.

			







			const wp_app = new Webpage({content: Ctrl});




			// And maybe by default the webpage publisher should make sure that the relevant JS and CSS is built / packaged and ready to serve.
			//  May need to give it one or two file paths.
			//  But if we give it those file path(s) do we need to provide that Ctrl in the first place?
			//   For the moment a single (or 2) extra properties should be fine.
			//  a client_src_js_path property should be fine.
			//  src_path_client_js
			//  or src_client_js as a string.



			const opts_wp_publisher = {
				'webpage': wp_app
			};

			

			// HTTP_Webpage_Publisher probably needs to build the JavaScript. Possibly other assets too.
			const wp_publisher = new HTTP_Webpage_Publisher(opts_wp_publisher);
			console.log('waiting for wp_publisher ready');

			// Server can (maybe just in theory) serve multiple websites at once.
			//   Worth making that more of a feature.
			//   For the moment, seems like new website resource inside server makes sense.
			//    Then does the website resource contain a lot of its own resources, in a pool???




			wp_publisher.on('ready', () => {
				console.log('wp publisher is ready');



				const wp_resource = new Website_Resource({
					'name': 'Website_Resource - Single Webpage',
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


JSGUI_Single_Process_Server.HTML = require('jsgui3-html');

// Also want Active_HTML_Document
//  or Active_HTML - needs to be simple to use, putting in the active stuff automatically.



JSGUI_Single_Process_Server.Resource = Resource;
JSGUI_Single_Process_Server.Page_Context = Server_Page_Context;
JSGUI_Single_Process_Server.Server_Page_Context = Server_Page_Context;
JSGUI_Single_Process_Server.Website_Resource = Website_Resource;
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
