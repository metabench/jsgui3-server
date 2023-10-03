// Advanced in terms of being able to split CSS and JS from JS.
const {obs} = require('fnl');
const esbuild = require('esbuild')
const Core_JS_Non_Minifying_Bundler_Using_ESBuild = require('./Core_JS_Non_Minifying_Bundler_Using_ESBuild');
const Bundler_Using_ESBuild = require('./Bundler_Using_ESBuild');
const {is_array} = require('lang-tools');

const Core_JS_Single_File_Minifying_Bundler_Using_ESBuild = require('./Core_JS_Single_File_Minifying_Bundler_Using_ESBuild');

//const CSS_Extractor = require('./_Old_CSS_Extractor');

// Use a different CSS extractor.


const Bundle = require('../../bundle');

const CSS_And_JS_From_JS_String_Extractor = require('../../../extractors/js/css_and_js/CSS_And_JS_From_JS_String_Extractor');


class Advanced_JS_Bundler_Using_ESBuild extends Bundler_Using_ESBuild {
    constructor(spec) {
        super(spec);

        //this.css_extractor = new CSS_Extractor();


        this.non_minifying_bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();
        this.css_and_js_from_js_string_extractor = new CSS_And_JS_From_JS_String_Extractor();

        this.minifying_js_single_file_bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild();

    }

    bundle(js_file_path) {
        const {non_minifying_bundler, css_and_js_from_js_string_extractor, minifying_js_single_file_bundler} = this;

        // Maybe this should get them positioned absolutely when removed from the grid?
        //   But then what about the space they leave?

        // This is just a simple principle demo though.
        //   Maybe want a simple and explicit option to change behaviour like I specify.

        

        const res_obs = obs(async(next, complete, error) => {

            //console.log('Advanced_JS_Bundler_Using_ESBuild bundle js_file_path:', js_file_path);

            const res_nmb = await non_minifying_bundler.bundle(js_file_path);

            //console.log('res_nmb', res_nmb);

            if (res_nmb.length === 1) {
                const js_bundle = res_nmb[0];
                const js_bundle_arr = js_bundle._arr;
                if (js_bundle_arr) {
                    if (js_bundle_arr.length === 1) {
                        const bundle_item = js_bundle_arr[0];
                        //console.log('bundle_item', bundle_item);

                        if (bundle_item.type === 'JavaScript') {
                            const {text} = bundle_item;
                            // Then use the css and js from js extractor.

                            const res_extract_css_and_js_from_js = await css_and_js_from_js_string_extractor.extract(text);


                            const {css, js} = res_extract_css_and_js_from_js;

                            const minified_js = await minifying_js_single_file_bundler.bundle(js);

                            //console.log('minified_js', minified_js);
                            //console.log('minified_js.length', minified_js.length);

                            // it's an array....

                            if (is_array(minified_js)) {

                                if (minified_js.length === 1) {


                                    // Should put it all in a single res bundle though....
                                    //   Though merging / concating bundles will be fine too.



                                    const minified_js_bundle_collection = minified_js[0];

                                    

                                    const o_css_bundle_item = {
                                        type: 'CSS',
                                        extension: 'css',
                                        text: css
                                    }

                                    minified_js_bundle_collection.push(o_css_bundle_item);


                                    // Maybe will provide the class / class instance that processes CSS or SASS/SCSS / whatever else.



                                    // Could add the extracted CSS here.



                                    next(minified_js_bundle_collection);

                                    // But create a CSS bundle item...





                                    // And also the CSS...





                                    complete(minified_js_bundle_collection);



                                    const unneeded_looking_into_the_js_bundle = () => {
                                        if (minified_js_bundle_collection._arr) {

                                            if (minified_js_bundle_collection._arr.length === 1) {

                                                const minified_js_bundle_item = minified_js_bundle_collection._arr[0];
                                                console.log('minified_js_bundle_item', minified_js_bundle_item);


                                                if (minified_js_bundle_item.type === 'JavaScript') {

                                                    //const str_minified_js = minified_js_bundle_item.text;

                                                    //const res = 





                                                } else {

                                                    console.trace();
                                                    throw 'NYI';

                                                }


                                                // Could even check it's js here...?


                                                console.trace();
                                                throw 'NYI';


                                            } else {
                                                console.trace();
                                                throw 'NYI';
                                            }

                                        } else {

                                            console.trace();
                                            throw 'NYI';

                                        }

                                    }

                                    

                                } else {
                                    console.trace();
                                    throw 'stop';
                                }

                            } else {

                                console.trace();
                                throw 'stop';
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