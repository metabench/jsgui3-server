const JS_AST_Node_Type_Class_Declaration = require('./JS_AST_Node_6.1-Type_Class_Declaration');

const JS_AST_Node_Feature = require('./JS_AST_Node_Feature/JS_AST_Node_Feature');

class JS_AST_Node_Type_Variable_Declaration extends JS_AST_Node_Type_Class_Declaration {
    constructor(spec = {}) {
        super(spec);

        // Possibly 'Declaration' is a feature.
        //  Makes sense really.





        if (this.type === 'VariableDeclaration') {
            // .declaration.names
            // .declaration.keys
            // .declaration.map

        }
    }
}

module.exports = JS_AST_Node_Type_Variable_Declaration;