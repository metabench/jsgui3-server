
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Basics_Each = require('./JS_AST_Node_3.1-Basics_Each');
const JS_AST_Operation = require('./JS_AST_Operation');
const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');

const JS_AST_Operation_On_Relationship = require('./JS_AST_Operation_On_Relationship');

class JS_AST_Node_Basics_Filter extends JS_AST_Node_Basics_Each {


    constructor(spec = {}) {
        super(spec);

        // will have filter.by.type
        //  or filterby.type

        // filterby seems like a different operation really.

        // not sure.
        //  can easily be under filter.by

        const filter = new JS_AST_Operation({name: 'filter'});

        const {child, inner, all} = this;
        const {inner_deep_iterate, each_child_node, deep_iterate} = this;




        /*
        const child = new JS_AST_Relationship_Node_To_Group({
            name: 'child'
        });
        const inner = new JS_AST_Relationship_Node_To_Group({
            name: 'inner'
        });
        const all = new JS_AST_Relationship_Node_To_Group({
            name: 'all'
        });
        */


        /*
        const filter_child = new JS_AST_Operation_On_Relationship({
            operation: filter,
            related: child
        });
        const filter_inner = new JS_AST_Operation_On_Relationship({
            operation: filter,
            related: inner
        });
        const filter_all = new JS_AST_Operation_On_Relationship({
            operation: filter,
            related: all
        });
        filter.child = filter_child;
        filter.inner = filter_inner;
        filter.all = filter_all;

        */

        // .filter.child.node(fn_filter, callback)
        // .filter.child.node.by.type(str_type, callback)
        //   would make for really nice syntax, let's get it done.

        
        // JS_AST_Operation_On_Relationship_Object
        //  filter child node
        //  then we can have a getter which retrieves the JS_AST_Operation_On_Relationship_Object before executing the operation.

        // .fn for the function that runs it.
        //  


        // Or don't make the arch here more complex now....
        //  Get it all working at this level, can leave some features out for the moment.
        


        // dont think we would need any more?
        //  or .by?
        //   yes we need to make it some kind of more extendable object.
        //    maybe do indeed extend a function.
        //     



        //filter.child.node = filter_each_child_node;
        //filter.inner.node = filter_inner_deep_iterate;
        //filter.all.node = filter_deep_iterate;
        

        /*
        Object.assign(this, {

            //filter: (fn_filter, callback) => filter_deep_iterate(fn_filter, callback),

            filter_by_type: (type, callback) => {
                throw 'stop';
                filter_by_type_deep_iterate(type, callback)
            },

        })
        */
        
        /*

        Object.assign(this.filter, {
            deep: (fn_filter, callback) => filter_deep_iterate(fn_filter, callback),
            child: (fn_filter, callback) => filter_each_child_node(fn_filter, callback),
            inner: (fn_filter, callback) => filter_inner_deep_iterate(fn_filter, callback)
        })
        */


        /*
        Object.assign(this.filter_by_type, {
            deep: (type, callback) => filter_by_type_deep_iterate(type, callback),
            child: (type, callback) => filter_child_nodes_by_type(type, callback),
            inner: (type, callback) => filter_inner_nodes_by_type(type, callback)
        })
        */

        const filter_deep_iterate = (fn_filter, callback) => deep_iterate((node) => fn_filter(node) ? callback(node) : undefined)
        const filter_inner_deep_iterate = (fn_filter, callback) => inner_deep_iterate((node) => fn_filter(node) ? callback(node) : undefined)
        const filter_each_child_node = (fn_filter, callback) => each_child_node(js_ast_node => {
            if (fn_filter(js_ast_node)) {
                callback(js_ast_node);
            }
        });

        const filter_child_nodes_by_type = (type, callback) => filter_each_child_node(n => n.type === type, callback);


        this.filter = filter;
        this.filter_deep_iterate = filter_deep_iterate;
        this.filter_inner_deep_iterate = filter_inner_deep_iterate;
        this.filter_each_child_node = filter_each_child_node;
        this.filter_child_nodes_by_type = filter_child_nodes_by_type;

    }

}

module.exports = JS_AST_Node_Basics_Filter