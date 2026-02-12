const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../controls/Active_HTML_Document');

const { controls } = jsgui;
const { Button } = controls;

class Resource_Monitor_App extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'resource_monitor_app';
        super(spec);

        const { context } = this;

        this._event_source = null;
        this._events_count = 0;

        const compose = () => {
            const monitor_window = new controls.Window({
                context,
                title: 'Resource Monitor',
                pos: [24, 24]
            });
            monitor_window.size = [560, 360];

            const root = new controls.div({ context });
            root.dom.attributes.id = 'resource-monitor-root';

            const heading = new controls.h3({ context });
            heading.add('Server Resource Control');
            root.add(heading);

            const controls_row = new controls.div({ context });
            controls_row.dom.attributes.class = 'controls-row';

            const start_button = new Button({ context, text: 'Start' });
            start_button.dom.attributes.id = 'resource-start-btn';
            controls_row.add(start_button);

            const stop_button = new Button({ context, text: 'Stop' });
            stop_button.dom.attributes.id = 'resource-stop-btn';
            controls_row.add(stop_button);

            const restart_button = new Button({ context, text: 'Restart' });
            restart_button.dom.attributes.id = 'resource-restart-btn';
            controls_row.add(restart_button);

            const refresh_button = new Button({ context, text: 'Refresh' });
            refresh_button.dom.attributes.id = 'resource-refresh-btn';
            controls_row.add(refresh_button);

            root.add(controls_row);

            const state_line = new controls.div({ context });
            state_line.dom.attributes.class = 'state-line';

            const state_label = new controls.span({ context });
            state_label.add('State: ');
            state_line.add(state_label);

            const state_value = new controls.span({ context });
            state_value.dom.attributes.id = 'resource-state';
            state_value.dom.attributes.class = 'resource-state-value';
            state_value.add('unknown');
            state_line.add(state_value);

            root.add(state_line);

            const events_line = new controls.div({ context });
            events_line.dom.attributes.class = 'events-line';

            const events_count_label = new controls.span({ context });
            events_count_label.add('Events: ');
            events_line.add(events_count_label);

            const events_count_value = new controls.span({ context });
            events_count_value.dom.attributes.id = 'resource-events-count';
            events_count_value.dom.attributes.class = 'resource-events-count-value';
            events_count_value.add('0');
            events_line.add(events_count_value);

            root.add(events_line);

            const events_title = new controls.h4({ context });
            events_title.add('Latest Events');
            root.add(events_title);

            const events_list = new controls.ul({ context });
            events_list.dom.attributes.id = 'resource-events-list';
            root.add(events_list);

            monitor_window.inner.add(root);
            this.body.add(monitor_window);
        };

        if (!spec.el) {
            compose();
        }
    }

    _set_state_text(next_state) {
        const state_element = document.getElementById('resource-state');
        if (state_element) {
            state_element.textContent = String(next_state || 'unknown');
        }
    }

    _append_event(event_name, payload = {}) {
        this._events_count += 1;

        const events_count_element = document.getElementById('resource-events-count');
        if (events_count_element) {
            events_count_element.textContent = String(this._events_count);
        }

        const events_list_element = document.getElementById('resource-events-list');
        if (!events_list_element) {
            return;
        }

        const list_item = document.createElement('li');
        const summary = payload && typeof payload === 'object'
            ? `${event_name}: ${payload.resourceName || payload.name || ''} ${payload.from || ''} -> ${payload.to || ''}`.trim()
            : event_name;
        list_item.textContent = summary;
        events_list_element.prepend(list_item);

        while (events_list_element.childElementCount > 12) {
            events_list_element.removeChild(events_list_element.lastChild);
        }
    }

    async _read_status() {
        const response = await fetch('/api/resource/status');
        const status_result = await response.json();
        if (status_result && status_result.status && status_result.status.state) {
            this._set_state_text(status_result.status.state);
        }

        window.__resource_client_debug = window.__resource_client_debug || {
            api_calls: [],
            sse_events: []
        };
        window.__resource_client_debug.api_calls.push({
            route: '/api/resource/status',
            timestamp: Date.now(),
            state: status_result && status_result.status ? status_result.status.state : null
        });

        return status_result;
    }

    async _invoke_action(action_name) {
        const response = await fetch(`/api/resource/${action_name}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        const action_result = await response.json();

        window.__resource_client_debug = window.__resource_client_debug || {
            api_calls: [],
            sse_events: []
        };
        window.__resource_client_debug.api_calls.push({
            route: `/api/resource/${action_name}`,
            timestamp: Date.now(),
            response_state: action_result && action_result.status ? action_result.status.state : null
        });

        await this._read_status();
        return action_result;
    }

    _bind_buttons() {
        const start_button = document.getElementById('resource-start-btn');
        if (start_button) {
            start_button.addEventListener('click', () => this._invoke_action('start').catch(console.error));
        }

        const stop_button = document.getElementById('resource-stop-btn');
        if (stop_button) {
            stop_button.addEventListener('click', () => this._invoke_action('stop').catch(console.error));
        }

        const restart_button = document.getElementById('resource-restart-btn');
        if (restart_button) {
            restart_button.addEventListener('click', () => this._invoke_action('restart').catch(console.error));
        }

        const refresh_button = document.getElementById('resource-refresh-btn');
        if (refresh_button) {
            refresh_button.addEventListener('click', () => this._read_status().catch(console.error));
        }
    }

    _bind_sse() {
        this._event_source = new EventSource('/events');

        const observed_event_names = [
            'resource_state_change',
            'crashed',
            'unhealthy',
            'unreachable',
            'recovered'
        ];

        for (const event_name of observed_event_names) {
            this._event_source.addEventListener(event_name, (event) => {
                let payload = {};
                if (event && typeof event.data === 'string' && event.data.length > 0) {
                    try {
                        payload = JSON.parse(event.data);
                    } catch {
                        payload = { raw: event.data };
                    }
                }

                if (event_name === 'resource_state_change' && payload.to) {
                    this._set_state_text(payload.to);
                }

                this._append_event(event_name, payload);

                window.__resource_client_debug = window.__resource_client_debug || {
                    api_calls: [],
                    sse_events: []
                };
                window.__resource_client_debug.sse_events.push({
                    event_name,
                    payload,
                    timestamp: Date.now()
                });
            });
        }
    }

    activate() {
        if (this.__active) {
            return;
        }

        super.activate();

        this._bind_buttons();
        this._bind_sse();

        this._read_status().catch(console.error);

        window.addEventListener('beforeunload', () => {
            if (this._event_source) {
                this._event_source.close();
                this._event_source = null;
            }
        });
    }
}

Resource_Monitor_App.css = `
body {
    margin: 0;
    padding: 0;
    background: linear-gradient(145deg, #1f2937, #111827);
    color: #f9fafb;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
}

#resource-monitor-root {
    padding: 14px;
}

#resource-monitor-root h3,
#resource-monitor-root h4 {
    margin: 0 0 10px 0;
}

.controls-row {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
}

.controls-row button {
    min-width: 86px;
}

.state-line,
.events-line {
    margin-bottom: 8px;
    font-size: 14px;
}

#resource-events-list {
    list-style: none;
    margin: 0;
    padding: 0;
    max-height: 180px;
    overflow: auto;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    background: rgba(17, 24, 39, 0.8);
}

#resource-events-list li {
    font-size: 12px;
    line-height: 1.4;
    padding: 6px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

#resource-events-list li:last-child {
    border-bottom: none;
}
`;

controls.Resource_Monitor_App = Resource_Monitor_App;
module.exports = jsgui;
