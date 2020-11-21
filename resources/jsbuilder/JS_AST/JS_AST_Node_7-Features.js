//const babel_node_tools = require('../babel/babel_node_tools');

const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Index = require('./JS_AST_Node_6.0-Type');

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




// Could assign particular features to nodes, those features can then be queried.
// An alternative is to create more enhancements / subclass chaining of the JS_AST_Node.
//  Such as futher querying of declarations. An abstraction that provides all of the declared objects' string names and the JS_AST_Node instance for what it is set as being.
//  Handling array and object deconstruction.
//   Then even tracing those variables back.
//    Need to get a better understanding of the objects that get declared - including what happens to them regarding added keys after they get declared.
//     This will be very useful for determining what a class exports, and also matching that with when a class is importing any or all those things.
//

// subtypes?
//  (5.0 - Type)

// 5.1-Type_Identifier
// 5.2-Type_Literal
// 5.3-Type_Declarator
//  will handle patterns such as array and object deconstruction
// 5.4-Type_Declaration
//  will present information on what is declared in a straitforward API

// Once we know the type, we have access to further properties.
//  .l2properties object?
//   maybe, but only if it makes for a more convienient API.


// And have operations that can apply to whole categories as well.

// Other way round could make more sense, as we get the category-specific ones in there first.


// 6-Type...
// 5-Category...
















class JS_AST_Node_Query_Features extends JS_AST_Node_Index {
    constructor(spec = {}) {
        super(spec);
        // Getting the assigned values also seems important.
        // Possibly will be made into some kind of autoquery? Or may be better to do queries lazily, and store the results.
        
        // Declared Object features inside a node.

        // If a node 'features' declared objects, then the syntax in which they are declared is not so important.
        //  This is an abstraction level above that.

        // Want to keep it faitrly generic at this stage
        //  Will do more with root node interpretation for the moment I expect.
        //  First priority is to get everything linking together properly in an output file.
        //  
        const arr_features_declared_object = [];
        const features = [];
        const map_arr_features_by_feature_name = {
            
        }
        Object.defineProperty(this, 'features', {
            get() { 
                //if (!features) {
                //    features = [];
                //}
                return features;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // get literal names
        //  or is it value

        // // Assignment Feature?


        // Document features make the most sense to work on from the API point of view.
        //  Or root node features really.

        // Will try loading up and querying an interpreted root node.
        //  Or jsgui root node interpreted?
        // Even with that Object.assign trick, we can make it aware, keep that in the general purpose code.


        // The imports and exports features are important for linking together the documents.
        
    }
}

module.exports = JS_AST_Node_Query_Features;