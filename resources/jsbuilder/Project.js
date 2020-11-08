
// Will be a space where a load of JS can be loaded within.
//  Loaded from different places.

// Load JS file into the project.
//  Be able to then reference functions from that file.
//   Or then load the functions individually?
//   Could load a whole load of them / category.
//   Or 

const {each, Evented_Class} = require('lang-mini');

//const JS_File = require('./JS_File_Core');
const Platforms = require('./Platforms');

class Project extends Evented_Class {

    // This will act as an overall library of JS functions.
    //  A project can have multiple builds?

    // Or a build is basically the output of a platform. The platform gets put together, has the code ordering, can do things internally too.
    //  platform.build

    // or it's a platform that meets conditions.

    // A project could have different output files.
    //  For the moment, focus more on bringing together input.
    //  Arrange inputs to get output.

    // Project-wide list / index of variable names
    //  The variable names inside classes too.

    // Project-wide substitution of variable names for shorter ones
    //  Ongoing calculations of savings.

    // Main thing will be to go further on code extraction - have the system able to deal with pieces of code, that it knows are required by something, to be
    //  dealt with in abstract ways.

    // Named platforms make sense.
    //  Combining multiple platforms into one platform.
    //   Application code sits on top of those platforms.


    












    //  The platform that is used as 




    constructor(spec) {
        super(spec = {});
        
        // The most outer layer.

        // Load files into here...?
        //  Files exist independently within the project space.

        // map of files by path?

        // or by name, its equivalent.

        const platforms = new Platforms();

        platforms.on('change', e_change => {
            console.log('platforms e_change', e_change);
        });

        Object.defineProperty(this, 'platforms', {
            get() { return platforms; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

    }
    //add_js_file(js_file) {

    //}
    //remove_js_file(js_file) {
        
    //}

}

// load_js_file
//  then it knows the names of the root level functions.

// when loading JS files, it should be able to tell how they relate to each other.




module.exports = Project;




