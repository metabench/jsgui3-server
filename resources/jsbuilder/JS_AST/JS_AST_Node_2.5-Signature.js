
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Sibling = require('./JS_AST_Node_2.4-Sibling');


class JS_AST_Node_Signature extends JS_AST_Node_Sibling {
    constructor(spec = {}) {
        super(spec);
        const {each_child_node} = this;
        let deep_type_signature, type_signature;
        // and then a more shallow type signature.
        //   type_signature could go to depth 2 or 3. Let's try it.
        // Want to be able to get small and usable signatures.

        // Want max depth for the iteration.
        //  The stop function integrated within the iteration would be useful there to get that done.
        //  Maybe an 'options' object now params have got more complex.

        const get_deep_type_signature = () => {
            //let res = '[' + this.type + '(';
            //if (!deep_type_signature) {
            //console.log('');
            //console.log('this.path', this.path);
            //console.log('this.type', this.type);
            let res = '' + this.abbreviated_type, inner_res = '', first = true;

            // Only look at child nodes, not full tree here.
            // each_child_node   inner_deep_iterate
            //  seems fixed now.
            // no longer supports max_depth but at least it works now.

            each_child_node(inner_node => {
                if (!first) inner_res = inner_res + ','
                inner_res = inner_res + inner_node.deep_type_signature
                first = false;
            });
            //res = res + ')';
            if (inner_res.length > 0) {
                res = res + '(' + inner_res + ')';
            } else {

            }
            return res;
        }

        Object.defineProperty(this, 'type_signature', {
            get() { 
                if (!type_signature) type_signature = get_deep_type_signature(1);
                //if (deep_type_signature) return deep_type_signature;
                return type_signature;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'deep_type_signature', {
            get() { 
                if (!deep_type_signature) deep_type_signature = get_deep_type_signature();
                //if (deep_type_signature) return deep_type_signature;
                return deep_type_signature;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'signature', {
            get() { 
                return this.type_signature
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        this.get_deep_type_signature = get_deep_type_signature;

    }
}

module.exports = JS_AST_Node_Signature;