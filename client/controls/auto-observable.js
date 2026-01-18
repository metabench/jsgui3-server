const jsgui = require('jsgui3-client');
const { Control, controls } = jsgui;

class Auto_Observable_UI extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'auto_observable_ui';
        super(spec);
        this.add_class('auto-observable-ui');

        this.url = spec.url;
        this.obs = spec.obs;

        // Container for the dynamic content
        this.content_container = new controls.div({
            context: this.context,
            class: 'content-container'
        });
        this.add(this.content_container);

        // Status indicator
        this.status_indicator = new controls.div({
            context: this.context,
            class: 'status-indicator status-connecting'
        });
        this.add(this.status_indicator);
    }

    activate() {
        if (!this.__active) {
            super.activate();
            this._connect();
        }
    }

    _connect() {
        let obs = this.obs;
        if (!obs && this.url) {
            obs = new jsgui.Remote_Observable({ url: this.url });
            this.obs = obs;
        }

        if (!obs) return;

        obs.on('connect', () => {
            this.status_indicator.remove_class('status-connecting');
            this.status_indicator.add_class('status-connected');
            this.status_indicator.dom.innerText = 'Connected';
        });

        obs.on('schema', (schema) => {
            console.log('Schema received:', schema);
            this._build_ui_from_schema(schema);
        });

        obs.on('next', (data) => {
            // If we haven't received a schema yet, maybe infer it or just display raw?
            // For now, if we built the UI, we update it.
            if (this._update_handler) {
                this._update_handler(data);
            } else if (!this._ui_built) {
                // Infer simple schema if not provided?
                // Or just show raw JSON
                this._build_default_ui(data);
                this._ui_built = true;
                if (this._update_handler) this._update_handler(data);
            }
        });

        obs.on('error', (err) => {
            this.status_indicator.add_class('status-error');
            this.status_indicator.dom.innerText = 'Error: ' + err.message;
        });

        obs.connect();
    }

    _build_ui_from_schema(schema) {
        if (this._ui_built) return; // Don't rebuild for now
        this._ui_built = true;

        this.content_container.content.clear();

        const type = schema.type || (schema.output_type ? schema.output_type : 'unknown');

        if (type === 'int' || type === 'number') {
            this._build_number_ui(schema);
        } else if (type === 'text' || type === 'log') {
            this._build_log_ui(schema);
        } else if (type === 'percentage' || (type === 'number' && schema.min !== undefined && schema.max !== undefined)) {
            this._build_gauge_ui(schema);
        } else {
            this._build_json_ui(schema);
        }
    }

    _build_default_ui(first_data) {
        if (typeof first_data === 'number') {
            this._build_number_ui({ type: 'number' });
        } else if (typeof first_data === 'string') {
            this._build_log_ui({ type: 'text' });
        } else {
            this._build_json_ui({ type: 'object' });
        }
    }

    _build_number_ui(schema) {
        const val_div = new controls.div({
            context: this.context,
            class: 'value-display number-display'
        });
        this.content_container.add(val_div);

        const label = new controls.h3({ context: this.context });
        label.add(schema.name || 'Value');
        val_div.add(label);

        const value_text = new controls.div({ context: this.context, class: 'value-text' });
        value_text.add('--');
        val_div.add(value_text);

        this._update_handler = (data) => {
            let val = data;
            if (typeof data === 'object' && data.value !== undefined) val = data.value;
            value_text.dom.innerText = String(val);
        };
    }

    _build_log_ui(schema) {
        const log_container = new controls.div({
            context: this.context,
            class: 'value-display log-display'
        });
        this.content_container.add(log_container);

        const label = new controls.h3({ context: this.context });
        label.add(schema.name || 'Log');
        log_container.add(label);

        const log_area = new controls.div({ context: this.context, class: 'log-area' });
        log_container.add(log_area);

        this._update_handler = (data) => {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            let msg = data;
            if (typeof data === 'object') msg = data.message || JSON.stringify(data);

            entry.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
            log_area.dom.appendChild(entry);
            log_area.dom.scrollTop = log_area.dom.scrollHeight;
        };
    }

    _build_gauge_ui(schema) {
        // Simple progress bar for now
        const container = new controls.div({
            context: this.context,
            class: 'value-display gauge-display'
        });
        this.content_container.add(container);

        const label = new controls.h3({ context: this.context });
        label.add(schema.name || 'Gauge');
        container.add(label);

        const bar_bg = new controls.div({ context: this.context, class: 'progress-bg' });
        const bar_fill = new controls.div({ context: this.context, class: 'progress-fill' });
        bar_bg.add(bar_fill);
        container.add(bar_bg);

        const value_text = new controls.div({ context: this.context, class: 'value-text-small' });
        container.add(value_text);

        const min = schema.min || 0;
        const max = schema.max || 100;

        this._update_handler = (data) => {
            let val = data;
            if (typeof data === 'object' && data.value !== undefined) val = data.value;

            const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
            bar_fill.dom.style.width = pct + '%';
            value_text.dom.innerText = `${val} / ${max}`;
        }
    }

    _build_json_ui(schema) {
        const container = new controls.div({
            context: this.context,
            class: 'value-display json-display'
        });
        this.content_container.add(container);

        const label = new controls.h3({ context: this.context });
        label.add(schema.name || 'Data');
        container.add(label);

        const pre = new controls.pre({ context: this.context });
        container.add(pre);

        this._update_handler = (data) => {
            pre.dom.innerText = JSON.stringify(data, null, 2);
        }
    }
}

module.exports = Auto_Observable_UI;
