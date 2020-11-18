class JS_AST_Ordinal_Relationship {
    constructor(spec = {}) {
        let ordinal, relationship;

        

        if (spec.ordinal !== undefined) ordinal = spec.ordinal;
        if (spec.relationship !== undefined) relationship = spec.relationship;


        
        Object.defineProperty(this, 'origin', {
            get() { 
                return ordinal.origin;

            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

    }
}

module.exports = JS_AST_Ordinal_Relationship;
