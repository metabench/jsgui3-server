
const JS_AST_Node_Basics_Each = require('./JS_AST_Node_3.1-Basics_Each');

const JS_AST_Operation = require('./JS_AST_Operation');
const JS_AST_Relationship = require('./JS_AST_Relationship');
const JS_AST_Operation_On_Relationship = require('./JS_AST_Operation_On_Relationship');


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

// Currently not used anyway. Will make the more advanced .query system.



class JS_AST_Node_Basics_Count extends JS_AST_Node_Basics_Each {
    constructor(spec = {}) {
        super(spec);

        const {each_child_node, filter_each_child_node} = this;


        // this.count

        // it's an AST Operation.


        // count.child.declaration
        // count.inner.declaration

        // verb adjective noun
        //  not really an adjective, i think relationship is a better term.


        // this.child is a group relationship.

        // one-to-group relationship.








        // JS_AST_Property_Operation rather than JS_AST_Function_Operation perhaps

        const count = new JS_AST_Operation({name: count});


        const {child} = this;


        //const child = new JS_AST_Relationship({
        //    name: 'child'
        //});

        

        const count_child = new JS_AST_Operation_On_Relationship({
            operation: count,
            relationship: child
        });
        count.child = count_child;

        //child.count = count_child;

        // .count.child.node


        Object.defineProperty(count_child, 'node', {
            get() { 
                return this.child_nodes.length;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // identifier
        // declaration
        // expression
        // statement
        // 



        


        // .count.child.node

        // .count.child ??? // probably won't work for the moment at least. maybe could return some wrapped number property, even Data_Object?
        //   seems like Data_Object has it's use after all??? Or not, as it does not need to be event driven.



        this.count = count;




    }
}

module.exports = JS_AST_Node_Basics_Count