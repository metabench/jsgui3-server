const jsgui = require('jsgui3-html');
const {
    Evented_Class
} = jsgui;

const {
    observable
} = require('fnl');

// May need a lot more work for flexibility and auth
//  Maybe can use middleware.

class Function_Publisher {
    constructor(spec) {
        //let fn = this.fn = spec;
        // attach a spec to the function?

        // including a schema or params list for the fn?

        let fn;
        if (typeof spec === 'function') {
            fn = spec;
        } else {
            fn = spec.fn;
            if (spec.schema) {
                this.schema = spec.schema;
            } else {
                this.schema = {};
            }
        }
        this.type = 'function';
        //let fn = spec;
        console.log('Function_Publisher constructor fn', fn);
        console.log('Function_Publisher constructor fn', fn.toString());
        this.handle_http = (req, res) => {
            // need to handle observable http request.
            // Begin sending to that connection...
            // Following SSE would be nice.

            // Should check to see if it supports compression.
            //   Compression function middleware could work fine here.


            let data = fn();
            res.writeHead(200, {
                'Content-Type': 'application/json'//,
                //'Transfer-Encoding': 'chunked',
                //'Trailer': 'Content-MD5'
            });
            res.end(JSON.stringify(data));
            /*
            let obs2_handler = data => {
                //console.log('data', data);
                let s_data = JSON.stringify(data);
                //res.write(s_data + '\n');
                res.write('event: message\ndata:' + s_data + '\n\n');
            }
            obs2.on('next', obs2_handler);
            */
        }
        if (spec.schema) this.schema = spec.schema;
    }
}

module.exports = Function_Publisher;