

// Such as for referencing the inner nodes without / before having to have the actual members.

// Maybe generators would be effective here too?

// origin_node
//  


// relationship to origin node
//  

class JS_AST_Abstract_Node {
    constructor(spec = {}) {

        // origin node
        // function that will be called to obtain the nodes.

        let origin, obtainer;

        let relationship_to, index;

        if (spec.origin) {
            origin = spec.origin;
        }
        if (spec.obtainer) {
            obtainer = spec.obtainer;
        }
        if (spec.relationship_to) {
            relationship_to = spec.relationship_to;
        }
        if (spec.index !== undefined) {
            index = spec.index;
        }

        let arr_cached;
        // so when they do get loaded / we have a ref - does not need to operate only in the abstract.


        Object.defineProperty(this, 'origin', {
            get() { 
                return origin;
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'index', {
            get() { 
                return index;
            },
            enumerable: true,
            configurable: false
        });


    }
}


module.exports = JS_AST_Abstract_Node;