const Bundler = require('./bundler');
const Bundle = require('./bundle');
const {obs, prom_or_cb} = require('fnl');
const {tof} = require('jsgui3-html');
const fnlfs = require('fnlfs');
const browserify = require('browserify');
const babel = require('@babel/core');
const stream_to_array = require('stream-to-array');
const util = require('util');
const Stream = require('stream');
// Will put the JS together. Maybe images?

// Will put the JS together. Maybe images?
//  Get everything ready to serve.

// Would need a JS file that contains refs to all of the components used.
//  Examine what is in the website and what JS it needs.

// Should be customisable which system gets used to make the bundle.
//  eg babel or esbuild. Browserify still seems to work on code here at least, but esbuild seems better.

// JS bundling will become a bit more advanced in this server. Similar principles.

// JS_Bundler reporting css that gets found while bundling JS would make sense.

// jsgui3-jsbuilder could be a separate project too.
// or jsgui3-js-builder even.


// bundle_css_from_js_file?
// scan_js_file_for_css perhaps.
// scan_js_for_css
//  maybe scan an AST or AST stream as it's coming in.



const bundle_css_from_js = (js_file_path, options = {}) => {

    return obs((next, complete, error) => {

        // Go through each file? Just the first?

        // Or should the whole bundled (browserified) JS be consulted?

    });

}



class CSS_Bundler extends Bundler {
    constructor(spec = {}) {
        super(spec);
    }
}

CSS_Bundler.bundle_css_from_js = bundle_css_from_js;
module.exports = CSS_Bundler;