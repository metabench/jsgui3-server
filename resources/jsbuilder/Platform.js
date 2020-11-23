// Make a platform about providing variables.

const {each, Evented_Class} = require('lang-mini');
const Declaration_Sequence = require('./Abstract_Single_Declaration_Sequence');

// It will now be worth loading files into the platform.

// The platform will need to keep track of various pieces of data.
//  Main priority right now is for it to load one, and then more than one, JavaScript file into the platform.

// Also want to consider bringing files / functionality into the platform
//  That should be what happens here, the platform has its AST and the AST from the file gets loaded into the platform AST.
//  Possibly it's worth doing quite a lot more on the lower level, such as with indexing, signatures, and signature matching.

// Maybe platform should also deal with the files without doing much loading to start with.
// Will need to do some queries between files.

// I invisage a platform as a place for code to sequentially be loaded into.




// Project would be better to work on for the moment?

// Or, we sequentiually load js files into a platform.
//  be able to follow objects through as they get more keys / properties / methods added.




class Platform extends Evented_Class {
    constructor(spec) {
        super(spec);
        const map_local_module_directories = {};
        const scope = new Scope();
    }
}

module.exports = Platform;