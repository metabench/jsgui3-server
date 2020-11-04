//var sockjs = require('sockjs'), jsgui = require('jsgui3-html'),
const jsgui = require('jsgui3-html'),
os = require('os'),
http = require('http'),
https = require('https'),
Resource = jsgui.Resource,
Server_Resource_Pool = require('./resources/server-resource-pool'),
{each, Evented_Class} = require('lang-mini');

// routing-tree? make a generalised module?

Router = jsgui.Router,
Website_Resource = require('./resources/website-resource'),
Info = require('./resources/local-server-info-resource'),
Server_Page_Context = require('./page-context');

// Login = require('../resource/login'),
//var Server = {};

//const Resource_Publisher = require('./resource-publisher');
//var Login_Html_Resource = Login.Html;
// Test if node features are supported?
// This should be running in node.js

const {each, tof} = jsgui;

/*
var stringify = jsgui.stringify,
    each = jsgui.each,
    arrayify = jsgui.arrayify,
    tof = jsgui.tof;
var filter_map_by_regex = jsgui.filter_map_by_regex;
var Data_Object = jsgui.Data_Object;
var fp = jsgui.fp,
    is_defined = jsgui.is_defined;
var Collection = jsgui.Collection;
*/

//var exec = require('child_process').exec;

//console.log('!!1)jsgui', !!jsgui);

// Should just export the server
//  Other packages can bind things together.
//  Maybe just a jsgui package, holding the server too.

// Make Server a resouce too?
//  So it could be accessed (including logs) by the right connected admin users.

class JSGUI_Server extends Evented_Class {
    constructor(spec, __type_name) {
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

        var server_router = new Router({
            // Should have that name by default
            // 'meta': {
            //    'name': 'Server Router'
            //}
            'name': 'Server Router',
            'pool': resource_pool
        });
        this.server_router = server_router;
        // Not being added properly. It seems to get put inside a Data_Object.
        //  Want object to be held in collections directly, not having to be nested within anything else.
        //console.log('resource_pool.resources ' + resource_pool.resources);
        //console.log('resource_pool.resources.index_system ' + resource_pool.resources.index_system);
        // index_system
        //console.log('pre resource_pool.push');
        resource_pool.add(server_router);
        //var t_spec = tof(spec);

        // Normally have an object in the spec?
        //  And then set some things up on the website resource...
        //   using the app spec.

        if (spec.https_options) {
            this.https_options = spec.https_options;
        }

        if (spec.routes) {
            each(spec.routes, (app_spec, route) => {

                // No, they are not all resources?
                //  Or different when it's a single control server.
                // Create a new Application Resource.
                //console.log('app_spec', app_spec);

                var app = this.app = new Website_Resource(app_spec);

                // could have multiple apps?
                //console.log('app', app);
                //throw 'stop';
                resource_pool.add(app);
                server_router.set_route(route, app, app.process);

                // And set it to that route in the routing table.
            })
        }
    }

    get resource_names() {
        //console.log('this.resource_pool', this.resource_pool);
        return this.resource_pool.resource_names;
    }


    // could change this to an mfp function.
    //  raises events as different parts start.


    // logging mfp function?
    
    // another functional level for logging?
    //  callee.log?
    //  mfp does not have logging specific features. may be worth getting logging more sorted out on the
    //   inner functions of the multi-observables.

    


    'start'(port, callback, fnProcessRequest) {
        //throw 'stop';
        // The resource_pool is not just a Data_Value. need to fix some get or create new field value code.
        //console.log('start');
        const rp = this.resource_pool;
        //console.log('rp', rp);
        //console.log('resource_pool ' + stringify(resource_pool));
        //throw 'stop';
        //var that = this;
        //console.log('pre start resource pool');
        rp.start(err =>  {
            if (err) {
                throw err;
            } else {
                //console.log('jsgui-server resource pool started');
                var lsi = rp.get_resource('Local Server Info');
                //console.log('lsi', (lsi));
                //console.log('rp', rp);

                var resource_names = rp.resource_names;
                //console.log('resource_names', resource_names);
                //throw 'stop';

                var js = rp.get_resource('Site JavaScript');

                //console.log('js', js);
                //throw 'stop';
                var css = rp.get_resource('Site CSS');

                // Where to compile the CSS from the controls we were given?
                //  Maybe need to do that in the client module?
                //  Could see where it can be done within server module.



                var images = rp.get_resource('Site Images');
                var audio = rp.get_resource('Site Audio');

                var login = rp.get_resource('Login HTML Resource');
                // An HTML resource may be changed to a Resource Publisher + Resource Client.
                //  The Resource itself should be separate from the transport mechanism used to access it.

                var admin = rp.get_resource('Web Admin');
                //var resource_publisher = rp.get_resource('HTTP Resource Publisher');
                var sock_router = rp.get_resource('Server Sock Router');

                var server_router = rp.get_resource('Server Router');
                // .get on a resource.
                //  could get a sub-resource.

                // The nis could be a Collection, indexed by name.

                //var nis = lsi.nis;

                //console.log('nis', nis);

                lsi.get('net', (err, net) => {
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
                                //if (ipAddress.value) ipAddress = ipAddress.value();
                                //console.log('ipAddress', ipAddress);
                                https_server.listen(443, ipv4_address);
                                //http_server.listen(port, ipv4_address);
                                //console.log('* Server running at https://' + ipv4_address + ':' + 443 + '/');
                                num_to_start--;
                                //console.log('num_to_start', num_to_start);
                                if (num_to_start === 0) {
                                    callback(null, true);
                                }
                            });

                        } else {
                            each(arr_ipv4_addresses, (ipv4_address) => {
                                var http_server = http.createServer(function (req, res) {
                                    //console.log('process server request');
                                    var server_routing_res = server_router.process(req, res);
                                    //console.log('server_routing_res', server_routing_res);
                                });
                                // server could have been given https options
                                http_server.timeout = 10800000;
                                //if (ipAddress.value) ipAddress = ipAddress.value();
                                //console.log('ipAddress', ipAddress);
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
        // check to see if the 1st word in the path is 'admin'.
        //  Then if it is, we'll be giving something to an admin route.
        // And if it is within the admin path, then
        var url = req.url;
        //console.log('*** server process_request url ' + url);
        var s_url = url.split('/');
        //console.log('s_url ' + stringify(s_url));

        var a_path = [];
        each(s_url, (v, i) => {
            if (v.length > 0) {
                a_path.push(v);
            }
        });

        //var spc = new Server_Page_Context(req, res);
        /*
        var spc = new Server_Page_Context({
            'req': req,
            'res': res
        });
        */

        var router = this.get('router');
        // and will have a separate router for the websocket requests.
        // then that should be able to understand things about the browser from the user agent string.
        //console.log('a_path ' + stringify(a_path));

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

JSGUI_Server.Resource = Resource;
JSGUI_Server.Page_Context = Server_Page_Context;
JSGUI_Server.Server_Page_Context = Server_Page_Context;
JSGUI_Server.Website_Resource = Website_Resource;

module.exports = JSGUI_Server;