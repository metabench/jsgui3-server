

const JS_AST_Node_Ancestor = require('./JS_AST_Node_2.1.3-Ancestor');

const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');

class JS_AST_Node_Inner extends JS_AST_Node_Ancestor {
    constructor(spec = {}) {
        super(spec);
        const {each_inner_node} = this;


        // Make it a Relationship_Group.
        // Node_To_Group_Relationship

        // JS_AST_Relationship_Node_To_Group

        const inner = new JS_AST_Relationship_Node_To_Group({
            origin: this,
            name: 'inner'//,
            //obtainer: () => this.child_nodes,
            //iterator: callback => each(this.child_nodes, callback),
            //each: callback => each(this.child_nodes, callback)//,
            //select: fn_select => select_child_nodes(fn_select)
        });

        // Group properties....

        // Make a shared property class?
        //  Group_Shared_Properties class


        // Group_Shared_Property type possibly?

        //inner.shared = {
            
        //}

        
        this.inner = inner;
    }
}

module.exports = JS_AST_Node_Inner