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

if (require.main === module) {
    const server = new Server({
        Ctrl: Demo_UI,
        src_path_client_js: require.resolve('./client.js')
    });

    server.allowed_addresses = ['127.0.0.1'];

    server.on('ready', () => {
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

        const port = parseInt(process.env.PORT, 10) || 52032;
        server.start(port, (err) => {
            if (err) throw err;
            console.log('Opus 5 showcase "Instrument Workbench" on http://127.0.0.1:' + port + '/');
        });
    });
}
