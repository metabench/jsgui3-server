
const JS_File = require('../JS_File/JS_File');
//const JS_File_Comprehension = require('../JS_File_Comprehension');
const path = require('path');
const fs = require('fs');
const Project = require('../Project');
const {each} = require('lang-mini');

//const Query_Result = require('../JS_AST/query/Query_Result');

//const JS_AST_Node = require('../JS_AST_Node_Extended/JS_AST_Node_Extended');

const StandardInterpreter = require('../JS_AST/Interpret/StandardInterpreter');


// Coming up with an extensive interpretation of a file, expressed as a simple JS object, would be a good way to have multiple threads parse and analyse the separate JS files separately.

// An interpretation of a file would be an array that describes what happens during that file
//  variables being defined
//  keys being added to defined variables
//   (even keys being removed)
//  what gets exported.

// By having a relatively simple File_Interpretation json (maybe class), the interpretations can be produced separately by multiple threads.
//  A list of everything of significance that happens (at the program root) during the course of the file.
//   Or maybe looking inside a function call if it's a function call result...?

// Can write a load more in test_js_file for the moment.

// Not lazy loaded, unlike JS_AST_Node

// A new Object_Through_Lifecycle class will be useful for tracking the objects as 


// JS_File_Interpreter
//  This would be the place for relatively flexible loading / extensibility systems.
//  Can be used / accessed in an event driven way, line by line.
//  .interpretation or .result for the full result when it's complete.
//  The interpreter would track the object lifecycles for each object in the file.

// interpretation.root_objects  (as an array or similar? a map?)
// interpretation.root_object_lifecycles
// A lifecycle would be a more OO and programmer friendly way of doing this.

// Do want it so that it can handle a whole load of syntax, initially based on my own files, and not have to treat things as special cases too much.
//  As in, there would not be much point in removing these interpretations, as they would be valid for what they cover, but would not cover the full set of JS operations.

// Possibility of throwing an error for syntax it does not recognise?
//  May help avoiding missing anything, and writing it in a way where it would be able to cover all code in such a way that interpretation of its meaning would be done once those cases
//   were written too.

// How to do this in a more declarative way?
//  Node special types or special categories, or specilisations, or specialised node recognition.

// Programming node specialisation recognition in at a lower level could be of use, especially with the specialisations defined at a higher level.

// node.specialised_type
// node.specialised_info

// // specialised type seems like good terminology

// A decision tree of some sorts of spotting a specialisation type:
//  Check the node's mid type sig
//                   mid cat sig
//   // any special node checking functions? could run a bunch of them

// defining ast node specialisations / specifics

// Ways in which a node specialisation can be identified:

// mid compressed generalised cat sig test (optional)    -  broadest sweep
// mid cat sig test (optional)                           -  still broad but does not generalise more than 1 repeated item as being the same no matter how many
// mid type sig test (optional)                          -  


// Lets not put much more into the JS_AST_Node class structure - could do net removal from there.

// Make a further interpretation layer.
//  Importantly, the output interpretation will be available in a simple format that can be shared between processes easily.

// Main process will find the interpretations of the JS files from subprocesses.
//  Maybe also a compression plan?
//  Being able to get the compressed version, with new interpretation, from the subprocesses.

// Subprocesses contributing to build plan?
//  Probably not at the moment.

// Build_Planner object too? Produces a Build Plan object.
//  Continuing to go a very OO way would make sense.
//   Will be easier to debug, and maintain progress with API-level functionality.
//   A build plan would also be serialisable as JSON or binary, so easily able to be sent between processes.

// Working on the JS File Interpretation (or JS AST Node Interpretation really) will produce the JSON info that will then be used in order to work out which files, and which parts of which files
//  are needed in order to output particular things in the build.



// Build_Plan_Executer
//  The thing that actually creates the build.






// However, creating more object properties is_... with unambiguous names and functionality would be a way to get these current JS files understood, and it will 
//  be good to have a function from here to find out what happens through the child nodes of a program (or BlockStatement most likely too)




















// JS_File_Interpretation
//   nodes: array of AST_Node_Interpretation
//   
//   object_lifecycles:


// May turn into the object interpretation, or be inspiration for it.
//  Want to get simple responses from the multiple processes that will be used in the build.
//  The file interpretation would not just be about what gets exported from it.

// If the workspace were to build up an index of all functions by name, it could use 




// This has become a huge function, and it's not complete (misses various things)
//  Is this narrow in scope, or would it be better to make more of a complete interpretation of everything, giving callbacks?



// Objects defined as functions???


//const fn = () => {
//    ...
//}
// fn()

// That is another case where the interpreter could then interpret the function, and then when the function modifies anything in the program scope, that could then be interpreted.
//  (in the correct order)

// An OO interpreter could go line by line more easily.
//  And a program interpretation would be an interpretation like the sub ones, I expect.

// JS_AST_Node_Interpreter
//  Would act in different ways depending on the node type
//  Extending Evented_Class would be cool I expect.
//   Having an array of changes / actions.

// JS_AST_Node_Interpretation
//  Will be a class
//   .value property which will all be plain JS objects. Easily serialisable that way so that they can be sent between processes.
//    space for other properties could help, things such as where the node is in the source
//   .node
//     file_path, start, end





// A File node: interpret the Program node
// A Program node: Go through the child nodes, one by one, interpreting them.
//   Looking at the interpretation, make any changes to objects declared in current block scope.
//    create new ones (declaration), including setting initial value
//     info about what type of object it is
//     a reference to an external file (what is exported from an external file)
//       reference to a key / keys from what is exported from an external file
//    set / change their value
//    set / change their property value







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

    // C:\Users\james\Documents\Copied_Over_Docs\Documents\code\code\js\jsgui3-all\jsgui3-html\html.js

    const jg3_html_path = `C:\\Users\\james\\Documents\\Copied_Over_Docs\\Documents\\code\\code\\js\\jsgui3-all\\jsgui3-html\\html.js`;

    // const jg3_client = '../../../../../jsgui3-all/jsgui3-client/client.js'

    const sample1_js_path = './sample1.js';
    //const file_path = '../JS_File.js';
    const file_path = sample1_js_path;
    // path of lang mini...

    // Write and test a simple and convenient way for analysing JS files and recompiling them.
    // To start with, find the ways to arrange parts of the JS into 'platforms'.
    // How to then build platforms into JS files.
    //  Will be about closures and sequences.
    //  A lot about unique naming, closures, and getting the sequence of definitions correct.
    // ObjectPattern

    // Or each process could individually compress each of those individual JS files?
    //  Then come up with the info needed just to slice the JavaScript together.

    // The last stage of building should just be joining together of strings???

    // Ability to query the process to get the central parts?
    //  All apart from imports and exports.
    //  Could do more concerning selecting the necessary code from the files.







    // mid_signature

    // JS_File_Interpretation may be the most useful intermediate object to work on.
    //  


    const resolved_path = path.resolve(file_path);
    //console.log('');
    //console.log('resolved_path', resolved_path);
    //console.log('');

    const fstream = fs.createReadStream(resolved_path);

    //const jsf = JS_File.load_from_stream(fstream, file_path);
    console.log('file_path', file_path);
    const jsf = JS_File.load_from_stream(fstream, resolved_path);
    jsf.on('ready', () => {
        const {js_ast_node_file} = jsf;
        const body_child_node_identifier_names = [];
        const map_bcnidns = {};

        // If it can resolve imports to find out more about what keys are there, that would help.
        //  May be useful to have a way to indicate that a file / module adds keys to what it imports.
        
        // The improved querying system is the next thing.
        // Query must be after index.


        const root = jsf.node_root;
        const program = jsf.node_root.child_nodes[0];

        const interpreter = new StandardInterpreter();

        const source = jsf.source;

        interpreter.on('node-interpreted', e_node_interpreted => {
            const {interpretations} = e_node_interpreted;
            console.log('interpretations.length', interpretations.length);

            // be able to get the original source back.

            each(interpretations, interpretation => {
                console.log('interpretation.obj', interpretation.obj);
                const {start, end} = interpretation.obj.node;
                const orig_code = source.substring(start, end);
                console.log('orig_code', orig_code);
            })
        })

        interpreter.on('node-not-interpreted', e_node_not_interpreted => {
            console.log('e_node_not_interpreted', e_node_not_interpreted);
            const {start, end} = e_node_not_interpreted.node;
            const orig_code = source.substring(start, end);
            console.log('orig_code', orig_code);
        })

        const program_interpretation = interpreter.interpret(program);



        console.log('program_interpretation', program_interpretation);


        // Want the interpretation of the program node...?

        // Program node interpretation would be one of the most comprehensive.
        //  Does not fit in with the interpretation system currently made, as in it just extracts a few things.

        // Maybe could indeed run interpretation on the program or file node that comes up with the results.
        //  Probably would be best.




        
        //program.query.each.child(cn => {

        //})
    });
}

test_js_file();