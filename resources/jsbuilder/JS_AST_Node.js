const {each} = require('lang-mini');

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

        // then functionality to iterate through the ast nodes.

        //  could use the 'iterate' with a callback, so the callback occurs on every node.
        //   or on specific nodes.

        // ClassBody

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
                if (callback) {
                    callback(babel_node);
                }
                const {type} = babel_node;
    
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
            }
    
            // ClassMethod
    
            // iterate_babel_class_body_node
        }
        //const iterate_babel_node = (babel_node) => {

        if (babel_node) {
            iterate_babel_node(babel_node, str_source);
        }

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

        this.get_identifier_names = () => {
            //throw 'NYI';
            const map_names = {}, arr_names = [];

            iterate_babel_node(babel_node, str_source, (babel_node) => {
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













    }
}

module.exports = JS_AST_Node;