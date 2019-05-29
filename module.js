


//var sockjs = require('sockjs'), jsgui = require('jsgui3-html'),
const jsgui = require('jsgui3-html')
const Server_Page_Context = require('./page-context');

// Login = require('../resource/login'),
//var Server = {};

const Resource_Publisher = require('./publishing/resource-publisher');

//var Login_Html_Resource = Login.Html;
// Test if node features are supported?
// This should be running in node.js

//JSGUI_Server.Resource = Resource;
//JSGUI_Server.Page_Context = Server_Page_Context;
//Server.JSGUI_Server = JSGUI_Server;

jsgui.Server = require('./server');
//jsgui.Server = JSGUI_Server;

//console.log('!!jsgui.Server', !!jsgui.Server);

jsgui.fs2 = require('./fs2');
//jsgui.Resource = Resource;
//console.log('pre scs');
jsgui.Single_Control_Server = require('./single-control-server');
//console.log('3)jsgui', jsgui);

// Make the Resource_Publisher available?

module.exports = jsgui;
