const jsgui = require('jsgui3-client');
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;


const {Checkbox, Date_Picker, Text_Input, Text_Field, Select_Options} = controls;

const Active_HTML_Document = require('../../../controls/Active_HTML_Document');

// Will make Date_Picker use progressive enhancement.
//   On activation would create a new element? Create a new sibling?
//     May want code that checks for .el being changed.


/*
    Though this works through simple principles, it may be much better to do data binding with a shared ctrl.data.model.
    Want the top-level code to be really simple and intuitive when specifying data flows, and when not specifying them
    using sensible defaults.

    The granularity between data.model and view.model should help a lot.

    // Also data.model.value being a possible default.
    // Data models will become more advanced and capable of holding multiple values.
    //   For the moment, although the Control_Data and Control_View classes exist, will continue with a POJO.
    //     Then could later work on getter / setters for when a data.model or a view.model gets changed.



    Also should work on functional constraints or / and class based constraints for fields / text fields.
    // Both for data in the system, as well as in the UI.
    // Could integrate a bit more with data types / class data types.

    // Typed_Data_Value perhaps.

    // Anyway, want to set things up better with the .view.model and .data.model system.

    // Then later support more complex (and / or app-defined) data and view models.

    // Defining what the underlying data of the app is could help (a lot).
    //   Some data may be for editing, some not.

    // A data model could have a bunch of news articles, and be set up so that they can be viewed nicely.
    //   Would not be so important to edit the articles themselves, though maybe the user may want to tag them
    //   and comment on them.

    // Mid-level complexity handling a fair bit of what needs to happen with multiple models, how updates get sequenced
    //   but then at a high level code must be really simple.
    // Could distinguish between view and data models at high level - may help a lot in some cases.
    //   However, will generally assume a shared data model between controls, not a shared view model, and the data model
    //     will be updated with at least some small / sensible hesitation.
    //       Maybe even define the update hesitations / update hesitation mode.
    //   Data Model Update Hesitation Mode???

    // View Model To Data Model Syncing Update Hesitation Mode???
    //   really explicit names on the more complex mid level will help the code and system to make sense.
    
    // syncing.view_to_data.hesitation = 'leave-control' ????
    //   And could have that one as the default.
    //     Or could hesitate / debounce 250ms for example.
    // Very very explicit on the more complex mid / lower level, so that it's really simple on the higher level,
    //   and can (quickly?) get into more explicit details when needed.

    // Data model syncing seems best in general.
    //   Then sync data model changes immediately to view models.
    //   Then only sync view model changes to data model after necessary hesitation / event / confirmation.
    //     Also be able to cancel view model changes (load values back from data model possibly, some contexts makes a lot more sense)


    // The view model is essentially internal to the control - though maybe it would integrate with a whole Page_Context view
    //   model that's for all the controls...?

    // Internal and separate view models for the controls seems best for the moment.
    //   Could always use refs to some place else.

    // Have the controls automatically create their view model.

    // Some controls should not determine the data model at application (or larger control) start.
    //   Maybe some should?

    // Or better to change it so that the Data_Model gets set first, then all the controls given access to it at start (on server)
    //   and get rendered on the server with the correct data, then on the client it only sets the view_model at the start.
    //     Or does it???
    // Want different sensible options for getting that Data_Model to the client. Maybe getting the View_Model to the client????

    // Make it simple and easy to code on the top level API.

    
    























*/





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
                title: 'jsgui3-html Select_Options',
                pos: [5, 5]
            });

            window.size = [480, 160];

            // Without specifying the data model.
            //   Should be able to use and refer to data and view models even when not specified.
            //     Want this complexity on the lower level to enable simple (but not overly simple/simplstic) higher level programming.



            // Should set up its data model automatically if not specified here.
            //   An independent data model, specifically for that text field.

            // Or in the data.model.label_text perhaps?

            // Want to make it easy to make and use somewhat more complex and expressive structures.

            // The text label makes more sense being in the view.data.model???

            // Should set up the ctrl.data.model.value and ctrl.data.model.options automatically.
            //   Needs to be a somewhat complex and multi-stage process.

            // Maybe support some shared values, ie .value shared with one place, and .options shared with another.

            // Definitely want it to be simple to make with the high-level API.
            //   Can operate by default in a sophisticated way under that, though make it simple and
            //     easy to define what is and is not shared where.

            // Will soon approach it from the higher level app code that needs to specify which models / values are shared where and how.


            // Assign the data.model.options from the options in the spec.
            //   don't need to give them as data.model or data.model.options.

            // .selected.index??
            // .selected.value???

            // Could also work with the 'selectable' mixin?
            //   Some core selectable support built into that...?

            


            // .options.selected even????

            //.selectedIndex
            




            const select_options = new Select_Options({
                context,
                options: ['zero', 'one', 'two', 'three', 'four', 'five']
            });


            window.inner.add(select_options);


            this.body.add(window);
            
            this._ctrl_fields = this._ctrl_fields || {};
            this._ctrl_fields.select_options = this.select_options = select_options;


        }
        if (!spec.el) {
            compose();
            this.add_change_listeners();
        }


        // Can respond to / deal with changes to the data models here, not only when activated.
        //   The data.model and view.model system seems to offer some higher level improved programming by putting
        //   more in the constructor. Maybe the activated code ('.activate') would not be needed on higher level controls,
        //   because the lower level ones will connect it all up the the dom <> view <> data models / system.

        // It even has a 'dom model' too, of sorts ????
        //   Though currently it's not named that or considered that throughout the code there.
        // Could be worth moding to dom.model
        // then view.model
        // then data.model

        // Could be a structure that better supports non-dom models.
        //   Though in this case, it would no yet have the refs to all the child things????

        // Getting that back in the 'compose' or 'recompose' stage could help.
        //   Though it's currently auto-recompose pre activate.

        // Maybe want code to run either when activated, or post-compose.
        //   add_change_listeners.

        // Would be run server-side after compose (or when composing it like that on the client)
        //   but when it gets recomosed on the client-side would need to run then instead.

        








    }

    add_change_listeners() {
        const {select_options} = this;

        // Need to fix the text_field data model and view model system.

        //console.log('add_change_listeners');

        // Maybe it should always have a .data.model???
        //   Makes sense in terms of plenty of controls.




        select_options.data.model.on('change', e => {
            console.log('select_options.data.model change e', e);

            /*
            if (e.name === 'value') {
                if (e.value !== e.old) {
                    ti2.data.model.value = e.value;
                }
            }
            */
        });


    }


    activate() {
        if (!this.__active) {
            super.activate();
            const {context, ti1, ti2} = this;

            this.add_change_listeners();


            console.log('activate Demo_UI');

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

