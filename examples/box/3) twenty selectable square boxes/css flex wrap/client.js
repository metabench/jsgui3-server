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
        const compose = () => {
            const n = 20;
            for (let c = 0; c < n; c++) {
                const box = new Square_Box({
                    context: context
                })
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

            console.log('activate Demo_UI');

            context.on('window-resize', e_resize => {
                console.log('window-resize', e_resize);

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
            console.log('Activate square box');

            /*
            dragable(this, {
                drag_mode: 'translate'
            });
            console.log('dragable mixin applied to square box');
            this.dragable = true;
            */

            selectable(this);
            console.log('selectable mixin applied to square box');
            this.selectable = true;
            // Maybe should turn on selectable by default?
            //   Though mixins may be best to add functionality rather than add and enable it always.

            //this.selectable = true;
            
            
            
            //console.log('this.dragable = true;');

            this.on('dragend', e => {
                this.background.color = '#44FF44';
                const bcr = this.bcr();
                const absolutise_position = () => {
                    const style = this.dom.attributes.style;
                    // but need to move it to the body....
                    // But then when it's in absolute position the dragable mixin needs to support it and not mess up...

                    style.position = 'absolute';
                    style.left = bcr[0][0];
                    style.top = bcr[0][1];
                    style.transform = 'none';
                    // Much better if these lines were not needed. Should be able to set these ta translate x and y values once the
                    //   style transform gets set.
                    this.ta[6] = 0; // This ta system may be a good and fast way to set translations, should not need to
                    // use it when using a higher level api though.
                    this.ta[7] = 0;
                }
                absolutise_position();
            });
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
