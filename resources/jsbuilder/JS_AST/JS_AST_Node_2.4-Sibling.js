

// sibling.next
// sibling.all

// Sibling relationship
//  And the index is the index within the parent.


const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_All = require('./JS_AST_Node_2.3-All');


class JS_AST_Node_Sibling extends JS_AST_Node_All {
    constructor(spec = {}) {
        super(spec);
        const {each_child_node} = this;


        // sibling.all?

        // .siblings
        // .siblings.next

        // could say it's an ordinal relationship.
        const sibling = new JS_AST_Relationship_Node_To_Group({
            origin: this,
            name: 'sibling'//,
            //obtainer: () => this.child_nodes,
            //iterator: callback => each(this.child_nodes, callback),
            //each: callback => each(this.child_nodes, callback)//,
            //select: fn_select => select_child_nodes(fn_select)
        });

        

    }
}

module.exports = JS_AST_Node_Sibling;