const jsgui = require('jsgui3-html');
const { Control, controls } = jsgui;

class Auto_Client_Page_Placeholder extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'auto_client_page_placeholder';
        super(spec);

        if (!spec.el) {
            this.add('placeholder');
        }
    }
}

class Auto_Client_Entry_Widget extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'auto_client_entry_widget';
        super(spec);

        if (!spec.el) {
            this.add_class('auto-client-entry-widget');
            this.dom.attributes['data-test'] = 'auto-activation-root';
            this.dom.attributes['data-activation-state'] = 'server-rendered';

            const status = new controls.div({ context: this.context });
            status.dom.attributes['data-test'] = 'auto-activation-status';
            status.add('server-rendered');
            this.add(status);

            const button = new controls.Button({ context: this.context, text: 'Increment' });
            button.dom.attributes.type = 'button';
            button.dom.attributes['data-test'] = 'auto-activation-button';
            this.add(button);
        }
    }

    activate() {
        if (this.__auto_client_entry_active) return;
        this.__auto_client_entry_active = true;
        if (super.activate) super.activate();

        const root_el = this.dom && this.dom.el;
        const status_el = root_el
            ? root_el.querySelector('[data-test="auto-activation-status"]')
            : document.querySelector('[data-test="auto-activation-status"]');
        const button_el = root_el
            ? root_el.querySelector('[data-test="auto-activation-button"]')
            : document.querySelector('[data-test="auto-activation-button"]');

        window.__jsgui_auto_client_entry_e2e = {
            activated: true,
            clicks: 0
        };

        if (root_el) root_el.setAttribute('data-activation-state', 'activated');
        if (status_el) status_el.textContent = 'activated';

        if (button_el) {
            button_el.addEventListener('click', () => {
                window.__jsgui_auto_client_entry_e2e.clicks += 1;
                if (root_el) {
                    root_el.setAttribute('data-click-count', String(window.__jsgui_auto_client_entry_e2e.clicks));
                }
                if (status_el) {
                    status_el.textContent = `clicked:${window.__jsgui_auto_client_entry_e2e.clicks}`;
                }
            });
        }
    }
}

Auto_Client_Entry_Widget.css = `
.auto-client-entry-widget {
    padding: 12px;
    border: 1px solid #166534;
}
`;

module.exports = {
    Auto_Client_Page_Placeholder,
    Auto_Client_Entry_Widget
};