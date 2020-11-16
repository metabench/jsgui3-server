const JS_AST_Node = require('../JS_AST/JS_AST_Node');
//const JS_AST_Node_Declaration = require('./JS_AST_Node_Declaration');

class JS_AST_Node_Extended extends JS_AST_Node {
    constructor(spec = {}) {
        super(spec);
    }
}


module.exports = JS_AST_Node_Extended;