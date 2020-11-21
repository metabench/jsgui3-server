const JS_AST_Node_Category_Declaration = require('./JS_AST_Node_5.5-Category_Declaration');

class JS_AST_Node_Category_Statement extends JS_AST_Node_Category_Declaration {
    constructor(spec = {}) {
        super(spec);

        Object.defineProperty(this, 'is_statement', {
            get() { 
                return this.babel.is_statement;
            },
            enumerable: true,
            configurable: false
        });
    }
}

module.exports = JS_AST_Node_Category_Statement;