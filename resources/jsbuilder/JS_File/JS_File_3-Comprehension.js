const {each, tof} = require('lang-mini');
const JS_File_JS_AST_Node = require('./JS_File_2-JS_AST_Node');
const JS_AST_Node = require('../JS_AST/JS_AST_Node');
const JS_File_Import_References = require('./JS_File_Import_References');
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

class JS_File_Comprehension extends JS_File_JS_AST_Node {
    constructor(spec) {
        super(spec);

        //const import_references = new JS_File_Import_References();

        // Could have a syntax library - that means syntax that it already knows, and can recognise.
        

        let code_type;
        const {each_babel_root_node} = this;

        // Then can do an iteration through the AST.
        //  Want to be able to find things out about nodes in the AST.
        //  Such as if they are 'inline' - as in don't refer to anything out of their scope.

        // An imports property.
        // Basically a sequence of references.

        

        //const in_references = new Reference_Sequence();
        //const out_references = new Reference_Sequence();

        // go through all root node declatations.
        //  

        // babel_ast

        

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
        

        // detect matches of a statement with a child node being a require call.
        // .has_child_matching(fn_test)

        // being able to stop the iteration would help too.

        //}
        // each_root_node?

        // give the full source as well as its own source?

        const each_root_node = callback => each_babel_root_node(body_node => callback(new JS_AST_Node({
            babel_node: body_node,
            full_source: this.source
        })));
            //throw 'stop';

        this.each_root_node = each_root_node;


        Object.defineProperty(this, 'root_nodes', {
            // Using shorthand method names (ES2015 feature).
            // This is equivalent to:
            // get: function() { return bValue; },
            // set: function(newValue) { bValue = newValue; },
            get() { 
                const res = [];
                //return root_babel_declarations; 
                each_root_node(root_node => {
                    res.push(root_node);
                })
                return res;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // root nodes that are single variable declarations.
        // that are multiple variable declarations.

        const filter_each_root_node = this.filter_each_root_node = (fn_filter, callback) => {
            each_root_node(root_node => {
                if (fn_filter(root_node)) callback(root_node);
            })
        }

        const each_root_declaration = this.each_root_declaration = (callback) => {
            filter_each_root_node(node => node.is_declaration, (node => {
                callback(node);
            }));
        }

        // map_root_declarations

        Object.defineProperty(this, 'map_root_declarations', {
            // Using shorthand method names (ES2015 feature).
            // This is equivalent to:
            // get: function() { return bValue; },
            // set: function(newValue) { bValue = newValue; },
            get() { 
                const res = {};
                //return root_babel_declarations; 
                each_root_declaration(root_dec => {
                    //res.push(root_dec);
                    if (root_dec.name) {
                        res[root_dec.name] = root_dec;
                    }
                })
                return res;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });



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

        }

        
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