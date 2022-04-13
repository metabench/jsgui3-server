
const jsgui = require('jsgui3-html'); // and will replace this with jsgui-client, I presume.
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;

class Demo_UI extends Control {
    constructor(spec) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const {context} = this;
        this.add_class('demo-ui');

        const compose = () => {
            const box = new Square_Box({
                context: context
            })
            this.add(box);
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
controls.Demo_UI = Demo_UI;
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
            
            console.log('dragable mixin applied to square');
            this.dragable = true;
            console.log('this.dragable = true;');

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
controls.Square_Box = Square_Box;

if (require.main === module) {
    const SCS = require('../../single-control-server');
    const server = new SCS({
        Ctrl: Demo_UI,

        //'js_mode': 'debug',

        'client_package': require.resolve('./square_box.js')
        //js_client: require.resolve('./square_box.js')
    });

    // then start the server....

    // be able to choose the port / ports?

    server.start(8080, function (err, cb_start) {
        if (err) {
            throw err;
        } else {
            console.log('server started');
        }
    });

}