/**
 * Created by James on 02/10/2016.
 */

// This one will need to activate on the client.
//  Really want the whole thing to be in one file.
//  Possible to have a standard activation?
//
// Or we need to have a client-side control?
//
// Some of the wiring could be done automatically.
//

var Server = require('../../server');
var Combo_Box = Server.HTML.Combo_Box;

//var Server = jsgui.Server;
var port = 80;
var Server_Page_Context = Server.Server_Page_Context;

var server = new Server({
	routes: {
		'*': {
			'name': 'html-server'
		}
	}
	
});

var resource_pool = server.resource_pool;

// Rendering single page controls makes a lot of sense.
//  It means the activation code can be contained better there.

//console.log('resource_pool', resource_pool);
//console.log('resource_pool.resources', resource_pool.resources);

// The start stop toggle button would need to be registered on the client side.
//  May be worth it to have the standard controls registered to start with.
//  Or to have the app know which controls are used, so it can register them.

// Get the website resource

// Caching items / resources by type?
// Need to give the resources a name.


//var website = resource_pool.get_resource('Server Router');
//console.log('\n\n');
var server_router = resource_pool.get_resource('Server Router');

//console.log('server_router', server_router);

if (!server_router) {
	throw 'no server_router';
}

var routing_tree = server_router.routing_tree;

routing_tree.set('/', function(req, res) {
	//console.log('root path / request');
	var server_page_context = new Server_Page_Context({
		'req': req,
		'res': res,
		'resource_pool': resource_pool
	});
	// Page_Bounds_Specifier
	var hd = new Server.HTML.Client_HTML_Document({
		'context': server_page_context
	});
	hd.include_client_css();
	hd.include_js('/js/app-bundle.js');
	var body = hd.body;
    var ctrl = new Combo_Box({
		'context': server_page_context
	});
	//var ctrl2 = new jsgui.Control({});
	body.add(ctrl);

	// Can change to observable promise that also has log info
	//  Will then be easier to peak into log info and show it in a gui as well.
	//  Log guids could also be of use with this.



	hd.all_html_render(function(err, deferred_html) {
		if (err) {
			throw err;
		} else {
			//console.log('deferred_html', deferred_html);
			var mime_type = 'text/html';
			//console.log('mime_type ' + mime_type);
			res.writeHead(200, { 'Content-Type': mime_type });
			res.end('<!DOCTYPE html>' + deferred_html, 'utf-8');
		}
	});
});

server.start(port, function(err, cb_start) {
	if (err) {
		throw err;
	} else {
		console.log('master server started');
	}
});