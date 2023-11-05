const jsgui = require('jsgui3-client');
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;


const {Checkbox, Date_Picker, Text_Input} = controls;

const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

// Will make Date_Picker use progressive enhancement.
//   On activation would create a new element? Create a new sibling?
//     May want code that checks for .el being changed.


// Should not need to refer to the .data.model? view.data.model?



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

            // Have Tab_Page items inside???

            // Setting a 'selectable' property at the composition stage could be very helpful in some cases,
            //   May want composition-level mixins?
            //   Maybe those mixins would also have code that runs on activation.
            //     'compositional mixins' ???

            // Need mixins to be very flexible to avoid the probles React had with them.
            //   Choose what functionality the mixin provides in some cases.
            //     Need to keep tight control over the coupling of mixins.
            //   Each mixin may need to be somewhat complex to avoid hiccups - and to consistently act in the set modes.
            //     If a mixin is to do something different to before that functionality should be called differently.

            // mixin.enabled_feature_sets = [feature_set_1_name, feature_set_2_name] ....



            // Will work on more options & perfection for month_view.

            /*

            new Checkbox({
                context,
                label: {
                    text: 'A checkbox'
                }
            })

            */
            
            // Sensible properties like this will help.
            
            // A progressively enhancing control could help a lot.
            //   Something that when it's in the doc will even replace its own element.
            //   Lower level code to enable really simple to express progressive enhancement could help, maybe would not be needed.





            const ti1 = new Text_Input({
                context,
                //label: {
                //    text: 'A checkbox'
                //}
            })

            window.inner.add(ti1);

            const ti2 = new Text_Input({
                context,
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


            // and events dealing with changes to those tis.

            // ti1, ti2.

            // Some kind of tracking of what the event initiator could help?
            //   Automatically avoiding feedback somehow???
            //     If it gets changed to its current value it does not push the change...?

            // on the data model change instead....


            // Code has got more complex supporting things by data model changes for the moment.
            //   May help a lot when making it more explicit.



            // But could make 'on' (normally?) refer to the .data.model???
            //   For the moment, keep the more explicit notations, as well as backwards compatibility.

            // ctrl.dom.on may help, be a nicer and more concise syntax, just as explicit (considering the 'on' abbreviatrion)


            // does seem convenient having .on refer to dom events if it's an appropriate event name for that.




            ti1.data.model.on('change', e => {
                //console.log('ti1 change e', e);

                if (e.value !== e.old) {
                    ti2.data.model.value = e.value;
                }

                

            });
            ti2.data.model.on('change', e => {
                //console.log('ti2 change e', e);

                if (e.value !== e.old) {
                    ti1.data.model.value = e.value;
                }

                
            });

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

