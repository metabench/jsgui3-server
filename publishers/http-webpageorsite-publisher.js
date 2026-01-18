


const { each, Router, tof } = require('jsgui3-html');
const HTTP_Publisher = require('./http-publisher');
const { obs } = require('fnl');

// The Webpage bundler should be able to come up with the compiled JS and CSS, maybe even a favicon.

// HTTP_Webpageorsite_Publisher



const Website = require('jsgui3-website');

const Webpage_Bundler = require('../resources/processors/bundlers/webpage-bundler');

// The webpage bundler - probably will be quite simple to the website bundler.
// Think the webpage bundler should bundle static HTML content from the server into the bundle.

// Better in general not to regenerate all HTML for each page request.


const JS_Bundler = require('../resources/processors/bundlers/js-bundler');


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





class HTTP_Webpageorsite_Publisher extends HTTP_Publisher {

    constructor(spec) {
        super(spec);

        if (spec.debug !== undefined) this.debug = spec.debug;
        this.style_config = spec.style || {};
        this.bundler_config = spec.bundler || {};

        // But then some properties to do with the js client(s?) file path.

        // This should be fairly simple in terms of making use of the bundler, then providing the server (maybe the router component)
        //   with the content to serve.

        // js_client_file_path ??? client_js_file_path???

        let src_path_client_js;
        if (spec.disk_path_client_js) {
            src_path_client_js = spec.disk_path_client_js;
        } else if (spec.src_path_client_js) {
            src_path_client_js = spec.src_path_client_js;
        } else if (spec.source_path_client_js) {
            src_path_client_js = spec.source_path_client_js;
        };

        // or src_path_client_js as well...

        Object.defineProperty(this, 'disk_path_client_js', { get: () => src_path_client_js, set: (value) => src_path_client_js = value });
        Object.defineProperty(this, 'src_path_client_js', { get: () => src_path_client_js, set: (value) => src_path_client_js = value });
        Object.defineProperty(this, 'source_path_client_js', { get: () => src_path_client_js, set: (value) => src_path_client_js = value });


        // But then need to have some things that get it ready on this level...

        // Maybe need a get_ready (async or obs) function....

        this.js_bundler = new JS_Bundler({
            'debug': this.debug || false,
            'style': this.style_config,
            'bundler': this.bundler_config
        });


    }

    async get_ready() {

        const { js_bundler } = this;
        //await super.get_ready(); // Does not have one

        // Then bundle (extract (process) everything in and referenced by the JS file (s) into a bundle object)
        //   Maybe that bundle object will contain some (static) routing instructions.

        //   The publisher could provide the server with a set of static routing instructions.
        //   A (simple) Static_Routing_Instructions class could be helpful, and then could be extended, swapped, optimised etc.

        // HTTP_Static_Routing_Instructions even.
        //   Want simple code, but have it neatly wrap existing class / standard JS object. Eg facade around array even.
        //   A type of server input or server instruction or server(router) setting.

        console.log('web page or site async get_ready called');


        // Single js client for whole website??? Could work, not so sure.
        //   Appropriate defalt setting (using v explicit classes) will help it to work.

        const { src_path_client_js } = this;

        console.log('[HTTP_Webpageorsite_Publisher] get_ready called, src_path_client_js:', src_path_client_js);

        // Skip bundling if no client.js path is provided
        // This allows Server.serve() to work with SSR-only controls
        if (!src_path_client_js) {
            console.log('[HTTP_Webpageorsite_Publisher] No src_path_client_js provided - skipping JS bundling');
            // Return an empty bundle with minimal CSS and JS
            const empty_bundle = new Bundle();
            empty_bundle.push({
                type: 'CSS',
                extension: 'css',
                text: '/* No client CSS */'
            });
            empty_bundle.push({
                type: 'JavaScript',
                extension: 'js',
                text: '/* No client JS - SSR only */'
            });
            return empty_bundle;
        }

        // The js_bundler may need to operate in 'debug' mode.
        const js_bundler_res = await js_bundler.bundle(src_path_client_js);
        // Should also get the CSS from it....

        //console.log('js_bundler_res', js_bundler_res);

        // Res of length 2 - with a css item and a js item.
        //   js item (probably?) first.

        if (js_bundler_res.length === 1) {
            const bundle = js_bundler_res[0];

            const css_item = bundle._arr.find((item) => item.type === 'CSS');
            const js_item = bundle._arr.find((item) => item.type === 'JavaScript');

            if (css_item && js_item) {

                return bundle;

                // Let's but the HTML into the bundle too...
                //   But could mark the bundle or the HTML saying it needs further preparation (reference or code inserts)


                // Should first include references to the CSS and JS in the HTML (Control(s))



                // generate (render) the HTML.

                // Though possibly the webpage publisher could take over....







                //console.trace();
                //throw 'stop';


                // Setting up a static '/' or main page....?
                //   May want to make an object that describes / provides the code or controls to insert into every page
                //   and to say where to do so.

                // May want further '/' single page or control server code, could have some classes named very specifically
                //   for the cases we are dealing with.









                // Then get the publisher to use another bundler?
                // a Ready_To_Serve_Static_Items_Bundler perhaps?

                // Is best to do this a round-about way in terms of the classes, what they do, and having them interchangable, and
                //   very explicit.

                // Maybe it could even make 'Server_Instructions'.
                //   Being very explicit about the stages.

                // Maybe rename classes if they are too long and something shorter occurs.

                // System_That_Prepares_Bundles_Of_Just_A_Single_JS_File_And_A_Single_CSS_File_To_Be_Served_Statically
                //  And_References_To_Them_Inserted_In_HTML_Control


                // Being mega-explicit about what gets done here will help integration of classes that do what other people would consider
                //   better / ideal.

                // JS_And_CSS_Perpare_For_Service_Class

                // For the moment, make extremely specific classes for what the code is doing here.

                // Single_JS_And_Single_CSS_Bundle_To_Serve_Statically_Preparer.
                // And possibly a version that also creates instructions??? for what to do to the JSGUI control that would otherwise
                //   be ready.

                // Want to move away from having somewhat complex things in the classes themselves that operate in assumed way.
                //   Have some relatively complex things that only need to be done on the server really explicit.
                //   However, also want classes to represent these things so the logic could run on the client.

                // Prepare the static service of the pages for the router.

                // Probably worth finding ways to best include them in the HTML first....

                // This part here is just getting ready to publish.
















                // Preparers seem like they should be part of the Publishers dir structure / system.















                // or a Bundle_Preparer_Prepare_For_Static_Routes_Assignment ?????



            } else {
                console.trace();
                throw 'stop';

            }



            //console.trace();
            //throw 'stop';

        } else if (js_bundler_res._arr.length === 2) {


            console.trace();
            throw 'stop';



        } else {
            console.log('js_bundler_res', js_bundler_res);
            console.trace();
            throw 'stop';
        }





        console.trace();
        throw 'stop nyi';












    }

}


module.exports = HTTP_Webpageorsite_Publisher;

