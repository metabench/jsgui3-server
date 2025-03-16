const jsgui = require('./client');

const {Demo_UI, Square_Box} = jsgui.controls;
const Server = require('../../../../server');

if (require.main === module) {
    
    const server = new Server({
        Ctrl: Demo_UI,
        debug: true,


        //'js_mode': 'debug',
        'src_path_client_js': require.resolve('./client.js')
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