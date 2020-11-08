const {each} = require('lang-mini');
const babel_node_tools = require('../babel/babel_node_tools');

// Possibly able to manage a source babel node and different resultant transformations.

const {
    /*
    iterate_babel_binary_expression_node,
    iterate_babel_unary_expression_node,
    iterate_babel_identifier_node,
    iterate_babel_string_literal_node,
    iterate_babel_variable_declaration_node,
    iterate_babel_arrow_function_expression_node,
    iterate_babel_block_statement_node,
    iterate_babel_if_statement_node,
    iterate_babel_return_statement_node,
    iterate_babel_object_expression_node,
    iterate_babel_member_expression_node,
    iterate_babel_function_expression_node,
    iterate_babel_logical_expression_node,
    iterate_babel_variable_declarator_node,
    iterate_babel_expression_statement_node,
    iterate_babel_assignment_expression_node,
    iterate_babel_array_expression_node,
    iterate_babel_for_statement_node,
    iterate_babel_numeric_literal_node,
    iterate_babel_update_expression_node,
    iterate_babel_new_expression_node,
    iterate_babel_empty_statement_node,
    iterate_babel_null_literal_node,
    iterate_babel_boolean_literal_node,
    iterate_babel_throw_statement_node,
    iterate_babel_assignment_pattern_node,
    iterate_babel_while_statement_node,
    iterate_babel_object_pattern_node,
    iterate_babel_class_declaration_node,
    iterate_babel_class_body_node,
    iterate_babel_class_method_node,
    */
    iterate_babel_node,
    iterate_babel_child_nodes,

    get_identifier_names,

    get_babel_child_nodes,

    get_require_call
} = babel_node_tools;

// For the moment, do more concerning getting the basic info.
//  Don't do the signature system yet - it's too complex when done fully.
//  Work on getting the info about what is required.
//   In more of a concice fp way.



class JS_AST_Node {
    constructor(spec = {}) {
        let babel_node, str_source;
        if (spec.babel_node) {
            babel_node = spec.babel_node;
        }
        if (spec.str_source) {
            str_source = spec.str_source;
        }
        Object.defineProperty(this, 'type', {
            get() { return babel_node.type; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'src', {
            get() { return str_source; },
            //set(newValue) { bValue = newValue; },
            enumerable: false,
            configurable: false
        });
        Object.defineProperty(this, 'source', {
            get() { return str_source; },
            //set(newValue) { bValue = newValue; },
            enumerable: false,
            configurable: false
        });
        Object.defineProperty(this, 'str_source', {
            get() { return str_source; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'babel_node', {
            get() { return babel_node; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // a child_nodes property.

        // an each_child and each_child_node function

        Object.defineProperty(this, 'child_nodes', {
            get() { 
                const bcns = get_babel_child_nodes(babel_node, str_source);
                const res = [];
                each(bcns, bcn => res.push(new JS_AST_Node({babel_node: bcn})));
                return res;
                //return babel_node; 
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        this.count_nodes = () => {
            let c = 0;
            iterate_babel_node(babel_node, str_source, (babel_node) => {
                //console.log('cb babel_node', babel_node);
                c++;
            });
            return c;
        }

        this.get_variable_names = () => {
            throw 'NYI';
            const map_names = {}, arr_names = [];

            iterate_babel_node(babel_node, str_source, (babel_node) => {
                console.log('get_variable_names cb babel_node', babel_node);
                //c++;
            });
        }

        this.get_identifier_names = () => get_identifier_names(babel_node);

    }
}

module.exports = JS_AST_Node;