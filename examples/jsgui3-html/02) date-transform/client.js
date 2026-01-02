const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const { Data_Object } = jsgui;

const DEFAULT_MIN_ISO = '2024-01-01';
const DEFAULT_MAX_ISO = '2024-12-31';
const DEFAULT_ISO_DATE = '2024-06-15';

const LOCALE_OPTIONS = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'de-DE', label: 'Deutsch (DE)' },
    { value: 'fr-FR', label: 'Francais (FR)' },
    { value: 'ja-JP', label: 'Japanese (JP)' }
];

class Date_Transform_Control extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'date_transform_control';
        super(spec);

        this.data.model = new Data_Object({
            iso_date: spec.iso_date || DEFAULT_ISO_DATE,
            locale: spec.locale || 'en-US',
            min_iso: spec.min_iso || DEFAULT_MIN_ISO,
            max_iso: spec.max_iso || DEFAULT_MAX_ISO
        });

        this.view.data.model = new Data_Object({
            iso_text: '',
            local_format: '',
            local_input: '',
            local_display: '',
            range_message: '',
            relative_text: '',
            local_error: '',
            iso_error: ''
        });

        this.setup_bindings();
        this.setup_computed();
        this.setup_watchers();

        if (!spec.el) {
            this.compose();
        }
    }

    setup_bindings() {
        this.bind({
            iso_date: {
                to: 'iso_text',
                transform: (iso_date) => iso_date || ''
            }
        });
    }

    setup_computed() {
        this.computed(
            this.data.model,
            ['locale'],
            (locale) => this.transforms.date.resolve_i18n_format(locale),
            { propertyName: 'local_format', target: this.view.data.model }
        );

        this.computed(
            this.data.model,
            ['iso_date', 'locale'],
            (iso_date, locale) => this.transforms.date.format_iso_to_locale(iso_date, locale),
            { propertyName: 'local_display', target: this.view.data.model }
        );

        this.computed(
            this.data.model,
            ['iso_date'],
            (iso_date) => this.transforms.date.relative(iso_date),
            { propertyName: 'relative_text', target: this.view.data.model }
        );

        this.computed(
            this.data.model,
            ['iso_date'],
            (iso_date) => {
                if (!iso_date) return 'ISO date is required.';
                if (!this.is_iso_valid(iso_date)) return 'ISO date must be YYYY-MM-DD.';
                return '';
            },
            { propertyName: 'iso_error', target: this.view.data.model }
        );

        this.computed(
            this.data.model,
            ['iso_date', 'min_iso', 'max_iso', 'locale'],
            (iso_date, min_iso, max_iso, locale) => {
                if (!iso_date) return 'Enter a date to see the range.';
                if (!this.is_iso_valid(iso_date)) return 'ISO date must be YYYY-MM-DD.';
                if (!this.is_in_range(iso_date, min_iso, max_iso)) {
                    const min_display = this.transforms.date.format_iso_to_locale(min_iso, locale);
                    const max_display = this.transforms.date.format_iso_to_locale(max_iso, locale);
                    return `Date must be between ${min_display} and ${max_display}.`;
                }
                return 'Date is within range.';
            },
            { propertyName: 'range_message', target: this.view.data.model }
        );
    }

    setup_watchers() {
        this.watch(
            this.view.data.model,
            'local_display',
            (local_display) => {
                if (!local_display) return;
                if (this.view.data.model.local_input !== local_display) {
                    this.view.data.model.local_input = local_display;
                }
                if (this.view.data.model.local_error) {
                    this.view.data.model.local_error = '';
                }
            },
            { immediate: true }
        );
    }

    is_iso_valid(iso_date) {
        return Boolean(this.transforms.date.iso_to_parts(iso_date));
    }

    is_in_range(iso_date, min_iso, max_iso) {
        if (!this.is_iso_valid(iso_date)) return false;
        if (min_iso && iso_date < min_iso) return false;
        if (max_iso && iso_date > max_iso) return false;
        return true;
    }

    update_iso_from_input(raw_value) {
        const next_value = raw_value ? String(raw_value).trim() : '';
        this.data.model.iso_date = next_value;
    }

    update_iso_from_local_input(raw_value) {
        const locale = this.data.model.locale;
        const format_override = this.view.data.model.local_format ||
            this.transforms.date.resolve_i18n_format(locale);
        const trimmed_value = raw_value ? String(raw_value).trim() : '';
        if (!trimmed_value) {
            this.view.data.model.local_error = '';
            return;
        }

        const parsed_iso = this.transforms.date.parse_i18n_to_iso(
            trimmed_value,
            locale,
            format_override
        );

        if (parsed_iso) {
            this.view.data.model.local_error = '';
            this.data.model.iso_date = parsed_iso;
            return;
        }

        this.view.data.model.local_error = `Invalid date for format ${format_override}.`;
    }

    activate() {
        if (this.__active) return;
        super.activate();

        if (this._dom_bound) return;
        const root_el = this.dom.el;
        if (!root_el) return;
        this._dom_bound = true;

        const locale_select_el = root_el.querySelector('[data-test="locale-select"]');
        const iso_input_el = root_el.querySelector('[data-test="iso-input"]');
        const local_input_el = root_el.querySelector('[data-test="locale-input"]');
        const format_text_el = root_el.querySelector('[data-test="format-text"]');
        const local_display_el = root_el.querySelector('[data-test="local-display"]');
        const relative_display_el = root_el.querySelector('[data-test="relative-display"]');
        const range_message_el = root_el.querySelector('[data-test="range-message"]');
        const iso_error_el = root_el.querySelector('[data-test="iso-error"]');
        const locale_error_el = root_el.querySelector('[data-test="locale-error"]');
        const iso_row_el = iso_input_el ? iso_input_el.closest('.date-row') : null;
        const local_row_el = local_input_el ? local_input_el.closest('.date-row') : null;

        const set_error_state = (row_el, has_error) => {
            if (!row_el) return;
            row_el.classList.toggle('has-error', Boolean(has_error));
        };

        if (locale_select_el) {
            locale_select_el.addEventListener('change', (event) => {
                const locale_value = event && event.target ? event.target.value : 'en-US';
                this.data.model.locale = locale_value;
            });
        }

        if (iso_input_el) {
            iso_input_el.addEventListener('input', (event) => {
                const raw_value = event && event.target ? event.target.value : '';
                this.update_iso_from_input(raw_value);
            });
        }

        if (local_input_el) {
            local_input_el.addEventListener('input', (event) => {
                const raw_value = event && event.target ? event.target.value : '';
                this.view.data.model.local_input = raw_value;
                this.update_iso_from_local_input(raw_value);
            });
        }

        this.watch(
            this.data.model,
            'locale',
            (locale_value) => {
                if (locale_select_el) {
                    locale_select_el.value = locale_value;
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'iso_text',
            (iso_text) => {
                if (iso_input_el) {
                    iso_input_el.value = iso_text || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'local_input',
            (local_value) => {
                if (local_input_el) {
                    local_input_el.value = local_value || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'local_format',
            (local_format) => {
                if (format_text_el) {
                    format_text_el.textContent = `Format: ${local_format}`;
                }
                if (local_input_el) {
                    local_input_el.placeholder = local_format || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'local_display',
            (local_display_value) => {
                if (local_display_el) {
                    local_display_el.textContent = local_display_value || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'relative_text',
            (relative_text) => {
                if (relative_display_el) {
                    relative_display_el.textContent = relative_text || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'range_message',
            (range_message) => {
                if (range_message_el) {
                    range_message_el.textContent = range_message || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'iso_error',
            (iso_error_text) => {
                if (iso_error_el) {
                    iso_error_el.textContent = iso_error_text || '';
                }
                set_error_state(iso_row_el, Boolean(iso_error_text));
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'local_error',
            (local_error_text) => {
                if (locale_error_el) {
                    locale_error_el.textContent = local_error_text || '';
                }
                set_error_state(local_row_el, Boolean(local_error_text));
            },
            { immediate: true }
        );
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;

        this.add_class('date-transform-control');
        this.dom.attributes['data-test'] = 'date-transform-control';

        const card = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'date-card'
        });

        const title = new jsgui.Control({
            context: page_context,
            tagName: 'h1',
            class: 'date-title',
            content: 'Date Transform Lab'
        });

        const subtitle = new jsgui.Control({
            context: page_context,
            tagName: 'p',
            class: 'date-subtitle',
            content: 'Transform locale-specific dates into ISO and validate ranges.'
        });

        const form = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'date-form'
        });

        const create_row = (label_text, input_control, error_control) => {
            const row = new jsgui.Control({
                context: page_context,
                tagName: 'div',
                class: 'date-row'
            });

            const label = new jsgui.Control({
                context: page_context,
                tagName: 'label',
                class: 'date-label',
                content: label_text
            });

            row.add(label);
            row.add(input_control);
            if (error_control) {
                row.add(error_control);
            }

            return { row, label };
        };

        const locale_select = new jsgui.Control({
            context: page_context,
            tagName: 'select',
            class: 'date-select'
        });
        locale_select.dom.attributes['data-test'] = 'locale-select';

        LOCALE_OPTIONS.forEach((option_data) => {
            const option = new jsgui.Control({
                context: page_context,
                tagName: 'option',
                content: option_data.label
            });
            option.dom.attributes.value = option_data.value;
            locale_select.add(option);
        });

        const locale_row = create_row('Locale', locale_select, null);

        const iso_input = new jsgui.Control({
            context: page_context,
            tagName: 'input',
            class: 'date-input'
        });
        iso_input.dom.attributes.type = 'text';
        iso_input.dom.attributes.placeholder = 'YYYY-MM-DD';
        iso_input.dom.attributes['data-test'] = 'iso-input';

        const iso_error = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'date-error'
        });
        iso_error.dom.attributes['data-test'] = 'iso-error';

        const iso_row = create_row('ISO date', iso_input, iso_error);

        const local_input = new jsgui.Control({
            context: page_context,
            tagName: 'input',
            class: 'date-input'
        });
        local_input.dom.attributes.type = 'text';
        local_input.dom.attributes['data-test'] = 'locale-input';

        const local_error = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'date-error'
        });
        local_error.dom.attributes['data-test'] = 'locale-error';

        const local_row = create_row('Locale date', local_input, local_error);

        const format_text = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'date-format'
        });
        format_text.dom.attributes['data-test'] = 'format-text';

        form.add(locale_row.row);
        form.add(iso_row.row);
        form.add(local_row.row);
        form.add(format_text);

        const outputs = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'date-outputs'
        });

        const create_output = (label_text, test_id) => {
            const wrapper = new jsgui.Control({
                context: page_context,
                tagName: 'div',
                class: 'date-output'
            });

            const label = new jsgui.Control({
                context: page_context,
                tagName: 'div',
                class: 'date-output-label',
                content: label_text
            });

            const value = new jsgui.Control({
                context: page_context,
                tagName: 'div',
                class: 'date-output-value'
            });
            if (test_id) {
                value.dom.attributes['data-test'] = test_id;
            }

            wrapper.add(label);
            wrapper.add(value);
            return { wrapper, value };
        };

        const local_display = create_output('Locale display', 'local-display');
        const relative_display = create_output('Relative', 'relative-display');
        const range_display = create_output('Range check', 'range-message');

        outputs.add(local_display.wrapper);
        outputs.add(relative_display.wrapper);
        outputs.add(range_display.wrapper);

        card.add(title);
        card.add(subtitle);
        card.add(form);
        card.add(outputs);

        this.add(card);

        locale_select.on('change', (event) => {
            const locale_value = event && event.target ? event.target.value : 'en-US';
            this.data.model.locale = locale_value;
        });

        iso_input.on('input', (event) => {
            const raw_value = event && event.target ? event.target.value : '';
            this.update_iso_from_input(raw_value);
        });

        local_input.on('input', (event) => {
            const raw_value = event && event.target ? event.target.value : '';
            this.view.data.model.local_input = raw_value;
            this.update_iso_from_local_input(raw_value);
        });

        const set_error_state = (row_control, has_error) => {
            if (has_error) {
                row_control.add_class('has-error');
            } else {
                row_control.remove_class('has-error');
            }
        };

        this.watch(
            this.data.model,
            'locale',
            (locale_value) => {
                locale_select.dom.attributes.value = locale_value;
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'iso_text',
            (iso_text) => {
                iso_input.dom.attributes.value = iso_text || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'local_input',
            (local_value) => {
                local_input.dom.attributes.value = local_value || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'local_format',
            (local_format) => {
                format_text.clear();
                format_text.add(`Format: ${local_format}`);
                local_input.dom.attributes.placeholder = local_format;
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'local_display',
            (local_display_value) => {
                local_display.value.clear();
                local_display.value.add(local_display_value || '');
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'relative_text',
            (relative_text) => {
                relative_display.value.clear();
                relative_display.value.add(relative_text || '');
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'range_message',
            (range_message) => {
                range_display.value.clear();
                range_display.value.add(range_message || '');
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'iso_error',
            (iso_error_text) => {
                iso_error.clear();
                if (iso_error_text) {
                    iso_error.add(iso_error_text);
                }
                set_error_state(iso_row.row, Boolean(iso_error_text));
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'local_error',
            (local_error_text) => {
                local_error.clear();
                if (local_error_text) {
                    local_error.add(local_error_text);
                }
                set_error_state(local_row.row, Boolean(local_error_text));
            },
            { immediate: true }
        );
    }
}

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'date_transform_demo_ui';
        super(spec);

        if (!spec.el) {
            this.compose();
        }
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;
        this.body.add_class('date-transform-demo');

        const date_control = new Date_Transform_Control({
            context: page_context,
            iso_date: DEFAULT_ISO_DATE,
            locale: 'en-US'
        });

        this.body.add(date_control);
    }
}

Demo_UI.css = `
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: "Georgia", "Times New Roman", serif;
    background: linear-gradient(135deg, #f9f2e8 0%, #e4eff7 100%);
    color: #1c232e;
}

.date-transform-demo {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
}

.date-transform-control {
    width: 100%;
    max-width: 560px;
}

.date-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 32px 34px;
    border: 1px solid #e1d7c7;
    box-shadow: 0 24px 50px rgba(27, 35, 52, 0.12);
}

.date-title {
    margin: 0;
    font-size: 24px;
}

.date-subtitle {
    margin: 8px 0 20px;
    color: #4b5464;
    font-size: 14px;
}

.date-form {
    display: grid;
    gap: 12px;
}

.date-row {
    display: grid;
    gap: 8px;
}

.date-row.has-error .date-input {
    border-color: #c03d2f;
    background: #fff2f1;
}

.date-label {
    font-size: 13px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #6a5d4f;
}

.date-input,
.date-select {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid #c8ccd3;
    font-size: 15px;
    background: #fbfbfd;
}

.date-select {
    cursor: pointer;
}

.date-error {
    min-height: 16px;
    font-size: 12px;
    color: #c03d2f;
}

.date-format {
    font-size: 13px;
    color: #4b5464;
    margin-top: 2px;
}

.date-outputs {
    margin-top: 22px;
    display: grid;
    gap: 14px;
}

.date-output {
    padding: 12px 14px;
    border-radius: 12px;
    background: #f6f7fb;
    border: 1px solid #e1e5ec;
}

.date-output-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6f7786;
    margin-bottom: 6px;
}

.date-output-value {
    font-size: 16px;
    color: #1f2a38;
}

@media (max-width: 520px) {
    .date-card {
        padding: 26px;
    }
}
`;

jsgui.controls.Date_Transform_Control = Date_Transform_Control;
jsgui.controls.Demo_UI = Demo_UI;
jsgui.controls.date_transform_demo_ui = Demo_UI;

module.exports = jsgui;
