// May make it support depth and paths.

// path starts at /
// then it's numbers for the number of each child.






const {each} = require('lang-mini');
//const babel_node_tools = require('../babel_node_tools');


// deep_iterate_babel_super_node

const deep_iterate_babel_super_node = (babel_node, depth, path, common, callback) => {
    //let sibling_number = 0;
    //const {test, concequent, alternate} = babel_node;
    //deep_iterate_babel_node_$INTERNAL(test, depth + 1, path + sibling_number++ + '/', common, callback);
    //deep_iterate_babel_node_$INTERNAL(concequent, depth + 1, path + sibling_number++ + '/', common, callback);
    //deep_iterate_babel_node_$INTERNAL(alternate, depth + 1, path + sibling_number++ + '/', common, callback);

    //console.log('babel_node', babel_node);
    //throw 'nyi';

    // like an if statement
}

const deep_iterate_babel_conditional_expression_node = (babel_node, depth, path, common, callback) => {
    let sibling_number = 0;
    const {test, concequent, alternate} = babel_node;
    deep_iterate_babel_node_$INTERNAL(test, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(concequent, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(alternate, depth + 1, path + sibling_number++ + '/', common, callback);

    // like an if statement
}

const deep_iterate_babel_object_method_node = (babel_node, depth, path, common, callback) => {
    //console.log('babel_node', babel_node);

    const {key, params, body} = babel_node;

    let sibling_number = 0;
    deep_iterate_babel_node_$INTERNAL(key, depth + 1, path + sibling_number++ + '/', common, callback);
    each(params, x => deep_iterate_babel_node_$INTERNAL(x, depth + 1, path + sibling_number++ + '/', common, callback));
    deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);

    //throw 'NYI';
}


// deep_iterate_object_method_node
const deep_iterate_this_expression_node = (babel_node, depth, path, common, callback) => {

    // Maybe no further iteration to do???


    //throw 'stop';
}

// const deep_iterate_array_pattern_node

const deep_iterate_array_pattern_node = (babel_node, depth, path, common, callback) => {
    // .elements

    const {elements} = babel_node;
    let sibling_number = 0;
    
    each(elements, x => deep_iterate_babel_node_$INTERNAL(x, depth + 1, path + sibling_number++ + '/', common, callback));
}

// may put the sibling number / index into the callback.

const deep_iterate_program_node = (babel_node, depth, path, common, callback) => {
    const {body, directives} = babel_node;
    let sibling_number = 0;
    each(body, x => deep_iterate_babel_node_$INTERNAL(x, depth + 1, path + sibling_number++ + '/', common, callback));

    if (directives.length > 0) {
        console.log('babel_node', babel_node);
        console.log('directives', directives);
        throw 'NYI';
    }
}

// deep_iterate_babel_file_node

const deep_iterate_babel_file_node = (babel_node, depth, path, common, callback) => {
    const {program} = babel_node;
    let sibling_number = 0;
    deep_iterate_babel_node_$INTERNAL(program, depth + 1, path + sibling_number++ + '/', common, callback);
}


const deep_iterate_babel_class_method_node = (babel_node, depth, path, common, callback) => {
    const {key, computed, kind, id, body, params} = babel_node;
    let sibling_number = 0;
    //console.log('babel_node', babel_node);
    //throw 'stop';
    deep_iterate_babel_node_$INTERNAL(key, depth + 1, path + sibling_number++ + '/', common, callback);
    if (id) {
        console.log('babel_node', babel_node);
        throw 'NYI';
    }

    each(params, x => deep_iterate_babel_node_$INTERNAL(x, depth + 1, path + sibling_number++ + '/', common, callback));
    deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);

    //console.log('babel_node', babel_node);
    //throw 'stop';
}

const deep_iterate_babel_class_body_node = (babel_node, depth, path, common, callback) => {
    const {extra, body} = babel_node;
    let sibling_number = 0;
    //deep_iterate_babel_node(body, depth, path, common, callback);
    each(body, x => deep_iterate_babel_node_$INTERNAL(x, depth + 1, path + sibling_number++ + '/', common, callback));
    
}

const deep_iterate_babel_class_declaration_node = (babel_node, depth, path, common, callback) => {
    //console.log('babel_node', babel_node);
    let sibling_number = 0;
    const {extra, id, superclass, body} = babel_node;
    deep_iterate_babel_node_$INTERNAL(id, depth + 1, path + sibling_number++ + '/', common, callback);

    if (superclass) {
        console.log('babel_node', babel_node);
        throw 'NYI';
    }
    deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);


    //console.log('body', body);
    //console.log('babel_node', babel_node);
    //throw 'stop';
}

const deep_iterate_babel_object_pattern_node = (babel_node, depth, path, common, callback) => {
    const {extra, properties} = babel_node;
    let sibling_number = 0;
    each(properties, x => deep_iterate_babel_node_$INTERNAL(x, depth + 1, path + sibling_number++ + '/', common, callback));
}

const deep_iterate_babel_while_statement_node = (babel_node, depth, path, common, callback) => {
    const {extra, body, test} = babel_node;
    let sibling_number = 0;
    deep_iterate_babel_node_$INTERNAL(test, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);
}

const deep_iterate_babel_assignment_pattern_node = (babel_node, depth, path, common, callback) => {
    const {extra, left, right} = babel_node;
    let sibling_number = 0;
    deep_iterate_babel_node_$INTERNAL(left, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(right, depth + 1, path + sibling_number++ + '/', common, callback);
}

const deep_iterate_babel_throw_statement_node = (babel_node, depth, path, common, callback) => {
    const {extra, argument} = babel_node;
    let sibling_number = 0;
    deep_iterate_babel_node_$INTERNAL(argument, depth + 1, path + sibling_number++ + '/', common, callback);
    
    //deep_iterate_babel_node(right, str_source);
    //each(elements, element => deep_iterate_babel_node(element, str_source));
}

const deep_iterate_babel_boolean_literal_node = (babel_node, depth, path, common, callback) => {
    const {value} = babel_node;
}

const deep_iterate_babel_null_literal_node = (babel_node, depth, path, common, callback) => {

}

const deep_iterate_babel_empty_statement_node = (babel_node, depth, path, common, callback) => {

}

const deep_iterate_babel_new_expression_node = (babel_node, depth, path, common, callback) => {
    const {extra, callee} = babel_node;
    let sibling_number = 0;

    deep_iterate_babel_node_$INTERNAL(callee, depth + 1, path + sibling_number++ + '/', common, callback);
    each(babel_node.arguments, x => deep_iterate_babel_node_$INTERNAL(x, depth + 1, path + sibling_number++ + '/', common, callback));
    //deep_iterate_babel_node(right, str_source);
    //each(elements, element => deep_iterate_babel_node(element, str_source));
}

const deep_iterate_babel_update_expression_node = (babel_node, depth, path, common, callback) => {
    const {extra, operator, prefix, argument} = babel_node;
    let sibling_number = 0;

    deep_iterate_babel_node_$INTERNAL(argument, depth + 1, path + sibling_number++ + '/', common, callback);
    
    //deep_iterate_babel_node(right, str_source);
    //each(elements, element => deep_iterate_babel_node(element, str_source));
}

const deep_iterate_babel_numeric_literal_node = (babel_node, depth, path, common, callback) => {
    const {extra, value} = babel_node;
    
    //deep_iterate_babel_node(right, str_source);
    //each(elements, element => deep_iterate_babel_node(element, str_source));
}


const deep_iterate_babel_for_statement_node = (babel_node, depth, path, common, callback) => {
    const {extra, init, test, update, body} = babel_node;
    let sibling_number = 0;

    deep_iterate_babel_node_$INTERNAL(init, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(test, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(update, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);
    //deep_iterate_babel_node(right, str_source);
    //each(elements, element => deep_iterate_babel_node(element, str_source));
}

const deep_iterate_babel_array_expression_node = (babel_node, depth, path, common, callback) => {
    const {extra, elements} = babel_node;
    let sibling_number = 0;
    //console.log('babel_node', babel_node);
    //throw 'stop';
    //deep_iterate_babel_node(left, str_source);
    //deep_iterate_babel_node(right, str_source);
    each(elements, element => deep_iterate_babel_node_$INTERNAL(element, depth + 1, path + sibling_number++ + '/', common, callback));
}

const deep_iterate_babel_assignment_expression_node = (babel_node, depth, path, common, callback) => {
    const {extra, left, operator, right} = babel_node;
    let sibling_number = 0;
    deep_iterate_babel_node_$INTERNAL(left, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(right, depth + 1, path + sibling_number++ + '/', common, callback);
}

const deep_iterate_babel_expression_statement_node = (babel_node, depth, path, common, callback) => {
    //const {extra, left, operator, right} = babel_node;
    const {extra, expression} = babel_node;
    let sibling_number = 0;
    deep_iterate_babel_node_$INTERNAL(expression, depth + 1, path + sibling_number++ + '/', common, callback);
    //deep_iterate_babel_node_$INTERNAL(right, depth + 1, path + sibling_number++ + '/', common, callback);
}

const deep_iterate_babel_variable_declarator_node = (babel_node, depth, path, common, callback) => {
    const {extra, id, init} = babel_node;
    let sibling_number = 0;
    deep_iterate_babel_node_$INTERNAL(id, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(init, depth + 1, path + sibling_number++ + '/', common, callback);
}

const deep_iterate_babel_logical_expression_node = (babel_node, depth, path, common, callback) => {
    const {extra, left, operator, right} = babel_node;
    let sibling_number = 0;
    deep_iterate_babel_node_$INTERNAL(left, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(right, depth + 1, path + sibling_number++ + '/', common, callback);
}

const deep_iterate_babel_function_expression_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_function_expression_node', babel_node);
    let sibling_number = 0;
    const {extra, id, generator, async, params, body} = babel_node;

    deep_iterate_babel_node_$INTERNAL(id, depth + 1, path + sibling_number++ + '/', common, callback);
    each(params, param => deep_iterate_babel_node_$INTERNAL(param, depth + 1, path + sibling_number++ + '/', common, callback));
    deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);

    //const {extra, object, computed /*bool*/, property} = babel_node;
    //throw 'NYI'
}

const deep_iterate_babel_member_expression_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_member_expression_node', babel_node);
    const {extra, object, computed /*bool*/, property} = babel_node;
    let sibling_number = 0;


    if (extra) {

        //console.log('babel_node', babel_node);
        //console.log('extra', extra);

        //throw 'NYI'
    };
    deep_iterate_babel_node_$INTERNAL(object, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(property, depth + 1, path + sibling_number++ + '/', common, callback);
}

const deep_iterate_babel_call_expression_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_object_property_node', babel_node);
    let sibling_number = 0;
    const {extra, callee} = babel_node;

    if (extra) {
        //throw 'NYI';
        const {parenthasized, parenStart} = extra;
    }
    deep_iterate_babel_node_$INTERNAL(callee, depth + 1, path + sibling_number++ + '/', common, callback);

    each(babel_node.arguments, argument => {
        deep_iterate_babel_node_$INTERNAL(argument, depth + 1, path + sibling_number++ + '/', common, callback);
    })

    //throw 'stop';
}

const deep_iterate_babel_object_property_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_object_property_node', babel_node);

    const {method, key, computed, shorthand, value} = babel_node;
    //const {properties} = babel_node;
    let sibling_number = 0;

    // but the key and the value can be the same???

    //console.log('key', key);
    //console.log('value', value);

    // Key and value being the same thing?



    deep_iterate_babel_node_$INTERNAL(key, depth + 1, path + sibling_number++ + '/', common, callback);
    
    if (value.start !== key.start) {
        //throw 'stop';
        deep_iterate_babel_node_$INTERNAL(value, depth + 1, path + sibling_number++ + '/', common, callback);
    }
    //

    //throw 'stop';
}

const deep_iterate_babel_object_expression_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_object_expression_node', babel_node);
    const {properties} = babel_node;
    let sibling_number = 0;
    each(properties, property => {
        deep_iterate_babel_node_$INTERNAL(property, depth + 1, path + sibling_number++ + '/', common, callback);
    })

    //throw 'stop';
}

const deep_iterate_babel_return_statement_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_return_statement_node', babel_node);
    let sibling_number = 0;
    const {argument} = babel_node;
    deep_iterate_babel_node_$INTERNAL(argument, depth + 1, path + sibling_number++ + '/', common, callback);

    //throw 'stop';

}

const deep_iterate_babel_if_statement_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_if_statement_node', babel_node);
    let sibling_number = 0;
    const {test, concequent, alternate} = babel_node;
    deep_iterate_babel_node_$INTERNAL(test, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(concequent, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(alternate, depth + 1, path + sibling_number++ + '/', common, callback);


    //throw 'stop';

}

const deep_iterate_babel_block_statement_node = (babel_node, depth, path, common, callback) => {
    const {params, body} = babel_node;
    let sibling_number = 0;
    if (params && params.length > 0) {
        console.log('params', params);
        throw 'stop';
    }
    each(body, body_item => {
        deep_iterate_babel_node_$INTERNAL(body_item, depth + 1, path + sibling_number++ + '/', common, callback);
    });
}

const deep_iterate_babel_function_declaration_node = (babel_node, depth, path, common, callback) => {
    const {extra, id, generator, async, params, body} = babel_node;

    let sibling_number = 0;

    deep_iterate_babel_node_$INTERNAL(id, depth + 1, path + sibling_number++ + '/', common, callback);
    each(params, param => deep_iterate_babel_node_$INTERNAL(param, depth + 1, path + sibling_number++ + '/', common, callback));
    deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);


}

const deep_iterate_babel_arrow_function_expression_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_arrow_function_expression_node', babel_node);

    const {generator, async, params, body} = babel_node;
    let sibling_number = 0;
    // Assume the params are nodes.

    if (params.length > 0) {
        //console.log('params', params);
        //throw 'NYI';
        each(params, param => {
            deep_iterate_babel_node_$INTERNAL(param, depth + 1, path + sibling_number++ + '/', common, callback);
        })
    }

    deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);
    


    //throw 'stop';
}

const deep_iterate_babel_variable_declaration_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_variable_declaration_node', babel_node);

    const {kind, declarations} = babel_node;
    let sibling_number = 0;
    each(declarations, declaration => deep_iterate_babel_node_$INTERNAL(declaration, depth + 1, path + sibling_number++ + '/', common, callback));
    //throw 'stop';
}

const deep_iterate_babel_string_literal_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_string_literal_node', babel_node);
    const {value} = babel_node;
    //throw 'stop';
}

const deep_iterate_babel_identifier_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_identifier_node', babel_node);
    const {name} = babel_node;

    //throw 'stop';
}

const deep_iterate_babel_unary_expression_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_unary_expression_node', babel_node);
    const {operator, argument} = babel_node;
    let sibling_number = 0;

    deep_iterate_babel_node_$INTERNAL(argument, depth + 1, path + sibling_number++ + '/', common, callback);


}


const deep_iterate_babel_binary_expression_node = (babel_node, depth, path, common, callback) => {
    //console.log('deep_iterate_babel_binary_expression_node babel_node', babel_node);
    let sibling_number = 0;
    const {left, operator, right} = babel_node;
    deep_iterate_babel_node_$INTERNAL(left, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(right, depth + 1, path + sibling_number++ + '/', common, callback);

    //throw 'stop';
}

const deep_iterate_babel_template_literal_node = (babel_node, depth, path, common, callback) => {
    // expressions and quasis

    const {generator, async, params, body, quasis, expressions} = babel_node;

    const q0 = babel_node.quasis[0];
    //console.log('babel_node', babel_node);
    //throw 'NYI';
    //console.log('q0', q0);
    // has both raw and cooked values.

    // template element.

    //const {} = babel_node;
    let sibling_number = 0;
    // Assume the params are nodes.


    if (expressions.length > 0) {
        throw 'NYI';
    }

    if (quasis.length > 0) {
        each(quasis, x => deep_iterate_babel_node_$INTERNAL(x, depth + 1, path + sibling_number++ + '/', common, callback));
        //console.log('params', params);
        //throw 'NYI';
        //each(quasis, quasi => {
        //    deep_iterate_babel_node_$INTERNAL(quasi, depth + 1, path + sibling_number++ + '/', common, callback);
        //})
    }


    
}

// deep_iterate_babel_template_element_node

const deep_iterate_babel_template_element_node = (babel_node, depth, path, common, callback) => {
    // value.raw is basically it.

    const {value} = babel_node;
    const {raw, cooked} = value;

};

// deep_iterate_babel_try_statement_node

const deep_iterate_babel_try_statement_node = (babel_node, depth, path, common, callback) => {
    // value.raw is basically it.

    const {block, handler} = babel_node;
    let sibling_number = 0;

    deep_iterate_babel_node_$INTERNAL(block, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(handler, depth + 1, path + sibling_number++ + '/', common, callback);

};

//deep_iterate_babel_catch_clause_node

const deep_iterate_babel_catch_clause_node = (babel_node, depth, path, common, callback) => {
    // value.raw is basically it.

    const {param, body} = babel_node;
    let sibling_number = 0;

    deep_iterate_babel_node_$INTERNAL(param, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);

};

// deep_iterate_babel_switch_statement_node   1 discriminant, n cases

const deep_iterate_babel_switch_statement_node = (babel_node, depth, path, common, callback) => {
    // value.raw is basically it.

    const {discriminant, cases} = babel_node;
    let sibling_number = 0;

    deep_iterate_babel_node_$INTERNAL(discriminant, depth + 1, path + sibling_number++ + '/', common, callback);

    each(cases, x => deep_iterate_babel_node_$INTERNAL(x, depth + 1, path + sibling_number++ + '/', common, callback));
    //deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);

};

// deep_iterate_babel_switch_case_node


const deep_iterate_babel_switch_case_node = (babel_node, depth, path, common, callback) => {
    // value.raw is basically it.

    //console.log('babel_node', babel_node);
    //throw 'NYI';

    const {consequent, test} = babel_node;
    let sibling_number = 0;


    if (consequent.length > 0) {
        //throw 'NYI';
        each(consequent, x => deep_iterate_babel_node_$INTERNAL(x, depth + 1, path + sibling_number++ + '/', common, callback));
    }

    deep_iterate_babel_node_$INTERNAL(test, depth + 1, path + sibling_number++ + '/', common, callback);

    
    //deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);

};

// deep_iterate_babel_regexp_literal_node


const deep_iterate_babel_regexp_literal_node = (babel_node, depth, path, common, callback) => {

    

};

// deep_iterate_babel_break_statement_node

const deep_iterate_babel_break_statement_node = (babel_node, depth, path, common, callback) => {

    

};

// deep_iterate_babel_for_in_statement_node


const deep_iterate_babel_for_in_statement_node = (babel_node, depth, path, common, callback) => {
    // value.raw is basically it.

    const {left, right, body} = babel_node;
    let sibling_number = 0;

    deep_iterate_babel_node_$INTERNAL(left, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(right, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);

};

const deep_iterate_babel_for_of_statement_node = (babel_node, depth, path, common, callback) => {
    // value.raw is basically it.

    const {left, right, body} = babel_node;
    let sibling_number = 0;

    deep_iterate_babel_node_$INTERNAL(left, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(right, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);

};

// deep_iterate_babel_for_of_statement_node

// deep_iterate_babel_sequence_expression_node


const deep_iterate_babel_sequence_expression_node = (babel_node, depth, path, common, callback) => {
    // value.raw is basically it.

    const {expressions} = babel_node;
    let sibling_number = 0;

    //deep_iterate_babel_node_$INTERNAL(discriminant, depth + 1, path + sibling_number++ + '/', common, callback);

    each(expressions, x => deep_iterate_babel_node_$INTERNAL(x, depth + 1, path + sibling_number++ + '/', common, callback));
    //deep_iterate_babel_node_$INTERNAL(body, depth + 1, path + sibling_number++ + '/', common, callback);

};

// deep_iterate_babel_class_expression_node
const deep_iterate_babel_class_expression_node = (babel_node, depth, path, common, callback) => {
    // value.raw is basically it.

    const {id, superClass, node} = babel_node;
    let sibling_number = 0;

    if (id) deep_iterate_babel_node_$INTERNAL(id, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(superClass, depth + 1, path + sibling_number++ + '/', common, callback);
    deep_iterate_babel_node_$INTERNAL(node, depth + 1, path + sibling_number++ + '/', common, callback);

};

// deep_iterate_babel_rest_element_node
const deep_iterate_babel_rest_element_node = (babel_node, depth, path, common, callback) => {
    // value.raw is basically it.

    const {argument} = babel_node;
    let sibling_number = 0;

    if (argument) deep_iterate_babel_node_$INTERNAL(argument, depth + 1, path + sibling_number++ + '/', common, callback);
    

};

// deep_iterate_babel_await_expression_node

const deep_iterate_babel_await_expression_node = (babel_node, depth, path, common, callback) => {
    // value.raw is basically it.

    const {argument} = babel_node;
    let sibling_number = 0;

    if (argument) deep_iterate_babel_node_$INTERNAL(argument, depth + 1, path + sibling_number++ + '/', common, callback);
    

};


const deep_iterate_babel_node_$INTERNAL = (babel_node, depth, path, common, callback) => {

    if (babel_node) {

        //let stopped = false;

        const stop = () => common.stopped = true;

        if (callback) {
            callback(babel_node, path, depth, stop);
        }
        const {type} = babel_node;

        if (!common.stopped) {

            if (type === 'BinaryExpression') {
                return deep_iterate_babel_binary_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'UnaryExpression') {
                return deep_iterate_babel_unary_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'Identifier') {
                return deep_iterate_babel_identifier_node(babel_node, depth, path, common, callback);
            } else if (type === 'StringLiteral') {
                return deep_iterate_babel_string_literal_node(babel_node, depth, path, common, callback);
            } else if (type === 'VariableDeclaration') {
                return deep_iterate_babel_variable_declaration_node(babel_node, depth, path, common, callback);
            } else if (type === 'ArrowFunctionExpression') {
                return deep_iterate_babel_arrow_function_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'BlockStatement') {
                return deep_iterate_babel_block_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'IfStatement') {
                return deep_iterate_babel_if_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'ReturnStatement') {
                return deep_iterate_babel_return_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'ObjectExpression') {
                return deep_iterate_babel_object_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'ObjectProperty') {
                return deep_iterate_babel_object_property_node(babel_node, depth, path, common, callback);
            } else if (type === 'CallExpression') {
                return deep_iterate_babel_call_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'MemberExpression') {
                return deep_iterate_babel_member_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'FunctionExpression') {
                return deep_iterate_babel_function_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'LogicalExpression') {
                return deep_iterate_babel_logical_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'VariableDeclarator') {
                return deep_iterate_babel_variable_declarator_node(babel_node, depth, path, common, callback);
            } else if (type === 'ExpressionStatement') {
                return deep_iterate_babel_expression_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'AssignmentExpression') {
                return deep_iterate_babel_assignment_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'ArrayExpression') {
                return deep_iterate_babel_array_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'ForStatement') {
                return deep_iterate_babel_for_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'NumericLiteral') {
                return deep_iterate_babel_numeric_literal_node(babel_node, depth, path, common, callback);
            } else if (type === 'UpdateExpression') {
                return deep_iterate_babel_update_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'NewExpression') {
                return deep_iterate_babel_new_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'EmptyStatement') {
                return deep_iterate_babel_empty_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'NullLiteral') {
                return deep_iterate_babel_null_literal_node(babel_node, depth, path, common, callback);
            } else if (type === 'BooleanLiteral') {
                return deep_iterate_babel_boolean_literal_node(babel_node, depth, path, common, callback);
            } else if (type === 'ThrowStatement') {
                return deep_iterate_babel_throw_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'AssignmentPattern') {
                return deep_iterate_babel_assignment_pattern_node(babel_node, depth, path, common, callback);
            } else if (type === 'WhileStatement') {
                return deep_iterate_babel_while_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'ObjectPattern') {
                return deep_iterate_babel_object_pattern_node(babel_node, depth, path, common, callback);
            } else if (type === 'ClassDeclaration') {
                return deep_iterate_babel_class_declaration_node(babel_node, depth, path, common, callback);
            } else if (type === 'ClassBody') {
                return deep_iterate_babel_class_body_node(babel_node, depth, path, common, callback);
            } else if (type === 'ClassMethod') {
                return deep_iterate_babel_class_method_node(babel_node, depth, path, common, callback);
            } else if (type === 'File') {
                return deep_iterate_babel_file_node(babel_node, depth, path, common, callback);
            } else if (type === 'Program') {
                return deep_iterate_program_node(babel_node, depth, path, common, callback);
            } else if (type === 'ArrayPattern') {
                return deep_iterate_array_pattern_node(babel_node, depth, path, common, callback);
            } else if (type === 'ThisExpression') {
                return deep_iterate_this_expression_node(babel_node, depth, path, common, callback);
            //} else if (type === 'BlockStatement') {
            //    return deep_iterate_block_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'ObjectMethod') {
                return deep_iterate_babel_object_method_node(babel_node, depth, path, common, callback);
            } else if (type === 'ConditionalExpression') {
                return deep_iterate_babel_conditional_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'Super') {
                return deep_iterate_babel_super_node(babel_node, depth, path, common, callback);
            } else if (type === 'FunctionDeclaration') {
                return deep_iterate_babel_function_declaration_node(babel_node, depth, path, common, callback);
            } else if (type === 'TemplateLiteral') {
                return deep_iterate_babel_template_literal_node(babel_node, depth, path, common, callback);
            } else if (type === 'TemplateElement') {
                return deep_iterate_babel_template_element_node(babel_node, depth, path, common, callback);
            } else if (type === 'TryStatement') {
                return deep_iterate_babel_try_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'CatchClause') {
                return deep_iterate_babel_catch_clause_node(babel_node, depth, path, common, callback);
            } else if (type === 'SwitchStatement') {
                return deep_iterate_babel_switch_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'SwitchCase') {
                return deep_iterate_babel_switch_case_node(babel_node, depth, path, common, callback);
            } else if (type === 'RegExpLiteral') {
                return deep_iterate_babel_regexp_literal_node(babel_node, depth, path, common, callback);
            } else if (type === 'BreakStatement') {
                return deep_iterate_babel_break_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'ForInStatement') {
                return deep_iterate_babel_for_in_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'ForOfStatement') {
                return deep_iterate_babel_for_of_statement_node(babel_node, depth, path, common, callback);
            } else if (type === 'SequenceExpression') {
                return deep_iterate_babel_sequence_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'ClassExpression') {
                return deep_iterate_babel_class_expression_node(babel_node, depth, path, common, callback);
            } else if (type === 'RestElement') {
                return deep_iterate_babel_rest_element_node(babel_node, depth, path, common, callback);
            } else if (type === 'AwaitExpression') {
                return deep_iterate_babel_await_expression_node(babel_node, depth, path, common, callback);

                // ForOfStatement

            } else {

                // FunctionDeclaration TemplateLiteral TemplateElement TryStatement CatchClause
                // SwitchStatement SwitchCase RegExpLiteral BreakStatement ForInStatement
                // SequenceExpression
                // ClassExpression
                // RestElement (what is this?) A: ...

                // Need to make this handle a template literal too.

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



const deep_iterate_babel_node = (babel_node, callback /* (babel_node, path, depth, stop) => {}*/ ) => {
    // Iteration callback: callback(babel_node, path, depth, stop);

    //console.log('babel_node', babel_node);

    const common = {
        stopped: false
    }

    return deep_iterate_babel_node_$INTERNAL(babel_node, 0, '/', common, callback);
}

/*
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
    */

module.exports = deep_iterate_babel_node;