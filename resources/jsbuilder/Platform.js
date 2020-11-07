// Make a platform about providing variables.

const {each, Evented_Class} = require('lang-mini');

class Platform extends Evented_Class {
    constructor(spec) {


        super(spec);

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










    }
}

module.exports = Platform;