
const {Demo_UI, Square_Box} = require('./square_box_client');
const Server = require('../server');

// Want to exclude this from the client bundle.
//  Some kind of marking to say that it's server-side only?

if (require.main === module) {
    
    const server = new Server({
        Ctrl: Demo_UI,
        //'js_mode': 'debug',
        'disk_path_client_js': require.resolve('./square_box_client.js')
        //js_client: require.resolve('./square_box.js')
    });

    // then start the server....
    // be able to choose the port / ports?

    server.start(8080, function (err, cb_start) {
        if (err) {
            throw err;
        } else {
            console.log('server started');
        }
    });

}