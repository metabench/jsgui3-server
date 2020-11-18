// Make a platform about providing variables.

const {each, Evented_Class} = require('lang-mini');
const Declaration_Sequence = require('./Abstract_Single_Declaration_Sequence');

class Platform extends Evented_Class {
    constructor(spec) {
        super(spec);

        /*
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
        */

        // For the moment, let's focus on loading files, and effective indexing and querying of those files.

        // Use a Virtual Global Scope.
        //  load functions into that.

        // Try loading functions, values into a Scope object.
        //  Scope is more specifically named than Platform.
        //  Plaftorm should contain a single Scope.

        const map_local_module_directories = {};
        const scope = new Scope();



        // Loading a file / AST onto a platform

        // Platform maps / indexes:

        // from the name of a function:
        //  which module contains its definition, and reference to the definition AST node.
        //  is it exported by the module

        // Getting better exports information looks like a good first step.
        //  Dealing with exporting an object that itself has multiple keys.

        // exported.keys
        // exports.keys?

        // exported makes sense.

        // exported.keys will be a useful property.
        //  very useful for determining when it is loaded in a different module? or just for cross-referencing? Exactly that, it's cross-referencing.

        






        // Want to load a file, and follow all the code and references to create the codebase where it can run.
        //  We can start with / do more work on the jsgui-client file.

        // Within that will be defined quite a lot of objects.
        //  With some of them, we will trace back the references to their declarations, and also have those declarations within the application in a way which
        //  allows them to be used within a platform.

        // Will allow both bottom-up building of a platform and project, and top-down loading and building.


        // Can load files in any order, but can also load the main file, and have it automatically load all relevant files.












        // Adding files and functions to platforms.
        //  will be nice to create actual files using referenced code.
        //   want to make more of a system that accepts the file names and is easy to use.
        
        // Work on the more basic babel transforms would make sense too.
        //  Could generate code from the tree I have.
        //   Not sure of the importance, Babel code gen is probably fine.








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