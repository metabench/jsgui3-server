const { resolvePlugin } = require('@babel/core');
const {each} = require('lang-mini');

const iterate_babel_class_method_node = (babel_node, str_source, callback) => {
    const {key, computed, kind, id, generator, async, params} = babel_node;
    iterate_babel_node(key, str_source, callback);
    if (id) {
        console.log('babel_node', babel_node);
        throw 'NYI';
    }

    each(params, x => iterate_babel_node(x, str_source, callback));
}

const iterate_babel_class_body_node = (babel_node, str_source, callback) => {
    const {extra, body} = babel_node;
    //iterate_babel_node(body, str_source, callback);
    each(body, x => iterate_babel_node(x, str_source, callback));

}

const iterate_babel_class_declaration_node = (babel_node, str_source, callback) => {
    //console.log('babel_node', babel_node);

    const {extra, id, superclass, body} = babel_node;
    iterate_babel_node(id, str_source, callback);

    if (superclass) {
        console.log('babel_node', babel_node);
        throw 'NYI';
    }
    iterate_babel_node(body, str_source, callback);

    //throw 'stop';
}

const iterate_babel_object_pattern_node = (babel_node, str_source, callback) => {
    const {extra, properties} = babel_node;
    each(properties, x => iterate_babel_node(x, str_source, callback));
}

const iterate_babel_while_statement_node = (babel_node, str_source, callback) => {
    const {extra, body, test} = babel_node;
    iterate_babel_node(test, str_source, callback);
    iterate_babel_node(body, str_source, callback);
}

const iterate_babel_assignment_pattern_node = (babel_node, str_source, callback) => {
    const {extra, left, right} = babel_node;
    iterate_babel_node(left, str_source, callback);
    iterate_babel_node(right, str_source, callback);
}

const iterate_babel_throw_statement_node = (babel_node, str_source, callback) => {
    const {extra, argument} = babel_node;

    iterate_babel_node(argument, str_source, callback);
    
    //iterate_babel_node(right, str_source);
    //each(elements, element => iterate_babel_node(element, str_source));
}

const iterate_babel_boolean_literal_node = (babel_node, str_source, callback) => {
    const {value} = babel_node;
}

const iterate_babel_null_literal_node = (babel_node, str_source, callback) => {

}

const iterate_babel_empty_statement_node = (babel_node, str_source, callback) => {

}

const iterate_babel_new_expression_node = (babel_node, str_source, callback) => {
    const {extra, callee} = babel_node;


    iterate_babel_node(callee, str_source, callback);
    each(babel_node.arguments, x => iterate_babel_node(x, str_source, callback));
    //iterate_babel_node(right, str_source);
    //each(elements, element => iterate_babel_node(element, str_source));
}

const iterate_babel_update_expression_node = (babel_node, str_source, callback) => {
    const {extra, operator, prefix, argument} = babel_node;

    iterate_babel_node(argument, str_source, callback);
    
    //iterate_babel_node(right, str_source);
    //each(elements, element => iterate_babel_node(element, str_source));
}

const iterate_babel_numeric_literal_node = (babel_node, str_source, callback) => {
    const {extra, value} = babel_node;
    
    //iterate_babel_node(right, str_source);
    //each(elements, element => iterate_babel_node(element, str_source));
}


const iterate_babel_for_statement_node = (babel_node, str_source, callback) => {
    const {extra, init, test, update, body} = babel_node;
    iterate_babel_node(init, str_source, callback);
    iterate_babel_node(test, str_source, callback);
    iterate_babel_node(update, str_source, callback);
    iterate_babel_node(body, str_source, callback);
    //iterate_babel_node(right, str_source);
    //each(elements, element => iterate_babel_node(element, str_source));
}

const iterate_babel_array_expression_node = (babel_node, str_source, callback) => {
    const {extra, elements} = babel_node;
    //iterate_babel_node(left, str_source);
    //iterate_babel_node(right, str_source);
    each(elements, element => iterate_babel_node(element, str_source, callback));
}

const iterate_babel_assignment_expression_node = (babel_node, str_source, callback) => {
    const {extra, left, operator, right} = babel_node;
    iterate_babel_node(left, str_source, callback);
    iterate_babel_node(right, str_source, callback);
}

const iterate_babel_expression_statement_node = (babel_node, str_source, callback) => {
    const {extra, left, operator, right} = babel_node;
    iterate_babel_node(left, str_source, callback);
    iterate_babel_node(right, str_source, callback);
}

const iterate_babel_variable_declarator_node = (babel_node, str_source, callback) => {
    const {extra, id, init} = babel_node;
    iterate_babel_node(id, str_source, callback);
    iterate_babel_node(init, str_source, callback);
}

const iterate_babel_logical_expression_node = (babel_node, str_source, callback) => {
    const {extra, left, operator, right} = babel_node;
    iterate_babel_node(left, str_source, callback);
    iterate_babel_node(right, str_source, callback);
}

const iterate_babel_function_expression_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_function_expression_node', babel_node);

    const {extra, id, generator, async, params, body} = babel_node;

    iterate_babel_node(id, str_source, callback);
    each(params, param => iterate_babel_node(param, str_source, callback));
    iterate_babel_node(body, str_source, callback);

    //const {extra, object, computed /*bool*/, property} = babel_node;
    //throw 'NYI'
}

const iterate_babel_member_expression_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_member_expression_node', babel_node);
    const {extra, object, computed /*bool*/, property} = babel_node;



    if (extra) {
        throw 'NYI'
    };
    iterate_babel_node(object, str_source, callback);
    iterate_babel_node(property, str_source, callback);
}

const iterate_babel_call_expression_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_object_property_node', babel_node);

    const {extra, callee} = babel_node;

    if (extra) {
        //throw 'NYI';
        const {parenthasized, parenStart} = extra;
    }
    iterate_babel_node(callee, str_source, callback);

    each(babel_node.arguments, argument => {
        iterate_babel_node(argument, str_source, callback);
    })

    //throw 'stop';
}

const iterate_babel_object_property_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_object_property_node', babel_node);

    const {method, key, computed, shorthand, value} = babel_node;
    //const {properties} = babel_node;

    iterate_babel_node(key, str_source, callback);
    iterate_babel_node(value, str_source, callback);

    //throw 'stop';
}

const iterate_babel_object_expression_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_object_expression_node', babel_node);
    const {properties} = babel_node;

    each(properties, property => {
        iterate_babel_node(property, str_source, callback);
    })

    //throw 'stop';
}

const iterate_babel_return_statement_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_return_statement_node', babel_node);

    const {argument} = babel_node;
    iterate_babel_node(argument, str_source, callback);

    //throw 'stop';

}

const iterate_babel_if_statement_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_if_statement_node', babel_node);

    const {test, concequent, alternate} = babel_node;
    iterate_babel_node(test, str_source, callback);
    iterate_babel_node(concequent, str_source, callback);
    iterate_babel_node(alternate, str_source, callback);


    //throw 'stop';

}

const iterate_babel_block_statement_node = (babel_node, str_source, callback) => {
    const {params, body} = babel_node;
    if (params && params.length > 0) {
        console.log('params', params);
        throw 'stop';
    }
    each(body, body_item => {
        iterate_babel_node(body_item, str_source, callback);
    });
}

const iterate_babel_arrow_function_expression_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_arrow_function_expression_node', babel_node);

    const {generator, async, params, body} = babel_node;

    // Assume the params are nodes.

    if (params.length > 0) {
        //console.log('params', params);
        //throw 'NYI';
        each(params, param => {
            iterate_babel_node(param, str_source, callback);
        })
    }

    iterate_babel_node(body, str_source, callback);
    


    //throw 'stop';
}

const iterate_babel_variable_declaration_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_variable_declaration_node', babel_node);

    const {kind, declarations} = babel_node;
    each(declarations, declaration => iterate_babel_node(declaration, str_source, callback));
    //throw 'stop';
}

const iterate_babel_string_literal_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_string_literal_node', babel_node);
    const {value} = babel_node;
    //throw 'stop';
}

const iterate_babel_identifier_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_identifier_node', babel_node);
    const {name} = babel_node;

    //throw 'stop';
}

const iterate_babel_unary_expression_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_unary_expression_node', babel_node);
    const {operator, argument} = babel_node;

    iterate_babel_node(argument, str_source, callback);


}

const iterate_babel_binary_expression_node = (babel_node, str_source, callback) => {
    //console.log('iterate_babel_binary_expression_node babel_node', babel_node);

    const {left, operator, right} = babel_node;
    iterate_babel_node(left, str_source, callback);
    iterate_babel_node(right, str_source, callback);

    //throw 'stop';
}

const iterate_babel_node = (babel_node, str_source, callback) => {
    //console.log('babel_node', babel_node);

    if (babel_node) {

        let stopped = false;

        const stop = () => stopped = true;

        if (callback) {
            callback(babel_node, stop);
        }
        const {type} = babel_node;

        if (!stopped) {

            if (type === 'BinaryExpression') {
                return iterate_babel_binary_expression_node(babel_node, str_source, callback);
            } else if (type === 'UnaryExpression') {
                return iterate_babel_unary_expression_node(babel_node, str_source, callback);
            } else if (type === 'Identifier') {
                return iterate_babel_identifier_node(babel_node, str_source, callback);
            } else if (type === 'StringLiteral') {
                return iterate_babel_string_literal_node(babel_node, str_source, callback);
            } else if (type === 'VariableDeclaration') {
                return iterate_babel_variable_declaration_node(babel_node, str_source, callback);
            } else if (type === 'ArrowFunctionExpression') {
                return iterate_babel_arrow_function_expression_node(babel_node, str_source, callback);
            } else if (type === 'BlockStatement') {
                return iterate_babel_block_statement_node(babel_node, str_source, callback);
            } else if (type === 'IfStatement') {
                return iterate_babel_if_statement_node(babel_node, str_source, callback);
            } else if (type === 'ReturnStatement') {
                return iterate_babel_return_statement_node(babel_node, str_source, callback);
            } else if (type === 'ObjectExpression') {
                return iterate_babel_object_expression_node(babel_node, str_source, callback);
            } else if (type === 'ObjectProperty') {
                return iterate_babel_object_property_node(babel_node, str_source, callback);
            } else if (type === 'CallExpression') {
                return iterate_babel_call_expression_node(babel_node, str_source, callback);
            } else if (type === 'MemberExpression') {
                return iterate_babel_member_expression_node(babel_node, str_source, callback);
            } else if (type === 'FunctionExpression') {
                return iterate_babel_function_expression_node(babel_node, str_source, callback);
            } else if (type === 'LogicalExpression') {
                return iterate_babel_logical_expression_node(babel_node, str_source, callback);
            } else if (type === 'VariableDeclarator') {
                return iterate_babel_variable_declarator_node(babel_node, str_source, callback);
            } else if (type === 'ExpressionStatement') {
                return iterate_babel_expression_statement_node(babel_node, str_source, callback);
            } else if (type === 'AssignmentExpression') {
                return iterate_babel_assignment_expression_node(babel_node, str_source, callback);
            } else if (type === 'ArrayExpression') {
                return iterate_babel_array_expression_node(babel_node, str_source, callback);
            } else if (type === 'ForStatement') {
                return iterate_babel_for_statement_node(babel_node, str_source, callback);
            } else if (type === 'NumericLiteral') {
                return iterate_babel_numeric_literal_node(babel_node, str_source, callback);
            } else if (type === 'UpdateExpression') {
                return iterate_babel_update_expression_node(babel_node, str_source, callback);
            } else if (type === 'NewExpression') {
                return iterate_babel_new_expression_node(babel_node, str_source, callback);
            } else if (type === 'EmptyStatement') {
                return iterate_babel_empty_statement_node(babel_node, str_source, callback);
            } else if (type === 'NullLiteral') {
                return iterate_babel_null_literal_node(babel_node, str_source, callback);
            } else if (type === 'BooleanLiteral') {
                return iterate_babel_boolean_literal_node(babel_node, str_source, callback);
            } else if (type === 'ThrowStatement') {
                return iterate_babel_throw_statement_node(babel_node, str_source, callback);
            } else if (type === 'AssignmentPattern') {
                return iterate_babel_assignment_pattern_node(babel_node, str_source, callback);
            } else if (type === 'WhileStatement') {
                return iterate_babel_while_statement_node(babel_node, str_source, callback);
            } else if (type === 'ObjectPattern') {
                return iterate_babel_object_pattern_node(babel_node, str_source, callback);
            } else if (type === 'ClassDeclaration') {
                return iterate_babel_class_declaration_node(babel_node, str_source, callback);
            } else if (type === 'ClassBody') {
                return iterate_babel_class_body_node(babel_node, str_source, callback);
            } else if (type === 'ClassMethod') {
                return iterate_babel_class_method_node(babel_node, str_source, callback);
            } else {
                console.log('');
                console.log('type', type);
                console.log('');
                console.log('babel_node', babel_node);
                throw 'stop';
            }

            // ConditionalExpression

        }

        
    }
}

// each_babel_child_node

// iterate_find maybe?

//const iterate_babel_find = (babel_node, str_source, fn_match, callback) = 

// each_babel_child_node

const iterate_babel_child_nodes = (babel_node, str_source, callback) => iterate_babel_node(babel_node, str_source, (node2) => {
    if (babel_node !== node2) {
        callback(node2);
    }
});

// accumulate function?

const get_babel_child_nodes = (babel_node, str_source) => {
    const res = [];
    iterate_babel_child_nodes(babel_node, str_source, (node => res.push(node)));
    return res;
}



const get_identifier_names = babel_node => {
    const arr_names = [], map_names = {};
    iterate_babel_node(babel_node, undefined, (babel_node) => {
        const {type, name} = babel_node;
        if (type === 'Identifier') {
            if (!map_names[name]) {
                arr_names.push(name);
                map_names[name] = true;
            }
        }
        //console.log('get_identifier_names cb babel_node', babel_node);
        //c++;
    });
    return arr_names;
}

const get_named_call = (babel_node, target_name) => {
    let res;
    iterate_babel_node(babel_node, undefined, (babel_node) => {
        
        //console.log('babel_node', babel_node);

        // if it is a function call
        //  with the name require / ?, or id name require.
        const {type, name} = babel_node;

        /*
        if (type === 'Identifier') {

            if (name === 'require') {
                throw 'stop!';
            }

        }
        */
        if (type === 'CallExpression') {
            //throw 'stop';
            const {callee} = babel_node;
            const args = babel_node.arguments;

            if (callee) {
                const {type, name} = callee;
                if (type === 'Identifier') {

                    if (name === target_name) {
                        if (args.length === 1) {
                            const {value} = args[0];
                            //return babel_node;
                            res = babel_node;
                        } else {
                            throw 'stop';
                        }

                        //throw 'stop!';
                    }

                } else {
                    throw 'stop';
                }


            } else {
                throw 'stop';
            }
        }
    });
    return res;
}

const count_nodes = babel_node => {
    let c = 0;
    iterate_babel_node(babel_node, str_source, (babel_node) => {
        //console.log('cb babel_node', babel_node);
        c++;
    });
    return c;

}

const get_require_call = babel_node => get_named_call(babel_node, 'require');
const has_require_call = babel_node => !!get_require_call(babel_node);

// getting the names (string literal values) of whatever is required.

// pattern signatures and matching looks like the best way to go.
//  

// structure patterns
//  could ignore variable names?

// or run some kind of deep copy / clone on babel nodes and transform them.


const babel_node_tools = {
    iterate_babel_binary_expression_node: iterate_babel_binary_expression_node,
    iterate_babel_unary_expression_node: iterate_babel_unary_expression_node,
    iterate_babel_identifier_node: iterate_babel_identifier_node,
    iterate_babel_string_literal_node: iterate_babel_string_literal_node,
    iterate_babel_variable_declaration_node: iterate_babel_variable_declaration_node,
    iterate_babel_arrow_function_expression_node: iterate_babel_arrow_function_expression_node,
    iterate_babel_block_statement_node: iterate_babel_block_statement_node,
    iterate_babel_if_statement_node: iterate_babel_if_statement_node,
    iterate_babel_return_statement_node: iterate_babel_return_statement_node,
    iterate_babel_object_expression_node: iterate_babel_object_expression_node,
    iterate_babel_member_expression_node: iterate_babel_member_expression_node,
    iterate_babel_function_expression_node: iterate_babel_function_expression_node,
    iterate_babel_logical_expression_node: iterate_babel_logical_expression_node,
    iterate_babel_variable_declarator_node: iterate_babel_variable_declarator_node,
    iterate_babel_expression_statement_node: iterate_babel_expression_statement_node,
    iterate_babel_assignment_expression_node: iterate_babel_assignment_expression_node,
    iterate_babel_array_expression_node: iterate_babel_array_expression_node,
    iterate_babel_for_statement_node: iterate_babel_for_statement_node,
    iterate_babel_numeric_literal_node: iterate_babel_numeric_literal_node,
    iterate_babel_update_expression_node: iterate_babel_update_expression_node,
    iterate_babel_new_expression_node: iterate_babel_new_expression_node,
    iterate_babel_empty_statement_node: iterate_babel_empty_statement_node,
    iterate_babel_null_literal_node: iterate_babel_null_literal_node,
    iterate_babel_boolean_literal_node: iterate_babel_boolean_literal_node,
    iterate_babel_throw_statement_node: iterate_babel_throw_statement_node,
    iterate_babel_assignment_pattern_node: iterate_babel_assignment_pattern_node,
    iterate_babel_while_statement_node: iterate_babel_while_statement_node,
    iterate_babel_object_pattern_node: iterate_babel_object_pattern_node,
    iterate_babel_class_declaration_node: iterate_babel_class_declaration_node,
    iterate_babel_class_body_node: iterate_babel_class_body_node,
    iterate_babel_class_method_node: iterate_babel_class_method_node,

    iterate_babel_node: iterate_babel_node, //maybe just this one is necessary.
    iterate_babel_child_nodes: iterate_babel_child_nodes,
    //each_babel_child_node: each_babel_child_node,

    count_nodes: count_nodes,

    get_babel_child_nodes: get_babel_child_nodes,

    get_identifier_names: get_identifier_names,
    get_require_call: get_require_call,
    has_require_call, has_require_call
}

module.exports = babel_node_tools;