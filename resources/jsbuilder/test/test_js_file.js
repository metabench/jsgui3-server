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
    const lt_path = '../../../../../tools/lang-tools/lang.js'
    const fnl_path = '../../../../../tools/fnl/fnl.js'
    const filecomp_path = '../JS_File_Comprehension.js';
    const jsfile_path = '../JS_File/JS_File.js';
    const jsbuilder_path = '../JS_Builder.js';
    //const file_path = '../JS_File.js';
    const file_path = lt_path;
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
        //console.log('jsf ready');
        //console.log('jsf.sha512', jsf.sha512);
        //const {babel_root_declarations} = jsf;
        // Go through each of these Babel declarations.
        //  Basically see what they are.
        //   
        const {js_ast_node_file} = jsf;

        //console.log('js_ast_node_file.root_declared_names', js_ast_node_file.root_declared_names);
        //console.log('jsf.root_declared_names', jsf.root_declared_names);

        
        //console.log('jsf.features.export.exported_object_name', jsf.features.export.exported_object_name);
        //const deco = jsf.features.declared_objects;
        //console.log('jsf.features.declared_objects', deco);
        //console.log('jsf.features.declared_objects.length', deco.length);


        /*
        jsf.js_ast_node_file.deep_iterate(jan => {
            console.log('jan', jan);
            if (jan.type === 'Identifier') {
                console.log('jan.name', jan.name);
            }
        });
        */
        // We index the identifiers by name at a later stage


        //console.log('jsf.js_ast_node_file.child_nodes.length', jsf.js_ast_node_file.child_nodes.length);
        //console.log('jsf.program', jsf.program);
        //console.log('jsf.js_ast_node_program', jsf.js_ast_node_program);
        //console.log('jsf.node_body', jsf.node_body);
        //console.log('jsf.node_body.child_nodes.length', jsf.body.node.child_nodes.length);

        const body_child_node_identifier_names = [];
        const map_bcnidns = {};

        // Hard work now already done for this.
        const try_identifier_mapping = () => {
            jsf.body.node.each.child(cn => {

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
    
            });
        }
        try_identifier_mapping();
        
        // For the moment focusing on what is imported and exported is most important.

        const work_on_exporting_keys = () => {


            console.log('jsf.imports', jsf.imports);
            console.log('jsf.exports', jsf.exports);
            //console.log('jsf.exports', jsf.exports);

            // .map.child.decla...

            const mdecnames = jsf.body.node.map.declaration.identifier.name;
            console.log('mdecnames', mdecnames);

            console.log('jsf.features.export', jsf.features.export);
            console.log('jsf.features.export.name', jsf.features.export.name);
            console.log('jsf.features.export.exported_object_name', jsf.features.export.exported_object_name);

            const export_dec = mdecnames.get(jsf.features.export.exported_object_name);
            console.log('export_dec', export_dec);
            console.log('export_dec.source', export_dec.source);

            //console.log('export_dec.collect.child.identifier.name', export_dec.collect.child.identifier.name);

            // Or some means to collect keys....
            console.log('export_dec.child.count', export_dec.child.count);
            console.log('export_dec.child.first.child.count', export_dec.child.first.child.count);

            console.log('export_dec.child.first.collect.child.type()', export_dec.child.first.collect.child.type());
            console.log('export_dec.child.first.collect.child.category()', export_dec.child.first.collect.child.category());

            // .collect.type

            const cats = export_dec.child.first.collect.child.category();
            const types = export_dec.child.first.collect.child.type();
            if (cats[0] === 'Identifier' && cats[1] === 'Expression') {
                if (types[1] === 'ObjectExpression') {
                    const oe = export_dec.child.first.child.last;
                    console.log('oe', oe);
                    console.log('oe.child.shared.type', oe.child.shared.type);
                    // Reading keys out of an object expression like this would be helpful.
                    //console.log('oe.keys', oe.keys);

                    if (oe.child.shared.type === 'ObjectProperty') {
                        //const keys = oe.child.first.collect.child.last.name;
                        const ops = oe.child_nodes;
                        const keys = [];
                        oe.filter(n => n.type === 'StringLiteral', n => {
                            keys.push(n.source.split('\'').join(''));
                        });
                        console.log('1) keys', keys);
                    } else {
                        throw 'stop';
                    }
                    //oe.each.child0
                } else {
                    throw 'stop';
                }

            } else {
                throw 'stop';
            }

        }

        //console.log('jsf.features.export.keys', jsf.features.export.keys);

        // I like that syntax more.
        //console.log('jsf.exported.keys', jsf.exported.keys);
        //console.log('jsf.exported.node', jsf.exported.node);
        //console.log('jsf.exported.type', jsf.exported.type);
        //console.log('jsf.exported', jsf.exported);


        //console.log('jsf.imported', jsf.imported);

        // Can focus by far the most on what gets exported and imported.
        //  The sub-exports or export properties are particularly important.
        //   As in, the export keys.
        







        // jsf.exported.keys property reads well.
        // Think we have a really nice syntax here and structure for it to expand.

        // And we can use that map too lookup the lang-mini object.
        //console.log('jsf.exported', jsf.exported);
        // Compiling a few files together without variable name compression will be a nice start.
        //  Maybe do AST transformation soon?
        // Loading the files into a platform / project seems like an important step to program and take soon.
        
    });
}

test_js_file();