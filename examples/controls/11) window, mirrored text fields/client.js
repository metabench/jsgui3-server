const jsgui = require('jsgui3-client');
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;


const {Checkbox, Date_Picker, Text_Input, Text_Field} = controls;

const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

// Will make Date_Picker use progressive enhancement.
//   On activation would create a new element? Create a new sibling?
//     May want code that checks for .el being changed.






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
                title: 'jsgui3-html Mirrored Text_Input controls',
                pos: [5, 5]
            });

            window.size = [480, 160];


            const ti1 = new Text_Field({
                context,
                text: 'A'
                //label: {
                //    text: 'A checkbox'
                //}
            })

            window.inner.add(ti1);

            const ti2 = new Text_Field({
                context,
                text: 'B'
                //label: {
                //    text: 'A checkbox'
                //}
            })

            window.inner.add(ti2);

            this.body.add(window);



            
            this._ctrl_fields = this._ctrl_fields || {};
            this._ctrl_fields.ti1 = ti1;
            this._ctrl_fields.ti2 = ti2;


        }
        if (!spec.el) {
            compose();
        }
    }
    activate() {
        if (!this.__active) {
            super.activate();
            const {context, ti1, ti2} = this;

            console.log('activate Demo_UI');
            // and events dealing with changes to those tis.

            // ti1, ti2.

            // Some kind of tracking of what the event initiator could help?
            //   Automatically avoiding feedback somehow???
            //     If it gets changed to its current value it does not push the change...?


            // a non-dom change???
            //   or basically .view.model.change even????

            // ti1.view.model.on('change') could be much clearer, disambiguating it from a dom change event.
            //  assign .view.model events ....?
            //    doing this on a lower level would help.

            // Just creating .view and .view.model objects (getters and setters specified) in jsgui3-html will help
            // when referring to them.




            // ti1.value.on('change') ????
            //   where the value is an Evented_Class or even Data_Object????
            //    and where we can also get the value out of it easily / do so automatically, maybe within other useful functions.


            // ti1.model.on('change') ????
            //  or .view.model to be most specific for the moment...?
            //   and raise those events within the controls on those .view.model objects.

            // Maybe just try it on Text_Field for the moment.



            // Need to work on having it update the dom with value changes....

            ti1.model.on('change', e => {
                //console.log('ti1 change e', e);


                if (e.property_name === 'value') {
                    if (e.value !== e.old) {
                        ti2.value = e.value;
                    }
                }

                // setting ti2.view.model.value even????
                

                

            })
            ti2.model.on('change', e => {
                //console.log('ti2 change e', e);

                // 

                if (e.value !== e.old) {
                    ti1.value = e.value;
                }

                
            })

            // listen for change events.
            //   would be nice to know which change events originated from the user interacting with that specific HTML element (or ctrl???)

            // e.from_user === true test.

            // e.user_initiated_on_this ????




            //console.log('activate Demo_UI');
            // listen for the context events regarding frames, changes, resizing.

            context.on('window-resize', e_resize => {
                
                // Could see about having some window contents bound through CSS to the size of the window.
                //   Though having a framework of adjusting CSS from the JS on-the-fly could work too.

                // May be done with the 'bind' mixin, or will make more specific mixins to do things like bind
                //   a control to the space within another control, space within a specific part of that control.

                // Or bind to parent size. That should be possible with CSS though.
                //   May make some controls make more use of CSS by default
                //   Or having an absolutely positioned box model used extensively could avoid some ambiguity, though
                //     making use of and supporting generally respected CSS features will help too.

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

