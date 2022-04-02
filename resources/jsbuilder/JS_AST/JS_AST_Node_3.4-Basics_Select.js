

const JS_AST_Node_Basics_Collect = require('./JS_AST_Node_3.3-Basics_Collect');
const JS_AST_Operation = require('./JS_AST_Operation');
const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');
const JS_AST_Operation_On_Relationship = require('./JS_AST_Operation_On_Relationship');

const enable_array_as_queryable = require('./query/enable_array_as_queryable');

class JS_AST_Node_Basics_Select extends JS_AST_Node_Basics_Collect {
    constructor(spec = {}) {
        super(spec);

        const {filter_deep_iterate, filter_each_child_node, inner_deep_iterate} = this;
        const select_all = (fn_select) => {
            const res = [];
            filter_deep_iterate(fn_select, node => res.push(node));
            enable_array_as_queryable(res);

            return res;
        }
        const select_child = (fn_select) => {
            const res = [];
            filter_each_child_node(fn_select, node => res.push(node));
            return res;
        }
        const select_inner = (fn_select) => {
            const res = [];
            inner_deep_iterate(node => {
                if (node !== this && fn_select(node)) {
                    res.push(node);
                }
            });
            return res;
        }

        this.select_all = select_all;
        this.select_child = select_child;
        this.select_inner = select_inner;
    }
}

module.exports = JS_AST_Node_Basics_Select