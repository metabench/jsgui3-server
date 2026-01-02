const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const { BindingDebugTools } = require('jsgui3-html/html-core/BindingDebugger');
const { Data_Object } = jsgui;

class Binding_Debugger_Control extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'binding_debugger_control';
        super(spec);

        this.log_counter = 0;
        this.snapshot_primary = null;

        this.data.model = new Data_Object({
            count: 2,
            step: 1,
            label: 'Signal'
        });

        this.view.data.model = new Data_Object({
            display_text: '',
            step_text: '',
            status_text: '',
            progress_text: '',
            summary_line: '',
            summary_details: '',
            diff_lines: [],
            activity_log: [],
            debug_enabled: false
        });

        this.setup_bindings();
        this.setup_computed();
        this.setup_watchers();
        this.init_debugger();

        if (!spec.el) {
            this.compose();
        }
    }

    setup_bindings() {
        this.bind({
            count: {
                to: 'display_text',
                transform: (count) => `Count: ${count}`
            },
            step: {
                to: 'step_text',
                transform: (step) => `Step: ${step}`
            }
        });
    }

    setup_computed() {
        this.computed(
            this.data.model,
            ['count', 'label'],
            (count, label) => {
                const safe_label = label || 'Signal';
                return `${safe_label} status is ${count >= 0 ? 'steady' : 'negative'}.`;
            },
            { propertyName: 'status_text', target: this.view.data.model }
        );

        this.computed(
            this.data.model,
            ['count', 'step'],
            (count, step) => {
                return `Next move: ${count + step}`;
            },
            { propertyName: 'progress_text', target: this.view.data.model }
        );
    }

    setup_watchers() {
        this.watch(
            this.data.model,
            'count',
            (count, old_value) => {
                this.append_log(`count ${old_value} -> ${count}`);
            }
        );

        this.watch(
            this.data.model,
            'step',
            (step, old_value) => {
                this.append_log(`step ${old_value} -> ${step}`);
            }
        );
    }

    init_debugger() {
        this.binding_debugger = BindingDebugTools.getDebugger(this);
        this.refresh_debug_summary();
    }

    refresh_debug_summary() {
        const summary = this.binding_debugger.getBindingSummary();
        this.view.data.model.summary_line = `Binders: ${summary.totalBinders} | Computed: ${summary.totalComputed} | Watchers: ${summary.totalWatchers}`;
        this.view.data.model.summary_details = JSON.stringify(summary.details, null, 2);
    }

    set_debug_enabled(enabled) {
        this.view.data.model.debug_enabled = !!enabled;
        if (enabled) {
            this.binding_debugger.enable();
            this.append_log('debugger enabled');
        } else {
            this.binding_debugger.disable();
            this.append_log('debugger disabled');
        }
    }

    adjust_count(delta) {
        const base_count = Number(this.data.model.count) || 0;
        const step = Number(this.data.model.step) || 1;
        this.data.model.count = base_count + delta * step;
    }

    append_log(message) {
        this.log_counter += 1;
        const entry = `${this.log_counter}. ${message}`;
        const existing = Array.isArray(this.view.data.model.activity_log)
            ? this.view.data.model.activity_log
            : [];
        this.view.data.model.activity_log = [entry, ...existing].slice(0, 8);
        this.binding_debugger.log(message);
    }

    take_snapshot() {
        this.snapshot_primary = this.binding_debugger.snapshotModels();
        this.append_log('snapshot captured');
    }

    compare_snapshot() {
        if (!this.snapshot_primary) {
            this.view.data.model.diff_lines = ['Take a snapshot before comparing.'];
            return;
        }
        const current_snapshot = this.binding_debugger.snapshotModels();
        const diff_items = this.binding_debugger.compareSnapshots(this.snapshot_primary, current_snapshot);
        if (!diff_items.length) {
            this.view.data.model.diff_lines = ['No differences detected.'];
            return;
        }
        this.view.data.model.diff_lines = diff_items.map((diff) => {
            return `${diff.path}: ${diff.oldValue} -> ${diff.newValue}`;
        });
    }

    render_log_list(list_container, log_entries) {
        list_container.clear();
        log_entries.forEach((entry, index) => {
            const item = new jsgui.Control({
                context: this.context,
                tagName: 'li',
                class: 'log-item',
                content: entry
            });
            item.dom.attributes['data-test'] = `log-entry-${index}`;
            list_container.add(item);
        });
    }

    render_list_dom(list_el, entries, test_prefix) {
        if (!list_el) return;
        list_el.innerHTML = '';
        entries.forEach((entry, index) => {
            const item_el = document.createElement('li');
            item_el.className = test_prefix === 'diff-entry' ? 'diff-item' : 'log-item';
            item_el.textContent = entry;
            item_el.setAttribute('data-test', `${test_prefix}-${index}`);
            list_el.appendChild(item_el);
        });
    }

    activate() {
        if (this.__active) return;
        super.activate();

        if (this._dom_bound) return;
        const root_el = this.dom.el;
        if (!root_el) return;
        this._dom_bound = true;

        const display_el = root_el.querySelector('[data-test="count-display"]');
        const status_el = root_el.querySelector('[data-test="status-text"]');
        const progress_el = root_el.querySelector('[data-test="progress-text"]');
        const step_input_el = root_el.querySelector('[data-test="step-input"]');
        const label_input_el = root_el.querySelector('[data-test="label-input"]');
        const increment_button_el = root_el.querySelector('[data-test="increment-button"]');
        const decrement_button_el = root_el.querySelector('[data-test="decrement-button"]');
        const summary_line_el = root_el.querySelector('[data-test="summary-line"]');
        const summary_details_el = root_el.querySelector('[data-test="summary-details"]');
        const debug_status_el = root_el.querySelector('[data-test="debug-status"]');
        const enable_button_el = root_el.querySelector('[data-test="enable-debug"]');
        const disable_button_el = root_el.querySelector('[data-test="disable-debug"]');
        const refresh_button_el = root_el.querySelector('[data-test="refresh-summary"]');
        const snapshot_button_el = root_el.querySelector('[data-test="take-snapshot"]');
        const compare_button_el = root_el.querySelector('[data-test="compare-snapshot"]');
        const log_list_el = root_el.querySelector('[data-test="log-list"]');
        const diff_list_el = root_el.querySelector('[data-test="diff-list"]');

        if (increment_button_el) {
            increment_button_el.addEventListener('click', () => this.adjust_count(1));
        }

        if (decrement_button_el) {
            decrement_button_el.addEventListener('click', () => this.adjust_count(-1));
        }

        if (step_input_el) {
            step_input_el.addEventListener('input', (event) => {
                const raw_value = event && event.target ? event.target.value : '1';
                this.data.model.step = Number(raw_value) || 1;
            });
        }

        if (label_input_el) {
            label_input_el.addEventListener('input', (event) => {
                const raw_value = event && event.target ? event.target.value : '';
                this.data.model.label = raw_value;
            });
        }

        if (enable_button_el) {
            enable_button_el.addEventListener('click', () => this.set_debug_enabled(true));
        }

        if (disable_button_el) {
            disable_button_el.addEventListener('click', () => this.set_debug_enabled(false));
        }

        if (refresh_button_el) {
            refresh_button_el.addEventListener('click', () => this.refresh_debug_summary());
        }

        if (snapshot_button_el) {
            snapshot_button_el.addEventListener('click', () => this.take_snapshot());
        }

        if (compare_button_el) {
            compare_button_el.addEventListener('click', () => this.compare_snapshot());
        }

        this.watch(
            this.view.data.model,
            'display_text',
            (display_text) => {
                if (display_el) display_el.textContent = display_text || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'status_text',
            (status_text) => {
                if (status_el) status_el.textContent = status_text || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'progress_text',
            (progress_text) => {
                if (progress_el) progress_el.textContent = progress_text || '';
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'step',
            (step) => {
                if (step_input_el) {
                    step_input_el.value = String(Number(step) || 1);
                }
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'label',
            (label) => {
                if (label_input_el) {
                    label_input_el.value = label || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'summary_line',
            (summary_line) => {
                if (summary_line_el) summary_line_el.textContent = summary_line || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'summary_details',
            (summary_details) => {
                if (summary_details_el) summary_details_el.textContent = summary_details || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'debug_enabled',
            (debug_enabled) => {
                if (debug_status_el) {
                    debug_status_el.textContent = debug_enabled ? 'Debugger active' : 'Debugger paused';
                    debug_status_el.classList.toggle('is-active', debug_enabled);
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'activity_log',
            (activity_log) => {
                this.render_list_dom(log_list_el, Array.isArray(activity_log) ? activity_log : [], 'log-entry');
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'diff_lines',
            (diff_lines) => {
                this.render_list_dom(diff_list_el, Array.isArray(diff_lines) ? diff_lines : [], 'diff-entry');
            },
            { immediate: true }
        );
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;

        this.add_class('binding-debugger-control');
        this.dom.attributes['data-test'] = 'binding-debugger-control';

        const header = new jsgui.Control({
            context: page_context,
            tagName: 'header',
            class: 'bd-header'
        });

        header.add(new jsgui.Control({
            context: page_context,
            tagName: 'h1',
            class: 'bd-title',
            content: 'Binding Debugger Console'
        }));
        header.add(new jsgui.Control({
            context: page_context,
            tagName: 'p',
            class: 'bd-subtitle',
            content: 'Inspect bindings, computed values, and watch activity in real time.'
        }));

        const live_panel = new jsgui.Control({
            context: page_context,
            tagName: 'section',
            class: 'bd-panel'
        });

        const count_display = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'bd-display',
            content: this.view.data.model.display_text
        });
        count_display.dom.attributes['data-test'] = 'count-display';

        const status_text = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'bd-status',
            content: this.view.data.model.status_text
        });
        status_text.dom.attributes['data-test'] = 'status-text';

        const progress_text = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'bd-progress',
            content: this.view.data.model.progress_text
        });
        progress_text.dom.attributes['data-test'] = 'progress-text';

        const controls = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'bd-controls'
        });

        const decrement_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'bd-button',
            content: 'Decrease'
        });
        decrement_button.dom.attributes['data-test'] = 'decrement-button';

        const increment_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'bd-button',
            content: 'Increase'
        });
        increment_button.dom.attributes['data-test'] = 'increment-button';

        controls.add(decrement_button);
        controls.add(increment_button);

        const field_grid = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'bd-fields'
        });

        const step_field = new jsgui.Control({
            context: page_context,
            tagName: 'label',
            class: 'bd-field'
        });
        step_field.add('Step size');
        const step_input = new jsgui.Control({
            context: page_context,
            tagName: 'input',
            class: 'bd-input'
        });
        step_input.dom.attributes.type = 'number';
        step_input.dom.attributes.min = '1';
        step_input.dom.attributes['data-test'] = 'step-input';
        step_field.add(step_input);

        const label_field = new jsgui.Control({
            context: page_context,
            tagName: 'label',
            class: 'bd-field'
        });
        label_field.add('Signal label');
        const label_input = new jsgui.Control({
            context: page_context,
            tagName: 'input',
            class: 'bd-input'
        });
        label_input.dom.attributes.type = 'text';
        label_input.dom.attributes['data-test'] = 'label-input';
        label_field.add(label_input);

        field_grid.add(step_field);
        field_grid.add(label_field);

        live_panel.add(count_display);
        live_panel.add(status_text);
        live_panel.add(progress_text);
        live_panel.add(controls);
        live_panel.add(field_grid);

        const debug_panel = new jsgui.Control({
            context: page_context,
            tagName: 'section',
            class: 'bd-panel'
        });

        const debug_status = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'bd-debug-status',
            content: 'Debugger paused'
        });
        debug_status.dom.attributes['data-test'] = 'debug-status';

        const summary_line = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'bd-summary-line',
            content: this.view.data.model.summary_line
        });
        summary_line.dom.attributes['data-test'] = 'summary-line';

        const summary_details = new jsgui.Control({
            context: page_context,
            tagName: 'pre',
            class: 'bd-summary-details',
            content: this.view.data.model.summary_details
        });
        summary_details.dom.attributes['data-test'] = 'summary-details';

        const debug_actions = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'bd-actions'
        });

        const enable_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'bd-button is-secondary',
            content: 'Enable'
        });
        enable_button.dom.attributes['data-test'] = 'enable-debug';

        const disable_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'bd-button is-secondary',
            content: 'Disable'
        });
        disable_button.dom.attributes['data-test'] = 'disable-debug';

        const refresh_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'bd-button is-secondary',
            content: 'Refresh summary'
        });
        refresh_button.dom.attributes['data-test'] = 'refresh-summary';

        const snapshot_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'bd-button is-secondary',
            content: 'Take snapshot'
        });
        snapshot_button.dom.attributes['data-test'] = 'take-snapshot';

        const compare_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'bd-button is-secondary',
            content: 'Compare'
        });
        compare_button.dom.attributes['data-test'] = 'compare-snapshot';

        debug_actions.add(enable_button);
        debug_actions.add(disable_button);
        debug_actions.add(refresh_button);
        debug_actions.add(snapshot_button);
        debug_actions.add(compare_button);

        const diff_list = new jsgui.Control({
            context: page_context,
            tagName: 'ul',
            class: 'bd-diff-list'
        });
        diff_list.dom.attributes['data-test'] = 'diff-list';

        const log_title = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'bd-log-title',
            content: 'Recent activity'
        });

        const log_list = new jsgui.Control({
            context: page_context,
            tagName: 'ul',
            class: 'bd-log-list'
        });
        log_list.dom.attributes['data-test'] = 'log-list';

        this.render_log_list(log_list, this.view.data.model.activity_log);

        debug_panel.add(debug_status);
        debug_panel.add(summary_line);
        debug_panel.add(summary_details);
        debug_panel.add(debug_actions);
        debug_panel.add(diff_list);
        debug_panel.add(log_title);
        debug_panel.add(log_list);

        const layout = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'bd-layout'
        });

        layout.add(live_panel);
        layout.add(debug_panel);

        this.add(header);
        this.add(layout);
    }
}

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'binding_debugger_demo_ui';
        super(spec);

        if (!spec.el) {
            this.compose();
        }
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;
        this.body.add_class('binding-debugger-demo');

        const main_control = new Binding_Debugger_Control({
            context: page_context
        });

        this.body.add(main_control);
    }
}

Demo_UI.css = `
:root {
    --bd-ink: #121217;
    --bd-muted: #5a5a66;
    --bd-accent: #2c6e63;
    --bd-accent-soft: #e0efe9;
    --bd-panel: #ffffff;
    --bd-border: #d8d8de;
    --bd-bg: #f0f1f6;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    background: linear-gradient(160deg, #e8f0f5 0%, #eef4f0 45%, #f7f2ea 100%);
    color: var(--bd-ink);
    font-family: "Space Grotesk", "Segoe UI", sans-serif;
}

.binding-debugger-demo {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
}

.binding-debugger-control {
    width: min(1000px, 100%);
    background: var(--bd-panel);
    border-radius: 26px;
    padding: 32px 36px 40px;
    border: 1px solid var(--bd-border);
    box-shadow: 0 28px 70px rgba(18, 18, 28, 0.16);
}

.bd-header {
    margin-bottom: 24px;
}

.bd-title {
    margin: 0 0 8px;
    font-size: 30px;
}

.bd-subtitle {
    margin: 0;
    color: var(--bd-muted);
    font-size: 15px;
}

.bd-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.bd-panel {
    background: #fdfdfc;
    border-radius: 18px;
    border: 1px solid #e6e7ec;
    padding: 18px 20px;
    display: grid;
    gap: 12px;
}

.bd-display {
    font-size: 22px;
    font-weight: 600;
}

.bd-status,
.bd-progress {
    font-size: 14px;
    color: var(--bd-muted);
}

.bd-controls {
    display: flex;
    gap: 10px;
}

.bd-button {
    background: var(--bd-accent);
    color: #fff;
    border: none;
    border-radius: 999px;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 13px;
    font-family: "Space Grotesk", "Segoe UI", sans-serif;
}

.bd-button.is-secondary {
    background: var(--bd-accent-soft);
    color: #1f3d36;
}

.bd-fields {
    display: grid;
    gap: 12px;
}

.bd-field {
    display: grid;
    gap: 6px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.bd-input {
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid #cfd3da;
    font-size: 14px;
}

.bd-debug-status {
    font-size: 13px;
    font-weight: 600;
    color: var(--bd-muted);
}

.bd-debug-status.is-active {
    color: var(--bd-accent);
}

.bd-summary-line {
    font-size: 14px;
    font-weight: 600;
}

.bd-summary-details {
    background: #f4f5f8;
    padding: 12px;
    border-radius: 12px;
    font-size: 12px;
    max-height: 160px;
    overflow: auto;
}

.bd-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.bd-diff-list,
.bd-log-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 6px;
}

.diff-item,
.log-item {
    background: #f7f8fb;
    border-radius: 10px;
    padding: 8px 10px;
    font-size: 12px;
}

.bd-log-title {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--bd-muted);
}

@media (max-width: 900px) {
    .bd-layout {
        grid-template-columns: 1fr;
    }
}
`;

jsgui.controls.Binding_Debugger_Control = Binding_Debugger_Control;
jsgui.controls.Demo_UI = Demo_UI;
jsgui.controls.binding_debugger_demo_ui = Demo_UI;

module.exports = jsgui;
