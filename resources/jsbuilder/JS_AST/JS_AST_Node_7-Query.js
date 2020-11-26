// const babel_node_tools = require('../babel/babel_node_tools');

const { each } = require('lang-mini');
const JS_AST_Node_Type_Identifier = require('./JS_AST_Node_6.5-Type_Identifier');

const {create_query} = require('./query/query_tools');

//const Query_Result = require('./query/Query_Result');

// The QFM seems like it should be global, or relate to the root node.
//  Or a single one gets created once programmatically and the nodes use it.


// Right now though, the functions apply to that node.
//  Seems like functions will need rewriting to apply in a general case to any node.
//   Likely worth doing that later on...?

// This index will need to provide functions relevant to the node - so it will have to be per node.
//  Possibly / always it will have preloaded ngrams though.

// For the moment, get it working. The functions were always declared within the context of the node they operate in and its been convenient in many ways, maybe essential in some.

// later on, the index could at least know the name of the function to call, so could call the function of the specific node.




//


// JS_AST_Node_Query_Capable?
//  As we want a JS_AST_Node_Query class???

class JS_AST_Node_Query_Capable extends JS_AST_Node_Type_Identifier {
    constructor(spec = {}) {
        super(spec);
        Object.defineProperty(this, 'query', {
            get() { 
                return create_query(this);
            },
            enumerable: true,
            configurable: false
        });
        this.query_with_words = arr_words => {

            // Maybe it's now expected to execute the query?

            // create_query_execution_fn

            const q = create_query(this, arr_words);
            return q;
        }
        
    }
}

module.exports = JS_AST_Node_Query_Capable;