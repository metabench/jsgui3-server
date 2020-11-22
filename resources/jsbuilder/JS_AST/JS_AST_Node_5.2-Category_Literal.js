const JS_AST_Node_Category_Identifier = require('./JS_AST_Node_5.1-Category_Identifier');

class JS_AST_Node_Category_Literal extends JS_AST_Node_Category_Identifier {
    constructor(spec = {}) {
        super(spec);

        Object.defineProperty(this, 'is_literal', {
            get() { 
                return this.babel.is_literal;
            },
            enumerable: true,
            configurable: false
        });

        if (this.is_literal) {
            Object.defineProperty(this, 'value', {
                get() { 
                    return this.babel.node.value;
                },
                enumerable: true,
                configurable: false
            });
        }


    }
}

module.exports = JS_AST_Node_Category_Literal;