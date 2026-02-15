


//var sockjs = require('sockjs'), jsgui = require('jsgui3-html'),
const jsgui = require('jsgui3-client')
const Server_Page_Context = require('./page-context');
jsgui.Server_Page_Context = Server_Page_Context;

//console.log('jsgui.controls', jsgui.controls);

jsgui.controls.Active_HTML_Document = require('./controls/Active_HTML_Document');
// Login = require('../resource/login'),
//console.log('jsgui.controls.Active_HTML_Document', jsgui.controls.Active_HTML_Document);

//var Server = {};

//const Resource_Publisher = require('./publishing/http-resource-publisher');
//jsgui.Resource_Publisher = Resource_Publisher;
const Server = require('./server');
jsgui.Server = Server;
jsgui.serve = Server.serve;
jsgui.Process_Resource = Server.Process_Resource;
jsgui.Remote_Process_Resource = Server.Remote_Process_Resource;
jsgui.HTTP_SSE_Publisher = Server.HTTP_SSE_Publisher;
if (jsgui.Resource) {
    jsgui.Resource.Process = Server.Process_Resource;
    jsgui.Resource.Remote_Process = Server.Remote_Process_Resource;
}
jsgui.fs2 = require('./fs2');

// Admin UI extensibility exports
jsgui.Admin_Module_V1 = Server.Admin_Module_V1;
jsgui.Admin_Auth_Service = Server.Admin_Auth_Service;
jsgui.Admin_User_Store = Server.Admin_User_Store;

// Port utilities for auto-port selection
const port_utils = require('./port-utils');
jsgui.port_utils = port_utils;
jsgui.get_free_port = port_utils.get_free_port;
jsgui.is_port_available = port_utils.is_port_available;

//jsgui.Resource = Resource;
//console.log('pre scs');
//jsgui.Single_Control_Server = require('./single-control-server');
//console.log('3)jsgui', jsgui);

// Make the Resource_Publisher available?

// could load compilers / compiler / compilation resources into jsgui.





module.exports = jsgui;
