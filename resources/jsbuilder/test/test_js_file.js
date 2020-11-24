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




        const working_find_exported_keys = () => {
            const root_exported_node = root.exports.exported.node;
            const exports_keys = [];
            const program = root.child_nodes[0];
            const exported_node_name = root.exports.exported.node.name;
            if (exported_node_name === undefined) {
                const collected_keys = root_exported_node.query.collect.self.if.type.objectexpression.exe().
                    query.select.child.by.first.child.type.exe('StringLiteral').
                    query.collect.first.child.exe().
                    query.collect.value.exe();
                //console.log('collected_keys', collected_keys);
                each(collected_keys, key => exports_keys.push(key));
            }  else {
                let exported_object_declaration_node;
                const expn = program.query.collect.child.variabledeclaration.exe().query.select.node.by.first.child.first.child.name.exe(exported_node_name);
                // .collect.node.where.first.child.first.child.name ???
                // select the node with the matching name too...?
                //console.log('expn', expn);
                //console.log('expn.length', expn.length);

                if (expn.length === 1) {
                    exported_object_declaration_node = expn[0];
                } else {
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
                    exported_object_declaration_node.query.select.by.child.count.exe(1).
                        query.collect.first.child.second.child.exe().
                        query.select.by.type.exe('ObjectExpression').
                        query.each.child.objectproperty.exe(cn => {
                            if (cn.child_nodes[0].type === 'StringLiteral') {
                                exports_keys.push(cn.value);
                            } else {
                                throw 'NYI';
                            }
                        });
                }
                const assignment_source_names = [];
                // Better means to looks for patters and signatures will help here.

                if (exports_keys.length === 0) {
                    if (root.exports.exported.node.name) {
                        const cn = program.query.select.child.by.signature.exe('ES(CE(ME(ID,ID),ID,ID))')[0];
                        const call_names = cn.query.find.memberexpression.exe().query.collect.child.name.exe();
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
                        (program.query.collect.child.declaration.exe().query.select.self.if.signature.is.exe('VDn(VDr(ID,CE(ID,SL)))').query.each.first.child.exe(cn => {
                            const obj_name = cn.child_nodes[0].name;
                            const fn_call_name = cn.child_nodes[1].child_nodes[0].name;
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
                //console.log('assignment_source_declaration_node', assignment_source_declaration_node);

                if (assignment_source_declaration_node) {
                    program.query.each.child.exe(node => {
                        if (node.signature === 'ES(AsE(ME(ID,ID),ID))') {
                            const ase = node.child_nodes[0];
                            const me = ase.child_nodes[0];
                            const obj_name = me.child_nodes[0].name;
                            const obj_property_name = me.child_nodes[1].name;
                            if (obj_name === assignment_source_name) {
                                exports_keys.push(obj_property_name);
                            }
                        }
                    });
                }
            }
            //console.log('exports_keys', exports_keys);
            return exports_keys;
        }

        const exports_keys = working_find_exported_keys();
        console.log('exports_keys', exports_keys);
        
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
        
    });
}

test_js_file();