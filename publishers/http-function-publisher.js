const jsgui = require('jsgui3-html');

const HTTP_Publisher = require('./http-publisher');

const {
    Evented_Class, tf
} = jsgui;

const {
    observable
} = require('fnl');

// Publishing could use a lower level HTTP_Handling.



// May need a lot more work for flexibility and auth
//  Maybe can use middleware.

// Websocket: the server should have some kind of websocket request amalgamator or router.
//  Only one wesocket connection should be open between each client and server.
//  May be worth leaving for the moment.

// Websocket would be below the level of the publishers.
//  Need a unified ws api, but data available separately.
//  It would be a single comm channel unlike multiple HTTP requests.

// Use some more general, lower level HTTP?



class Function_Publisher extends HTTP_Publisher {
    constructor(spec) {
        super(spec);
        //let fn = this.fn = spec;
        // attach a spec to the function?
        // including a schema or params list for the fn?
        let fn;
        if (typeof spec === 'function') {
            fn = spec;
        } else {
            fn = spec.fn;
            this.name = spec.name;
            if (spec.schema) {
                this.schema = spec.schema;
            } else {
                this.schema = {};
            }
        }
        this.type = 'function';
        //let fn = spec;
        //console.log('Function_Publisher constructor fn', fn);
        //console.log('Function_Publisher constructor fn', fn.toString());
        // But will need to route to the function publisher.

        this.handle_http = (req, res) => {
            // need to handle observable http request.
            // Begin sending to that connection...
            // Following SSE would be nice.

            // Should check to see if it supports compression.
            //   Compression function middleware could work fine here.

            // Will need to call the function with params.
            //  Read params from content body?

            const {method, headers} = req;

            //console.log('Function Publisher handle_http method', method);
            //console.log('headers', headers);

            // Need to get the incoming parameters.
            // Need to use formidable or whatever else...?

            // Need to wait for the whole of the request to complete.
            //  Don't think it will be multipart forms.

            const content_length = headers['content-length'];
            const content_type = headers['content-type'];
            // could be the mime type and the charset.

            //  then need to wait for the whole thing.
            //   think the req is a Readable_Stream.

            const chunks = [];

            req.on('data', data => {
                chunks.push(data);
            });

            req.on('end', () => {
                const buf_input = Buffer.concat(chunks);
                //console.log('buf_input', buf_input);

                // then interpret it according to the content_type
                let obj_input;
                //console.log('content_type', content_type);
                if (!content_type) {
                    console.log('buf_input.length', buf_input.length);
                    if (buf_input.length === 0) {

                    } else {
                        console.trace();
                        throw 'NYI';
                    }
                } else {
                    if (content_type.startsWith('text/plain')) {
                    obj_input = buf_input.toString();

                } else {

                    if (content_type === 'application/json') {
                        obj_input = JSON.parse(buf_input.toString());
                    } else {
                        console.trace();
                        throw 'NYI';
                    }
                    // decode / parse JSON.
                }
                }

                


                const output_all = (call_res) => {
                    // But not a buffer, string???
                    // res is response.
                    const tcr = tf(call_res);

                    console.log('tcr', tcr);

                    res.writeHead(200, {
                        'Content-Type': 'application/json'//,
                        //'Transfer-Encoding': 'chunked',
                        //'Trailer': 'Content-MD5'
                    });
                    res.end(JSON.stringify(call_res));
                }


                // And the function to call may be async.
                //  Can test to see if we get a promise (or observable) back from it.

                const fn_res = fn(obj_input);
                const tfr = tf(fn_res);
                //console.log('fn_res', fn_res);
                
                //console.log('tfr', tfr);

                if (tfr === 'p') {
                    // promise
                    console.log('need to await promise resolution');

                    fn_res.then(call_res => {
                        console.log('fn_res then happened, call_res', call_res);
                        output_all(call_res);

                    }, err => {

                    });


                } else if (tfr === 's') {
                    // Just write it as a string for the moment I think?
                    //   Or always encode as JSON?

                    // text/plain;charset=UTF-8

                    res.writeHead(200, {
                        'Content-Type': 'text/plain;charset=UTF-8'//,
                        //'Transfer-Encoding': 'chunked',
                        //'Trailer': 'Content-MD5'
                    });
                    res.end(fn_res);


                } else {

                    console.trace();
                    throw 'NYI';
                }





                // turn it to string?
                //  check its mime type?

                // however, likely we should have been told its application/json if that's the case.
                //  likely will be the case for function calls.

                //  the jsgui http post call....
                //   should set the mime type where possible to intelligently do so.




                // may get some polymorphism out of the mime types.
                //  text/plain;charset=UTF-8
                //    turn it to a string.



            });









            /*

            

            
            */



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