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

            // 



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

        const exports_keys = working_find_exported_keys();
        console.log('exports_keys', exports_keys);
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