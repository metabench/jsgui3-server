const jsgui = require('./client');
const Server = require('../../../server');
const { Demo_UI } = jsgui.controls;

if (require.main === module) {
    const server_instance = new Server({
        Ctrl: Demo_UI,
        src_path_client_js: require.resolve('./client.js')
    });

    server_instance.allowed_addresses = ['127.0.0.1'];

    server_instance.on('ready', () => {
        server_instance.start(52000, (err) => {
            if (err) {
                throw err;
            }
            console.log('server started on port 52000');
        });
    });
}
