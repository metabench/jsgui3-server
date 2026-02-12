
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

        const safe_response_buffers = response_buffers || {};
        const safe_response_headers = response_headers || {};

        const identity_buffer = safe_response_buffers.identity || Buffer.from(text || '', 'utf8');
        const has_br = safe_response_buffers.br;
        const has_gzip = safe_response_buffers.gzip;
        const use_br = supported_encodings.br === true && has_br;
        const use_gzip = supported_encodings.gzip === true && has_gzip;

        let selected_encoding = 'identity';
        let selected_buffer = identity_buffer;
        if (use_br) {
            selected_encoding = 'br';
            selected_buffer = safe_response_buffers.br;
        } else if (use_gzip) {
            selected_encoding = 'gzip';
            selected_buffer = safe_response_buffers.gzip;
        }

        if (!Buffer.isBuffer(selected_buffer)) {
            selected_buffer = Buffer.from(String(selected_buffer || ''), 'utf8');
        }

        const selected_headers = safe_response_headers[selected_encoding] || safe_response_headers.identity || {};

        //console.log('supported_encodings', supported_encodings);

        const has_header = (header_name) => {
            if (typeof res.hasHeader === 'function') {
                return res.hasHeader(header_name);
            }
            if (typeof res.getHeader === 'function') {
                return typeof res.getHeader(header_name) !== 'undefined';
            }
            return false;
        };

        if (typeof res.setHeader === 'function') {
            for (const key in selected_headers) {
                const value = selected_headers[key];
                res.setHeader(key, value);
            }

            if (!has_header('Content-Type')) {
                if (extension === 'css') res.setHeader('Content-Type', 'text/css; charset=utf-8');
                if (extension === 'js') res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                if (extension === 'html') res.setHeader('Content-Type', 'text/html; charset=utf-8');
            }
            if (!has_header('Content-Length')) {
                res.setHeader('Content-Length', selected_buffer.length);
            }
        }

        // Then write the (hopefully compressed) response bodies...

        if (typeof res.write === 'function') {
            res.write(selected_buffer);
        }

        if (typeof res.end === 'function') {
            res.end();
        }

        //console.trace();
        //throw 'NYI';

    }

}

module.exports = Static_Route_HTTP_Responder;
