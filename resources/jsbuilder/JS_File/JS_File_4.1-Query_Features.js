const {each, tof} = require('lang-mini');
const JS_File_Query = require('./JS_File_4-Query');

const JS_File_Import_References = require('./JS_File_Import_References');

const JS_File_Exports = require('./Feature/JS_File_Exports');
const JS_AST_Node_Declared_Object = require('../JS_AST/JS_AST_Node_Feature/JS_AST_Node_Declared_Object');
//const { default: JS_File_JS_AST_Node } = require('./JS_File_2-JS_AST_Node');
//const { default: Import_References } = require('./JS_File_Import_References');
// Will extract relevant AST code functionality. Files often import things at the beginning, then have declarations, then export what was declared at the end.

// Understanding the import declarations so they could be localised.
//  So we can refer to the ast of them, because we have recognised them elsewhere.

// Can build the functions into a js file.
// Later on - renaming local variables within a scope. 

// JS_File_Writable too...
//   .imports = ... or requires
//   .add_platform?

// Or better to create the platform objects out of the functions which have been comprehended from various files.
// JS_File_Platform?
// This will be more about understanding the js file. Basic structure will have already been obtained.

// Maybe a Babel level below?

const log = console.log;
//const log = () => [];
//#endregion


class JS_File_Feature {
    constructor(spec = {}) {
        const name = (() => spec.name ? spec.name : undefined)();
        Object.defineProperty(this, 'name', {
            get() { 
                return name;
            },
            enumerable: true,
            configurable: false
        });

        const value_getter = (() => spec.value_getter ? spec.value_getter : undefined)();

        // And a value_getter function.

        Object.defineProperty(this, 'value', {
            get() { 
                if (value_getter) {
                    return value_getter();
                }
            },
            enumerable: true,
            configurable: false
        });


    }
}

class JS_File_Features {
    constructor(spec = {}) {
        const js_file_node = () => spec.js_file_node ? spec.js_file_node : undefined;


        const arr_features = [];
        const map_features_by_name = new Map();

        // add feature - and have a getter function...

        const add = (feature) => {

            if (!map_features_by_name.has(feature.name)) {
                map_features_by_name.set(feature.name, feature);
            } else {
                throw 'Already has a feature with the name: ' + feature.name;
            }

            arr_features.push(feature);



            Object.defineProperty(this, feature.name, {
                get() { 
                    return feature;
                },
                enumerable: true,
                configurable: false
            });
        }
        

        // .imported
        // .exported

        Object.defineProperty(this, 'names', {
            get() { 
                return arr_features.map(feature => feature.name);
            },
            enumerable: true,
            configurable: false
        });

        // exported.type

        // .exported.object.keys

        // .exported.class.name
        this.add = add;

    }
}

class JS_File_Query_Features extends JS_File_Query {
    constructor(spec) {
        super(spec);
        

        // Not going to use .features for the moment.
        //  Will have more properties added to the root node that get the things we are likely looking for.

        



        const made_obselete = () => {


            const features = {}; // external interface
            const map_arr_features_by_name = {};

            // Querying features on a file level

            // Number of imported variables
            // Number of exported variables
            //  If it uses module.exports to do this
            //   the module.exports statement
            // Number of declarations in the root of the document.

            // Names of these variables
            // Each of the variables within a JSGUI_Single_Declaration abstraction.


            // Queries specific to a type....

            // root_defined_names

            // the export feature.
            //  Maybe make a 'feature' object. Won't necessarily correspond with specific syntax.

            // an exports property

            //let feature_export;
            //let arr_features_declared_object = [];

            const get_declared_object_features = () => {
                //log('get_declared_object_features');
                const res = [];

                //console.log('this.body.each', this.body.each);
                //console.log('this.body.each.child', this.body.each.child);

                this.body.each.child.declaration(node_dec => {
                    //log('');
                    //log('node_dec', node_dec);
                    //log('node_dec.source', node_dec.source);

                    // then get the array of features from each declaration.

                    const node_declared_object_features = JS_AST_Node_Declared_Object.arr_from_js_ast_node(node_dec);
                    //log('node_declared_object_features.length', node_declared_object_features.length);
                    each(node_declared_object_features, x => res.push(x));

                })

                //throw 'stop';
                return res;

            }

            const get_feature_export = () => {
                //let res;

                log('this.body.type', this.body.type);

                const get_exports_statement = () => {
                    let res_inner;

                    this.body.each.child.expression_statement(child_es => {
                        //log('child_es', child_es);
                        //log('child_es.source', child_es.source);
        
                        const ase = child_es.child_nodes[0];
                        if (ase.t === 'AsE') {
                            if (ase.child_nodes.length === 2) {
                                const me = ase.child_nodes[0];
                                if (me.t === 'ME') {
                                    // then 2 ids.
        
                                    if (me.child_nodes.length === 0);
                                    const names = [me.child_nodes[0].name, me.child_nodes[1].name];
        
                                    if (names[0] === 'module' && names[1] === 'exports') {
                                        res_inner = child_es;
                                    }
                                    //log('names', names);
                                }
                            }
                        }
                        // 
                    })
                    return res_inner;
                }
                

                const exports_statement = get_exports_statement();
                log('get_feature_export exports_statement', exports_statement);

                const res = new JS_File_Exports({
                    ast_node_exports_statement: exports_statement
                });
                // Can return undefined.

                return res;
            }

            Object.defineProperty(this, 'features', {
                // Using shorthand method names (ES2015 feature).
                // This is equivalent to:
                // get: function() { return bValue; },
                // set: function(newValue) { bValue = newValue; },


                get() { 
                    return features;
                },
                //set(newValue) { bValue = newValue; },
                enumerable: true,
                configurable: false
            });
            // get_declared_object_features

            Object.defineProperty(features, 'declared_objects', {
                // Using shorthand method names (ES2015 feature).
                // This is equivalent to:
                // get: function() { return bValue; },
                // set: function(newValue) { bValue = newValue; },


                get() { 
                    if (!map_arr_features_by_name['declared_objects']) {
                        map_arr_features_by_name['declared_objects'] = get_declared_object_features();
                    }
                    return map_arr_features_by_name['declared_objects'];
                    //return features;
                },
                //set(newValue) { bValue = newValue; },
                enumerable: true,
                configurable: false
            });

            // features

            Object.defineProperty(features, 'export', {
                // Using shorthand method names (ES2015 feature).
                // This is equivalent to:
                // get: function() { return bValue; },
                // set: function(newValue) { bValue = newValue; },


                get() { 
                    if (!map_arr_features_by_name['export']) {
                        map_arr_features_by_name['export'] = get_feature_export();
                    }
                    return map_arr_features_by_name['export'];
                    //return features;
                },
                //set(newValue) { bValue = newValue; },
                enumerable: true,
                configurable: false
            });

            let _exported;
            let _exported_keys;

            const that = this;

            

            Object.defineProperty(this, 'exported', {
                // Using shorthand method names (ES2015 feature).
                // This is equivalent to:
                // get: function() { return bValue; },
                // set: function(newValue) { bValue = newValue; },


                get() { 
                    if (_exported === undefined) { // can be false
                        // will lookup the assignment statement


                        throw 'NYI';


                        // use the map / index of variable names / usage (incl dotted paths)
                        //this.body.find()

                        _exported = {
                            
                        };
                        Object.defineProperty(_exported, 'keys', {
                            get() {
                                if (_exported_keys === undefined) {
                                    const jsf = that;

                                    const mdecnames = jsf.body.node.map.declaration.identifier.name;
                                    log('mdecnames', mdecnames);

                                    log('jsf.features.export', jsf.features.export);
                                    log('jsf.features.export.name', jsf.features.export.name);
                                    log('jsf.features.export.exported_object_name', jsf.features.export.exported_object_name);


                                    // No longer finds the export declaration as a feature

                                    // Probably will have a query-export section specifically for this.

                                    const export_dec = mdecnames.get(jsf.features.export.exported_object_name);
                                    log('export_dec', export_dec);
                                    log('export_dec.source', export_dec.source);

                                    //log('export_dec.collect.child.identifier.name', export_dec.collect.child.identifier.name);

                                    // Or some means to collect keys....
                                    //log('export_dec.child.count', export_dec.child.count);
                                    //log('export_dec.child.first.child.count', export_dec.child.first.child.count);

                                    //log('export_dec.child.first.collect.child.type()', export_dec.child.first.collect.child.type());
                                    //log('export_dec.child.first.collect.child.type_category()', export_dec.child.first.collect.child.type_category());

                                    // .collect.type

                                    const cats = export_dec.child.first.collect.child.type_category();
                                    const types = export_dec.child.first.collect.child.type();

                                    log('cats', cats);
                                    log('types', types);

                                    let res = false;
                                    if (cats[0] === 'Identifier' && cats[1] === 'Expression') {
                                        const expression = export_dec.child.first.child.last;
                                        if (types[1] === 'ObjectExpression') {
                                            log('expression', expression);
                                            log('expression.child.shared.type', expression.child.shared.type);
                                            // Reading keys out of an object expression like this would be helpful.
                                            //log('oe.keys', oe.keys);

                                            if (expression.child.shared.type === 'ObjectProperty') {
                                                //const keys = oe.child.first.collect.child.last.name;
                                                const ops = expression.child_nodes;

                                                // can't overwrite the 'name' property of a function, so it seems.

                                                // but not what we want here!!!
                                                //const keys = oe.collect.child.identifier.str_name();
                                                //const keys = oe.collect.child.first.value();

                                                // oe.keys
                                                res = [];
                                                // have it get a keys property?
                                                //  consider explanding the API in such ways.

                                                
                                                expression.filter(n => n.type === 'StringLiteral', n => {
                                                    //log('n', n);
                                                    //log('n.source', n.source);
                                                    res.push(n.source.split('\'').join(''));
                                                })
                                                //const keys = ow.collect.literal.value;
                                                //log('ops', ops);

                                                //log('1) keys', keys);
                                            } else {
                                                throw 'stop';
                                            }
                                            //oe.each.child
                                        } else {

                                            if (types[1] === 'NewExpression') {
                                                console.log('expression', expression);

                                                // Current lang-tools:

                                                // A new Evented_Class gets made.
                                                //  Then various values get assigned to it.

                                                // Let's deal with the case of a class being made, and then Object.assign used to give it properties.
                                                //  It is a special case, but part of how jsgui is currently put together.
                                                //   So the jsgui object itself operates eventfully.

                                                // Maybe put special cases in their own file?
                                                //  There could be quite a lot of them. Want to allow unusual syntax to be understood so that inventive JS can be built effectively too.
                                                
                                                // Special case queries.
                                                //  Make the special cases operate as JS_AST_Nodes.
                                                //   The special case instance would check that the node it's attempting to wrap fits in with it's suitability test.

                                                // Knowing when to use a special case...
                                                //  Could be from signature matching, could be from program logic like this.

                                                // However, the special case may be a feature of the whole file.
                                                //  May also be considered a feature of the root node.

                                                // Root_Node_Feature
                                                //  So yes it applies to nodes and uses that architecture. Then it can also be easily be applied to files.








                                                










                                            } else {
                                                throw 'stop';
                                            }


                                            
                                        }

                                    } else {
                                        throw 'stop';
                                    }
                                    //return res;

                                    _exported_keys = res;

                                    


                                }
                                return _exported_keys;
                            }
                        })


                        //throw 'stop';


                    }
                    return _exported;
                    //return features;
                },
                //set(newValue) { bValue = newValue; },
                enumerable: true,
                configurable: false
            });

            // An 'exported' object would be useful here.

            // exported keys is the main thing we need to know.
            //  maybe it's false.

            // such as if it exports a class

            // .exported.class






        }

        // Exports feature.

        //file.root.find_assignment_by_name('module.exports');
        
        

        const features = new JS_File_Features({
            js_file_node: this
        });

        const find_exported_node_type = () => {
            const root = this.js_ast_node_file;
            const exported_node_type = root.exports.exported.node.type;

            // 

            return exported_node_type;
        }

        const find_exported_object_declaration_node = () => {


            const root = this.js_ast_node_file;
            const root_exported_node = root.exports.exported.node;
            const exports_keys = [];
            const program = root.child_nodes[0];
            const exported_node_name = root.exports.exported.node.name;

            // The possibility of creating a JS_Abstract_Object which would then be used to get more info about the lifecycle of the object that gets exported
            //  as it progresses through the file. This will only be useful / relevant in some cases.

            // The local variable not for export of reuse - they could have their names changed so that they don't never conflict.
            //  Could have a counter, and declare names like mlv1 or further abbreviated in the future.
            //   Just short and systematic names will be good, could improve on it in the future, but if they are systematic they would compress well anyway.
            let exported_object_declaration_node;
            if (exported_node_name === undefined) {

            }  else {
                const expn = program.query.collect.child.variabledeclaration.exe().query.select.node.by.first.child.first.child.name.exe(exported_node_name)[0];
                if (expn.length === 1) {
                    exported_object_declaration_node = expn[0]; // Need to investigate behaviour change for nested collect queries.
                } else {
                    //console.log('expn.length', expn.length);
                    each(expn, item => {
                        console.log('item', item);
                        console.log('item.source', item.source);
                    })
                    throw 'stop';
                }
            }
            return exported_object_declaration_node;



        }

        const find_exported_keys = () => {
            //console.log('find_exported_keys');

            const root = this.js_ast_node_file;
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
                const expn = program.query.collect.child.variabledeclaration.exe().query.select.node.by.first.child.first.child.name.exe(exported_node_name)[0];
                if (expn.length === 1) {
                    exported_object_declaration_node = expn[0]; // Need to investigate behaviour change for nested collect queries.
                } else {
                    //console.log('expn.length', expn.length);
                    each(expn, item => {
                        console.log('item', item);
                        console.log('item.source', item.source);
                    })
                    throw 'stop';
                }
                if (exported_object_declaration_node) {
                    //console.log('exported_object_declaration_node', exported_object_declaration_node);
                    //console.log('exported_object_declaration_node.source', exported_object_declaration_node.source);
                    //const qr = exported_object_declaration_node.query.select.by.child.count.exe(1);
                    const qr2 = exported_object_declaration_node.query.select.by.child.count.exe(1).query.collect.first.child.second.child.exe()[0].query.select.by.type.exe('ObjectExpression');
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
                            const [node_obj, node_fn_call_id] = cn.nav(['0', '1/0']);
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
        
        const exports_feature = new JS_File_Feature({
            name: 'exported',
            value_getter: () => {

                // Use the code which has been in the file test js.
                //  It gets the information on what has been exported.

                const exported_res = {
                    keys: find_exported_keys(),
                    node_type: find_exported_node_type(),
                    object_declaration_node: find_exported_object_declaration_node()
                };


                return exported_res;


                // .type

                // .keys



                //throw 'stop';
            }
        });

        const imports_feature = new JS_File_Feature({
            name: 'imported',
            value_getter: () => {
                throw 'stop';
            }
        });

        features.add(exports_feature);
        features.add(imports_feature);

        this.features = features;

        //console.log('features', features);

        //throw 'stop';

    }
}
module.exports = JS_File_Query_Features;