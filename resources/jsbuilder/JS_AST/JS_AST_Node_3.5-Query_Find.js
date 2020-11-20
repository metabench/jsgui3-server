
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Query_Select = require('./JS_AST_Node_3.4-Query_Select');

const JS_AST_Operation = require('./JS_AST_Operation');
const JS_AST_Relationship = require('./JS_AST_Relationship_Node_To_Group');
const JS_AST_Operation_On_Relationship = require('./JS_AST_Operation_On_Relationship');

class JS_AST_Node_Query_Find extends JS_AST_Node_Query_Select {
    constructor(spec = {}) {
        super(spec);
        const {deep_iterate} = this;

        const find = new JS_AST_Operation({name: 'find'});
        
        const find_node = (fn_match => {
            let res;
            deep_iterate((js_ast_node, path, depth, stop) => {
                if (fn_match(js_ast_node)) {
                    stop();
                    res = js_ast_node;
                }
            });
            return res;
        });

        // find.child.node?
        // 
        
        
        find.node = fn_match => find_node(fn_match);
        this.find = find;

        
        

    }
}

module.exports = JS_AST_Node_Query_Find