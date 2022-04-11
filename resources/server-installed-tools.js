

var jsgui = require("jsgui3-html");
const { each, get_a_sig, is_defined, tof } = jsgui;

//var Web_Resource = require('./website-resource');
const Resource = jsgui.Resource;
// Proxy_Server_Resource possibly.
//  Note that the client should be able to access a Proxy_Server_Resource if needed.
//   Could just send request onwards and do same for response.
//    Buffering rate-limiting proxies too though?


//  May help with FirstPoint_Server.

// Could move the publishing parts to Website_Resource_Publisher perhaps.






class Server_Installed_Tools extends Resource {
  constructor(spec = {}) {
    super(spec);
  }
}

module.exports = Server_Installed_Tools;