const jsgui = require('jsgui3-client');
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;


const {Checkbox, Date_Picker, Text_Input} = controls;

const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

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
                title: 'jsgui3-html Mirrored Text_Input controls',
                pos: [5, 5]
            });

            window.size = [480, 160];

            const ti1 = new Text_Input({
                context,
                //label: {
                //    text: 'A checkbox'
                //}
            })

            window.inner.add(ti1);

            const ti2 = new Text_Input({
                context,
                //label: {
                //    text: 'A checkbox'
                //}
            })

            window.inner.add(ti2);

            this.body.add(window);
            
            this._ctrl_fields = this._ctrl_fields || {};
            this._ctrl_fields.ti1 = ti1;
            this._ctrl_fields.ti2 = ti2;

        }
        if (!spec.el) {
            compose();
        }
    }
    activate() {
        if (!this.__active) {
            super.activate();
            const {context, ti1, ti2} = this;

            ti1.data.model.on('change', e => {
                //console.log('ti1 change e', e);

                if (e.value !== e.old) {
                    ti2.data.model.value = e.value;
                }

            });
            ti2.data.model.on('change', e => {
                //console.log('ti2 change e', e);

                if (e.value !== e.old) {
                    ti1.data.model.value = e.value;
                }
            });
            context.on('window-resize', e_resize => {

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
    background-color: #E0E0E0;
}

.demo-ui {
    
    /* 

    display: flex;
    flex-wrap: wrap;
    
    flex-direction: column; 
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
    */
    
}
`;

controls.Demo_UI = Demo_UI;
module.exports = jsgui;
