
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Basics_Collect = require('./JS_AST_Node_3.3-Basics_Collect');
const JS_AST_Operation = require('./JS_AST_Operation');
const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');
const JS_AST_Operation_On_Relationship = require('./JS_AST_Operation_On_Relationship');


const enable_array_as_queryable = require('./query/enable_array_as_queryable');

// seems to be needed relatively early on.

class JS_AST_Node_Basics_Select extends JS_AST_Node_Basics_Collect {
    constructor(spec = {}) {
        super(spec);

        const {filter_deep_iterate, filter_each_child_node, inner_deep_iterate} = this;
        
        //const select = new JS_AST_Operation({name: 'select'});


        // And means to give the operation function calls to carry it out?


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

        //const {child, inner, all} = this;

        //select.child = select_child;
        //select.inner = select_inner;
        //select.all = select_all;

        // JS_AST_Multi_Relationship_Operation
        //  So it deals with all of the JS_AST_Operation_On_Relationship objects.




        // try property access
        //  so it sees it's an operation on a relationship
        //  then it returns the function that carries it out.

        //const each_relationship_object = relationship => {

        //}

        const select_all = (fn_select) => {
            const res = [];
            filter_deep_iterate(fn_select, node => res.push(node));

            // but then can we queryify this group?

            //  group queries should have the same API apart from iterating through all or collecting / selecting from all.

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

        //let fn_select_all, fn_select_child, fn_select_inner;

        /*

        Object.defineProperty(select, 'all', {
            get() {
                // iterate through the relationship objects.
                if (!fn_select_all) {
                    fn_select_all = fn_select => _select_all(fn_select);


                    // select.all.identifier
                    Object.defineProperty(fn_select_all, 'identifier', {
                        get() {

                            // because select is a verb
                            return () => select.all(node => node.is_identifier);

                            //throw 'stop';
                            //return 
                        }
                    });



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
                    Object.defineProperty(fn_select_child, 'identifier', {
                        get() {
                            // because select is a verb
                            return () => select.child(node => node.is_identifier);
                        }
                    });

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
                    Object.defineProperty(fn_select_inner, 'identifier', {
                        get() {
                            return () => select.inner(node => node.is_identifier);
                        }
                    });
                }
                return fn_select_inner;
            },
            enumerable: true,
            configurable: false
        });
        */

        //select.all = select_all;

        // select.child.declaration(node => node.name = 'hello')

        

        //this.select = select;
        //Object.assign(this, {
        //    select: (fn_select) => select(fn_select)
        //})

    }
}

module.exports = JS_AST_Node_Basics_Select