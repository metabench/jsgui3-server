
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Query_Collect = require('./JS_AST_Node_3.3-Query_Collect');
const JS_AST_Operation = require('./JS_AST_Operation');
const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');
const JS_AST_Operation_On_Relationship = require('./JS_AST_Operation_On_Relationship');
class JS_AST_Node_Query_Select extends JS_AST_Node_Query_Collect {
    constructor(spec = {}) {
        super(spec);

        const {filter_deep_iterate, filter_each_child_node, inner_deep_iterate} = this;
        
        const select = new JS_AST_Operation({name: 'select'});


        /*
        const child = new JS_AST_Relationship({
            name: 'child'
        });
        const inner = new JS_AST_Relationship({
            name: 'inner'
        });
        const all = new JS_AST_Relationship({
            name: 'all'
        });
        */

        const {child, inner, all} = this;

        const select_child = new JS_AST_Operation_On_Relationship({
            operation: select,
            related: child
        });
        const select_inner = new JS_AST_Operation_On_Relationship({
            operation: select,
            related: inner
        });
        const select_all = new JS_AST_Operation_On_Relationship({
            operation: select,
            related: all
        });
        select.child = select_child;
        select.inner = select_inner;

        // try property access
        //  so it sees it's an operation on a relationship
        //  then it returns the function that carries it out.

        //const each_relationship_object = relationship => {

        //}

        const _select_all = (fn_select) => {
            const res = [];
            filter_deep_iterate(fn_select, node => res.push(node));
            return res;
        }
        const _select_child = (fn_select) => {
            const res = [];
            filter_each_child_node(fn_select, node => res.push(node));
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

        let fn_select_all, fn_select_child, fn_select_inner;


        Object.defineProperty(select, 'all', {
            get() {
                // iterate through the relationship objects.
                if (!fn_select_all) {
                    fn_select_all = fn_select => _select_all(fn_select);
                }
                return fn_select_all;
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(select, 'child', {
            get() {
                // iterate through the relationship objects.
                if (!fn_select_child) {
                    fn_select_child = fn_select => _select_child(fn_select);
                }
                return fn_select_child;
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(select, 'inner', {
            get() {
                // iterate through the relationship objects.
                if (!fn_select_inner) {
                    fn_select_inner = fn_select => _select_inner(fn_select);
                }
                return fn_select_inner;
            },
            enumerable: true,
            configurable: false
        });



        //select.all = select_all;

        // select.child.declaration(node => node.name = 'hello')






        this.select = select;
        //Object.assign(this, {
        //    select: (fn_select) => select(fn_select)
        //})

    }
}

module.exports = JS_AST_Node_Query_Select