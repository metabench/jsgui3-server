


//var sockjs = require('sockjs'), jsgui = require('jsgui3-html'),
const jsgui = require('jsgui3-html'),
    os = require('os'), http = require('http'),
    Resource = jsgui.Resource,
    Server_Resource_Pool = require('./server-resource-pool'),
    Router = jsgui.Router,
    Website_Resource = require('./website-resource'), Info = require('./local-server-info-resource'),
    Server_Page_Context = require('./page-context');

// Login = require('../resource/login'),
//var Server = {};

const Resource_Publisher = require('./resource-publisher');

//var Login_Html_Resource = Login.Html;
// Test if node features are supported?

// This should be running in node.js

var stringify = jsgui.stringify, each = jsgui.each, arrayify = jsgui.arrayify, tof = jsgui.tof;
var filter_map_by_regex = jsgui.filter_map_by_regex;
var Data_Object = jsgui.Data_Object;
var fp = jsgui.fp, is_defined = jsgui.is_defined;
var Collection = jsgui.Collection;

var exec = require('child_process').exec;

console.log('!!1)jsgui', !!jsgui);

// Should just export the server
//  Other packages can bind things together.
//  Maybe just a jsgui package, holding the server too.

class JSGUI_Server extends jsgui.Data_Object {
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
        //console.log('resource_pool.resources ' + resource_pool.resources);
        //console.log('resource_pool.resources.index_system ' + resource_pool.resources.index_system);
        //console.log('resource_pool.resources.index_system.index_map ', resource_pool.resources.index_system.index_map);
        //throw 'stop';



        // Probably better to have a specific Server_Websockets_Router, likely quite simple.


        /*
        var server_sock_router = new Server_Sock_Router({
            // Should have that name by default

            //'meta': {
            //    'name': 'Server Sock Router'
            //}
        });
        */


        //resource_pool.push(server_sock_router);
        var t_spec = tof(spec);

        // Normally have an object in the spec?
        //  And then set some things up on the website resource...
        //   using the app spec.

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

        /*

        if (this.__type_name === 'server' && t_spec === 'object') {
            // Non-standard. Better to change this.
            //  Could be a shortcut, but we should have a 'routes' object in the spec at least.
            //   Could assume a single website.
            //   Though made it flexible for a reason.

            // .routes would make the most sense in the spec.





            each(spec, (app_spec, route) => {

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
        */
    }

    get resource_names() {
        //console.log('this.resource_pool', this.resource_pool);
        return this.resource_pool.resource_names;
    }



    // Do this under website resource?
    //  May be better that way.

    _publish(server_resource, name) {
        // Need to give it a name to publish it as



        // server needs a Resource_Publisher.
        //  Some resources include their own publishing.
        //   (existing things like javascript-resource)

        // needs a name

        //this.resource_publisher = this.resource_publisher || new Resource_Publisher({
        let resource_publisher = new Resource_Publisher({
            resource: server_resource,
            name: name
        });

        this.map_resource_publishers = this.map_resource_publishers || {};
        this.map_resource_publishers[name] = resource_publisher;

        //this.resource_pool.map_resource_publishers = resource_publisher;

        // website resource needs the map of resource publishers.

        // Should actually publish within a Website_Resource...
        //  Server holds this.









    }

    'start'(port, callback, fnProcessRequest) {
        //throw 'stop';
        // The resource_pool is not just a Data_Value. need to fix some get or create new field value code.
        //console.log('start');
        var rp = this.resource_pool;
        //console.log('rp', rp);
        //console.log('resource_pool ' + stringify(resource_pool));
        //throw 'stop';
        var that = this;
        //console.log('pre start resource pool');
        rp.start(function (err) {
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

                        each(arr_ipv4_addresses, (ipv4_address) => {
                            var http_server = http.createServer(function (req, res) {
                                //console.log('process server request');

                                var server_routing_res = server_router.process(req, res);

                                //console.log('server_routing_res', server_routing_res);

                            });
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





                        //throw 'stop';
                    }
                });

                /*


                var matching = nis.find('entries', {
                    'family': 'IPv4',
                    'internal': false
                });
                //console.log('matching', matching);
                var ipAddresses = [];
                each(matching, function(v, i) {
                    var ipAddress = v.address;
                    ipAddresses.push(ipAddress);
                });
                var application_router = rp.get_resource('Server Router');
                var rt = application_router.routing_tree;
                var map_connections = {};
                var i_connections = 0;
                //console.log('ipAddresses', ipAddresses);
                //throw 'stop';
                //throw 'stop';

                each(ipAddresses, function(ipAddress, i) {
                    var http_server = http.createServer(function(req, res) {
                        //console.log('process server request');

                        var server_routing_res = application_router.process(req, res);

                        //console.log('server_routing_res', server_routing_res);




                    });
                    http_server.timeout = 10800000;
                    if (ipAddress.value) ipAddress = ipAddress.value();
                    //console.log('ipAddress', ipAddress);
                    http_server.listen(port, ipAddress);
                    console.log('* Server running at http://' + ipAddress + ':' + port + '/');

                });
                if (callback) callback(null, true);
                */
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
        each(s_url, function (v, i) {
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
        res.writeHead(200, { 'Content-Type': mime_type });
        res.end(html, 'utf-8');
    }
}

console.log('!!2)jsgui', !!jsgui);

JSGUI_Server.Resource = Resource;
JSGUI_Server.Page_Context = Server_Page_Context;


//Server.JSGUI_Server = JSGUI_Server;

//jsgui.Server = JSGUI_Server;

console.log('!!JSGUI_Server', !!JSGUI_Server);

//jsgui.fs2 = require('./fs2');
//jsgui.Resource = Resource;
//console.log('pre scs');
//jsgui.Single_Control_Server = require('./single-control-server');
//console.log('post scs');
//console.log('3)jsgui', jsgui);

console.log('JSGUI_Server', JSGUI_Server);

module.exports = JSGUI_Server;
