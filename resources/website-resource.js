/**
 * Created by James on 29/07/2014.
 */

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

var Site_Images = require("./website-image-resource");

//console.log('1) Site_Images', Site_Images);

var jsgui = require("jsgui3-html");
const { each, get_a_sig, is_defined, tof } = jsgui;

//var Web_Resource = require('./website-resource');
const Resource = jsgui.Resource;
const Router = jsgui.Router;
//const Evented_Class = jsgui.Evented_Class;

var Resource_Pool = require("./server-resource-pool");
//var Resource_Web_Admin = require('../web-admin');

var Site_JavaScript = require("./website-javascript-resource");
//console.log('1) Site_JavaScript', Site_JavaScript);
var Site_CSS = require("./website-css-resource");
var Site_Static_HTML = require("./website-static-html-resource");
//var DB_Web_Resource = require('../../web/db-resource-postgres');
//var database_resource_factory = require('../../db/resource/factory');

const Resource_Publisher = require("../publishing/resource-publisher");
const Observable_Publisher = require("../publishing/observable-publisher");
const Function_Publisher = require("../publishing/function-publisher");
//const Data_Resource = require("./data-resource");

class Website_Resource extends Resource {
  constructor(spec = {}) {
    super(spec);
    // A bit of a special resource here because it has its own resource_pool.
    var resource_pool = new Resource_Pool({
      name: "Website Resource Pool"
    });
    this.resource_pool = resource_pool;
    var database_spec = spec.database;
    var web_database_resource;

    if (database_spec) {
      database_spec.name = database_spec.name || database_spec.database_name;
      var database_resource = database_resource_factory(database_spec);
      database_resource.start();
      // should start automatically when in the pool?
      //  does the pool need to be told to start?
      // Though probably don't want to start the resource on initialization.
      resource_pool.add(database_resource);
      web_database_resource = new DB_Web_Resource({
        database: database_resource,
        meta: {
          name: "Web DB",
          pool: resource_pool
        }
      });
    }

    if (web_database_resource) {
      resource_pool.add(web_database_resource);
    }

    var router = new Router({
      name: "Site Router"
    });

    this.router = router;

    var spec_web_admin = {
      //'web_database': web_database_resource,
      meta: {
        name: "Web Admin"
      }
    };

    if (web_database_resource) {
      spec_web_admin.web_database = web_database_resource;
    }

    var img_resource = new Site_Images({
      //'meta': {
      name: "Site Images",
      pool: resource_pool
      // }
    });

    var js_resource = new Site_JavaScript({
      //'meta': {
      name: "Site JavaScript",
      pool: resource_pool
      //}
    });

    // Also want a static HTML server.
    //  Would serve index.html by default I think???
    //   Probably with the static or simplest settings.

    var static_html_resource;

    if (spec == "static") {
      static_html_resource = new Site_Static_HTML({
        //'meta': {
        name: "Static HTML",
        pool: resource_pool
        //}
      });

      resource_pool.push(static_html_resource);

      // Perhaps set it up with the specific files (automatically)?
      //  Probably with the index.html
    }
    var css_resource = new Site_CSS({
      //'meta': {
      name: "Site CSS",
      pool: resource_pool
      //}
    });


    js_resource.on('extracted-controls-css', str_extracted_css => {
      css_resource.serve_str_css('controls.css', str_extracted_css);
      // Will serve this as controls.css
      //  Separate HTTP request, will get more CSS for the moment.

    });
    // javascript and css resources.
    resource_pool.push(router);
    resource_pool.push(img_resource);
    resource_pool.push(js_resource);
    resource_pool.push(css_resource);
    //resource_pool.push(data_resource);

    // anything ending in .css as well.
    //  Routing maybe wouldn't work like that.
    //router.set_route('*.css', css_resource, css_resource.process);

    router.set_route("css/*", css_resource, css_resource.process);
    router.set_route("js/*", js_resource, js_resource.process);
    // As well as this, it could get the JavaScript resource to serve the JavaScript from the app's js directory.
    js_resource.serve_directory("js");
    router.set_route("img/*", img_resource, img_resource.process);
    router.set_route("images/*", img_resource, img_resource.process);
    this.map_resource_publishers = this.map_resource_publishers || {};
    router.set_route("resources/:resource_name/*", this, (req, res) => {
      let { url, method } = req;
      let s_url = url.split("/");
      let resource_short_name = s_url[2];
      let resource_publisher = this.map_resource_publishers[resource_short_name];
      if (resource_publisher) {
        resource_publisher.handle_http(req, res);
      }
    });
    if (!is_defined(spec)) spec = {};
    this.resource_pool = resource_pool;
  }

  publishing_get_pub(item) {
    let pub;
    if (item instanceof jsgui.Resource) {
      pub = new Resource_Publisher({
        resource: item
      });
    } else {
      // if its a function
      //  return that function call to the response.
      let t_item = typeof item;
      if (t_item === "function") {
        // Function_Call_Publisher
        // could respec this.
        // And the Function_Publisher operates through the Publisher API. Not sure what that is right now though.

        pub = new Function_Publisher({
            fn: item
        });
        //this.map_resource_publishers[published_name] = pub;
        // 
      } else {
        if (item.next && item.complete && item.error) {
          // assuming observable
          // Observable publisher
          //  One way sending...
          //console.log('using Observable_Publisher');
          pub = new Observable_Publisher({
              obs: item
          });
          // or not a resource publisher, an observable publisher.
          //this.map_resource_publishers = this.map_resource_publishers || {};
          //this.map_resource_publishers[published_name] = obs_pub;

          //console.log('2) this', this);
          //console.log('this.map_resource_publishers', this.map_resource_publishers);
          //console.trace();
        } else {
          console.log("item", item);
          throw "Unrecognised item type. Possibly node module versions are wrong / have not been linked fully.";
        }
      }
      //if (item instanceof Evented_Class) {
    }
    return pub;
  }

  // publish within resources?
  publish(published_name, item, schema) {
    let sig = get_a_sig(arguments),
      a = arguments,
      l = a.length;
    const single = (published_name, item) => {
      if (item instanceof jsgui.Resource) {
        let resource_publisher = new Resource_Publisher({
          resource: item,
          name: published_name
        });
        this.map_resource_publishers[published_name] = resource_publisher;

        item.name = item.name || published_name;
        // add that resource!
        //  (to the pool?)
        //console.log('item', item);
        this.resource_pool.add(item);

        //console.log('Object.keys(this.map_resource_publishers)', Object.keys(this.map_resource_publishers));
      } else {
        // if its a function
        //  return that function call to the response.
        let t_item = typeof item;
        if (t_item === "function") {
          // Function_Call_Publisher
          // could respec this.

          // And the Function_Publisher operates through the Publisher API. Not sure what that is right now though.
          //   directly attaching the resource publishers?
          let pub = new Function_Publisher({
              fn: item,
              schema: schema
          });
          this.map_resource_publishers[published_name] = pub;
          // 

        } else {
          if (item.next && item.complete && item.error) {
            let obs_pub = new Observable_Publisher({
                obs: item,
                schema: schema
            });
            this.map_resource_publishers[published_name] = obs_pub;
          } else {
            console.log("item", item);
            throw "Unrecognised item type. Possibly node module versions are wrong / have not been linked fully.";
          }
        }
        //if (item instanceof Evented_Class) {
      }
    };

    if (sig === "[o]") {
        each(a[0], (v, i) => {
            single(i, v);
        })
    } else {

        single(published_name, item);
    }
  }

  get resource_names() {
    //console.log('this.resource_pool', this.resource_pool);
    return this.resource_pool.resource_names;
  }

  get_resource(resource_name) {
    var resource_pool = this.resource_pool;
    //console.log('resource_pool', resource_pool);

    //console.log('this._.resource_pool', this._.resource_pool);

    //throw 'stop';
    return resource_pool.get_resource(resource_name);
  }

  get def_resource_publishers() {
    const res = {};
    each(this.map_resource_publishers, (rp, name) => {

        let def = {
            name: name,
            type: rp.type
        }
        res[name] = def;
        if (rp.type === 'function') {
            if (rp.schema) def.schema = rp.schema;
        }

    })

    return res;
  }

  start(callback) {
    var resource_pool = this.resource_pool;
    resource_pool.start(callback);
  }

  meets_requirements() {
    // Likely will be part of Status

    //return false;

    return true;
  }

  // Needs to be able to process HTTP requests. A bit like the Router in that way.
  process(req, res) {
    //console.log('website process request req.url', req.url);
    //throw 'stop';

    var remoteAddress = req.connection.remoteAddress;
    var router = this.router;
    var res_process = router.process(req, res);
    if (res_process === false) {
      if (req.url === "/") {
        // Send this to the static HTML processing system.

        var static_html_resource = this.resource_pool.get_resource(
          "Static HTML"
        );
        //console.log('static_html_resource', static_html_resource);
        // And lets get the static resource to process it
        if (static_html_resource) {
          static_html_resource.process(req, res);
        }
      } else {
        // show a 404
        res.writeHead(404, {
          "Content-Type": "text/plain"
        });
        res.write("404 Not Found\n");
        res.end();
      }
    }
  }
}

module.exports = Website_Resource;
