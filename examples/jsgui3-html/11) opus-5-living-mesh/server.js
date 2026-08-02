// ─────────────────────────────────────────────────────────────────────────────
// Opus 5 Showcase — "Living Mesh" · server
//
// Serves the SSR'd SVG page and a named-event SSE stream at /api/telemetry.
//
// Named events (event: telemetry / event: alert) rather than anonymous data:
// frames, because that is the mechanism the docs describe and the one nothing
// else in this examples tree demonstrates. It also lets a single connection
// carry two independent streams, which the client subscribes to separately.
// ─────────────────────────────────────────────────────────────────────────────

const jsgui = require('./client');
const Server = require('../../../server');
const { Demo_UI } = jsgui.controls;

const NODE_IDS = ['gateway', 'auth', 'api', 'cache', 'worker', 'ledger', 'store'];

// A small simulation with some character: each service has its own baseline and
// volatility, and occasionally one goes into a spike that decays.
const state = {};
NODE_IDS.forEach((id, i) => {
    state[id] = {
        base: 24 + i * 6,
        drift: 0,
        spike: 0,
        latency: 3 + i * 1.5
    };
});

let tick = 0;

const step = () => {
    tick++;
    const nodes = {};
    let total = 0;

    NODE_IDS.forEach((id) => {
        const s = state[id];
        s.drift += (Math.random() - 0.5) * 6;
        s.drift = Math.max(-14, Math.min(14, s.drift * 0.92));

        if (s.spike > 0) {
            s.spike *= 0.82;
            if (s.spike < 1) s.spike = 0;
        } else if (Math.random() < 0.012) {
            s.spike = 30 + Math.random() * 45;
        }

        const load = Math.max(2, Math.min(100, s.base + s.drift + s.spike));
        const latency = s.latency * (1 + (load / 100) * 2.4) + Math.random();
        const status = load > 85 ? 'saturated' : load > 60 ? 'busy' : 'healthy';

        nodes[id] = {
            load: Number(load.toFixed(1)),
            latency: Number(latency.toFixed(1)),
            state: status
        };
        total += load;
    });

    return { tick, at: Date.now(), nodes, total: Number(total.toFixed(1)) };
};

const alert_for = (snapshot) => {
    for (const id in snapshot.nodes) {
        if (snapshot.nodes[id].load > 88) {
            return { text: id + ' saturated at ' + Math.round(snapshot.nodes[id].load) + '%', node: id };
        }
    }
    return null;
};

const sse_headers = {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
};

const clients = new Set();
let event_id = 0;

const broadcast = (event_name, payload) => {
    event_id++;
    const frame = 'id: ' + event_id + '\nevent: ' + event_name + '\ndata: ' + JSON.stringify(payload) + '\n\n';
    for (const res of clients) {
        try {
            res.write(frame);
        } catch (e) {
            clients.delete(res);
        }
    }
};

// A rolling history so a client that connects late gets a populated sparkline
// immediately, rather than watching an empty axis fill for a minute.
const HISTORY_MAX = 48;
const history = [];

const record = (snapshot) => {
    history.push(snapshot.total);
    while (history.length > HISTORY_MAX) history.shift();
    snapshot.history = history.slice();
    return snapshot;
};

// Warm the history with a plausible run so the very first paint has shape.
for (let i = 0; i < HISTORY_MAX; i++) record(step());

let latest = record(step());

if (require.main === module) {
    const server = new Server({
        Ctrl: Demo_UI,
        src_path_client_js: require.resolve('./client.js')
    });

    server.allowed_addresses = ['127.0.0.1'];

    server.on('ready', () => {
        // Raw responder: SSE needs the connection held open and flushed per
        // frame, which the JSON publishers do not do.
        server.server_router.set_route('/api/telemetry', null, (req, res) => {
            res.writeHead(200, sse_headers);
            res.write('retry: 2000\n\n');
            res.write('id: ' + event_id + '\nevent: telemetry\ndata: ' + JSON.stringify(latest) + '\n\n');
            clients.add(res);
            req.on('close', () => clients.delete(res));
        });

        // Same data as a plain request, so the SSR pass and the stream agree.
        server.publish('snapshot', () => latest);

        setInterval(() => {
            latest = record(step());
            broadcast('telemetry', latest);
            const a = alert_for(latest);
            if (a) broadcast('alert', a);
        }, 900);

        // Keep intermediaries from closing an idle connection.
        setInterval(() => {
            for (const res of clients) {
                try {
                    res.write(': keepalive\n\n');
                } catch (e) {
                    clients.delete(res);
                }
            }
        }, 15000);

        const port = parseInt(process.env.PORT, 10) || 52031;
        server.start(port, (err) => {
            if (err) throw err;
            console.log('Opus 5 showcase "Living Mesh" on http://127.0.0.1:' + port + '/');
        });
    });
}

module.exports = { step, alert_for };
