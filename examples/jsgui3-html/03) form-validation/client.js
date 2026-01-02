const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const { Data_Object } = jsgui;

const DEFAULT_FORM_VALUES = Object.freeze({
    full_name: '',
    email: '',
    website: '',
    password: '',
    confirm_password: ''
});

class Form_Validation_Control extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'form_validation_control';
        super(spec);

        this.data.model = new Data_Object({
            ...DEFAULT_FORM_VALUES,
            ...(spec.form_values || {})
        });

        this.view.data.model = new Data_Object({
            full_name_error: '',
            email_error: '',
            website_error: '',
            password_error: '',
            confirm_password_error: '',
            display_name: '',
            email_preview: '',
            summary_text: '',
            status_text: '',
            submit_feedback: '',
            submit_enabled: false
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
            full_name: {
                to: 'display_name',
                transform: (value) => this.transforms.string.titleCase(
                    this.transforms.string.trim(value)
                )
            },
            email: {
                to: 'email_preview',
                transform: (value) => this.transforms.string.toLowerCase(
                    this.transforms.string.trim(value)
                )
            }
        });
    }

    setup_computed() {
        this.computed(
            this.data.model,
            ['full_name'],
            (full_name) => this.validate_full_name(full_name),
            { propertyName: 'full_name_error', target: this.view.data.model }
        );

        this.computed(
            this.data.model,
            ['email'],
            (email) => this.validate_email(email),
            { propertyName: 'email_error', target: this.view.data.model }
        );

        this.computed(
            this.data.model,
            ['website'],
            (website) => this.validate_website(website),
            { propertyName: 'website_error', target: this.view.data.model }
        );

        this.computed(
            this.data.model,
            ['password'],
            (password) => this.validate_password(password),
            { propertyName: 'password_error', target: this.view.data.model }
        );

        this.computed(
            this.data.model,
            ['password', 'confirm_password'],
            (password, confirm_password) => this.validate_confirm_password(password, confirm_password),
            { propertyName: 'confirm_password_error', target: this.view.data.model }
        );

        this.computed(
            this.data.model,
            ['full_name', 'email', 'website', 'password', 'confirm_password'],
            () => this.is_form_valid(),
            { propertyName: 'submit_enabled', target: this.view.data.model }
        );

        this.computed(
            this.view.data.model,
            ['display_name', 'email_preview'],
            (display_name, email_preview) => {
                const name_text = display_name || 'Unnamed';
                const email_text = email_preview || 'no email';
                return `Profile: ${name_text} (${email_text})`;
            },
            { propertyName: 'summary_text', target: this.view.data.model }
        );

        this.computed(
            this.view.data.model,
            ['submit_enabled'],
            (submit_enabled) => (submit_enabled ? 'Ready to submit.' : 'Fix validation errors.'),
            { propertyName: 'status_text', target: this.view.data.model }
        );
    }

    setup_watchers() {
        this.watch(
            this.view.data.model,
            ['full_name_error', 'email_error', 'website_error', 'password_error', 'confirm_password_error'],
            () => {
                if (this.view.data.model.submit_feedback) {
                    this.view.data.model.submit_feedback = '';
                }
            }
        );
    }

    validate_full_name(full_name) {
        const trimmed_value = this.transforms.string.trim(full_name);
        if (!this.validators.required(trimmed_value)) {
            return 'Full name is required.';
        }
        if (!this.validators.length(trimmed_value, 3, 40)) {
            return 'Full name must be 3-40 characters.';
        }
        if (!this.validators.pattern(trimmed_value, /^[A-Za-z][A-Za-z\s\-']*$/)) {
            return 'Name can only include letters, spaces, apostrophes, and dashes.';
        }
        return '';
    }

    validate_email(email) {
        const trimmed_value = this.transforms.string.trim(email);
        if (!this.validators.required(trimmed_value)) {
            return 'Email is required.';
        }
        if (!this.validators.email(trimmed_value)) {
            return 'Email must be valid.';
        }
        return '';
    }

    validate_website(website) {
        const trimmed_value = this.transforms.string.trim(website);
        if (!trimmed_value) {
            return '';
        }
        if (!this.validators.url(trimmed_value)) {
            return 'Website must be a valid URL.';
        }
        return '';
    }

    validate_password(password) {
        const raw_value = password || '';
        if (!this.validators.required(raw_value)) {
            return 'Password is required.';
        }
        if (!this.validators.length(raw_value, 8, 64)) {
            return 'Password must be 8-64 characters.';
        }
        if (!this.validators.pattern(raw_value, /^(?=.*[A-Za-z])(?=.*\d).+$/)) {
            return 'Password must include a letter and a number.';
        }
        return '';
    }

    validate_confirm_password(password, confirm_password) {
        const raw_value = confirm_password || '';
        if (!this.validators.required(raw_value)) {
            return 'Confirm your password.';
        }
        if (password !== confirm_password) {
            return 'Passwords do not match.';
        }
        return '';
    }

    is_form_valid() {
        const full_name_error = this.validate_full_name(this.data.model.full_name);
        const email_error = this.validate_email(this.data.model.email);
        const website_error = this.validate_website(this.data.model.website);
        const password_error = this.validate_password(this.data.model.password);
        const confirm_password_error = this.validate_confirm_password(
            this.data.model.password,
            this.data.model.confirm_password
        );

        return [
            full_name_error,
            email_error,
            website_error,
            password_error,
            confirm_password_error
        ].every((error_value) => !error_value);
    }

    update_form_value(field_name, raw_value) {
        const normalized_value = raw_value === null || raw_value === undefined
            ? ''
            : String(raw_value);
        this.data.model[field_name] = normalized_value;
    }

    activate() {
        if (this.__active) return;
        super.activate();

        if (this._dom_bound) return;
        const root_el = this.dom.el;
        if (!root_el) return;
        this._dom_bound = true;

        const full_name_input_el = root_el.querySelector('[data-test="full-name-input"]');
        const email_input_el = root_el.querySelector('[data-test="email-input"]');
        const website_input_el = root_el.querySelector('[data-test="website-input"]');
        const password_input_el = root_el.querySelector('[data-test="password-input"]');
        const confirm_password_input_el = root_el.querySelector('[data-test="confirm-password-input"]');
        const submit_button_el = root_el.querySelector('[data-test="submit-button"]');
        const summary_text_el = root_el.querySelector('[data-test="summary-text"]');
        const status_text_el = root_el.querySelector('[data-test="status-text"]');
        const feedback_text_el = root_el.querySelector('[data-test="feedback-text"]');
        const full_name_error_el = root_el.querySelector('[data-test="full-name-error"]');
        const email_error_el = root_el.querySelector('[data-test="email-error"]');
        const website_error_el = root_el.querySelector('[data-test="website-error"]');
        const password_error_el = root_el.querySelector('[data-test="password-error"]');
        const confirm_password_error_el = root_el.querySelector('[data-test="confirm-password-error"]');

        const set_error_state = (input_el, has_error) => {
            if (!input_el) return;
            const row_el = input_el.closest('.form-row');
            if (!row_el) return;
            row_el.classList.toggle('has-error', Boolean(has_error));
        };

        if (full_name_input_el) {
            full_name_input_el.addEventListener('input', (event) => {
                const raw_value = event && event.target ? event.target.value : '';
                this.update_form_value('full_name', raw_value);
            });
        }

        if (email_input_el) {
            email_input_el.addEventListener('input', (event) => {
                const raw_value = event && event.target ? event.target.value : '';
                this.update_form_value('email', raw_value);
            });
        }

        if (website_input_el) {
            website_input_el.addEventListener('input', (event) => {
                const raw_value = event && event.target ? event.target.value : '';
                this.update_form_value('website', raw_value);
            });
        }

        if (password_input_el) {
            password_input_el.addEventListener('input', (event) => {
                const raw_value = event && event.target ? event.target.value : '';
                this.update_form_value('password', raw_value);
            });
        }

        if (confirm_password_input_el) {
            confirm_password_input_el.addEventListener('input', (event) => {
                const raw_value = event && event.target ? event.target.value : '';
                this.update_form_value('confirm_password', raw_value);
            });
        }

        if (submit_button_el) {
            submit_button_el.addEventListener('click', () => {
                if (!this.view.data.model.submit_enabled) {
                    this.view.data.model.submit_feedback = 'Please resolve the errors before submitting.';
                    return;
                }
                this.view.data.model.submit_feedback = 'Submitted profile details.';
            });
        }

        this.watch(
            this.data.model,
            'full_name',
            (value) => {
                if (full_name_input_el) {
                    full_name_input_el.value = value || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'email',
            (value) => {
                if (email_input_el) {
                    email_input_el.value = value || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'website',
            (value) => {
                if (website_input_el) {
                    website_input_el.value = value || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'password',
            (value) => {
                if (password_input_el) {
                    password_input_el.value = value || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'confirm_password',
            (value) => {
                if (confirm_password_input_el) {
                    confirm_password_input_el.value = value || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'full_name_error',
            (error_text) => {
                if (full_name_error_el) {
                    full_name_error_el.textContent = error_text || '';
                }
                set_error_state(full_name_input_el, Boolean(error_text));
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'email_error',
            (error_text) => {
                if (email_error_el) {
                    email_error_el.textContent = error_text || '';
                }
                set_error_state(email_input_el, Boolean(error_text));
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'website_error',
            (error_text) => {
                if (website_error_el) {
                    website_error_el.textContent = error_text || '';
                }
                set_error_state(website_input_el, Boolean(error_text));
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'password_error',
            (error_text) => {
                if (password_error_el) {
                    password_error_el.textContent = error_text || '';
                }
                set_error_state(password_input_el, Boolean(error_text));
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'confirm_password_error',
            (error_text) => {
                if (confirm_password_error_el) {
                    confirm_password_error_el.textContent = error_text || '';
                }
                set_error_state(confirm_password_input_el, Boolean(error_text));
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'summary_text',
            (value) => {
                if (summary_text_el) {
                    summary_text_el.textContent = value || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'status_text',
            (value) => {
                if (status_text_el) {
                    status_text_el.textContent = value || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'submit_feedback',
            (value) => {
                if (feedback_text_el) {
                    feedback_text_el.textContent = value || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'submit_enabled',
            (submit_enabled) => {
                if (!submit_button_el) return;
                submit_button_el.classList.toggle('is-disabled', !submit_enabled);
                submit_button_el.setAttribute('aria-disabled', submit_enabled ? 'false' : 'true');
            },
            { immediate: true }
        );
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;

        this.add_class('form-validation-control');
        this.dom.attributes['data-test'] = 'form-validation-control';

        const card = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'form-card'
        });

        const title = new jsgui.Control({
            context: page_context,
            tagName: 'h1',
            class: 'form-title',
            content: 'Registration Validation'
        });

        const subtitle = new jsgui.Control({
            context: page_context,
            tagName: 'p',
            class: 'form-subtitle',
            content: 'Each field validates using jsgui3-html validators and transformations.'
        });

        const form_grid = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'form-grid'
        });

        const create_field_row = (label_text, input_control, error_control) => {
            const row = new jsgui.Control({
                context: page_context,
                tagName: 'div',
                class: 'form-row'
            });

            const label = new jsgui.Control({
                context: page_context,
                tagName: 'label',
                class: 'form-label',
                content: label_text
            });

            row.add(label);
            row.add(input_control);
            row.add(error_control);
            return { row, label };
        };

        const full_name_input = new jsgui.Control({
            context: page_context,
            tagName: 'input',
            class: 'form-input'
        });
        full_name_input.dom.attributes.type = 'text';
        full_name_input.dom.attributes.placeholder = 'Ada Lovelace';
        full_name_input.dom.attributes['data-test'] = 'full-name-input';

        const full_name_error = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'form-error'
        });
        full_name_error.dom.attributes['data-test'] = 'full-name-error';

        const full_name_row = create_field_row('Full name', full_name_input, full_name_error);

        const email_input = new jsgui.Control({
            context: page_context,
            tagName: 'input',
            class: 'form-input'
        });
        email_input.dom.attributes.type = 'email';
        email_input.dom.attributes.placeholder = 'name@company.com';
        email_input.dom.attributes['data-test'] = 'email-input';

        const email_error = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'form-error'
        });
        email_error.dom.attributes['data-test'] = 'email-error';

        const email_row = create_field_row('Email', email_input, email_error);

        const website_input = new jsgui.Control({
            context: page_context,
            tagName: 'input',
            class: 'form-input'
        });
        website_input.dom.attributes.type = 'url';
        website_input.dom.attributes.placeholder = 'https://example.com';
        website_input.dom.attributes['data-test'] = 'website-input';

        const website_error = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'form-error'
        });
        website_error.dom.attributes['data-test'] = 'website-error';

        const website_row = create_field_row('Website', website_input, website_error);

        const password_input = new jsgui.Control({
            context: page_context,
            tagName: 'input',
            class: 'form-input'
        });
        password_input.dom.attributes.type = 'password';
        password_input.dom.attributes.placeholder = 'Minimum 8 characters';
        password_input.dom.attributes['data-test'] = 'password-input';

        const password_error = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'form-error'
        });
        password_error.dom.attributes['data-test'] = 'password-error';

        const password_row = create_field_row('Password', password_input, password_error);

        const confirm_password_input = new jsgui.Control({
            context: page_context,
            tagName: 'input',
            class: 'form-input'
        });
        confirm_password_input.dom.attributes.type = 'password';
        confirm_password_input.dom.attributes.placeholder = 'Re-enter password';
        confirm_password_input.dom.attributes['data-test'] = 'confirm-password-input';

        const confirm_password_error = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'form-error'
        });
        confirm_password_error.dom.attributes['data-test'] = 'confirm-password-error';

        const confirm_password_row = create_field_row('Confirm password', confirm_password_input, confirm_password_error);

        form_grid.add(full_name_row.row);
        form_grid.add(email_row.row);
        form_grid.add(website_row.row);
        form_grid.add(password_row.row);
        form_grid.add(confirm_password_row.row);

        const summary_panel = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'form-summary'
        });

        const summary_title = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'form-summary-title',
            content: 'Preview'
        });

        const summary_text = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'form-summary-text'
        });
        summary_text.dom.attributes['data-test'] = 'summary-text';

        const status_text = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'form-status'
        });
        status_text.dom.attributes['data-test'] = 'status-text';

        const submit_feedback = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'form-feedback'
        });
        submit_feedback.dom.attributes['data-test'] = 'feedback-text';

        summary_panel.add(summary_title);
        summary_panel.add(summary_text);
        summary_panel.add(status_text);
        summary_panel.add(submit_feedback);

        const submit_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'form-button',
            content: 'Submit'
        });
        submit_button.dom.attributes['data-test'] = 'submit-button';

        card.add(title);
        card.add(subtitle);
        card.add(form_grid);
        card.add(summary_panel);
        card.add(submit_button);

        this.add(card);

        full_name_input.on('input', (event) => {
            const raw_value = event && event.target ? event.target.value : '';
            this.update_form_value('full_name', raw_value);
        });

        email_input.on('input', (event) => {
            const raw_value = event && event.target ? event.target.value : '';
            this.update_form_value('email', raw_value);
        });

        website_input.on('input', (event) => {
            const raw_value = event && event.target ? event.target.value : '';
            this.update_form_value('website', raw_value);
        });

        password_input.on('input', (event) => {
            const raw_value = event && event.target ? event.target.value : '';
            this.update_form_value('password', raw_value);
        });

        confirm_password_input.on('input', (event) => {
            const raw_value = event && event.target ? event.target.value : '';
            this.update_form_value('confirm_password', raw_value);
        });

        submit_button.on('click', () => {
            if (!this.view.data.model.submit_enabled) {
                this.view.data.model.submit_feedback = 'Please resolve the errors before submitting.';
                return;
            }
            this.view.data.model.submit_feedback = 'Submitted profile details.';
        });

        const set_error_state = (row_control, has_error) => {
            if (has_error) {
                row_control.add_class('has-error');
            } else {
                row_control.remove_class('has-error');
            }
        };

        const set_button_state = (enabled) => {
            if (enabled) {
                submit_button.remove_class('is-disabled');
            } else {
                submit_button.add_class('is-disabled');
            }
            submit_button.dom.attributes['aria-disabled'] = enabled ? 'false' : 'true';
        };

        this.watch(
            this.data.model,
            'full_name',
            (value) => {
                full_name_input.dom.attributes.value = value || '';
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'email',
            (value) => {
                email_input.dom.attributes.value = value || '';
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'website',
            (value) => {
                website_input.dom.attributes.value = value || '';
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'password',
            (value) => {
                password_input.dom.attributes.value = value || '';
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'confirm_password',
            (value) => {
                confirm_password_input.dom.attributes.value = value || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'full_name_error',
            (error_text) => {
                full_name_error.clear();
                if (error_text) {
                    full_name_error.add(error_text);
                }
                set_error_state(full_name_row.row, Boolean(error_text));
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'email_error',
            (error_text) => {
                email_error.clear();
                if (error_text) {
                    email_error.add(error_text);
                }
                set_error_state(email_row.row, Boolean(error_text));
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'website_error',
            (error_text) => {
                website_error.clear();
                if (error_text) {
                    website_error.add(error_text);
                }
                set_error_state(website_row.row, Boolean(error_text));
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'password_error',
            (error_text) => {
                password_error.clear();
                if (error_text) {
                    password_error.add(error_text);
                }
                set_error_state(password_row.row, Boolean(error_text));
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'confirm_password_error',
            (error_text) => {
                confirm_password_error.clear();
                if (error_text) {
                    confirm_password_error.add(error_text);
                }
                set_error_state(confirm_password_row.row, Boolean(error_text));
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'summary_text',
            (value) => {
                summary_text.clear();
                summary_text.add(value || '');
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'status_text',
            (value) => {
                status_text.clear();
                status_text.add(value || '');
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'submit_feedback',
            (value) => {
                submit_feedback.clear();
                if (value) {
                    submit_feedback.add(value);
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'submit_enabled',
            (submit_enabled) => {
                set_button_state(Boolean(submit_enabled));
            },
            { immediate: true }
        );
    }
}

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'form_validation_demo_ui';
        super(spec);

        if (!spec.el) {
            this.compose();
        }
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;
        this.body.add_class('form-validation-demo');

        const form_control = new Form_Validation_Control({
            context: page_context
        });

        this.body.add(form_control);
    }
}

Demo_UI.css = `
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: "DM Serif Text", "Georgia", serif;
    background: radial-gradient(circle at top, #fdf6ec 0%, #edf2f8 60%, #e2e8f1 100%);
    color: #1b2330;
}

.form-validation-demo {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
}

.form-validation-control {
    width: 100%;
    max-width: 720px;
}

.form-card {
    background: #ffffff;
    border-radius: 22px;
    padding: 36px;
    border: 1px solid #e3d6c5;
    box-shadow: 0 28px 55px rgba(22, 28, 41, 0.14);
    display: grid;
    gap: 18px;
}

.form-title {
    margin: 0;
    font-size: 26px;
}

.form-subtitle {
    margin: 0;
    color: #4e5869;
    font-size: 14px;
}

.form-grid {
    display: grid;
    gap: 14px;
}

.form-row {
    display: grid;
    gap: 8px;
}

.form-row.has-error .form-input {
    border-color: #c4372c;
    background: #fff1f0;
}

.form-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #6a5f53;
}

.form-input {
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid #c5cad3;
    font-size: 15px;
    background: #fbfcfe;
}

.form-error {
    min-height: 16px;
    font-size: 12px;
    color: #b13b30;
}

.form-summary {
    border-radius: 16px;
    padding: 16px 18px;
    background: #f4f6fb;
    border: 1px solid #dee4ee;
    display: grid;
    gap: 6px;
}

.form-summary-title {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: #5e6777;
}

.form-summary-text {
    font-size: 16px;
    color: #1f2a38;
}

.form-status {
    font-size: 13px;
    color: #3f4a5a;
}

.form-feedback {
    font-size: 13px;
    color: #1c6f5a;
    min-height: 16px;
}

.form-button {
    justify-self: start;
    padding: 12px 18px;
    border-radius: 999px;
    border: none;
    background: #1f2a38;
    color: #fdfbf8;
    font-size: 14px;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.form-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(31, 42, 56, 0.2);
}

.form-button.is-disabled {
    background: #8b95a5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

@media (max-width: 640px) {
    .form-card {
        padding: 28px;
    }

    .form-button {
        width: 100%;
        text-align: center;
    }
}
`;

jsgui.controls.Form_Validation_Control = Form_Validation_Control;
jsgui.controls.Demo_UI = Demo_UI;
jsgui.controls.form_validation_demo_ui = Demo_UI;

module.exports = jsgui;
