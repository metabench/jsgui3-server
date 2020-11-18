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

        this.iterate_group = callback => {
            if (name === 'all') {
                origin.deep_iterate(callback);
            } else if (name === 'inner') {
                origin.inner_deep_iterate(callback);
            } else if (name === 'child') {
                origin.each_child(callback);
            } else {
                throw 'stop';
            }
        }

        this.collect_group = () => {
            const res = [];
            this.iterate_group(node => res.push(node));
            return res;
        }

    }
}

module.exports = JS_AST_Relationship_Node_To_Group;