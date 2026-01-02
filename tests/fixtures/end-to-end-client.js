const jsgui = require('jsgui3-client');
const {controls} = jsgui;
const Active_HTML_Document = require('../../controls/Active_HTML_Document');

class Test_Control extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'test_control';
        super(spec);
        const {context} = this;
        if (typeof this.body.add_class === 'function') {
            this.body.add_class('test-control');
        }
        const compose = () => {
            const container = new controls.div({context});
            container.dom.attributes.id = 'test-control';
            container.add_class('test-control');

            const header = new jsgui.controls.h1({context});
            header.add('Test Control');
            const paragraph = new jsgui.controls.p({context});
            paragraph.add('This is a test control with embedded CSS and JS.');
            const button = new controls.Button({context, text: 'Test Button'});

            container.add(header);
            container.add(paragraph);
            container.add(button);
            this.body.add(container);
        };

        if (!spec.el) {
            compose();
        }
    }
}

Test_Control.css = `
.test-control {
    background-color: #f0f0f0;
    padding: 20px;
    border: 1px solid #ccc;
    font-family: Arial, sans-serif;
}
.test-control h1 {
    color: #333;
    margin-bottom: 10px;
}
.test-control p {
    color: #666;
    line-height: 1.5;
}
`;

controls.Test_Control = Test_Control;
module.exports = jsgui;
