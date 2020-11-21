const JS_AST_Node_Category = require('./JS_AST_Node_5.0-Category');

class JS_AST_Node_Category_Identifier extends JS_AST_Node_Category {
    constructor(spec = {}) {
        super(spec);

        Object.defineProperty(this, 'is_identifier', {
            get() { 
                return this.babel.is_identifier;
            },
            enumerable: true,
            configurable: false
        });



        if (this.is_identifier) {
            Object.defineProperty(this, 'name', {
                get() { return this.babel.name; },
                //set(newValue) { bValue = newValue; },
                enumerable: true,
                configurable: false
            });
        }
        // Overwrite the name property later on?
        

    }
}

module.exports = JS_AST_Node_Category_Identifier;