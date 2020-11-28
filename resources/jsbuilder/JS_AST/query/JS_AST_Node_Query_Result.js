/*

module.exports = {
    enable_array_as_queryable: enable_array_as_queryable,
    create_query_execution_fn_unwrapped_results: create_query_execution_fn_unwrapped_results
}
*/


/*

const query_tools = require('./js_ast_node_query_tools');
//console.log('create_query', create_query);
//throw 'stop';

console.trace();
throw 'stop';
class Query_Result extends Array {

    constructor(spec) {
        super(spec);

        // .query property, will produce another query object.

        Object.defineProperty(this, 'query', {
            get() { 
                return query_tools.create_query(this);
            },
            enumerable: true,
            configurable: false
        });
    }

}
*/

const {create_query} = require('./js_ast_node_query_tools');


module.exports = JS_AST_Node_Query_Result;