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

var jsgui = require('../server/server');
var List = require('../controls/list');

var Server = jsgui.Server;
var port = 80;
var Server_Page_Context = Server.Page_Context;

var server = new Server({
	'routes': {
		'*': {
			'name': 'html-server'
		}
	}
	
});

var resource_pool = server.resource_pool;

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
	var hd = new jsgui.Client_HTML_Document({
		'context': server_page_context
	});
	hd.include_client_css();
	hd.include_js('/js/app-bundle.js');
	var body = hd.body;
	var ctrl = new List({
		'context': server_page_context
	});

	// The list has got an items collection.

	//ctrl.items.content([]);


    ctrl.items.add('2000');
    ctrl.items.add('2001');
    ctrl.items.add('2002');
    ctrl.items.add('2003');
    ctrl.items.add('2004');
    ctrl.items.add('2005');
    ctrl.items.add('2006');
    ctrl.items.add('2007');
    ctrl.items.add('2008');
    ctrl.items.add('2009');
	ctrl.items.load_array(['2010', '2011']);


	//var ctrl2 = new jsgui.Control({});
	body.add(ctrl);
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