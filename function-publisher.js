const jsgui = require('jsgui3-html');
const {
    Evented_Class
} = jsgui;

const {
    observable
} = require('fnl');

class Function_Publisher {
    constructor(spec) {

        //let fn = this.fn = spec;
        let fn = spec;
        

        this.handle_http = (req, res) => {

            // need to handle observable http request.

            // Begin sending to that connection...

            // Following SSE would be nice.

            let data = fn();

            res.writeHead(200, {
                'Content-Type': 'text/json'//,
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
    }
}

module.exports = Function_Publisher;