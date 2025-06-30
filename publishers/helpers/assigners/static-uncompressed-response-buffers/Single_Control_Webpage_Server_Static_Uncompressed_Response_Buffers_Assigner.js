

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
        if (is_array(arr_bundled_items)) {
            for (const item of arr_bundled_items) {
                const {type} = item;
                if (item.text) {
                    const buf_identity_response = Buffer.from(item.text, 'utf-8');

                    item.response_buffers = item.response_buffers || {};
                    item.response_buffers.identity = buf_identity_response;
                } else {

                }
            }

        } else {
            console.trace();
            throw 'stop';
        }




    }


}


module.exports = Single_Control_Webpage_Server_Static_Uncompressed_Response_Buffers_Assigner;


