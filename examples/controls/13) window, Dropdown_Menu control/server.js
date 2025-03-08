const jsgui = require('./client');
const {Demo_UI} = jsgui.controls;
const Server = require('../../../server');
if (require.main === module) {
    const server = new Server({
        Ctrl: Demo_UI,
        'src_path_client_js': require.resolve('./client.js'),
    });
    console.log('waiting for server ready event');
    server.one('ready', () => {
        console.log('server ready');
        server.start(52000, function (err, cb_start) {
            if (err) {
                throw err;
            } else {
                console.log('server started');
            }
        });
    })
}