
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Basics_Each = require('./JS_AST_Node_3.1-Basics_Each');
const JS_AST_Operation = require('./JS_AST_Operation');
const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');

const JS_AST_Operation_On_Relationship = require('./JS_AST_Operation_On_Relationship');

class JS_AST_Node_Basics_Filter extends JS_AST_Node_Basics_Each {


    constructor(spec = {}) {
        super(spec);
        const filter = new JS_AST_Operation({name: 'filter'});

        const {child, inner, all} = this;
        const {inner_deep_iterate, each_child_node, deep_iterate} = this;

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