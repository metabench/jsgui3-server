
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Query_Filter = require('./JS_AST_Node_3.2-Query_Filter');

const JS_AST_Operation = require('./JS_AST_Operation');
const JS_AST_Relationship = require('./JS_AST_Relationship_Node_To_Group');

const JS_AST_Operation_On_Relationship = require('./JS_AST_Operation_On_Relationship');



// Collect is still a verb.
// Maybe all verbs should be functions.
//  Some values with different syntax could be properties.


class JS_AST_Node_Query_Collect extends JS_AST_Node_Query_Filter {
    constructor(spec = {}) {
        super(spec);

        const collect = new JS_AST_Operation({name: 'collect'});


        // or 'deep'? Or just know that 'all' does not include ancestors.
        const all = new JS_AST_Relationship({
            name: 'all'
        });
        const child = new JS_AST_Relationship({
            name: 'child'
        });
        const inner = new JS_AST_Relationship({
            name: 'inner'
        });

        const collect_child = new JS_AST_Operation_On_Relationship({
            operation: collect,
            related: child
        });
        const collect_inner = new JS_AST_Operation_On_Relationship({
            operation: collect,
            related: inner
        });
        const collect_all = new JS_AST_Operation_On_Relationship({
            operation: collect,
            related: all
        });
        collect.child = collect_child;
        collect.inner = collect_inner;
        collect.all = collect_all;


        // collect.child.node
        // collect.child.identifier.name

        const collect_child_nodes = () => this.child_nodes;
        const collect_child_identifiers = () => this.child_nodes.filter(node => node.is_identifier);
        const collect_child_declarations = () => this.child_nodes.filter(node => node.is_declaration);
        
        collect.child.node = () => collect_child_nodes();
        collect.child.identifier = () => collect_child_identifiers();
        collect.child.declaration = () => collect_child_declarations();

        // can run the collect function on 

        // A .collect and .all object.
        //  .group

        // collect.child.identifier
        //  seems like a useful case
        // collect.inner.identifier

        // the interchangable words separated by '.' could make for easy coding.




        // Would likely be better built with this relationships and query system.

        // collect.child collect.inner
        // collect.all would make sense too
        //  since all is not a verb

        // but if there is a shorthand / alias system, .all can be collect.all.









        // this.all.identifier
        // this.all.child.identifier
        // this.all.child.node

        // Really it's collect_all
        //  Maybe collect is clearer / better.

        // this.collect.identifier
        //  Collect is much clearer because it's a verb.







        
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

        /*

        Object.assign(this.collect, {
            child: () => this.child.nodes,
            inner: cb => collect_inner_nodes()
        });

        // then collect.child.type
        //  collects the types of the children.

        let _collected_child_types, _collected_child_categories, _collected_child_names, _collected_category_values, _collected_child_identifiers, _collected_child_identifier_names;

        Object.assign(this.collect.child, {
            type: () => {
                if (!_collected_child_types) {
                    _collected_child_types = [];
                    each(child_nodes, cn => _collected_child_types.push(cn.type));
                }
                return _collected_child_types;
            },
            category: () => {
                if (!_collected_child_categories) {
                    _collected_child_categories = [];
                    each(child_nodes, cn => _collected_child_categories.push(cn.category));
                }
                return _collected_child_categories;
            },
            value: () => {
                if (!_collected_category_values) {
                    _collected_category_values = [];
                    each(child_nodes, cn => _collected_category_values.push(cn.value));
                }
                return _collected_category_values;
            },
            identifier: () => {
                if (!_collected_child_identifiers) {
                    _collected_child_identifiers = [];
                    each(child_nodes, cn => _collected_child_identifiers.push(cn.identifier));
                }
                return _collected_child_identifiers;
            },
            first: () => [child_nodes[0]]
        });

        Object.assign(this.collect.child.first, {
            str_name: () => {
                if (!_collected_child_identifier_names) {
                    _collected_child_identifier_names = [];
                    each(child_nodes, cn => _collected_child_identifier_names.push(cn.identifier.name));
                }
                return _collected_child_identifier_names;
            },
            value: () => {
                if (!_collected_child_identifier_names) {
                    _collected_child_identifier_names = [];
                    each(child_nodes, cn => _collected_child_identifier_names.push(cn.identifier.name));
                }
                return _collected_child_identifier_names;
            }
        });

        Object.assign(this.collect.child.identifier, {
            str_name: () => {
                if (!_collected_child_identifier_names) {
                    _collected_child_identifier_names = [];
                    each(child_nodes, cn => _collected_child_identifier_names.push(cn.identifier.name));
                }
                return _collected_child_identifier_names;
            },
            value: () => {
                if (!_collected_child_identifier_names) {
                    _collected_child_identifier_names = [];
                    each(child_nodes, cn => _collected_child_identifier_names.push(cn.identifier.name));
                }
                return _collected_child_identifier_names;
            }
        });

        */

        this.collect = collect;

    }
}

module.exports = JS_AST_Node_Query_Collect