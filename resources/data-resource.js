
var path = require('path'),
    fs = require('fs'),
    url = require('url'),
    jsgui = require('jsgui3-html'),
    os = require('os'),
    http = require('http'),
    libUrl = require('url'),
    Resource = jsgui.Resource,
    Cookies = require('cookies'),
    fs2 = require('../fs2');



var stringify = jsgui.stringify,
    each = jsgui.each,
    arrayify = jsgui.arrayify,
    tof = jsgui.tof;
var filter_map_by_regex = jsgui.filter_map_by_regex;
var Class = jsgui.Class,
    Data_Object = jsgui.Data_Object,
    Enhanced_Data_Object = jsgui.Enhanced_Data_Object;
var fp = jsgui.fp,
    is_defined = jsgui.is_defined;
var Collection = jsgui.Collection;

// Extends AutoStart_Resource?

// May need to change around a fair few references to make it workable.
// May need some more complicated logic to change it to the path for service.


class Data_Resource extends Resource {

    constructor(spec) {
        super(spec);
        //this.meta.set('custom_paths', new Data_Object({}));
        this.custom_paths = new Data_Object({});
        this.data = {};
        // want to be able to set specific pieces of data to be available.
        //  This won't be a full DB API, but a starting point for the client-side app to communicate with the server.
        //  It will interact with a data model through this.
    }
    'start'(callback) {
        callback(null, true);
    }
    'process'(req, res) {
        console.log('Data_Resource processing HTTP request');
        var remoteAddress = req.connection.remoteAddress;
        var custom_paths = this.custom_paths;
        var rurl = req.url;
        var pool = this.pool;
        // should have a bunch of resources from the pool.

        //var pool_resources = pool.resources();
        //console.log('pool_resources ' + stringify(pool_resources));
        var url_parts = url.parse(req.url, true);
        //console.log('url_parts ' + stringify(url_parts));
        var splitPath = url_parts.path.substr(1).split('/');
        //console.log('resource site data splitPath ' + stringify(splitPath));
        if (rurl.substr(0, 1) == '/') rurl = rurl.substr(1);
        rurl = rurl.replace(/\./g, '☺');
        //console.log('rurl ' + rurl);

        if (splitPath.length === 2) {
            if (splitPath[0] === 'data') {
                let key = splitPath[1];
                let value = this.data[key];
                //console.log('value', value);
                let t_val = tof(value);
                //console.log('t_val', t_val);
                if (t_val === 'buffer') {
                    // Encode it as hex / baase64?

                    // Client was expecting text I think.
                    //  We'll get the data to the client, and have a relatively easy way of making server-side data available to the client.

                    // probably best to send back binary data?

                    var mime_type = 'application/octet-stream';
                    //console.log('mime_type ' + mime_type);
                    res.writeHead(200, {
                        'Content-Type': mime_type
                    });
                    res.end(value);
                }
            }
        }
        // Could consult a map of values to send back.
        //  A prefixed map would be fine for some applications.
    }
}


//return Site_CSS;


//});
module.exports = Data_Resource;