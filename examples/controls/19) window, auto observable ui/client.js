const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;
const Auto_Observable_UI = require('../../../client/controls/auto-observable');
controls.Auto_Observable_UI = Auto_Observable_UI;

const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

class Demo_Page extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_page';
        super(spec);
        const { context } = this;

        if (typeof this.body.add_class === 'function') {
            this.body.add_class('demo-page');
        }

        const compose = () => {
            const h1 = new controls.h1({ context });
            h1.add('Auto Observable UI Demo');
            this.body.add(h1);

            const container = new controls.div({ context, class: 'params-container' });
            this.body.add(container);

            // 1. Tick Counter (Int)
            const ui_tick = new Auto_Observable_UI({
                context,
                url: '/api/tick',
                class: 'param-ui'
            });
            container.add(ui_tick);

            // 2. CPU Load (Gauge)
            const ui_cpu = new Auto_Observable_UI({
                context,
                url: '/api/cpu',
                class: 'param-ui'
            });
            container.add(ui_cpu);

            // 3. System Logs (Log)
            const ui_log = new Auto_Observable_UI({
                context,
                url: '/api/logs',
                class: 'param-ui span-2'
            });
            container.add(ui_log);
        };

        if (!spec.el) {
            compose();
        }
    }
}

Demo_Page.css = `
body {
    background: #222;
    color: #eee;
    font-family: sans-serif;
    padding: 20px;
}
.params-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    max-width: 800px;
}
.param-ui {
    background: #333;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
}
.span-2 {
    grid-column: span 2;
}
.value-display {
    text-align: center;
}
.value-text {
    font-size: 3em;
    font-weight: bold;
    color: #4facfe;
}
.progress-bg {
    background: #444;
    height: 20px;
    border-radius: 10px;
    overflow: hidden;
    margin: 10px 0;
}
.progress-fill {
    background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
    height: 100%;
    width: 0%;
    transition: width 0.3s ease;
}
.log-area {
    height: 150px;
    background: #111;
    overflow-y: auto;
    text-align: left;
    padding: 10px;
    font-family: monospace;
    font-size: 0.9em;
    border: 1px solid #444;
}
.log-entry {
    margin-bottom: 4px;
    border-bottom: 1px solid #222;
}
.status-indicator {
    font-size: 0.8em;
    text-transform: uppercase;
    margin-bottom: 5px;
    color: #888;
}
.status-connected { color: #0f0; }
.status-error { color: #f00; }
`;

module.exports = jsgui;
controls.Demo_Page = Demo_Page;
