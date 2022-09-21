const jsgui = require('jsgui3-client'); // and will replace this with jsgui-client, I presume.
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;

/*
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
            
            //console.log('dragable mixin applied to square');
            this.dragable = true;
            //console.log('this.dragable = true;');

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
*/

// Relies on extracting CSS from JS files.

const {press_events} = jsgui.mixins;

const Grid = controls.Grid;

class Demo_UI extends Control {
    constructor(spec) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const {context} = this;
        this.add_class('demo-ui');

        const compose = () => {

            // Would be nice to have a grid / other control that expands to fit available space.
            //  Like height and width 100%? May be a bit different in css implementation.


            // Then indicating how much space it's supposed to take...?
            //  Could it automatically size itself depending on space available?

            // Grid should use the 'display' mixin by default?
            //  display_modes may be a better name after all.
            //   

            // Have Grid and other controls able to adaptively choose / grow to a size.
            //  Could that be css flexbox though?

            // cell size being content item size.
            // 

            const grid = new Grid({
                context: context,
                grid_size: [32, 32],
                cell_size: [10, 10]
            });

            //grid.size = [320, 200];

            this.add(grid);
            
            this._ctrl_fields = this._ctrl_fields || {};
            this._ctrl_fields.grid = grid;

            // cell_size property perhaps?
            // cell_size auto?

            // Want basic usage of .display mixin...
            //  display_mode may well be the better name....
            //  display.mode makes sense though!

            // mx display makes a lot of sense for higher level display properties and functionality.
            //  or even .ui rather than display?

            // .ui mixin perhaps?
            //  easy naming.
            // .ui and .data
            //  so a control represents actual data (model in mvc)
            // .view perhaps?
            // .model even?

            // Could move towards some MVC naming fundamentals.
            //  It would be as a higher level then some core things like CSS.
            //  .data = .model probably.

            // the .mvc or .mv 'overhaul' mixin should come.
            //  .model could / should refer to a part of a larger model.
            //    the data being represented by the control.

            // view.editable property could be standard.
            //  as in user_editable possibly.

            // Dividing into .model and .view could make sense.
            //  view.dom.attributes for example
            //   of course there can be models of the view.

            // ctrl.model would (always?) hold and represent the core data.
            //  class Model_Data_Access
            //    full_model
            //    access_path (string???)
            //    part of model (model for that control)

            // model = {text: 'hello'}
            //  then the view we tell it to display the text (maybe it knows to do that, or its one very simple setting.)

            // Even make a Control_View component?
            //   That seemed to be what the Control was before?
            //   Being more explicit about referencing the View may help.
            //     Especially with different view / display modes.

            // Also, keeping control data model logic while changing view logic...?
            //   Keeping code separate should help with upgradability.

            // .model.data_type for example.
            //   such as date.
            //    or some types / structs which have definitions.

            // Then when making a View, we can specify that it only works for a set data_type
            //  Then different implementations could compete / be compared.

            // Editors for specific data types, only supposed to or designed to work to edit a limited range of data.
            //   Enforced programatically.
            //   Have a schema of the data or something like it.
            //     Then with the data defined, an editor could be put together programatically automatically.
            //       May be a bit of a rudimentary / unflexible one but may be useful.

            // UI components for viewing and editing data
            //   Could / should start with some really simple types of data
            //   Need data type definitions within the code so that the editiors know what to do.
            //    Could have them within JSON of course.

            // Max number, min number, integers only, etc...

            // so .view rather than .display probably...
            //  .controller even could refer to various algorithms / hooks that get used when connecting the model and the view.
            //    may be possible to use the control without accessing control.controller?
            //      or the control itself is the controller?
            //      .controller may make sense for accessing some properties.

            // const [mvc] = ctrl.mvc for example.
            //  

            // Doing this more gradually...?
            //  Where properties may have two means of accessing them?
            //    or move some lower level view things into .view perhaps.


            // making .view as a mixin perhaps...?
            //  could make some of the functions more universally callable perhaps?
            //   not so sure about performance when used so widely. Could still make good use of prototypes somehow though.

            


            



















            // size: auto for various controls?
            //  a 'size' mixin? Autosize mixin?

            // resizable
            // user-resizable

            // probably want mixins to represent a fair few behavious that could apply reasonably to different controls.
            // making multi-mode rendering more of a standard too.





            // Then if the grid is made flexbox...?
            //  A way to make it fill the available space from CSS.

            // Maybe a mixin to handle more sizing and positioning options?
            //  The grid itself autofilling the space may help.
            //   Then it can calculate what size to display / render the cells at.






        }
        if (!spec.el) {
            compose();
        }
    }
    activate() {
        if (!this.__active) {
            super.activate();
            const {context, grid} = this;

            console.log('activate Demo_UI');
            console.log('grid', grid);

            // .dimensions?
            // Not available yet...?
            //  A clearer post-activate time would be best.
            //   .do_once_active possibly?


            console.log('grid.grid_size', grid.grid_size);
            grid.refresh_size();

            press_events(grid);

            // the grid press start should contain the cell.
            //  that is the specific kind of API improvement that helps the grid with customised specific events.

            // This is having trouble on iOS with touch events.

            // Better ways to check which cell is being pressed?
            //  Seems like we don't get the new cell upon the touch move event.

            // Pressing and moving to a different ctrl / cell not working on iOS mobile safari.

            // Maybe improve grid painting for iOS?
            //  Maybe improve the 'move on grid' event handlings?

            // Maybe press events isn't the best way?
            //  Or need better handling of iOS within press events even?
            //   Determining grid square by the coordinates would be possible if there is a rendering model.
            //   Maybe further work within mixins.
            //   Maybe within grid / grid mixins.

            // More work within Grid to better enable cell retrieval?
            //  And then specific work on grid press events?
            


            const setup_grid_painting = () => {

                // ctrl_target maybe is not stable accross all devices and browsers.
                //  Could be better to get some lower level things working right....

                let paint_color = '#000000';
                grid.on('press-start', e => {
                    //console.log('grid press-start ', e);
                    const {ctrl_target} = e;
                    const [x, y] = [ctrl_target.x, ctrl_target.y];

                    // grid.get_cell_at_px_coords([xpx, ypx]);
                    // grid.get_cell_at_pos([x, y]);

                    //console.log('[x, y]', [x, y]);

                    // the colour of the cell there at start determines colour of paint brush?
                    //  will be best to incorporate painting / grid painting code into the mixins?
                    //  probably only a few lines of code for the right API.

                    if (ctrl_target.dom.attributes.style['background-color'] === '#000000') {
                        paint_color = '#FFFFFF';
                    } else {
                        paint_color = '#000000';
                    }
                    ctrl_target.dom.attributes.style['background-color'] = paint_color;

                    e.preventDefault();
                });

                // and that would be a press-grid-move? press-gridcell-move?
                //  this is just a place to set up and test different behaviours for grid ui.
                //  may have things like area fills, or select area.

                let lastx, lasty;
                grid.on('press-move', e => {

                    // Not getting the expeced ctrl_target that is right under the movement touch event on iOS.
                    //  Could we get the specific cell by using its display coords to determine which cell it is over?

                    // Gets the right pixel coords from the event for this.


                    console.log('grid press-move ', e);

                    // Not working right on iOS. Not detecting which cell is directly underneith.
                    const {ctrl_target} = e;
                    //const {ctrl} = e;
                    const [x, y] = [ctrl_target.x, ctrl_target.y];

                    if (x !== lastx || y !== lasty) {
                        grid.raise('press-cell-move', e);
                    }

                    //console.log('[x, y]', [x, y]);
                    lastx = x;
                    lasty = y;

                    //e.preventDefault();
                });

                grid.on('press-cell-move', e => {
                    const {ctrl_target} = e;
                    const [x, y] = [ctrl_target.x, ctrl_target.y];
                    //console.log('press-cell-move [x, y]', [x, y]);
                    ctrl_target.dom.attributes.style['background-color'] = paint_color;
                });
            }
            setup_grid_painting();

            

            // 'press-move'


            // listen for the context events regarding frames, changes, resizing.

            context.on('window-resize', e_resize => {
                console.log('window-resize', e_resize);
            });

            // A delegated click or other event handler may work nicely (for the cells).

            // Could use press events to deal with events more smoothly?
            // A grid-events mixin?
            //  Want to make high quality and specific code that is outside of the grid js component.
            //  More swappable, composable, and upgradable components.

            // More functionality within the mixins makes sense.
            //  Mixins as interfaces too.

            // grid.enable(Drag_Box)
            //  or similar.
            // grid.mx_grid_press_ui possibly.
            //  details of ui handling behavious moving out of the controls themselves.
            //  more general within the mixins.

            // grid.on('drag-over') or similar.
            //  specialised events within the appropriate mixins.
            //   could try them here first though?

            // a different box-area-select mixin? or just a bit different when on a grid...?
            //  may need to repeat code a little, but code will be simple at the app level at least.








            grid.each_cell(cell => {

                /*
                cell.on('click', e_click => {
                    //console.log('e_click', e_click);
                    //console.log('cell', cell);
                    const xy = [cell.x, cell.y];
                    //const xy = [cell._.x, cell._.y];
                    console.log('xy', xy);

                    if (cell.dom.attributes.style['background-color'] === '#000000') {
                        cell.dom.attributes.style['background-color'] = '#FFFFFF';
                    } else {
                        cell.dom.attributes.style['background-color'] = '#000000';
                    }

                    
                })
                */
            })

        }
    }
}

// Include this in bundling.
//  Want CSS bundling so that styles are read out from the JS document and compiled to a stylesheet.

//controls.Demo_UI = Demo_UI;
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

// then if running on the client...?



//controls.Square_Box = Square_Box;
// could export jsgui with the updated controls....
//  so that they are in the correct Page Context.?


controls.Demo_UI = Demo_UI;
//controls.Square_Box = Square_Box;

module.exports = jsgui;

/*
module.exports = {
    Square_Box: Square_Box,
    Demo_UI: Demo_UI
}
*/

// Then if window...?

// Need to add the Square_Box control to the context or original map of controls...

