

const JS_AST_Node = require('../../JS_AST_Node');

// A map of named / relevant inner nodes could be a useful feature of the ast node overall.

// or is it an index if it's mapping to an array?

// idx_named_nodes (so it can apply to ancestors or others in the ast)

// map_named_inner_nodes

// map_named_inner_nodes['exports'] = [...] // always an array


class Root_Node_Interpreted extends JS_AST_Node {

    // Root node features could be of use.
    //  Want to recognise features in a convenient way.
    //  Signatures could definitely help with that
    //   But a feature may not be best recognised with a signature.

    // Could do a more formal decision tree for determining features.
    // could have a set of determinations and values.
    //  





    constructor(spec) {
        super(spec);

        const {get_arr_named_node, index_named_node} = this;

        // .exported.type      'object', 'class'
        // .exported.keys

        // This will handle non-special case things.
        //  If there is demand jsgui or other special cases could be brought into normal interpretation.

        // An index of the relevant statements.

        let ast_node_exports_statement;
        let arr_ast_node_import_statements = [];

        const interpret = () => {
            // what it finds, in terms of the object that gets exported
            // a one word summary of the module type.

            // interpreted summary type name

            // type_name would do as a property of the interpretation object.

            // The exports statement.

            // has exports boolean?

            // summary type ('simple-class'), '('simple-module')', 
            //  'module' or 'class' - meaning that it's noticed some other things going on which need attention or may be helpful for interpreting the file.
            //   

            // Failure case
            //  Can not identify exports statement
            //   Though maybe that's fine on the application level rather than library level.
            //  Failed to parse / is not JS??? Probably not at this stage.
            //  










        }


    }
}