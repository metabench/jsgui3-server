
const HTTP_Responder = require('../HTTP_Responder');

// Looks like some Router bug fix is needed...?
//  Need to remove the first '/' from the route???
//  Or fix / modify the jsgui3-html Router so it does that?

// May need to see how it's being put into the router.
//   Perhaps don't want to use a tree in some / many instances.

// Maybe fixing and updating the routing tree is worthwhile at this stage.





class Static_Route_HTTP_Responder extends HTTP_Responder {
    constructor(spec) {
        super(spec);


        //console.log('Static_Route_HTTP_Responder spec:', spec);

        //console.trace();
        //throw 'NYI';

        // type, 

        // Give it the bundle object as spec...?


    }
    handle_http(req, res) {
        const r_headers = req.headers;
        const accept_encoding = r_headers['accept-encoding'] || '';

        // Need to call it with the correct context.
        //   Seems like jsgui3-html Router and Routing_Tree need some more fixes.

        const {type, extension, text, route, response_buffers, response_headers} = this;


        //console.log('accept_encoding', accept_encoding);

        //console.log('typeof accept_encoding', typeof accept_encoding);



        // See about 'gzip'.
        //   Not sure why br does not show up as normal.

        const supported_encodings = {};

        if (typeof accept_encoding === 'string' && accept_encoding.includes('gzip')) supported_encodings.gzip = true;

        if (typeof accept_encoding === 'string' && accept_encoding.includes('br')) supported_encodings.br = true;

        //console.log('supported_encodings', supported_encodings);

        if (supported_encodings.br === true) {
            
            for (const key in response_headers.br) {
                const value = response_headers.br[key];
                //console.log('[key, value]', [key, value]);
                res.setHeader(key, value);
            }

        } else if (supported_encodings.gzip === true) {
            //console.log('should write headers for gzipped buffer...');

            for (const key in response_headers.gzip) {
                const value = response_headers.gzip[key];
                //console.log('[key, value]', [key, value]);
                res.setHeader(key, value);
            }
        } else {
            for (const key in response_headers.identity) {
                const value = response_headers.identity[key];
                //console.log('[key, value]', [key, value]);
                res.setHeader(key, value);
            }
        }

        // Then write the (hopefully compressed) response bodies...

        if (supported_encodings.br === true) {

            res.write(response_buffers.br);
        } else if (supported_encodings.gzip === true) {
            //console.log('should write gzipped buffer...');
            res.write(response_buffers.gzip);
        } else {
            res.write(response_buffers.identity);
        }

        res.end();

        //console.trace();
        //throw 'NYI';

    }

}

module.exports = Static_Route_HTTP_Responder;
