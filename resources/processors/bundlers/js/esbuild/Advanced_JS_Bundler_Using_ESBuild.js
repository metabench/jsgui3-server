// Advanced in terms of being able to split CSS and JS from JS.
const {obs} = require('fnl');
const esbuild = require('esbuild')
const Core_JS_Non_Minifying_Bundler_Using_ESBuild = require('./Core_JS_Non_Minifying_Bundler_Using_ESBuild');
const Bundler_Using_ESBuild = require('./Bundler_Using_ESBuild');
const {is_array} = require('lang-tools');

const Core_JS_Single_File_Minifying_Bundler_Using_ESBuild = require('./Core_JS_Single_File_Minifying_Bundler_Using_ESBuild');
const JSGUI3_HTML_Control_Optimizer = require('./JSGUI3_HTML_Control_Optimizer');

//const CSS_Extractor = require('./_Old_CSS_Extractor');

// Use a different CSS extractor.


const Bundle = require('../../bundle');

const CSS_And_JS_From_JS_String_Extractor = require('../../../extractors/js/css_and_js/CSS_And_JS_From_JS_String_Extractor');
const {compile_styles} = require('../../style-bundler');

const await_bundle_observable = (bundle_result) => {
    if (!bundle_result || typeof bundle_result.on !== 'function') {
        return Promise.resolve(bundle_result);
    }

    const normalize_result = (value) => {
        if (Array.isArray(value)) return value;
        if (value && value._arr) return [value];
        return value;
    };

    return new Promise((resolve, reject) => {
        let settled = false;
        const settle_once = (settle_fn, value) => {
            if (settled) return;
            settled = true;
            settle_fn(value);
        };

        bundle_result.on('error', (error) => settle_once(reject, error));
        bundle_result.on('next', (value) => settle_once(resolve, normalize_result(value)));
        bundle_result.on('complete', (value) => settle_once(resolve, normalize_result(value)));
    });
};


class Advanced_JS_Bundler_Using_ESBuild extends Bundler_Using_ESBuild {
    constructor(spec = {}) {
        super(spec);

        if (spec.debug !== undefined) this.debug = spec.debug;

        // Store bundler configuration
        this.bundler_config = spec.bundler || {};

        // Enable elimination by default, while preserving explicit opt-out.
        const raw_elimination_config = this.bundler_config.elimination;
        if (raw_elimination_config === false) {
            this.elimination_config = {enabled: false};
        } else if (raw_elimination_config && typeof raw_elimination_config === 'object') {
            this.elimination_config = raw_elimination_config;
        } else {
            this.elimination_config = {};
        }
        const style_config = spec.style || this.bundler_config.style || {};
        this.style_config = Object.assign({debug: this.debug === true}, style_config);

        //this.css_extractor = new CSS_Extractor();


        this.non_minifying_bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild({
            debug: this.debug,
            sourcemaps: this.bundler_config.sourcemaps
        });


        this.css_and_js_from_js_string_extractor = new CSS_And_JS_From_JS_String_Extractor();


        // Probably don't use that minifying bundler in debug mode.
        this.minifying_js_single_file_bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
            minify: this.bundler_config.minify
        });

        const control_elimination_config = this.elimination_config.jsgui3_html_controls || {};
        const elimination_enabled = this.elimination_config.enabled !== false;
        const control_elimination_enabled = elimination_enabled &&
            control_elimination_config.enabled !== false;

        if (control_elimination_enabled) {
            const cache_config = control_elimination_config.cache && typeof control_elimination_config.cache === 'object'
                ? control_elimination_config.cache
                : {};
            this.jsgui3_html_control_optimizer = new JSGUI3_HTML_Control_Optimizer({
                package_name: control_elimination_config.package_name || 'jsgui3-html',
                emit_manifest: control_elimination_config.emit_manifest === true,
                allow_dynamic_controls: control_elimination_config.allow_dynamic_controls === true,
                include_controls: control_elimination_config.include_controls,
                exclude_controls: control_elimination_config.exclude_controls,
                cacheEnabled: cache_config.enabled !== false,
                sharedCache: cache_config.shared !== false,
                log: control_elimination_config.log === true,
                manifest_dir: control_elimination_config.manifest_dir,
                shim_dir: control_elimination_config.shim_dir
            });
        } else {
            this.jsgui3_html_control_optimizer = null;
        }

    }

    bundle(js_file_path) {
        const {
            non_minifying_bundler,
            css_and_js_from_js_string_extractor,
            minifying_js_single_file_bundler,
            style_config,
            jsgui3_html_control_optimizer
        } = this;

        // Validate input
        if (typeof js_file_path !== 'string' || js_file_path.trim() === '') {
            throw new Error('bundle() expects a valid file path string');
        }

        // Maybe this should get them positioned absolutely when removed from the grid?
        //   But then what about the space they leave?

        // This is just a simple principle demo though.
        //   Maybe want a simple and explicit option to change behaviour like I specify.



        const res_obs = obs(async(next, complete, error) => {

            try {
            //console.log('Advanced_JS_Bundler_Using_ESBuild bundle js_file_path:', js_file_path);

            let entry_build_overrides = {};
            let control_scan_manifest = null;

            if (jsgui3_html_control_optimizer) {
                const optimization_result = await jsgui3_html_control_optimizer.optimize(js_file_path);
                if (optimization_result && optimization_result.enabled && optimization_result.plugin) {
                    entry_build_overrides.plugins = [optimization_result.plugin];
                }
                if (optimization_result && optimization_result.manifest) {
                    control_scan_manifest = optimization_result.manifest;
                }
            }

            const res_nmb = await await_bundle_observable(
                non_minifying_bundler.bundle(js_file_path, entry_build_overrides)
            );

            //console.log('res_nmb', res_nmb);

            if (res_nmb.length === 1) {
                const js_bundle = res_nmb[0];
                const js_bundle_arr = js_bundle._arr;
                if (js_bundle_arr) {
                    if (js_bundle_arr.length === 1) {
                        const bundle_item = js_bundle_arr[0];
                        //console.log('bundle_item', bundle_item);

                        if (bundle_item.type === 'JavaScript') {

                            // But in debug mode don't minify it.
                            //   Maybe create and add the sourcemap here instead....?

                            const {text} = bundle_item;
                            // Then use the css and js from js extractor.

                            const res_extract_styles_and_js = await css_and_js_from_js_string_extractor.extract(text);
                            const {
                                css = '',
                                scss = '',
                                sass = '',
                                style_segments = [],
                                js = text
                            } = res_extract_styles_and_js || {};

                            const style_bundle = compile_styles({css, scss, sass, style_segments}, style_config);
                            const compiled_css = style_bundle.css || '';

                            if (this.debug) {
                                // Generate source maps for CSS-free JS
                                const css_free_bundle_result = await await_bundle_observable(
                                    non_minifying_bundler.bundle_js_string(js)
                                );
                                const css_free_bundle_item = css_free_bundle_result[0]._arr[0];

                                const res_bundle = new Bundle();
                                const o_js_bundle_item = {
                                    type: 'JavaScript',
                                    extension: 'js',
                                    text: css_free_bundle_item.text
                                }
                                res_bundle.push(o_js_bundle_item);
                                const o_css_bundle_item = {
                                    type: 'CSS',
                                    extension: 'css',
                                    text: compiled_css
                                }
                                res_bundle.push(o_css_bundle_item);
                                if (control_scan_manifest) {
                                    res_bundle.bundle_analysis = res_bundle.bundle_analysis || {};
                                    res_bundle.bundle_analysis.jsgui3_html_control_scan = control_scan_manifest;
                                }
                                next(res_bundle);
                                complete(res_bundle);







                            } else {
                                // Generate source maps for CSS-free JS and minify
                                const css_free_bundle_result = await await_bundle_observable(
                                    non_minifying_bundler.bundle_js_string(js)
                                );
                                const css_free_bundle_item = css_free_bundle_result[0]._arr[0];
                                const minified_js = await await_bundle_observable(
                                    minifying_js_single_file_bundler.bundle(css_free_bundle_item.text)
                                );

                                //console.log('minified_js', minified_js);
                                //console.log('minified_js.length', minified_js.length);

                                // it's an array....

                                if (is_array(minified_js) && minified_js.length === 1) {
                                    const minified_bundle = minified_js[0];
                                    const o_css_bundle_item = {
                                        type: 'CSS',
                                        extension: 'css',
                                        text: compiled_css
                                    }
                                    minified_bundle.push(o_css_bundle_item);
                                    if (control_scan_manifest) {
                                        minified_bundle.bundle_analysis = minified_bundle.bundle_analysis || {};
                                        minified_bundle.bundle_analysis.jsgui3_html_control_scan = control_scan_manifest;
                                    }
                                    next(minified_bundle);
                                    complete(minified_bundle);
                                } else {
                                    console.trace();
                                    throw 'Unexpected minified JS structure';
                                }


                            }


                            


                            
                            
                            //console.trace();
                            //throw 'stop';

                            // And put things into a res bundle.
                            //  Though possibly this could (even) bundle things into compressed files (with headers) ready to be
                            //  served.

                            // Though there may be a class (or bunch of them), maybe in the Publisher, that determine and
                            //   carry out adding references and using static routes, or putting the CSS and JS inline within the HTML.
                            // References seem very much better but want control of this to be as clear as possible.



                            // Maybe that will be a Ready_To_Serve_Static_Bundle




                            // Though it needs to provide (a bundle of?) both JS and CSS.
                            //   Better to use a standard bundle class (collection) to transfer these objects.

                            // .css or .get('css') perhaps???

                            // Array does seem simpler, esp as it does not really have to be a 'bundle' object.
                            //   Maybe a Bundle class instance would help here in some ways.

                            // Then will apply minifying compression to the JS.
                            //   ESBuild is really fast for this.

                            // Likely to have different publisher options for how the HTML and CSS is included in the page.
                            //   With the most sensible defaults used.
                            //   Serving the files as static, and referenced from within the HTML.
                            //     Will look into options / setups for efficient serving of websites where there is
                            //      varying client side logic for each page, but can reference built components which don't change.

                            // Or basically just initialise everything on the client page.

                            // Will have moderately to very structure of classes, very specific in terms of what they do and how they do it.





                            //console.log('res_extract_css_and_js_from_js', res_extract_css_and_js_from_js);

                            //console.trace();
                            //throw 'stop';


                        } else {
                            console.trace();
                            throw 'NYI';
                        }

                        //console.trace();
                        //throw 'stop';
                    } else {
                        console.trace();
                        throw 'NYI';
                    }
                } else {
                    console.trace();
                    throw 'NYI';
                }


            } else {
                console.trace();
                throw 'NYI';
            }

            //console.trace();
            //throw 'stop';



            // Need to use a non minifying bundler (first).


            } catch (bundleError) {
                // Defensive programming: Log error but don't crash the server
                console.error('[Advanced_JS_Bundler_Using_ESBuild] Bundling failed:', bundleError.message || bundleError);
                console.error('[Advanced_JS_Bundler_Using_ESBuild] Returning empty bundle to allow server startup.');
                
                // Return an empty bundle so the server can continue
                const fallback_bundle = new Bundle();
                fallback_bundle.push({
                    type: 'JavaScript',
                    extension: 'js',
                    text: '/* Bundling failed - see server logs */'
                });
                fallback_bundle.push({
                    type: 'CSS',
                    extension: 'css',
                    text: '/* Bundling failed - see server logs */'
                });
                next(fallback_bundle);
                complete(fallback_bundle);
            }

            const _old_code = async() => {

                const css_extractor_res = await css_extractor.separate_css_and_js(js_file_path)

                console.log('css_extractor_res', css_extractor_res);

                /*

                let result = await esbuild.build({
                    entryPoints: ['js_file_path'],
                    //sourcemap: 'external',
                    write: false,
                    outdir: 'out',
                })
                console.log('result.outputFiles:\n\n');
                for (let out of result.outputFiles) {
                    console.log('out.path, out.contents, out.hash, out.text', out.path, out.contents, out.hash, out.text)
                }

                */

                // Should use (an instance of?) the core bundler.
                //  Or the CSS extractor even.



                console.trace();
                throw 'NYI';

            }


            

        });
        return res_obs;

        // The bundle result should have a few things, makes sense to make it an object or class, not too complicated.

        

    }


    

}


module.exports = Advanced_JS_Bundler_Using_ESBuild;
