const test_lang_mini_project = () => {

    // Just lang-mini in the project.
    //  Will be nice if we have a closure, where the variables from the platform are all available.

    // Load a JS file into an OO structure
    // Short term goals:

    // jsgui-lang
    // ----------

    // Recognise the basic / general signature of the full document.
    // Recognise that the declarations are all within the root
    // Recognise the exports object at the end exports an object that is composed from same-name references to items declared within lang-mini
    //  and only items declared within jsgui
    //  that it has no external references

    const JS_File = require('..//JS_File/JS_File');
    //const JS_File_Comprehension = require('../JS_File_Comprehension');
    const path = require('path');
    const fs = require('fs');
    const Project = require('../Project');
    const {each} = require('lang-mini');

    const JS_AST_Node = require('../JS_AST_Node_Extended/JS_AST_Node_Extended');

    // Worth working with a lower level part of jsgui, such as lang-mini.
    //  lang-mini itself has an external reference.
    // stream the file in.
    throw 'STOP';
    const lm_path = '../../../../../tools/lang-mini/lang-mini.js'
    
    //const file_path = '../JS_File.js';
    const file_path = lm_path;
    // path of lang mini....

    // Write and test a simple and convenient way for analysing JS files and recompiling them.
    // To start with, find the ways to arrange parts of the JS into 'platforms'.
    // How to then build platforms into JS files.
    //  Will be about closures and sequences.
    //  A lot about unique naming, closures, and getting the sequence of definitions correct.

    // ObjectPattern

    const resolved_path = path.resolve(file_path);
    //console.log('resolved_path', resolved_path);

    const fstream = fs.createReadStream(resolved_path);

    const jsf = JS_File.load_from_stream(fstream, file_path);
    jsf.on('ready', () => {
        console.log('jsf ready');
        console.log('jsf.sha512', jsf.sha512);
        //const {babel_root_declarations} = jsf;
        // Go through each of these Babel declarations.
        //  Basically see what they are.
        //   
        const {js_ast_node_file} = jsf;
        console.log('js_ast_node_file', js_ast_node_file);
        console.log('js_ast_node_file.child_nodes.length', js_ast_node_file.child_nodes.length);

        const jn_program = js_ast_node_file.child_nodes[0];
        console.log('jn_program', jn_program);
        console.log('jn_program.type', jn_program.type);
        console.log('jn_program.child_nodes.length', jn_program.child_nodes.length);


        // Scan once for features would be nice.
        //  Would be efficient if done well.

        // However, for the moment will do singular queries.


        // export_name


        jn_program.each_child_node(js_ast_node => {
            console.log('');
            console.log('js_ast_node.source', '"' + js_ast_node.source + '"');
            console.log('js_ast_node.deep_type_signature', js_ast_node.deep_type_signature);

            // Looks like signatures could indeed be of more use for retrieving what the module exports.

            // As would other types of pattern finding.
            //  Register a signature for a search.
            //   Or multiple
            //  Then deep iterate, checking against these signatures.


            

        });

        console.log('jsf.export_name', jsf.export_name);

        // If we have an export name, 

        // Signature recognition does look like the best way to find pieces of code.
        //  We would also specify what to be extracted, as under what key.

        



        

        /*

        const find_module_exports = () => {
            // iterate for an assignment of the module.exports
            jn_program.each_declaration_child_node(js_ast_node => {
                console.log('js_ast_node.source', js_ast_node.source);

            });
        }
        find_module_exports();

        */








        const names_test = () => {
            jn_program.each_declaration_child_node(js_ast_node => {
                console.log('');
                console.log('js_ast_node.source.length', js_ast_node.source.length);
                if (js_ast_node.source.length <= 30000) {
                    const spec = {
                        source: js_ast_node.source,
                        root_node: true // should do the babel parsing once it has the source, if it does not already have the babel node.
                        // actually, only if asked for the babel node.
                        };
                    const detached_js_ast_node = JS_AST_Node.from_spec(spec);
                    console.log('detached_js_ast_node', detached_js_ast_node);
                    console.log('detached_js_ast_node.source.length', detached_js_ast_node.source.length);
                    console.log('detached_js_ast_node.type', detached_js_ast_node.type);
                    console.log('detached_js_ast_node.category', detached_js_ast_node.category);
                    if (detached_js_ast_node.category === 'Declaration') {
                        // get_declared_names
                        //console.log(detached_js_ast_node.category)
                        console.log('detached_js_ast_node.get_declared_names()', detached_js_ast_node.get_declared_names());
                    }
                }
            })
        }
        //names_test();
    });




}

test_lang_mini_project();