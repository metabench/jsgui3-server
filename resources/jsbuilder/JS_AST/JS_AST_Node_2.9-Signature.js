

const JS_AST_Node_Available_In_Scope = require('./JS_AST_Node_2.5-Available_In_Scope');


class JS_AST_Node_Signature extends JS_AST_Node_Available_In_Scope {
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
                if (!deep_type_signature) deep_type_signature = get_deep_type_signature(100);
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



// Scope next...?
//  A function that iterates backwards through the scope.

// .scoped being a group of those scoped nodes

// node.scope.find.identifier.by.name(n)

// node.scope.all.declaration

// node.scope.each.declaration()

// node.shared.scope.all being all nodes in the shared scope
// node.scope being the scope internal to that node itself?

// Will have some kinds of more basic processes that deal with scope.
//  not so OO to begin with, but ability to get the names of all declarations in scope.

// The scope or maybe in_scope relationship could be a useful way to do it.
//  Also_In_Scope relationship?
//  Available_In_Scope
// 2.5-Available_Declarations_In_Scope
//  Just In_Scope as a relationship works OK.
//   Available_In_Scope is a bit clearer though. Maybe In_Scope is fine when it's a relationship, it's clear enough maybe.






