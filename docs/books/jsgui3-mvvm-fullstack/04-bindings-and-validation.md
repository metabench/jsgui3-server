# Bindings and Validation

Use `Form_Container` for form layouts and built-in validation messaging. Pair it with `Alert_Banner` for high-level status.

## Form_Container Example
```javascript
const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;
const Active_HTML_Document = require('jsgui3-server/controls/Active_HTML_Document');

const validate_email = value => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return 'Email is required.';
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(trimmed)) return 'Enter a valid email.';
    return true;
};

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const { context } = this;
        if (!spec.el) {
            const window_ctrl = new controls.Window({ context, title: 'Form Demo' });
            const alert_banner = new controls.Alert_Banner({
                context,
                status: 'info',
                message: 'Complete the form.'
            });
            const form_container = new controls.Form_Container({
                context,
                fields: [
                    { name: 'email', label: 'Email', required: true, validator: validate_email }
                ],
                show_status_badge: true
            });
            form_container.on('submit', () => {
                alert_banner.set_status('success');
                alert_banner.set_message('Submitted.');
            });
            form_container.on('invalid', () => {
                alert_banner.set_status('error');
                alert_banner.set_message('Fix errors.');
            });
            window_ctrl.inner.add(alert_banner);
            window_ctrl.inner.add(form_container);
            this.body.add(window_ctrl);
        }
    }
}
```
