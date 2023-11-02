const jsgui = require('jsgui3-client');
const {controls, Control, mixins, Data_Object} = jsgui;
const {dragable} = mixins;
const {field} = require('obext');

const {Checkbox, Date_Picker} = controls;

const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

// Will make Date_Picker use progressive enhancement.
//   On activation would create a new element? Create a new sibling?
//     May want code that checks for .el being changed.


// Would be worth improving Date_Picker so it has both its view model and data model.
//  kind of view state and data state.

// Then could have 2 shared model mirrored date pickers.

// still could use just .value and respond to changes in that.


// Maybe any control which has one or more values will benefit from having these 2 or more model levels added to them.


// Would be nice to have it more automatic.
//   Would be worth putting on a lower level to make really easy to integrate into controls.

// data.model.schema may help a lot as well.
// data.model.data ???

// so a data model (or other model) contains its own data property.

// data.model.data even
// data.schema?
// data.model.schema would then be more unambiguously available.

// For the moment, don't want to make all the options of dynamically changing them, can add them as we go.

// Lower level work, outside of jsgui3 itself? could help formalise the data models and schemas.

// Maybe jsgui should have a Data_Model_View_Model pattern or object?
// Multi_Model or Multi_Model_Pattern.

// For the moment, let's get one or two things done cleanly and more explicitly.

// Perhaps it would work best as a Mixin for now.







// May be worth formalising it further




// It's .value would refer to its .data.model.value



// Nice to have the date picker (be able to) use .data.model and .view.model.




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

        // In near future want to make this automatic / lower level.
        //   Possibly automatic on a Data_Model_View_Model_Control.

        // DMVM_Control perhaps too.
        //  Or DMVMC perhaps?
        //   CDMVM / CMVM
        //    CDMVDM ???
        //      Could make work on it a bit more and see which ancronym best fits the pattern(s).
        //    Could have variety of different setups, such as when there is no 'view model'?
        //    Or there is no 'data model', but it's only for adjusting the value of a 'view model' of another control.

        



        const setup_demo_ui_data_model = () => {
            this.data = {
                model: new Data_Object({
                    context
                })
            }
            field(this.data.model, 'value');
            context.register_control(this.data.model);
        }
        setup_demo_ui_data_model();

        //console.log('this.body', this.body);
        //console.log('this.body.add_class', this.body.add_class);


        const compose = () => {
            // put 20 of them in place.

            // Then how to arrange them...?




            const window = new controls.Window({
                context: context,
                title: 'jsgui3-html Shared Data Model Date_Picker Controls',
                pos: [10, 10]
            });

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



            // Then the shared model...
            //   Being able to set this up on composition would help.
            //     However, it looks like they need to be assigned the field named 'value' for the value change events to work.

            const date_picker_1 = new Date_Picker({
                context,
                data: {
                    model: this.data.model
                }
                //label: {
                //    text: 'A checkbox'
                //}
            });

            window.inner.add(date_picker_1);

            const date_picker_2 = new Date_Picker({
                context,
                data: {
                    model: this.data.model
                }
                //label: {
                //    text: 'A checkbox'
                //}
            });

            window.inner.add(date_picker_2);

            this.body.add(window);

            this._ctrl_fields = this._ctrl_fields || {};
            this._ctrl_fields.date_picker_1 = date_picker_1;
            this._ctrl_fields.date_picker_2 = date_picker_2;



            


        }
        if (!spec.el) {
            compose();
        }
    }
    activate() {
        if (!this.__active) {
            super.activate();
            const {context, date_picker_1, date_picker_2} = this;

            //console.log('activate Demo_UI');

            const activate_demo_ui_data_model = () => {
                console.log('date_picker_1.data.model === date_picker_2.data.model', date_picker_1.data.model === date_picker_2.data.model);
                
                if (date_picker_1.data.model === date_picker_2.data.model) {

                } else {

                    // Should not need this code.
                    //   Want decent low/mid level code to send the info to the client so the client can automatically reconstruct it.
                    ///    Maybe a different function as standard to assign isomorphic things.


                    const dm = new Data_Object({context});
                    field(dm, 'value');
                    date_picker_1.data.model = dm;
                    date_picker_2.data.model = dm;

                    // But then need to get them to reassign their data model change listeners....?
                    //   value change even....

                    date_picker_1.assign_data_model_value_change_handler();
                    date_picker_2.assign_data_model_value_change_handler();


                }
            }

            activate_demo_ui_data_model();




            // listen for the context events regarding frames, changes, resizing.

            context.on('window-resize', e_resize => {

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

