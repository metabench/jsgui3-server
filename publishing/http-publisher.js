const { Publisher } = require('jsgui3-html');

// Could have this as the general purpose HTTP publishing component / system / part of the system.



// Some kind of mapping between what the response asks for and the functions to get the results along with the parameters to call them with.



class HTTP_Publisher extends Publisher {
    constructor(spec) {
        super(spec)

        /*
        this.handle_http = (req, res) => {
            
            

        }
        */
    }
    handle_http(req, res) {
        console.trace();
        throw 'HTTP_Publisher: Use handle_http of subclass.';
        // Determine input content type (if any)
        // Headers, auth
        //  Then get more of a programmatic model of what it requires to be done.
        // 


        // Use the app router to determine where the request is to go.

        const do_response = () => {
            res.writeHead(200, {
                //'Content-Type': 'text/event-stream',
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

module.exports = HTTP_Publisher;