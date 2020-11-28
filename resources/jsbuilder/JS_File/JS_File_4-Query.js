const {each, tof} = require('lang-mini');
const JS_File_JS_AST_Node = require('./JS_File_3-JS_AST_Node');

const JS_File_Import_References = require('./JS_File_Import_References');

// Index prior to this?
//  Or just within JS_File?
//   Would actually make sense here, as some AST trees could be long and worth working on in some ways, or reading info from.

// identifier_name_occurrance_index
//  and provides a reference to each place that identifier name has been used within the scope.
//   then building up an identifier name occurrance index could be done recursively where each node gets its child nodes to calculate their occurrance indexes first.






//const { default: JS_File_JS_AST_Node } = require('./JS_File_2-JS_AST_Node');
//const { default: Import_References } = require('./JS_File_Import_References');
// Will extract relevant AST code functionality. Files often import things at the beginning, then have declarations, then export what was declared at the end.

// Understanding the import declarations so they could be localised.
//  So we can refer to the ast of them, because we have recognised them elsewhere.

// Can build the functions into a js file.
// Later on - renaming local variables within a scope. 

// JS_File_Writable too...
//   .imports = ... or requires
//   .add_platform?

// Or better to create the platform objects out of the functions which have been comprehended from various files.
// JS_File_Platform?
// This will be more about understanding the js file. Basic structure will have already been obtained.

// Maybe a Babel level below?

class JS_File_Query extends JS_File_JS_AST_Node {
    constructor(spec) {
        super(spec);

        // Maybe use a 'node' or 'js_ast_node' property, not body.
        
        



    }
}
JS_File_Query.load_from_stream = (rs, path) => {
    const res = new JS_File_Query({rs: rs, path: path});
    return res;
}
module.exports = JS_File_Query;