const jsgui = require('./client');
const Server = require('../../../server');
const { Demo_UI } = jsgui.controls;

if (require.main === module) {
    const port = Number(process.env.PORT || 52000);
    const server = new Server({
        Ctrl: Demo_UI,
        src_path_client_js: require.resolve('./client.js'),
        admin: false
    });

    if (process.env.HOST_ALL !== '1') {
        server.allowed_addresses = ['127.0.0.1'];
    }

    server.on('ready', () => {
        server.start(port, (err) => {
            if (err) {
                throw err;
            }
            console.log(`data grid server started on port ${port}`);
        });
    });
}
