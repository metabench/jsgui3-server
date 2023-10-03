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

var jsgui = require('jsgui3-html');


var Start_Stop_Toggle_Button = jsgui.Start_Stop_Toggle_Button;
var Color_Palette = jsgui.Color_Palette;

var Server = require('../../../server');
var port = 8000;
var Server_Page_Context = require('../../../page-context');

var server = new Server({
	'routes': {
		'*': {
			'name': 'HTML Server'
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

//console.log('resource_names', resource_pool.get_resource_names());
//throw 'stop';
var server_router = resource_pool.get_resource('Server Router');



//console.log('server_router', server_router);

if (!server_router) {
	throw 'no server_router';
}

var routing_tree = server_router.routing_tree;

routing_tree.set('/', function (req, res) {
	//console.log('root path / request');
	var server_page_context = new Server_Page_Context({
		'req': req,
		'res': res,
		'resource_pool': resource_pool
	});
	// Page_Bounds_Specifier
	var hd = new jsgui.Client_HTML_Document({
		'context': server_page_context
	});
	hd.include_client_css();
	hd.include_js('/js/app-bundle-active.js');
	var body = hd.body;
	body.size = [800, 600];
	var ctrl = new Color_Palette({
		'context': server_page_context,
		'size': [312, 312]
	});
	//var ctrl2 = new jsgui.Control({});
	ctrl.resizable = true;
	body.add(ctrl);
	ctrl.active();
	hd.all_html_render(function (err, deferred_html) {
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

//console.log('pre server start');
server.start(port, function (err, cb_start) {
	if (err) {
		throw err;
	} else {
		console.log('master server started');
	}
});