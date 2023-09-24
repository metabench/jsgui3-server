// Bundler could be moved to with resource / resource processor / publisher.
// Maybe a bunder is a type of resource publisher or should be used by it.





const Bundler = require('./bundler');
const Bundle = require('./bundle');
const {obs, prom_or_cb} = require('fnl');
const {tof} = require('jsgui3-html');
const fnlfs = require('fnlfs');

// May want a more base JS_Bundler class, and then subclasses will use specific modules like Babel or ESBuild to bundle.
//  That way can go for nice defaults and provide flexibility too. Plus interchangability of some inner components, eg if someone
//



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




// A JS Bundler or JS Packager class will probably be best.

// This seems more like a babel specific JS Bundler.
// Or even compiler???
// Source_Compiler????

// Giving the classes simple and intuitive APIs, allowing for them to be nicely interchangable.







const bundle_js = (js_file_path, options = {}, callback) => {

    // Could even split a file into its server and client components.
    // Maybe providing found css would work well here.



    // Returning an observable and not using a callback would work best.

    const res = obs((next, complete, error) => {



        let a = arguments;
        if (typeof a[2] === 'function') {
            callback = a[2];

            options.include_sourcemaps = true;
        }

        (async () => {
            // options
            // may want a replacement within the client-side code.
            // Can we call browserify on the code string?
            //  Creating a modified copy of the file would do.
            //  Load the file, modify it, save it under a different name

            let s = new Stream.Readable(),
                path = require('path').parse(js_file_path);

            let fileContents = await fnlfs.load(js_file_path);


            // Maybe do that post browserify - can read through whole thing to find the css template literals.

            // Could use the CSS bundler to scan_js_for_css
            //  Seems as though it would be best as an observable.


            // Could first get own system AST of the JS file.

            // Modify the original file contents so that only client-side parts appear?
            //  Could be done by programatically removing a whole code block, what to do if it is run on the server.


            //console.log('1) fileContents.length', fileContents.length);
            // are there any replacements to do?
            // options.replacements

            

            if (options.js_mode === 'debug') {
                options.include_sourcemaps = true;
            }
            if (options.js_mode === 'compress' || options.js_mode === 'mini') {
                options.include_sourcemaps = false;
                options.babel = 'mini';
            }

            //console.log('options.babel', options.babel);

            if (options.replace) {
                let s_file_contents = fileContents.toString();
                //console.log('s_file_contents', s_file_contents);
                each(options.replace, (text, key) => {
                    //console.log('key', key);
                    //console.log('text', text);
                    let running_fn = '(' + text + ')();'
                    //console.log('running_fn', running_fn);
                    s_file_contents = s_file_contents.split(key).join(running_fn);
                })
                fileContents = Buffer.from(s_file_contents);
                //console.log('2) fileContents.length', fileContents.length);
            }
            // Then we can replace some of the file contents with specific content given when we tall it to serve that file.
            //  We have a space for client-side activation.
            s.push(fileContents);
            s.push(null);

            //let include_sourcemaps = true;

            let b = browserify(s, {
                basedir: path.dir,
                //builtins: false,
                builtins: ['buffer', 'process'],
                'debug': options.include_sourcemaps
            });

            // May be able to better put the bundle stream info into the observable results.
            //  Browserify gets given the stream.

            // Nice if this function could output a stream as well.


            let parts = await stream_to_array(b.bundle());

            const buffers = parts
                .map(part => util.isBuffer(part) ? part : Buffer.from(part));
            let buf_js = Buffer.concat(buffers);
            let str_js = buf_js.toString();

            next({
                'lang': 'JavaScript',
                'operation': 'bundle',
                'compress': false,
                'type': 'single-string',
                'value': str_js
            });

            // full browserified (client) js app.

            let babel_option = options.babel


            // could send str_js to a CSS extractor / bundler.


            //console.log('babel_option', babel_option);
            if (babel_option === 'es5') {

                let o_transform = {
                    "presets": [
                        "es2015",
                        "es2017"
                    ],
                    "plugins": [
                        "transform-runtime"
                    ] //,
                    //'sourceMaps': 'inline'
                };

                if (options.include_sourcemaps) o_transform.sourceMaps = 'inline';
                let res_transform = babel.transform(str_js, o_transform);
                //console.log('res_transform', res_transform);
                //console.log('Object.keys(res_transform)', Object.keys(res_transform));
                let jst_es5 = res_transform.code;
                //let {jst_es5, map, ast} = babel.transform(str_js);
                //console.log('jst_es5.length', jst_es5.length);
                buf_js = Buffer.from(jst_es5);
            } else if (babel_option === 'mini') {
                /*
                let o_transform = {
                    presets: ["minify"]//,
                    //'sourceMaps': 'inline'
                };
                */
                let o_transform = {
                    "presets": [
                        ["minify", {
                            //"mangle": {
                            //"exclude": ["MyCustomError"]
                            //},
                            //"unsafe": {
                            //	"typeConstructors": false
                            //},
                            //"keepFnName": true
                        }]
                    ],
                    //plugins: ["minify-dead-code-elimination"]
                };
                if (options.include_sourcemaps) o_transform.sourceMaps = 'inline';
                let res_transform = babel.transform(str_js, o_transform);
                buf_js = Buffer.from(res_transform.code);
            } else {
                buf_js = Buffer.from(str_js);
            }
            complete(buf_js);
        })();

    })
    if (callback) {
        res.on('complete', (value) => {
            callback(null, value);
        });
        res.on('error', err => {
            callback(err);
        })
    } else {
        return res;
    }
    // An observable would be better as result could include status messages (with their timings).

    //return prom_or_cb((resolve, reject) => {
        
    //}, callback);
}

class JS_Bundler extends Bundler {
    constructor(spec = {}) {
        super(spec);
    }
}

JS_Bundler.bundle_js = bundle_js;
module.exports = JS_Bundler;