const JS_AST_Root_Node_Feature = require('./JS_AST_Root_Node_Feature');

const JS_AST_Root_Node_Feature_Exported = require('./JS_AST_Root_Node_Feature_Exported');


class JS_AST_Root_Node_Feature_Exports extends JS_AST_Root_Node_Feature {
    constructor(spec = {}) {
        super(spec);

        let node;
        // exports.node
        if (spec.node !== undefined) node = spec.node;
        
        // Can give it the AST node that is being exported.
        //  Then when queried, it will be able to find out information about the node being exported.

        Object.defineProperty(this, 'node', {
            get() { 
                return node;
            },
            enumerable: true,
            configurable: false
        });

        let exported;
        Object.defineProperty(this, 'exported', {
            get() { 

                if (!exported) {
                    // Exported may as well be a feature.
                    console.log('node', node);

                    const assigned_as_node = node.child_nodes[0].child_nodes[1];
                    console.log('assigned_as_node', assigned_as_node);
                    console.log('assigned_as_node.name', assigned_as_node.name);
                    console.log('assigned_as_node.source', assigned_as_node.source);
                    // we need to find the node that gets exported.

                    exported = new JS_AST_Root_Node_Feature_Exported({
                        node: assigned_as_node
                    });

                    //throw 'NYI';


                }

                return exported;
            },
            enumerable: true,
            configurable: false
        });
        
        
    }
}

module.exports = JS_AST_Root_Node_Feature_Exports;