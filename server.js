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


const Static_Route_HTTP_Responder = require('./http/responders/static/Static_Route_HTTP_Responder');


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

		// Seems like a decent mechanism already in here at the moment, but may want to make the API more powerful and flexible.

		// A single Ctrl that represents a page (could a Ctrl represent a site too? Could be possible with a bit of work.)


		
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

			if (this.debug) {
				opts_wp_publisher.debug = this.debug;
			}

			if (disk_path_client_js) opts_wp_publisher.src_path_client_js = disk_path_client_js;

			

			// HTTP_Webpage_Publisher probably needs to build the JavaScript. Possibly other assets too.
			const wp_publisher = new HTTP_Webpage_Publisher(opts_wp_publisher);
			// Specific options for when that publisher is in debug mode.


			console.log('waiting for wp_publisher ready');

			// Server can (maybe just in theory) serve multiple websites at once.
			//   Worth making that more of a feature.
			//   For the moment, seems like new website resource inside server makes sense.
			//    Then does the website resource contain a lot of its own resources, in a pool???


			// The publisher should (probably) set things up with the server itself....
			//   Give the publisher access to the server.
			//   Or access to a more limited number of functions that the publisher can call.

			// So the Publisher itself finds the Server Router and sets up routes on it, but uses very specific classes to help do that.

			// Maybe Http_Publisher on a lower level could put together headers and do compression.
			//   This part will be a little more like Express (and other) middleware.

			// http_publisher.publish_static_content_to_routes
			// .publish_static_bundle_to_routes









			wp_publisher.on('ready', (wp_ready_res) => {
				console.log('wp publisher is ready');

				// The ready res on complete(res) ???
				//   But the ready event does not (easily) carry this object.


				//console.log('wp_ready_res', wp_ready_res);

				// then go through the array....

				if (wp_ready_res._arr) {


					for (const bundle_item of wp_ready_res._arr) {
						//console.log('Object.keys(bundle_item)', Object.keys(bundle_item));

						

						const {type, extension, text, route, response_buffers, response_headers} = bundle_item;
						//console.log('');
						//console.log('bundle_item route:', route);
						//console.log('bundle_item type:', type);

						const bundle_item_http_responder = new Static_Route_HTTP_Responder(bundle_item);

						//console.log('bundle_item_http_responder.handle_http', bundle_item_http_responder.handle_http);

						// So set_route needs to set it up with the proper context for the handle_http call.
						//   At least it looks fairly close to being solved, though maybe Router and Routing tree
						//     should have comprehensive fixes and improvements.



						server_router.set_route(route, bundle_item_http_responder, bundle_item_http_responder.handle_http);


					}
	
					//console.trace();
					//throw 'stop';

				} else {
					console.trace();
					throw 'NYI';
				}

				// But do we get a bundle from it when ready?
				//  Maybe it should provide that bundle in the 'ready' event.




				const ws_resource = new Website_Resource({
					'name': 'Website_Resource - Single Webpage',
					'webpage': wp_app
				});
				resource_pool.add(ws_resource);

				// 


				// Possibly set multiple routes here, with multiple response buffers depending on the encoding-type
				//  accepted by the client.

				// Seems best not to rely on the Webpage_Publisher to handle the HTTP.
				//   Better for the Publisher to create the Bundle that is ready to serve, than provide that
				//   to the Server here, or maybe to something else.

				// Seems best to get that ready to serve static bundle from the publisher,
				//  and if it helps use some kind of system to set up some more details with the server router...?

				// Initial_Response_Handler perhaps?

				// Webpage_HTTP_Response_Handler?

				// Static_Webpage_HTTP_Response_Handler???

				// Static_Webpage_Bundle_HTTP_Response_Handler ???

				// Static_Webpage_Bundle_HTTP_Route_Response_Handler ????


				// Static_Webpage_Bundle_HTTP_Route_Responder ???

				// new Static_Webpage_Bundle_HTTP_Route_Responder(bundle_item)




				// Static_Webpage_Bundle_HTTP_Responder ??? (would do routing / route checking itself perhaps?)
				//   Seems like for the moment we should continue to use the server router.




				// Need to decide which encoded (compressed) buffer to return depending
				//   on what Content-Type(s) are supported on the client.




				// Very explicit class names make the responsibilities very clear.

				// Static_Route_HTTP_Responder seems best to provide the handle_http function.
				//   Even after routing a decision needs to be made regarding which buffer to send to the client
				//     Should be the last thing needed to get this simple square box demo server working properly.
				//     Hopefully the client-side activation still works fine.



				// HTTP_Responder class and subclasses???
				//   Could be a helpful type of middleware.
				//   Want to have it handle creating or using the correct compressed buffer.

				// go through the array of bundle items....


				// Need the bundle object / array here.
				//   Would be nice to have the bundle itself hold info on what's inside.
				//     Incl what packaging stage it is at, how ready to serve.

				// Though possible one object could handle the whole static bundle setup with the router...?

				// The code in a loop should be simple enough here though.








				// Set the routes of the various items in the bundle (and use the handlers provided by class
				//   instance objects that specifically provide HTTP handlers)


				// Should be the very last part of serving the HTTP for this particular server type.





				





				//server_router.set_route('/', wp_publisher, wp_publisher.handle_http);


				this.raise('ready');
			});


		} else {

			// Ahhh the web page publisher may be used instead of the website publisher.
			//   See about making use of relevant shared abstractions.


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

// Not sure that controls should be considered server only????
//   Possibly makes sense, though the 'client' part may need the active HTML document.

// Possibly the server could / should produce / provide such a document.





// Return the 'jsgui' object???

//jsgui.controls.Active_HTML_Document = require('./controls/Active_HTML_Document');


JSGUI_Single_Process_Server.jsgui = jsgui;



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
