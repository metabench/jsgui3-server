const {each, tof} = require('lang-mini');
const JS_File = require('./JS_File_Core');
const JS_AST_Node = require('../JS_AST/JS_AST_Node');
const Reference_Sequence = require('../Reference_Sequence');
// Will extract relevant AST code functionality. Files often import things at the beginning, then have declarations, then export what was declared at the end.

// Understanding the import declarations so they could be localised.
//  So we can refer to the ast of them, because we have recognised them elsewhere.

// Can build the functions into a js file.



// JS_File_Writable too...
//   .imports = ... or requires
//   .add_platform?

// Or better to create the platform objects out of the functions which have been comprehended from various files.

// JS_File_Platform?

// This will be more about understanding the js file. Basic structure will have already been obtained.

class JS_File_Comprehension extends JS_File {
    constructor(spec) {
        super(spec);

        // Could have a syntax library - that means syntax that it already knows, and can recognise.




        let ready = false, babel_ast;

        const root_items = [], root_classes = [];
        const initial_root_variable_declarations = [];
        const initial_root_variable_declaration_id_names = [];

        const root_babel_declarations = [];
        const root_variable_declarations = [];
        const root_variable_names = [];
        const root_class_names = [];

        const imported_root_variable_names = [];

        const map_initial_root_property_declarations_by_name = {};
        const map_root_property_declarations_by_name = {}; // not class declarations
        const map_root_class_declarations_by_name = {};
        const variable_declaration_names_using_require = [];

        let code_type;
        let export_name, root_class_name;


        // Then can do an iteration through the AST.
        //  Want to be able to find things out about nodes in the AST.
        //  Such as if they are 'inline' - as in don't refer to anything out of their scope.

        // An imports property.
        // Basically a sequence of references.

        const in_references = new Reference_Sequence();
        const out_references = new Reference_Sequence();

        Object.defineProperty(this, 'code_type', {
            // Using shorthand method names (ES2015 feature).
            // This is equivalent to:
            // get: function() { return bValue; },
            // set: function(newValue) { bValue = newValue; },
            get() { return code_type; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // root_declarations
        Object.defineProperty(this, 'root_babel_declarations', {
            // Using shorthand method names (ES2015 feature).
            // This is equivalent to:
            // get: function() { return bValue; },
            // set: function(newValue) { bValue = newValue; },
            get() { return root_babel_declarations; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });


        this.on('recieve-line', e_recieve_line => {
            //console.log('e_recieve_line', e_recieve_line);
            const {str} = e_recieve_line;

            if (str.startsWith('module.exports')) {
                //console.log('str', str);
                const [mexp, name] = str.split(';').join('').split(' ').join('').split('=');
                //console.log('name', name);
                export_name = name;
                code_type = 'CommonJS';
                this.raise('parsed-code-type', {
                    value: code_type
                });
                //console.log('pre raise parsed-export-name');
                this.raise('parsed-export-name', {
                    value: name
                });
            }
        });
        
        // preparsing? early parsing?
        this.on('parsed-export-name', e_parse => {
            
            const {value} = e_parse;
            console.log('parsed-export-name', value);
            export_name = value;
        });
        this.on('parsed-root-class-name', e_parse => {
            const {value} = e_parse;
            //console.log('parsed-root-class-name', value);
            root_class_name = value;
        });

        // iterate declatation names.
        //  would be a more versitile function.

        //const iterate_babel_node_declaration_names = (babel_node, callback) => {
        const each_babel_root_node = (callback) => {
            if (ready) {
                each(babel_ast.program.body, body_node => callback(body_node));
            } else {
                throw 'Not ready';
            }
        }

        // detect matches of a statement with a child node being a require call.

        // .has_child_matching(fn_test)

        // being able to stop the iteration would help too.

        //}
        // each_root_node?

        // give the full source as well as its own source?

        const each_root_node = callback => each_babel_root_node(body_node => callback(new JS_AST_Node({
            babel_node: body_node//,
            //str_source: this.source.substring(body_node.start, body_node.end)
        })));
            //throw 'stop';

        this.each_root_node = each_root_node;

        // get_root_require_calls

        // check if it has require
        //  then check where it has require.
        //   as in look for specific syntax.
        //   this is where signatures could help.

        // eg const x = require('...');

        // So, need to look for the right patterns for requiring code. Let, const or var usually.

        const assess_require = this.assess_require = () => {
            // Go through all root nodes.
            // look for VariableDeclaration type




        }
        





        this.get_root_declaration_names = () => {
            // can only do this when it's ready, it its been recieved and parsed.
            const all_body_dec_names = [], map_all_body_dec_names = {};
            each_root_node(js_ast_node => {
                // Then a function to search the node for all declaration names.
                //  .get_identifier_names

                //const identifier_names = js_ast_node.get_identifier_names();

                //console.log('js_ast_node.type', js_ast_node.type);
                //throw 'stop';

                const body_node = js_ast_node.babel_node;
                const arr_body_node_declarator_names = [], map_body_node_declarator_names = {};

                if (js_ast_node.type === 'VariableDeclaration') {
                    //console.log('body_node', body_node);

                    each(body_node.declarations, declaration => {
                        //console.log('declaration', declaration);

                        if (declaration.type === 'VariableDeclarator') {
                            const name = declaration.id.name;
                            //console.log('name', name);

                            if (!map_body_node_declarator_names[name]) { // also want the declarator names that are for classes.
                                arr_body_node_declarator_names.push(name);
                                map_body_node_declarator_names[name] = true;
                            }
                        } else {
                            throw 'stop';
                        }
                    })
                }
                if (js_ast_node.type === 'ClassDeclaration') {
                    //console.log('body_node', body_node);
                    const name = body_node.id.name;

                    if (!map_body_node_declarator_names[name]) { // also want the declarator names that are for classes.
                        arr_body_node_declarator_names.push(name);
                        map_body_node_declarator_names[name] = true;
                    }
                }
                //const variable_names = js_ast_node.get_variable_names();
                //console.log('variable_names', variable_names);
    
                const identifier_names = js_ast_node.get_identifier_names();
                //if (identifier_names.length > 0) console.log('identifier_names', identifier_names);
                let arr_bod_dec_name;
                if (arr_body_node_declarator_names.length > 1) {
                    //console.log('arr_body_node_declarator_names', arr_body_node_declarator_names);
                    // Can have multiple identifiers in a node.
                    //  {a, b, c}
                    arr_bod_dec_name = arr_body_node_declarator_names;
                    //throw 'stop'
                } else if (arr_body_node_declarator_names.length === 1) {
                    arr_bod_dec_name = arr_body_node_declarator_names[0];
                }

                if (arr_bod_dec_name) {
                    //console.log('arr_bod_dec_name', arr_bod_dec_name);
                    const t = tof(arr_bod_dec_name);

                    if (t === 'string') {
                        if (!map_all_body_dec_names[arr_bod_dec_name]) {
                            all_body_dec_names.push(arr_bod_dec_name);
                        }
                    } else if (t === 'array') {
                        each(arr_bod_dec_name, name => {
                            if (!map_all_body_dec_names[name]) {
                                all_body_dec_names.push(name);
                            }
                        })
                    }
                }
            })
            return all_body_dec_names;
            /*
            


            if (ready) {

                const ast = babel_ast;

                const all_body_dec_names = [], map_all_body_dec_names = {};
                each(ast.program.body, body_node => {
                    const src_body0 = this.source.substring(body_node.start, body_node.end);
                    const js_ast_node = new JS_AST_Node({
                        babel_node: body_node,
                        str_source: src_body0
                    });
                    //console.log('');
                    //const node_count = js_ast_node.count_nodes();
                    //console.log('js_ast_node.type', js_ast_node.type);
                    //console.log('node_count', node_count);

                    
                    //console.log('arr_body_node_declarator_names', arr_body_node_declarator_names);
                });
                //console.log('all_body_dec_names', all_body_dec_names);
                return all_body_dec_names;




            } else {
                throw 'Not ready';
            }

            */


        }

        this.on('parsed-ast', e_parsed_ast => {
            const {value} = e_parsed_ast;
            const ast = value;
            babel_ast = ast;
            //console.log('ast', ast);
            // Then find declarations etc, declarations within the 'platform' part of the file.
            //  
            //console.log('ast.program', ast.program);
            //console.log('ast.program.body', ast.program.body);

            let initial_phase = true;

            const old = () => {
                // not ready to discard the code below. It was a precusor to the current traversal system.
                //  Want to traverse the ast, applying a discovery process to see what we find.
                //  ast-sig seems like a very useful function. Would keep literals.
                //   Then a hash of the sig can be used for quick comparison.



                //  may use more advanced code to make sense of / query AST objects.

                // eg, can use JS_AST_Node to find out if the node matches specified patterns.
                //  AST signatures could make the difference.
                //   where the variable names don't matter, all get reduced in the same ways, eg (p1, p2, p3), c1, c2, c3, res, x1, x2, x3 etc, a, b, c, d??
                //    x1 seems nicer to work with here. More logical.
                //    then the compression could be increased further later on.



                each(ast.program.body, item => {
                    //console.log('item', item);
                    root_items.push(item);
                    const {type} = item;
                    //console.log('type', type);
    
                    if (initial_phase) {
                        if (type === 'VariableDeclaration') {
                            initial_root_variable_declarations.push(item);
                        } else {
                            initial_phase = false;
                        }
                    }
                    
                    if (!initial_phase) {
                        if (type === 'ExpressionStatement') {
                            const {expression} = item;
                            //console.log('expression', expression);
                        }
                        if (type === 'ClassDeclaration') {
                            //
                        }
                    }
    
                    // is it an import statement?
                    //  raise a warning for an import statement not in the initial phase (somehow).
    
                    if (type === 'VariableDeclaration') {
                        //console.log('VariableDeclaration item', item);
                        //console.log('VariableDeclaration item.declarations', item.declarations);
                        //console.log('VariableDeclaration item.declarations[0].id.name', item.declarations[0].id.name);
                        each(item.declarations, dec => {
                            //if (dec.id.type === 'Object_Pattern') {
    
                            //} else if (dec.id.type === '')
    
                            const {type, id} = dec;
                            if (type === 'VariableDeclarator') {
                                //console.log('dec.id', dec.id);
                                //console.log('dec.init', dec.init);
    
                                if (id.type === 'ObjectPattern') {
                                    //console.log('ObjectPattern dec', dec);
    
                                    if (dec.init.callee.name === 'require') {
                                        //const name = dec.id.name;
                                        //const 
                                        //console.log('dec', dec);
                                        //variable_declaration_names_using_require.push(name);
                                        each(id.properties, property => {
                                            //console.log('property', property);
                                            const name = property.key.name;
                                            //console.log('name', name);
                                            variable_declaration_names_using_require.push(name);
                                        })
                                    }
                                    
                                } else if (id.type === 'Identifier') {
                                    if (dec.init && dec.init.callee) {
                                        //console.log('dec.init.callee', dec.init.callee);
                                        //console.log('dec.init.callee.name', dec.init.callee.name);
        
                                        if (dec.init.callee.name === 'require') {
                                            const name = dec.id.name;
                                            //const 
                                            //console.log('dec', dec);
                                            variable_declaration_names_using_require.push(name);
                                        }
                                    }
                                }
                            }
                        })
                        root_variable_declarations.push(item);
                        root_babel_declarations.push(item)
                    } else if (type === 'ClassDeclaration') {
                        root_classes.push(item);
                        //console.log('item', item);
                        //throw 'stop';
                        map_root_class_declarations_by_name[item.id.name] = item;
                        root_class_names.push(item.id.name);
                        root_babel_declarations.push(item)
                    }
                });
    
                //console.log('initial_variable_declarations', initial_variable_declarations);
                //console.log('initial_root_variable_declarations.length', initial_root_variable_declarations.length);
    
                each(initial_root_variable_declarations, iv => {
                    //console.log('iv', iv);
                    //console.log('iv.declarations', iv.declarations);
                    each (iv.declarations, declaration => {
                        const {id} = declaration;
                        const {type} = id;
    
                        if (type === 'Identifier') {
                            initial_root_variable_declaration_id_names.push(declaration.id.name);
                            //root_variable_declaration_id_names.push(declaration.id.name);
                            map_initial_root_property_declarations_by_name[declaration.id.name] = declaration;
                        } else if (type === 'ObjectPattern') {
                            //console.log('declaration.id.name', declaration.id.name);
                            //console.log('declaration', declaration);
                            //console.log('declaration.id', declaration.id);
                            //console.log('declaration.id.properties', declaration.id.properties);
                            each(declaration.id.properties, property => {
                                //console.log('property', property);
                                //console.log('property.key.name', property.key.name);
                                initial_root_variable_declaration_id_names.push(property.key.name);
                                //root_variable_declaration_id_names.push(property.key.name);
                                map_initial_root_property_declarations_by_name[property.key.name] = declaration;
                            });
                        }
                    });
                });
    
                each(root_variable_declarations, iv => {
                    //console.log('iv', iv);
    
                    if (iv.type === 'ClassDeclaration') {
                        //console.log('iv', iv);
                        root_variable_names.push(iv.id.name);
                        root_class_names.push(iv.id.name);
                        //throw 'stop';
                    } else {
                        each (iv.declarations, declaration => {
                            const {id} = declaration;
                            const {type} = id;
                            //console.log('type', type);
    
                            if (type === 'Identifier') {
                                root_variable_names.push(declaration.id.name);
                                //root_variable_declaration_id_names.push(declaration.id.name);
                                map_root_property_declarations_by_name[declaration.id.name] = declaration;
                            } else if (type === 'ObjectPattern') {
                                //console.log('declaration.id.name', declaration.id.name);
                                //console.log('declaration', declaration);
                                //console.log('declaration.id', declaration.id);
                                //console.log('declaration.id.properties', declaration.id.properties);
    
                                each(declaration.id.properties, property => {
                                    //console.log('property', property);
                                    //console.log('property.key.name', property.key.name);
                                    root_variable_names.push(property.key.name);
                                    //root_variable_declaration_id_names.push(property.key.name);
                                    map_root_property_declarations_by_name[property.key.name] = declaration;
                                });
                            } else {
                                console.log('declaration', declaration);
                                throw 'stop';
                            }
    
                            // can look out for a 'CallExpression' here.
                            //  
    
    
                        });
                    }
                    //console.log('iv.declarations', iv.declarations);
                    
                });
    
                //console.log('root_items', root_items);
                //console.log('initial_root_variable_declaration_id_names', initial_root_variable_declaration_id_names);
                console.log('initial_root_variable_declaration_id_names.length', initial_root_variable_declaration_id_names.length);
                console.log('root_variable_names', root_variable_names);
                console.log('root_variable_declaration_id_names.length', root_variable_names.length);
                //console.log('root_classes.length', root_classes.length);
    
                console.log('variable_declaration_names_using_require', variable_declaration_names_using_require);
    
                if (root_classes.length === 1) {
                    const root_class = root_classes[0];
                    //console.log('root_class', root_class);
                    const root_class_name = root_class.id.name;
                    //console.log('root_class_name', root_class_name);
    
                    this.raise('parsed-root-class-name', {
                        value: root_class_name
                    });
                }
    
                console.log('root_class_names', root_class_names);
                console.log('map_root_property_declarations_by_name', Object.keys(map_root_property_declarations_by_name));


            }

            //console.log('ast.program.body[0]', ast.program.body[0]);

            

            /*
            

            const analyse_body0 = () => {
                const js_ast_node = new JS_AST_Node({
                    babel_node: ast.program.body[0],
                    str_source: src_body0
                });
                //console.log('js_ast_node.src', js_ast_node.src);
    
                const node_count = js_ast_node.count_nodes();
                console.log('node_count', node_count);
    
                //const variable_names = js_ast_node.get_variable_names();
                //console.log('variable_names', variable_names);
    
                const identifier_names = js_ast_node.get_identifier_names();
                console.log('identifier_names', identifier_names);
            }
            */

            ready = true;

            //console.log('src_body0', src_body0);
            //throw 'stop';

            // And can call upon the node's functions to query things about that declaration / statement.
            //  Functions like extracting all the variable names from it.
            //   the counts of different types of programming constructs it uses.
            // Specifically want to see if it is 'inline' or refers to anything outside of its own scope.
            //  Then the larger Platform / Project system could find and even provide these external references.

            //console.log('ast.program.body.length', ast.program.body.length);
            //console.log('js_ast_node', js_ast_node);

            // Come up with compressed versions of the functions or statements, one by one, where possible.

        });

        // declaration_details
        //  is it all inline?
        //   can we get a compressed version of it?
        //  where does it refer?
        // eg, do we need the whole of lang-mini, or can we just extract 'each'.

        // For the moment, focus more on lang-mini and a few tools that use it and some functions it has.


    }
}
JS_File_Comprehension.load_from_stream = (rs, path) => {
    const res = new JS_File_Comprehension({rs: rs, path: path});
    return res;
}
module.exports = JS_File_Comprehension;