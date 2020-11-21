const JS_AST_Node_Category_Pattern = require('./JS_AST_Node_5.4-Category_Pattern');

class JS_AST_Node_Category_Declaration extends JS_AST_Node_Category_Pattern {
    constructor(spec = {}) {
        super(spec);

        Object.defineProperty(this, 'is_declaration', {
            get() { 
                return this.babel.is_declaration;
            },
            enumerable: true,
            configurable: false
        });
    }
}

module.exports = JS_AST_Node_Category_Declaration;