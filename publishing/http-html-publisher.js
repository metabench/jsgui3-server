

// Publishes the HTML format.


const HTTP_Publisher = require('./http-publisher');


class HTTP_HTML_Publisher extends HTTP_Publisher {
    constructor(spec) {
        super(spec);
    }

    // Will publish HTML documents over HTTP, but seems as though it would need to be configured / called with
    //  something to render as well as a rendering engine and parameters.

    // compilation = rendering? not exactly.

    // handle_http()



}

module.exports = HTTP_HTML_Publisher;