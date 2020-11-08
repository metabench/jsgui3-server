const {each} = require('lang-mini');
const babel_node_tools = require('../babel/babel_node_tools');

// Possibly able to manage a source babel node and different resultant transformations.

const {
    /*
    iterate_babel_binary_expression_node,
    iterate_babel_unary_expression_node,
    iterate_babel_identifier_node,
    iterate_babel_string_literal_node,
    iterate_babel_variable_declaration_node,
    iterate_babel_arrow_function_expression_node,
    iterate_babel_block_statement_node,
    iterate_babel_if_statement_node,
    iterate_babel_return_statement_node,
    iterate_babel_object_expression_node,
    iterate_babel_member_expression_node,
    iterate_babel_function_expression_node,
    iterate_babel_logical_expression_node,
    iterate_babel_variable_declarator_node,
    iterate_babel_expression_statement_node,
    iterate_babel_assignment_expression_node,
    iterate_babel_array_expression_node,
    iterate_babel_for_statement_node,
    iterate_babel_numeric_literal_node,
    iterate_babel_update_expression_node,
    iterate_babel_new_expression_node,
    iterate_babel_empty_statement_node,
    iterate_babel_null_literal_node,
    iterate_babel_boolean_literal_node,
    iterate_babel_throw_statement_node,
    iterate_babel_assignment_pattern_node,
    iterate_babel_while_statement_node,
    iterate_babel_object_pattern_node,
    iterate_babel_class_declaration_node,
    iterate_babel_class_body_node,
    iterate_babel_class_method_node,
    */
    iterate_babel_node,
    //iterate_babel_child_nodes,

    get_identifier_names,

    get_babel_child_nodes,

    get_require_call
} = babel_node_tools;

// For the moment, do more concerning getting the basic info.
//  Don't do the signature system yet - it's too complex when done fully.
//  Work on getting the info about what is required.
//   In more of a concice fp way.


// Iterator and generator would be better?
//  Maybe have it attached to a child_nodes object.

class JS_AST_Node {

    // Currently they don't maintain themselves in an equivalent tree, and are very disposable.
    //  Try it that way for the moment.



    constructor(spec = {}) {
        let babel_node, full_source;

        const map_transformed_babel_nodes = {}; //transformed versions.

        // iterate through it, coming up with abbreviated aliases for any local variable names longer than...

        // Or work for the moment with aliases within the scope.
        //  May be better to give this some specific code samples to try with.


        if (spec.babel_node) {
            babel_node = spec.babel_node;
        }
        if (spec.full_source) {
            full_source = spec.full_source;
        }
        Object.defineProperty(this, 'type', {
            get() { return babel_node.type; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'start', {
            get() { return babel_node.start; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'end', {
            get() { return babel_node.end; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'full_source', {
            get() { return full_source; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'source', {
            get() { return full_source.substring(this.start, this.end); },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        /*
        Object.defineProperty(this, 'source', {
            get() { return str_source; },
            //set(newValue) { bValue = newValue; },
            enumerable: false,
            configurable: false
        });
        Object.defineProperty(this, 'str_source', {
            get() { return str_source; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        */
        Object.defineProperty(this, 'babel_node', {
            get() { return babel_node; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // a child_nodes property.

        // an each_child and each_child_node function

        // each_child_node function
        // filter_each_child_node function

        //let bcns;

        // each_inner_node function
        // filter_each_inner_node function.

        



        Object.defineProperty(this, 'child_nodes', {
            get() { 

                throw 'stop'; // Need to be able to access the babel child nodes properly.
                // Seems like fixing / changing / making new babel iteration functions makes sense.

                // each_babel_child_node could work better.

                //bcns = bcns || get_babel_child_nodes(babel_node, full_source);

                const res = [];

                // A function that gets the babel child nodes would be useful.
                //  Or iterates through them.
                //   The current iteration goes in depth recursively.

                // each_babel_child_node would be simple, don't have it yet.
                //  change iterate to deep_iterate?






                //each_babel_child_node(babel_node, full_source, bcn => res.push(new JS_AST_Node({babel_node: bcn, full_source: full_source})));

                //const bcns = bcns || get_babel_child_nodes(babel_node, full_source);
                //console.log('bcns.length', bcns.length);
                
                //each(bcns, bcn => res.push(new JS_AST_Node({babel_node: bcn, full_source: full_source})));


                return res;
                //return babel_node; 
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'is_declaration', {
            get() { 
                return this.type === 'VariableDeclaration' || this.type === 'ClassDeclaration';
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'own_declaration_names', {
            get() { 
                if(this.is_declaration) {
                    const res = [];
                    //console.log('babel_node', babel_node);

                    each(babel_node.declarations, declaration => {
                        res.push(declaration.id.name);
                    });
                    //throw 'stop'
                    return res;
                }
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'inner_declaration_names', {
            get() { 
                const res = []; const tm = {};
                filter_each_inner_node(node => node.is_declaration, node => {
                    const dec_names = node.own_declaration_names;
                    //console.log('dec_names', dec_names);
                    each(dec_names, dn => {
                        if (!tm[dn]) {
                            res.push(dn);
                            tm[dn] = true;
                        }
                    })
                })
                return res;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        /*
        Object.defineProperty(this, 'all_declaration_names', {
            get() { 

                // do an iteration of self and children.




                // includes own declaration names
                

                if(this.is_declaration) {
                    const res = [];
                    //console.log('babel_node', babel_node);

                    each(babel_node.declarations, declaration => {
                        res.push(declaration.id.name);
                    })

                    //throw 'stop'
                    return res;
                }
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        */





        // inner_declaration_names


        // nested declaration names?

        // all declaration names?



        // child_declaration_names property


        // .own_declaration_names
        //  a property which has got names of what is declared when relevant.




        // a property that gets the variable names declared in local scope.

        //  child variable names?
        //  variable names defined within the function?

        //  variable names defined anywhere within?




        // with the locally scoped variable names we could rename them.



        // and an array of names of what is declared?
        // or check if it's a single declaration first?



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


        /*
        const iterate = callback => {
            let stopped = false;
            const stop = () => stopped = true;

            callback(this, stop);

            if (!stopped) {
                const cns = this.child_nodes;
                each(cns, (child_node, stop2) => {
                    child_node.iterate(callback);
                })
            }
        }
        this.iterate = iterate;

        const iterate_inner = callback => {
            iterate((node, stop) => {
                if (node !== this) callback(node, stop);
            })
        }
        this.iterate_inner = iterate_inner;

        Object.defineProperty(this, 'inner_declarations', {
            get() { 
                console.log('get inner_declarations');
                const res = [];
                iterate_inner(inner_node => {
                    // if it the right node type?
                    //console.log('inner_node', inner_node);

                    if (inner_node.type === 'VariableDeclaration' || inner_node.type === 'ClassDeclaration') {
                        res.push(inner_node);
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

        /*

        const iterate = this.iterate = (callback) => {
            let stopped = false;
            const stop = () => stopped = true;
            callback(this, stop);
            if (!stopped) {
                each(this.child_nodes, (child_node) => {
                    if (!stopped) {
                        iterate(callback);
                    }
                })
            }
        }
        */

        const each_inner_node = (callback) => {
            iterate_babel_node(babel_node, full_source, bcn => {

                if (bcn !== babel_node) {
                    const cn = new JS_AST_Node({babel_node: bcn, full_source: full_source});
                    callback(cn);
                }
                

                //cn.each_inner_node(n2 => {
                //    callback(n2);
                //})


            });
        }
        this.each_inner_node = each_inner_node;

        const filter_each_inner_node = (filter, callback) => {
            each_inner_node((node) => {
                if (filter(node)) {
                    callback(node);
                }
            })
        }
        this.filter_each_inner_node = filter_each_inner_node;

        this.count_nodes = () => {
            let c = 0;
            iterate_babel_node(babel_node, full_source, (babel_node) => {
                //console.log('cb babel_node', babel_node);
                c++;
            });
            return c;
        }

        // Could try renaming local variables within this.

        /*

        this.get_variable_names = () => {
            throw 'NYI';
            const map_names = {}, arr_names = [];

            iterate_babel_node(babel_node, str_source, (babel_node) => {
                console.log('get_variable_names cb babel_node', babel_node);
                //c++;
            });
        }
        */

        this.get_identifier_names = () => get_identifier_names(babel_node);

        

        // counts of different statement types inside would help to an extent.
        // finding renamable local variables.
        // variables that are defined not within the root scope
        // not going to be exported.

        // Many ways of attacking this problem.

        // Tables of variable names
        //  In the original version
        //  Then renamed using aliases.
        //   Possible abbreviated renaming scheme.

        // Focus specifically on interpreting and reading the files and structures needed to build jsgui client.

    }
}

module.exports = JS_AST_Node;