const JS_File_Feature = require('./JS_File_Feature');

class JS_File_Exports extends JS_File_Feature {
    constructor(spec = {}) {
        spec.name = "Exports";
        let ast_node_exports_statement;
        let exported_object_name;
        let value;

        if (spec.name !== 'Exports') {
            throw 'stop';
        }

        if (spec.ast_node_exports_statement) {
            ast_node_exports_statement = spec.ast_node_exports_statement;
        }
        super(spec);

        // What a file exports is a 'feature' of the file.
        //  This 'feature' API moves further away from the JS language spec and is closer to being a conceptual representation of what the file is / does.

        if (ast_node_exports_statement) {
            //console.log('ast_node_exports_statement.type_signature', ast_node_exports_statement.type_signature);

            if (ast_node_exports_statement.type_signature === 'ES(AsE(ME(ID,ID),ID))') {
                // find_x_node_using_signature ('ES(AsE(ME(ID,ID),x))')

                // May require parsing such a signature into a tree?

                const x_node = ast_node_exports_statement.child_nodes[0].child_nodes[1];
                //console.log('x_node', x_node);
                //console.log('x_node.name', x_node.name);

                exported_object_name = x_node.name;

            } else {
                throw 'NYI';
            }
        } else {
            throw 'expected .ast_node_exports_statement'
        }

        if (exported_object_name) {
            // find the declaration of such an object.
            //console.log('exported_object_name', exported_object_name);

            // Query the js file for Declaration (or maybe Declared features)

            // Would iterate through the root nodes looking for 'Declared' features.
            //  Would carry out closer examination of declarations. In the case of array decomposition would need to match the elements.

            // Declared features would be useful for discovering what goes into the single object that gets exported.
            //  In many cases we will be exporting variables local to the file body.

            

        } else {
            throw 'NYI';
        }

        /*
        Object.defineProperty(this, 'value', {
            get() { return exported_object_name; },
            enumerable: true,
            configurable: false
        });
        */

        Object.defineProperty(this, 'exported_object_name', {
            get() { return exported_object_name; },
            enumerable: true,
            configurable: false
        });


    }
}

module.exports = JS_File_Exports;