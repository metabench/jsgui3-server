const jsgui = require('jsgui3-client');
const {controls, Control, mixins} = jsgui;
const {dragable, selectable} = mixins;

const Active_HTML_Document = require('../../../../controls/Active_HTML_Document');

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const {context} = this;
        if (typeof this.body.add_class === 'function') {
            this.body.add_class('demo-ui');
        }

        // Persistant view ui properties.
        //   So that may be automated in a MVC+ type way.

        // so in the compositional phase (including on the server) it will be able to set up the view properties.

        // Composition to Active persistance.

        // Make the dom attributes within the view model even?
        //   Or not, as they are a layer that carries the view model to the client.

        // .view.data.model.mixins perhaps.
        //    would be a collection of some sort.

        // view.data.model.mixins.add('selectable');
        //   or it's a Data_Object? A Collection makes more sense in some ways.


        // And the mixins part of that data model will specifically get persisted (rendered and activated).






        const compose = () => {
            const n = 20;
            for (let c = 0; c < n; c++) {
                const box = new Square_Box({
                    context: context
                })
                selectable(box);
                box.selectable = true;

                // box.view.model.data.mixins

                // set up .selectable as a persistable field?
                //   seems like more in-depth work on persistance of view data model would make most sense here.
                //     with selectable ideally being / becoming a property of the view data model.

                // Will also need to persist mixin data that refers to (other) controls.
                //   Should try this next with a dragable mixin that uses another control as a handle.
                //     

                // Though selectable should support a handle as well.





                //box.selectable = true;


                this.body.add(box);
            }
        }
        if (!spec.el) {
            compose();
        }
    }
    activate() {
        if (!this.__active) {
            super.activate();
            const {context} = this;

            //console.log('activate Demo_UI');

            context.on('window-resize', e_resize => {
                //console.log('window-resize', e_resize);

            });
        }
    }
}
Demo_UI.css = `

body {
    margin: 0;
}

.demo-ui {
    display: flex;
    flex-wrap: wrap;
    /* flex-direction: column; */
    justify-content: center;
    align-items: center;
    text-align: center;
    min-height: 100vh;
}
`;

class Square_Box extends Control {
    constructor(spec) {
        spec.__type_name = spec.__type_name || 'square_box';
        super(spec);
        this.add_class('square-box');
    }
    activate() {
        if (!this.__active) {
            super.activate();
            //console.log('Activate square box');
            //console.log('this.selectable', this.selectable);


            // Could this have been set up in advance?
            //   Seems like deeper work on UI state and property persistance would help with this.

            // But want to make .selectable persist from composition to the active control.

            //   May be best to set up and automate persistant view.data.model fields.





            //this.selectable = true;

        }
    }
}
Square_Box.css = `
.square-box {
    box-sizing: border-box;
    background-color: #BB3333;
    width: 80px;
    height: 80px;
}
.square-box.selected {
    background-color: #3333BB;
    border: 3px solid #000;
}
`;

controls.Demo_UI = Demo_UI;
controls.Square_Box = Square_Box;

module.exports = jsgui;
