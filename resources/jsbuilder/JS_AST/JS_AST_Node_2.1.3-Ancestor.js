

const JS_AST_Node_Basics_Parent = require('./JS_AST_Node_2.1.2-Parent');

const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');

class JS_AST_Node_Ancestor extends JS_AST_Node_Basics_Parent {
    constructor(spec = {}) {
        super(spec);
        const {each_inner_node} = this;


        // Make it a Relationship_Group.
        // Node_To_Group_Relationship

        // JS_AST_Relationship_Node_To_Group

        // index (of ancestors)

        const ancestor = new JS_AST_Relationship_Node_To_Group({
            origin: this,
            name: 'ancestor'//,
            //obtainer: () => this.child_nodes,
            //iterator: callback => each(this.child_nodes, callback),
            //each: callback => each(this.child_nodes, callback)//,
            //select: fn_select => select_child_nodes(fn_select)
        });

        // Group properties....


        const parent = this.parent;
        let gparent, ggparent;
        if (parent.node) {
            gparent = parent.node.parent;
            if (gparent && gparent.node) {
                ggparent = gparent.node.parent;
            }

        }
        
        
        
         


        

        Object.assign(this, {
            ancestor: ancestor,
            gparent: gparent,
            ggparent: ggparent
        });
        

        this.ancestor = ancestor;
        this.gparent = gparent;
        this.ggparent = ggparent;
    }
}

module.exports = JS_AST_Node_Ancestor