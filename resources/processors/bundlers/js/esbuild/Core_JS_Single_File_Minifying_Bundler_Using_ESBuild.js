


// This won't deal with CSS, maybe will have some options for it.

const {obs} = require('fnl');
const esbuild = require('esbuild')

const Bundle = require('../../bundle');
const Bundler_Using_ESBuild = require('./Bundler_Using_ESBuild');
// extends Bundler ???
// extends Core_Bundler?
// exends Base_Bundler???




class Core_JS_Single_File_Minifying_Bundler_Using_ESBuild extends Bundler_Using_ESBuild {
    constructor(spec = {}) {
        super(spec);

        // Store minification configuration
        this.minify_config = spec.minify || this.get_default_minify_config();
    }

    // And the options....

    // May want to have it do minification by default?
    // Or even call a specific minifier class later on....

    // Making classes with very specific responsibilities to do very specific things may help.

    // Core_JS_Non_Minifying_Bundler_Using_ESBuild for example....

    // Really specific class names for specific functionality to call reqlly quickly and interchange really quickly.

    // Probably use the non-minifying bundler, and then use a minifier afterwards.
    // And here the minifier is ESBuild, as is the bundler.

    get_minify_options() {
        const level = this.minify_config.level || 'normal';
        const enabled = this.minify_config.enabled !== false; // Default: true

        if (!enabled) {
            return false; // Disable minification
        }

        const baseOptions = {
            conservative: { mangle: false, compress: { sequences: false } },
            normal: { mangle: true, compress: true },
            aggressive: { mangle: true, compress: { drop_console: true, drop_debugger: true } }
        };

        const options = { ...baseOptions[level], ...this.minify_config.options };
        return options;
    }

    get_default_minify_config() {
        return {
            enabled: true,
            level: 'normal'
        };
    }

    apply_minify_options(o_build) {
        const enabled = this.minify_config.enabled !== false;
        if (!enabled) {
            o_build.minify = false;
            return;
        }

        const level = this.minify_config.level || 'normal';
        const level_overrides = {
            conservative: {
                minifyIdentifiers: false,
                minifyWhitespace: false,
                minifySyntax: false
            },
            aggressive: {
                drop: ['console', 'debugger']
            }
        };

        o_build.minify = true;
        if (level_overrides[level]) {
            Object.assign(o_build, level_overrides[level]);
        }

        const minify_options = this.get_minify_options();
        if (minify_options && typeof minify_options === 'object') {
            if (minify_options.mangle === false) {
                o_build.minifyIdentifiers = false;
            }
            if (minify_options.compress === false) {
                o_build.minifySyntax = false;
                o_build.minifyWhitespace = false;
            } else if (minify_options.compress && typeof minify_options.compress === 'object') {
                if (minify_options.compress.sequences === false) {
                    o_build.minifySyntax = false;
                }
                const drop = [];
                if (minify_options.compress.drop_console) drop.push('console');
                if (minify_options.compress.drop_debugger) drop.push('debugger');
                if (drop.length) {
                    o_build.drop = Array.from(new Set([...(o_build.drop || []), ...drop]));
                }
            }
        }
    }







    bundle(str_js) {


            // Validate input
            if (typeof str_js !== 'string') {
                throw new Error('bundle() expects a string parameter');
            }
        const res_obs = obs(async(next, complete, error) => {
            try {
                const o_build = {
                    stdin: {
                        contents: str_js
                    },
                    bundle: true,
                    treeShaking: true,
                    write: false
                };

                this.apply_minify_options(o_build);

                const result = await esbuild.build(o_build);
                for (let out of result.outputFiles) {
                    //console.log('out.path, out.contents, out.hash, out.text', out.path, out.contents, out.hash, out.text)
                }

            //console.log('result.outputFiles.length', result.outputFiles.length);

            //console.trace();
            //throw 'stop';


                if (result.outputFiles.length === 1) {

                const output_file = result.outputFiles[0];

                //console.log('output_file', output_file);

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

module.exports = Core_JS_Single_File_Minifying_Bundler_Using_ESBuild;
