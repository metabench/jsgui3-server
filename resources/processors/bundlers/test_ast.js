
// Load in a JS file, such as square box client.
// Look for the CSS.


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



const JS_File = require('../resources/jsbuilder/JS_File/JS_File');
//const JS_File_Comprehension = require('../JS_File_Comprehension');
const path = require('path');
const fs = require('fs');
const {each} = require('lang-tools');

const JS_AST_Node = require('../resources/jsbuilder/JS_AST_Node_Extended/JS_AST_Node_Extended');

const test_js_file = () => {
    const fnl_path = require.resolve('./../examples/square_box_client.js');
    const file_path = fnl_path;
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
        //const body_child_node_identifier_names = [];
        //const map_bcnidns = {};
    });

}

test_js_file();