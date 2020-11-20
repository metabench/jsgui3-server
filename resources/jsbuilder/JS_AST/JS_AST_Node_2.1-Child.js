
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Query_Babel = require('./JS_AST_Node_1-Babel');

const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');

class JS_AST_Node_Child extends JS_AST_Node_Query_Babel {
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

        let child_shared_type;

        // Make a shared property class?
        //  Group_Shared_Properties class


        

        child.shared = {
            
        }

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

        /*
        const child = this.child = {
            all: {

            },
            //each: each_child_node,
            //filter: filter_each_child_node,
            find: find_child_node,
            select: select_child_nodes,
            shared: {

            }
        }
        */

       // const each_child_node = callback => each(this.child_nodes, callback);



       // going for verb first dotted systax for the moment.
        
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
        
        let arr_child_types;

        // will be collect.child instead.

        // will be on this.collect as well, but that is collect as an action verb.



        // this.child.nodes?
        // child.all.type

        // also available on .collect.child.type

        /*
        Object.defineProperty(this.child.all, 'type', {
            get() { 
                //throw 'changing api'; // no, the .child property works well, and .verb is the function call.
                if (arr_child_types === undefined) {
                    arr_child_types = [];
                    each_child_node((cn, idx, stop) => {
                        arr_child_types.push(cn.type);
                    })
                }
                return arr_child_types;
            },
            enumerable: true,
            configurable: false
        });
        */

        let arr_child_categories;


        // .collect may be the better syntax?

        // maybe just child.category.

        /*

        let local1;
        Object.defineProperty(this, 'name', {
            get() { 
                return local1;
            },
            enumerable: true,
            configurable: false
        });
        */

        this.child = child;


        // will be part of the each query.
        
        


    }
}

module.exports = JS_AST_Node_Child