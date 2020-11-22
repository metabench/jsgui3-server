
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Basics_Babel = require('./JS_AST_Node_1-Babel');

const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');

const JS_AST_Group_Shared = require('./JS_AST_Group_Shared');

class JS_AST_Node_Child extends JS_AST_Node_Basics_Babel {
    constructor(spec = {}) {
        super(spec);
        const {each_child_node} = this;

        const select_child_nodes = fn_select => {
            const res = [];
            filter_each_child_node(fn_select, cn => res.push(cn));
            return res;
        }

        // Make it a Relationship_Group.
        // Node_To_Group_Relationship

        // JS_AST_Relationship_Node_To_Group

        const child = new JS_AST_Relationship_Node_To_Group({
            origin: this,
            name: 'child'//,
            //obtainer: () => this.child_nodes,
            //iterator: callback => each(this.child_nodes, callback),
            //each: callback => each(this.child_nodes, callback)//,
            //select: fn_select => select_child_nodes(fn_select)
        });

        // Group properties....

        /*
        let child_shared_type;

        // Could benefit from making some kind of group shared class
        //  so the shared type property definition would work on multiple different groups.
        //  as would a find function.




        //child.shared = {
            
        //}

        Object.defineProperty(child.shared, 'type', {
            get() { 
                if (child_shared_type === undefined) {
                    each_child_node((cn, idx, stop) => {
                        if (child_shared_type === undefined) {
                            child_shared_type = cn.type;
                        } else {
                            if (cn.type === child_shared_type) {
                                // all good
                            } else {
                                child_shared_type = false;
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


        /*
        const find_child_node = (finder, callback) => {
            let res;
            each_child_node((cn, idx, stop) => {
                if (finder(cn)) {
                    res = cn;
                    stop();
                }
            });
            return res;
        }
        */


        
        let arr_child_types;
        let arr_child_categories;
        this.child = child;
    }
}

module.exports = JS_AST_Node_Child