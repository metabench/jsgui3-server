const Bundler = require('./bundler');

const JS_Bundler = require('./js-bundler');
const CSS_Bundler = require('./css-bundler');

const {bundle_css_from_js_str} = CSS_Bundler;

const Bundle = require('./bundle');
const {obs, prom_or_cb} = require('fnl');
const fnlfs = require('fnlfs');
const {tof, HTML_Document, Client_HTML_Document, Control} = require('jsgui3-html');
const util = require('util');
const Server_Page_Context = require('./../page-context');
// Will put the JS together. Maybe images?
//  Get everything ready to serve.
const browserify = require('browserify');
const babel = require('@babel/core');
const stream_to_array = require('stream-to-array');


// Bundling maybe would not be proper SSR sometimes.
//  SSR is needed when the server needs to generate the specific info to start the page with.
//   However, specific info could be quickly updated too.
//   In many cases bundling would be more efficient that per-page SSR.






// Maybe some web pages should be unbundlable? Or we note that they are dynamic (somehow).
//  Perhaps another fn should do that check. Don't assume all pages will bundle OK. Could raise obs error if needed.

// Bundling CSS from a JS page.

// const bundle_js_to_css


// Maybe best to move to a JS Bundler.

// CSS bundler too
//  Could consult JS source files. Could use the JS bundler to get css from JS.

// Creating working bundles from JS (and other) source files seems like an important task.

const {bundle_js} = JS_Bundler;


const bundle_web_page = (webpage, options = {}) => {
    const {content} = webpage;
    //console.log('bundle web page');
    //console.log('webpage', webpage);
    //console.trace();


    // What if there is no content in the webpage?

    let {disk_path_client_js} = options;
    //console.log('disk_path_client_js', disk_path_client_js);


    // Could use the CSS bundler to extract the css from the JS.



    // Could look for the css within disk_path_client_js.


    //if (options.js_client) js_client_disk_path = 

    // Then depending on the content type
    

    const t_content = tof(content);

    //console.log('content', content);
    //console.log('t_content', t_content);

    //console.log('');

    //console.log('pre return obs');
    //console.trace();

    return obs((next, complete, error) => {
        const res = new Bundle();


        (async () => {

            if (t_content === 'string') {
                // Hardly anything to bundle. No JS required, so it seems.
                // Maybe put it inside a basic JSGUI page control...?
    
                // Page may still have a title.
                const html = `<html><head><title>${webpage.title}</title></head><body>${content}</body></html>`;
                const buff = Buffer.from(html, "utf-8");
    
                // and value with different types of compression....
                //  worth having them ready.
                res.push({
                    'path': webpage.path,
                    'value': buff,
                    'content-type': 'text/html'
                });
                complete(res);
    
            } else if (t_content === 'control') {
                //console.log ('content.context', content.context);
                //console.log('content', content);
    
                // May need to clone this control, putting it into new contexts.
                //  Or render it with a temporary context?
    
                // Controls with temportary contexts could be useful.
                if (content instanceof Control) {
                    //console.log('content is control');
                    //console.log('content.constructor.name', content.constructor.name);
                    if (content instanceof HTML_Document) {
                        console.log('content is an html document');
    
                        throw 'NYI';
                    } else {
    
                        // create an HTML document
                        //  then put this control (or a clone of it) inside that HTML document.
    
                        // We may be changing the construction / rendering order here.
                        //  Seem to be doing more construction of controls without a Page_Context.
                        //   That page_context may only be important at a later stage.
    
                        // Some pages will render differently depending on when they are rendered.
                        //  That may be why a server would need to individually build each page.
                        //  Eg if there is SSR of latest news items.
    
                        // Question of pre-rendering or rendering on each page request.
                        //  Maybe we don't bundle it if it includes dynamic content.
                        //   Though we would need to bundle the JS.
    
                        // Could create a new page context.
    
                        //const cloned_content = content.clone();
    
                        // Should be able to clone a control?
    
                        //console.log('cloned_content', cloned_content);
    
                        // The page context may not have a request and response.
                        //  For bundling, won't have one (unless one were made).
    
                        // Creating the JS bundle...
    
                        // Make it require jsgui-html for the moment.
                        //  Requiring specific JS of the client control may make more sense....
    
                        // First let's bundle the JS.
                        //  Or get the JS bundle for 'jsgui3-html'.
    
                        // js.serve_package('/js/app.js', js_client, o_serve_package, (err, served) => {
                        //  maybe should make a JS_Bundler class.
    
                        // May need to be told earlier what file path we are using for the client js bundle.
    
                        const diskpath_js_client = disk_path_client_js || require.resolve('jsgui3-html');
                        //const diskpath_js_client = require.resolve('./../controls/page/admin.js');
    
                        // Bundle js could be an observable
                        //  So when it finds CSS, it can output that.
                        //  A Control's CSS property, within the JS definition.
                        //   That can be output to a CSS file, copied or removed from the JS file.

                        // js_mode debug
    
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
                // Hardly anything to bundle. No JS required, so it seems.
                // Maybe put it inside a basic JSGUI page control...?
    
                // Page may still have a title.
                const html = `<html><head></head><body></body></html>`;
                const buff = Buffer.from(html, "utf-8");
    
                // and value with different types of compression....
                //  worth having them ready.
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
    

                    // Or from a different chain maybe? Seems unorganised that way.
                    
                    if (ctrl instanceof HTML_Document) {
                        console.trace();
                        throw 'NYI';
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
        
                            // Getting it to load the JS would be nice...
                            //  But maybe only do it automatically if it's an active document.
                            //  If it's just generated JS then best not to bundle JS to load.
        
                            // Could also make smaller bundles for some specific parts of the app. Could improve speed.
                            //console.log('doc.html', doc.html);
                            const buff_html = Buffer.from(doc.html, "utf-8");
        
                            res.push({
                                'path': webpage.path,
                                'value': buff_html,
                                'content-type': 'text/html'
                            });


                            const diskpath_js_client = disk_path_client_js || require.resolve('jsgui3-html');

                            let waiting_for_css_extraction = false, handle_css_extraction_complete = undefined;


                            //const diskpath_js_client = require.resolve('./../controls/page/admin.js');

                            // debug mode


                            const obs_bundle = bundle_js(diskpath_js_client, {
                                'js_mode': 'debug',
                                'babel': 'debug'
                            });




                            obs_bundle.on('next', data => {
                                //console.log('next data', data);
                                console.log('next Object.keys(data)', Object.keys(data));

                                // at this point, could go through the js to extract any CSS.

                                const {lang, operation, compress, type, value} = data;

                                if (lang === 'JavaScript') {
                                    if (type === 'single-string') {

                                        // Get the CSS classes (as a JS object) from the JS file.
                                        // Or get them as a CSS file stored in a buffer?
                                        //  Or maybe better they get returned as a 'Bundle' object.

                                        const obs_css_from_js = bundle_css_from_js_str(value);
                                        console.log('post obs_css_from_js = bundle_css_from_js_str(value) call');

                                        waiting_for_css_extraction = true;

                                        obs_css_from_js.on('next', data => {
                                            console.log('obs_css_from_js next data', data);
                                        });
                                        obs_css_from_js.on('complete', obs_css_from_js_res => {


                                            console.log('obs_css_from_js complete obs_css_from_js_res', obs_css_from_js_res);

                                            if (tof(obs_css_from_js_res) === 'string') {
                                                // should be added to the page bundle.

                                                res.push({
                                                    'path': webpage.path + 'css/app.css',
                                                    'value': Buffer.from(obs_css_from_js_res),
                                                    'content-type': 'text/css'
                                                });

                                                waiting_for_css_extraction = false;
                                                console.log('obs_css_from_js complete');

                                                if (handle_css_extraction_complete) {
                                                    handle_css_extraction_complete();
                                                } else {
                                                    console.trace();
                                                    throw 'stop';
                                                }

                                            }

                                                //console.log('tof(res)', tof(res));
                                                //throw 'stop';
                                            

                                        });






                                    }
                                }

                            })

                            obs_bundle.on('complete', res_bundle_js => {
                                // the result object is a buffer.
                                //  maybe it should be a Bundle.

                                // Should only be considered complete once css extraction from js is complete (incl if nothing gets extracted).

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


                                //console.log('complete res', res);
                                //console.trace();
                                //throw 'stop';

                            })


                        } else {
                            console.trace();
                            console.log('ctrl', ctrl);
                            throw 'NYI';
                        }

                        // better to render the HTML document (control) first?



                        



                        const old = () => {
                            bundle_js(diskpath_js_client, {
                                'js_mode': 'mini',
                                'babel': 'mini'
                            }, (err, res_bundle_js) => {
                                if (err) {
                                    console.trace();
                                    throw err;
                                } else {
                                    //console.log('res_bundle_js', res_bundle_js);
        
                                    res.push({
                                        'path': webpage.path + 'js/app.js',
                                        'value': res_bundle_js,
                                        'content-type': 'text/javascript'
                                    });
        
                                    const doc = new Client_HTML_Document({
                                        context: spc
                                    });
                                    doc.include_js('/js/app.js');
                                    doc.body.add(ctrl);
                
                                    // Getting it to load the JS would be nice...
                                    //  But maybe only do it automatically if it's an active document.
                                    //  If it's just generated JS then best not to bundle JS to load.
                
                                    // Could also make smaller bundles for some specific parts of the app. Could improve speed.
                                    //console.log('doc.html', doc.html);
                                    const buff_html = Buffer.from(doc.html, "utf-8");
                
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

            throw 'err';
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

module.exports = Webpage_Bundler;