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

class JS_File_Query_Features extends JS_File_Query {
    constructor(spec) {
        super(spec);

        // Exports feature.

        //file.root.find_assignment_by_name('module.exports');
        
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
                                //log('export_dec.child.first.collect.child.category()', export_dec.child.first.collect.child.category());

                                // .collect.type

                                const cats = export_dec.child.first.collect.child.category();
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
}
module.exports = JS_File_Query_Features;