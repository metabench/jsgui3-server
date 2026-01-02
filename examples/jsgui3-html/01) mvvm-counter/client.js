const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const { Data_Object } = jsgui;

class Counter_Control extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'counter_control';
        super(spec);

        const initial_count = Number.isFinite(spec.initial_count) ? spec.initial_count : 0;
        const initial_step = Number.isFinite(spec.step) ? spec.step : 1;

        this.data.model = new Data_Object({
            count: initial_count,
            step: initial_step
        });

        this.view.data.model = new Data_Object({
            display_text: '',
            status_text: '',
            step_error: '',
            is_even: false,
            is_positive: false,
            step_valid: true
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
            count: {
                to: 'display_text',
                transform: (count) => `Count: ${this.transforms.number.withCommas(count)}`
            }
        });
    }

    setup_computed() {
        this.computed(
            this.data.model,
            ['count'],
            (count) => count > 0,
            { propertyName: 'is_positive', target: this.view.data.model }
        );

        this.computed(
            this.data.model,
            ['count'],
            (count) => count % 2 === 0,
            { propertyName: 'is_even', target: this.view.data.model }
        );

        this.computed(
            this.data.model,
            ['step'],
            (step) => this.validators.range(step, 1, 10),
            { propertyName: 'step_valid', target: this.view.data.model }
        );

        this.computed(
            this.view.data.model,
            ['is_positive', 'is_even'],
            (is_positive, is_even) => {
                const sign_label = is_positive ? 'positive' : 'negative or zero';
                const parity_label = is_even ? 'even' : 'odd';
                return `${sign_label} and ${parity_label}`;
            },
            { propertyName: 'status_text', target: this.view.data.model }
        );
    }

    setup_watchers() {
        this.watch(
            this.view.data.model,
            'step_valid',
            (step_valid) => {
                this.view.data.model.step_error = step_valid ? '' : 'Step must be between 1 and 10.';
            },
            { immediate: true }
        );
    }

    increment_count() {
        const step_value = Number.isFinite(this.data.model.step) ? this.data.model.step : 0;
        this.data.model.count += step_value;
    }

    decrement_count() {
        const step_value = Number.isFinite(this.data.model.step) ? this.data.model.step : 0;
        this.data.model.count -= step_value;
    }

    reset_count() {
        this.data.model.count = 0;
    }

    update_step(raw_value) {
        const parsed_value = this.transforms.number.parseInt(raw_value);
        this.data.model.step = parsed_value === null ? null : parsed_value;
    }

    activate() {
        if (this.__active) return;
        super.activate();

        if (this._dom_bound) return;
        const root_el = this.dom.el;
        if (!root_el) return;

        this._dom_bound = true;

        const counter_display_el = root_el.querySelector('[data-test="counter-display"]');
        const counter_status_el = root_el.querySelector('[data-test="counter-status"]');
        const step_input_el = root_el.querySelector('[data-test="step-input"]');
        const step_error_el = root_el.querySelector('[data-test="step-error"]');
        const increment_button_el = root_el.querySelector('[data-test="increment-button"]');
        const decrement_button_el = root_el.querySelector('[data-test="decrement-button"]');
        const reset_button_el = root_el.querySelector('[data-test="reset-button"]');
        const step_row_el = step_input_el ? step_input_el.closest('.counter-step') : null;

        const set_button_state = (button_el, is_enabled) => {
            if (!button_el) return;
            button_el.classList.toggle('is-disabled', !is_enabled);
            button_el.setAttribute('aria-disabled', is_enabled ? 'false' : 'true');
        };

        if (increment_button_el) {
            increment_button_el.addEventListener('click', () => {
                if (!this.view.data.model.step_valid) return;
                this.increment_count();
            });
        }

        if (decrement_button_el) {
            decrement_button_el.addEventListener('click', () => {
                if (!this.view.data.model.step_valid) return;
                this.decrement_count();
            });
        }

        if (reset_button_el) {
            reset_button_el.addEventListener('click', () => {
                this.reset_count();
            });
        }

        if (step_input_el) {
            step_input_el.addEventListener('input', (event) => {
                const raw_value = event && event.target ? event.target.value : '';
                this.update_step(raw_value);
            });
        }

        this.watch(
            this.view.data.model,
            'display_text',
            (display_text) => {
                if (!counter_display_el) return;
                counter_display_el.textContent = display_text || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'status_text',
            (status_text) => {
                if (!counter_status_el) return;
                counter_status_el.textContent = `Status: ${status_text || ''}`;
            },
            { immediate: true }
        );

        const update_display_classes = () => {
            if (!counter_display_el) return;
            const is_even = this.view.data.model.is_even;
            const is_positive = this.view.data.model.is_positive;
            counter_display_el.classList.toggle('even', Boolean(is_even));
            counter_display_el.classList.toggle('odd', !is_even);
            counter_display_el.classList.toggle('positive', Boolean(is_positive));
            counter_display_el.classList.toggle('negative', !is_positive);
        };

        this.watch(
            this.view.data.model,
            'is_even',
            () => update_display_classes(),
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'is_positive',
            () => update_display_classes(),
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'step',
            (step_value) => {
                if (!step_input_el) return;
                step_input_el.value = Number.isFinite(step_value) ? String(step_value) : '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'step_error',
            (step_error_text) => {
                if (!step_error_el) return;
                step_error_el.textContent = step_error_text || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'step_valid',
            (step_valid) => {
                if (step_row_el) {
                    step_row_el.classList.toggle('has-error', !step_valid);
                }
                set_button_state(decrement_button_el, step_valid);
                set_button_state(increment_button_el, step_valid);
            },
            { immediate: true }
        );
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;

        this.add_class('counter-control');
        this.dom.attributes['data-test'] = 'counter-control';

        const card = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'counter-card'
        });

        const title = new jsgui.Control({
            context: page_context,
            tagName: 'h1',
            class: 'counter-title',
            content: 'MVVM Counter'
        });

        const counter_display = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'counter-display'
        });
        counter_display.dom.attributes['data-test'] = 'counter-display';

        const counter_status = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'counter-status'
        });
        counter_status.dom.attributes['data-test'] = 'counter-status';

        const step_row = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'counter-step'
        });

        const step_label = new jsgui.Control({
            context: page_context,
            tagName: 'label',
            class: 'counter-step-label',
            content: 'Step'
        });

        const step_input = new jsgui.Control({
            context: page_context,
            tagName: 'input',
            class: 'counter-step-input'
        });
        step_input.dom.attributes.type = 'number';
        step_input.dom.attributes.min = '1';
        step_input.dom.attributes.max = '10';
        step_input.dom.attributes.step = '1';
        step_input.dom.attributes.id = 'counter-step-input';
        step_input.dom.attributes['data-test'] = 'step-input';
        step_label.dom.attributes['for'] = 'counter-step-input';

        const step_error = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'counter-step-error'
        });
        step_error.dom.attributes['data-test'] = 'step-error';

        step_row.add(step_label);
        step_row.add(step_input);
        step_row.add(step_error);

        const button_row = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'counter-buttons'
        });

        const decrement_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'counter-button',
            content: '-'
        });
        decrement_button.dom.attributes['data-test'] = 'decrement-button';

        const reset_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'counter-button',
            content: 'Reset'
        });
        reset_button.dom.attributes['data-test'] = 'reset-button';

        const increment_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'counter-button',
            content: '+'
        });
        increment_button.dom.attributes['data-test'] = 'increment-button';

        decrement_button.on('click', () => {
            if (!this.view.data.model.step_valid) return;
            this.decrement_count();
        });

        reset_button.on('click', () => {
            this.reset_count();
        });

        increment_button.on('click', () => {
            if (!this.view.data.model.step_valid) return;
            this.increment_count();
        });

        step_input.on('input', (event) => {
            const raw_value = event && event.target ? event.target.value : '';
            this.update_step(raw_value);
        });

        button_row.add(decrement_button);
        button_row.add(reset_button);
        button_row.add(increment_button);

        card.add(title);
        card.add(counter_display);
        card.add(counter_status);
        card.add(step_row);
        card.add(button_row);

        this.add(card);

        const set_button_state = (button, is_enabled) => {
            if (is_enabled) {
                button.remove_class('is-disabled');
                button.dom.attributes['aria-disabled'] = 'false';
            } else {
                button.add_class('is-disabled');
                button.dom.attributes['aria-disabled'] = 'true';
            }
        };

        this.watch(
            this.view.data.model,
            'display_text',
            (display_text) => {
                counter_display.clear();
                counter_display.add(display_text || '');
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'status_text',
            (status_text) => {
                counter_status.clear();
                counter_status.add(`Status: ${status_text || ''}`);
            },
            { immediate: true }
        );

        const update_display_classes = () => {
            const is_even = this.view.data.model.is_even;
            const is_positive = this.view.data.model.is_positive;

            counter_display.remove_class('even');
            counter_display.remove_class('odd');
            counter_display.remove_class('positive');
            counter_display.remove_class('negative');

            if (is_even) {
                counter_display.add_class('even');
            } else {
                counter_display.add_class('odd');
            }

            if (is_positive) {
                counter_display.add_class('positive');
            } else {
                counter_display.add_class('negative');
            }
        };

        this.watch(
            this.view.data.model,
            'is_even',
            () => update_display_classes(),
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'is_positive',
            () => update_display_classes(),
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'step',
            (step_value) => {
                const step_text = Number.isFinite(step_value) ? String(step_value) : '';
                step_input.dom.attributes.value = step_text;
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'step_error',
            (step_error_text) => {
                step_error.clear();
                if (step_error_text) {
                    step_error.add(step_error_text);
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'step_valid',
            (step_valid) => {
                if (step_valid) {
                    step_row.remove_class('has-error');
                } else {
                    step_row.add_class('has-error');
                }

                set_button_state(decrement_button, step_valid);
                set_button_state(increment_button, step_valid);
            },
            { immediate: true }
        );
    }
}

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'mvvm_counter_demo_ui';
        super(spec);

        if (!spec.el) {
            this.compose();
        }
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;
        this.body.add_class('mvvm-counter-demo');

        const counter_control = new Counter_Control({
            context: page_context,
            initial_count: 0,
            step: 1
        });

        this.body.add(counter_control);
    }
}

Demo_UI.css = `
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: "Trebuchet MS", "Verdana", sans-serif;
    background: #f2f4f8;
    color: #1c232e;
}

.mvvm-counter-demo {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
}

.counter-control {
    width: 100%;
    max-width: 420px;
}

.counter-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 28px 30px;
    border: 1px solid #d7dde6;
    box-shadow: 0 20px 45px rgba(20, 32, 52, 0.1);
}

.counter-title {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 700;
}

.counter-display {
    font-size: 32px;
    font-weight: 700;
    padding: 12px 0;
    border-bottom: 1px solid #e3e7ee;
}

.counter-display.positive {
    color: #1c7c54;
}

.counter-display.negative {
    color: #b3382c;
}

.counter-display.even {
    letter-spacing: 1px;
}

.counter-display.odd {
    letter-spacing: 0;
}

.counter-status {
    margin-top: 8px;
    color: #3c4b5d;
    font-size: 14px;
}

.counter-step {
    margin-top: 18px;
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    gap: 6px 12px;
    align-items: center;
}

.counter-step-label {
    font-size: 14px;
    font-weight: 600;
}

.counter-step-input {
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid #c7ced8;
    font-size: 14px;
}

.counter-step.has-error .counter-step-input {
    border-color: #d64545;
    background: #fff3f3;
}

.counter-step-error {
    grid-column: 1 / -1;
    font-size: 12px;
    color: #b3382c;
    min-height: 16px;
}

.counter-buttons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 18px;
}

.counter-button {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid #c7ced8;
    background: #f7f9fc;
    font-size: 16px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.counter-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(17, 24, 39, 0.08);
}

.counter-button.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
}

@media (max-width: 520px) {
    .counter-card {
        padding: 22px;
    }

    .counter-display {
        font-size: 28px;
    }
}
`;

jsgui.controls.Counter_Control = Counter_Control;
jsgui.controls.Demo_UI = Demo_UI;
jsgui.controls.mvvm_counter_demo_ui = Demo_UI;

module.exports = jsgui;
