
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Query_Child = require('./JS_AST_Node_2.1-Child');

const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');

class JS_AST_Node_Inner extends JS_AST_Node_Query_Child {
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

        let inner_shared_type;

        // Make a shared property class?
        //  Group_Shared_Properties class


        

        inner.shared = {
            
        }

        Object.defineProperty(inner.shared, 'type', {
            get() { 
                if (inner_shared_type === undefined) {
                    each_inner_node((cn, idx, stop) => {
                        if (inner_shared_type === undefined) {
                            inner_shared_type = cn.type;
                        } else {
                            if (cn.type === inner_shared_type) {
                                // all good
                            } else {
                                inner_shared_type = false;
                                stop();
                            }
                        }

                    })
                }
                return child_shared_type;
                //return child_nodes.length;
            },
            enumerable: true,
            configurable: false
        });
        this.inner = inner;
    }
}

module.exports = JS_AST_Node_Inner