const JS_AST_Relationship_Node_To_Group = require('./JS_AST_Relationship_Node_To_Group');

class JS_AST_Ordered_Relationship_Node_To_Group extends JS_AST_Relationship_Node_To_Group {
    constructor(spec = {}) {
        super(spec);
        let index;
        if (spec.index !== undefined) index = spec.index;
        

        
        Object.defineProperty(this, 'index', {
            get() { 
                return index;
            },
            enumerable: true,
            configurable: false
        });

        // A 'pre' property

        // Could be another group / a subgroup.

        // a previous object.
        //  seems like a Node_group?

        // .each
        // .all
        // 




        // 
        
    }
}

module.exports = JS_AST_Ordered_Relationship_Node_To_Group;