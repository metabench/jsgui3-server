const {each} = require('lang-mini');


const babel_node_tools = require('./babel_node_tools');

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

        // get signature.
        //  would iterate the nodes, writing the js
        //   however, would need to rename local variables - so not quite yet.




        //this.find_identifier

        // detect_require_call.
        //  may be better working more closely with ast.
        
        // Not specific enough a name.
        //  Need more specifically named functions to do this better.

        // Also, signatures may be very useful for this.

        /*
        this.get_require_info = () => {
            throw 'stop';
            // Used to see if and where any require('module') calls are made.
            //  and what is being set to that requirement.
            let res = false;

            // so go through all assignments?
            console.log('\nget_require_info');


            // iterate_child_nodes
            const arr_child_require_literals = [];

            let arr_requires = [];
            iterate_babel_child_nodes(babel_node, str_source, (node) => {
                //console.log('child node', node);
                const {type} = node;
                console.log('type', type);


                const found_require = get_require_call(node);
                //console.log('found_require', found_require);
                if (found_require) {
                    arr_requires.push(found_require);
                }
                

            });
            // Will need logic for dealing with ObjectPattern.
            //  Will need to extract a programmatic understanding of the reference(s).

            // JS_Import_Reference may help.
            // JS_Export_Reference

            // Be able to get these objects that are nice and OO and user-friendy.
            //  Once a file gets loaded, we get access to these import and export reference objects.
            //   Could use it to know what functions from where need to be put in scope.

            // But also should think more in terms of the building.
            //  Analysis tools are very cool too.
            //  Finding out about the references will help the building.

            // Extraction of code from source into platform would make sense to work on
            //  And have that provide a direction for the analysis code.


            if (arr_requires.length > 0) {
                console.log('babel_node', babel_node);

                const {type, kind, declarations} = babel_node;
                if (declarations.length === 1) {
                    const dec = declarations[0];
                    console.log('dec', dec);

                    const {type, id, init} = dec;
                    

                    if (type === 'VariableDeclarator') {
                        console.log('id', id);
                        console.log('init', init);
                        res = babel_node;
                    } else {
                        throw 'stop'; //unexpected type
                    }


                } else {
                    throw 'NYI';
                }
            }




            //throw 'stop';
            return res;
            //throw 'stop';

        }
        */




    }
}

module.exports = JS_AST_Node;