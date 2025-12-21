const Bundler = require('./bundler');
//const Bundle = require('./bundle');
const {obs} = require('fnl');
//const browserify = require('browserify');
//const babel = require('@babel/core');
// Will put the JS together. Maybe images?
const fs = require('fs');
const path = require('path');

const CSS_And_JS_From_JS_String_Extractor = require('../extractors/js/css_and_js/CSS_And_JS_From_JS_String_Extractor');
const {compile_styles} = require('./style-bundler');

const css_and_js_from_js_string_extractor = new CSS_And_JS_From_JS_String_Extractor();

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


// Needs to be able to copy / access the basic.css from jsgui3-html.
//  Maybe be able to find them on disk.

// Streaming does seem like the best meachanism for loading data etc.


const stream_html_basic_css = () => {
    const css_file_path = path.join(path.dirname(require.resolve('jsgui3-html')), 'css', 'basic.css');
    console.log('css_file_path', css_file_path);

    const res_stream = fs.createReadStream(css_file_path);

    return res_stream;

}

const bundle_css_from_js_str = (js_str, options = {}) => {

    //console.log('js_str.length', js_str.length);
    // Moving towards using observables as a matter of course for longer-running functions.

    // Seems like this makes a settimeout as well???


    // OK, but see about also getting the JS without the CSS parts.



    return obs((next, complete, error) => {
        (async () => {
            const res_extract_styles = await css_and_js_from_js_string_extractor.extract(js_str);
            const {css = '', scss = '', sass = '', style_segments = []} = res_extract_styles || {};
            const style_bundle = compile_styles({css, scss, sass, style_segments}, options.style || {});
            complete(style_bundle.css || '');
        })().catch(error);

        const [stop, pause, resume] = [() => {}, () => {}, () => {}];
        return [stop, pause, resume];
    });

}



class CSS_Bundler extends Bundler {
    constructor(spec = {}) {
        super(spec);
    }
}

CSS_Bundler.bundle_css_from_js_str = bundle_css_from_js_str;
CSS_Bundler.stream_html_basic_css = stream_html_basic_css;
module.exports = CSS_Bundler;
