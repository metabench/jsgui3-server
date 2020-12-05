const JS_AST_Node_Feature = require('../JS_AST_Node_Feature');

// Likely to be made obselete by the higher level Interpreter class and system.

class JS_AST_Root_Node_Feature extends JS_AST_Node_Feature {
    constructor(spec = {}) {
        super(spec);
    }
}

module.exports = JS_AST_Root_Node_Feature;

