// Make a platform about providing variables.

const {each, Evented_Class} = require('lang-mini');
const Declaration_Sequence = require('./Declaration_Sequence');

class Platform extends Evented_Class {
    constructor(spec) {


        super(spec);

        const ds = new Declaration_Sequence();

        Object.defineProperty(this, 'declarations', {
            // Using shorthand method names (ES2015 feature).
            // This is equivalent to:
            // get: function() { return bValue; },
            // set: function(newValue) { bValue = newValue; },
            get() { return ds; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // Functionality concerning bringing code into the platform.

        // Automated import of a full file makes sense.
        //  Later consider removing unused parts of platforms?

        // Events raised during import would be useful for logging at least.

        // Will be nice to make a tiny subset of lang-mini to start with.
        //  And also to see what subset of it gets used in a larger build, and see what can be ignored during the compilation.

        // Index of occurrances of all variable names.
        //  More concerned with names imported and exported.

        // Index of everything imported and imported...
        //  Possibly that will be 'project'.


        // Variable naming / renaming within a platform?
        //  Could be done within a file.

        // Add a specific function from a specific file.

        // Platform creation, and output from the platform makes sense.
        //  Effectively though, every JS closure is its own platform.
        //  Need a Platform to handle multiple js closures.

        // Try an array of declarations in the platform. Or DeclarationSequence really.

        //  
















    }
}

module.exports = Platform;