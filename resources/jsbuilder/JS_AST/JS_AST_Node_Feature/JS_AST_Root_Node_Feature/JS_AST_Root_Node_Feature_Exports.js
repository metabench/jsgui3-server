const JS_AST_Root_Node_Feature = require('./JS_AST_Root_Node_Feature');




class JS_AST_Root_Node_Feature_Exports extends JS_AST_Root_Node_Feature {
    constructor(spec = {}) {
        super(spec);

        // Can give it the AST node that is being exported.
        //  Then when queried, it will be able to find out information about the node being exported.
        
    }
}

module.exports = JS_AST_Root_Node_Feature_Exports;