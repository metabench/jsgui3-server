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
const Evented_Class = jsgui.Evented_Class;

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

const Data_Resource = require("./data-resource");
/*
var is_defined = jsgui.is_defined,
    fp = jsgui.fp,
    stringify = jsgui.stringify,
    tof = jsgui.tof;
*/

/*
var fs2 = require('../../fs/jsgui-node-fs2-core');
var jsgui_jpeg = require('../../image/node/jsgui-node-jpeg');
var jsgui_png = require('../../image/node/jsgui-node-png');
var Worker = require('webworker-threads');
*/

// Could maybe make a website resource as well?

//console.log('2) Site_Images', Site_Images);

// It would publish a web db, I think.
//  A website resource would contain a variety of requests.

// Want to be able to run a website resource serving static files.
//  Don't want too complicated configuration here.

// Does not have the FS resource by default.
//  Can add the FS resource to the website's resource pool.
//  Can just have the resource there, not in the pool, and publish it.
//   Set the resource's security?
//   Resource has security built-in?


class Website_Resource extends Resource {
  constructor(spec) {
    super(spec);

    //console.log('Init website resource');
    //console.log('Website_Resource spec', spec);

    // speck could be a string, such as 'static'

    //var t_spec = tof(spec);
    //console.log('t_spec', t_spec);
    // A website has a resource pool as well.
    //  That means nested resource pools.
    // Server resource pool
    //  Server router
    //  Website resource
    //   Website resource pool
    //    Website router
    // And don't need local server info there?
    //  Connect the local server info back up the resource and resource pool chain?


    // A bit of a special resource here because it has its own resource_pool.

    var resource_pool = new Resource_Pool({
      name: "Website Resource Pool"
    });

    // within a pool?
    //  its own pool?

    this.resource_pool = resource_pool;
    //console.log('this._.resource_pool', this._.resource_pool);
    //throw 'stop';
    // maybe there is not a database.
    var database_spec = spec.database;
    var web_database_resource;

    // Maybe better to specifically add this???
    //  DB resource factory according to spec is cool though.

    // Could use CMS-Resource?


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
    // should set the name of meta when we set this up.
    //  That should be part of the general resource code.
    //console.log('web_database_resource', web_database_resource);
    //console.log('web_database_resource.meta._.name', web_database_resource.meta._.name);
    //console.log('web_database_resource.meta._.name.value()', web_database_resource.meta._.name);
    // So why is the resource pool not indexing it by name
    //throw 'stop';
    if (web_database_resource) {
      resource_pool.add(web_database_resource);
    }

    // use the Database Resource Factory.
    //

    // This needs to have a bunch of other resources inside it.

    // It will also need to handle requests based on the stored content.
    //  Need to be careful about how this is routed, so that the correct resources handle the responses.

    // The website db resource could have a specific entry for a given URL / path.
    //  In that case, we serve that page.

    // Then we check for other situations. Eg /admin, or image directories that get served from disk. Perhaps not images.
    //  Serve the jsgui CSS and JavaScript from disk... it could maybe check to serve particular JSGUI files first.

    // The whole routing will get more complicated, because we will still keep what was the Application_Router, but use it as a Server_Router, or Server_Process_Router perhaps.
    //  When it has routed to a particular application (perhaps the only application), that application's router has a chance to match pages.
    // Will check the DB, and may get info about dynamically generating a page.
    //  May also just get content to serve.

    // PUT, POST requests - also sent by the Server Router to the Application Router.
    // jsgui server could start with a single website resource?
    //  Or, the website resource is in the resource pool.
    //  I think giving each website resource its own resource pool makes the most sense.
    //  Also, encapsulating more in jsgui server would be good. Not needing much code at all in the app itself would be best.

    // Needs to have a router inside it.

    var router = new Router({
      name: "Site Router"
    });

    this.router = router;
    // termorary fix to get/set problem.

    //var router_2 = this.get('router');
    //console.log('router_2', router_2);
    //throw 'stop';

    // May start an admin web resource without a database connection.

    // Maybe there is no web database resource?

    var spec_web_admin = {
      //'web_database': web_database_resource,
      meta: {
        name: "Web Admin"
      }
    };

    if (web_database_resource) {
      spec_web_admin.web_database = web_database_resource;
    }

    //var admin_web_resource = new Resource_Web_Admin(spec_web_admin);

    // Site images resource as well.
    //  The site images will interact with the web db resource, providing an API that deals with image metadata, possibly serving them too.
    //   This is a way of keeping non-db functionality out of the web db module.

    // Images, JavaScript, CSS.
    // Need a Static_HTML resource.

    //console.log('Site_Images', Site_Images);

    // The images resource may need more work.
    //  Need to be able to simply load images / icons into this resource.




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
      // Will need to serve the JavaScript and CSS directories anyway.
      //  They will generally have static content on a dynamic-html website.

      // The static setting means we set up serving HTML from the app's directory.
      //  Only using JSGUI to serve what is there (for the moment)
      //  Potentially jsgui could be used to edit a static site.

      // Set up and use the static HTML resource.

      // Maybe should be set up anyway?
      //  Not always needed!

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
    // Want to maybe set up the js_resource so that it serves static files from a directory.
    // has it set this?
    // Better way of setting custom paths in the future.
    //js_resource.meta.set('custom_paths.js/app☺js', './client/js/app.js');
    //js_resource.meta.set('custom_paths.js/app_bundle☺js', './client/js/app_bundle.js');

    var css_resource = new Site_CSS({
      //'meta': {
      name: "Site CSS",
      pool: resource_pool
      //}
    });


    js_resource.on('extracted-controls-css', str_extracted_css => {

      console.log('website resource has got the extracted controls css from the js: ' + str_extracted_css);

      // serve this as /css/controls.css

      // Give it to the css resource to serve.

      //css_resource.ser

      css_resource.serve_str_css('controls.css', str_extracted_css);






      // Will serve this as controls.css
      //  Separate HTTP request, will get more CSS for the moment.





    })


    // Not so sure about this data resource.
    //  Don't use it for the moment - it's not functional.

    /*
    var data_resource = new Data_Resource({
      //'meta': {
      name: "Site Data",
      pool: resource_pool
      //}
    });
    */
    //resource_pool.push(admin_web_resource);

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
    //router.set_route("data/*", data_resource, data_resource.process);

    // removing /data default path to data resource (which doesn't appear to do much right now)


    //router.set_route('resources/*', data_resource, data_resource.process);

    //let server_pool = this.pool;

    this.map_resource_publishers = this.map_resource_publishers || {};

    //let that = this;

    // always under a /reseources/ url path?
    //  Maybe just want it under the resource name.


    // It could add the path when it publishes a resource.
    //  A particular path could have its route set when its published.

    // Or change the client-side wiring up?
    //  Could include the path of the resource in the def that's sent to the client.

    // Publishing functions / being able to do so, not under the /resources/ path makes a lot of sense.
    //  Intuitively a website arch may not need the /resources/ path.
    //   Be able to set a custom path / route.

    //  A publisher could create a request handler function?

    //  resources maybe will not be set under /resources/.
    //   worth keeping as a default?
    //    does make sense unless a 'path' is specified in the options.
    
    




    // keep this for the moment...


    router.set_route("resources/:resource_name/*", this, (req, res) => {
      //console.log('website router routing resource request');
      //console.log('route_data.params', req.params);
      //let resource_name = req.params.resource_name;
      //console.log('resource_name', resource_name);
      //console.log('req', req);
      let { url, method } = req;
      let s_url = url.split("/");
      //console.log('s_url', s_url);
      let resource_short_name = s_url[2];
      //console.log('resource_short_name', resource_short_name);
      //console.log('Object.keys(req)', Object.keys(req));
      //console.log('req.params', req.params);
      //console.log('url, method', url, method);
      //console.log('resource_name', resource_name);
      // consult the map of published resources
      // or supposed to be encapsulated
      // That is the server resource pool.
      //console.log('this.pool', this.pool);
      // Route it to a server resource?

      //console.log('Object.keys(this.map_resource_publishers)', Object.keys(this.map_resource_publishers));
      //console.log('this', this);

      let resource_publisher = this.map_resource_publishers[resource_short_name];
      //console.log('1) this', this);
      //console.log('1) that', that);
      // that
      //console.log('this.map_resource_publishers', that.map_resource_publishers);
      //console.log('!!resource_publisher', !!resource_publisher);
      //console.trace();

      if (resource_publisher) {
        resource_publisher.handle_http(req, res);
      }
    });
    // The website (admin) resource will make use of the images resource where necessary.
    // The website (admin) resource will be able to get the images resource from the resource pool.
    //router.set_route('admin/*', admin_web_resource, admin_web_resource.process);
    /*
        resource_pool.push(new Site_Images({
            'meta': {
                'name': 'Site Images'
            }
        }));
        */
    // set up the routes.
    if (!is_defined(spec)) spec = {};
    //console.log('pre super');
    //Web_Resource.prototype.init.call(this, spec);
    //this.router = router;
    this.resource_pool = resource_pool;
    //this.set('router', router);
    //this.set('resource_pool', resource_pool);
    // Super call was not working for some reason.
    //this._super(spec);
  }


  // And a schema?

  // name, path, item?
  // Publishing with a set path seems rather important.




  // publish_item_get_fn_req_handler
  //  request handler functions by themselves could be useful.
  //  will make use of the resource publisher (instance).

  // change the default path away from /resources/?
  //  so could create a new handling function for the calls.
  //  not everything would be routed through the /resources/ object


  // publish(item, options)
  //  publish(path, options)


  // Maybe best to change API and how this works here.
  //  /resources/ wont fit in with various API designs, shouldnt be default?
  //  be able to set such a directory though?


  // A new publish function...?
  //  or variety of functions that do the various parts.
  // 

  // publishing_get_fn_http_handler
  //  gets the function (http handler) that will get put in the appropriate route.


  // maybe will redo publishing later. We specifically need the handling function and will add the 
  publishing_get_pub(item) {
    // don't need to name it?
    //  name could already be included in item.

    let pub;
    if (item instanceof jsgui.Resource) {
      pub = new Resource_Publisher({
        resource: item
      });
      //this.map_resource_publishers[published_name] = resource_publisher;

      //item.name = item.name || published_name;
      // add that resource!
      //  (to the pool?)
      //console.log('item', item);
      //this.resource_pool.add(item);

      //console.log('Object.keys(this.map_resource_publishers)', Object.keys(this.map_resource_publishers));
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
    
    // more sig matching where we check for a path?
    //  use of an options object?

    //  worth parsing the signature, looking for specific things.
    //  likely could save some space and make the function clearer.

    //  and automatically publishing the function schema / api, if the function is made with mfp etc?
    //   not for the moment...?

    // or assign its full params.

    // an options object?
    // path, (name?), item

    // ofp applying as plural using multiple keys and values from the options object
    //  not yet. that would be a way of calling the single function.

    // allowing it to take an options object would be very useful.
    //  specifying the name as well as the path?



    // Want to be able to (optionally) choose the full path its published under.
    //  Not (only) published under /resources/name.
    //  More flexibility in creation of the website / service API / structure.

    // single and multi
    //  effectively like arrayify or mapify
    // 1 or multiple args
    // string, whatever
    // Including published info within the HTML document?
    //  Could go there as a comment.
    //  A hidden control may work well.
    // Just as a jsgui property would be fine.
    // Automatic wiring of the services / publishers so that they are available on the client without requiring further plumbing.

    let sig = get_a_sig(arguments),
      a = arguments,
      l = a.length;

    //console.log("a", a);
    //console.log("sig", sig);
    //console.log("l", l);
    //throw 'stop';

    // could use mfp, ofp etc.

    const single = (published_name, item) => {

      // option of 

      console.log("Website_Resource publish", published_name);
      //console.log('published_name, item', published_name, item);
      //this.map_resource_publishers = this.map_resource_publishers || {};
      // .__resource ?
      // instanceof means same version?
      if (item instanceof jsgui.Resource) {
        let resource_publisher = new Resource_Publisher({
          resource: item,
          name: published_name
        });
        this.map_resource_publishers[published_name] = resource_publisher;

        item.name = item.name || published_name;
        // add that resource!
        //  (to the pool?)
        console.log('item', item);
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
            // assuming observable
            // Observable publisher
            //  One way sending...
            //console.log('using Observable_Publisher');
            let obs_pub = new Observable_Publisher({
                obs: item,
                schema: schema
            });
            // or not a resource publisher, an observable publisher.
            //this.map_resource_publishers = this.map_resource_publishers || {};
            this.map_resource_publishers[published_name] = obs_pub;

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

      // Need to give it a name to publish it as

      // server needs a Resource_Publisher.
      //  Some resources include their own publishing.
      //   (existing things like javascript-resource)

      // needs a name

      //this.resource_publisher = this.resource_publisher || new Resource_Publisher({

      //this.resource_pool.map_resource_publishers = resource_publisher;

      // website resource needs the map of resource publishers.

      // Should actually publish within a Website_Resource...
      //  Server holds this.
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



        //console.log('name', name);
        //console.log('rp', rp);
        let def = {
            name: name,
            type: rp.type
        }
        res[name] = def;
        if (rp.type === 'function') {
            if (rp.schema) def.schema = rp.schema;
        }

        /*
        if (rp.type === 'function') {

        }
        if (rp.type === 'observable') {
            
        }
        */

        // look up the def of each of the resource publishers.
        //  could include a little schema with each of the functions to be published.
        //  the observable publisher responds to the observable events.




    })

    return res;
  }

  start(callback) {
    // Need to wait until the database has started.
    //console.log('Website Resource start');
    // start the db / web db resources?
    // start the resource pool?
    var resource_pool = this.resource_pool;
    resource_pool.start(callback);
    //callback(null, true);

    // needs various other resources to have started.

    // check the requirements

    //  check requirements recursive - checks the requirements of everything required, and if they have the check_requirements function, it uses that.
    //   I think using the system of names APIs will help here.

    // The web db resource needs to have been started.

    //throw 'no start function defined for web resource (subclass)'
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
      // Perhaps it's one of the static HTML files?
      //  Could try to process it using static HTML?
      //  Or an internal change / proxy from / to /index.html

      // These will possibly be base level page requests, just looking for the file on disk and serving it.

      // At this point we hand it off to the static HTML processor.
      //  Need some more root directory level handling, but the main processing system is about setting up paths and dealing with parameters.
      //
      // Special case of '/'

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
