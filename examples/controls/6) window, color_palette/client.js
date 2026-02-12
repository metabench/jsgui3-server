const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const { Color_Picker } = controls;

if (typeof Color_Picker !== 'function') {
    throw new Error('Expected controls.Color_Picker to be exported from jsgui3-client/jsgui3-html.');
}

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
            title: 'jsgui3-html Color_Picker Controls',
            pos: [10, 10],
            size: [620, 520]
        });

        const intro_text = new Control({ context, tag_name: 'p' });
        intro_text.add_class('picker-intro');
        intro_text.add('Improved color picking controls from jsgui3-html.');
        window_ctrl.inner.add(intro_text);

        const color_picker_default = new Color_Picker({
            context,
            value: '#3b82f6'
        });
        color_picker_default.add_class('demo-color-picker-default');
        window_ctrl.inner.add(color_picker_default);

        const color_picker_compact = new Color_Picker({
            context,
            value: '#ef4444',
            show_wheel: false,
            show_rgb_inputs: true,
            show_alpha: true,
            layout: 'compact',
            output_format: 'rgba'
        });
        color_picker_compact.add_class('demo-color-picker-compact');
        window_ctrl.inner.add(color_picker_compact);

        const compact_value_readout = new Control({ context, tag_name: 'div' });
        compact_value_readout.add_class('demo-color-picker-readout');
        compact_value_readout.add(`Selected: ${color_picker_compact.value}`);
        window_ctrl.inner.add(compact_value_readout);

        this._ctrl_fields = {
            color_picker_compact,
            compact_value_readout
        };

        this.body.add(window_ctrl);
    }

    activate() {
        if (!this.__active) {
            super.activate();

            const root_el = (this.body && this.body.dom && this.body.dom.el) || (this.dom && this.dom.el) || null;
            if (!root_el) {
                return;
            }

            const compact_root_el = root_el.querySelector('.demo-color-picker-compact');
            const readout_el = root_el.querySelector('.demo-color-picker-readout');
            if (!compact_root_el || !readout_el) {
                return;
            }

            const build_rgba_value_text = () => {
                const input_r = compact_root_el.querySelector('.cp-rgb-r');
                const input_g = compact_root_el.querySelector('.cp-rgb-g');
                const input_b = compact_root_el.querySelector('.cp-rgb-b');
                const alpha_slider = compact_root_el.querySelector('.cp-slider-a');

                const has_rgb_inputs = input_r && input_g && input_b;
                if (!has_rgb_inputs) {
                    const hex_input = compact_root_el.querySelector('.cp-hex-input');
                    return hex_input ? String(hex_input.value || '') : '';
                }

                const red_value = Number(input_r.value);
                const green_value = Number(input_g.value);
                const blue_value = Number(input_b.value);
                const alpha_value = alpha_slider ? (Number(alpha_slider.value) / 100) : 1;

                if (!Number.isFinite(red_value) || !Number.isFinite(green_value) || !Number.isFinite(blue_value)) {
                    return '';
                }
                return `rgba(${red_value}, ${green_value}, ${blue_value}, ${alpha_value})`;
            };

            const set_readout_text = () => {
                const value_text = build_rgba_value_text();
                readout_el.textContent = `Selected: ${value_text}`;
            };

            set_readout_text();
            const schedule_set_readout_text = () => {
                setTimeout(set_readout_text, 0);
            };

            compact_root_el.addEventListener('input', schedule_set_readout_text);
            compact_root_el.addEventListener('change', schedule_set_readout_text);
            compact_root_el.addEventListener('click', schedule_set_readout_text);
            this.on('destroy', () => {
                compact_root_el.removeEventListener('input', schedule_set_readout_text);
                compact_root_el.removeEventListener('change', schedule_set_readout_text);
                compact_root_el.removeEventListener('click', schedule_set_readout_text);
            });
        }
    }
}

Demo_UI.css = `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    overflow-x: hidden;
    overflow-y: hidden;
    background-color: #e0e0e0;
}

.picker-intro {
    margin: 8px 0 10px 0;
    font-family: 'Segoe UI', sans-serif;
    font-size: 13px;
    color: #34495e;
}

.demo-color-picker-default {
    margin-bottom: 14px;
}

.demo-color-picker-readout {
    margin-top: 10px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 12px;
    color: #263238;
}
`;

controls.Demo_UI = Demo_UI;
controls.Color_Picker = Color_Picker;
module.exports = jsgui;
