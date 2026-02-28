const jsgui = require('./client');
const Server = require('../../../server');
const { Demo_Page } = jsgui.controls;

if (require.main === module) {
    const server = new Server({
        Ctrl: Demo_Page,
        src_path_client_js: require.resolve('./client.js')
    });

    server.on('ready', () => {
        const port = parseInt(process.env.PORT, 10) || 52101;
        server.start(port, (err) => {
            if (err) throw err;
            console.log(`MVVM & Declarative API Demo running at http://localhost:${port}`);
        });
    });
}
