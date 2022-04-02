//const babel_node_tools = require('../babel/babel_node_tools');
// Index before query would help.

// Will index the occurrances of various nodes / things.

// Could get more into tree pattern checking too, declaratively saying what to look for and looking for multiple things at once with signature comparisons in a map.

// Indexing at every level looks like it would be useful.
//  so in order to get the info about how the names relate to nodes we consult indexes.


const JS_AST_Node_Signature = require('./JS_AST_Node_2.9-Signature');

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


// May have a .query object.
//  Somewhat drastic change
//   and .query will be used through its properties

// .query.child.declaration.child.declarator.name
// .query.child.declaration.child.declarator.name
// const q = node.query.child.declaration.child.declarator.name

// exequery(q)
// q.exe

// q.exe function makes sense for the query.

// can do qres = node.query.child.declaration.child.declarator.name.exe();
// qures = node.exeq(node.query.child.declaration.child.declarator.name);

// That means cutting down on the amount of potential changes to the non .query querying functionality.
//  May well be worth keeping them for the moment, until / unless completelty superceded by the query api - apart from perhaps in convenience of the functions themselves.
//   Then they could be expressed in one line declarations that show the shorthands available for the really nice query operations.






// Maybe this is 'Explore' rather than 'Query'. Or 'Navigate'.
//  Providing the relationships will be useful in some cases for the queries and running them.

// The query objects themselves, will be driven by properties.
//  query obj
//   property called. creates a query object that is given an array of previous / suffix query words.
//  Then when the query is built, it gets executed.
//   Maybe the query execution part will need to be quite substantial.
//    Probably best to do a stage 1 check / plan of the query, to make sure that it makes sense.
//     There could be a multitude of inner type functions, such as filtering and finding things - but it will need to either be recursive, or logically progress correctly processing
//      the query.

// User-friendly query objects are definitely the way forward.
//  For the moment though, can do more with some simpler (query?) methods such as node.filter.child 

// The .query system will be the best way by far to both create and run some more complex queries in a syntax that closely resembles the English language.

// These are more like core extended???
//  these are functions / getters / iterators











class JS_AST_Node_Basics extends JS_AST_Node_Signature {
    constructor(spec = {}) {
        super(spec);
        //const {deep_iterate, each_child_node, filter_each_child_node} = this;

        const {child_nodes, deep_iterate} = this;

        //const each_child_node = this.each.child;
        //const filter_each_child_node = this.filter.child;

        // sets the childnodes here.
        //  will also make available the relevant bable properties.

        // Use the lower level tools to kind of understand the node.
        //  Provide property getters that will do this.

        // Seeing what pattern / recognised object / pattern it is.

        const filter_deep_iterate = (fn_filter, max_depth, callback) => {

            if (!callback && typeof max_depth === 'function') {
                callback = max_depth;
                max_depth = undefined;
            }

            deep_iterate(max_depth, (js_ast_node, depth, path) => {
                if (fn_filter(js_ast_node)) callback(js_ast_node, path, depth);
            })
        }
        const inner_deep_iterate = (max_depth, callback) => {
            if (!callback && typeof max_depth === 'function') {
                callback = max_depth;
                max_depth = undefined;
            }
            filter_deep_iterate(js_ast_node => js_ast_node !== this, max_depth, callback);
        }
        //const filter_inner_deep_iterate = (filter, callback) => inner_deep_iterate((node) => filter(node) ? callback(node) : undefined)

        const filter_by_type_deep_iterate = (type, max_depth, callback) => {
            if (!callback && typeof max_depth === 'function') {
                callback = max_depth;
                max_depth = undefined;
            }
            filter_deep_iterate(node => node.type == type, max_depth, callback);
        }

        const typed_deep_iterate = (babel_type, max_depth, callback) => {
            if (!callback && typeof max_depth === 'function') {
                callback = max_depth;
                max_depth = undefined;
            }
            filter_deep_iterate(js_ast_node => js_ast_node.type === babel_type, max_depth, callback);
        }
        
        
        
        const filter_inner_nodes_by_type = (type, callback) => {
            filter_inner_deep_iterate(node => node.type === type, node => callback(node));
        }


        
        this.inner_deep_iterate = inner_deep_iterate;
        this.filter_deep_iterate = filter_deep_iterate;

    }
}

// Indexing may work better with / after these queries.
//  Then there could be another layer of queries after index.

module.exports = JS_AST_Node_Basics;