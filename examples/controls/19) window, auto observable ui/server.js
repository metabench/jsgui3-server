const jsgui = require('./client');
const Server = require('../../../server');
const { Demo_Page } = jsgui.controls;
const { observable } = require('fnl');

if (require.main === module) {
    const server = new Server({
        Ctrl: Demo_Page,
        src_path_client_js: require.resolve('./client.js')
    });

    server.on('ready', () => {
        // 1. Tick Observable
        const obs_tick = observable((next) => {
            let i = 0;
            const timer = setInterval(() => next(++i), 1000);
            return () => clearInterval(timer);
        });
        // Attach schema manually (or could be done via helper)
        obs_tick.schema = {
            name: 'Uptime (Seconds)',
            type: 'int'
        };
        server.publish_observable('/api/tick', obs_tick);

        // 2. CPU Observable (Simulated)
        const obs_cpu = observable((next) => {
            const timer = setInterval(() => {
                const load = 40 + Math.random() * 30;
                next(Math.floor(load));
            }, 500);
            return () => clearInterval(timer);
        });
        obs_cpu.schema = {
            name: 'CPU Load',
            type: 'number',
            min: 0,
            max: 100
        };
        server.publish_observable('/api/cpu', obs_cpu);

        // 3. Logs Observable
        const obs_logs = observable((next) => {
            const msgs = ['System check OK', 'Request received', 'Cache invalidated', 'User login', 'Background job started'];
            const timer = setInterval(() => {
                const msg = msgs[Math.floor(Math.random() * msgs.length)];
                next({ message: msg, level: 'info' });
            }, 2000);
            return () => clearInterval(timer);
        });
        obs_logs.schema = {
            name: 'Server Logs',
            type: 'log'
        };
        server.publish_observable('/api/logs', obs_logs);

        // Start
        const port = 52100;
        server.start(port, (err) => {
            if (err) throw err;
            console.log(`Demo running at http://localhost:${port}`);
        });
    });
}
