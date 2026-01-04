


const jsgui = require('jsgui3-client');
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;
const {Checkbox, Date_Picker, Text_Input, Text_Field, Dropdown_Menu} = controls;
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const EarthGlobeRenderer = require('./EarthGlobeRenderer');

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const {context} = this;
        if (typeof this.body.add_class === 'function') {
            this.body.add_class('demo-ui');
        }
        const compose = () => {
            const window = new controls.Window({
                context: context,
                title: 'jsgui3-html Dropdown_Menu',
                pos: [5, 5]
            });
            window.size = [1300, 1300];
            const canvas = new controls.Canvas({
                context
            });
            canvas.dom.attributes.id = 'globeCanvas'
            //canvas.size = [900, 900];
            canvas.size = [1200, 1200];
            window.inner.add(canvas);
            this.body.add(window);
            this._ctrl_fields = this._ctrl_fields || {};
            this._ctrl_fields.canvas = this.canvas = canvas;
        }
        if (!spec.el) {
            compose();
            //this.add_change_listeners();
        }
    }
    /*
    add_change_listeners() {
        const {select_options} = this;
        select_options.data.model.on('change', e => {
            console.log('select_options.data.model change e', e);
        });
    }
        */
    activate() {
        if (!this.__active) {
            super.activate();
            const {context, ti1, ti2} = this;
            //this.add_change_listeners();
            console.log('activate Demo_UI');
            context.on('window-resize', e_resize => {
            });

            /*
            const globe = new EarthGlobeRenderer("globeCanvas", {
              background: "#081019",
              quality: 1.25,
              grid: { enabled: true, color: "#444" },   // dark grey default
              inertiaFriction: 2.8,
              zoom: 1
            });

            // Place sun front-left-up:
            globe.setSunFromSpherical(-35, 25);
            */

            let globe = new EarthGlobeRenderer('globeCanvas', {
              background: '#081019',
              quality: 1.2,
              grid: { enabled: true, color: '#444' } // dark grey default
            });
            globe.setSunFromSpherical(-35, 25);
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
    background-color: #E0E0E0;
}
.demo-ui {
}
`;
controls.Demo_UI = Demo_UI;
module.exports = jsgui;