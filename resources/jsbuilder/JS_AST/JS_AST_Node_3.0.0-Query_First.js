
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Query = require('./JS_AST_Node_3-Query');

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

class JS_AST_Node_Query_First extends JS_AST_Node_Query {
    constructor(spec = {}) {
        super(spec);

        // An abstract JS AST node

        const index = 0;
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

        
        const ordinal = this.first = new JS_AST_Ordinal({
            origin: this,
            //relationship_to: 'first',
            number: index
        });

        const {child} = this;
        



        // JS_AST_Ordinal_Relationship


        // Abstract node with a specified type?
        //  Or something else?
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

        // then the with things like declaration it would find that item.



        // first.child should be a property lookup.

        /*
        Object.defineProperty(first, 'child', {
            get() { 
                return root_node;
            },
            enumerable: true,
            configurable: false
        });
        */


        //const first_child = first.child = new 

        // then the first child is another abstract node.





        /*



        // Could make it a property?

        const get_first_child = () => this.child_nodes[0];

        let cached_first;

        Object.defineProperty(this, 'first', {
            get() { 

                if (!cached_first) {
                    cached_first = {
                        child: get_first_child(),
                        declaration: get_first_declaration_child(),
                        identifier: get_first_identifier_child(),
                        statement: get_first_statement_child(),
                        expression: get_first_expression_child(),
                    }
                }

                return cached_first;
            },
            enumerable: true,
            configurable: false
        });

        // it's a JS_AST_Abstract_Node
        //  meaning we can refer to it without actually having the object.

        // .first is such an abstract node.
        // .first.child
        // .first.expression
        // .first.identifier

        // and .second, .third, .fourth, quite a lot would be of use.



        



        // .first.child.node property


        // first.child

        // first.child.declaration

        */



    }
}

module.exports = JS_AST_Node_Query_First;