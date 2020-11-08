// Load a JS file into an OO structure

const JS_File = require('..//JS_File/JS_File');
//const JS_File_Comprehension = require('../JS_File_Comprehension');
const path = require('path');
const fs = require('fs');
const Project = require('../Project');
const {each} = require('lang-mini');


const test_js_file = () => {
    // Worth working with a lower level part of jsgui, such as lang-mini.
    //  lang-mini itself has an external reference.

    // stream the file in.
    const lm_path = '../../../../../tools/lang-mini/lang-mini.js'
    const fnl_path = '../../../../../tools/fnl/fnl.js'
    const filecomp_path = '../JS_File_Comprehension.js';
    const jsfile_path = '../JS_File.js';
    const jsbuilder_path = '../JS_Builder.js';
    //const file_path = '../JS_File.js';
    const file_path = jsbuilder_path;

    // path of lang mini....

    // Write and test a simple and convenient way for analysing JS files and recompiling them.
    // To start with, find the ways to arrange parts of the JS into 'platforms'.
    // How to then build platforms into JS files.
    //  Will be about closures and sequences.
    //  A lot about unique naming, closures, and getting the sequence of definitions correct.

    // ObjectPattern

    // comprehend_babel_null_literal_node

    const comprehend_babel_object_pattern_node = (babel_node, str_source) => {
        const {extra, properties} = babel_node;
        each(properties, x => comprehend_babel_node(x, str_source));
    }

    const comprehend_babel_while_statement_node = (babel_node, str_source) => {
        const {extra, body, test} = babel_node;
        comprehend_babel_node(test, str_source);
        comprehend_babel_node(body, str_source);
    }

    const comprehend_babel_assignment_pattern_node = (babel_node, str_source) => {
        const {extra, left, right} = babel_node;
        comprehend_babel_node(left, str_source);
        comprehend_babel_node(right, str_source);
    }

    const comprehend_babel_throw_statement_node = (babel_node, str_source) => {
        const {extra, argument} = babel_node;

        comprehend_babel_node(argument, str_source);
        
        //comprehend_babel_node(right, str_source);
        //each(elements, element => comprehend_babel_node(element, str_source));
    }

    const comprehend_babel_boolean_literal_node = (babel_node, str_source) => {
        const {value} = babel_node;
    }

    const comprehend_babel_null_literal_node = (babel_node, str_source) => {

    }

    const comprehend_babel_empty_statement_node = (babel_node, str_source) => {

    }

    const comprehend_babel_new_expression_node = (babel_node, str_source) => {
        const {extra, callee, arguments} = babel_node;

        comprehend_babel_node(callee, str_source);
        each(arguments, x => comprehend_babel_node(x, str_source));
        //comprehend_babel_node(right, str_source);
        //each(elements, element => comprehend_babel_node(element, str_source));
    }

    const comprehend_babel_update_expression_node = (babel_node, str_source) => {
        const {extra, operator, prefix, argument} = babel_node;

        comprehend_babel_node(argument, str_source);
        
        //comprehend_babel_node(right, str_source);
        //each(elements, element => comprehend_babel_node(element, str_source));
    }

    const comprehend_babel_numeric_literal_node = (babel_node, str_source) => {
        const {extra, value} = babel_node;
        
        //comprehend_babel_node(right, str_source);
        //each(elements, element => comprehend_babel_node(element, str_source));
    }
    

    const comprehend_babel_for_statement_node = (babel_node, str_source) => {
        const {extra, init, test, update, body} = babel_node;
        comprehend_babel_node(init, str_source);
        comprehend_babel_node(test, str_source);
        comprehend_babel_node(update, str_source);
        comprehend_babel_node(body, str_source);
        //comprehend_babel_node(right, str_source);
        //each(elements, element => comprehend_babel_node(element, str_source));
    }

    const comprehend_babel_array_expression_node = (babel_node, str_source) => {
        const {extra, elements} = babel_node;
        //comprehend_babel_node(left, str_source);
        //comprehend_babel_node(right, str_source);
        each(elements, element => comprehend_babel_node(element, str_source));
    }

    const comprehend_babel_assignment_expression_node = (babel_node, str_source) => {
        const {extra, left, operator, right} = babel_node;
        comprehend_babel_node(left, str_source);
        comprehend_babel_node(right, str_source);
    }

    const comprehend_babel_expression_statement_node = (babel_node, str_source) => {
        const {extra, left, operator, right} = babel_node;
        comprehend_babel_node(left, str_source);
        comprehend_babel_node(right, str_source);
    }

    const comprehend_babel_variable_declarator_node = (babel_node, str_source) => {
        const {extra, id, init} = babel_node;
        comprehend_babel_node(id, str_source);
        comprehend_babel_node(init, str_source);
    }

    const comprehend_babel_logical_expression_node = (babel_node, str_source) => {
        const {extra, left, operator, right} = babel_node;
        comprehend_babel_node(left, str_source);
        comprehend_babel_node(right, str_source);
    }

    const comprehend_babel_function_expression_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_function_expression_node', babel_node);

        const {extra, id, generator, async, params, body} = babel_node;

        comprehend_babel_node(id, str_source);
        each(params, param => comprehend_babel_node(param, str_source));
        comprehend_babel_node(body, str_source);

        //const {extra, object, computed /*bool*/, property} = babel_node;
        //throw 'NYI'
    }

    const comprehend_babel_member_expression_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_member_expression_node', babel_node);
        const {extra, object, computed /*bool*/, property} = babel_node;



        if (extra) {
            throw 'NYI'
        };
        comprehend_babel_node(object, str_source);
        comprehend_babel_node(property, str_source);
    }

    const comprehend_babel_call_expression_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_object_property_node', babel_node);

        const {extra, callee, arguments} = babel_node;

        if (extra) {
            //throw 'NYI';
            const {parenthasized, parenStart} = extra;
        }
        comprehend_babel_node(callee, str_source);

        each(arguments, argument => {
            comprehend_babel_node(argument, str_source);
        })

        //throw 'stop';
    }

    const comprehend_babel_object_property_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_object_property_node', babel_node);

        const {method, key, computed, shorthand, value} = babel_node;
        //const {properties} = babel_node;

        comprehend_babel_node(key, str_source);
        comprehend_babel_node(value, str_source);

        //throw 'stop';
    }

    const comprehend_babel_object_expression_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_object_expression_node', babel_node);
        const {properties} = babel_node;

        each(properties, property => {
            comprehend_babel_node(property, str_source);
        })

        //throw 'stop';
    }

    const comprehend_babel_return_statement_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_return_statement_node', babel_node);

        const {argument} = babel_node;
        comprehend_babel_node(argument, str_source);

        //throw 'stop';

    }

    const comprehend_babel_if_statement_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_if_statement_node', babel_node);

        const {test, concequent, alternate} = babel_node;
        comprehend_babel_node(test, str_source);
        comprehend_babel_node(concequent, str_source);
        comprehend_babel_node(alternate, str_source);


        //throw 'stop';

    }

    const comprehend_babel_block_statement_node = (babel_node, str_source) => {
        const {params, body} = babel_node;
        if (params && params.length > 0) {
            console.log('params', params);
            throw 'stop';
        }
        each(body, body_item => {
            comprehend_babel_node(body_item, str_source);
        });
    }

    const comprehend_babel_arrow_function_expression_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_arrow_function_expression_node', babel_node);

        const {generator, async, params, body} = babel_node;

        // Assume the params are nodes.

        if (params.length > 0) {
            console.log('params', params);
            //throw 'NYI';
            each(params, param => {
                comprehend_babel_node(param, str_source);
            })
        }

        comprehend_babel_node(body, str_source);
        


        //throw 'stop';
    }

    const comprehend_babel_variable_declaration_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_variable_declaration_node', babel_node);

        const {kind, declarations} = babel_node;
        each(declarations, declaration => comprehend_babel_node(declaration, str_source));
        //throw 'stop';
    }

    const comprehend_babel_string_literal_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_string_literal_node', babel_node);
        const {value} = babel_node;
        //throw 'stop';
    }

    const comprehend_babel_identifier_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_identifier_node', babel_node);
        const {name} = babel_node;

        //throw 'stop';
    }

    const comprehend_babel_unary_expression_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_unary_expression_node', babel_node);
        const {operator, argument} = babel_node;

        comprehend_babel_node(argument, str_source);


    }

    const comprehend_babel_binary_expression_node = (babel_node, str_source) => {
        //console.log('comprehend_babel_binary_expression_node babel_node', babel_node);

        const {left, operator, right} = babel_node;
        comprehend_babel_node(left, str_source);
        comprehend_babel_node(right, str_source);

        //throw 'stop';
    }

    const comprehend_babel_node = (babel_node, str_source) => {
        //console.log('babel_node', babel_node);

        if (babel_node) {
            const {type} = babel_node;

            if (type === 'BinaryExpression') {
                return comprehend_babel_binary_expression_node(babel_node, str_source);
            } else if (type === 'UnaryExpression') {
                return comprehend_babel_unary_expression_node(babel_node, str_source);
            } else if (type === 'Identifier') {
                return comprehend_babel_identifier_node(babel_node, str_source);
            } else if (type === 'StringLiteral') {
                return comprehend_babel_string_literal_node(babel_node, str_source);
            } else if (type === 'VariableDeclaration') {
                return comprehend_babel_variable_declaration_node(babel_node, str_source);
            } else if (type === 'ArrowFunctionExpression') {
                return comprehend_babel_arrow_function_expression_node(babel_node, str_source);
            } else if (type === 'BlockStatement') {
                return comprehend_babel_block_statement_node(babel_node, str_source);
            } else if (type === 'IfStatement') {
                return comprehend_babel_if_statement_node(babel_node, str_source);
            } else if (type === 'ReturnStatement') {
                return comprehend_babel_return_statement_node(babel_node, str_source);
            } else if (type === 'ObjectExpression') {
                return comprehend_babel_object_expression_node(babel_node, str_source);
            } else if (type === 'ObjectProperty') {
                return comprehend_babel_object_property_node(babel_node, str_source);
            } else if (type === 'CallExpression') {
                return comprehend_babel_call_expression_node(babel_node, str_source);
            } else if (type === 'MemberExpression') {
                return comprehend_babel_member_expression_node(babel_node, str_source);
            } else if (type === 'FunctionExpression') {
                return comprehend_babel_function_expression_node(babel_node, str_source);
            } else if (type === 'LogicalExpression') {
                return comprehend_babel_logical_expression_node(babel_node, str_source);
            } else if (type === 'VariableDeclarator') {
                return comprehend_babel_variable_declarator_node(babel_node, str_source);
            } else if (type === 'ExpressionStatement') {
                return comprehend_babel_expression_statement_node(babel_node, str_source);
            } else if (type === 'AssignmentExpression') {
                return comprehend_babel_assignment_expression_node(babel_node, str_source);
            } else if (type === 'ArrayExpression') {
                return comprehend_babel_array_expression_node(babel_node, str_source);
            } else if (type === 'ForStatement') {
                return comprehend_babel_for_statement_node(babel_node, str_source);
            } else if (type === 'NumericLiteral') {
                return comprehend_babel_numeric_literal_node(babel_node, str_source);
            } else if (type === 'UpdateExpression') {
                return comprehend_babel_update_expression_node(babel_node, str_source);
            } else if (type === 'NewExpression') {
                return comprehend_babel_new_expression_node(babel_node, str_source);
            } else if (type === 'EmptyStatement') {
                return comprehend_babel_empty_statement_node(babel_node, str_source);
            } else if (type === 'NullLiteral') {
                return comprehend_babel_null_literal_node(babel_node, str_source);
            } else if (type === 'BooleanLiteral') {
                return comprehend_babel_boolean_literal_node(babel_node, str_source);
            } else if (type === 'ThrowStatement') {
                return comprehend_babel_throw_statement_node(babel_node, str_source);
            } else if (type === 'AssignmentPattern') {
                return comprehend_babel_assignment_pattern_node(babel_node, str_source);
            } else if (type === 'WhileStatement') {
                return comprehend_babel_while_statement_node(babel_node, str_source);
            } else if (type === 'ObjectPattern') {
                return comprehend_babel_object_pattern_node(babel_node, str_source);
            } else {
                console.log('type', type);
                throw 'stop';

            }
        }

        // VariableDeclarator

        // comprehend_babel_object_pattern_node
    }

    const comprehend_babel_init_node = (babel_node, str_source) => {
        //console.log('babel_node', babel_node);
        comprehend_babel_node(babel_node, str_source);
        //throw 'stop';
    }

    // looks like it could be recursive
    const comprehend_babel_declaration = (babel_declaration, str_source, depth = 0) => {

        // Want to provide more basic / easy to use info about it.
        //  See if it matches any known patterns.

        // Does it make reference to anything outside of itself?
        //  Is it self-contained?
        //   That would mean a recursive look.
        //   Would mean checking references of objects.







        //console.log('');
        //console.log('babel_declaration', babel_declaration);
        const {type, kind, start, end, declarations} = babel_declaration;
        

        if (type === 'VariableDeclaration') {
            const {declarations} = babel_declaration;
            //console.log('declarations.length', declarations.length);
            each(declarations, declaration => {

                // Could now put this into the recursive system.

                //console.log('declaration', declaration);
                const {start, end, type} = declaration;
                if (type === 'VariableDeclarator') {
                    const {id, init} = declaration;
                    //console.log('id', id);
                    //console.log('init', init);

                    comprehend_babel_init_node(init, str_source);
                } else {

                    throw 'NYI';
                }

            });
        } else if (type === 'ClassDeclaration') {
            const {id, superClass, body} = babel_declaration;
            //console.log('id', id);

            if (id) {
                const {type, name} = id;
            } else {
                throw 'NYI';
            }

            //throw 'stop';
        } /* else if (type === 'BinaryExpression') {
            throw 'stop';
            const {left, operator, right} = babel_declaration;

            console.log('operator', operator);

            

        } */ else if (type === 'Identifier') {
            const {name, type} = babel_declaration;
            console.log('name', name);
            console.log('type', type);
            throw 'stop';
        } else {


            console.log('type', type);
            throw 'NYI';
        }

        //console.log('type', type);
        //console.log('kind', kind);
        //console.log('');
        //throw 'stop';
    }
    

    const resolved_path = path.resolve(file_path);
    //console.log('resolved_path', resolved_path);

    const fstream = fs.createReadStream(resolved_path);

    const jsf = JS_File.load_from_stream(fstream, file_path);
    jsf.on('ready', () => {
        console.log('jsf ready');

        console.log('jsf.sha512', jsf.sha512);

        const {root_babel_declarations} = jsf;

        //jsf.root_declarations.length

        //console.log('root_babel_declarations', root_babel_declarations);
        console.log('root_babel_declarations.length', root_babel_declarations.length);

        // Go through each of these Babel declarations.
        //  Basically see what they are.
        //   
        each(root_babel_declarations, babel_declaration => {
            //const comprehension = comprehend_babel_declaration(babel_declaration, jsf.source);

            // So far just iterates through them, following the structure.
            //  Will be able to collect names of things used in references
            //  Check the scope is OK.

            // Getting a node count - that would help.
            //  ast node count vs compressed size - decent metric to use.
            //  also can lower ast node count.

            //console.log('comprehension', comprehension);
        });

        const root_dec_names = jsf.get_root_declaration_names();
        console.log('root_dec_names', root_dec_names);

        jsf.each_root_node(js_node => {
            console.log('js_node', js_node);
            console.log('js_node.str_source', js_node.str_source);
            const {type} = js_node; // not a babel node.

            const ct = js_node.count_nodes();
            console.log('ct', ct);
            console.log('js_node.get_identifier_names()', js_node.get_identifier_names());
            const cns = js_node.child_nodes;
            console.log('js_node.child_nodes', cns);

            each(cns, cn => {
                console.log('cn.type', cn.type);
            })
            //console.log('type', type);

            // Can do more specific queries.
            //  

            // get_identifiers function would be nice.


            //throw 'stop';


            /*
            const node_req_info = node.get_require_info();
            console.log('node_req_info', node_req_info);

            if (node_req_info) {

                
            }
            */

            

        });
        //throw 'stop';
        /*
        jsf.each_root_node(node => {
            //console.log('node', node);
            const {type} = node;
            console.log('type', type);

            // No matter what type, does it make use of 'require' and info on that if it does.
            

            

        })
        */
        

        //const require_info = jsf.get_require_info();
        //console.log('require_info', require_info);


        // get_exports_info - could possibly be an object that is defined there.
        //  a reference to an object is easier, but don't rely on it.
        //  deal with js files in the ways they are written and can be written.

        // need to know what a module has incoming / requires / imports
        // also output / exports

        // we will put everything required into local scope.
        // there won't be the 'exports' as everything else needed will be in local scope too.



        // .get_require_references
        //  does any root node contain any require references?
        //   could find them and work back to see what they are.

        // [a, b, c] = [require('a'), require('b'), require('c')] need to be on the lookout for that case. Could be decent syntax too.
        //   if so, to what?

        // Signatures would help a lot here.
        //  require could be part of the signature.
        //   would make it east to find.





        //const rdns_using_require = jsf.get_root_declaration_names_using_require();
        //console.log('rdns_using_require', rdns_using_require);
        // get_root_declaration_names_using_require...

        // Would be nice to be able to reference any declaration by its name.
        //  Then when doing so, see if it
        //   uses require
        //    if so, what does it require
        //   is it all inline?
        //   does it use only local variables (and literals) defined in the code above in that same file / scope?
        //    which locally defined / scoped declarations does it use?
        //  

        // jsf.root_declarations_by_name ...

        // Maybe make the functionality for loading js into a project?
        //  When loaded, it makes all functionality available
        //  And checks that anything that is referenced is available.
        //   (As in available inline from that scope at that point).











        

        const nextstuff = () => {
            //const proj = new Project();
            //proj.load_file_as_platform(jsf); // Meaning it's platform 0?
            // File is in the project.
            //  
            const proj = new Project();
            //proj.load_file_as_platform(jsf); // Meaning it's platform 0?
            // File is in the project.
            //  
            const foundation = proj.create_foundation();
            foundation.add(jsf);
            console.log('foundation.declarations.length', foundation.declarations.length);
            console.log('foundation.declaration_names', foundation.declaration_names);
        }

        



        //const str_js = foundation.toString();
        // 

        // It will find all inline functions
        //  A foundation




    });

    
    //jsf.

    // Building jsgui as a long and flat file could work well.
    // The 'platform' arrangement means many things can be done sequentially.
    //  As in, it gets arranged in a sequence in the file.





    // a whole load of queries possible?
    //  functions that get to the point of 


}

test_js_file();