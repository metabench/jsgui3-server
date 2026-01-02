const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const { Data_Object } = jsgui;

const Data_Transform_Resource = jsgui.Resource.Data_Transform;

const DEFAULT_RECORDS = Object.freeze([
    { id: 'A1', project: 'Atlas', owner: 'Ada Lovelace', hours: 18.5, status: 'Complete' },
    { id: 'B2', project: 'Beacon', owner: 'Grace Hopper', hours: 12, status: 'In Progress' },
    { id: 'C3', project: 'Compass', owner: 'Katherine Johnson', hours: 22.75, status: 'Complete' },
    { id: 'D4', project: 'Dawn', owner: 'Mary Jackson', hours: 9, status: 'Review' }
]);

const PIPELINE_STEPS = Object.freeze([
    'Normalize incoming records',
    'Filter by minimum hours',
    'Aggregate summary metrics',
    'Prepare focus output'
]);

const title_case = (value) => {
    const raw_value = value ? String(value) : '';
    return raw_value.replace(/\w\S*/g, (word) => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
};

class Pipeline_Transform_Resource extends Data_Transform_Resource {
    constructor(spec = {}) {
        super(spec);
        this.name = spec.name || 'pipeline_transform_resource';
    }

    async transform(records = [], options = {}) {
        return this.run_pipeline(records, options);
    }

    async run_pipeline(records, options) {
        const normalized_records = this.normalize_records(records);
        const min_hours = Number.isFinite(options.min_hours) ? options.min_hours : 0;
        const filtered_records = normalized_records.filter((record) => record.hours >= min_hours);
        const summary = this.build_summary(filtered_records);
        const output_lines = this.build_output_lines(filtered_records, options.mode || 'focus');

        await this.sleep(280);

        return {
            summary,
            output_lines,
            filtered_records
        };
    }

    normalize_records(records) {
        const raw_records = Array.isArray(records) ? records : [];
        return raw_records.map((record) => {
            return {
                id: record.id ? String(record.id).toUpperCase() : 'N/A',
                project: title_case(record.project),
                owner: title_case(record.owner),
                hours: Number(record.hours) || 0,
                status: title_case(record.status)
            };
        });
    }

    build_summary(records) {
        const record_count = records.length;
        const total_hours = records.reduce((acc, record) => acc + record.hours, 0);
        const avg_hours = record_count ? total_hours / record_count : 0;
        const complete_count = records.filter((record) => record.status === 'Complete').length;

        return {
            record_count,
            total_hours,
            avg_hours,
            complete_count
        };
    }

    build_output_lines(records, mode) {
        if (mode === 'status') {
            const counts = records.reduce((acc, record) => {
                acc[record.status] = (acc[record.status] || 0) + 1;
                return acc;
            }, {});
            return Object.keys(counts).sort().map((status) => {
                return `${status}: ${counts[status]} record(s)`;
            });
        }

        const sorted_records = records.slice().sort((a, b) => b.hours - a.hours);
        return sorted_records.slice(0, 3).map((record) => {
            return `${record.project} - ${record.owner} | ${record.hours}h`;
        });
    }

    sleep(duration_ms) {
        return new Promise((resolve) => setTimeout(resolve, duration_ms));
    }
}

class Resource_Transform_Control extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'resource_transform_control';
        super(spec);

        this.transform_resource = new Pipeline_Transform_Resource();
        this.log_counter = 0;

        this.data.model = new Data_Object({
            transform_mode: 'focus',
            min_hours: 0
        });
        this.data.model.set('records', spec.records || DEFAULT_RECORDS, true);

        this.view.data.model = new Data_Object({
            status_text: 'Idle: ready to transform.',
            summary_text: 'No transform yet.',
            output_lines: [],
            last_run_text: 'Not run',
            error_text: '',
            is_busy: false
        });

        if (!spec.el) {
            this.compose();
        }
    }

    get_records() {
        return Array.isArray(this.data.model.records) ? this.data.model.records.slice() : [];
    }

    format_summary(summary) {
        const record_count = summary.record_count;
        const total_hours = this.transforms.number.toFixed(summary.total_hours, 2);
        const avg_hours = this.transforms.number.toFixed(summary.avg_hours, 1);
        return `${record_count} records | ${total_hours} total hours | Avg ${avg_hours} hrs`;
    }

    async run_transform() {
        if (this.view.data.model.is_busy) return;

        this.view.data.model.is_busy = true;
        this.view.data.model.status_text = 'Transforming records...';
        this.view.data.model.error_text = '';

        const transform_mode = this.data.model.transform_mode;
        const min_hours = Number(this.data.model.min_hours) || 0;
        const records = this.get_records();

        try {
            const result = await this.transform_resource.transform(records, {
                mode: transform_mode,
                min_hours
            });
            this.view.data.model.summary_text = this.format_summary(result.summary);
            this.view.data.model.output_lines = result.output_lines;
            this.view.data.model.status_text = 'Transform complete.';
            this.view.data.model.last_run_text = `Run #${this.next_log_index()}`;
        } catch (error) {
            this.view.data.model.status_text = 'Transform failed.';
            this.view.data.model.error_text = error && error.message ? error.message : 'Unknown error.';
        } finally {
            this.view.data.model.is_busy = false;
        }
    }

    next_log_index() {
        this.log_counter += 1;
        return this.log_counter;
    }

    render_output_list(list_container, output_lines) {
        list_container.clear();

        output_lines.forEach((line, index) => {
            const item = new jsgui.Control({
                context: this.context,
                tagName: 'li',
                class: 'output-item',
                content: line
            });
            item.dom.attributes['data-test'] = `output-line-${index}`;
            list_container.add(item);
        });
    }

    render_output_dom(list_el, output_lines) {
        if (!list_el) return;
        list_el.innerHTML = '';

        output_lines.forEach((line, index) => {
            const item_el = document.createElement('li');
            item_el.className = 'output-item';
            item_el.textContent = line;
            item_el.setAttribute('data-test', `output-line-${index}`);
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

        const status_el = root_el.querySelector('[data-test="transform-status"]');
        const summary_el = root_el.querySelector('[data-test="summary-text"]');
        const run_button_el = root_el.querySelector('[data-test="run-transform"]');
        const output_list_el = root_el.querySelector('[data-test="output-list"]');
        const mode_select_el = root_el.querySelector('[data-test="mode-select"]');
        const min_hours_el = root_el.querySelector('[data-test="min-hours-input"]');
        const last_run_el = root_el.querySelector('[data-test="last-run"]');
        const error_el = root_el.querySelector('[data-test="error-text"]');

        if (run_button_el) {
            run_button_el.addEventListener('click', () => this.run_transform());
        }

        if (mode_select_el) {
            mode_select_el.addEventListener('change', (event) => {
                const value = event && event.target ? event.target.value : 'focus';
                this.data.model.transform_mode = value;
            });
        }

        if (min_hours_el) {
            min_hours_el.addEventListener('input', (event) => {
                const raw_value = event && event.target ? event.target.value : '0';
                this.data.model.min_hours = Number(raw_value) || 0;
            });
        }

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
            'summary_text',
            (summary_text) => {
                if (summary_el) summary_el.textContent = summary_text || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'output_lines',
            (output_lines) => {
                this.render_output_dom(output_list_el, Array.isArray(output_lines) ? output_lines : []);
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'last_run_text',
            (last_run_text) => {
                if (last_run_el) last_run_el.textContent = last_run_text || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'error_text',
            (error_text) => {
                if (error_el) {
                    error_el.textContent = error_text || '';
                    error_el.classList.toggle('has-error', !!error_text);
                }
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'transform_mode',
            (transform_mode) => {
                if (mode_select_el) {
                    mode_select_el.value = transform_mode || 'focus';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'min_hours',
            (min_hours) => {
                if (min_hours_el) {
                    min_hours_el.value = String(Number(min_hours) || 0);
                }
            },
            { immediate: true }
        );
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;

        this.add_class('resource-transform-control');
        this.dom.attributes['data-test'] = 'resource-transform-control';

        const header = new jsgui.Control({
            context: page_context,
            tagName: 'header',
            class: 'rt-header'
        });

        const title = new jsgui.Control({
            context: page_context,
            tagName: 'h1',
            class: 'rt-title',
            content: 'Resource Transform Pipeline'
        });

        const subtitle = new jsgui.Control({
            context: page_context,
            tagName: 'p',
            class: 'rt-subtitle',
            content: 'Run a data transform resource and inspect the summary output.'
        });

        header.add(title);
        header.add(subtitle);

        const controls_panel = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'rt-controls'
        });

        const mode_field = new jsgui.Control({
            context: page_context,
            tagName: 'label',
            class: 'rt-field'
        });
        mode_field.add('Mode');
        const mode_select = new jsgui.Control({
            context: page_context,
            tagName: 'select',
            class: 'rt-select'
        });
        mode_select.dom.attributes['data-test'] = 'mode-select';
        ['focus', 'status'].forEach((mode) => {
            const option = new jsgui.Control({
                context: page_context,
                tagName: 'option',
                content: mode === 'focus' ? 'Focus list' : 'Status counts'
            });
            option.dom.attributes.value = mode;
            mode_select.add(option);
        });
        mode_field.add(mode_select);

        const min_hours_field = new jsgui.Control({
            context: page_context,
            tagName: 'label',
            class: 'rt-field'
        });
        min_hours_field.add('Min hours');
        const min_hours_input = new jsgui.Control({
            context: page_context,
            tagName: 'input',
            class: 'rt-input'
        });
        min_hours_input.dom.attributes.type = 'number';
        min_hours_input.dom.attributes.min = '0';
        min_hours_input.dom.attributes.step = '1';
        min_hours_input.dom.attributes['data-test'] = 'min-hours-input';
        min_hours_field.add(min_hours_input);

        const run_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'rt-button',
            content: 'Run transform'
        });
        run_button.dom.attributes['data-test'] = 'run-transform';

        controls_panel.add(mode_field);
        controls_panel.add(min_hours_field);
        controls_panel.add(run_button);

        const pipeline_panel = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'rt-pipeline'
        });

        const pipeline_title = new jsgui.Control({
            context: page_context,
            tagName: 'h2',
            class: 'rt-section-title',
            content: 'Pipeline Steps'
        });

        const pipeline_list = new jsgui.Control({
            context: page_context,
            tagName: 'ol',
            class: 'rt-pipeline-list'
        });

        PIPELINE_STEPS.forEach((step) => {
            pipeline_list.add(new jsgui.Control({
                context: page_context,
                tagName: 'li',
                content: step
            }));
        });

        pipeline_panel.add(pipeline_title);
        pipeline_panel.add(pipeline_list);

        const output_panel = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'rt-output'
        });

        const status_text = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'rt-status',
            content: this.view.data.model.status_text
        });
        status_text.dom.attributes['data-test'] = 'transform-status';

        const last_run = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'rt-last-run',
            content: this.view.data.model.last_run_text
        });
        last_run.dom.attributes['data-test'] = 'last-run';

        const summary_text = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'rt-summary',
            content: this.view.data.model.summary_text
        });
        summary_text.dom.attributes['data-test'] = 'summary-text';

        const error_text = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'rt-error',
            content: this.view.data.model.error_text
        });
        error_text.dom.attributes['data-test'] = 'error-text';

        const output_list = new jsgui.Control({
            context: page_context,
            tagName: 'ul',
            class: 'rt-output-list'
        });
        output_list.dom.attributes['data-test'] = 'output-list';

        this.render_output_list(output_list, this.view.data.model.output_lines);

        output_panel.add(status_text);
        output_panel.add(last_run);
        output_panel.add(summary_text);
        output_panel.add(error_text);
        output_panel.add(output_list);

        const layout = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'rt-layout'
        });
        layout.add(controls_panel);
        layout.add(pipeline_panel);
        layout.add(output_panel);

        this.add(header);
        this.add(layout);
    }
}

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'resource_transform_demo_ui';
        super(spec);

        if (!spec.el) {
            this.compose();
        }
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;
        this.body.add_class('resource-transform-demo');

        const main_control = new Resource_Transform_Control({
            context: page_context,
            records: DEFAULT_RECORDS
        });

        this.body.add(main_control);
    }
}

Demo_UI.css = `
:root {
    --rt-ink: #1d1d22;
    --rt-muted: #6a6a76;
    --rt-accent: #db6b3d;
    --rt-panel: #ffffff;
    --rt-border: #d9d2c8;
    --rt-bg: #f8f3ec;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    background: radial-gradient(circle at top, #fdf7f0 0%, #f3e9dc 55%, #e6ded3 100%);
    color: var(--rt-ink);
    font-family: "Libre Baskerville", "Georgia", serif;
}

.resource-transform-demo {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
}

.resource-transform-control {
    width: min(980px, 100%);
    background: var(--rt-panel);
    border-radius: 24px;
    padding: 32px 36px 40px;
    border: 1px solid var(--rt-border);
    box-shadow: 0 26px 60px rgba(50, 41, 32, 0.18);
}

.rt-header {
    margin-bottom: 24px;
}

.rt-title {
    margin: 0 0 8px;
    font-size: 30px;
}

.rt-subtitle {
    margin: 0;
    color: var(--rt-muted);
    font-size: 15px;
}

.rt-layout {
    display: grid;
    grid-template-columns: 1.1fr 1fr 1.2fr;
    gap: 20px;
}

.rt-controls,
.rt-pipeline,
.rt-output {
    background: #fdfbf7;
    border-radius: 16px;
    padding: 18px 20px;
    border: 1px solid #efe6d8;
}

.rt-controls {
    display: grid;
    gap: 14px;
}

.rt-field {
    display: grid;
    gap: 6px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.rt-select,
.rt-input {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid #cfc8bc;
    font-size: 14px;
    font-family: "Fira Sans", "Arial", sans-serif;
}

.rt-button {
    background: var(--rt-accent);
    border: none;
    color: #ffffff;
    padding: 12px 16px;
    border-radius: 999px;
    font-size: 14px;
    cursor: pointer;
    font-family: "Fira Sans", "Arial", sans-serif;
}

.rt-button:hover {
    filter: brightness(0.95);
}

.rt-section-title {
    margin: 0 0 12px;
    font-size: 16px;
}

.rt-pipeline-list {
    margin: 0;
    padding-left: 20px;
    color: var(--rt-muted);
    font-size: 14px;
    display: grid;
    gap: 8px;
}

.rt-output {
    display: grid;
    gap: 10px;
}

.rt-status {
    font-weight: 600;
}

.rt-last-run {
    font-size: 12px;
    color: var(--rt-muted);
}

.rt-summary {
    font-size: 14px;
}

.rt-error {
    font-size: 12px;
    color: #b0482e;
}

.rt-error.has-error {
    font-weight: 600;
}

.rt-output-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
}

.output-item {
    background: #fff5ea;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 13px;
}

@media (max-width: 900px) {
    .rt-layout {
        grid-template-columns: 1fr;
    }
}
`;

jsgui.controls.Resource_Transform_Control = Resource_Transform_Control;
jsgui.controls.Demo_UI = Demo_UI;
jsgui.controls.resource_transform_demo_ui = Demo_UI;

module.exports = jsgui;
