const JS_AST_Node_Category_Literal = require('./JS_AST_Node_5.2-Category_Literal');

class JS_AST_Node_Category_Expression extends JS_AST_Node_Category_Literal {
    constructor(spec = {}) {
        super(spec);

        Object.defineProperty(this, 'is_expression', {
            get() { 
                return this.babel.is_expression;
            },
            enumerable: true,
            configurable: false
        });

        // See if we can evaluate expressions?
        //  Probably not worth it right now....

        // // .can_evaluate property
        //  so with some expression patterns we will be able to do so. maybe just a few.
        //   



    }
}

module.exports = JS_AST_Node_Category_Expression;