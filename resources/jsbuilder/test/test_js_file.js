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

// JSGUI_JS_File?



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
    // path of lang mini...

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
        const {js_ast_node_file} = jsf;
        const body_child_node_identifier_names = [];
        const map_bcnidns = {};

        //console.log('jsf.root.constructor', jsf.root.constructor);
        console.log('jsf.node_root.constructor', jsf.node_root.constructor);

        const root = jsf.node_root;
        console.log('root.exports', root.exports);
        


        // Then can use the JS_AST_Root_Node_Interpreted functionality.

        // .imports
        //   multiple object description objects make sense here.
        //    ability to look up those object descriptions from the place it refers to
        //     or cached within an object that the .imports property handler has access to.

        // JS_File_Imports
        //  covers everything that gets imported.
        //   local variable name, import type (eg require), string path of where it gets imported from direct from the JS, resolved path of import on disk, or the library name.

        // Consider libraries - are the linked using npm?
        //  Does a library correspond to a path on disk?
        //  Specify that a library / module corresponds to a path on disk.

        // .exports
        //  An Object_Description object could help to describe the object exported.
        //   array, function, object (with specified keys), class constructor
        
        //console.log('jsf.root_node.constructor', jsf.root_node.constructor);
        //console.log('jsf.body.node.constructor', jsf.body.node.constructor);

        // Hard work now already done for this.
        const try_identifier_mapping = () => {
            jsf.body.node.each.child(cn => {
                const idbns = cn.map.identifier.name;
                //console.log('idbns', idbns);
                //// map_names_to_declarations
                // maps the declaration nodes by the names that occurs in their identifiers.
                
                //// .map.declaration.identifier.name
                
                const idtodecs = cn.map.declaration.identifier.name;
                //console.log('');
                //console.log('idtodecs.size', idtodecs.size);
                //console.log('idtodecs.keys()', idtodecs.keys());
            });
        }

        //try_identifier_mapping();
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
    });
}

test_js_file();