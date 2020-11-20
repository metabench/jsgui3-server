// Change to Group_Relationship?
const {each} = require('lang-mini');

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
        //  so we start by knowing the ordinal value and the origin




        const iterate_group = this.each = callback => {
            if (name === 'sibling') {
                if (origin.parent_node) {
                    each(origin.parent_node.child_nodes, (node, idx, stop) => {
                        if (node !== this) {
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


        // And collect is still a verb here.
        //  Use property sugar with a different name.
        let _collected;
        this.collect = () => {
            if (!_collected) {
                const _collected = [];
                iterate_group(node => res.push(node));
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


        this.select = (fn_select) => {
            // Could return another group?
            //  

            const res = [];
            iterate_group(node => {
                if (fn_select(node)) res.push(node);
            });
            return res;
        }
    }
}

module.exports = JS_AST_Relationship_Node_To_Group;