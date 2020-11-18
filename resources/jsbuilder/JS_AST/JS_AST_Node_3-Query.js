//const babel_node_tools = require('../babel/babel_node_tools');
// Index before query would help.

// Will index the occurrances of various nodes / things.

// Could get more into tree pattern checking too, declaratively saying what to look for and looking for multiple things at once with signature comparisons in a map.

// Indexing at every level looks like it would be useful.
//  so in order to get the info about how the names relate to nodes we consult indexes.

const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Signature = require('./JS_AST_Node_2.5-Signature');

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

        // filter_inner_nodes_by_type





        // .collect (gets them in an array)
        // .select (uses a selection filter)

        //const select_child_nodes = (selector) => {
        //    const res = [];
        //    filter_each_child_node(selector, cn => res.push(cn));
        //    return res;
        //}

        // only finds the first
        


        const deep_collect = () => {
            const res = [];
            deep_iterate(node => res.push(node));
            return res;
        }

        // .all maybe?
        // .collect or select is the better verb choice.


        /*

        // depracating

        this.deep = {
            iterate: cb => deep_iterate(cb), // ???
            filter: (fn, cb) => filter_deep_iterate(fn, cb),
            collect: () => deep_collect()
        }

        this.inner = {
            iterate: cb => inner_deep_iterate(cb),
            filter: (fn, cb) => filter_inner_deep_iterate(fn, cb)
        }

        */



        

        // Will remove these, change the API, will use more dots and objects.
        //  Will follow more of a pattern and be quite cool.
        //this.each_child_node = each_child_node;

        // this.filter_by_type
        
        //this.typed_deep_iterate = typed_deep_iterate;


        // .by in order to filter by type

        // this.each.by_type?

        //this.filter_each_child_node = filter_each_child_node;
        //this.filter_deep_iterate = filter_deep_iterate;

        //this.inner_deep_iterate = inner_deep_iterate;

        // .filter_by_type.inner

        //this.each_inner_node_of_type = each_inner_node_of_type;

        // this.each.inner.typed(t)
        // this.each.inner.categorised(c)

        // yes we want .by

        // this.each.inner.by.type
        // this.filter.inner.by.type
        // this.filter.inner
        // this.typefilter.inner
        // this.filter_by_type.inner

        // each, filter, collect, select

        // this.map.child.category

        // .filter is the same as .filter.deep???

        

        let _collected_nodes;

        const collect = () => {
            if (!_collected_nodes) {
                _collected_nodes = [];
                deep_iterate(node => _collected_nodes.push(node));
            }
            return _collected_nodes;
        }

        

        /*
        const select_child_nodes = (fn_select) => {
            const res = [];
            filter_each_child_node(fn_select, node => res.push(node));
            return res;
        }
        */

        /*

        const select_inner_nodes = (fn_select) => {
            const res = [];
            filter_inner_deep_iterate(fn_select, node => res.push(node));
            return res;
        }

        */




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
            },
            
            //filter: {
            //    child: fn_filter => filter_each_child_node(fn_filter)
            //},

            // node.collect() should collect all it's nodes?
            //  Does actually make sense.

            //collect: () => collect(),
            //select: (fn_select) => select(fn_select)
        })


        /*
        

        Object.assign(this.find, {
            child: (fn_match) => find_child_node(fn_match),
            //inner: fn_select => select_inner_nodes(fn_select)
        });

        


        Object.assign(this.select, {
            child: (fn_select) => select_child_nodes(fn_select),
            inner: fn_select => select_inner_nodes(fn_select)
        });
        

        */
        // Structure signatures of nodes (and all nodes below them) would be relatively easy to put together, and possibly useful.
        //  Will be able to find a programmatic pattern, where parts would often be interchangable.
        
        /*
        const each_inner_declaration_declarator_identifier = (callback) => 
            this.each_inner_declaration(node_inner_declaration => 
            node_inner_declaration.each_inner_variable_declarator(decl =>
            decl.each_inner_identifier(ident =>
            callback(ident))))
        */
        

        // [TypeName]([TypeName2](...),[TypeName3](...))

        // structure_signaturestructure_signature
        // deep_type_signature
        //  Would be a useful way to identify features with expected types / shapes of the structure of types that can be extracted and treated as a known programmatic quantity.

        //this.structure_signature = 

        


        /*
        Object.defineProperty(this, 'inner_declaration_names', {
            get() { 
                const res = []; const tm = {};
                filter_each_inner_node(node => node.is_declaration, node => each(node.own_declaration_names, dn => {
                    if (!tm[dn] && typeof dn === 'string') {
                        res.push(dn);
                        tm[dn] = true;
                    }
                }))
                return res;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        */

        /*
        Object.defineProperty(this, 'child_declarations', {
            get() { 
                const cns = this.child_nodes;
                const res = [];
                each(cns, cn => {
                    // if it the right node type?
                    if (cn.type === 'VariableDeclaration' || cn.type === 'ClassDeclaration') {
                        res.push(cn);
                    }
                });
                return res;
                //return babel_node; 
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        */

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