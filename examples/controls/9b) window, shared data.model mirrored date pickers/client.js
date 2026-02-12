const jsgui = require('jsgui3-client');
const { controls } = jsgui;
const { Date_Picker } = controls;
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);

        if (typeof this.body.add_class === 'function') {
            this.body.add_class('demo-ui');
        }

        if (!spec.el) {
            this.compose_ui();
        }
    }

    compose_ui() {
        const { context } = this;

        const window_ctrl = new controls.Window({
            context,
            title: 'jsgui3-html Mirrored Date_Picker Controls',
            pos: [10, 10],
            size: [420, 240]
        });

        const picker_one = new Date_Picker({
            context,
            value: '2026-02-11'
        });
        picker_one.add_class('mirrored-date-picker');
        window_ctrl.inner.add(picker_one);

        const picker_two = new Date_Picker({
            context,
            value: '2026-02-11'
        });
        picker_two.add_class('mirrored-date-picker');
        window_ctrl.inner.add(picker_two);

        this.body.add(window_ctrl);
    }

    activate() {
        if (!this.__active) {
            super.activate();

            const root_el = (this.body && this.body.dom && this.body.dom.el) || (this.dom && this.dom.el) || null;
            if (!root_el) {
                return;
            }

            const date_input_els = Array.from(root_el.querySelectorAll('input.date-picker'));
            if (date_input_els.length < 2) {
                return;
            }

            const [date_input_a, date_input_b] = date_input_els;
            let is_syncing = false;
            const mirror_value = (source_input, target_input) => {
                if (is_syncing) return;
                is_syncing = true;
                target_input.value = source_input.value;
                target_input.dispatchEvent(new Event('input', { bubbles: true }));
                target_input.dispatchEvent(new Event('change', { bubbles: true }));
                is_syncing = false;
            };

            const sync_a_to_b = () => mirror_value(date_input_a, date_input_b);
            const sync_b_to_a = () => mirror_value(date_input_b, date_input_a);

            date_input_a.addEventListener('input', sync_a_to_b);
            date_input_a.addEventListener('change', sync_a_to_b);
            date_input_b.addEventListener('input', sync_b_to_a);
            date_input_b.addEventListener('change', sync_b_to_a);

            this.on('destroy', () => {
                date_input_a.removeEventListener('input', sync_a_to_b);
                date_input_a.removeEventListener('change', sync_a_to_b);
                date_input_b.removeEventListener('input', sync_b_to_a);
                date_input_b.removeEventListener('change', sync_b_to_a);
            });
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
`;

controls.Demo_UI = Demo_UI;
module.exports = jsgui;
