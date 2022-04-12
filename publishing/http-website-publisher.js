

// A publisher handles HTTP requests.

// This is going to take over some of the responsibilities of the old website resource, which was unfocused code that was
//  doing some of the main / most important parts of serving the website.

const {each, Router} = require('jsgui3-html');
const HTTP_Publisher = require('./http-publisher');
const {obs} = require('fnl');


const Webpage_Bundler = require('./../bundler/webpage-bundler');

// HTTP_Webpage_Publisher could be interesting.
//  The Website Publisher could make use of some of its functionality.


// Handling HTTP / bundling for a specific page could be cool.

// A Webpage Publisher may be simpler and better to work on in the short term.
//  Maybe would not need to be (as) concerned with routing.
//  Could be useful for publishing a SPA of course, kind of a website but as a single page.




// This seems more like the server router these days
//  The main server router seems to pass everything to this - maybe that will change.



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

        let router = new Router();
        Object.defineProperty(this, 'router', {
            get() {
                return router;
            }
        });

        // And this could be an observable too.

        // May get admin pages working on a slightly lower level.
        //  Makes sense as they are for administering other pages (mostly).

        

        const setup_website_publishing = (website) => {
            // put pages into a router here...
            //  however, may need to be on the lookout for other content that needs to be bundled with each page in the site.

            // Now let's try bundling an active JS client.
            // May need to compile / render JSGUI Controls to HTML / full HTML pages.

            



            // And unspecified pages such as admin pages?

            each(website.pages, (page => {
                //console.log('page', page);
                //console.log('page.name', page.name);
                //console.log('page.url', page.url);
                //console.log('page.path', page.path);

                const obs_bundling = Webpage_Bundler.bundle_web_page(page);
                //console.log('obs_bundling', obs_bundling);

                obs_bundling.on('complete', res => {
                    //console.log('obs_bundling res', res);
                    const bundle = res;
                    //console.log('bundle._arr.length', bundle._arr.length);
                    //console.log('Object.keys(bundle)', Object.keys(bundle));

                    if (bundle._arr.length === 1) {
                        // And check it's HTML inside...?

                        const bundled_item = bundle._arr[0];
                        //console.log('bundled_item', bundled_item);

                        if (bundled_item['content-type']) {
                            const ct = bundled_item['content-type'];
                            if (ct === 'text/html') {
                                const http_serve_html = (req, res) => {
                                    res.writeHead(200, {
                                        'Content-Type': 'text/html'
                                    });
                                    res.end(bundled_item.value, 'utf-8');
                                }
                                router.set_route(bundled_item.path, (req, res) => {
                                    http_serve_html(req, res);
                                });
                            } else {
                                throw 'NYI';
                            }

                        } else {
                            throw 'NYI';
                        }

                        // need to create / use the handler for it here.
                        //  will have various http handler functions to reference and use.
                        //  will have details of http handling in other files.

                        // Maybe use an HTML publisher for this? (if it's HTML).
                        //  Or publisher by mime type (lookup).

                        // create http handler function....

                        

                    } else {
                        throw 'NYI';
                    }


                })


                // 'set_route'(str_route, context, fn_handler)

                // More about determining what on the pages needs to be bundled.

                // Use Webpage_Publisher to create bundles for these pages.
                //  eg JavaScript and CSS in particular.

                // Create a bundle for that page.

                // That would be the page publisher that can create bundles for pages.
                // Or the webpage-bundler possibly.
                





                //router.set_route()

            }));

            //throw 'NYI';
        }

        if (website) {
            setup_website_publishing(website);

        }

        // Create a router for the website if it does not already have one.
        //  Or maybe not....

        // Do we already know all of the pages in the website?
        //  Maybe there are dynamic pages.


        // Probably best to come up with a bundle here, or at an early stage.

        // .prepare_bundle?

        // .bundle?
        //   seems clearest that we will be getting / preparing multiple files.

        // Bundling and compiling web content seems like a better thing to get working before serving (or attempting to serve) it.
        // .build?

    }
    handle_http(req, res) {

        // Called from a different context? Doubt we want that.
        // Now called strangely, without context.

        const {website, router} = this;

        //console.log('HTTP_Website_Publisher handle_http');
        //console.log('Object.keys(req)', Object.keys(req));
        //console.log('Object.keys(req.headers)', Object.keys(req.headers));

        const {url, method, statusCode, httpVersion} = req;
        const accept_encoding = req.headers['accept-encoding'];
        const {host} = req.headers;

        console.log('[httpVersion, host, url, statusCode, method, accept_endoding]', [httpVersion, host, url, statusCode, method, accept_encoding]);


        //console.log('router', router);
        //console.log('this.router', this.router);
        //console.log('this', this);
        //console.trace();
        router.process(req, res);

        // can then get the port from after the : in the host.

        //router.set_route(url,)



        // But then the website itself, does it have a router?
        //  It (probably) should.

        // Possibly the publisher has the router for the website.





        // May have bundle already prepared anyway.
        //  Possibly the Website or the Website_Resource could do the bundling / building.
        //  Could even bundle into a ZIP file :)

        //throw 'NYI';
    }
}

module.exports = HTTP_Website_Publisher;