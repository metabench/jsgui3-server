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


            // listen for the context events regarding frames, changes, resizing.

            context.on('window-resize', e_resize => {
                console.log('window-resize', e_resize);
            });

            // A delegated click or other event handler may work nicely (for the cells).

            grid.each_cell(cell => {
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

