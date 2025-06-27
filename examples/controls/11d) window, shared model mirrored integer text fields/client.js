const jsgui = require('jsgui3-client');
const {controls, Control, mixins, Data_Value, Functional_Data_Type} = jsgui;
const {dragable} = mixins;


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
            this.data = {
                model: new Data_Value({
                    context,
                    data_type: Functional_Data_Type.integer
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
            


            const window = new controls.Window({
                context: context,
                title: 'jsgui3-html Shared data.model Mirrored Text_Input controls',
                pos: [5, 5]
            });

            window.size = [480, 160];

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

            const activate_demo_ui_data_model = () => {
                console.log('ti1.data.model === ti2.data.model', ti1.data.model === ti2.data.model);

                if (ti1.data.model === ti2.data.model) {

                } else {

                    // Should not need this code.
                    //   Want decent low/mid level code to send the info to the client so the client can automatically reconstruct it.
                    ///    Maybe a different function as standard to assign isomorphic things.




                    const dm = new Data_Value({context,
                        data_type: Functional_Data_Type.integer});

                    // Should be enough here....
                    
                    //field(dm, 'value');
                    ti1.data.model = dm;
                    ti2.data.model = dm;

                    // But then need to get them to reassign their data model change listeners....?
                    //   value change even....

                    ti1.assign_data_model_value_change_handler();
                    ti2.assign_data_model_value_change_handler();


                }
            }

            activate_demo_ui_data_model();

        }
    }
}


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


controls.Demo_UI = Demo_UI;
module.exports = jsgui;
