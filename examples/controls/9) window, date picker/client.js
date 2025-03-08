const jsgui = require('jsgui3-client');
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;
const {Checkbox, Date_Picker} = controls;
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
                title: 'jsgui3-html Date_Picker Control',
                pos: [10, 10]
            });
            const date_picker = new Date_Picker({
                context,
                //label: {
                //    text: 'A checkbox'
                //}
            })
            window.inner.add(date_picker);
            this.body.add(window);
        }
        if (!spec.el) {
            compose();
        }
    }
    activate() {
        if (!this.__active) {
            super.activate();
            const {context} = this;
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