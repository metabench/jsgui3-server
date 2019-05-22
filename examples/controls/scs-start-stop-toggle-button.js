/**
 * Created by James on 02/10/2016.
 */

var Server = require('../../single-control-server');
var { Start_Stop_Toggle_Button } = require('jsgui3-html');

//var Server = jsgui.Server;

// Want to give it the js to include?
//  Include jsgui client js as default.
//  Would maybe want to substitute that with a different client build that includes jsgui3 (client) and custom controls and logic.


// Give it a live Control?
//  Would want to give that Control access to a server-side resource too.

var server = new Server({
	'port': 80,
	'ctrl': Start_Stop_Toggle_Button//,
	//'js_mode': 'debug'
});

server.start(function(err, cb_start) {
	if (err) {
		throw err;
	} else {
		// access button with server.ctrl

		// A .background object would be cool. Would change the dom attributes.

		//server.ctrl.background.color = '#ABCDEF';

		console.log('server started');
	}
});