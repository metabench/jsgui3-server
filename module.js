


//var sockjs = require('sockjs'), jsgui = require('jsgui3-html'),
const jsgui = require('jsgui3-html')
const Server_Page_Context = require('./page-context');
jsgui.Server_Page_Context = Server_Page_Context;

// Login = require('../resource/login'),
//var Server = {};

const Resource_Publisher = require('./publishing/http-resource-publisher');
jsgui.Resource_Publisher = Resource_Publisher;
jsgui.Server = require('./server');
jsgui.fs2 = require('./fs2');
//jsgui.Resource = Resource;
//console.log('pre scs');
//jsgui.Single_Control_Server = require('./single-control-server');
//console.log('3)jsgui', jsgui);

// Make the Resource_Publisher available?

// could load compilers / compiler / compilation resources into jsgui.





module.exports = jsgui;
