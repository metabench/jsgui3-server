
const { each } = require('../../../../../tools/arr-tools/arr-tools');
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


        const collect_child_nodes = () => this.child_nodes;
        const collect_child_identifiers = () => this.child_nodes.filter(node => node.is_identifier);
        const collect_child_declarations = () => this.child_nodes.filter(node => node.is_declaration);
        
        //collect.child.node = () => collect_child_nodes();
        //collect.child.identifier = () => collect_child_identifiers();
        //collect.child.declaration = () => collect_child_declarations();
        
        //Object.assign(this, {
        //    collect: () => collect()
        //})
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
        Object.defineProperty(collect, 'all', {
            get() {
                // iterate through the relationship objects.
                if (!fn_collect_all) {
                    fn_collect_all = fn_collect => _collect_all(fn_collect);


                    // collect.all.identifier
                    Object.defineProperty(fn_collect_all, 'identifier', {
                        get() {

                            // because collect is a verb
                            return () => _collect_all_identifiers();

                            //throw 'stop';
                            //return 
                        }
                    });
                }
                return fn_collect_all;
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(collect, 'child', {
            get() {
                // iterate through the relationship objects.
                if (!fn_collect_child) {
                    fn_collect_child = fn_collect => _collect_child(fn_collect);
                    Object.defineProperty(fn_collect_child, 'identifier', {
                        get() {
                            // because collect is a verb
                            return () => this.child_nodes.filter(node => node.is_identifier);
                        }
                    });

                }
                return fn_collect_child;
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(collect, 'inner', {
            get() {
                // iterate through the relationship objects.
                if (!fn_collect_inner) {
                    fn_collect_inner = fn_collect => _collect_inner(fn_collect);
                    Object.defineProperty(fn_collect_inner, 'identifier', {
                        get() {
                            return () => _select_inner(node => node.is_identifier);
                        }
                    });
                    Object.defineProperty(fn_collect_inner, 'declaration', {
                        get() {
                            return () => _select_inner(node => node.is_declaration);
                        }
                    });
                    Object.defineProperty(fn_collect_inner, 'statement', {
                        get() {
                            return () => _select_inner(node => node.is_statement);
                        }
                    });
                }
                return fn_collect_inner;
            },
            enumerable: true,
            configurable: false
        });
        this.collect = collect;
    }
}

module.exports = JS_AST_Node_Basics_Collect