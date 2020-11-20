
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Query_Child = require('./JS_AST_Node_2.1.1-Child');

const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');

class JS_AST_Node_Ancestor extends JS_AST_Node_Query_Child {
    constructor(spec = {}) {
        super(spec);
        const {each_inner_node} = this;


        // Make it a Relationship_Group.
        // Node_To_Group_Relationship

        // JS_AST_Relationship_Node_To_Group

        const ancestor = new JS_AST_Relationship_Node_To_Group({
            origin: this,
            name: 'ancestor'//,
            //obtainer: () => this.child_nodes,
            //iterator: callback => each(this.child_nodes, callback),
            //each: callback => each(this.child_nodes, callback)//,
            //select: fn_select => select_child_nodes(fn_select)
        });

        // Group properties....

        this.ancestor = ancestor;
    }
}

module.exports = JS_AST_Node_Ancestor