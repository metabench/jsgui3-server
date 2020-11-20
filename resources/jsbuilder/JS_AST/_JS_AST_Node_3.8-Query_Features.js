//const babel_node_tools = require('../babel/babel_node_tools');

const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Query_Find = require('./JS_AST_Node_3.5-Query_Find');

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

class JS_AST_Node_Query_Features extends JS_AST_Node_Query_Find {
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