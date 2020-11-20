// Change to Group_Relationship?
const {each} = require('lang-mini');
const JS_AST_Group_Shared = require('./JS_AST_Group_Shared');



class JS_AST_Relationship_Node_To_Group {
    constructor(spec = {}) {

        let name;
        if (spec.name !== undefined) {
            name = spec.name;
        }
        let origin;
        if (spec.origin !== undefined) {
            origin = spec.origin;
        }

        



        // eg 'child'

        // Iteration of sibling and ancestor groups here.

        // And a sibling_nodes property.

        // Integrate sibling iteration into the system.
        //  Will make some queries / other parts of the system easier to write.

        // A version of this that is ordinal as well, with .next and .previous.
        //  so we start by knowing the ordinal and the origin




        const iterate_group = callback => {
            if (name === 'sibling') {
                if (origin.parent_node) {
                    each(origin.parent_node.child_nodes, (node, idx, stop) => {
                        if (node !== origin) {
                            callback(node, idx, stop);
                        }
                    });
                }
            } else if (name === 'all') {
                origin.deep_iterate(callback);
            } else if (name === 'inner') {
                origin.inner_deep_iterate(callback);
            } else if (name === 'child') {

                each(origin.child_nodes, callback);
                //origin.each_child(callback);
            } else {
                throw 'stop';
            }
        }

        const find = (finder) => {
            let res;
            iterate_group(node, idx, stop => {
                if (finder(node)) {
                    res = node;
                    stop();
                }
            })
            return res;
        }

        const shared = new JS_AST_Group_Shared({
            group_iterator: iterate_group
        });


        // And collect is still a verb here.
        //  Use property sugar with a different name.
        let _collected;
        const collect = () => {
            if (!_collected) {
                _collected = [];
                iterate_group(node => _collected.push(node));
            }
            return _collected;
        }


        // and .all could be like .collect but a property.
        //  and with groups could be used in a fair few places.

        Object.defineProperty(this, 'all', {
            get() { 
                return this.collect();
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        let _count;

        const count = () => {
            if (_count === undefined) {
                if (_collected) {
                    _count = _collected.length;
                } else {

                    if (name === 'child') {
                        _count = origin.child_nodes.length;
                    } else {
                        _count = 0;
                        iterate_group(node => _count++);
                    }

                    
                }
            }
            return _count;
        }

        Object.defineProperty(this, 'count', {
            get() { 
                return count();
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });


        const select = (fn_select) => {
            // Could return another group?
            //  

            const res = [];
            iterate_group(node => {
                if (fn_select(node)) res.push(node);
            });
            return res;
        }


        Object.assign(this, {
            select: select,
            shared: shared,
            each: iterate_group,
            find: find,
            collect: collect
        });
        
        
        /*
        this.select = select;
        this.shared = shared;
        this.each = iterate_group;
        this.find = find;
        this.collect = collect;
        */
    }
}

module.exports = JS_AST_Relationship_Node_To_Group;