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

        const {root_babel_declarations} = jsf;

        //jsf.root_declarations.length
        //console.log('root_babel_declarations', root_babel_declarations);
        console.log('root_babel_declarations.length', root_babel_declarations.length);

        // Go through each of these Babel declarations.
        //  Basically see what they are.
        //   
        

        //const root_dec_names = jsf.get_root_declaration_names();
        //console.log('root_dec_names', root_dec_names);

        const proposed_remappings = jsf.get_proposed_root_definitions_inner_name_remappings();
        console.log('proposed_remappings', proposed_remappings);


        // easier syntax at this level.
        // .each_root_declaration()

        const useful_experiments = () => {
            jsf.each_root_declaration(node => {
                console.log('');
                console.log('node.count_nodes()', node.count_nodes());
                //console.log('root node', node);
                console.log('root own dec names', node.own_declaration_names);
                // then inner declaration names
                //  both variables and classes.
    
                // inner_declaration_names seems like it would be a useful property.
                // and own_declaration_names
    
    
                // Will be able to rename them if they are inside the scope of the root declaration.
    
                //const inner_declarations = node.inner_declarations;
                //console.log('inner_declarations', inner_declarations);
                //let c = 0;
                //node.each_inner_node(inner_node => {
                //    c++;
                //});
                //console.log('c', c);
    
                const idns = node.inner_declaration_names;
                console.log('idns', idns);
                /*
    
                // This is now available with .inner_declaration_names
    
                const map_root_node_inner_dec_names = {}, arr_root_node_inner_dec_names = [];
    
                node.filter_each_inner_node((node => node.is_declaration), node => {
                    //console.log('inner declaration of root declaration', node);
                    //console.log('inner own dec names', node.own_declaration_names);
    
                    each(node.own_declaration_names, dec_name => {
                        if (!map_root_node_inner_dec_names[dec_name]) {
                            arr_root_node_inner_dec_names.push(dec_name);
                            map_root_node_inner_dec_names[dec_name] = true;
                        }
                    });
                })
                console.log('arr_root_node_inner_dec_names', arr_root_node_inner_dec_names);
    
                */
            });



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

        }


        
        
        const possible_nextstuff = () => {
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

    });

}

test_js_file();