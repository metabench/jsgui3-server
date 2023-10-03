// Basically need to split things up into isolated and specific encapsulated pieces of functionality.


// Just need to make the appropriate class names and structures....

// And CSS from JS extraction.
// Maybe even JS from JS.


// Late 2023 - Looks best to retire this one, make it really flexible in terms of what it does internally, with (many?) more classes doing
//   specific things. It looks like ESBuild is the fastest option, may need to mix that with some very specific pieces of functionality
//   for things like splitting / extracting CSS.

// Will identify the various parts of the tasks involved in bundling (and then serving) assets on the web.
//   Will make classes that are named 1st in terms of that they do, but then there will be directories with different implementations
//   of that functionality.

// May well be worth having this link to (require and export) an improved and specific version of the Webpage_Bundler class.






const Bundler = require('./bundler');

const JS_Bundler = require('./js-bundler');
const CSS_Bundler = require('./css-bundler');

const {bundle_css_from_js_str, stream_html_basic_css} = CSS_Bundler;

const Bundle = require('./bundle');
const {obs, prom_or_cb} = require('fnl');
const fnlfs = require('fnlfs');
const {tof, HTML_Document, Client_HTML_Document, Control} = require('jsgui3-html');
const util = require('util');
const Server_Page_Context = require('../../../page-context');
// Will put the JS together. Maybe images?
//  Get everything ready to serve.
const browserify = require('browserify');
const babel = require('@babel/core');
const stream_to_array = require('stream-to-array');

const {bundle_js} = JS_Bundler;
// Observable to load the basic CSS, or return it.


// This may / will be another part of it.
//   Or a specific analysis / css extraction part of the build.





const get_basic_css_content_obj = () => {
    return obs((next, complete, error) => {

        const s_css = stream_html_basic_css();

        const chunks = [];
        let buf_css;

        s_css.once('end', () => {
            // create the final data Buffer from data chunks;
            buf_css = Buffer.concat(chunks);
            complete({
                'value': buf_css,
                'content-type': 'text/css'
            });
            
            // Of course, you can do anything else you need to here, like emit an event!
        });
        
        // Data is flushed from fileStream in chunks,
        // this callback will be executed for each chunk
        s_css.on('data', (chunk) => {
            chunks.push(chunk); // push data chunk to array
        
            // We can perform actions on the partial data we have so far!
        });

    });
}


// /bundlers/webpage/babel-and-browserify


// Webpage_Bundler_Using_Babel_And_Browserify
// Webpage_Bundler_Using_ESBuild


// Multiple steps...
//   Initial step of building to 1 js file, and also extracting other content from the JS, such as CSS.
//   Possibly want to remove that CSS from the JS?
//     Possibly want it in the CSS file rather than the JS.



// Interpret / compile (from) JS?


// Split JS to JS and CSS?
//   And do that with the built (initially built) JS....



// Extract bundle pieces from... js file(s).



// Resource_Transformer???

// JS_To_JS????












const bundle_web_page = (webpage, options = {}) => {


    // But we need specific bundlers that use specific tools internally.



    // Nice here as an obs fn.


    const {content} = webpage;
    let {disk_path_client_js} = options;

    const t_content = tof(content);
    console.log('t_content', t_content);

    return obs((next, complete, error) => {
        const res = new Bundle();
        (async () => {
            const o_basic_css = await get_basic_css_content_obj();
            if (t_content === 'string') {
                const buff = Buffer.from(`<html><head><title>${webpage.title}</title></head><body>${content}</body></html>`, "utf-8");
                res.push({
                    'path': webpage.path,
                    'value': buff,
                    'content-type': 'text/html'
                });
                complete(res);
            } else if (t_content === 'control') {
                if (content instanceof Control) {
                    //console.log('content is control');
                    //console.log('content.constructor.name', content.constructor.name);
                    if (content instanceof HTML_Document) {
                        console.log('content is an html document');
                        // May in fact be much easier.
                        //  Assume already bundled?
                        //    Probably best not to.

                        // Want to have nicely named functions that get called to do things.


    
                        throw 'NYI';
                    } else {
                        const diskpath_js_client = disk_path_client_js || require.resolve('jsgui3-html');
                        res_bundle_js = await bundle_js(diskpath_js_client, {
                            'js_mode': 'mini',
                            'babel': 'mini'
                        });
                        console.log('res_bundle_js', res_bundle_js);
                        throw 'NYI';
    
                        /*
    
                        bundle_js(diskpath_js_client, {
                            'js_mode': 'mini',
                            'babel': 'mini'
                        }, (err, res_bundle_js) => {
                            if (err) {
                                console.trace();
                                throw err;
                            } else {
                                //console.log('res_bundle_js', res_bundle_js);
    
                                // Could search at this point for class.css properties.
                                res.push({
                                    'path': webpage.path + 'js/app.js',
                                    'value': res_bundle_js,
                                    'content-type': 'text/javascript'
                                });
    
                                const spc = new Server_Page_Context({
                                    //request: 
                                });
            
            
                                const doc = new Client_HTML_Document({
                                    context: spc
                                });
                                doc.include_js('/js/app.js');
                                doc.body.add(content);
            
                                // Getting it to load the JS would be nice...
                                //  But maybe only do it automatically if it's an active document.
                                //  If it's just generated JS then best not to bundle JS to load.
            
                                // Could also make smaller bundles for some specific parts of the app. Could improve speed.
                                //console.log('doc.html', doc.html);
                                const buff_html = Buffer.from(doc.html, "utf-8");
                                // But add the client-side stuff to that doc.
            
                                // Remember, this part is about bundling rather than serving.
            
                                res.push({
                                    'path': webpage.path,
                                    'value': buff_html,
                                    'content-type': 'text/html'
                                });
                                //console.log('pre complete bundlejs');
                                //console.log('res.length()', res.length());
                                complete(res);
                            }
                        });
                        */
                        // Need to create a new control
                        //throw 'NYI';
                    }
                } else {
                    throw 'NYI';
                }
            } else if (t_content === 'undefined') {
                const html = `<html><head></head><body></body></html>`;
                const buff = Buffer.from(html, "utf-8");
                res.push({
                    'path': webpage.path,
                    'value': buff,
                    'content-type': 'text/html'
                });
                complete(res);
            } else {
                //console.log('t_content', t_content);
                if (t_content === 'function') {
                    const spc = new Server_Page_Context({
                        //request: 
                    });
                    const Ctrl = content;
                    const ctrl = new Ctrl({
                        'context': spc
                    });
                    if (ctrl instanceof HTML_Document) {

                        // Need way to fix this - it had been working OK before in some cases.

                        /*

                        console.log('ctrl', ctrl);
                        console.trace();
                        throw 'NYI - HTML_Document processing NYI';
                        */

                        const buff_html = Buffer.from(ctrl.render(), "utf-8");
                        res.push({
                            'path': webpage.path,
                            'value': buff_html,
                            'content-type': 'text/html'
                        });
                    } else {
                        console.log('Bundle path A');
                        // is ctrl a Control instance?
                        // Is it a control in some other way?

                        if (ctrl instanceof Control || tof(ctrl) === 'control') {
                            const doc = new Client_HTML_Document({
                                context: spc
                            });
                            doc.include_js('/js/app.js');
                            doc.include_css('/css/app.css');
                            ctrl.active();
                            doc.body.add(ctrl);
                            const buff_html = Buffer.from(doc.html, "utf-8");
                            res.push({
                                'path': webpage.path,
                                'value': buff_html,
                                'content-type': 'text/html'
                            });
                            const diskpath_js_client = disk_path_client_js || require.resolve('jsgui3-html');
                            let waiting_for_css_extraction = false, handle_css_extraction_complete = undefined;
                            const obs_bundle = bundle_js(diskpath_js_client, {
                                'js_mode': 'debug',
                                'babel': 'debug'
                            });
                            obs_bundle.on('next', data => {
                                console.log('next Object.keys(data)', Object.keys(data));
                                const {lang, operation, compress, type, value} = data;
                                if (lang === 'JavaScript') {
                                    if (type === 'single-string') {

                                        // Get the CSS classes (as a JS object) from the JS file.
                                        // Or get them as a CSS file stored in a buffer?
                                        //  Or maybe better they get returned as a 'Bundle' object.

                                        const obs_css_from_js = bundle_css_from_js_str(value);
                                        //console.log('post obs_css_from_js = bundle_css_from_js_str(value) call');
                                        waiting_for_css_extraction = true;
                                        obs_css_from_js.on('next', data => {
                                            console.log('obs_css_from_js next data', data);
                                        });
                                        obs_css_from_js.on('complete', obs_css_from_js_res => {
                                            console.log('obs_css_from_js complete obs_css_from_js_res', obs_css_from_js_res);

                                            if (tof(obs_css_from_js_res) === 'string') {
                                                const basic_and_app_css = Buffer.concat([o_basic_css.value, Buffer.from(obs_css_from_js_res)]);
                                                res.push({
                                                    'path': webpage.path + 'css/app.css',
                                                    'value': basic_and_app_css,
                                                    'content-type': 'text/css'
                                                });
                                                waiting_for_css_extraction = false;
                                                if (handle_css_extraction_complete) {
                                                    handle_css_extraction_complete();
                                                } else {
                                                    console.trace();
                                                    throw 'stop';
                                                }
                                            }
                                        });
                                    }
                                }
                            })

                            obs_bundle.on('complete', res_bundle_js => {
                                const do_when_complete = () => {
                                    console.log('js-bundler bundle is complete');
                                    console.trace();
                                    console.log('res_bundle_js', res_bundle_js);
                                    console.log('res', res);
                                    res.push({
                                        'path': webpage.path + 'js/app.js',
                                        'value': res_bundle_js,
                                        'content-type': 'text/javascript'
                                    });
                                    //throw 'stop';
                                    complete(res);
                                }

                                if (waiting_for_css_extraction) {
                                    handle_css_extraction_complete = do_when_complete;
                                } else {
                                    do_when_complete();
                                }
                            })
                        } else {
                            console.trace();
                            console.log('ctrl', ctrl);
                            throw 'NYI';
                        }
                    }
    
                } else if (false) {
                    console.trace();
                    throw 'NYI';
                } else {
                    console.log('t_content', t_content);
                    console.log('content', content);
                    console.trace();
                    throw 'NYI';
                }
            }
        })().catch(err => {
            console.trace();
            console.log('err', err);

            throw err;
            //console.error(err);
        });

        // The observable could / should return updates along the way, things that contribute to the full result.
        const stop = () => {throw 'NYI'};
        const pause = () => {throw 'NYI'};
        const resume = () => {throw 'NYI'};

        return [stop, pause, resume];
        
    });
    //throw 'NYI';
}

class Webpage_Bundler extends Bundler {
    constructor(spec = {}) {
        super(spec);
    }
}

Webpage_Bundler.bundle_web_page = bundle_web_page;
Webpage_Bundler.prototype.bundle_web_page = bundle_web_page;
Webpage_Bundler.prototype.bundle = bundle_web_page;


module.exports = Webpage_Bundler;