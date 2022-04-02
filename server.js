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

        if (is_website) {
            const app = this.app = new Website_Resource({
                name: 'Website'
            });
            console.log('app', app);
            resource_pool.add(app);
            server_router.set_route('/*', app, app.process);

        }
    }
    get resource_names() {
        //console.log('this.resource_pool', this.resource_pool);
        return this.resource_pool.resource_names;
    }

    'start'(port, callback, fnProcessRequest) {
        //throw 'stop';
        // The resource_pool is not just a Data_Value. need to fix some get or create new field value code.
        //console.log('start');
        const rp = this.resource_pool;
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
                                https_server.listen(443, ipv4_address);
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