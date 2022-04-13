/**
 * Created by james on 04/12/2016.
 */

/**
 * Created by James on 02/10/2016.
 */

// This one will need to activate on the client.
//  Really want the whole thing to be in one file.
//  Possible to have a standard activation?
//
// Or we need to have a client-side control?
//
// Some of the wiring could be done automatically.
//

//console.log('pre require jsgui');
var jsgui = require('jsgui3-html');
const each = jsgui.each;
//console.log('post require jsgui');
//var Start_Stop_Toggle_Button = require('../controls/start-stop-toggle-button');
const is_array = jsgui.is_array;
var Server = require('./server');
var Website_Resource = require('./resources/website-resource');
var port = 80;
//console.log('!!Server', !!Server);
//console.log('Object.keys(Server)', Object.keys(Server));
var Server_Page_Context = require('./page-context');

// js_mode option
//  compress
//  debug
//  (standard)

// Want to get the library compressed sizes down. Particulatly client. Can do much more with oext.



/*
var server = new Server({
    '*': {
        'name': 'html-server'
    }
});

*/
/*
var resource_pool = root_server.resource_pool;
// link these getters with the resource pool resource getters?
let app_server = resource_pool['HTML Server'];
//console.log('app_server', app_server);
//

//console.log('app_server.resource_names', app_server.resource_names);
//console.log('!!app_server.resource_pool', !!app_server.resource_pool);
let js = app_server.resource_pool['Site JavaScript'];
*/

//console.log('Server', Server);

// And choose the CSS file / files to send it.
//  Could send basic jsgui css by default
//  Then there would be app css on top of that.

// Authenticated_Server?
//  Has got authentication mechanisms as a wrapper for the controls inside.


// Want to be able to set up icons as well.



class Single_Control_Server extends Server {
    constructor(spec) {
        //spec['*'] = {
        //    'name': 'html-server'
        //};

        // If the spec is a control contructor...
        if (typeof spec === 'function') {
            super({}, 'single-control-server');
            this.Ctrl = spec;
            this.port = 80;
        } else {
            super(spec);
            let Ctrl = spec.Ctrl || spec.ctrl; // not .ctrl? makes it ambiguous / inconsistent.
            if (is_array(Ctrl)) {
                this.Ctrl = Ctrl[0];
                this.params = Ctrl[1];
            } else {
                if (Ctrl) {
                    this.Ctrl = Ctrl;
                } else {
                    throw 'Single_Control_Server needs a Ctrl property'
                }
            }
            if (spec.js_mode) this.js_mode = spec.js_mode;
            if (spec.js_client) this.js_client = spec.js_client;
            // deliver app specific css
            // an obj
            if (spec.css) this.css = spec.css;
            if (spec.icons) this.icons = spec.icons;
            if (spec.include_server_ref_in_page_context) {
                this.include_server_ref_in_page_context = spec.include_server_ref_in_page_context;
            }
            // Ctrl.activate_app
            //spec.activate_app;
            if (spec.activate_app && !this.activate_app) {
                this.activate_app = spec.activate_app;
            }
            //console.log('this.activate_app', this.activate_app);
            //throw 'stop';
            if (spec.client_package) this.client_package = spec.client_package;
            this.port = spec.port || 80;
        }
        //this.__type_name = 'single-control-server';
        var app = new Website_Resource({
            'name': 'html-server'
        });

        // will need to keep access to the server?
        //  server_page_context keeping access to the server?

        // some place to keep variables on the server.
        //  Especially when we are not coding any / much server-side logic.

        // server.shared
        //  want an object that is shared between all server instances.

        // A server-side Data_Resource could be the way.
        
        // Maybe make something like Resource_Pool but simpler?
        //  Less prescriptive, but allowing a more complex api...?

        // page_context.shared
        //  shared with the server
        //  shared with all page contexts.

        this.publish = (...args) => app.publish(...args);
        //console.log('app', app);
        //throw 'stop';
        this.resource_pool.add(app);
        this.server_router.set_route('*', app, app.process);
        this.app_server = app;
    }

    // Could start it up with a client_js reference

    'start' (callback) {
        //throw 'stop';
        //var resource_pool = this.resource_pool;

        var resource_pool = this.app_server.resource_pool;
        var server_router = this.resource_pool.get_resource('Server Router');
        // Build the client js and include that.
        //  Could have been given a different client js file too.
        //  By default want to provide the html client from jsgui.
        //   /client/client

        // build the html client code.
        let js = this.app_server.resource_pool['Site JavaScript'];
        let css = this.app_server.resource_pool['Site CSS'];
        let imgs = this.app_server.resource_pool['Site Images'];



        // will look into the resource publisher to see what is published.

        // serve package with replacement options.
        // // the activate app function.
        //  Can be put into place in the served JS.

        // with replacement option within serve_package

        let o_serve_package = {
            //'babel': 'mini'
        }

        // babel option.
        // Activation should be defined
        //  Or there is some default activation in the client.js
        //  It has the maps of controls and Controls
        //   Then can activate these controls.
        //    There should maybe be some more data services in the client.
        //  Could make the client more miniature and modular once it works, and then incorporate react.
        // Data-Resource would be general enough to work on both.
        //  The client data resources could then direct their requests to the server ones.
        // Could make a resource-pool for both client and server

        //console.log('this.activate_app', this.activate_app);
        //throw 'stop';

        // Should do this before the babel compilation. Think that's the sequence anyway.
        //  Not sure why it's not working.
        if (this.activate_app) {
            o_serve_package.replace = {
                '/* -- ACTIVATE-APP -- */': this.activate_app.toString()
            }
            //
        }
        // want it to serve with debug code map
        //  for the moment
        // want that to be easier to do with a --debug option.
        //  should read command line options.
        o_serve_package.js_mode = 'mini';
        if (this.js_mode) {
            o_serve_package.js_mode = this.js_mode;
        } else {
            //o_serve_package.babel = 'mini';
        }
        // need to minify the js.
        //  Also, gzip compression as standard.
        //  Need HTTPS for Brotli - but want to get HTTPS working more, tested online and running.

        // Need to minify js, reduce file size.

        // Minifying currently breaks it.

        //o_serve_package.js_mode = 'debug';

        // Extra functionality for loading / serving icon files?
        //  Easily available / usable named icons will be very useful within the app.
        //  Could be in sprites / pre-loaded.




        // Not sure how to do the replace when loading from disk.
        // Give a reference to the package to serve itself.
        //  example servers - 
        // serve the css as well.
        if (this.css) {
            each(this.css, (path, serve_as) => {
                css.serve(serve_as, path);
            })
        }
        let js_client = this.client_package || this.js_client || 'jsgui3-client';
        js.serve_package('/js/app.js', js_client, o_serve_package, (err, served) => {
            //var resource_pool = this.resource_pool;
            //console.log('server_router', server_router);
            //console.log('js_client', js_client);
            if (!server_router) {
                throw 'no server_router';
            }
            var routing_tree = server_router.routing_tree;
            routing_tree.set('/', (req, res) => {
                //console.log('root path / request');

                const o_spc = {
                    'req': req,
                    'res': res,
                    'resource_pool': resource_pool
                }

                if (this.include_server_ref_in_page_context) o_spc.server = this;


                var server_page_context = new Server_Page_Context(o_spc);

                // and .server property?
                //  a different way to get the server info to the components is needed.

                // Page_Bounds_Specifier
                var hd = new jsgui.Client_HTML_Document({
                    'context': server_page_context
                });
                hd.include_client_css();
                hd.include_css('/css/basic.css')

                if (this.css) {
                    each(this.css, (path, serve_as) => {
                        //css.serve(serve_as, path);
                        hd.include_css('/css/' + serve_as);
                    });
                }

                // include a js script block, having it set up the 
                // not include_client_js

                // .include_client_config_js()
                //  will get the resource config from the resource publisher.

                // including data on published resources in the initial html download would be very useful.
                //  auto event wiring, so that controls that rely on having this data will have it available.

                // Want to get this to work, then greatly slim down the codebase, or at least delete comments, use some more syntactic sugar.

                // Calling 'publish' would be a good method.
                //console.log('this.app_server.map_resource_publishers', this.app_server.map_resource_publishers);
                //console.log('this.app_server.def_resource_publishers', this.app_server.def_resource_publishers);

                // a script block where we assign the resource publishers.
                //  tell the client what resources are available on the server.

                // include a js script block.
                // jsgui.register_server_resources({...})
                // o_def
                //  an object that describes how the resources are published.

                // app_server.def_resource_publishers
                //  the urls
                //   what data it provides / its schema.
                //  a def from each of the publishers
                //   with a schema similar to graphql?

                //throw 'stop';

                var body = hd.body;
                let o_params = this.params || {};
                Object.assign(o_params, {
                    'context': server_page_context
                });
                //console.log('o_params', o_params);
                //console.log('this.Ctrl', this.Ctrl);
                var ctrl = this.ctrl = new this.Ctrl(o_params);
                ctrl.active();
                //var ctrl2 = new jsgui.Control({});
                body.add(ctrl);

                let resources_script = new jsgui.script({
                    context: server_page_context
                });
                // it will be a client-side function.

                // Should not use 'add' here.
                //  it's the script content.

                // want to get around that escaping.
                // options escaping / escape : false

                hd.include_js('/js/app.js');

                // Would this be a place to register icons?


                const strc = new jsgui.String_Control({
                    context: server_page_context,

                    // Won't have access to the context when registering there?
                    //  Will need to access the client-side context.
                    //   Setting jsgui.context on the client-side does make sense.
                    //    There would only be one context per instance of jsgui on the client.

                    // Could raise an event on jsgui, which the page_context listens to?
                    //  The calls need to be set up within the page_context, I think.

                    // Could just set the def_server_resources property.
                    //  Then later activation with the page_context could refer to it.

                    // setting up the def_resource_publishers
                    //  maybe 'resource' will be a generic term for something in some place.
                    //   can be non-local, but api will localise its use.

                    text: `jsgui.register_server_resources(${JSON.stringify(this.app_server.def_resource_publishers)});`
                });

                resources_script.add(strc);
                body.add(resources_script);
                
                hd.all_html_render(function (err, deferred_html) {
                    if (err) {
                        throw err;
                    } else {
                        //console.log('deferred_html', deferred_html);
                        var mime_type = 'text/html';
                        //console.log('mime_type ' + mime_type);
                        res.writeHead(200, {
                            'Content-Type': mime_type
                        });
                        res.end('<!DOCTYPE html>' + deferred_html, 'utf-8');
                    }
                });
            });
            //console.log('pre super start');

            super.start(this.port, (err, res_super_start) => {
                if (err) {
                    callback(err);
                } else {
                    //console.log('res_super_start', res_super_start);
                    this.raise('scs_ready');
                    callback(null, res_super_start);
                }
            });
        });
        // console.log('this.port', this.port);
    }

    load_icon_set(path, map_icons) {
        // will load each icon into the image resource.
        //  sequential way of doing this?


        


    }
}

module.exports = Single_Control_Server;

// Rendering single page controls makes a lot of sense.
//  It means the activation code can be contained better there.

//console.log('resource_pool', resource_pool);
//console.log('resource_pool.resources', resource_pool.resources);

// The start stop toggle button would need to be registered on the client side.
//  May be worth it to have the standard controls registered to start with.
//  Or to have the app know which controls are used, so it can register them.

// Get the website resource

// Caching items / resources by type?
// Need to give the resources a name.
//var website = resource_pool.get_resource('Server Router');

//console.log('\n\n');