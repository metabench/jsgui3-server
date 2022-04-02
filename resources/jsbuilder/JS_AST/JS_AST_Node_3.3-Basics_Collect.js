

const JS_AST_Node_Basics_Filter = require('./JS_AST_Node_3.2-Basics_Filter');

const JS_AST_Operation = require('./JS_AST_Operation');
const JS_AST_Relationship = require('./JS_AST_Relationship_Node_To_Group');

const JS_AST_Operation_On_Relationship = require('./JS_AST_Operation_On_Relationship');



// Collect is still a verb.
// Maybe all verbs should be functions.
//  Some values with different syntax could be properties.


class JS_AST_Node_Basics_Collect extends JS_AST_Node_Basics_Filter {
    constructor(spec = {}) {
        super(spec);

        const collect = new JS_AST_Operation({name: 'collect'});
        
        
        // or 'deep'? Or just know that 'all' does not include ancestors.
        const {child, inner, all} = this;
        const {inner_deep_iterate, deep_iterate, filter_deep_iterate} = this;


        //const collect_child_nodes = () => this.child_nodes;
        //const collect_child_identifiers = () => this.child_nodes.filter(node => node.is_identifier);
        //const collect_child_declarations = () => this.child_nodes.filter(node => node.is_declaration);

        /*
        let _collected_inner_nodes;
        const collect_inner_nodes = () => {
            if (!_collected_inner_nodes) {
                _collected_inner_nodes = [];
                inner_deep_iterate(node => _collected_inner_nodes.push(node));
            }
            return _collected_inner_nodes;
        }

        const _collect_all = () => {
            const res = [];
            deep_iterate(node => res.push(node));
            return res;
        }
        const _collect_child = () => {
            return this.child_nodes; // maybe into a new array?
        }
        const _collect_inner = () => {
            const res = [];
            inner_deep_iterate(node => {
                if (node !== this) {
                    res.push(node);
                }
            });
            return res;
        }
        */

        /*
        let fn_collect_all, fn_collect_child, fn_collect_inner;


        const _collect_all_identifiers = () => {
            const res = [];
            filter_deep_iterate(node => node.is_identifier, node => res.push(node));
            return res;
        }

        const _select_inner = (fn_select) => {
            const res = [];
            inner_deep_iterate(node => {
                if (node !== this && fn_select(node)) {
                    res.push(node);
                }
            });
            return res;
        }
        */
        this.collect = collect;
    }
}

module.exports = JS_AST_Node_Basics_Collect