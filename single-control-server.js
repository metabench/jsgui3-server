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

console.log('pre require jsgui');
var jsgui = require('jsgui3-html');
console.log('post require jsgui');
//var Start_Stop_Toggle_Button = require('../controls/start-stop-toggle-button');
const is_array = jsgui.is_array;
var Server = require('./server');
var Website_Resource = require('./website-resource');
var port = 80;
console.log('!!Server', !!Server);



console.log('Object.keys(Server)', Object.keys(Server));
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

            let Ctrl = spec.Ctrl || spec.ctrl;
            if (is_array(Ctrl)) {
                this.Ctrl = Ctrl[0];
                this.params = Ctrl[1];
            } else {
                this.Ctrl = Ctrl;
            }

            if (spec.js_mode) this.js_mode = spec.js_mode;
            // Ctrl.activate_app
            //spec.activate_app;
            if (spec.activate_app) {
                this.activate_app = spec.activate_app;
            }
            this.port = spec.port || 80;
        }
        //this.__type_name = 'single-control-server';
        var app = new Website_Resource({
            'name': 'html-server'
        });
        //console.log('app', app);
        //throw 'stop';
        this.resource_pool.add(app);
        this.server_router.set_route('*', app, app.process);
        this.app_server = app;
    }
    'start' (callback) {
        //throw 'stop';
        var resource_pool = this.resource_pool;
        var server_router = resource_pool.get_resource('Server Router');
        // Build the client js and include that.
        //  Could have been given a different client js file too.
        //  By default want to provide the html client from jsgui.
        //   /client/client

        // build the html client code.
        let js = this.app_server.resource_pool['Site JavaScript'];

        // serve package with replacement options.
        // // the activate app function.
        //  Can be put into place in the served JS.


        // with replacement option within serve_package

        let o_serve_package = {
            //'babel': 'mini'
        }

        // babel option.


        if (this.activate_app) {
            o_serve_package.replace = {
                '/* -- ACTIVATE-APP -- */': this.activate_app.toString()
            }
            //
        }

        if (this.js_mode) {
            o_serve_package.js_mode = this.js_mode;
        } else {
            o_serve_package.babel = 'mini';
        }
        // Not sure how to do the replace when loading from disk.

        // Give a reference to the package to serve itself.
        //  example servers - 

        js.serve_package('/js/app.js', 'jsgui3-client', o_serve_package, (err, served) => {
            //var resource_pool = this.resource_pool;
            //console.log('server_router', server_router);

            if (!server_router) {
                throw 'no server_router';
            }
            var routing_tree = server_router.routing_tree;

            routing_tree.set('/', (req, res) => {
                //console.log('root path / request');
                var server_page_context = new Server_Page_Context({
                    'req': req,
                    'res': res,
                    'resource_pool': resource_pool
                });
                // Page_Bounds_Specifier
                var hd = new jsgui.Client_HTML_Document({
                    'context': server_page_context
                });
                hd.include_client_css();
                hd.include_css('/css/basic.css')
                hd.include_js('/js/app.js');
                var body = hd.body;


                let o_params = this.params || {};
                Object.assign(o_params, {
                    'context': server_page_context
                });

                var ctrl = this.ctrl = new this.Ctrl(o_params);
                ctrl.active();
                //var ctrl2 = new jsgui.Control({});
                body.add(ctrl);
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
                    console.log('res_super_start', res_super_start);
                    callback(null, res_super_start);

                }
            });
        });

        // console.log('this.port', this.port);
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