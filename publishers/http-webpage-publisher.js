// Want to get it (back) working as a server easily serving simple controls and pages and sites.
// Need to tame some of the more complex layers inside it to get it to easily serve the app.
// Then should work on making / improving some of the specific controls.
// Make the code idiomatic and DRY. The more complex lower and middle level abstractions will help with that.
// Use polymorphism and run-time checks to allow for some more flexibility.





// A publisher handles HTTP requests.

// This is going to take over some of the responsibilities of the old website resource, which was unfocused code that was
//  doing some of the main / most important parts of serving the website.


const HTTP_Publisher = require('./http-publisher');
const {obs} = require('fnl');

// May want / need to more carefully and specifically define APIs.
// It's nice to have classes for specific things like this, but need to make them do what is needed.
//  Maybe get a 'Website' object or control ready to be served.
//  




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

// Possibly a Publisher should be called to provide something over HTTP.
//  So the call is routed to a Webpage object, through the Publisher.
//  Publisher could maintain a cache.
//   Maybe the publisher should read the bundle?
//   Maybe the publisher should do the bundling?
//    Perhaps there should be a bit more coordination of the bundling process, possibly accessed once needed.
//     


// Should include or use various other publishers, such as html or js?


class HTTP_Webpage_Publisher extends HTTP_Publisher {

    // Website generally serves JS from a single address.
    //  Webpage could have its specific JS.
    //  This component may need to handle the JS building.
    //  webpage-bundler within the 'bundler' directory.

    // But not sure if babel or esbuild is better here.
    //   Babel has obviously improved since I had to switch to esbuild years ago.
    //   Being able to use either would help.





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
        setTimeout(() => {
            this.raise('ready');
        }, 0);

    }
    handle_http(req, res) {

        // Is the webpage rendered?
        // Does the webpage require rendering?
        //   Seems like the main question to ask here.

        


        // returning an observable would make sense.
        //  so other parts of the server could observe the request being processed.




        // This may be quite concerned with ensuring the bundle before handling any http requests to provide it or parts of it.
        //  Could even unit test before running deployed code.

        // Could get info on what needs to be bundled from the webpage object itself.
        //  A Webpage objects could have 'requirements', or 'build requirements'.









        //console.log('HTTP_Webpage_Publisher handle_http');
        //console.log('req', req);

        const {webpage} = this;
        //console.log('webpage', webpage);
        //console.log('webpage.render()', webpage.render());
        //console.log('Object.keys (webpage)', Object.keys (webpage));

        //console.log('webpage.content', webpage.content);

        const Ctrl = webpage.content;
        const ctrl = new Ctrl();

        //console.log('webpage.content.render()', webpage.content.render());
        //console.log('webpage.content[0]', webpage.content[0]);

        //res.statusCode = 200;
        //response.setHeader('Content-Type', 'text/html');
        res.writeHead(200, {
            'Content-Type': 'text/html'
          });

        res.end(ctrl.all_html_render());




        // May have bundle already prepared anyway.
        //  Possibly the Website or the Website_Resource could do the bundling / building.
        //  Could even bundle into a ZIP file :)

        //throw 'NYI';
    }
}

module.exports = HTTP_Webpage_Publisher;