
// Will be a space where a load of JS can be loaded within.
//  Loaded from different places.

// Load JS file into the project.
//  Be able to then reference functions from that file.
//   Or then load the functions individually?
//   Could load a whole load of them / category.
//   Or 

const {each, Evented_Class} = require('lang-mini');

const JS_File = require('./JS_File');

class Project extends Evented_Class {
    constructor(spec) {
        super(spec = {});

        const map_js_files_by_hash = {};

        //let js_file;

        if (spec.js_file && spec.js_file instanceof JS_File) {
            //js_file = spec.js_file;
        }





        this.load_js_stream = (readable_stream) => {


        }

    }

}

// load_js_file
//  then it knows the names of the root level functions.

// when loading JS files, it should be able to tell how they relate to each other.




module.exports = Project;




