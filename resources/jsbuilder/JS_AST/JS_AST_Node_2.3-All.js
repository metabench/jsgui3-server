
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Inner = require('./JS_AST_Node_2.2-Inner');

const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');

class JS_AST_Node_All extends JS_AST_Node_Inner {
    constructor(spec = {}) {
        super(spec);
        const {deep_iterate} = this;


        // Make it a Relationship_Group.
        // Node_To_Group_Relationship

        // JS_AST_Relationship_Node_To_Group

        const all = new JS_AST_Relationship_Node_To_Group({
            origin: this,
            name: 'all'//,
            //obtainer: () => this.child_nodes,
            //iterator: callback => each(this.child_nodes, callback),
            //each: callback => each(this.child_nodes, callback)//,
            //select: fn_select => select_child_nodes(fn_select)
        });

        // Group properties....

        /*

        let all_shared_type;

        // Make a shared property class?
        //  Group_Shared_Properties class

        // Just a group_shared class for the moment.




        all.shared = {
            
        }

        Object.defineProperty(all.shared, 'type', {
            get() { 
                if (all_shared_type === undefined) {
                    deep_iterate((cn, idx, stop) => {
                        if (all_shared_type === undefined) {
                            all_shared_type = cn.type;
                        } else {
                            if (cn.type === all_shared_type) {
                                // all good
                            } else {
                                all_shared_type = false;
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
        */
        this.all = all;
    }
}

module.exports = JS_AST_Node_All