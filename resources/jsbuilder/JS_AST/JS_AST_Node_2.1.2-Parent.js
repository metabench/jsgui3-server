
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Basics_Child = require('./JS_AST_Node_2.1.1-Child');

const JS_AST_Relationship_Node_Within_Group_To_Node = require('./JS_AST_Relationship_Node_Within_Group_To_Node');

class JS_AST_Node_Parent extends JS_AST_Node_Basics_Child {
    constructor(spec = {}) {
        super(spec);
        const {each_inner_node} = this;


        // Make it a Relationship_Group.
        // Node_To_Group_Relationship

        // JS_AST_Relationship_Node_To_Group

        // Do we have the index within parent?
        //  Could change the construction algo lower down so it's given - it's useful.
        

        const parent = new JS_AST_Relationship_Node_Within_Group_To_Node({
            origin: this,
            name: 'parent',
            node: this.parent_node
            //obtainer: () => this.child_nodes,
            //iterator: callback => each(this.child_nodes, callback),
            //each: callback => each(this.child_nodes, callback)//,
            //select: fn_select => select_child_nodes(fn_select)
        });

        // Group properties....

        this.parent = parent;
    }
}

module.exports = JS_AST_Node_Parent