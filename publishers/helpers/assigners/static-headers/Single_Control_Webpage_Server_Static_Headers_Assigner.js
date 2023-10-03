

const Assigner = require('../Assigner');

const {is_array, each} = require('lang-tools');

// And will have some very or less specific assigners for some other things.
//   Like the compressed (text?) response headers.




class Single_Control_Webpage_Server_Static_Headers_Assigner extends Assigner {

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

                item.response_headers = item.response_headers || {};

                let str_content_type;

                if (item.type === 'JavaScript') {
                    str_content_type = 'text/javascript; charset=utf-8';
                } else if (item.type === 'CSS') {
                    str_content_type = 'text/css; charset=utf-8';
                } else if (item.type === 'HTML') {
                    str_content_type = 'text/html; charset=utf-8';
                }

                
                
                // Different headers depending on the returned (ie accepted) content encoding types.

                    // item.response_buffers.identity / gzip / br

                    // go through the item.response_buffers

                each(item.response_buffers, (buf, content_encoding_name) => {

                    //console.log('content_encoding_name', content_encoding_name);

                    const headers_for_content_encoding = item.response_headers[content_encoding_name] = item.response_headers[content_encoding_name] || {};
                    headers_for_content_encoding['Content-Length'] = buf.length;


                    if (str_content_type) {
                        headers_for_content_encoding['Content-Type'] = str_content_type;
                    }

                    if (content_encoding_name === 'identity') {

                    } else {
                        headers_for_content_encoding['Content-Encoding'] = content_encoding_name;


                    }



                });

                // And setting the content types too...


                //console.trace();
                //throw 'stop';
            }

        } else {
            console.trace();
            throw 'stop';
        }




    }


}


module.exports = Single_Control_Webpage_Server_Static_Headers_Assigner;