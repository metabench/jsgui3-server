
// Coming up with a new version based on the plan.
//  Want to hold the compressed version. Hold a reference to the new version which has has the compression run.

const JS_AST_Node_Planning = require('./JS_AST_Node_6-Planning');

class JS_AST_Node_Changing extends JS_AST_Node_Planning {
    constructor(spec = {}) {
        super(spec);

        // sets the childnodes here.
        //  will also make available the relevant bable properties.

        // Use the lower level tools to kind of understand the node.
        //  Provide property getters that will do this.

        // Seeing what pattern / recognised object / pattern it is.

        let compressed_version;

        const get_compressed_version = () => {
            // Compress the inner local variables.
            //  

            // Will compare original and compressed source.
        }

        Object.defineProperty(this, 'compressed_version', {
            get() { 
                if (!compressed_version) compressed_version = get_compressed_version();
                return compressed_version;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
    }
}

module.exports = JS_AST_Node_Changing;