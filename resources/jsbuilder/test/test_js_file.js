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

// Some kinds of nested extractions could help here.


const JS_File = require('..//JS_File/JS_File');
//const JS_File_Comprehension = require('../JS_File_Comprehension');
const path = require('path');
const fs = require('fs');
const Project = require('../Project');
const {each} = require('lang-mini');

//const Query_Result = require('../JS_AST/query/Query_Result');

const JS_AST_Node = require('../JS_AST_Node_Extended/JS_AST_Node_Extended');


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





// The Interpreter system is going to supercede and replace this code.
//  It's the way to get this kind of thing on the wanted lower level.

// Higher level than the JS_AST_Node itself.
//  Having it interpret itself seems like it's getting away from an important core use, and seems like concerns can be better separated.
//   I also didn't much like the very long property names and boolean tests that were being written, it wasn't a good pattern to continue.
//   The interpreter will be designed for efficiency - signature checking, simple confirmation checks, simple unambiguous format for defining these checks.

// Extraction of the useful info by paths.
//  names of keys added
//   the identifier name something is assigned as
//   an object definition there - we could identify sub-keys (not sure there is much point)

// Everything will be outputtable as a simple JS object, and as JSON.
//  Can work focusing for a while on getting the JSON interpretation of various JS files used.
//   See to it that these interpretations provide the necessary information to then plan the build.
//  That JSON will contain plenty of numeric position references to places in source code.

// Will be able to directly copy AST nodes from the source files by copying their source code into the result.
//  Will be able to produce the results without needing the parsed Babel AST and the associated JS_AST_Node objects.
//   Maybe Virtual_JS_AST_Node or Abstract_JS_AST_Node?
//    Will refer to source code positions, have the .source property.

// The result:
//  An array of abstract / virtual JS_AST_Nodes. Can easily get the source code from each of them.
//   It's the Babel & JS_AST_Node part that takes the longest.

// With the interpretations, and info that can be obtained quickly from them:
//  The object lifecycle of variables spanning multiple JS files.
//  May be worth making it, and filling in the blanks later with the things that are needed to make the build.


// Or, worth making the build system that uses the interpretations and object lifecycle info that we don't yet have?

// It's possible that the actual build would not refer to some of the pieces of info generated.
//  Or use some of the lower level info, with some generated info being more for presentation.























const get_objects_declared_and_assigned_info = (node) => {

    const tmap_objects_in_scope_by_name = {};
    each(node.child_nodes, cn => {
        // Keeping track of objects in scope
        //  And what we know about the added keys of objects in scope.

        console.log('');
        //console.log('cn.generalised_compressed_type_category_signature', cn.generalised_compressed_type_category_signature);
        console.log('cn.type_signature', cn.type_signature);
        console.log('cn.mid_type_signature', cn.mid_type_signature);
        console.log('cn.generalised_compressed_mid_type_category_signature', cn.generalised_compressed_mid_type_category_signature);
        console.log('cn.source', cn.source);

        // is_variable_declaration
        //  .declared_object_entries
        //   [['name', value]]



        //  we already have the variable declaration reading covered I think...?

        // jsgui.controls = jsgui.controls || {};

        //  is_object_property_ensure_not_falsy_assignment
        //   a decent literal name for it.
        //  Need to pick up on a moderate variety of different statements of different arrangements.


        // object property ensure not falsy as {}
        //  probably don't want those types of tests in the core?
        //   the very modular system will allow them to be removed easily enough.






        // is_object_property_assignment_statement
        //  then if so, can get the interpretation from it.





        console.log('cn.is_declaration', cn.is_declaration);
        if (cn.is_declaration) {
            const assigned_entries = cn.assigned.entries;
            console.log('assigned_entries', assigned_entries);


            // Just having a look I think?
            each (assigned_entries, entry => {
                const [name, value] = entry;
                if (tmap_objects_in_scope_by_name[name]) {
                    throw 'object with same name should not be declared more than once within a node'
                } else {

                    // look through the entry I think...
                    //  console.

                    const item_obj = {};

                    console.log('entry', entry);

                    console.log('value.source', value.source);

                    if (value.t === 'OE') {
                        if (value.child.shared.type === 'ObjectProperty') {
                            value.query.each.child.exe(opr => {

                                if (opr.child.count === 2) {
                                    const [name_node, value_node] = opr.child_nodes;
                                    let property_name, property_value_identifier_name, literal_value;

                                    if (name_node.t === 'SL') {
                                        property_name = name_node.value;
                                    } else {
                                        throw 'stop';
                                    }

                                    if (value_node.t === 'ID') {
                                        property_value_identifier_name = value_node.name;



                                    } else if (value_node.t === 'SL') {
                                        literal_value = property_value_identifier_name = value_node.value;
                                        console.log('literal_value', literal_value);
                                    } else if (value_node.t === 'BL') {
                                        literal_value = property_value_identifier_name = value_node.value;
                                        console.log('literal_value', literal_value);
                                    } else {
                                        console.log('value_node', value_node);
                                        throw 'stop';
                                    }

                                    if (property_name !== undefined) {

                                        if (property_value_identifier_name !== undefined) {
                                            if (tmap_objects_in_scope_by_name[property_value_identifier_name]) {
                                                item_obj[property_name] = tmap_objects_in_scope_by_name[property_value_identifier_name];
                                            } else {

                                                item_obj[property_name] = property_value_identifier_name;
                                                //throw 'stop';
                                            }

                                            



                                        } else if (literal_value !== undefined) {
                                            item_obj[property_name] = '"' + literal_value + '"';
                                        } else {
                                            throw 'stop';
                                        }


                                    } else {
                                        throw 'stop';
                                    }




                                } else {
                                    throw 'stop';
                                }

                                
                            })
                        } else {

                            if (value.child.count === 0) {

                            } else {
                                throw 'stop';
                            }

                            
                        }
                    } else {

                        // typeof window !== 'undefined'
                        //  since we reach this point with this statement, it's worth paying attention to it.

                        // statement that determines if it's running in the browser.
                        //   A statement library with interpretations would be of some use.

                        //  Could be worth being able to evaluate some thing like that to true or false depending on how the code is being used.

                        const _think_before_deleting = () => {
                            if (value.t === 'BE') {
                                // Check for typeof window !== 'undefined'?

                                // Or maybe have a library / list of statements to automatically evaluate in some way depending on the context.


                            }

                        }







                        //throw 'stop';
                        //throw 'NYI';
                    }
                    //

                    

                    // value is a node.

                    


                    // Worth saying more about the object.

                    // maybe say it's type.
                    //  or maybe not here.
                    // could be worth experimenting with and making the proper summary objects.

                    // AbstractCode...
                    //  and an instance of AbstractCode can say things like it's a function.
                    //   maybe what parameters it takes, could get further into OO, and having these do some interpretation?
                    //   for the moment, use the interpretation, these would only be the representation.



                    tmap_objects_in_scope_by_name[name] = item_obj;
                }
                // Not so interested in what the values are assigned as for the moment here.
            })
        }
        
        // is it an import / require statement
        //  currently just check for require statements.

        // then check for any objects being created by any of the program child nodes.
        
        // then object assign will assign additional keys.
        //  this will be useful for knowing what the exported object's keys are.

        // then check to see if they are specific statement types.

        // is it an import / require statement
        //  currently just check for require statements.

        // then check for any objects being created by any of the program child nodes.

        // then object assign will assign additional keys.
        //  this will be useful for knowing what the exported object's keys are.
        // then check to see if they are specific statement types.
        console.log('cn.is_module_exports_statement', cn.is_module_exports_statement);

        if (cn.is_statement) {

            console.log('cn.is_object_assign_statement', cn.is_object_assign_statement);

            if (cn.is_object_assign_statement) {
                const object_assign_statement_interpretation = cn.object_assign_statement_interpretation;
                console.log('object_assign_statement_interpretation', object_assign_statement_interpretation);
                //const [str_identifier_name, arr_keys_assigned] = object_assign_statement_interpretation;

                if (object_assign_statement_interpretation) {
                    const {identifier_name, keys} = object_assign_statement_interpretation.value;

                    if (tmap_objects_in_scope_by_name[identifier_name]) {
                        //tmap_objects_in_scope_by_name[identifier_name]

                        each(keys, key => tmap_objects_in_scope_by_name[identifier_name][key] = {});
                    } else {
                        throw 'stop';
                    }
                }
            }

            if (cn.is_module_exports_statement) {
                const exported_node = cn.module_exported_node;
                console.log('exported_node', exported_node);
                console.log('exported_node.source', exported_node.source);
            } else {
    
                if (cn.is_assign_object_property_by_identifier_statement) {
                    const interpretation = cn.assign_object_property_by_identifier_statement_interpretation;
                    console.log('object property assignment with an identifier interpretation', interpretation);
    
                    if (interpretation && interpretation.name === 'target_object.property = assigned_object') { // extra safe and clear programming, not super-efficient.
                        const {target_object_name, property_name, assigned_object_name} = interpretation.value;
    
                        console.log('target_object_name, property_name, assigned_object_name', target_object_name, property_name, assigned_object_name);
    
                        if (tmap_objects_in_scope_by_name[target_object_name]) {
    
                            if (tmap_objects_in_scope_by_name[assigned_object_name]) {
                                tmap_objects_in_scope_by_name[target_object_name][property_name] = tmap_objects_in_scope_by_name[assigned_object_name];
                            } else {
                                throw 'stop';
                            }
                            //
                        } else {
                            console.log('tmap_objects_in_scope_by_name', tmap_objects_in_scope_by_name);
    
                            // module exports does not count...! code now moved inside is_module_exports else section.
    
                            throw 'stop';
                        }
    
                    } else {
                        throw 'stop';
                    }
                    //throw 'stop';
                }
    
            }

        }
        
    })
    //console.log('tmap_objects_in_scope_by_name', tmap_objects_in_scope_by_name);

    return tmap_objects_in_scope_by_name;
}







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
    const file_path = jg3_html_path;
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
    console.log('');
    console.log('resolved_path', resolved_path);
    console.log('');

    const fstream = fs.createReadStream(resolved_path);

    const jsf = JS_File.load_from_stream(fstream, file_path);
    jsf.on('ready', () => {
        const {js_ast_node_file} = jsf;
        const body_child_node_identifier_names = [];
        const map_bcnidns = {};

        // If it can resolve imports to find out more about what keys are there, that would help.
        //  May be useful to have a way to indicate that a file / module adds keys to what it imports.
        
        // The improved querying system is the next thing.
        // Query must be after index.

        //console.log('jsf.root.constructor', jsf.root.constructor);
        console.log('jsf.node_root.constructor', jsf.node_root.constructor);

        const root = jsf.node_root;

        console.log('root.exports', root.exports);
        console.log('root.exports.exported', root.exports.exported);
        console.log('root.exports.exported.node', root.exports.exported.node);
        console.log('root.exports.exported.node.type', root.exports.exported.node.type);


        // console.log('jsf.module_io_info', jsf.module_io_info);

        console.log('jsf.module_io_info', jsf.module_io_info);
        // module_io_info will be the relatively advanced property of JS files.

        const program = jsf.node_root.child_nodes[0];
        console.log('program.indexes.child.gct_sig', program.indexes.child.gct_sig);
        console.log('program.type_category_signature', program.type_category_signature);

        console.log('program.generalised_compressed_type_category_signature', program.generalised_compressed_type_category_signature);

        const is_module_exports_an_identifier = (node) => {


            if (node.generalised_compressed_mid_type_category_signature === 'St(Ex(Ex,I))') {
                // a.b = c;

                // is_module_exports
            } else {

            }
            return false;
        }

        // each_child_node_interpretation
        // each_child_node_with_interpretation

        // node_interpreter
        //  could produce an object, maybe array?
        // Node_Interpretation object could be of use
        //  Could understand how deeply it understands the node.
        //   If it has enough understanding to do some things.
        //   It could list / have available the interpreters (or their names) that have given any interpretation.

        // Better to return in object than array.
        // 

        // Don't think this function is ready for the lower level yet.
        //  May be better to do something more formalised / abstract / predictable.

        // Defining the system to interpret any statement would make sense.
        //  And interpret it more in the abstract.
        // Get some sort of basic coverage of every statement. ?????
        //  Need to pay by far the most attention to the various statements needed to understand files / modules in order to build them.



        // a class such as Object_Through_Lifecycle?
        //  
        

        // This basically only looks sufficient for reading the keys that get assigned.
        //  Probably worth keeping this and then later doing a more complex / in-depth code analysis system.


        // Getting the method names from classes would be useful, but not right here I guess.

        // Object_Through_Lifecycle could certainly help to clear up ambiguity.






        // Think about what would fit in well on a lower level...
        //  Using a lower level system of tracking objects through their lifecycle would be nice.

        // Object_Through_Lifecycle would have various Object_Lifecycle_Event instances, probably in an array.
        //  Could track an object / objects over multiple files.

        // For the moment, get back to implementing what needs to be done to build the jsgui js.





        

        const tmap_objects_in_scope_by_name = get_objects_declared_and_assigned_info(jsf.node_root.child_nodes[0]);
        console.log('tmap_objects_in_scope_by_name', tmap_objects_in_scope_by_name);
        

        // Objects_declared_in_node_child_nodes


        if (false && root.exports.exported.node.type === 'Identifier') {
            const idname = root.exports.exported.node.name;
            console.log('idname', idname);


            
            // then trace back what happens to it...
            //  or trace forward what happens to it from assignment.

            // find child object declaration assignment value node
            //  seems like it could go into an 'advanced query' section.

            // this.add_query(function, synonyms)




            // go through the root nodes.
            //  are any of them an ancestor of the identifier?

            // .find_ancestor_of?
            //  worth working on this on the level of a smaller query?
            //   or making some test js files to analyse?
            //   


            // .is_ancestor_of(root.exports.exported.node)


            // get ancestor of node that is child of target node

            // then go back through the sibling statements.
            //  .iterate_back_through_previous_sibling_nodes
            //  .query.each.previous.sibling.exe
            //   makes sense for that to go backwards.



            // track lifecycle of the identifier with that name.
            //  track_exported_object_lifecycle

            // iterate_trace_back_exported_object_lifecycle
            //  an advanced query section?

            // Or it's in 9 - planning
            //  Maybe call it Builder Support.

            // And also Builder_Support queries on the files.
            //  Introdicing .query to the files themselves would be of use.

            // Maybe making a more abstract function to set up the query system, if efficient (enough).
        }


        //console.log('root.exports.exported.node.source', root.exports.exported.node.source);

        // then consult the index of root...
        //root.setup_node_index

        //const exported_decs = root.get_indexed_nodes_by_key('identifiers_by_name', root.exports.exported.node.source.name);
        //console.log('exported_decs', exported_decs);

        // Will be worth making shorter and more precisely named functions.
        //  Hopefully this or similar could be written in a few lines of query.

        // select different variable names.
        // selecting multiple variables in a named query.

        // Producing an object query result seems like maybe a better way.
        // .collect currently puts them into an array. it does not take parameters.

        // .extract seems like the best term to use for named items.

        // query.extract.child.name.exe('extracted_name')
        //  extracting multiple objects with the same name - would create an array in place, and add the item there.


        // Extract looks better for single items?
        //  Indexing is a form of extraction. However, it would maybe add it to the node's index?

        // .extract_index?

        // .map
        //  it makes the map, but does not do indexing

        // .extract.index
        // .extract.value

        // .map makes the most sense.
        //  though it will be annoying syntax at times, seems best if it's an object containing arrays.
        //   returning an actual map makes sense too?

        // .map producing a map object does make sense.
        //  .mp being a wrapper function version that raises an error if there is ever more than one in the array, and changes to a map with direct values.

        //  .dvmap? mapdirect.the rest of the query.

        // query.index.child.name.exe('indexed_name')
        // .query.run(text query)


        // Extraction queries will be the next thing
        // As will signature mapping queries.
        // Selecting / collecting for multiple properies of an object.
        //  collect.node.where.             
        //      type.variabledeclaration.and
        //      name.startswith.
        //    Make better example than above.


        // Or a few?

        // Collect keys declared directly on the object that gets exported
        // Collect keys that get added to the object that gets exported.

        // Working on query so that it recognises object phrases, such as 'the object that gets exported'.

        // However, that object is not just the code it gets declared with.
        //  Maybe some kind of programmatic object abstraction would help.
        //   It's not the statement, but a representation of the object that exists when the program is running.

        // JS_Abstract_Object
        //  this would be the main one.
        //   there can be object methods anyway. If it's a class, better to tag it as such but use the same representation (mostly).

        // An abstract object would be useful in the context of a file to track both ways
        //  back from what is exported
        //  forward from what is imported
        
        //  being able to identify that what gets exported is a modified / subclassed imported object.

        // Doing more to build a transformation plan.
        //  This seems like a useful step in the build.
        //  All parts could be described / logged as they happen.

        // Copy body main to the platform being built.
        //  Loading into a platform...
        //   Not so sure that's the right thing to focus on right now.
        //   May be better to work on extracting the main body of what gets declared
        //    keeping track of the names as they are now local variables in the new scope

        // Then if / when a class imports from something already in scope, we should know that it's already in scope.

        // Tracing imports
        //  Seems like something that is more in line with what a Workspace or something that deals with multiple files should handle.

        // JS_Abstract_Class ???
        // Maybe the whole thing could work as a large collect statement?



        // Still would be nice to split this up and be clearer about what it's doing.

        // eg abstract_object.added.keys

        // some easy to use syntax would then make it easy to retrieve exactly what is needed where it was needed.
        //  May be worth moving this into a feature of some sort.
        //   Probably a feature of the JS file.


        // branch queries would be of use.

        // .query.branch.on.length({'1': ..., '2': ... , 'default'...})

        const old_but_good_code = () => {
            const working_find_exported_keys = () => {

            

                const root_exported_node = root.exports.exported.node;
                const exports_keys = [];
                const program = root.child_nodes[0];
                const exported_node_name = root.exports.exported.node.name;
    
                // The possibility of creating a JS_Abstract_Object which would then be used to get more info about the lifecycle of the object that gets exported
                //  as it progresses through the file. This will only be useful / relevant in some cases.
    
                // The local variable not for export of reuse - they could have their names changed so that they don't never conflict.
                //  Could have a counter, and declare names like mlv1 or further abbreviated in the future.
                //   Just short and systematic names will be good, could improve on it in the future, but if they are systematic they would compress well anyway.
    
                if (exported_node_name === undefined) {
                    const collected_keys = root_exported_node.query.collect.self.if.type.objectexpression.exe().
                        query.select.child.by.first.child.type.exe('StringLiteral').
                        query.collect.first.child.exe().
                        query.collect.value.exe().flat();
                    //console.log('collected_keys', collected_keys);
                    //throw 'stop';
                    each(collected_keys, key => exports_keys.push(key));
                }  else {
                    let exported_object_declaration_node;
    
                    //const r1 = program.query.collect.child.variabledeclaration.exe();
                    //console.log('r1', r1);
    
                    //console.log('r1', r1);
                    //console.log('r1.query', r1.query);
    
                    //console.log('r1 instanceof Query_Result', r1 instanceof Query_Result);
    
                    //throw 'stop';
    
                    const expn = program.query.collect.child.variabledeclaration.exe().query.select.node.by.first.child.first.child.name.exe(exported_node_name)[0];
                    // .collect.node.where.first.child.first.child.name ???
                    // select the node with the matching name too...?
                    //console.log('expn', expn);
                    //console.log('expn.length', expn.length);
    
                    if (expn.length === 1) {
                        exported_object_declaration_node = expn[0]; // Need to investigate behaviour change for nested collect queries.
                    } else {
                        console.log('expn.length', expn.length);
                        each(expn, item => {
                            console.log('item', item);
                            console.log('item.source', item.source);
                        })
                        throw 'stop';
                    }
                    //console.log('program.child.count', root.child.count);
                    //console.log('root.exports.exported.name', root.exports.exported.name);
                    //console.log('root.exports.exported.node.name', root.exports.exported.node.name);
    
                    //console.log('exported_object_declaration_node.signature', exported_object_declaration_node.signature);
    
                    // Want to algorithmically extract nodes from signatures.
                    //  Meaning pattern matching, and we specify we want specific nodes from there.
                    //   Better pattern matching will be one way the foundation side of the code can better support required operations.
    
                    if (exported_object_declaration_node) {
    
                        //console.log('exported_object_declaration_node', exported_object_declaration_node);
                        //console.log('exported_object_declaration_node.source', exported_object_declaration_node.source);
    
                        const qr = exported_object_declaration_node.query.select.by.child.count.exe(1);
                        const qr2 = qr.query.collect.first.child.second.child.exe()[0].query.select.by.type.exe('ObjectExpression');
                        //console.log('qr2', qr2);
    
                        if (qr2.length > 0) {
                            qr2[0].query.each.child.objectproperty.exe(cn => {
                                //console.log('cn', cn);
                                if (cn.child_nodes[0].type === 'StringLiteral') {
                                    exports_keys.push(cn.child_nodes[0].value);
                                } else {
                                    throw 'NYI';
                                }
                            });
                        }
                    }
                    const assignment_source_names = [];
                    // Better means to looks for patters and signatures will help here.
    
                    if (exports_keys.length === 0) {
                        if (root.exports.exported.node.name) {
                            const cn = program.query.select.child.by.signature.exe('ES(CaE(ME(ID,ID),ID,ID))')[0];
                            const call_names = cn.query.find.memberexpression.exe()[0].query.collect.child.name.exe();
                            if (call_names[0] === 'Object' && call_names[1] === 'assign') {
                                const target_name = cn.child_nodes[0].child_nodes[1].name;
                                if (target_name === root.exports.exported.node.name) {
                                    assignment_source_names.push(cn.child_nodes[0].child_nodes[2].name);
                                }
                            }
                        }
                    }
                    let assignment_source_declaration_node, assignment_source_name;
    
                    if (assignment_source_names.length > 0) {
                        if (assignment_source_names.length === 1) {
                            assignment_source_name = assignment_source_names[0];
                            (program.query.collect.child.declaration.exe().query.select.self.if.signature.is.exe('VDn(VDr(ID,CaE(ID,SL)))').query.each.first.child.exe(cn => {
    
                                //console.log('cn', cn);
    
                                const [node_obj, node_fn_call_id] = cn.nav(['0', '1/0']);
    
                                //const obj_name = cn.child_nodes[0].name;
                                //const fn_call_name = cn.child_nodes[1].child_nodes[0].name;
                                const obj_name = node_obj.name;
                                const fn_call_name = node_fn_call_id.name;
                                if (fn_call_name === 'require') {
                                    //const required_path = node.child_nodes[0].child_nodes[1].child_nodes[1].source.split('\'').join('').split('"').join('').split('`').join('');
                                    if (obj_name === assignment_source_name) {
                                        assignment_source_declaration_node = cn.parent_node;
                                    }
                                }
                            }));
                        } else {
                            throw 'NYI';
                        }
                    }
    
                    if (assignment_source_declaration_node) {
                        program.query.each.child.with.signature.exe('ES(AsE(ME(ID,ID),ID))', node => {
    
                            const [mec0, mec1] = node.nav(['0/0/0', '0/0/1']);
    
                            //const ase = node.child_nodes[0];
                            //const me = ase.child_nodes[0];
                            const obj_name = mec0.name;
                            const obj_property_name = mec1.name;
                            if (obj_name === assignment_source_name) {
                                exports_keys.push(obj_property_name);
                            }
                        })
                    }
                }
                //console.log('exports_keys', exports_keys);
                return exports_keys;
            }
        }


        

        //const exports_keys = working_find_exported_keys();
        //console.log('exports_keys', exports_keys);
        //throw 'stop';


        const test_sigs_queries = () => {
            const sigs = root.query.collect.child.signature.exe();
            console.log('sigs', sigs);

            sigs.sort().sort(function(a, b){
                // ASC  -> a.length - b.length
                // DESC -> b.length - a.length
                return b.length - a.length;
            });

            console.log('sigs', sigs);
        }
    });
}

test_js_file();