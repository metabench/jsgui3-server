/*
 if (typeof define !== 'function') {
 var define = require('amdefine')(module);
 }

 define(['module', 'path', 'fs', 'url', '../../web/jsgui-html', 'os', 'http', 'url', './resource',
 '../../web/jsgui-je-suis-xml', 'cookies', '../../fs/jsgui-node-fs2-core'],

 function(module, path, fs, url, jsgui, os, http, libUrl,
 Resource, JeSuisXML, Cookies, fs2) {
 */

var libpath = require('path'),
    fs = require('fs'),
    url = require('url'),
    //jsgui = require('jsgui3-html'),
    os = require('os'),
    http = require('http'),
    libUrl = require('url'),
    jsgui = require('jsgui3-html')
    Resource = jsgui.Resource,
    Cookies = require('cookies'),
    fs2 = require('../fs2');


    /*

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
*/
// Extends AutoStart_Resource?

// May need to change around a fair few references to make it workable.
// May need some more complicated logic to change it to the path for service.

const fnl = require('fnl');
const obs_or_cb = fnl.obs_or_cb;

const fnlfs = require('fnlfs');

// Cloud_FS_Resource
// SFTP_FS_Resource


// Publishing an FS resource would enable a directory browsing app.
//  File_Tree, and connect to the client-side Data_Resource.



const {
    is_directory, dir_contents
} = fnlfs;

// This Resource looks to be in a RESTful paradigm. Consider how it would work with GraphQL.

class FS_Resource extends Resource {

    constructor(spec) {
        super(spec);
        //this.meta.set('custom_paths', new Data_Object({}));
        //this.custom_paths = new Data_Object({});


        //this.data = {};

        // want to be able to set specific pieces of data to be available.
        //  This won't be a full DB API, but a starting point for the client-side app to communicate with the server.
        //  It will interact with a data model through this.


        // Could have different types of caching modes too.
        //  Using fnlfs would be useful too.
        //  mmfs as a pluggable substitute

        // fnlfs-pro

        this.root_path = spec.root_path || spec.root;

        // can't go below the root path.
        //  Disallow .. in the given paths.


    }
    // need to promisify this.
    'start' (callback) {
        if (callback) {
            callback(null, true);
        } else {
            return true;
        }
        
    }

    'get' (path, callback) {
        return obs_or_cb((next, complete, error) => {

            (async() => {
                if (await is_directory(path)) {

                    let full_path = libpath.join(this.root_path, path);
                    console.log('full_path', full_path);

                    let contents = await dir_contents(full_path);
                    // however, those are File objects.

                    // try just stringifying them now.
                    //  No need to handle stringifying here.
                    complete(contents);
                } else {
                    // It's a file.
                }
            })();
        });

        // path is a directory, then return a list of the files there (maybe with metadata)
        //  nice if we can optionally turn on mmfs but not include it in jsgui itself because it requires ffmpeg / ffprobe.
        // Could upgrade the FS resource's fs lib.
        // dir or file
        // is_directory(path)

        // If it's a file, then it would return a read stream.


    }
    'set' (path, value, callback) {
        // Overwrite files
    }

    // Delete



    /*
        Does not process HTTP requests itself. Has a Resource_Publisher which contains / refers to this and does the publishing.
    */

    
}

module.exports = FS_Resource;