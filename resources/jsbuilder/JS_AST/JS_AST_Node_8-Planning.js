const JS_AST_Node_Index = require('./JS_AST_Node_7-Features');

class JS_AST_Node_Planning extends JS_AST_Node_Index {
    constructor(spec = {}) {
        super(spec);

        // sets the childnodes here.
        //  will also make available the relevant bable properties.

        // Use the lower level tools to kind of understand the node.
        //  Provide property getters that will do this.

        // Seeing what pattern / recognised object / pattern it is.

        // plan_variable_name_remapping

        // Will be fastest to carry out multiple changes at once in one iteration.
        //  May use quite standard babel transform syntax once I have the changes arranged in a nice object that makes them clear.




    }
    plan_variable_name_remapping() {
        this.each_inner_declaration_declarator_identifier()
    }
}

module.exports = JS_AST_Node_Planning;