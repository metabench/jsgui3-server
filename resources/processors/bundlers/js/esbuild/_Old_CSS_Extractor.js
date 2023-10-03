

// Could split the CSS from JS here.
//  Extractors are a different thing to bundlers.




// Probably better to remove this / use the specific extractor that's named / available / gets used.




const {bundle_css_from_js_str} = require('../../css-bundler');

const {obs} = require('fnl');

const Core_JS_Non_Minifying_Bundler_Using_ESBuild = require('./Core_JS_Non_Minifying_Bundler_Using_ESBuild');


// It is a Bundler though....

// Or not???

// And Extractor?
// Separator???

// An Extractor processor I think.

const Extractor = require('../../../extractors/Extractor');


class _Old_CSS_Extractor extends Extractor {

    // Maybe should use a reference to the file itself?
    //   Maybe needs to use jsdom even?

    // Will first try with existing code and then see about optimisations.




    constructor(spec) {
        super();

        console.trace();
        throw 'Deprecating this particular class, use other extractor classes in the extractors dir.'

        this.core_js_non_minifying_bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

    }

    separate_css_and_js(js_file_path) {

        const {core_js_non_minifying_bundler} = this;


        console.log('js_file_path', js_file_path);

        const obs_res = obs(async(next, complete, error) => {

            // Then we need to use the core js bundler....

            const core_js_non_minifying_bundler_obs_res = core_js_non_minifying_bundler.bundle(js_file_path);

            // Only one piece of data...?

            const arr_no_minifying_bundler_data = [];

            core_js_non_minifying_bundler_obs_res.on('next', data => {

                //console.log('core js (non-minifying) bundler next event data:', data);

                arr_no_minifying_bundler_data.push(data);




            });

            core_js_non_minifying_bundler_obs_res.on('complete', async() => {
                // This overall function not yet complete though....
                
                console.log('arr_no_minifying_bundler_data', arr_no_minifying_bundler_data);

                // Then use that Bundle object....
                //  Should represent a single JS file I think.

                // Have plenty of checks in these various classes, though keep the overall code simple, but the
                //   structure will be somewhat complex, like the inner working of the app which it represents.


                if (arr_no_minifying_bundler_data.length === 1) {
                    const bundle_item = arr_no_minifying_bundler_data[0]._arr[0];

                    console.log('bundle_item', bundle_item);

                    if (bundle_item.type === 'JavaScript') {

                        const {text} = bundle_item;

                        // Then run it through the CSS extraction algorithm.
                        //   Having that code in the relevant class would help.

                        console.log('pre extract css from bundled unminified js');

                        // Reimplementing it as an Extractor that uses ESBuild will / may help.


                        // Would be worth making an AST_Node version of this though, as that's what it uses.
                        //   May well be possible / better to use other methods / regexes / parser and AST.








                        const r1 = await bundle_css_from_js_str(text);
                        console.log('post extract css from bundled unminified js');

                        // That bundle algorithm is a little slow.
                        //  It does work well though.

                        //   Maybe using regexes on the JS would work better.


                        console.log('r1', r1);

                        console.trace();
                        throw 'NYI';



                        //  Then run it through the CSS extractor function / class.

                        // Perhaps we should make and use an ESBuild specific CSS extractor???
                        //   Should the current extractor function be too slow....

                        // Including the standard / default jsgui3 css as well....
                        //   May be worth making more classes to do individual parts of it.
                        //   And have overall bundling class(es) join them together with simple syntax using the relevant classes to do the job.


                        // Worth making the code somewhat longwinded / complex if it makes it easy to follow
                        //   Since it's doing some complex things (at least complex considering all eventual options) the structure
                        //   representing that and being able to accommodate it will help.

                        // The Publisher should (probably) do the reference insertion.
                        //   Though a JS_And_CSS_References_Inserter may be useful structurally to see what's going on.
                        //     Would insert the references within the HTML JSGUI3 Control within the right place(s).















                    } else {
                        console.trace();
                        throw 'Unexpected bundle item type: ' + bundle_item.type;
                    }


                    

                } else {
                    console.trace();
                    throw 'NYI';
                }





            });

            // Then when it is complete...???




        });

        return obs_res;

        /*
        obs_res.on('next', data => {
            console.log('data', data);
        })
        */


        ///const res_core_bundle = 

        // Maybe should compile / bundle the file with esbuild.
        //   Want it to look through all the CSS throughout JSGUI JS and include it in the CSS for the client.
        //     Should be very convenient for including CSS in the JS. Sensible defaults.

        // ESBuild_Wrapper perhaps.

        // Core_JS_Bundler_Using_ESBuild

        // JS_Bundler_Using_ESBuild

        // Make it async or observable....

        // Observable may be the best thing to use, maybe will improve observable API, possibly specifying how it combines results.

        // Looks like we first need to get the JS all as a bundle.














    }


}


module.exports = _Old_CSS_Extractor;