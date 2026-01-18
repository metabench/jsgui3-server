const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;

const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

/**
 * Demo showing Server-Sent Events (SSE) with observable pattern.
 * 
 * This demonstrates:
 * 1. Server publishing an observable that emits events over time
 * 2. Client consuming SSE stream and updating UI reactively
 * 3. Real-time updates from server to client via SSE
 */
class Observable_Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'observable_demo_ui';
        super(spec);
        const { context } = this;

        if (typeof this.body.add_class === 'function') {
            this.body.add_class('observable-demo-ui');
        }

        const compose = () => {
            // Container
            const container = new controls.div({
                context: context,
                'class': 'sse-container'
            });
            this.body.add(container);

            // Header
            const header = new controls.div({
                context: context,
                'class': 'sse-header'
            });
            container.add(header);

            const title = new controls.h2({
                context: context
            });
            title.add('Observable SSE Demo - Real-Time Tick Stream');
            header.add(title);

            // Status display
            const status_div = new controls.div({
                context: context,
                'class': 'status-section'
            });
            status_div.dom.attributes.id = 'status-label';
            status_div.add('Status: Not connected');
            container.add(status_div);

            // Tick counter display
            const tick_display = new controls.div({
                context: context,
                'class': 'tick-display'
            });
            container.add(tick_display);

            const tick_count = new controls.div({
                context: context,
                'class': 'tick-count'
            });
            tick_count.dom.attributes.id = 'tick-count';
            tick_count.add('--');
            tick_display.add(tick_count);

            const tick_label = new controls.div({
                context: context,
                'class': 'tick-label'
            });
            tick_label.add('Server Ticks');
            tick_display.add(tick_label);

            // Event log
            const log_label = new controls.div({
                context: context,
                'class': 'log-label'
            });
            log_label.add('Event Log (SSE messages):');
            container.add(log_label);

            const event_log = new controls.div({
                context: context,
                'class': 'event-log'
            });
            event_log.dom.attributes.id = 'event-log';
            container.add(event_log);

            // Control buttons
            const button_container = new controls.div({
                context: context,
                'class': 'button-container'
            });
            container.add(button_container);

            const connect_button = new controls.Button({
                context: context,
                text: 'Connect to SSE'
            });
            connect_button.dom.attributes.id = 'connect-btn';
            button_container.add(connect_button);

            const disconnect_button = new controls.Button({
                context: context,
                text: 'Disconnect'
            });
            disconnect_button.dom.attributes.id = 'disconnect-btn';
            button_container.add(disconnect_button);

            const clear_button = new controls.Button({
                context: context,
                text: 'Clear Log'
            });
            clear_button.dom.attributes.id = 'clear-btn';
            button_container.add(clear_button);
        };

        if (!spec.el) {
            compose();
        }
    }

    activate() {
        if (!this.__active) {
            super.activate();

            // Get DOM references via getElementById (works on client)
            const status_label = document.getElementById('status-label');
            const tick_count_el = document.getElementById('tick-count');
            const event_log = document.getElementById('event-log');
            const connect_button = document.getElementById('connect-btn');
            const disconnect_button = document.getElementById('disconnect-btn');
            const clear_button = document.getElementById('clear-btn');

            let event_source = null;
            let message_count = 0;

            const log_event = (message, type = 'info') => {
                const timestamp = new Date().toLocaleTimeString();
                const log_entry = document.createElement('div');
                log_entry.textContent = `[${timestamp}] ${message}`;
                log_entry.className = `log-entry log-${type}`;
                event_log.appendChild(log_entry);

                // Auto-scroll to bottom
                event_log.scrollTop = event_log.scrollHeight;

                // Keep only last 50 entries
                message_count++;
                if (message_count > 50) {
                    const first_child = event_log.firstChild;
                    if (first_child) {
                        event_log.removeChild(first_child);
                    }
                }
            };

            const connect_sse = () => {
                if (window.tick_obs) {
                    window.tick_obs.stop();
                    // Clean up old binding manually if re-connecting
                    // (bindRemote usually handles this on control destruction)
                }

                status_label.textContent = 'Status: Connecting...';
                log_event('Connecting to /api/tick-stream...', 'info');

                // 1. Create Remote_Observable
                const tick_obs = new jsgui.Remote_Observable({ url: '/api/tick-stream' });
                window.tick_obs = tick_obs; // Keep reference

                // 2. Set up event logging
                tick_obs.on('connect', () => {
                    status_label.textContent = 'Status: Connected (streaming)';
                    log_event('Connected! Receiving real-time tick events...', 'success');
                });

                tick_obs.on('error', (err) => {
                    status_label.textContent = 'Status: Error';
                    log_event(`Error: ${err.message}`, 'error');
                });

                // 3. Bind to UI (The Magic!)
                // This control acts as the data binding target.
                // We map the 'tick' property from the stream to this control's model/DOM.

                // For demonstration, let's manually handle 'next' to show the data flow explicitly
                // alongside the automatic binding.
                tick_obs.on('next', (data) => {
                    log_event(`Tick #${data.tick}: ${data.message}`, 'tick');

                    // Manually update the counter to show it works
                    // In a real app, you'd bind directly to a property
                    if (data.tick) tick_count_el.textContent = data.tick.toString();
                });

                // Start the connection
                tick_obs.connect();
            };

            const disconnect_sse = () => {
                if (window.tick_obs) {
                    window.tick_obs.stop(); // Sends 'stop' command to server if supported, or just disconnects
                    window.tick_obs.disconnect();
                    window.tick_obs = null;
                    status_label.textContent = 'Status: Disconnected';
                    log_event('Manually disconnected from SSE stream', 'info');
                }
            };

            // Button handlers
            connect_button.addEventListener('click', () => {
                connect_sse();
            });

            disconnect_button.addEventListener('click', () => {
                disconnect_sse();
            });

            clear_button.addEventListener('click', () => {
                event_log.innerHTML = '';
                message_count = 0;
                tick_count_el.textContent = '--';
                status_label.textContent = 'Status: Not connected';
                log_event('Log cleared', 'info');
            });

            log_event('Observable SSE Demo ready. Click "Connect to SSE" to begin streaming.', 'info');
        }
    }
}

Observable_Demo_UI.css = `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    overflow-x: hidden;
    overflow-y: auto;
    background-color: #1a1a2e;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.observable-demo-ui {
    padding: 20px;
}

.sse-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background: #16213e;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.sse-header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e94560;
}

.sse-header h2 {
    color: #e94560;
    font-size: 20px;
    font-weight: 600;
}

.status-section {
    padding: 12px;
    margin-bottom: 15px;
    background: #0f3460;
    border-radius: 6px;
    color: #e0e0e0;
    font-weight: 500;
    text-align: center;
}

.tick-display {
    text-align: center;
    padding: 25px;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%);
    border-radius: 10px;
    border: 2px solid #e94560;
}

.tick-count {
    font-size: 64px;
    font-weight: bold;
    color: #e94560;
    text-shadow: 0 0 30px rgba(233, 69, 96, 0.6);
    font-family: 'Consolas', 'Monaco', monospace;
    line-height: 1;
}

.tick-label {
    color: #7ec8e3;
    font-size: 14px;
    margin-top: 10px;
    text-transform: uppercase;
    letter-spacing: 3px;
}

.log-label {
    color: #e0e0e0;
    margin-bottom: 8px;
    font-weight: 500;
}

.event-log {
    height: 180px;
    overflow-y: auto;
    background: #0f0f23;
    border: 1px solid #333;
    border-radius: 6px;
    padding: 10px;
    margin-bottom: 15px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
}

.log-entry {
    padding: 4px 0;
    border-bottom: 1px solid #222;
}

.log-info { color: #7ec8e3; }
.log-success { color: #50c878; }
.log-warning { color: #ffa500; }
.log-error { color: #ff6b6b; }
.log-tick { color: #e94560; }

.button-container {
    display: flex;
    gap: 10px;
}

.button-container button {
    flex: 1;
    padding: 14px 20px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s ease;
}

.button-container button:first-child {
    background: linear-gradient(135deg, #0f3460 0%, #e94560 100%);
    color: white;
}

.button-container button:first-child:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(233, 69, 96, 0.4);
}

.button-container button:nth-child(2) {
    background: #e94560;
    color: white;
}

.button-container button:nth-child(2):hover {
    background: #d63850;
}

.button-container button:last-child {
    background: #333;
    color: #e0e0e0;
}

.button-container button:last-child:hover {
    background: #444;
}
`;

controls.Observable_Demo_UI = Observable_Demo_UI;

module.exports = jsgui;
