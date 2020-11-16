// Load a JS file into an OO structure
// Short term goals:

// Answering questions on the level of the file.
// Questions that are useful for finding out how to link the js files together.
//  Don't want each file to be given it's own scope - want them to share local variable references to the the necessary things.
//   Then those variable names won't be reused in inner scopes unless their replacement there is fine (ie they are otherwise unused).

// This will assemble somewhat detailed information about what happens inside a JavaScript file.
//  The aim is to carry out and represent different kinds of analysis, but at the moment focusing of finding features.

// Root features

// Declaration features
// Object features


// Let's make it so that any node can be tagged as having / representing / being part of a feature of some kind.
//  To begin with focus on what variables are being declared and used.

// Will be great to load in a whole load of JSGUI projects in such a way that the system / platform understands the ordering and 
// recomposes them into a flat system where many / all declarations are local rather than using any import









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

const test_js_file = () => {
    // Worth working with a lower level part of jsgui, such as lang-mini.
    //  lang-mini itself has an external reference.
    // stream the file in.
    const lm_path = '../../../../../tools/lang-mini/lang-mini.js'
    const fnl_path = '../../../../../tools/fnl/fnl.js'
    const filecomp_path = '../JS_File_Comprehension.js';
    const jsfile_path = '../JS_File/JS_File.js';
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
        //const {babel_root_declarations} = jsf;
        // Go through each of these Babel declarations.
        //  Basically see what they are.
        //   
        const {js_ast_node_file} = jsf;

        console.log('js_ast_node_file.root_declared_names', js_ast_node_file.root_declared_names);
        console.log('jsf.root_declared_names', jsf.root_declared_names);

        console.log('jsf.features.export', jsf.features.export);
        console.log('jsf.features.export.name', jsf.features.export.name);
        console.log('jsf.features.export.exported_object_name', jsf.features.export.exported_object_name);
        const deco = jsf.features.declared_objects;
        //console.log('jsf.features.declared_objects', deco);
        console.log('jsf.features.declared_objects.length', deco.length);


        /*
        jsf.js_ast_node_file.deep_iterate(jan => {
            console.log('jan', jan);
            if (jan.type === 'Identifier') {
                console.log('jan.name', jan.name);
            }
        });
        */
        // We index the identifiers by name at a later stage


        console.log('jsf.js_ast_node_file.child_nodes.length', jsf.js_ast_node_file.child_nodes.length);
        console.log('jsf.program', jsf.program);
        //console.log('jsf.js_ast_node_program', jsf.js_ast_node_program);
        //console.log('jsf.node_body', jsf.node_body);
        console.log('jsf.node_body.child_nodes.length', jsf.node_body.child_nodes.length);

        const body_child_node_identifier_names = [];
        const map_bcnidns = {};

        jsf.node_body.each_child_node(cn => {
            // would call the indexing function if needed.

            // .deep_count?
            //  / counting itself and all descendents.


            // a .deep object?
            // a _Deep module?
            //  May be useful for operations about itself and all descendents all at once.
            //   Searching within a node.
            //   Recursive efficient programming. Good property caching at the right levels.

            // eg deep.iterate
            // deep.declatations
            // deep.each.declaration
            // below.each.declaration
            //  or children

            // Would make for a fairly nice API, but maybe would not compress so well if we rely too much on only local variable renaming.
            //  Will definitely rename properties of objects.
            //   Will look into the objects to determine which patterns their properties are declared with.
            //    Maybe not necessary? Just know which identifiers / names can be changed within which scopes.

            // .map_deep_identifiers?

            // cn.map.identifiers.name

            // cn.map.declarations.inner.name ???


            // map.declaration.identifier

            const idbns = cn.map.identifier.name;
            console.log('idbns', idbns);
            // map_names_to_declarations
            // maps the declaration nodes by the names that occurs in their identifiers.

            // .map.declaration.identifier.name

            const idtodecs = cn.map.declaration.identifier.name;
            console.log('');
            console.log('idtodecs.size', idtodecs.size);

            //console.log('idtodecs', idtodecs);
            console.log('idtodecs.keys()', idtodecs.keys());
            //console.log('idtodecs.entries', idtodecs.entries());
            // map of declaration identifiers by name to their declarations

            // .map.assignment.left.name  /.right.name

            // Looks like now we can write nice syntax for the platform part.
            //  Could write code there as I want (mostly) then get it implemented lower down.





            /*
            cn.deep_iterate(n => {

                

                //console.log('n.is_identifier', n.is_identifier);
                if (n.is_identifier) {

                    if (n === cn) {
                        console.log('-----have a body child node-----');
                    }

                    console.log('n.name', n.name);
                }
            });
            */
            // An index of all objects inside....
            // map_inner, would that be better?

            //console.log('cn.obj_index', cn.obj_index);

        });
        // For the moment focusing on what is imported and exported is most important.

        console.log('jsf.imports', jsf.imports);
        console.log('jsf.exports', jsf.exports);

        // jsf.collect.inner.declaration.name
        // jsf.collect.child.declaration.name

        // collect brings them into an array.
        



        // then each child node
        //  then iterate the identifiers inside.

        // Identifiers within the body of something that is declared.



        // node_body

        /*


        each(jsf.features.declared_objects, obj => {
            console.log('obj.name', obj.name);

            // Then the statements that each of these are referenced by, within the module.
            //  Or better yet? the names of the definitions of wherever they are used.

            // find out the name of all objects referenced within the body.
            
            // want to be able to accurately and correctly connect up the functions by names, in accordance with which names they declare, use and how.

            // Also will have a VariableReference or VariableUsage feature.
            //  When a variable / object is used rather than declared, we will be able to then use the information about declarations to trace back to the declaration features,
            //   and then back to the AST nodes themselves.


            // Should continue to do more on identification of features and info about them within JavaScript files. 
            //  The API level of the Feature class will be such that the information it reveals may be relatively simple, but the main advantage is that it's context and usage is clearer
            //  programatically.


        })
        */

        // .features.imports

         


        // Then, looking into these declared objects will give us more info that the project would use.

        // The project should raise events (internal use I think at first) when it loads / finds various objects.
        //  Should consider the objects to be found before they are loaded.

        







        // Then that exported object name may be defined in the file.
        //  Will check it against the Declared_Object list.
        //   Once found in the declared objects, we can then see the the exported object is itself made out of multiple objects, all also declared in the file.
        //    Declared_Object features combined to make the object that gets exported from the file.
        //     Then with that info we are better able to consider the file in terms of its internal declarations, and have them portable / usable within another js file.

        // After doing more work on single files separately, both lang-mini and lang-tools, I will begin separately getting them working as the first file that is loaded into a project.
        //  With a bit of effort, I should get recursive loading working.

        // Continue doing more work on both individual JS files, and loading individual JS files into empty projects.
        //  Eventually it will all come together and provide the system that will build jsgui client and the client app quickly and efficiently.











        //console.log('jsf.js_ast_node_file.export', jsf.export);
        // Want an 'export' object.
        //  lang-mini exports that single declared object.
        //   want to be clear about the contents of that object.





        // Being able to get it from the file (too) would make for an easy to use api.

        // and a single exported name object, if there is one.
        // the exported object could be more complex, containing multiple names.

        // does the module export a single object by reference?
        //  then is that object composed of multiple references?
        //  are all of those references declared in this file?
        // is it an object that is declared there (including function)?
        // is it the result of a function call?





        const put_to_one_side = () => {

            console.log('js_ast_node_file', js_ast_node_file);
            console.log('js_ast_node_file.child_nodes.length', js_ast_node_file.child_nodes.length);

            const jn_program = js_ast_node_file.child_nodes[0];
            console.log('jn_program', jn_program);
            console.log('jn_program.type', jn_program.type);
            console.log('jn_program.child_nodes.length', jn_program.child_nodes.length);

            //throw 'stop';
            let c = 0;
            jn_program.each_declaration_child_node(js_ast_node => {
                c++;
            });
            console.log('c', c);

            const not_broken = () => {
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
                        //console.log('detached_js_ast_node.source', detached_js_ast_node.source);

                        if (detached_js_ast_node.source.length < 1024) {
                            console.log('detached_js_ast_node.source', detached_js_ast_node.source);
                        }
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
            not_broken();


        }

        
    });
}

test_js_file();