

// A publisher handles HTTP requests.

// This is going to take over some of the responsibilities of the old website resource, which was unfocused code that was
//  doing some of the main / most important parts of serving the website.


const HTTP_Publisher = require('./http-publisher');
const {obs} = require('fnl');

// Named observables?
/*

obs((next, complete, error) => {

*/


// HTTP_Webpage_Publisher could be interesting.
//  The Website Publisher could make use of some of its functionality.

// Handling HTTP / bundling for a specific page could be cool.

// A Webpage Publisher may be simpler and better to work on in the short term.
//  Maybe would not need to be (as) concerned with routing.
//  Could be useful for publishing a SPA of course, kind of a website but as a single page.

// Should have more concerning bundling / compilation.


// There could be 'bundle' functionality for the webpage.

// The webpage itself could know what client js it needs to use.

// Seems like bundling a specified webpage earlier on in the process makes sense.

// And a Bundler as well?
//  Perhaps HTTP_Webpage_Bundler would be an important class to have here.
//   Considering how it could be interchangable from the publisher if it's a different class.



class HTTP_Webpage_Publisher extends HTTP_Publisher {

    // Website generally serves JS from a single address.
    //  Webpage could have its specific JS.

    constructor(spec = {}) {
        super(spec)

        // A website property.

        let webpage;
        if (spec.webpage) webpage = spec.webpage;
        Object.defineProperty(this, 'webpage', {
            get() {
                return webpage;
            }
        });

        // Probably best to come up with a bundle here, or at an early stage.

        // .prepare_bundle?

        // .prepare_bundle would be a good function to have here.



        // .bundle?
        //   seems clearest that we will be getting / preparing multiple files.

        // Bundling and compiling web content seems like a better thing to get working before serving (or attempting to serve) it.
        // .build?

    }
    handle_http(req, res) {


        // returning an observable would make sense.
        //  so other parts of the server could observe the request being processed.




        // This may be quite concerned with ensuring the bundle before handling any http requests to provide it or parts of it.
        //  Could even unit test before running deployed code.

        // Could get info on what needs to be bundled from the webpage object itself.
        //  A Webpage objects could have 'requirements', or 'build requirements'.









        console.log('HTTP_Webpage_Publisher handle_http');
        //console.log('req', req);


        // May have bundle already prepared anyway.
        //  Possibly the Website or the Website_Resource could do the bundling / building.
        //  Could even bundle into a ZIP file :)

        throw 'NYI';
    }
}

module.exports = HTTP_Webpage_Publisher;