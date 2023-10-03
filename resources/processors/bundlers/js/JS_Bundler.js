


const {Evented_Class} = require('lang-tools');
const {obs} = require('fnl');

// Or just use the advanced ESBuild version for the moment.

const maybe_unneeded_class = () => {
    class JS_Bundler extends Evented_Class {
        constructor(spec) {
            super();
    
    
        }
        bundle(js_file_path) {
            // Is it a string path...?
            //  If it's a string it should be a path.
    
            if (typeof js_file_path === 'string') {

                
    
    
    
                // Possibly first parse analysis...
    
                // Extract the CSS from it
                // Extract the JS from it.
    
            } else {
                console.trace();
    
                console.log('\njs_file_path', js_file_path, '\n');
                throw 'Expected string js_file_path';
            }
    
    
    
        }
    
    
    
    }
}



const JS_Bundler = require('./esbuild/Advanced_JS_Bundler_Using_ESBuild');


module.exports = JS_Bundler;