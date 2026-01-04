const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;

const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

const { Badge, Progress_Bar, Range_Input, Text_Input, Window } = controls;

const is_defined = value => value !== undefined && value !== null;

const normalize_model_value = value => {
    if (value && value.__data_value) {
        return typeof value.value === 'function' ? value.value() : value.value;
    }
    return value;
};

const get_model_value = (model, name) => {
    if (!model) return undefined;
    if (typeof model.get === 'function') {
        return normalize_model_value(model.get(name));
    }
    return normalize_model_value(model[name]);
};

const set_model_value = (model, name, value) => {
    if (!model) return;
    const current_value = get_model_value(model, name);
    if (current_value === value) return;
    if (typeof model.set === 'function') {
        model.set(name, value);
    } else {
        model[name] = value;
    }
};

const set_control_text = (ctrl, text) => {
    if (!ctrl) return;
    ctrl.clear();
    if (text) {
        ctrl.add(String(text));
    }
};

const normalize_score = value => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Math.max(0, Math.min(100, numeric));
};

const score_to_status = score => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'info';
    if (score >= 30) return 'warn';
    return 'error';
};

const score_status_label = status => {
    switch (status) {
        case 'success':
            return 'HIGH';
        case 'info':
            return 'GOOD';
        case 'warn':
            return 'WARM';
        case 'error':
        default:
            return 'LOW';
    }
};

class Profile_Panel extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'profile_panel';
        super(spec);
        this.add_class('profile-panel');

        this.apply_default_model_values(spec);

        if (!spec.el) {
            this.compose_profile_panel();
        }

        this.setup_view_watchers();
        this.setup_model_bindings();
    }

    apply_default_model_values(spec = {}) {
        const data_model = this.data && this.data.model;
        if (!data_model) return;

        const first_name = is_defined(spec.first_name) ? spec.first_name : 'Ada';
        const last_name = is_defined(spec.last_name) ? spec.last_name : 'Lovelace';
        const role = is_defined(spec.role) ? spec.role : 'Analyst';
        const score = is_defined(spec.score) ? normalize_score(spec.score) : 72;

        set_model_value(data_model, 'first_name', first_name);
        set_model_value(data_model, 'last_name', last_name);
        set_model_value(data_model, 'role', role);
        set_model_value(data_model, 'score', score);
    }

    compose_profile_panel() {
        const { context } = this;

        const header_ctrl = new Control({
            context,
            tag_name: 'div'
        });
        header_ctrl.add_class('profile-header');

        const title_ctrl = new Control({
            context,
            tag_name: 'div'
        });
        title_ctrl.add_class('profile-title');
        title_ctrl.add('Profile Preview');

        const score_badge = new Badge({
            context,
            status: 'info',
            text: 'WARM'
        });

        header_ctrl.add(title_ctrl);
        header_ctrl.add(score_badge);

        const summary_ctrl = new Control({
            context,
            tag_name: 'div'
        });
        summary_ctrl.add_class('profile-summary');

        const summary_name = new Control({
            context,
            tag_name: 'div'
        });
        summary_name.add_class('profile-name');

        const summary_meta = new Control({
            context,
            tag_name: 'div'
        });
        summary_meta.add_class('profile-meta');

        summary_ctrl.add(summary_name);
        summary_ctrl.add(summary_meta);

        const fields_ctrl = new Control({
            context,
            tag_name: 'div'
        });
        fields_ctrl.add_class('profile-fields');

        const first_name_input = new Text_Input({
            context,
            placeholder: 'Ada'
        });
        first_name_input.add_class('profile-input');

        const last_name_input = new Text_Input({
            context,
            placeholder: 'Lovelace'
        });
        last_name_input.add_class('profile-input');

        const role_input = new Text_Input({
            context,
            placeholder: 'Analyst'
        });
        role_input.add_class('profile-input');

        const score_input = new Range_Input({
            context,
            min: 0,
            max: 100,
            step: 1
        });
        score_input.add_class('profile-range');

        const progress_bar = new Progress_Bar({
            context,
            max: 100,
            value: 0
        });
        progress_bar.add_class('profile-progress');

        const score_value = new Control({
            context,
            tag_name: 'div'
        });
        score_value.add_class('profile-score');

        const score_stack = new Control({
            context,
            tag_name: 'div'
        });
        score_stack.add_class('profile-score-stack');
        score_stack.add(score_input);
        score_stack.add(progress_bar);

        fields_ctrl.add(this.create_field_row('First name', first_name_input));
        fields_ctrl.add(this.create_field_row('Last name', last_name_input));
        fields_ctrl.add(this.create_field_row('Role', role_input));
        fields_ctrl.add(this.create_field_row('Confidence', score_stack, score_value));

        this.add(header_ctrl);
        this.add(summary_ctrl);
        this.add(fields_ctrl);

        this.score_badge = score_badge;
        this.summary_name = summary_name;
        this.summary_meta = summary_meta;
        this.first_name_input = first_name_input;
        this.last_name_input = last_name_input;
        this.role_input = role_input;
        this.score_input = score_input;
        this.progress_bar = progress_bar;
        this.score_value = score_value;
    }

    create_field_row(label_text, input_ctrl, meta_ctrl = null) {
        const row_ctrl = new Control({
            context: this.context,
            tag_name: 'div'
        });
        row_ctrl.add_class('profile-field');

        const label_ctrl = new Control({
            context: this.context,
            tag_name: 'label'
        });
        label_ctrl.add_class('profile-label');
        label_ctrl.add(label_text);

        row_ctrl.add(label_ctrl);
        row_ctrl.add(input_ctrl);
        if (meta_ctrl) {
            row_ctrl.add(meta_ctrl);
        }

        return row_ctrl;
    }

    setup_view_watchers() {
        const view_model = this.view && this.view.data ? this.view.data.model : null;
        if (!view_model) return;

        this.watch(view_model, 'first_name', value => {
            const normalized = normalize_model_value(value);
            if (this.first_name_input) {
                this.first_name_input.set_value(normalized || '');
            }
        });

        this.watch(view_model, 'last_name', value => {
            const normalized = normalize_model_value(value);
            if (this.last_name_input) {
                this.last_name_input.set_value(normalized || '');
            }
        });

        this.watch(view_model, 'role', value => {
            const normalized = normalize_model_value(value);
            if (this.role_input) {
                this.role_input.set_value(normalized || '');
            }
        });

        this.watch(view_model, 'score', value => {
            const normalized = normalize_score(normalize_model_value(value));
            if (this.score_input) {
                this.score_input.set_value(normalized);
            }
            if (this.progress_bar) {
                this.progress_bar.set_value(normalized);
            }
        });

        this.watch(view_model, 'full_name', value => {
            set_control_text(this.summary_name, normalize_model_value(value) || 'New profile');
        });

        this.watch(view_model, 'summary_line', value => {
            set_control_text(this.summary_meta, normalize_model_value(value) || 'Role TBD - 0% confidence');
        });

        this.watch(view_model, 'score_label', value => {
            set_control_text(this.score_value, normalize_model_value(value) || '0%');
        });

        this.watch(view_model, 'score_status', value => {
            if (!this.score_badge) return;
            const status = normalize_model_value(value) || 'info';
            this.score_badge.set_status(status);
            this.score_badge.set_text(score_status_label(status));
        });
    }

    setup_model_bindings() {
        const data_model = this.data && this.data.model;
        const view_model = this.view && this.view.data ? this.view.data.model : null;
        if (!data_model || !view_model) return;

        const field_names = ['first_name', 'last_name', 'role', 'score'];

        field_names.forEach(field_name => {
            set_model_value(view_model, field_name, get_model_value(data_model, field_name));
        });

        data_model.on('change', e_change => {
            if (!e_change || !field_names.includes(e_change.name)) return;
            const raw_value = is_defined(e_change.raw_value)
                ? e_change.raw_value
                : normalize_model_value(e_change.value);
            set_model_value(view_model, e_change.name, raw_value);
        });

        this.computed(
            view_model,
            ['first_name', 'last_name'],
            (first, last) => {
                const safe_first = first ? String(first).trim() : '';
                const safe_last = last ? String(last).trim() : '';
                const full_name = `${safe_first} ${safe_last}`.trim();
                return full_name || 'New profile';
            },
            { propertyName: 'full_name' }
        );

        this.computed(
            view_model,
            ['score'],
            score => `${Math.round(normalize_score(score))}%`,
            { propertyName: 'score_label' }
        );

        this.computed(
            view_model,
            ['score'],
            score => score_to_status(normalize_score(score)),
            { propertyName: 'score_status' }
        );

        this.computed(
            view_model,
            ['full_name', 'role', 'score_label'],
            (full_name, role, score_label) => {
                const safe_name = full_name || 'New profile';
                const safe_role = role ? String(role).trim() : 'Role TBD';
                const safe_score = score_label || '0%';
                return `${safe_name} - ${safe_role} - ${safe_score} confidence`;
            },
            { propertyName: 'summary_line' }
        );
    }

    activate() {
        if (!this.__active) {
            super.activate();

            const data_model = this.data && this.data.model;
            if (!data_model) return;

            if (this.first_name_input) {
                this.first_name_input.on('input', () => {
                    set_model_value(data_model, 'first_name', this.first_name_input.get_value() || '');
                });
            }

            if (this.last_name_input) {
                this.last_name_input.on('input', () => {
                    set_model_value(data_model, 'last_name', this.last_name_input.get_value() || '');
                });
            }

            if (this.role_input) {
                this.role_input.on('input', () => {
                    set_model_value(data_model, 'role', this.role_input.get_value() || '');
                });
            }

            if (this.score_input) {
                this.score_input.on('input', () => {
                    const normalized = normalize_score(this.score_input.get_value());
                    set_model_value(data_model, 'score', normalized);
                });
            }
        }
    }
}

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const { context } = this;

        if (typeof this.body.add_class === 'function') {
            this.body.add_class('demo-ui');
        }

        const compose_ui = () => {
            const window_ctrl = new Window({
                context,
                title: 'jsgui3-html MVVM Binding',
                pos: [20, 20]
            });

            window_ctrl.size = [620, 460];

            const profile_panel = new Profile_Panel({
                context
            });

            window_ctrl.inner.add(profile_panel);
            this.body.add(window_ctrl);

            this.profile_panel = profile_panel;
        };

        if (!spec.el) {
            compose_ui();
        }
    }
}

Demo_UI.css = `
* {
    margin: 0;
    padding: 0;
}

body {
    overflow-x: hidden;
    overflow-y: hidden;
    background-color: #e0e0e0;
}

.demo-ui .window .inner {
    padding: 16px;
}

.profile-panel {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.profile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.profile-title {
    font-weight: 600;
    font-size: 1.1em;
}

.profile-summary {
    background: #f7f7f7;
    border-radius: 6px;
    padding: 10px 12px;
}

.profile-name {
    font-size: 1.2em;
    font-weight: 600;
    margin-bottom: 4px;
}

.profile-meta {
    color: #555;
    font-size: 0.9em;
}

.profile-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.profile-field {
    display: grid;
    grid-template-columns: 140px 1fr auto;
    gap: 12px;
    align-items: center;
}

.profile-label {
    font-weight: 600;
}

.profile-input {
    width: 100%;
}

.profile-score-stack {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.profile-score {
    min-width: 64px;
    text-align: right;
    font-weight: 600;
}

.profile-progress {
    width: 100%;
}

@media (max-width: 720px) {
    .demo-ui .window .inner {
        padding: 12px;
    }

    .profile-field {
        grid-template-columns: 1fr;
    }

    .profile-score {
        text-align: left;
    }
}
`;

controls.Demo_UI = Demo_UI;
module.exports = jsgui;
