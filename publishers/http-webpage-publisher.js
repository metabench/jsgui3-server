// Want to get it (back) working as a server easily serving simple controls and pages and sites.
// Need to tame some of the more complex layers inside it to get it to easily serve the app.
// Then should work on making / improving some of the specific controls.
// Make the code idiomatic and DRY. The more complex lower and middle level abstractions will help with that.
// Use polymorphism and run-time checks to allow for some more flexibility.



// Later on will probably make some new very specific classes to encapsulate things the HTTP_Webpage_Publisher does.

// Maybe have the publisher use Preparer or other (slightly) more specific classes.




// The publisher will need to do a few things / have some things done, but make it rely on the helpers
//   and bundlers and extractors.

// The helpers maybe could call the bundlers and extractors.








// A publisher handles HTTP requests.

// This is going to take over some of the responsibilities of the old website resource, which was unfocused code that was
//  doing some of the main / most important parts of serving the website.
const jsgui_client = require('jsgui3-client');

const HTTP_Publisher = require('./http-publisher');
const Server_Static_Page_Context = require('../static-page-context');

const HTTP_Webpageorsite_Publisher = require('./http-webpageorsite-publisher');
const {obs} = require('fnl');

// May want / need to more carefully and specifically define APIs.
// It's nice to have classes for specific things like this, but need to make them do what is needed.
//  Maybe get a 'Website' object or control ready to be served.
//  
const Static_Routes_Responses_Webpage_Bundle_Preparer = require('./helpers/preparers/static/bundle/Static_Routes_Responses_Webpage_Bundle_Preparer');



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


// HTTP_Static_Webpage_Publisher perhaps....


// Also have various Authorisers ...
// Have Authenticators ...






class HTTP_Webpage_Publisher extends HTTP_Webpageorsite_Publisher {

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

        // But like the website publisher, this would need to bundle the page (JS, CSS, maybe more).
        //   Consider that an SPA may reference images. May not exactly be one page in some ways.





        // Probably best to come up with a bundle here, or at an early stage.

        // .prepare_bundle?

        // .prepare_bundle would be a good function to have here.



        // .bundle?
        //   seems clearest that we will be getting / preparing multiple files.

        // Bundling and compiling web content seems like a better thing to get working before serving (or attempting to serve) it.
        // .build?

        /*
        setTimeout(() => {


            this.raise('ready');
        }, 0);

        */

        this.static_routes_responses_webpage_bundle_preparer = new Static_Routes_Responses_Webpage_Bundle_Preparer();

        (async() => {

            const res_get_ready = await this.get_ready();


            // Is the HTML to be static or regenerated on page calls?
            //   Want an easy way to specify it.



            // Then set things (a single static route???) up for the webpage.
            //    Be very explicit with classes to do specific things like this so they will be easier to find and change.

            //  Should render the webpage (once)
            //    Maybe use a class on a higher level to choose this important rendering / caching setting.

            //  Maybe the server could render multiple times over a few minutes before deciding it's not going to change.

            // Though telling the server it's static would help in some / many cases.
            //   Have it as a sensible default depending on the situation.

            // Could even look at the controls to see if anything is non-static.
            //   Or mark things somehow.

            // At least want to make this setting very clear in the future.







            this.raise('ready', res_get_ready);

        })();

    }

    async get_ready() {
        //await super.get_ready();

        const {static_routes_responses_webpage_bundle_preparer} = this;


        // Its a bundle....
        const webpage_or_website_res_get_ready = await super.get_ready();

        //console.log('webpage_or_website_res_get_ready', webpage_or_website_res_get_ready);

        


        const render_webpage = async () => {

            // Activate it or not....   As in serve active JSGUI control content. HTML ready to be activated on the client.

            // .active();
            //   Generally would want that as standard.

            // Need to be very clear about generating active content on the server side.
            //   Ready to be activated on the client-side.
            //     Though could possibly activate using CSS classes.




            // Probably best to make a Server_Page_Context here.
            // Server_Static_Page_Context perhaps.



            // Maybe a class to render the single page into the bundle?
            //   Maybe only worth doing when there become (many) more options and divisions seem clearer.

            const {webpage} = this;
            const Ctrl = webpage.content;

            // In business activating it with the page context.

            const static_page_context = new Server_Static_Page_Context();

            const ctrl = new Ctrl({
                context: static_page_context
            });

            // Webpage_CSS_JS_HTML_Bundle_Ready_To_Serve_Preparer

            if (ctrl.head && ctrl.body) {


                    // Create the CSS link control

                //console.log('jsgui_client.controls', jsgui_client.controls);

                //console.log('jsgui_client.controls', Object.keys(jsgui_client.controls));

                const ctrl_css_link = new jsgui_client.controls.link({
                    context: static_page_context
                });
                ctrl_css_link.dom.attributes.rel = 'stylesheet';
                ctrl_css_link.dom.attributes.href = '/css/css.css';

                ctrl.head.add(ctrl_css_link);


                // Then add the JS Script ref (with href) to the (end of the) body.

                // Content_Incorporator perhaps???
                // Bundle_Content_Incorporator?

                // Will be worth making classes to do this when there is more variety of settings and operations.

                const ctrl_js_script_link = new jsgui_client.controls.script({
                    context: static_page_context
                });

                ctrl_js_script_link.dom.attributes.src = '/js/js.js';

                ctrl.body.add(ctrl_js_script_link);

                // <script src="myscripts.js"></script>


                //console.log('!!ctrl.head', !!ctrl.head);
                //console.log('!!ctrl.body', !!ctrl.body);

                // add the css ref to the head, then the script ref to the body.

                // ctrl.body????

                // or add it to the body....
                // ctrl.head.add(new jsgui.script(...))


                // Adding script references...?

                // or .activate with it working on the server...?



                // Could have settings which determine which HTML elements get activated into controls, which don't.
                ctrl.active();



                // .active should do enough I think....

                // Server_Page_Context being the context of a publisher doing a one-time static rendering of a only page's HTML
                //   Does seem like the Servier_Page_Context will be needed for this to work properly.
                //   Want to hide some details that won't need changing from the top level API.
                //     All kinds of things like page contexts will help in the background, they should be there to make
                //       things easier.






                //   do we need a Server_Page_Context first?

                const html = await ctrl.all_html_render();

                // Produces the HTML fairly well here....


                // Want to provide these as static resources to the server / router.
                //  The publisher itself should not need to handle HTTP requests each time.
                //  Keep the option for that though, it may help with some systems, more dynamic, not static responses.

                // Focus a lot on ease of use to set up servers with sensible and powerful defaults.
                //   Also not requiring a specific directory or project structure.
                //   Serving a simple app with a simple JS file.








                //console.log('html', html);

                //console.trace();
                //throw 'NYI';

                return html;



            } else {
                console.trace();
                throw 'NYI';
            }
            
        }

        // Maybe a Webpage_Rendering_Preparer could do this even?

        // Webpage_Renderer even
        //   And it could render jsx, (other react?), 


        const webpage_html = await render_webpage();

        const o_webpage_html = {
            type: 'HTML',
            extension: 'html',
            text: webpage_html
        }

        webpage_or_website_res_get_ready.push(o_webpage_html);

        //console.log('webpage_or_website_res_get_ready._arr.length', webpage_or_website_res_get_ready._arr.length);


        await static_routes_responses_webpage_bundle_preparer.prepare(webpage_or_website_res_get_ready);

        // Then publish it to the router...?
        //   server.serve_prepared_static_routes_bundle ?????
        return webpage_or_website_res_get_ready;



        // But then the bundle with static routes should be given / provided to the server.
        //   Would be nice to end the responsibility of the Publisher once the final prepared bundle with static
        //   routes and static content (compressed in different ways, uncompressed buffer there too) and have the 
        //   Server or Server Router do the rest.

        // Improve handling of prepared to serve (HTTP response) bundles, making it easy to tell the server to use them.

        // Maybe make a more advanced HTTP_Responder baked into the server.
        //   Or an interchagable class that does it, used within the server.









        // Then send it off to the final stage bundler / Final_Stage_Bundle_Preparer_That_Prepares_Static_Routes_Responses

        // Some very long and explicit class names seem appropriate.
        
        // Final_Stage_Webpage_Bundle_Preparer_Of_Static_Routes_Responses

        // Static_Routes_Responses_Webpage_Bundle_Preparer
        //   That should be fine doing the very last part.

        // But then another component to assign these static routes to the router?
        //   Or maybe that's easy enough to do with a function call (or a few).

        // Prepared_Responses_Cache???

        // Don't want to make big changes to the router and server itself right now.
        //   Though an extra function (or a few) could help within Server_Router.
        //     Or not the router, but do it here in the handle_http function call.
        //       With the router just routing those URLs here.

        // Does seem better architecture for the publisher to hand the responsibility off to some (other) server component.






        

        // then add that webpage html to the bundle.



        // Then add a new static HTML item to the bundle.



        //console.log('webpage_html', webpage_html);


        // Add it to the bundle
        // Prepare the bundle to serve with static routes
        // Give the prepared bundle to the server (router).

        // Then see it running small and increasingly large apps.





        // Add the webpage HTML to the bundle.
        //   Then call the static routes assigner on the array in the bundle  (._arr)

        // Then get server_static_route_prepared_responses.

        // Then maybe some other class assigns these prepared responses to the server or server router.

        // When preparing static responses, should prepare them gzipped, brotlied, and uncompressed.
        //   Though will (always?) use UTF8, will make that explicit and allow for other encoding types.



        // Preparer or Bundle_Perparer could be a final / further stage.
        //   And would itself use other classes internally with very specific functionality






        // Then it will be about assembling the routing instructions.

        // So then different conventions / systems could be used to assign static routes.
        //   And very clear in the code what is going on (through use of very explicit and specific class / classes that do this).


        // Server_Static_Routes_Assigner perhaps.
        //  subclass:
        // Single_Control_Webpage_Server_Static_Routes_Assigner

        // Assigning the static routes with a class makes sense, could hard-code things here but want better options that can be interchanged
        //   and modified and improved separately.



        // Bundle_To_Serve_Statically_Preparer
        //  .prepare(bundle)

        // Really simple function calling syntax, really clear responsibilities, and if any wind up not being used then that will be 
        //   fine.





        // Server_Prepared_Static_Routes_Responses


        // publishers/publishing-tools perhaps....?

        // Or create a bundle that then includes the HTML document.
        //   Could add headers and compressed buffers (to write to responses) to the existing bundle items.
        

        // The system as a whole here is not massively complex, but moderately.
        //   Changable minute details will be finite in this implementation but infinite when it comes to extending and
        //     making subcategories especially in terms of how things are done internally to that system.









        //console.trace();
        //throw 'NYI';




        // Probably need to call a preparer???
        //   Need (something to) server the static things, but also if the rendered HTML itself is static, having that pre-rendered
        //   would be best.


        // Should make the rendering more abstract (less specific code in Server itself) and be very clear indeed what the classes
        //   do by naming them well.

        // But the publisher itself does handle the HTTP.
        //   That possibly should not always be the case.


        // Website_Static_Responses_Preparer
        // Webpage_Static_Responses_Preparer



        // HTTP_Response_Preparer could be a useful class and one to subclass from.

        // HTTP_Static_Response_Preparer








        // Or maybe insert references to the bundled content appropriately into the HTML.

        // At the end of the body may be best for the JS???
        //   Want nice options for this.

        // Then here we need to create static HTML....



    }

    // The publisher should not (always / usually) handle the HTTP calls.
    //   It may be worth having architecture that allows for it when publishing dynamic content.
    //   When publishing static content it's better to pass that static content onto the server. (specific static content for specific routes / urls)
    //    Maybe dict or map lookup is better for those static content URLs.






    handle_http(req, res) {


        // Don't (automatically) connect this function.

        console.log('HTTP_Webpage_Publisher handle_http');
        console.log('req.url', req.url);

        // Should not (need to?) handle the HTTP here.

        // Ideally the Webpage Publisher will have already bundled all the static files.


        // HTTP_Webpage_Request_Handler perhaps?





        // Is the webpage rendered?
        // Does the webpage require rendering?
        //   Seems like the main question to ask here.

        


        // returning an observable would make sense.
        //  so other parts of the server could observe the request being processed.




        // This may be quite concerned with ensuring the bundle before handling any http requests to provide it or parts of it.
        //  Could even unit test before running deployed code.

        // Could get info on what needs to be bundled from the webpage object itself.
        //  A Webpage objects could have 'requirements', or 'build requirements'.
        //    If such things are needed, then make classes for them.












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