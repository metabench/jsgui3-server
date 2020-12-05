
// Will probably retire this in favour of JS_AST_Node_Interpretor, and JS_AST_Node_Interpretation


class AST_Node_Usage_Category_Discerner {
    // This will be useful to efficiently work out what;s going on throughout the course of a JS file.
    //  Will be able to efficiently spot patterns of AST nodes that carry out actions we want to be on the lookout for.
    //  Could describe maybe 10 or more things we need to spot while going through a JS file to see what it does.
    //   The summary of what is imported, exported, where the imports come from, what if anything happens to them before being exported.
    //   Will spot code patterns that are parts of the jsgui files and that in total will be compiled to serve client-side JS.

    // Will be useful for getting (in many cases) an understanding of what some JS code does.
    //  May be able to load a large number of definitions into the system.

    







    constructor(spec = {}) {
        
        const map_usage_categories = new Map();

        const add_generalised_compressed_mid_signature_usage_category = (generalised_compressed_mid_signature, usage_category_name) => {
            if (!map_usage_categories.has(generalised_compressed_mid_signature)) {
                map_usage_categories.set(generalised_compressed_mid_signature, usage_category_name);
            } else {
                throw 'stop';
            }
        }

        const discern_node_usage_category = node => {
            const gen_comp_mid_type_sig = node.generalised_compressed_mid_type_signature;


        }
    }


}

module.exports = AST_Node_Usage_Category_Discerner;