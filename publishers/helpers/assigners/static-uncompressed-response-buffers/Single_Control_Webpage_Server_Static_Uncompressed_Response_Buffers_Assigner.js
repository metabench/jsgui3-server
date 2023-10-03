

// Making such specific classes with such long names seems kind of silly, but will help to keep the higher level code
//   both explicit and easy to follow.

// These classes will do specific things, to specific things (in specific ways)

// Basically middleware that the app dev should not need to pay much attention to usually.




// And likely will have some other class (system), maybe assigners, to set the routes on the server / server router.
//   Or within the website resource???

// So everything (main) that the server does will be done using various interchangable classes.
//   Some classes will cover some very specific use cases.




const Assigner = require('../Assigner');

const {is_array} = require('lang-tools');

// And will have some very or less specific assigners for some other things.
//   Like the compressed (text?) response headers.




class Single_Control_Webpage_Server_Static_Uncompressed_Response_Buffers_Assigner extends Assigner {

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

                // And need to create the uncompressed response buffer.

                // // response_buffers.identity I think....

                if (item.text) {
                    const buf_identity_response = Buffer.from(item.text, 'utf-8');

                    item.response_buffers = item.response_buffers || {};
                    item.response_buffers.identity = buf_identity_response;
                } else {

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


module.exports = Single_Control_Webpage_Server_Static_Uncompressed_Response_Buffers_Assigner;


