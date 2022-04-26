const jsgui = require('jsgui3-client'); // and will replace this with jsgui-client, I presume.

const {controls, Control, mixins} = jsgui;
const { Color_Palette } = controls;
const {dragable} = mixins;

// Relies on extracting CSS from JS files.

class Demo_UI extends Control {
    constructor(spec) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const {context} = this;
        this.add_class('demo-ui');

        const compose = () => {

            // Have it resize itself to fit the available space it has?
            // mixin resize-to-fit-space possibly.
            //  would measure the space available in its parent control or container.




            const pal = new Color_Palette({
                context: context
            })
            this.add(pal);
        }
        if (!spec.el) {
            compose();
        }
    }
    activate() {
        if (!this.__active) {
            super.activate();
            const {context} = this;

            console.log('activate color_palette Demo_UI');
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


.demo-ui .cell {
    height: 24px;
    width: 24px;
}
`;

// then if running on the client...?



//controls.Square_Box = Square_Box;
// could export jsgui with the updated controls....
//  so that they are in the correct Page Context.?


controls.Demo_UI = Demo_UI;
//controls.Square_Box = Square_Box;

module.exports = jsgui;

/*
module.exports = {
    Square_Box: Square_Box,
    Demo_UI: Demo_UI
}
*/

// Then if window...?

// Need to add the Square_Box control to the context or original map of controls...

