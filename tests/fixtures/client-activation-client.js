const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;

class Activation_E2E_Widget extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'activation_e2e_widget';
        super(spec);

        if (!spec.el) {
            this.compose_ui();
        }
    }

    compose_ui() {
        const { context } = this;
        this.add_class('activation-e2e-root');
        this.dom.attributes['data-test'] = 'activation-root';
        this.dom.attributes['data-activation-state'] = 'server-rendered';

        const status = new controls.div({ context });
        status.dom.attributes['data-test'] = 'activation-status';
        status.add('server-rendered');
        this.add(status);

        const button = new controls.Button({ context, text: 'Increment' });
        button.dom.attributes.type = 'button';
        button.dom.attributes['data-test'] = 'activation-button';
        this.add(button);
    }

    activate() {
        if (this.__activation_e2e_active) return;
        this.__activation_e2e_active = true;
        if (super.activate) super.activate();

        const own_el = this.dom && this.dom.el;
        const root_el = own_el && own_el.matches && own_el.matches('[data-test="activation-root"]')
            ? own_el
            : own_el
                ? own_el.querySelector('[data-test="activation-root"]')
            : document.querySelector('[data-test="activation-root"]');
        const status_el = own_el
            ? own_el.querySelector('[data-test="activation-status"]')
            : document.querySelector('[data-test="activation-status"]');
        const button_el = own_el
            ? own_el.querySelector('[data-test="activation-button"]')
            : document.querySelector('[data-test="activation-button"]');

        window.__jsgui_activation_e2e = {
            activated: true,
            clicks: 0
        };

        if (root_el) root_el.setAttribute('data-activation-state', 'activated');
        if (status_el) status_el.textContent = 'activated';

        if (button_el) {
            button_el.addEventListener('click', () => {
                window.__jsgui_activation_e2e.clicks += 1;
                if (root_el) {
                    root_el.setAttribute('data-click-count', String(window.__jsgui_activation_e2e.clicks));
                }
                if (status_el) {
                    status_el.textContent = `clicked:${window.__jsgui_activation_e2e.clicks}`;
                }
            });
        }
    }
}

Activation_E2E_Widget.css = `
.activation-e2e-root {
    padding: 12px;
    border: 1px solid #2b6cb0;
}
`;

class Activation_E2E_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'activation_e2e_app';
        super(spec);

        if (!spec.el) {
            const widget = new Activation_E2E_Widget({ context: this.context });
            this.body.add(widget);
        }
    }
}

Activation_E2E_App.css = Activation_E2E_Widget.css;

controls.Activation_E2E_Widget = Activation_E2E_Widget;
controls.Activation_E2E_App = Activation_E2E_App;

module.exports = jsgui;