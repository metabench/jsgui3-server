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
        console.log('jsf.node_body.child_nodes.length', jsf.body.node.child_nodes.length);

        const body_child_node_identifier_names = [];
        const map_bcnidns = {};

        // Using a .map object of the jsf file rather than the node?





        jsf.body.node.each.child(cn => {
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

            // but map is a verb too
            //  .map.create
            const idbns = cn.map.identifier.name;
            // The .map object will be worked on next.
            //  but need nicest syntax.

            //  possibly we will have .index too?
            // .map makes most sense as an object to consult.




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

        });
        // For the moment focusing on what is imported and exported is most important.

        console.log('jsf.imports', jsf.imports);
        console.log('jsf.exports', jsf.exports);

        // Compiling a few files together without variable name compression will be a nice start.
        //  Maybe do AST transformation soon?

        // Loading the files into a platform / project seems like an important step to program and take soon.




        
    });
}

test_js_file();