// Defines a single constant, which is also functionality to be built.


const {each, Evented_Class} = require('lang-mini');

// Is this necessary, is it worth going further than Babel AST?
//  Or JS_AST_Node?
//   of the kind declaration.

// May be worth doing more work on platform or builder.


// Maybe this would provide a nice separate API.

// Name property.
//  ast_node_count property
//  is_inline property
//  external_reference_names property
//   .refs too?

// In declaration form, will be able to then make a new AST that has got changed variable names.
//  Could use a Variable_Name_Provider













// Variable_Declaration
// Class_Declaration  

// Kind of the same really.
//  A class is a type of variable.

// Want to define all the declarations in a JS file.

class Declaration extends Evented_Class {
    constructor(spec) {
        super();

        // Of either a class or another variable.

        // name
        // type ( class, function, object etc, function call result?)

    }
}

module.exports = Declaration;

// Loading a declaration out of a file, so it fits within a declaration object.

