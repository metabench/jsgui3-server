const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;

const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

const { Alert_Banner, Button, Form_Container, Window } = controls;

const validate_email = value => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Enter a valid email.';
    return true;
};

const validate_age = value => {
    if (value === '' || value === undefined || value === null) return true;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 'Enter a number.';
    if (numeric < 16 || numeric > 120) return 'Age must be between 16 and 120.';
    return true;
};

const validate_bio = value => {
    const trimmed = String(value || '').trim();
    if (trimmed.length < 20) return 'Share at least 20 characters.';
    return true;
};

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
                title: 'jsgui3-html Form_Container',
                pos: [10, 10]
            });

            window_ctrl.size = [640, 520];

            const alert_banner = new Alert_Banner({
                context,
                status: 'info',
                message: 'Fill out the form and submit to see validation.'
            });
            alert_banner.add_class('form-banner');

            const fields = [
                {
                    name: 'full_name',
                    label: 'Full name',
                    required: true,
                    placeholder: 'Ada Lovelace'
                },
                {
                    name: 'email',
                    label: 'Email',
                    type: 'email',
                    required: true,
                    placeholder: 'ada@example.com',
                    validator: validate_email
                },
                {
                    name: 'age',
                    label: 'Age',
                    type: 'number',
                    placeholder: '36',
                    validator: validate_age
                },
                {
                    name: 'newsletter',
                    label: 'Newsletter',
                    type: 'checkbox',
                    value: true
                },
                {
                    name: 'bio',
                    label: 'Short bio',
                    type: 'textarea',
                    required: true,
                    placeholder: 'What are you working on?',
                    validator: validate_bio
                }
            ];

            const form_container = new Form_Container({
                context,
                fields,
                show_status_badge: true
            });

            const actions_row = new Control({
                context,
                tag_name: 'div'
            });
            actions_row.add_class('form-actions');

            const submit_button = new Button({
                context,
                text: 'Submit'
            });
            submit_button.dom.attributes.type = 'submit';
            submit_button.add_class('button-primary');

            const reset_button = new Button({
                context,
                text: 'Reset'
            });
            reset_button.dom.attributes.type = 'button';
            reset_button.add_class('button-secondary');

            actions_row.add(submit_button);
            actions_row.add(reset_button);

            form_container.add(actions_row);

            window_ctrl.inner.add(alert_banner);
            window_ctrl.inner.add(form_container);

            this.body.add(window_ctrl);

            this.alert_banner = alert_banner;
            this.form_container = form_container;
            this.reset_button = reset_button;
        };

        if (!spec.el) {
            compose_ui();
        }
    }

    activate() {
        if (!this.__active) {
            super.activate();

            const { form_container, alert_banner, reset_button } = this;

            if (form_container && alert_banner) {
                form_container.on('submit', e_submit => {
                    const values = e_submit && e_submit.values ? e_submit.values : {};
                    const summary_name = values.full_name ? `Thanks, ${values.full_name}.` : 'Thanks!';
                    alert_banner.set_status('success');
                    alert_banner.set_message(`${summary_name} Form submission looks good.`);
                });

                form_container.on('invalid', () => {
                    alert_banner.set_status('error');
                    alert_banner.set_message('Please fix the highlighted fields and try again.');
                });
            }

            if (reset_button && form_container && alert_banner) {
                reset_button.on('click', () => {
                    form_container.set_values({
                        full_name: '',
                        email: '',
                        age: '',
                        newsletter: false,
                        bio: ''
                    });

                    if (form_container.field_controls) {
                        Object.keys(form_container.field_controls).forEach(field_name => {
                            form_container.update_field_status(
                                form_container.field_controls[field_name],
                                '',
                                ''
                            );
                        });
                    }

                    alert_banner.set_status('info');
                    alert_banner.set_message('Form reset.');
                });
            }
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

.demo-ui .form-banner {
    margin-bottom: 12px;
}

.demo-ui .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 8px;
}

.demo-ui .button-primary {
    border: none;
    border-radius: 4px;
    padding: 6px 14px;
    background: #0d47a1;
    color: #fff;
    cursor: pointer;
}

.demo-ui .button-secondary {
    border: 1px solid #c5c5c5;
    border-radius: 4px;
    padding: 6px 14px;
    background: #fff;
    color: #333;
    cursor: pointer;
}

@media (max-width: 720px) {
    .demo-ui .window .inner {
        padding: 12px;
    }

    .demo-ui .form-container-field {
        grid-template-columns: 1fr;
        gap: 6px;
    }

    .demo-ui .form-container-message {
        grid-column: 1;
    }

    .demo-ui .form-actions {
        flex-direction: column;
        align-items: stretch;
    }
}
`;

controls.Demo_UI = Demo_UI;
module.exports = jsgui;
