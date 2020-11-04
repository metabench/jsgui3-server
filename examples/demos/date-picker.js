/*
    A simple demo. This will require a bit more work regarding separating / compiling client-side code.
    Being able to write a whole (simple) app in one JS file will be very useful for writing and using something quickly.


    Will be a demo of some styling, maybe theming.
    Size / pos / dim props.
     Maybe some things like dragging it.
     Maybe it could bounce back into place.
     See about physics modelling, eg simulated mass and accelerations, elastic forces.
      Maybe that will be in a mixin? Written as a mixin within the demo?
      Want interesting functionality to be encapsulated in mixins rather than controls where possible.
        Encapsulated so that controls can use this functionality easily.
        A little page explaining encapsulation would help...


All the code will be valid on the server, apart from inner parts of functions that do checking to see the context (ie activate)
  Its not important to hide this code from the server like it is with hiding server-side code from the client.

*/


// Will a client js file be generated?
//  How will it be generated?

// Yes - will need to reference html-client.js, while having the control definitions, or code appropriately lifted from here.
//  However, would need to create a string js file that does what's needed.

const jsgui = require('jsgui3-html'); // and will replace this with jsgui-client, I presume.
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;
const {Date_Picker} = controls;

class Demo_UI extends Control {
    constructor(spec) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const {context} = this;
        this.add_class('demo-ui');

        const compose = () => {
            const ctrl = new Date_Picker({
                context: context
            })
            this.add(ctrl);
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

// Client and server

// Overall control.
// A square box inside that control.

// Server
//  The definition of and loading in of server object.
//  Starting it up. All of the code within the part where the module runs.

// SCS makes sense for this though.

//  Then will make a nice demo to do with dragging and elasticity.
//   Need to do more work on the js resource converting single file js to client-side js.
//   Won't be all that complicated overall but has parts with a bit of complexity that need to be written.

if (require.main === module) {
    const SCS = require('../../single-control-server');
    // generate client js from this js itself...
    //  possibly need to save client js in same path too...?
    //   same file name, .client.js?
    //    would make sense.
    //     probably nicer without, but not sure how easy / possible to do it.

    // client js - be able to detect if its a server module.
    //  if so, will need to do some replacements and removals.
    //   (transformations)
    const server = new SCS({
        Ctrl: Demo_UI,
        'js_mode': 'debug',
        'client_package': require.resolve('./date-picker.js')
        //js_client: require.resolve('./square_box.js')
    });

    // then start the server....

    server.start(function (err, cb_start) {
        if (err) {
            throw err;
        } else {
            console.log('server started');
        }
    });

}