

const Assigner = require('../Assigner');

const {is_array} = require('lang-tools');

// And will have some very or less specific assigners for some other things.
//   Like the compressed (text?) response headers.




class Single_Control_Webpage_Server_Static_Routes_Assigner extends Assigner {

    constructor(spec = {}) {
        super(spec);
    }

    // assign to bundle....
    //  or array would be better.

    // assign to (bundle) items in array.

    async assign(arr_bundled_items) {
        // go through them....

        // Maybe check that the correct items are in the bundle.

        // Perhaps check for 1 of each js, css, html
        //   And could use a specific other class to assign these.

        //   Should be OK to make classes for really specific things.
        //     At this part of the system / API, it's not necessary / important to limit complexity in that way.

        // The goal is to provide a very simple high level interface. Powerful too.

        // Could assign a static_route property to the items in the bundles.





        if (is_array(arr_bundled_items)) {

            for (const item of arr_bundled_items) {
                //console.log('item', item);

                

                const {type} = item;

                // Just very simple for the moment.
                //  Maybe will read it from the Ctrl?
                //  Better to have some kind of Standard_Resource_Path_Assignment_System

                if (type === 'JavaScript') {
                    item.route = '/js/js.js';



                } else if (type === 'CSS') {
                    item.route = '/css/css.css';



                } else if (type === 'HTML') {
                    item.route = '/';

                } else {
                    console.trace();
                    throw 'NYI - type: ' + type; 
                }

                //console.trace();
                //throw 'stop';
            }

        } else {
            console.trace();
            throw 'stop';
        }




    }


}


module.exports = Single_Control_Webpage_Server_Static_Routes_Assigner;