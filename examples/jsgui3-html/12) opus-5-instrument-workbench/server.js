// ─────────────────────────────────────────────────────────────────────────────
// Opus 5 Showcase — "Instrument Workbench" · server
//
// Renders the whole workbench server-side: both SVG editors, the waveform
// display and the two-octave keyboard all arrive complete in the first HTML
// response. Activation attaches the audio engine and the drag handling.
//
// Also exposes the voice library as JSON so the definitions can be inspected
// without reading the bundle.
// ─────────────────────────────────────────────────────────────────────────────

const jsgui = require('./client');
const Server = require('../../../server');
const { INSTRUMENTS, wave_cycle, env_points } = require('./instruments');
const { Demo_UI } = jsgui.controls;

// Exported so a test can boot the example without duplicating this wiring.
// Everything used to live inside require.main === module, which meant any test
// written to the repo's own convention got a 404 from every endpoint.
const register_api = (server) => {
    // The six built-in voices, as data.
    server.publish('instruments', () => INSTRUMENTS);

    // A rendered preview of one voice — the same pure functions the browser
    // uses, so this is a genuine check that client and server agree rather
    // than a second implementation.
    server.publish('preview', (args) => {
        const id = (args && (args.id || args[0])) || 'piano';
        const v = INSTRUMENTS.filter((x) => x.id === id)[0] || INSTRUMENTS[0];
        return {
            id: v.id,
            name: v.name,
            wave: wave_cycle(v.partials, 64).map((n) => Number(n.toFixed(4))),
            envelope: env_points(v.env, v.curves, 64).map((n) => Number(n.toFixed(4)))
        };
    });
};

// Boot the example. Returns a promise resolving to { server, port } so tests
// can await readiness rather than sleeping and hoping.
const start = (port) =>
    new Promise((resolve, reject) => {
        const server = new Server({
            Ctrl: Demo_UI,
            src_path_client_js: require.resolve('./client.js')
        });
        server.allowed_addresses = ['127.0.0.1'];
        server.on('ready', () => {
            register_api(server);
            const p = port || parseInt(process.env.PORT, 10) || 52032;
            server.start(p, (err) => (err ? reject(err) : resolve({ server, port: p })));
        });
    });

if (require.main === module) {
    start().then(({ port }) => {
        console.log('Opus 5 showcase "Instrument Workbench" on http://127.0.0.1:' + port + '/');
    }).catch((e) => {
        console.error('failed to start:', e);
        process.exit(1);
    });
}

module.exports = { register_api, start };
