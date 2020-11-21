const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Sibling = require('./JS_AST_Node_2.4-Sibling');
const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');

class JS_AST_Node_Available_In_Scope extends JS_AST_Node_Sibling {
    constructor(spec = {}) {
        super(spec);
        const {each_child_node} = this;
        

        // The scope or in_scope relationship object.

        const available_in_scope = new JS_AST_Relationship_Node_To_Group({
            origin: this,
            name: 'available_in_scope'//,
            //obtainer: () => this.child_nodes,
            //iterator: callback => each(this.child_nodes, callback),
            //each: callback => each(this.child_nodes, callback)//,
            //select: fn_select => select_child_nodes(fn_select)
        });

        this.available_in_scope = available_in_scope;


    }
}

module.exports = JS_AST_Node_Available_In_Scope;

