const jsgui = require('jsgui3-client'); // and will replace this with jsgui-client, I presume.
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;


class Square_Box extends Control {
    constructor(spec) {
        spec.__type_name = spec.__type_name || 'square_box';
        super(spec);
        this.add_class('square-box');
    }
    activate() {
        if (!this.__active) {
            super.activate();
            console.log('Activate square box');

            dragable(this, {
                drag_mode: 'translate'
            });
            
            //console.log('dragable mixin applied to square');
            this.dragable = true;
            //console.log('this.dragable = true;');

            this.on('dragend', e => {
                console.log('square box dragend e', e);
            });

        }
    }
}
Square_Box.css = `
.square-box {
    background-color: #BB3333;
    width: 220px;
    height: 220px;
}
`;

// Relies on extracting CSS from JS files.

// want to have an easy way to put this inside an HTML document (rendered webpage);

class Demo_UI extends Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const {context} = this;
        this.add_class('demo-ui');
        const compose = () => {
            const box = new Square_Box({
                context: context
            })
            this.add(box);

            const box2 = new Square_Box({
                context: context
            });
            //box2.background_color = '#6655CC';
            //box2.background.color = '#6655CC';
            // or even box2.color = ... and it would know which color was meant
            //  or be able to access the .color reference / property name when asked for.

            box2.background.color = '#6655CC';


            //box2.dom.attributes.style['background-color'] = '#6655CC';
            this.add(box2);

            const box3 = new Square_Box({
                context: context
            })
            this.add(box3);
        }
        if (!spec.el) {
            compose();
        }
    }
    activate() {
        if (!this.__active) {
            super.activate();
            const {context} = this;

            console.log('activate Demo_UI');
            // listen for the context events regarding frames, changes, resizing.

            context.on('window-resize', e_resize => {
                console.log('window-resize', e_resize);
            });

        }
    }
}

// Include this in bundling.
//  Want CSS bundling so that styles are read out from the JS document and compiled to a stylesheet.

//controls.Demo_UI = Demo_UI;
Demo_UI.css = `
.demo-ui {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
}
`;

// then if running on the client...?

//controls.Square_Box = Square_Box;
// could export jsgui with the updated controls....
//  so that they are in the correct Page Context.?

controls.Demo_UI = Demo_UI;
controls.Square_Box = Square_Box;

module.exports = jsgui;

/*
module.exports = {
    Square_Box: Square_Box,
    Demo_UI: Demo_UI
}
*/

// Then if window...?

// Need to add the Square_Box control to the context or original map of controls...

