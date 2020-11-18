class JS_AST_Ordinal_Relationship {
    constructor(spec = {}) {
        let ordinal, relationship;

        let origin;
        if (spec.origin !== undefined) {
            origin = spec.origin;
        }

        if (spec.ordinal !== undefined) ordinal = spec.ordinal;
        if (spec.relationship !== undefined) relationship = spec.relationship;


    }
}

module.exports = JS_AST_Ordinal_Relationship;
