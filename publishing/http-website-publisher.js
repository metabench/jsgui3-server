

// A publisher handles HTTP requests.

// This is going to take over some of the responsibilities of the old website resource, which was unfocused code that was
//  doing some of the main / most important parts of serving the website.


const HTTP_Publisher = require('./http-publisher');
const {obs} = require('fnl');

// HTTP_Webpage_Publisher could be interesting.
//  The Website Publisher could make use of some of its functionality.


// Handling HTTP / bundling for a specific page could be cool.

// A Webpage Publisher may be simpler and better to work on in the short term.
//  Maybe would not need to be (as) concerned with routing.
//  Could be useful for publishing a SPA of course, kind of a website but as a single page.







class HTTP_Website_Publisher extends HTTP_Publisher {

    // Website generally serves JS from a single address.
    //  Webpage could have its specific JS.

    constructor(spec = {}) {
        super(spec)

        // A website property.

        let website;
        if (spec.website) website = spec.website;
        Object.defineProperty(this, 'website', {
            get() {
            return website;
            }
        });

        // Probably best to come up with a bundle here, or at an early stage.

        // .prepare_bundle?

        // .bundle?
        //   seems clearest that we will be getting / preparing multiple files.

        // Bundling and compiling web content seems like a better thing to get working before serving (or attempting to serve) it.
        // .build?

    }
    handle_http(req, res) {
        console.log('HTTP_Website_Publisher handle_http');
        console.log('req', req);


        // May have bundle already prepared anyway.
        //  Possibly the Website or the Website_Resource could do the bundling / building.
        //  Could even bundle into a ZIP file :)

        throw 'NYI';
    }
}

module.exports = HTTP_Website_Publisher;