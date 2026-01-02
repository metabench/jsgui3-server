const jsgui = require('./client');
const Server = require('../../../server');
const { Demo_UI } = jsgui.controls;

if (require.main === module) {
    const server = new Server({
        Ctrl: Demo_UI,
        src_path_client_js: require.resolve('./client.js')
    });

    server.allowed_addresses = ['127.0.0.1'];

    server.on('ready', () => {
        server.start(52000, (err) => {
            if (err) {
                throw err;
            }
            console.log('server started on port 52000');
        });
    });
}
