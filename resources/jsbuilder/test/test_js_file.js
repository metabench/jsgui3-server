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

        const find_exported_keys = () => {

            // first check - are they all there in the exported node anyway?
            //  as in module.exports = {plenty}
            //  That will be the way that many modules export their objects with keys.
            
            // Likely will make a newer implementation of this, more connected to objects.

            // Indexes will better help some lookups - though could be integrated with queries.






            const exports_keys = [];

            const program = root.child_nodes[0];

            const exported_node_name = root.exports.exported.node.name;

            if (exported_node_name === undefined) {

                //console.log('root.exports.exported.node', root.exports.exported.node);



                if (root.exports.exported.node.type === 'ObjectExpression') {

                    // root.exports.exported.node.query.key.exec() ???

                    each(root.exports.exported.node.child_nodes, opr => {
                        //console.log('opr', opr);

                        if (opr.child_nodes[0].type === 'StringLiteral') {
                            const key = opr.child_nodes[0].source.split('"').join('').split('\'').join('');
                            //console.log('key', key);
                            exports_keys.push(key);
                        } else {
                            throw 'NYI';
                        }

                        //const key = opr.child_nodes[0].
                    })
                } else {
                    throw 'NYI';
                }

                //throw 'NYI';
            }  else {

                //console.log('exported_node_name', exported_node_name);

                let exported_object_declaration_node;


                // query.each.child.variabledeclaration
                // .filter.child.by.type
                //program.query.each.child.exe(cn => {
                    
                program.query.filter.each.child.by.type.exe('VariableDeclaration', cn => {
                        //console.log('cn', cn);
                    //console.log('cn.key', cn.key);
                    //console.log('cn.keys', cn.keys);
                    //console.log('cn.source', cn.source);

                    // the key of the object itself.

                    //if (cn.type === 'VariableDeclaration') {
                        if (cn.child_nodes.length === 1) {

                            // .query.find.identifier.with.name.exe ??? would get the first. or .by.name or .named 


                            // query.find.identifier

                            //if (cn.query.find.identifier.with.name.exe(exported_node_name))


                            const vdr = cn.child_nodes[0];
                            const cnid = vdr.child_nodes[0];
                            const cnname = cnid.name;
                            //console.log('cnname', cnname);

                            if (cnname === exported_node_name) {

                                exported_object_declaration_node = cn;
                                // found the declaration of exported object.

                                //throw 'stop';
                            }
                        } else {
                            //throw 'NYI';
                        }
                    //}

                })

                //console.log('program.child.count', root.child.count);
                //console.log('root.exports.exported.name', root.exports.exported.name);
                //console.log('root.exports.exported.node.name', root.exports.exported.node.name);

                //console.log('exported_object_declaration_node', exported_object_declaration_node);

                if (exported_object_declaration_node) {
                    //const oe = exported_object_declaration_node.all.find(node => node.type === 'ObjectExpression');
                    //console.log('oe', oe);
                    //console.log('exported_object_declaration_node.child.count', exported_object_declaration_node.child.count);

                    if (exported_object_declaration_node.child.count === 1) {
                        const vdr = exported_object_declaration_node.child_nodes[0];
                        //console.log('vdr', vdr);
                        //console.log('vdr.child.count', vdr.child.count);
                        //console.log('vdr.child_nodes[1].type', vdr.child_nodes[1].type);

                        if (vdr.child_nodes[1].type === 'ObjectExpression') {
                            const oe = vdr.child_nodes[1];
                            //console.log('oe.child.count', oe.child.count);
                            //console.log('oe.child.shared.type', oe.child.shared.type);

                            if (oe.child.shared.type === 'ObjectProperty') {
                                oe.each.child(cn => {
                                    //console.log('cn', cn);
                                    //console.log('cn.source', cn.source);

                                    if (cn.child_nodes[0].type === 'StringLiteral') {
                                        const key = cn.child_nodes[0].source.split('\'').join('').split(',').join(''); // though will change this to .value I expect.
                                        exports_keys.push(key);
                                    } else {
                                        throw 'NYI';
                                    }

                                })
                            }

                        }
                    }
                }

                const assignment_source_names = [];

                if (exports_keys.length === 0) {
                    if (root.exports.exported.node.name) {
                        // go looking for some more keys.

                        

                        /*
                        cn ES(CE(ME(ID,ID),ID,ID))
                        cn.source Object.assign(ec, lang_mini);
                        */

                        // see where it was declared.

                        // filter.each.child.by.signature(sig, cb)

                        // 'filter each child node by signature'

                        // .query.path.exe('0/0')

                        // .query.collect.child.name.exe();

                        //  and then later on will use then indexes when we have such indexes.
                        // .select.child.by.signature

                        //const cns = program.query.select.child.by.signature.exe('ES(CE(ME(ID,ID),ID,ID))');

                        //console.log('cns', cns);

                        //cns.
                        //throw 'stop';

                        program.query.filter.each.child.node.by.signature.exe('ES(CE(ME(ID,ID),ID,ID))', cn => {
                            //console.log('cn', cn);
                            //const me = cn.child_nodes[0].child_nodes[0];
                            const me = cn.query.find.by.type.exe('MemberExpression');
                            //console.log('me', me);
                            //throw 'stop';
                            // const me = cn.query.path.exe('0/0')
                            //const call_names = [me.child_nodes[0].name, me.child_nodes[1].name];

                            const call_names = me.query.collect.child.name.exe();

                            

                            //console.log('call_names', call_names);

                            //throw 'stop';

                            // me.query.match.child.name.exe(['Object', 'Assign'])

                            if (call_names[0] === 'Object' && call_names[1] === 'assign') {
                                const target_name = cn.child_nodes[0].child_nodes[1].name;
                                //console.log('target_name', target_name);

                                if (target_name === root.exports.exported.node.name) {
                                    //console.log('found assignment to exported object');
                                    const assignment_source_name = cn.child_nodes[0].child_nodes[2].name;
                                    //console.log('assignment_source_name', assignment_source_name);
                                    assignment_source_names.push(assignment_source_name);

                                }
                            }
                        });

                        
                    }
                }
                let assignment_source_declaration_node, assignment_source_name;

                if (assignment_source_names.length > 0) {
                    if (assignment_source_names.length === 1) {
                        //console.log('assignment_source_names', assignment_source_names);
                        assignment_source_name = assignment_source_names[0];


                        // .query.each.child.declaration.exe

                        program.query.each.child.declaration.exe(node => {

                            //if (node.is_declaration) {
                                //console.log('');
                                //console.log('node', node);
                                //console.log('node.source', node.source);

                                if (node.signature === 'VDn(VDr(ID,CE(ID,SL)))') {
                                    // var lang_mini = require('lang-mini');

                                    // could spot that it's a require call here.
                                    //  basically this code is going to be re-worked in some ways to make use of improved queries.
                                    //   would be nice to get this code down to a much smaller amount of statements where the overall logic is clear in a few lines
                                    //   what the procedure is looking for and returning.

                                    const obj_name = node.child_nodes[0].child_nodes[0].name;
                                    
                                    const fn_call_name = node.child_nodes[0].child_nodes[1].child_nodes[0].name;

                                    //console.log('obj_name', obj_name);
                                    //console.log('fn_call_name', fn_call_name);

                                    if (fn_call_name === 'require') {
                                        const required_path = node.child_nodes[0].child_nodes[1].child_nodes[1].source.split('\'').join('').split('"').join('').split('`').join('');
                                        //console.log('required_path', required_path);

                                        if (obj_name === assignment_source_name) {
                                            assignment_source_declaration_node = node;
                                        }

                                        // so can find the initial declaration of assignment_source_names
                                    }
                                }

                                if (node.signature === 'VDn(VDr(ID,ME(ID,ID)))') {
                                    // var Evented_Class = lang_mini.Evented_Class;
                                }
                                
                            //}

                        })

                    } else {
                        throw 'NYI';
                    }

                }

                // then again go through the child nodes, seeing if there is any declaration for the assignment source name

                //program.select.child()
                // Exported keys do seem a bit tricky to look for.
                //  Improved querying and specifics for looking at objects will help.


                //console.log('assignment_source_declaration_node', assignment_source_declaration_node);

                if (assignment_source_declaration_node) {
                    //console.log('assignment_source_name', assignment_source_name);


                    // then again go through the program child nodes and see what assignments are made to the assignment source object.
                    //  maybe programming in special rules would be worth it after all.
                    //  this current piece of code is rather long.
                    //   of course improved queries would help it to be short.
                    //   however, more can be done in terms of reading files without making the .query system first.


                    // .query.each.child.with.signature.exe(sig, node => {})

                    // each(node.query.collect.child.with.signature.exe('ES(AsE(ME(ID,ID),ID))'), es_node => ...?)

                    // node.query.collect.child.with.signature.exe('ES(AsE(ME(ID,ID),ID))').collect.inner.identifier.name.exe();
                    //  if a query result can then be queried again.
                    //   could extends the arrays produced?
                    //    Query_Result type?


                    program.query.each.child.exe(node => {

                        //console.log('');
                        //console.log('node', node);
                        //console.log('node.source', node.source);

                        // node ES(AsE(ME(ID,ID),ID))
                        //    node.source lang_mini.Collection = Collection;

                        if (node.signature === 'ES(AsE(ME(ID,ID),ID))') {
                            const ase = node.child_nodes[0];
                            const me = ase.child_nodes[0];
                            const obj_name = me.child_nodes[0].name;
                            const obj_property_name = me.child_nodes[1].name;

                            //console.log('[obj_name, obj_property_name]', [obj_name, obj_property_name]);

                            if (obj_name === assignment_source_name) {
                                // looks like another key.
                                exports_keys.push(obj_property_name);
                            }
                        }
                    });
                }


            }

            

            //console.log('exports_keys', exports_keys);

            return exports_keys;
        }

        const exports_keys = find_exported_keys();
        console.log('exports_keys', exports_keys);

        //console.log('root.exports.exported.keys', root.exports.exported.keys);

        // The exported keys will need to look into the declarations to see what gets exported.
        //  


        //console.log('root.exports.type', root.exports.type);

        //console.log('root.exports.keys', root.exports.keys);
        // The keys exported is important.



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