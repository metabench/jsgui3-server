


//var sockjs = require('sockjs'), jsgui = require('jsgui3-html'),
const jsgui = require('jsgui3-html')
const Server_Page_Context = require('./page-context');

// Login = require('../resource/login'),
//var Server = {};

const Resource_Publisher = require('./publishing/resource-publisher');
jsgui.Server = require('./server');
jsgui.fs2 = require('./fs2');
//jsgui.Resource = Resource;
//console.log('pre scs');
jsgui.Single_Control_Server = require('./single-control-server');
//console.log('3)jsgui', jsgui);

// Make the Resource_Publisher available?

module.exports = jsgui;
