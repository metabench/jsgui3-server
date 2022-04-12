const Bundler = require('./bundler');
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

// Maybe some web pages should be unbundlable? Or we note that they are dynamic (somehow).
//  Perhaps another fn should do that check. Don't assume all pages will bundle OK. Could raise obs error if needed.


const bundle_js = (js_file_path, options = {}, callback) => {

    let a = arguments;
    if (typeof a[2] === 'function') {
        callback = a[2];
        options = {
            //'babel': 'mini',
            'include_sourcemaps': true
        };
    }

    return prom_or_cb((resolve, reject) => {
        (async () => {
            // options
            // may want a replacement within the client-side code.
            // Can we call browserify on the code string?
            //  Creating a modified copy of the file would do.
            //  Load the file, modify it, save it under a different name

            let s = new require('stream').Readable(),
                path = require('path').parse(js_file_path);

            let fileContents = await fnlfs.load(js_file_path);
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

            let parts = await stream_to_array(b.bundle());

            const buffers = parts
                .map(part => util.isBuffer(part) ? part : Buffer.from(part));
            let buf_js = Buffer.concat(buffers);
            let str_js = buf_js.toString();

            let babel_option = options.babel
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
            resolve(buf_js);
        })();
    }, callback);
}


const bundle_web_page = (webpage, options) => {
    const {content} = webpage;

    // Then depending on the content type

    const t_content = tof(content);

    console.log('content', content);
    console.log('t_content', t_content);

    return obs((next, complete, error) => {
        const res = new Bundle();

        // The observable could / should return updates along the way, things that contribute to the full result.

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

        } if (t_content === 'control') {
            console.log ('content.context', content.context);
            console.log('content', content);

            // May need to clone this control, putting it into new contexts.
            //  Or render it with a temporary context?

            // Controls with temportary contexts could be useful.



            if (content instanceof Control) {
                console.log('content is control');
                console.log('content.constructor.name', content.constructor.name);
                if (content instanceof HTML_Document) {
                    console.log('content is an html document');
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

                    bundle_js(require.resolve('jsgui3-html'), {}, (err, res_bundle_js) => {
                        if (err) {
                            console.trace();
                            throw err;
                        } else {
                            console.log('res_bundle_js', res_bundle_js);

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
                            console.log('pre complete bundlejs');
                            console.log('res.length()', res.length());
                            complete(res);

                        }
                    });

                    // Need to create a new control

                    //throw 'NYI';
                }
            } else {
                throw 'NYI';
            }


            


        } else {
            throw 'NYI';

            // or error nyi.
        }

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