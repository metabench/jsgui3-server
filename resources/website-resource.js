/**
 * Created by James on 29/07/2014.
 */

// 2022 - Seems a little uncertain about what it is for, and what it does has grown over time.



// A Website abstraction and a Website_Publisher seem like a good way forward.


// Want to make a near future release have a web publishing system that is easier to use as well as more
// powerful.

// Publishing static sites, rendering and compiling.

// Represents (and is?) a website itself, and its representation available through the Resource system.


// Want to get the core resources working and tested.
//  Want to run a clock website / service to start with.
//  The server could have a clock, while clients could connect to it and share the information.
//  Could also experiment with P2P distribution of the data.
//  A clock is also useful because it contains time signals so we can see how long it takes for data to reach various machines.

// A web resource in particular?
// Any need for an HTML resource?
//  Probably not - have web resource handle HTML and websockets.

// Resources could also have events which objects can listen to.
//  Programmatic objects can listen.
//  The resources may broadcast to whatever is listening.

// Also, maintaining one connection stream, communicating with multiple resources - could connect through a Resource Pool, or maybe there
//  could be a Multi Resource Publisher that publishes a bunch of resources.

// The Application router at the moment sending requests to resources.
//  I am thinking that rather than doing that, the requests should be handled by a resource publisher that interacts with the resource and publishes it over HTTP.

// Resources in general won't handle HTTP requests, though they will have the capability.
//  More likely that a resource, when it is served online, will be served using a Resource Publisher (which is itself a resource), which handles HTTP implementation details that would otherwise have
//  to be repeated between resources.

//define(["./jsgui-lang-util", './abstract-resource'], function(jsgui, AR) {

// Do this not with AMD?

// May need Website_Data_Resource
//  Would be configured within the node app, client has maximum autoconfig from connecting to the server, and integration with client-side controls.
//  With the DB admin, it's about returining queries (maybe from RAM) about table data.
//  /data/then the api?

// Respond to both data HTTP requests and websocket connections.

// HTTP data request -> response seems like the most important step now.

// An fs Resource would be of use for file system browser.
//  Could have a client-side fs resource that connects to a veriety of services, could have one that connects to the server-side fs resource.

// Need to connect a data-providing resource to the UI component in cases where it's not secure to do so automatically.
//  It would be much more secure to bring up an NTP provision service automatically than a file system one. Don't want to take that risk now.
//

// Possibly WebPack could be considered such a resource? Or find a different type for that type of resource?

// Compilation_Resource and Compiler_Resource...


// Maybe should do more to represent a website on a server.
// Maybe it needs more docs, being rather critical.




var Site_Images = require("./website-image-resource");

//console.log('1) Site_Images', Site_Images);

var jsgui = require("jsgui3-html");
const { each, get_a_sig, is_defined, tof } = jsgui;

//var Web_Resource = require('./website-resource');
const Resource = jsgui.Resource;
const Router = jsgui.Router;
//const Evented_Class = jsgui.Evented_Class;

const Resource_Pool = require("./server-resource-pool");
//var Resource_Web_Admin = require('../web-admin');

const Site_JavaScript = require("./website-javascript-resource");
//console.log('1) Site_JavaScript', Site_JavaScript);
const Site_CSS = require("./website-css-resource");
const Site_Static_HTML = require("./website-static-html-resource");
//var DB_Web_Resource = require('../../web/db-resource-postgres');
//var database_resource_factory = require('../../db/resource/factory');

const Resource_Publisher = require("../publishing/http-resource-publisher");
const Observable_Publisher = require("../publishing/http-observable-publisher");
const Function_Publisher = require("../publishing/http-function-publisher");
//const Data_Resource = require("./data-resource");

// Proxy_Server_Resource possibly.
//  Note that the client should be able to access a Proxy_Server_Resource if needed.
//   Could just send request onwards and do same for response.
//    Buffering rate-limiting proxies too though?


//  May help with FirstPoint_Server.

// Could move the publishing parts to Website_Resource_Publisher perhaps.



// Maybe worth just having a Website object.
//  Then the Website_Resource can encapsulate that.
//  Website_Resource may be useful in the future to control a Website as a Resource.

// May be better to integrate the website and webpage publishers more fully into the server system.
//  Not clear where they fit in right now.

// Better if this wraps the Website object?

// A Website has its own Website Resource Pool?

// Make Website_Resource into the wrapper that wraps Website?
// Or we don't need that, just use HTTP_Website_Publisher.

// Maybe this won't be necessary in various cases.

// For the moment won't make this website resource do all that much.

class Website_Resource extends Resource {
  constructor(spec = {}) {
    super(spec);
    // A bit of a special resource here because it has its own resource_pool.
    let website;
    if (spec.website) website = spec.website;
    Object.defineProperty(this, 'website', {
      get() {
        return website;
      }
    });

  }

  start(callback) {
    //var resource_pool = this.resource_pool;
    //resource_pool.start(callback);

    callback(null, true);
  }

  meets_requirements() {
    // Likely will be part of Status

    //return false;

    return true;
  }
}

module.exports = Website_Resource;
