const jsgui = require('jsgui3-client');
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;


const {Grid} = controls;

const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

// Maybe better to include it within an Active_HTML_Document.

// Is currently a decent demo of a small active control running from the server, activated on the client.
//   This square box is really simple, and it demonstrates the principle of the code for the draggable square box not being all that complex
//   compared to a description of it.

// A container with reorderable internal draggable items could help.

// would be nice to be able to have all code in 1 file...???
//  Though the sever code should be separate.


// Relies on extracting CSS from JS files.
// Usage of windows should be very easy on this level.


class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const {context} = this;

        // Make sure it requires the correct CSS.
        //  Though making that 'effortless' on the server may help more.


        // Maybe can't do this here???

        // Does not have .body (yet) on the client.
        //   simple way to get the client to attach the body of the Active_HTML_Document?
        //     maybe with jsgui-data-controls?
        //   Though automatically having the .body property available on the client without sending extra HTTP
        //     plumbing will help.

        // .body will not be available before activation.


        // .body should not be a normal function....?
        //   a getter function would be better.



        if (typeof this.body.add_class === 'function') {
            this.body.add_class('demo-ui');
        }

        //console.log('this.body', this.body);
        //console.log('this.body.add_class', this.body.add_class);


        const compose = () => {
            // put 20 of them in place.

            // Then how to arrange them...?

            const window = new controls.Window({
                context: context,
                title: 'jsgui3-html Grid Control',
                pos: [10, 10]
            });

            // Have Tab_Page items inside???

            // Maybe ne
            
            const grid = new Grid({
                context,
                grid_size: [10, 10],
                size: [200, 200]
            })

            window.inner.add(grid);

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

            //console.log('activate Demo_UI');
            // listen for the context events regarding frames, changes, resizing.

            context.on('window-resize', e_resize => {
                //console.log('window-resize', e_resize);

                // Make all internal controls go absolute in terms of position
                //   Remove them from their containers too?
                //   Ie their containing divs?

                // Would be nice to do this really simple with a fn call or very simple piece of code.
                // Like get absolute position, set position to be absolute, move to that position.
                // Maybe something within jsgui3-client helps with this, this is more about what needs to be done on the client.
                //   Though recognising perf implications, it's (more) OK to include client-side functionality in jsgui3-html.






            });

        }
    }
}

// Include this in bundling.
//  Want CSS bundling so that styles are read out from the JS document and compiled to a stylesheet.

//controls.Demo_UI = Demo_UI;

// A css file may be an easier way to get started...?
//  Want to support but not require css in js.

// But need to set up the serving of the CSS both on the server, and on the client.
//  Ofc setting it up on the server first is important - then can that stage set it up in the doc sent to the client?

// Including the CSS from the JS like before.
//  Needs to extract the CSS and serve it as a separate CSS file.
//  Should also have end-to-end regression tests so this does not break again in the future.
//   The code was kind of clunky and got refactored away.
//   

// Would need to parse the JS files to extract the CSS.
//  Maybe could do it an easier way??? Now that it's easy, want a faster way.


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

// But may want to remove them from that flex upon picking up / dropping them.
//  Maybe best upon drop.

// Maybe want other examples that use absolute positioning to position the items at the start?
// 



//controls.Square_Box = Square_Box;
// could export jsgui with the updated controls....
//  so that they are in the correct Page Context.?


controls.Demo_UI = Demo_UI;

module.exports = jsgui;

/*
module.exports = {
    Square_Box: Square_Box,
    Demo_UI: Demo_UI
}
*/

// Then if window...?

// Need to add the Square_Box control to the context or original map of controls...

