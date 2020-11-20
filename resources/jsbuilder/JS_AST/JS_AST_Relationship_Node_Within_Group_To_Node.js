class JS_AST_Relationship_Node_Within_Group_To_Node {
    constructor(spec = {}) {
        let name;
        if (spec.name !== undefined) {
            name = spec.name;
        }
        let origin;
        if (spec.origin !== undefined) {
            origin = spec.origin;
        }
        let node;
        if (spec.node !== undefined) {
            node = spec.node;
        }
        let origin_ordinal_value_within_node;
        if (spec.origin_ordinal_value_within_node !== undefined) {
            origin_ordinal_value_within_node = spec.origin_ordinal_value_within_node;
        }
        
        Object.defineProperty(this, 'node', {
            get() { 
                return node;
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'origin', {
            get() { 
                return origin;
            },
            set(new_value) { 
                origin = new_value;
            },
            enumerable: true,
            configurable: false
        });
        
        
    }
}

module.exports = JS_AST_Relationship_Node_Within_Group_To_Node;