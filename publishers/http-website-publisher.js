// A publisher handles HTTP requests.

// This is going to take over some of the responsibilities of the old website resource, which was unfocused code that was
//  doing some of the main / most important parts of serving the website.

const {each, Router, tof} = require('jsgui3-html');
const HTTP_Publisher = require('./http-publisher');
const {obs} = require('fnl');

// The Webpage bundler should be able to come up with the compiled JS and CSS, maybe even a favicon.

// HTTP_Webpageorsite_Publisher



const Website = require('jsgui3-website');

const Webpage_Bundler = require('../resources/processors/bundlers/webpage-bundler');
const Bundle = require('../resources/processors/bundlers/bundle');

// Now it's the very basics of a website publisher. Quite flexible but could do with more.
//  Better integration with bundler
//  Rendering webpages that are dynamic and therefore not bundled (eg user specific content).
//   Though the js could be bundled. Maybe some of the controls could be bundled? Or semi-bundled?

// HTTP_Webpage_Publisher could be interesting.
//  The Website Publisher could make use of some of its functionality.


// Handling HTTP / bundling for a specific page could be cool.

// A Webpage Publisher may be simpler and better to work on in the short term.
//  Maybe would not need to be (as) concerned with routing.
//  Could be useful for publishing a SPA of course, kind of a website but as a single page.

// This seems more like the server router these days
//  The main server router seems to pass everything to this - maybe that will change.

// Maybe give it some kind of Website_Server????

// Have the Website_Server use the Website_Publisher????

// Need to somewhat separate concerns.

// Publisher here could be simple in terms of bundling, and then giving the paths to the router.
//   And could have really simple code implementation of doing just that.

// This basically can be simple....
//   But make the classes' structures more complicated where necessary to accommodate.


// Could be just a few lines of logic probably, at least the simplest core implementation.

// Think the server or the website already has a router, so have the website resource's router do the routing.
//   Maybe upgrade the routers to handle premade (compressed) responses.

// Maybe better to bundle and publish resources.
// resource-processors in its own dir?
//   as in it's not actually part of resources?




// Need to basically make this do very little.

// Publish (website, server_router)


// Or publish it only under some URLs / domains....?






// Probably is worth by default having it use the HTTP_Website_Publisher with really simple server setups.


// Extend HTTP_Web_Item_Publisher   HTTP_Web_Page_Or_Site_Publisher  (synonym) ????

// Share functionality between webpage and website where useful.


const HTTP_Webpageorsite_Publisher = require('./http-webpageorsite-publisher');



class HTTP_Website_Publisher extends HTTP_Webpageorsite_Publisher {
    // Website generally serves JS from a single address.
    //  Webpage could have its specific JS.


    // Maybe the Publisher should not have its own router?
    //  But it provides items with paths from bundles it gets made to the website server's router.

    // Def looks like its worth rearchitecturing this to provide more consistency on the lower level, and a 'just works' simplicity
    //   on the higher level.

    // Plus some base classes that themselves don't do all that much, and then subclasses of them that do things in specific
    //  ways, so that implementations of specific parts are interchangable.





    constructor(spec = {}) {
        super(spec)
        // A website property.

        //console.trace();
        //throw 'stop';

        // spec webpage????

        let website;
        if (spec.website) {
            if (spec.website instanceof Website) {
                website = spec.website;
            } else {
                console.trace();
                throw 'Expected spec.website to be of type "jsgui3-website" class instance';
            }
        } 
        Object.defineProperty(this, 'website', {
            get() {
                return website;
            }
        });


        // A get_ready function for every level of the class for web publishing may help.





        // The publisher should not have a router (for the moment???)
        //   It should however determine routes, and provide them to the router.

        // Creating a Published_Website object perhaps.


        /*

        let router = new Router();
        Object.defineProperty(this, 'router', {
            get() {
                return router;
            }
        });

        */






        // Disk path client js being a property of the website itself?
        //   Critical overall functionality, dont want to remove it from here for the moment. See if not critical here.

        /*

        let disk_path_client_js;
        if (spec.disk_path_client_js) disk_path_client_js = spec.disk_path_client_js;
        Object.defineProperty(this, 'disk_path_client_js', {
            get() {
                return disk_path_client_js;
            }
        });

        */



        // And this could be an observable too.
        // May get admin pages working on a slightly lower level.
        //  Makes sense as they are for administering other pages (mostly).


        //console.log('http-website-publisher disk_path_client_js', disk_path_client_js);



        //throw 'stop';
        // This could be an observable that acts sequentially and async.

        // See about moving specific complexity elsewhere....
        //  See if what the website publisher does can be summed up expressively in JS.

        // Uses a builder / packager on the website.
        // Keeps track of a little bit of data on what's been published (could have an observable status event)
        // Tells the server to publish it (on specified URL / Route - specified where? Defaults? Interchangable systems of default URLS paths?)


        // But make this async (obs as well?)
        // Have a sequence of events that takes place.
        // Use the correct specific classes to do the correct specific things.
        //   Then make sure the implementations are correct.








        // Will probably insert new bundling code here - but refer to advanced classes that handle the details.

        /*
        console.log('\n\nskipping __old__setup_website_publishing');
        console.trace();
        console.log('\n\n');
        */


        const __old__setup_website_publishing = (website) => {


            // Split up the bundling and response serving responsibilities.
            //  Should put it through the router (more as normal) when published.
            //   Maybe I'll need another 100 classes for this to work, maybe not, but should make everything explicit, but also concise,
            //   and then work on abbreviations and (unambiguous) shorthands.
            // Or even settings for what the (default) shorthands do.


            // Bundle it - Get some package(bundle) of pages.

            // Website_Bundle perhaps...?
            //  All the static assets put together.
            //    Pages that don't have dynamic content are pre-rendered and compressed.



            

            // 1)   Bundle
            // 2)   Publish that bundle
            // 2a)    Provide the router with all the necessary URLs and (compressed) pregenerated responses from that bundle.


            // Website_Bundle_Publisher perhaps....?

            // Def seems worth it to refactor it into still more complicated classes, but to aim for really simple and concise code within
            //  those classes, at least when it comes to a simple and intuitive API that represents what is going on.

















            //console.log('website', website);
            //console.log('website.pages', website.pages);
            //console.log('website.pages.length()', website.pages.length());
            //throw 'stop';

            // This is currently really inflexible for a website with multiple pages.
            //  Pages could be given names.
            //  Don't want to be too prescriptive here, but do want to get this bundling and working.

            // Do want to get it right in theory and in structure for a variety of possibilities.

            // Should pay more attention to setting up the headers on the responses.







            // should the website have a 'main' or 'front' or 'first' page, with it having its HTML rendered?
            return obs((next, complete, error) => {
                (async () => {
                    // not iterating properly through the collection without ._arr.
                    // May make more sense to have 2 versions,
                    //  for 1 page
                    //  for 2+ pages
                    const opts_bundling = {};
                    if (disk_path_client_js) opts_bundling.disk_path_client_js = disk_path_client_js;

                    if (website.pages._arr.length === 0) {
                        throw 'NYI';
                    } else if (website.pages._arr.length === 1) {
                        const page = website.pages._arr[0];
                        const obs_bundling = Webpage_Bundler.bundle_web_page(page, opts_bundling);
                        //console.log('doing bundling');
                        //console.log('obs_bundling', obs_bundling);
                        //throw 'stop';
                        obs_bundling.on('complete', obs_bundling_res => {
                            // Should be a Bundle rather than a Buffer?
                            console.log('obs_bundling res', obs_bundling_res);
                            // Need to have the HTML rendering and HTTP serving here as well.
                            //const page_bundle = res;
                            if (obs_bundling_res instanceof Bundle) {
                                //console.log('1) obs_bundling_res._arr.length', obs_bundling_res._arr.length);
                                // then need to handle the page construction and routing of http requests.
                                console.log('obs_bundling_res._arr.length', obs_bundling_res._arr.length);
                                each(obs_bundling_res, item => {
                                    //console.log('item', item);
                                    //console.log('item.path', item.path, item['content-type']);
                                    if (item['content-type']) {
                                        const ct = item['content-type'];
                                        if (ct === 'text/html') {
                                            const http_serve_html = (req, res) => {
                                                res.writeHead(200, {
                                                    'Content-Type': 'text/html'
                                                });
                                                res.end(item.value, 'utf-8');
                                            }
                                            router.set_route(item.path, (req, res) => {
                                                http_serve_html(req, res);
                                            });
                                        } else {
                                            const http_serve_any = (req, res) => {
                                                res.writeHead(200, {
                                                    'Content-Type': ct
                                                });
                                                res.end(item.value, 'utf-8');
                                            }
                                            router.set_route(item.path, (req, res) => {
                                                http_serve_any(req, res);
                                            });
                                            //throw 'NYI';
                                        }
            
                                    } else {
                                        throw 'NYI';
                                    }
                                })

                                //console.trace();
                                //throw 'stop';
                                complete(obs_bundling_res);
                            } else {

                                console.log('tof(obs_bundling_res)', tof(obs_bundling_res));

                                console.trace();
                                throw 'stop';
                            }
                        });
                    } else if (website.pages._arr.length > 1) {
                        throw 'NYI';
                        for (const page in website.pages._arr) {

                            
    
                            // With multiple pages, add page to bundle.
            
                            const obs_bundling = Webpage_Bundler.bundle_web_page(page, opts_bundling);
                            //console.log('doing bundling');
                            //console.log('obs_bundling', obs_bundling);
        
                            //throw 'stop';
    
                            obs_bundling.on('complete', res => {
                                //console.log('obs_bundling res', res);
                                const page_bundle = res;
    
                                console.log('page_bundle._arr.length', page_bundle._arr.length);
    
                                //complete(bundle);
    
                            });
            
        
                            const old = () => {
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
                
                                        // Multiple items at multiple paths....
                
                                        each(bundle, item => {
                                            //console.log('item', item);
                                            //console.log('item.path', item.path, item['content-type']);
                
                                            if (item['content-type']) {
                                                const ct = item['content-type'];
                                                if (ct === 'text/html') {
                                                    const http_serve_html = (req, res) => {
                                                        res.writeHead(200, {
                                                            'Content-Type': 'text/html'
                                                        });
                                                        res.end(item.value, 'utf-8');
                                                    }
                                                    router.set_route(item.path, (req, res) => {
                                                        http_serve_html(req, res);
                                                    });
                                                } else {
                                                    const http_serve_any = (req, res) => {
                                                        res.writeHead(200, {
                                                            'Content-Type': ct
                                                        });
                                                        res.end(item.value, 'utf-8');
                                                    }
                                                    router.set_route(item.path, (req, res) => {
                                                        http_serve_any(req, res);
                                                    });
                
                                                    //throw 'NYI';
                                                }
                    
                                            } else {
                                                throw 'NYI';
                                            }
                
                                        })
                
                                        //console.trace();
                                        //throw 'NYI';
                                    }
                                })
                            }
        
                            
        
        
        
        
                            //console.log(`${property}: ${object[property]}`);
                        }
                    } 
                })().catch(err => {
                    console.error(err);
                });
            });
            // put pages into a router here...
            //  however, may need to be on the lookout for other content that needs to be bundled with each page in the site.

            // Now let's try bundling an active JS client.
            // May need to compile / render JSGUI Controls to HTML / full HTML pages.

            // And unspecified pages such as admin pages?

            
            //throw 'NYI';
        }


        if (website) {


            //console.trace();

            //throw 'NYI - HTTP_Website_Publisher needs to publish specified website';

            console.log('Possibly missing website publishing code.')

            // Website_Bundle class would help.

            // jsgui3-website-bundle.
            //  Could make a separate module for it, give it a very simple API.
            //    Probably would only want to bundle websites on the server though.


            






            // Prepare website for publishing
            // Prepare being building static resources, making a list of the static routes / page content to serve.
            //   Static_Route_Content clases somewhere too.


            // Use many different class names to help keep track of what the objects do, and allow for flexibility.



            // Then the type of the website....
            // Do make use of runtime polymorphism and type checking.









            /*

            const obs_setup = setup_website_publishing(website);


            obs_setup.on('complete', res_complete => {
                console.log('setup complete');
                this.raise('ready');


            })

            */
        } else {

            // Do the async get_ready function....

            (async() => {

                await this.get_ready();
                this.raise('ready');

            })();


            //
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

    async get_ready() {
        await super.get_ready();

    }


    handle_http(req, res) {
        // Because it's already been set up in the router! It should have been.
        return this.router.process(req, res);

        // Called from a different context? Doubt we want that.
        // Now called strangely, without context.


        // The router does it all...???
        

        /*

        const {website, router} = this;

        //console.log('HTTP_Website_Publisher handle_http');
        //console.log('Object.keys(req)', Object.keys(req));
        //console.log('Object.keys(req.headers)', Object.keys(req.headers));

        const {url, method, statusCode, httpVersion} = req;
        const accept_encoding = req.headers['accept-encoding'];
        const {host} = req.headers;

        // count of routes in the router?
        // router.routes.length?
        // router.num_routes?

        //console.log('[httpVersion, host, url, statusCode, method, accept_endoding]', [httpVersion, host, url, statusCode, method, accept_encoding]);


        //console.log('router', router);
        //console.log('this.router', this.router);
        //console.log('this', this);
        //console.trace();
        router.process(req, res);

        */



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