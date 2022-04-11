//var sockjs = require('sockjs'), jsgui = require('jsgui3-html'),
const jsgui = require('jsgui3-html'),
//os = require('os'),
http = require('http'),
https = require('https'),
Resource = jsgui.Resource,
Server_Resource_Pool = require('./resources/server-resource-pool'),
// routing-tree? make a generalised module?
Router = jsgui.Router,
Website_Resource = require('./resources/website-resource'),
Info = require('./resources/local-server-info-resource'),
Server_Page_Context = require('./page-context'), {Evented_Class, each, tof} = jsgui;

const lib_path = require('path');

const Web_Admin_Page_Control = require('./controls/page/admin');
const Web_Admin_Panel_Control = require('./controls/panel/admin');

// Operating JSGUI_Server as a proxy server or with improved proxy capabilities may help.

// The router is the same as on the client.

// Could make JSGUI 3 Server generally more flexible and configurable.
// To work as a proxy server.
// To route to different ports / apps depending on the 'host'.


// Could make this use / include C++ and Rust WASM tools.
// Maybe some OpenCL for running algos on the server.


// jsgui.compile(source, {input_lang, output_lang})
//  c, c++, rust all to wasm compilation would be very nice.

// A server admin web application should go in somewhere.
//  Probably (just) a control.

// Want to make this easier to use and program in.

// 0.0.83 will be an ease of use release.

//  JSGUI_Server automatically having its admin website or website part, or it's an easy setting to make.


class JSGUI_Server extends Evented_Class {


    constructor(spec = {website: true}, __type_name) {
        // Default operations mode...
        //  Has its own website resource.
        //   All gets routed to that resource automatically.
        //   

        let is_website = spec.website === true;

        super();
        this.__type_name = __type_name || 'server';
        var resource_pool = this.resource_pool = new Server_Resource_Pool({
            // Other things can be made available through the server resource pool.
            'access': {
                'full': ['server_admin']
            }
        });
        //Object.defineProperty('')
        // Maybe the server router should explicitly be a Resource?
        //  Or just treat Objects the same way as Data_Object (if possible) in Collection.

        // Interestingly, router is not a part of jsgui3-server itself.



        const server_router = this.server_router = new Router({
            'name': 'Server Router',
            'pool': resource_pool
        });
        resource_pool.add(server_router);
        if (spec.https_options) {
            this.https_options = spec.https_options;
        }
        if (spec.routes) {
            each(spec.routes, (app_spec, route) => {
                var app = this.app = new Website_Resource(app_spec);
                resource_pool.add(app);
                server_router.set_route(route, app, app.process);
            });
        }

        // Multiple websites - perhaps proxying to them.

        if (is_website) {
            const app = this.app = new Website_Resource({
                name: 'Website'
            });
            //console.log('app', app);
            resource_pool.add(app);
            server_router.set_route('/*', app, app.process);

        }

        // a 'router' property that returns the server router.

        Object.defineProperty(this, 'router', {
            get() {
                return server_router;
            }
        });

        // Don't want an admin web page by default (yet).

    }
    get resource_names() {
        //console.log('this.resource_pool', this.resource_pool);
        return this.resource_pool.resource_names;
    }

    // could have those pairs. Possible websocket ports? websockets uses same ports: 80, 443.
    // http_port, https_port


    'start'(port, callback, fnProcessRequest) {
        //throw 'stop';
        // The resource_pool is not just a Data_Value. need to fix some get or create new field value code.
        //console.log('start');

        //jsgui.note('server', 'start');

        const rp = this.resource_pool;
        if (!rp) {
            throw 'stop';
        }

        rp.start(err =>  {
            if (err) {
                throw err;
            } else {
                var lsi = rp.get_resource('Local Server Info');
                var resource_names = rp.resource_names;
                var js = rp.get_resource('Site JavaScript');
                var css = rp.get_resource('Site CSS');
                var images = rp.get_resource('Site Images');
                var audio = rp.get_resource('Site Audio');
                var login = rp.get_resource('Login HTML Resource');
                var admin = rp.get_resource('Web Admin');
                var sock_router = rp.get_resource('Server Sock Router');
                var server_router = rp.get_resource('Server Router');
                lsi.getters.net((err, net) => {
                    if (err) {
                        callback(err);
                    } else {
                        //console.log('net', net);
                        // Could host on local.
                        //  Host on every ipv4 address for the moment.
                        var arr_ipv4_addresses = [];
                        each(net, (arr_addresses, name) => {
                            each(arr_addresses, (obj_address) => {
                                if (obj_address.family === 'IPv4') {
                                    arr_ipv4_addresses.push(obj_address.address);
                                }
                            })
                        });
                        let num_to_start = arr_ipv4_addresses.length;
                        if (this.https_options) {
                            each(arr_ipv4_addresses, (ipv4_address) => {
                                var https_server = https.createServer(this.https_options, function (req, res) {
                                    //console.log('process server request.url', req.url);
                                    var server_routing_res = server_router.process(req, res);
                                    //console.log('server_routing_res', server_routing_res);
                                });
                                https_server.timeout = 10800000;
                                //https_server.listen(443, ipv4_address);
                                https_server.listen(port, ipv4_address);
                                num_to_start--;
                                if (num_to_start === 0) {
                                    callback(null, true);
                                }
                            });
                        } else {
                            each(arr_ipv4_addresses, (ipv4_address) => {
                                var http_server = http.createServer(function (req, res) {
                                    var server_routing_res = server_router.process(req, res);
                                });
                                http_server.timeout = 10800000;
                                http_server.listen(port, ipv4_address);
                                console.log('* Server running at http://' + ipv4_address + ':' + port + '/');
                                num_to_start--;
                                console.log('num_to_start', num_to_start);
                                if (num_to_start === 0) {
                                    callback(null, true);
                                }
                            });
                        }
                        //throw 'stop';
                    }
                });
            }
        });
    }

    'process_request'(req, res) {
        var url = req.url;
        //console.log('*** server process_request url ' + url);
        var s_url = url.split('/');
        var a_path = [];
        each(s_url, (v, i) => {
            if (v.length > 0) {
                a_path.push(v);
            }
        });
        var router = this.get('router');
        if (a_path.length > 0) {
            var routing_res = router.process(req, res);
        } else {
            console.log('need to process short path');
        }
    }
    'serve_document'(req, res, jsgui_html_document) {
        var html = jsgui_html_document.all_html_render();
        var mime_type = 'text/html';
        //console.log('mime_type ' + mime_type);
        res.writeHead(200, {
            'Content-Type': mime_type
        });
        res.end(html, 'utf-8');
    }
}

//console.log('!!2)jsgui', !!jsgui);
JSGUI_Server.HTML = require('jsgui3-html');
JSGUI_Server.Resource = Resource;
JSGUI_Server.Page_Context = Server_Page_Context;
JSGUI_Server.Server_Page_Context = Server_Page_Context;
JSGUI_Server.Website_Resource = Website_Resource;

module.exports = JSGUI_Server;

if (require.main === module) {
    //console.log('called directly');

    const args = process.argv.slice(2);
    let port = 80;

    if (args.length === 1) {
        const i = parseInt(args[0]);
        if (typeof i === 'number') {
            port = i;
        }
    }

    const server = new JSGUI_Server();

    // Server should already have a Website_Resource.
    //  Possibly just for its own admin.


    

    /*
    var app = new Website_Resource({
        'name': 'html-server'
    });
    //this.publish = (...args) => app.publish(...args);
    //console.log('app', app);
    //throw 'stop';
    this.resource_pool.add(app);
    this.server_router.set_route('*', app, app.process);
    this.app_server = app;
    */

    //const web_admin = new Web_Admin_Page_Control({});

    // Maybe server.route should be a function.
    //  but able to route by host values in incoming messages.

    //server_router.set_route(route, app, app.process);

    // Though needs to send it to something to render the control.
    //  a function of some sort.
    // Could improve router / control functionality to respond to an HTTP request.



    //server.router.set_route('admin/*', web_admin);
    

    // A control publisher maybe?
    
    
    //server.route('/admin/*', web_admin);

    // 
    const app_admin = new Website_Resource({
        name: 'Admin Website'
    });
    //console.log('app_admin', app_admin);

    // Need to serve a JS client to that app.
    //  The /controls/page/admin.js app.

    // app_admin.serve_js()


    // Should be possible to programatically make / configure the app before serving it.
    //  Choose its controls.


    server.resource_pool.add(app_admin);

    // Need to better set up Control publishing

    //server.router.set_route('/*', app, app.process);
    server.router.set_route('admin/*', app_admin, app_admin.process);

    let js = app_admin.resource_pool['Site JavaScript'];

    //console.log('js', js);

    //let js_client = this.client_package || this.js_client || 'jsgui3-client';

    // Need to more easily / by default serve the suitable JS client app?
    //  Want it with one property setting or command. Not quite by default. Could be default in various configs.


    // server.serve_js_client
    //  will a single js client cover all the served pages / site parts?
    //   an admin.js may be more appropriate, in some cases path specific JS.

    // Further work on compiler / transformer type resources.
    //  Even 'publisher', as this part is about publishing the correct js in the correct format.

    // Compilation and bundling seems most important for this type of server app.

    // server.bundle_control


    let js_client = lib_path.resolve('./controls/page/admin.js');

    let o_serve_package = {
        'babel': 'mini'
    }

    // Would need to set the route in the router as well.

    
    
    js.serve_package('admin/js/app.js', js_client, o_serve_package, (err, served) => {
        if (err) {
            console.log('err', err);
            throw 'stop';
        } else {
            if (served) {
                console.log('served', served);



                const prepare_app = () => {

                    const server_router = server.router;

                    if (!server_router) {
                        throw 'no server_router';
                    }
                    var routing_tree = server_router.routing_tree;

                    // route /js to the js resource?

                    





                    routing_tree.set('admin', (req, res) => {
                    //console.log('root path / request');
                        const o_spc = {
                            'req': req,
                            'res': res,
                            'resource_pool': app_admin.resource_pool
                        }

                        if (this.include_server_ref_in_page_context) o_spc.server = this;
                        var server_page_context = new Server_Page_Context(o_spc);
                        // then merge the context data :)
                        if (this.context_data) {
                            Object.assign(server_page_context, this.context_data);
                        }
                        // and .server property?
                        //  a different way to get the server info to the components is needed.

                        // Page_Bounds_Specifier
                        var hd = new jsgui.Client_HTML_Document({
                            'context': server_page_context
                        });
                        hd.include_client_css();
                        hd.include_css('/admin/css/basic.css');
                        //hd.include_css('/css/controls.css');

                        // include compiled css too.
                        //  not much of it yet.

                        // Will be a separate CSS file, generated upon app start.
                        if (this.css) {
                            each(this.css, (path, serve_as) => {
                                //css.serve(serve_as, path);
                                hd.include_css('/admin/css/' + serve_as);
                            });
                        }
                        
                        var body = hd.body;
                        let o_params = this.params || {};
                        Object.assign(o_params, {
                            'context': server_page_context
                        });
                        //console.log('o_params', o_params);
                        //console.log('this.Ctrl', this.Ctrl);


                        var ctrl = this.ctrl = new Web_Admin_Panel_Control(o_params);
                        ctrl.active();
                        //var ctrl2 = new jsgui.Control({});
                        body.add(ctrl);
                        
                        // it will be a client-side function.

                        // Should not use 'add' here.
                        //  it's the script content.

                        // want to get around that escaping.
                        // options escaping / escape : false

                        hd.include_js('/admin/js/app.js');

                        // Would this be a place to register icons?
                        //  and register client data.

                        // If we have the client data, we merge these items into the context.
                        //  register_context_data
                        //   because the page_context js object won't have been created yet...

                        // create the different statements.
                        //  only put that resources_script in if there is something worth doing.

                        // Or even do the CSS compilation and property removal from the JS file, all at the same time?
                        //  Maybe could do it from reference to the client controls too.

                        // Will work out a fairly simple way to compile together tha CSS.
                        //  May have a few methods available, make use of them in different ways / at different levels.

                        let statement_rsr;
                        let statement_context_data;
                        let statements = [];

                        // Some data will be sent to the client each time.
                        //  Could possibly deliver some kind of token as well to represent the user.

                        // Number of entries in this.app_server.def_resource_publishers

                        if (app_admin.def_resource_publishers) {
                            const c = Object.keys(app_admin.def_resource_publishers).length;
                            if (c > 0) {
                                statement_rsr = `jsgui.register_server_resources(${JSON.stringify(app_admin.def_resource_publishers)});`;
                                statements.push(statement_rsr);
                            }
                        }

                        /*
                        if (context_data) {
                            const c = Object.keys(context_data).length;
                            if (c > 0) {
                                statement_context_data = `jsgui.register_context_data(${JSON.stringify(context_data)});`;
                                statements.push(statement_context_data);
                            }
                        }
                        */

                        if (statements.length > 0) {
                            let resources_script = new jsgui.script({
                                context: server_page_context
                            });
                            const strc = new jsgui.String_Control({
                                context: server_page_context,
                                text: statements.join('')
                            });
                            resources_script.add(strc);
                            body.add(resources_script);
                        }
                        
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
                }

                prepare_app();

                server.start(port, (err, obj_start) => {
                    if (err) {
                        console.log('There was an error starting the server: \n', err);
                    } else {
        
        
                        console.log('Server started on port: ' + port);
                    }
                });

            } else {
                throw 'stop';
            }
        }
    });



    //throw 'stop';

    // Need to add pages etc to the website resource?



    // But then need to have rendering of the content.
    // Then there will be a router within the admin app.


    const start_it = () => {
        server.start(port, (err, obj_start) => {
            if (err) {
                console.log('There was an error starting the server: \n', err);
            } else {


                console.log('Server started on port: ' + port);



                const do_more_post_start = () => {
                    let wr = server.resource_pool.get_resource('Website Resource');
                    //let js = server.resource_pool.get_resource('Website Resource').resource_pool.get_resource('Website JavaScript');
                    console.log('server.resource_pool', server.resource_pool);
                    console.log('wr', wr);
                    throw 'stop';
        
                    server.router.set_route('admin', (req, res) => {
                        const pc = new Server_Page_Context({
                            req: req,
                            res: res
                        });
                
                        
                
                        const hd = new Web_Admin_Page_Control({'context': pc});
                        hd.include_client_css();
                        hd.include_css('/css/basic.css');
                        hd.include_css('/css/controls.css');
                        hd.include_js('/js/app.js');
                
                        // But will need to render the JS for it too.
                
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
                }

    
                
    
            }
        });
    }

    //start_it();

    

    // Route all requests to a single page...
    //  An uncompiled web page?
    //  A generated one?
    //   jsgui HTML generation is a kind of compilation.
    //    could see about abstracting it out as such a bit later on.





    //const web_page = new 


    //server.route.all(web_page);
    // (routes all non-admin)

    // server.admin.route(true)





} else {
    //console.log('required as a module');
}