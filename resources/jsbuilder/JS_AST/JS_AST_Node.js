// Do more to get the mirrored node structure set up earlier.

const {each} = require('lang-mini');
const JS_AST_Node_Changing = require('./JS_AST_Node_6-Changing');

const babel_node_tools = require('../babel/babel_node_tools');
const inspect = Symbol.for('nodejs.util.inspect.custom');

// Possibly able to manage a source babel node and different resultant transformations.

const {
    deep_iterate_babel_node,
    get_identifier_names,
    get_babel_child_nodes,
    get_require_call
} = babel_node_tools;

// For the moment, do more concerning getting the basic info.
//  Don't do the signature system yet - it's too complex when done fully.
//  Work on getting the info about what is required.
//   In more of a concice fp way.


// A separate Babel mirror structure could make sense.
//  

// A queries layer as well?



// Iterator and generator would be better?
//  Maybe have it attached to a child_nodes object.

class JS_AST_Node extends JS_AST_Node_Changing {

    // Currently they don't maintain themselves in an equivalent tree, and are very disposable.
    //  Try it that way for the moment.

    constructor(spec = {}) {
        super(spec);

        // Usage query would be an interesting one.
        // Part of a variable declaration - if so, what?
        // Used as a reference?

        // .used_as_reference
        // .used_in_declaration
        //   then what it's value gets set to

        // Analysis of the identifiers used in the code will provide a major way to track what comes from where.


        let usage;

        const determine_usage = () => {
            if (this.type === 'Identifier') {
                
            } else {
                throw 'NYI';
            }

        }

        Object.defineProperty(this, 'usage', {
            get() { 
                if (!usage) usage = determine_usage();
                //if (deep_type_signature) return deep_type_signature;
                return usage;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });



    }
    [inspect]() {
        // Need the inner part...
        //console.log('this.dimensions', this.dimensions);
        //return 'JS_AST_Node(' + this.type_signature + ')';
        return this.type_signature;
    }
    
}

JS_AST_Node.from_babel_node = (spec) => {
    return new JS_AST_Node(spec);
}

JS_AST_Node.from_spec = spec => {
    return new JS_AST_Node(spec);
}
module.exports = JS_AST_Node;