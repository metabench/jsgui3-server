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

// Maybe rename this... it's not just the Declaration object from Babel, but more like the relevant programming chunk to be moved around.

// Named_Object_Declaration?

// Declaration_Code_Block?
//  Basic_Declaration_Code_Pattern

// May be better if it extends JS_AST_Node

class Declaration extends Evented_Class {
    constructor(spec) {
        super(spec);

        // name, type, value (which could have its own inner scope)
        //       kind?
        //        may correspond with babel.



        let name;

        if (spec.name) name = spec.name;

        Object.defineProperty(this, 'name', {
            get() { return name; },
            enumerable: true,
            configurable: false
        });

        

        // Of either a class or another variable.

        // name
        // type ( class, function, object etc, function call result?)

        // One single thing being declared.

        // variable name

        // name and value?

        // Can have some helpful info such as 
        //  is everything inline.
        //  what variables it refers to that are outside of it's own internal scope?

        // .has_internal_scope
        // .is_literal

        // a few ways to get some information in a simple way about the declaration block would be of use.





    }
}

module.exports = Declaration;

// Loading a declaration out of a file, so it fits within a declaration object.

