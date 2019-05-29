/**
 * Created by James on 02/10/2016.
 */

// This would be a really good app to test deployment modules.
//  Would be nice to deploy a file browser server on a remote computer then access it.


var SC_Server = require('../../single-control-server');
var File_Tree = require('jsgui3-html').controls.File_Tree;

// Should make use of a File_Resource
//  shared with the client.

//var Server = jsgui.Server;

// Want to give it the js to include?
//  Include jsgui client js as default.
//  Would maybe want to substitute that with a different client build that includes jsgui3 (client) and custom controls and logic.


// Give it a live Control?
//  Would want to give that Control access to a server-side resource too.

// We need to publish a file system resource.
// Client needs to have access to it. Others shouldn't.
//  Could a control itself access the fs and do tasks?
// Right now we want to route everything through the fs resource.
//  The resource will be published.
//  The client-side fs resource will know where to look / the client-side resource system will have an API ready for it.

const Resource_Publisher = require('../../publishing/resource-publisher');
const FS_Resource = require('../../resources/fs-resource');

// Could add the fs resource to the server.
//  Maybe that could be a start option?

// Create the FS resource.
//  Publish it.

// Grant access to the File_Tree?
//  Could put the resource in the app's resource pool.

//console.log('File_Tree', File_Tree);
//throw 'stop';

var server = new SC_Server({
	'port': 80,
	'Ctrl': File_Tree
});


// on('pre-start', ...);

server.start(async (err, cb_start) => {
	if (err) {
		throw err;
	} else {

		// Start the fs resource.
		//  Then publish it.

		// Resource_Guard?

		// Local, set up authentication?
		const fsr = new FS_Resource({});
		await fsr.start();
		// await?
		server.publish('fs', fsr);

		console.log('FS_Resource started');

		// Not so sure about such general terms access to the resource.
		//  Though the client should be able to access it client-side.
		// The server does now have access to it through the 'publish' function so it shouldn't really be a problem.
		




		console.log('server started');
	}
});