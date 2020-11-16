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
            //console.log('get_declared_object_features');
            const res = [];

            this.body.each.child.declaration(node_dec => {
                //console.log('');
                //console.log('node_dec', node_dec);
                //console.log('node_dec.source', node_dec.source);

                // then get the array of features from each declaration.

                const node_declared_object_features = JS_AST_Node_Declared_Object.arr_from_js_ast_node(node_dec);
                //console.log('node_declared_object_features.length', node_declared_object_features.length);
                each(node_declared_object_features, x => res.push(x));

            })


            //throw 'stop';
            return res;

        }

        const get_feature_export = () => {
            //let res;

            console.log('this.body.type', this.body.type);

            const get_exports_statement = () => {
                let res_inner;

                this.body.each.child.expression_statement(child_es => {
                    //console.log('child_es', child_es);
                    //console.log('child_es.source', child_es.source);
    
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
                                //console.log('names', names);
                            }
                        }
                    }
                    // 
                })
                return res_inner;
            }

            const exports_statement = get_exports_statement();
            console.log('get_feature_export exports_statement', exports_statement);


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

        // features.declared_objects.



        /*

        Object.defineProperty(this, 'export', {
            // Using shorthand method names (ES2015 feature).
            // This is equivalent to:
            // get: function() { return bValue; },
            // set: function(newValue) { bValue = newValue; },


            get() { 
                if (!features['export']) {
                    feature_export = get_feature_export();
                }

                return features['export'];
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        */




        








    }
}
module.exports = JS_File_Query_Features;