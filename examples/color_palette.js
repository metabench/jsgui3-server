const jsgui = require('./color_palette_client');

const {Demo_UI} = jsgui.controls;
const Server = require('../server');

// Want to exclude this from the client bundle.
//  Some kind of marking to say that it's server-side only?

// Autoresizing within the color palette not working properly.
//  Should do more work on a grid that deals with the autoresizing properly.




if (require.main === module) {
    
    const server = new Server({
        Ctrl: Demo_UI,
        // Giving it the Ctrl and disk path client js should enable to server to get the JS-bundled CSS from the file(s).
        //  Putting the JS files through proper parsing and into a syntax tree would be best.


        //'js_mode': 'debug',
        'disk_path_client_js': require.resolve('./color_palette_client.js')
        //js_client: require.resolve('./square_box.js')
    });

    // A callback or event for when the bundling has been completed
    //  a 'ready' event.

    // then start the server....
    // be able to choose the port / ports?
    console.log('waiting for server ready event');
    server.on('ready', () => {
        console.log('server ready');

        // server start will change to observable?

        server.start(52000, function (err, cb_start) {
            if (err) {
                throw err;
            } else {
                // Should have build it by now...
    
                console.log('server started');
            }
        });
    })

    

}