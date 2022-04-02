

const JS_AST_Node_Basics_First = require('./JS_AST_Node_3.0.0-Basics_First');

const JS_AST_Abstract_Node = require('./JS_AST_Abstract_Node');
const JS_AST_Ordinal = require('./JS_AST_Ordinal');
//const JS_AST_Relationship = require('./JS_AST_Relationship_Node_To_Group');
const JS_AST_Ordinal_Relationship = require('./JS_AST_Ordinal_Relationship');

// Could make a more specific feature extraction part.
//  Will come up with more:

// 2.1 Identify
// 2.2 ??? - Extract_Feature?

// Will identify more information about what JS is contained.
//  Eg if it's a recognised code library structure that can be extracted.
//   Identify the main block of declarations in a (library or framework) file.
//    Identify the variable definitions in there.

// Need more capability here to find and match specified features.

// Asking questions about a piece of code - questions to later determine what it is and how to use it.

// .matches_type_signature(signature)

// . but using a tree is better for checking multiple signatures at once.

// basically 'deep iterate', though could apply to .child or .ancestor

class JS_AST_Node_Basics_Second extends JS_AST_Node_Basics_First {
    constructor(spec = {}) {
        super(spec);

        // An abstract JS AST node

        const index = 1;
        const {child_nodes} = this;

        // first.child.declaration
        //  meaning it's not 'first.child'.



        // First is a node condition?
        //  or short for get first?

        // .first.child
        //   will need to be first.child.node

        // .first.declaration
        // .first.child.declaration
        //   want it to operate as read in English.

        // maybe function chaining is the way?

        // JS_AST_Ordinal

        const ordinal = this.second = new JS_AST_Ordinal({
            origin: this,
            //relationship_to: 'first',
            number: index
        });

        const {child} = this;
        // JS_AST_Ordinal_Relationship
        // Abstract node with a specified type?
        //  Or something else?

        // Relationship of node to node.

        const ordinal_child = ordinal.child = new JS_AST_Ordinal_Relationship({
            ordinal: ordinal,
            relationship: child
        });

        Object.defineProperty(ordinal_child, 'node', {
            get() { 
                return child_nodes[index];
            },
            enumerable: true,
            configurable: false
        });

    }
}

module.exports = JS_AST_Node_Basics_Second;