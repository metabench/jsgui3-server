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

        jsf.filter_each_root_node(node => node.is_declaration, (node => {
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
            let c = 0;
            node.each_inner_node(inner_node => {
                c++;
            });
            console.log('c', c);

            const idns = node.inner_declaration_names;
            console.log('idns', idns);
            /*

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
        }));

        const _old = () => {

            const arr_required = [];

            jsf.each_root_node(js_node => {
                //console.log('js_node', js_node);
                //console.log('js_node.str_source', js_node.str_source);]
                const {type} = js_node; // not a babel node.
    
                console.log('[js_node.start, js_node.end]', [js_node.start, js_node.end]);
                console.log('js_node.full_source.length', js_node.full_source.length);
                console.log('js_node.source.length', js_node.source.length);
    
                if (js_node.source.length < 2000) {
                    console.log('js_node.source', js_node.source);
                }
    
                console.log('js_node.is_declaration', js_node.is_declaration);
                console.log('js_node.own_declaration_names', js_node.own_declaration_names);
                console.log('js_node.inner_declaration_names', js_node.inner_declaration_names);
    
                // js_node.largest_block
    
                // What variables does the function refer to that are out of scope?
                //  Can they be located and themselves compiled / understood?
    
                // .own_declaration_names
    
                // will be better to go into every scope to see if local variables there can be renamed.
                
                // .inner_declaration_names
                //  The names of whatever is inside.
    
    
    
                // console.log('jsf.sha512', jsf.sha512);
                const trying_to_find_require_imports = () => {
    
    
                    const cns = js_node.child_nodes;
                    //console.log('js_node.child_nodes', cns);
    
                    // Filters
                    //  eg only 
    
                    let root_node_has_require = false;
    
                    each(cns, cn => {
                        //console.log('cn.str_source', cn.str_source);
                        //console.log('');
                        //console.log('cn.type', cn.type);
                        //console.log('cn.get_identifier_names()', cn.get_identifier_names());
    
                        if (false && cn.type === 'VariableDeclarator') {
                            console.log('cn.babel_node', cn.babel_node);
                        }
    
                        if (cn.type === 'CallExpression') {
                        // console.log('cn.babel_node', cn.babel_node);
                            let call_expression_has_require = false;
                            const cns = cn.child_nodes;
                            each(cns, cn => {
                                //console.log('cn.babel_node.name', cn.babel_node.name);
    
                                if (cn.babel_node.name === 'require') {
                                    root_node_has_require = true;
                                    call_expression_has_require = true;
                                }
                            });
                            if (call_expression_has_require) {
                                const arg0val = cn.babel_node.arguments[0].value;
                                //console.log('arg0val', arg0val);
    
                                arr_required.push(arg0val);
    
                            }
                        }
                    })
    
    
                }
    
                
    
                const ct = js_node.count_nodes();
                //console.log('ct', ct);
                //console.log('js_node.get_identifier_names()', js_node.get_identifier_names());
                
            });
    
            console.log('arr_required', arr_required);



        }


        
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