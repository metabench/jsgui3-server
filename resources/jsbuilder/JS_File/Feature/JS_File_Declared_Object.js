// Like 'Declaration', but moving away from the JS syntax and possibilities of a declaration statement containing declarations for multiple objects.

const JS_File_Feature = require('./JS_File_Feature');

// Or just use the AST node one?
//  This would be a different abstraction layer, possibly needed.

class JS_File_Declared_Object extends JS_File_Feature {
    constructor(spec = {}) {
        super(spec);

        // Will iterate root declaration statements to get the declared objects from them.
        //  Can do that now.

        // Whether or not the declared object gets exported
        //  directly
        //  as property of object
        //  other, such as member of array.
        //  And the export type (here getting into detail of the statement, could reference the statement, maybe another property layer above to understand that)

        // .usage
        // .outer_corresponding_js_ast_node

        console.log('JS_File_Declared_Object spec', spec);

        throw 'stop';


    }
}

module.exports = JS_File_Declared_Object;