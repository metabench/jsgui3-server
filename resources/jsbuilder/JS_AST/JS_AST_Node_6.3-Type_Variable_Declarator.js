const JS_AST_Node_Type_Variable_Declaration = require('./JS_AST_Node_6.2-Type_Variable_Declaration');
const JS_AST_Node_Feature_Declarator = require('./JS_AST_Node_Feature/JS_AST_Node_Feature_Declarator');
class JS_AST_Node_Type_Variable_Declarator extends JS_AST_Node_Type_Variable_Declaration {
    constructor(spec = {}) {
        super(spec);

        if (this.type === 'VariableDeclarator') {
            // Add a declarator property

            const declarator = new JS_AST_Node_Feature_Declarator({
                node: this
            });


            this.declarator = declarator;

            Object.defineProperty(this, 'id', {
                get() { 
                    return this.child_nodes[0];
                },
                enumerable: true,
                configurable: false
            });
        }

    }
}

module.exports = JS_AST_Node_Type_Variable_Declarator;