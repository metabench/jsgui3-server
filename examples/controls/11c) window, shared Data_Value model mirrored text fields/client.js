const jsgui = require('jsgui3-client');
const {controls, Control, mixins, Data_Value} = jsgui;
const {dragable} = mixins;

const {field} = require('obext');

const {Checkbox, Date_Picker, Text_Input, Text_Field} = controls;

const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

// Will make Date_Picker use progressive enhancement.
//   On activation would create a new element? Create a new sibling?
//     May want code that checks for .el being changed.



// Want the data sharing to be really simple and intuitive to set up.
//   But not so simple the comlexities of data flow can't be expressed when needed.


// Make it so sharing a data model is very easy.
//   Sharing a single value, or referring to different values within it.

// Be able to handle errors when the view model can't update the data_model for some reason(s).






class Demo_UI extends Active_HTML_Document {



    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const {context} = this;


        // Create the Data_Model here....

        // Maybe on pre-activate set its values if it's already been set?

        // Or better send over info about the Data_Model that gets brought into the Page_Context???

        // data.model transfer needs to be automatic.
        //   Possibly it would be a client-side resource?

        // Want to make the syntax when composing / defining things as simple as possible.

        // Simple enough for the moment.
        //   Could see about auto-registering?
        //     Maybe later on.
        // Simple and explicit code will be best for the moment.
        //   Must be concise, then could consider more concise and less explicit (but unambiguous) ways to declare things
        //     to do with data and view model interactions.


        // And using a Control_Data class here could help.
        // Then a Control_View class.
        //   And the Control_View has its own internal Data. Maybe even a Control_View_Data ???

        

        // Needs a little bit more work...

        //  Maybe adding the fields to the Data_Object is needed.





        const setup_demo_ui_data_model = () => {
            console.log('client pre creare data.model as Data_Value')
            this.data = {
                model: new Data_Value({
                    context
                })
            }
            //field(this.data.model, 'value');
            context.register_control(this.data.model);
        }
        setup_demo_ui_data_model();


        




        // The app as a whole having a view.data.model ????


        // Or want defined properties / proxies on the Data_Model?
        //  or fields?

        // want to listen for changes to the data_model.

        // May need comprehensive changes to a lot of controls.
        //   Making this system the standard / default.
        //     Getting it working with easy idioms on the top level - don't update the data model on every keystroke.

        // when setting the bounds of a rect, need to set multiple numbers at once (up to 4).

        // A ctrl.view.data.model
        //  Looks like it's worth making and making use of Control_View and Control_Data classes.
        //    Would have / support .model.

        // The view.data.model would model exactly what data is in the view.
        //   It would only get synced to the data.model at appropriate times (like user moving on, or confirming 'ok' or 'go')

        // 'cancel' and 'go' would be of use in some cases.
        //   red (or grey) and then a green (or slightly green) button.
        //    a slightly red grey and then a bolder and more colorful green. Would be more color blindness accessible.













        // this.data.model.set('k', 'v')???

        // create_shared_data_model function...
        //   would happen on activate as well as compose.

        // Or just make sure there is the 'value' field there...?




        


        // And have it persisted to the HTML by the server that they both use that same data.model???
        //   A bit more lower level code to support more properties / objects being reconstructed client-side would help.






        // Then when there is a change to that data_model...?




        // Context would have a built-in data_model?
        //   Maybe for HTML apps. Not all Data_Object contexts.

        // Server_Page_Context also having and using a Data_Model....
        //   Would make sense.
        //   Same with the Client_Page_Context




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


            // Setting up the shared model in composition would be best....
            //   Or maybe during init, pre-activate?

            // This seems like it will need some lower level integration for ease of use.
            //   Would like this to work server-side when setting properties, so should not rely on having this
            //     in the 'activate' code.

            // a 'model' property.
            //  maybe two model properties: view.model, data.model.

            // There could be a 'confirm / cancel' dialog when the view.model has been changed, and the view model can be updated

            // Also, a single model could enable an undo history.

            // app.data.model?
            // context.data.model?

            // context.view.model could make sense too, for representing the state of the app view (ie windows maximised, minimised, positions)
            //   Could help when resuming the app at a later point, or transmitting the view of the app.
            //   Maybe for collaborative editing, could operate like shared screen, or each user has control over their own windows.



            // context.model?

            // ctrl.view.model perhaps???
            // ctrl.data.model = context.model perhaps?






            const window = new controls.Window({
                context: context,
                title: 'jsgui3-html Shared data.model Mirrored Text_Input controls',
                pos: [5, 5]
            });

            window.size = [480, 160];

            // Label text better propbably?

            // .value

            // .data.model = context.data.model


            // set that 'value' to a data model ??? No.
            //  set it's 'model' or 'data.model'.

            // data.model for the moment will be best.
            //   That is what we want to bind.
            //   View model and data model pair could allow for 'cancel | OK' options to confirm changes.


            // 'data_model' property.
            // 'dmodel', 'dm' too...?
            //  'vm' possibly?

            // .v.m shorthand??
            // .d.m too?



            // or data: {model: obj_data_model}

            // The data model persistance must not be tricky here.
            //   Maybe setting it up at compose is not best???
            //    Makes for the nicest syntax here, the 'magic' about jsgui is handing things over to the client
            //    in a working way, auto-reconstructing things client-side.
            //   Would need to send over info on which Data_Model would be used...


            // The shared data model should mean that these fields automatically stay in sync (somewhat)
            //   A shared view model would mean a more immediate sync.


            // So Text_Field would need to look at data, data.model from the spec.

            // Write the code in a few controls first, see what is in common and can be abstracted into a mixin
            //  such as control-data-model-sync


            // Would change the 'value' property by default.

            const ti1 = new Text_Field({
                context,

                text: 'A',
                data: {
                    model: this.data.model

                    // model: [this.data.model, 'value'] // this seems better

                    // model_property: 'value'
                    // model_property: 'value2'  // for example
                }
                //label: {
                //    text: 'A checkbox'
                //}
            })

            window.inner.add(ti1);

            // Though not sure they get reconstructed with that data model?

            // Want to make this easy for the app programmer to get right in particular.

            // May need (much) more work on persisting the data model to the client.
            //   Or defining it in a way / place so it can be started isomorphically.
            //     Though it may make sense to do more to transfer models from the server to the client, with their data.
            //       However, reconstructing models from the (values in) the DOM could make a lot of sense.
            //       Having it read the DOM to create its DOM model, then from that its view.data model, then its data model.


            





            const ti2 = new Text_Field({
                context,

                text: 'B',
                data: {
                    model: this.data.model
                }


                //label: {
                //    text: 'A checkbox'
                //}
            })

            window.inner.add(ti2);

            this.body.add(window);



            // ._ctrl_fields should automatically be set up.
            //   Also make it so when there are 0 entries in there it won't render the DOM attribute.

            // First get the MVC properly and explicitly working accross some more controls.
            //   If any abstractions come really easily then do that.
            //     Maybe a DMVM_Control could be very effective soon.

            // An 'adjuster' control could possibly have no 'data model' of its own.
            // It could be set up to adjust either a data model, or a view model.

            

            
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

            //field(this.data.model, 'value');
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

            // Maybe see about better reconstruction....

            //console.log('ti1.data.model', ti1.data.model);
            //console.log('ti2.data.model', ti2.data.model);

            

            const activate_demo_ui_data_model = () => {
                console.log('ti1.data.model === ti2.data.model', ti1.data.model === ti2.data.model);

                if (ti1.data.model === ti2.data.model) {

                } else {

                    // Should not need this code.
                    //   Want decent low/mid level code to send the info to the client so the client can automatically reconstruct it.
                    ///    Maybe a different function as standard to assign isomorphic things.


                    // What about (just) using a Data_Value???
                    // Data_Value_Model?
                    // Data_Model_Value???

                    // Just stick to Data_Value for now.



                    const dm = new Data_Value({context});
                    //field(dm, 'value');
                    ti1.data.model = dm;
                    ti2.data.model = dm;

                    // But then need to get them to reassign their data model change listeners....?
                    //   value change even....

                    //ti1.assign_data_model_value_change_handler();
                    //ti2.assign_data_model_value_change_handler();


                }
            }

            activate_demo_ui_data_model();

            

            // Create a new data_model (and view_model?) for both of them?
            //   The view_model gets created by default and does not need to be shared (and should not be)





            // ti1.value.on('change') ????
            //   where the value is an Evented_Class or even Data_Object????
            //    and where we can also get the value out of it easily / do so automatically, maybe within other useful functions.


            // ti1.model.on('change') ????
            //  or .view.model to be most specific for the moment...?
            //   and raise those events within the controls on those .view.model objects.

            // Maybe just try it on Text_Field for the moment.



            // Need to work on having it update the dom with value changes....

            const old_activate_changes = () => {

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
            }

            

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

