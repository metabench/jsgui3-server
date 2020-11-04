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

            /*

            const freq = 10000;
            let ts_last_exec;

            const proc = (obj_frame) => {
                console.log('proc');
                console.log('obj_frame', obj_frame);

                // Need the dims for the dom controls.
                // Need i_dom_id for the index of items within the DOM.
                //  Forget about iid for the moment?
                //   As these indexes become too sparse for the typed array.

                // Need to look at the map_dom_controls
                //  This map_dom_controls should be automatically maintained.
                //   Needs to be updated whenever a control gets added to or removed from the DOM.

                // Could use mutation observer?
                //  May make more sense to update it when we know that anything has been added to or removed from the DOM.
                //  Nullify references to the controls when removed from the DOM?
                //   Use delete? Is this still very slow? Is it appropriate?
                //   Or build up new object?

                // arr_dom_ctrls...?

                // or keep track of what's being added or removed from the DOM, and deal with it at various stages between frames.
                //  keeping track of and working within frames will make things work well.


                //const dims = context.create_dims_from_current_ctrls();
                //console.log('dims', dims);
            }

            context.on('frame', obj_frame => {
                //console.log('obj_frame', obj_frame);
                // Want to use the translate feature in the ctrl.ta.

                const {timestamp} = obj_frame;
                // Goes rather quickly.
                //  The page context may do some kinds of observations.

                // The locations of all controls...
                //  The locations of controls that we are monitoring for dimension changes

                // List / map of controls to check for different positions.

                if (ts_last_exec) {
                    if (timestamp - ts_last_exec >= freq) {
                        ts_last_exec = timestamp;
                        proc(obj_frame);
                    }
                } else {
                    ts_last_exec = timestamp;
                    proc(obj_frame);
                }
            });
            */

            // listen for the movement events?
            //  Context will do more to handle movement.

            // Get a ta of positions etc from the context?
            //  But a lot of that should be handled behind the scenes. Will keep a whole load of controls' properties together in a big typed array.


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
/*

*/

// Will most likely make use of mixins to give the box some functionality.
//  Responding to clicks / presses.
//   Drags.
//   An elastic effect does seeem like it would be useful.
//    Physics sims too...
//     Double elastic drag...?
//  Could also predict / plan how it will move and set it up with css animation frames.


// Making functionality as a mixin makes most sense for many things.
//  Code will be more adaptable, and the class defs will be clearer and more concise by referencing the named functionality rather than having the implementation code in there.

// Could split it into functions?
//  client = () => {...}, iso, server

// Stylistic definition in the code?
//  Worth using CSS?
//  It's the developer's choics.

// Will make use of dims / dimensions functionality.
//  Changing values in dims could be recognised between frames, and in the next frame, the size & position get updated.
//   batching CSS changes?

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

            // By default should be able to move it around.
            //  Breaking out of its current positioning, if necessary.
            //  Or will use a transformation to show it displaced from its current position.
            //   Easier than not setting it to abs pos and setting left and top properties.

            // Will interact with the typed array that deals with translation properties.
            //  Needs to happen on that lower level.

            // Will do work on translate mode dragging.

            dragable(this, {
                drag_mode: 'translate'
            });
            
            console.log('dragable mixin applied to square');
            this.dragable = true;
            console.log('this.dragable = true;');

            this.on('dragend', e => {
                console.log('square box dragend e', e);

                // Then snap it back to its original position?
                //  Get a snap back function here?

                // Could snap it back by changing / animating the transform properties.
                //  Or not right now... at least we have the main translate drag functionality working.

                // Also, could allow extensions / custom modes to be draggable.
                





            })

            // Use a variety of pieces of functionality.

            // Draggable
            //  Then elastic effect upon release.

            // This should work quickly on a lower level.
            //  Making a system for faster interactions.

            // Some other parts of the framework will use direct access to these typed arrays.
            //  Need things coded on that lower level.
            //   quite a lot of code involved....

            /*

            setTimeout(() => {
                // const X = 0, Y = 1, H = 2, W = 3, R = 4, B = 5, TX = 6, TY = 7;
                this.ta[6] = 100;
            }, 4000); // this works
            */


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

        // Will do necessary transformations to turn this into a client package.
        //  Would first spot that it's a module that can run on the server.
        //  Need this to work within jsgui like here, and outside.
        //   Will need to do some replacements at some points in the process.
        //   Further than just the CSS removal and extraction.
        //    Needs server code removal.
        //    Needs to include the client side js...
        //     Or replace the jsgui3-html with jsgui3-client at the top.

        // Also interested in removing controls that are not used within the app.
        //  Will save on download size.
        // For the moment, focus on splitting out the client-side code from server-side, and making it a nice package to serve to the client.
        ///  Will be easier not to have to make a separate client js file in many cases.
        //    Find a way to include activation code that references the context?
        //     Could be within the controls' activation.


        // Need to go through / make the client side js at a relatively early stage.
        //  Preferable before browserify (linking).
        //  May be best / necessary to save a .client.js file.


        // Client package processing to remove any server references.
        //  Change necessary ref to the client file.
        //  A somewhat complex recomplition process but it will make the examples and demos simpler.
        //   Single file full / single control server demos will be of great use.


        // String-only control definitions may come.
        //  All properties available when given as text.
        //  Property parsing.
        'js_mode': 'debug',

        'client_package': require.resolve('./square_box.js')
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