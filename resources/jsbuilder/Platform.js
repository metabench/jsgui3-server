// Make a platform about providing variables.

const {each, Evented_Class} = require('lang-mini');

class Platform extends Evented_Class {
    constructor(spec) {
        // Each platform has a scope level.
        super();
        // A bunch of local variables get defined within each platform.

        // Make a platform about providing variables. These variables will correspond with what a module exports.

        // Auto-detecting platform levels?

        //  Downloading the files from npm?

        // Defining platforms using files
        //  Reads the file into JS_File object.
        //   Which of the functions are inline?
        //    as in don't have any references, or use anythin out of scope.

        // Tightly scoped functions... how to find them?

        // Or, a system of adding functions / functionality to the platform?
        //  Would be fine for building jsgui but prefer it to be more automated.

        // Lowest level platforms can not require modules of their own (I think).
        //  A platform can have ordering - things later in the order can require things previous in the order - it everything is declared in order as a const.


        // Should be able to give it a name, for shorthand usage later on.
        //this.add_file_content(path, content, name);
        //this.add_file(path, name);

        // This will mean that the files can be built together in a way where lang-mini will have function names that are shorter...?
        //  But how to do that?
        //  Localising variables from the module within the platform.
        //  Localising what gets exported.
        //   Everything else runs within a closure.
        //    Go for some really short variable names all over the place.
        //     Should make for mega-compressed code.

        // This looks like it will be essential for building jsgui in the way that takes less space for the client.
        
        // Or make this all about assigning variables / declarations in platforms.

        // So a platform has a sequence of declarations.

        // Detect if a function / object has anythin out of scope...?

        // Platform gets js files loaded into it.
        //  When that happens, declarations get loaded from that jsfile.


        // Basically want to load functions sequentially into the platform.
        //  Would also be a nice basis for an API documentation and a useful ordering to know.
        //  Maybe it's ordering that won't be generated automatically (yet).

        //platform.load_fn
        // or a bunch of functions

        // Load DECLARATIONS.

        // platform.load(declaration);
        // platform.load(js_file); // and that will need to load all the declarations needed by it recursively?
        //  could raise a missing declaration event...?

        // be able to evaluate an expression to see if it is all inline.











    }
}

module.exports = Platform;