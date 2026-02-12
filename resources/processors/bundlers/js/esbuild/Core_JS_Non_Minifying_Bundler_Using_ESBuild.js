
// This won't deal with CSS, maybe will have some options for it.

const {obs} = require('fnl');
const esbuild = require('esbuild')

const Bundle = require('../../bundle');
const Bundler_Using_ESBuild = require('./Bundler_Using_ESBuild');
// extends Bundler ???
// extends Core_Bundler?
// exends Base_Bundler???




class Core_JS_Non_Minifying_Bundler_Using_ESBuild extends Bundler_Using_ESBuild {
    constructor(spec = {}) {
        super(spec);

        if (spec.debug !== undefined) this.debug = spec.debug;

        // Store sourcemap configuration
        this.sourcemap_config = spec.sourcemaps || {};
        this.build_plugins = Array.isArray(spec.plugins) ? spec.plugins : [];

    }

    // And the options....

    // May want to have it do minification by default?
    // Or even call a specific minifier class later on....

    // Making classes with very specific responsibilities to do very specific things may help.

    // Core_JS_Non_Minifying_Bundler_Using_ESBuild for example....

    // Really specific class names for specific functionality to call reqlly quickly and interchange really quickly.
    
    // Probably use the non-minifying bundler, and then use a minifier afterwards.
    // And here the minifier is ESBuild, as is the bundler.







    bundle_js_string(js_string, build_overrides = {}) {
        const res_obs = obs(async(next, complete, error) => {
            try {
                const o_build = {
                    stdin: {
                        contents: js_string,
                        resolveDir: process.cwd()
                    },
                    bundle: true,
                    treeShaking: true,
                    write: false
                };

                // Configure sourcemaps based on configuration
                const sourcemapsEnabled = this.sourcemap_config.enabled !== false;
                if (sourcemapsEnabled && (this.debug || this.sourcemap_config.includeInProduction)) {
                    o_build.sourcemap = this.sourcemap_config.format || 'inline';
                }

                const plugins = Array.isArray(build_overrides.plugins) ? build_overrides.plugins : this.build_plugins;
                if (plugins.length > 0) {
                    o_build.plugins = plugins;
                }

                const result = await esbuild.build(o_build);

                if (result.outputFiles.length === 1) {
                    const output_file = result.outputFiles[0];
                    const res_bundle = new Bundle();
                    const o_bundle_item = {
                        type: 'JavaScript',
                        extension: 'js',
                        text: output_file.text
                    };
                    res_bundle.push(o_bundle_item);
                    next(res_bundle);
                    complete(res_bundle);
                } else {
                    console.trace();
                    throw 'NYI';
                }
            } catch (err) {
                if (typeof error === 'function') error(err);
            }
        });
        return res_obs;
    }

    bundle(js_file_path, build_overrides = {}) {


        const res_obs = obs(async(next, complete, error) => {
            try {
                // Validate input
                if (typeof js_file_path !== 'string' || js_file_path.trim() === '') {
                    throw new Error('bundle() expects a valid file path string');
                }

                const o_build = {
                    entryPoints: [js_file_path],
                    bundle: true,
                    treeShaking: true,
                    write: false
                };

                // Configure sourcemaps based on configuration
                const sourcemapsEnabled = this.sourcemap_config.enabled !== false;
                if (sourcemapsEnabled && (this.debug || this.sourcemap_config.includeInProduction)) {
                    o_build.sourcemap = this.sourcemap_config.format || 'inline';
                }

                const plugins = Array.isArray(build_overrides.plugins) ? build_overrides.plugins : this.build_plugins;
                if (plugins.length > 0) {
                    o_build.plugins = plugins;
                }

                const result = await esbuild.build(o_build);
            //console.log('result.outputFiles:\n\n');
            //for (let out of result.outputFiles) {
                //console.log('out.path, out.contents, out.hash, out.text', out.path, out.contents, out.hash, out.text)
            //}

            //console.log('result.outputFiles.length', result.outputFiles.length);


                if (result.outputFiles.length === 1) {

                const output_file = result.outputFiles[0];

                //console.log('output_file.text.length', output_file.text.length);
                //console.log('output_file.text', output_file.text);

                //console.log('Object.keys(output_file)', Object.keys(output_file));

                // The Bundle is a subclass of Collection.
                //  Maybe its better to make it an Object class that assigns all properties from spec.

                // May be much simpler and more flexible for the moment.
                // Or an array (or collection) of BundleItem instances???

                // Maybe don't have the Bundle extend Collection?
                //   Maybe overhaul Collection?

                // Or use Collection and possibly get onto improving it.
                //   Need to be careful as Collection is integral to Controls.

                // The Bundle should have items, like a collection.
                // Maybe indexed by paths???

                const res_bundle = new Bundle();

                // Really flexible Bundle_Item perhaps....?
                //  The Bundle_Item will need to be able to represent data in different stages of preparation.


                // Just the text?
                const o_bundle_item = {
                    type: 'JavaScript',
                    extension: 'js',
                    text: output_file.text
                }

                    res_bundle.push(o_bundle_item);

                    next(res_bundle);
                    complete(res_bundle);







                // Spec_Property_Assigner class???



                // Think we do have the (full?) output here.

                // prob leave out the hash???

                //console.log('output_file.contents', output_file.contents);

                //const 

                // Bundle_Result or Bundle class?

                // always have Bundlers return a Bundle?








                //console.trace();
                //throw 'NYI';

                } else {
                    console.trace();
                    throw 'NYI';
                }
            } catch (err) {
                if (typeof error === 'function') error(err);
            }


            // The core bundler....
            //   Maybe later even use a Static_Response_Preparer???
            //   And have the relevant Publisher use it?



            


        });
        return res_obs;

        // The bundle result should have a few things, makes sense to make it an object or class, not too complicated.



    }

}

module.exports = Core_JS_Non_Minifying_Bundler_Using_ESBuild;
