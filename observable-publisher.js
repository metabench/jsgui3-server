const jsgui = require('jsgui3-html');
const {
    Evented_Class
} = jsgui;

const {
    observable
} = require('fnl');

class Observable_Publisher {
    constructor(spec) {
        let obs, schema;
        // needs to hook into the server though...
        if (spec.next && spec.complete && spec.error) {
            obs = spec;
        } else {

            //let {schema} = spec;
            obs = spec.obs;
            schema = spec.schema;

            //console.trace();
            //throw 'NYI';
        }
        // need to be able to process (http) requests.
        // reobserve that observable to prevent too many events being attached.

        // reobserve
        //  code here could be written as resobserve function.
        //   or just obs on an existing obs?

        let obs2 = observable((next, complete, error) => {
            obs.on('next', data => {
                next(data);
            })
            return [];
        })
        this.type = 'observable';

        /*

        => Request
        GET /stream HTTP/1.1 
        Host: example.com
        Accept: text/event-stream

        <= Response
        HTTP/1.1 200 OK 
        Connection: keep-alive
        Content-Type: text/event-stream
        Transfer-Encoding: chunked

        retry: 15000 

        data: First message is a simple string. 

        data: {"message": "JSON payload"} 

        event: foo 
        data: Message of type "foo"

        id: 42 
        event: bar
        data: Multi-line message of
        data: type "bar" and id "42"

        id: 43 
        data: Last message, id "43"
        
1
2
3
4
event: message\n
data: this is an important message\n
data: that has two lines\n
\n

        */
        this.handle_http = (req, res) => {
            // need to handle observable http request.
            // Begin sending to that connection...
            // Following SSE would be nice.
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Transfer-Encoding': 'chunked',
                //'Trailer': 'Content-MD5'
            });
            res.write('OK\n');
            let obs2_handler = data => {
                //console.log('data', data);
                let s_data = JSON.stringify(data);
                //res.write(s_data + '\n');
                res.write('event: message\ndata:' + s_data + '\n\n');
            }
            obs2.on('next', obs2_handler);
        }
    }
}

module.exports = Observable_Publisher;