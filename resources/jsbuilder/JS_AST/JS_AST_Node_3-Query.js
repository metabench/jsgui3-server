//const babel_node_tools = require('../babel/babel_node_tools');
// Index before query would help.

// Will index the occurrances of various nodes / things.

// Could get more into tree pattern checking too, declaratively saying what to look for and looking for multiple things at once with signature comparisons in a map.

// Indexing at every level looks like it would be useful.
//  so in order to get the info about how the names relate to nodes we consult indexes.

const { each } = require('../../../../../tools/arr-tools/arr-tools');
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


class JS_AST_Node_Query extends JS_AST_Node_Signature {
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

        Object.assign(this, {

            

            //filter: (fn_filter, callback) => filter_deep_iterate(fn_filter, callback),

            //filter_by_type: (type, callback) => filter_by_type_deep_iterate(type, callback),

            //find: (fn_match) => find_node(fn_match),

            // Maybe this will be in the indexing part. Probably best there.
            map: {
                child: {

                },
                deep: {

                },
                inner: {

                }
            }
        });

        Object.defineProperty(this, 'value', {
            get() { 
                if (this.type === 'StringLiteral') {
                    console.log(this.node);
                    throw 'stop';
                } else {
                    throw 'NYI';
                }

            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'identifier', {
            get() { 

                //return this.find.child(n => n.type === 'Identifier');

                return this.find(n => n.type === 'Identifier');

            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // const each_root_assignment_expression = (callback) => each_root_node(node => node.type === 'AssignmentExpression', callback);
        // //this.index_named_node = index_named_node; this.get_arr_named_node = get_arr_named_node;
        

        const deep_iterate_identifiers = (max_depth, callback) => typed_deep_iterate('Identifier', max_depth, callback);
        this.deep_iterate_identifiers = deep_iterate_identifiers;
        this.inner_deep_iterate = inner_deep_iterate;
        this.filter_deep_iterate = filter_deep_iterate;

    }
}

// Indexing may work better with / after these queries.
//  Then there could be another layer of queries after index.

module.exports = JS_AST_Node_Query;