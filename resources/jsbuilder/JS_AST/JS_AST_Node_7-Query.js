//const babel_node_tools = require('../babel/babel_node_tools');

const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Type_Variable_Declarator = require('./JS_AST_Node_6.3-Type_Variable_Declarator');

const enable_array_as_queryable = require('./query/enable_array_as_queryable');


const create_query_execution_fn = (node, words) => {
    //console.log('words', words);

    const {
        deep_iterate,
        each_child_node, filter_each_child_node,
        find_node, filter_deep_iterate, filter_inner_deep_iterate, filter_child_nodes_by_type,
        select_all, select_child, select_inner
    } = node;

    /*


    this.select_all = select_all;
        this.select_child = select_child;
        this.select_inner = select_inner;

    this.filter = filter;
        this.filter_deep_iterate = filter_deep_iterate;
        this.filter_inner_deep_iterate = filter_inner_deep_iterate;
        this.filter_each_child_node = filter_each_child_node;
        this.filter_child_nodes_by_type = filter_child_nodes_by_type;

    */


    // find_child_identifier

    // Looks like more work is needed on the 'find' part of the .query system.

    // Does seem best to use some kind of OO parsing into a query object.
    //  That would then have the structure to support longer queries.


    // filter child node by type
    //  then the execution function has a single type parameter.

    // can have a variety of English sentences and match them up with the calls to do it.
    //  see that the Basic part makes the right functions to do many of these things.

    const sentence = words.join(' ');
    //console.log('sentence', sentence);

    // each.child.declaration.with.name
    // each.child.declaration.filter.by.name

    const each_child_declaration = (callback) => filter_each_child_node(node => node.is_declaration, callback);
    const each_child_identifier = (callback) => filter_each_child_node(node => node.is_identifier, callback);

    // each_child_identifier

    const filter_each_child_node_by_signature = (signature, callback) => filter_each_child_node(node => node.signature === signature, callback);
    const filter_each_child_node_by_type = (type, callback) => filter_each_child_node(node => node.type === type, callback);
    const filter_each_child_node_by_category = (category, callback) => filter_each_child_node(node => node.category === category, callback);


    const select_child_node_by_signature = (signature) => {
        const res = [];
        filter_each_child_node_by_signature(signature, node => res.push(node));
        return res;
    }

    const select_child_node_by_type = (type) => {
        const res = [];
        filter_each_child_node_by_type(type, node => res.push(node));
        enable_array_as_queryable(res);
        return res;
    }

    const select_child_node_by_category = (cateogry) => {
        const res = [];
        filter_each_child_node_by_category(cateogry, node => res.push(node));
        enable_array_as_queryable(res);
        return res;
    }

    // select_child_node_by_category

    const find_child_node = finder => {
        let res;
        each_child_node((cn, path, depth, stop) => {
            if (!res) if (finder(cn)) {
                res = cn;
                //stop();
            }
        })
        return res; 
    }

    const find_child_node_by_type = type => find_child_node(node => node.type === type);
    const find_child_identifier = () => find_child_node_by_type('Identifier');

    // collect child name

    const collect_child_name = () => {
        const res = [];
        each_child_node(node => {
            if (node.name !== undefined) res.push(node.name);
        })
        return res;
    }

    const find_node_by_type = type => find_node(node => node.type === type);

    /*


    const find_node = (fn_match) => {
            let res;
            deep_iterate((js_ast_node, path, depth, stop) => {
                if (fn_match(js_ast_node)) {
                    if (!res) res = js_ast_node;
                    stop();
                    
                }
            });
            return res;
        };

    */

    const select_by_type = type => select_all(node => node.type === type);
    const select_by_type_abbreviation = t => select_all(node => node.t === t);
    const select_by_category = category => select_all(node => node.category === category);


    const collect_objectproperty_nodes = () => select_by_type('ObjectProperty');
    const collect_identifier_nodes = () => select_by_type('Identifier');
    const collect_pattern_nodes = () => select_by_category('Pattern');
    const collect_expression_nodes = () => select_by_category('Expression');
    const collect_property_nodes = () => select_by_category('Property');
    // collect_property_nodes

    const collect_child_identifier_nodes = () => select_child(node => node.is_identifier);

    const collect_id_name = () => {
        const res = [];
        if (node.id) {
            res.push(node.id.name);
        }
        return res;
    }

    const collect_child_identifier_name = () => {
        const res = [];

        filter_each_child_node_by_type('Identifier', node => {
            res.push(node.name);
        })
        return res;
    }
    const collect_child_node_signature = () => {
        const res = [];
        each_child_node(node => {
            res.push(node.signature);
        })
        return res;
    }
    const count_identifier_nodes = () => {
        let res = 0;
        deep_iterate(node => {
            if (node.is_identifier) res++;
        })
        return res;
    }

    

    if (sentence === 'collect child node' || sentence === 'collect child') {



        return () => {
            const res = [];
            each(node.child_nodes, cn => res.push(cn));


            enable_array_as_queryable(res);
            return res;
        }
    } else {
        //throw 'NYI';
    }

    if (sentence === 'collect child type' || sentence === 'collect child node type') {
        return () => {
            const res = [];
            each(node.child_nodes, cn => res.push(cn.type));
            return res;
        }
    }

    if (sentence === 'collect child category' || sentence === 'collect child node category') {
        return () => {
            const res = [];
            each(node.child_nodes, cn => res.push(cn.category));
            return res;
        }
    }
    if (sentence === 'collect child count' || sentence === 'collect child node count') {
        return () => [node.child_nodes.length];
    }

    if (sentence === 'collect first child node' || sentence === 'collect first child') {
        return () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[0]) res.push(node.child_nodes[0]);
            enable_array_as_queryable(res);
            return res;
        }
    }

    if (sentence === 'collect first child name' || sentence === 'collect first child node name') {
        return () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[0]) res.push(node.child_nodes[0].name);
            //enable_array_as_queryable(res);
            return res;
        }
    }
    if (sentence === 'collect first child value' || sentence === 'collect first child node value') {
        return () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[0]) res.push(node.child_nodes[0].value);
            //enable_array_as_queryable(res);
            return res;
        }
    }
    if (sentence === 'collect second child node' || sentence === 'collect second child') {
        return () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[1]) res.push(node.child_nodes[1]);
            enable_array_as_queryable(res);
            return res;
        }
    }
    if (sentence === 'collect third child node' || sentence === 'collect third child') {
        return () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[2]) res.push(node.child_nodes[2]);
            enable_array_as_queryable(res);
            return res;
        }
    }

    if (sentence === 'collect child node name' || sentence === 'collect child name') {
        return collect_child_name;
    } else {
        //throw 'NYI';
    }

    // collect_child_identifier_nodes

    if (sentence === 'collect identifier' || sentence === 'collect identifier node') {
        return collect_identifier_nodes;
    }
    if (sentence === 'collect expression' || sentence === 'collect expression node') {
        return collect_expression_nodes;
    }

    if (sentence === 'collect objectproperty' || sentence === 'collect objectproperty node') {
        return collect_objectproperty_nodes;
    }

    // collect_expression_nodes

    // collect child signature.

    

    if (sentence === 'collect child signature' || sentence === 'collect child node signature' || 
        sentence === 'collect each child signature' || sentence === 'collect each child node signature') {
        return collect_child_node_signature;
    } else {
        //throw 'NYI';
    }


    if (sentence === 'collect child identifier' || sentence === 'collect child node identifier node') {
        return collect_child_identifier_nodes;
    } else {
        //throw 'NYI';
    }

    if (sentence === 'collect child identifier name' || sentence === 'collect child node identifier name') {
        return collect_child_identifier_name;
    } else {
        //throw 'NYI';
    }

    if (sentence === 'collect id name' || sentence === 'collect id name') {
        return collect_id_name;
    } else {
        //throw 'NYI';
    }

    const collect_child_variable_declarators = () => {
        return select_child_node_by_type('VariableDeclarator');
    }
    const collect_child_literal = () => {
        return select_child_node_by_category('Literal');
    }

    if (sentence === 'collect child variabledeclarator') {
        return collect_child_variable_declarators;
    }
    if (sentence === 'collect child literal') {
        return collect_child_literal;
    }

    // collect.child.variabledeclarator

    if (sentence === 'collect name') {
        return () => [node.name];
    } else {
        //throw 'NYI';
    }


    if (sentence === 'collect pattern' || sentence === 'collect pattern node' || sentence === 'collect node with category pattern') {
        return collect_pattern_nodes;
    } else {
        //throw 'NYI';
    }
    if (sentence === 'collect property' || sentence === 'collect property node' || sentence === 'collect node with category property') {
        return collect_property_nodes;
    } else {
        //throw 'NYI';
    }

    if (sentence === 'count child node' || sentence === 'count child' || sentence === 'child count' || sentence === 'child node count') {
        return () => node.child_nodes.length;
    } else {
        //throw 'NYI';
    }

    


    if (sentence === 'count identifier node' || sentence === 'count identifier' || sentence === 'identifier count' || sentence === 'identifier node count') {
        return count_identifier_nodes;
    } else {
        //throw 'NYI';
    }

    // counts...


    if (sentence === 'filter child node' || sentence === 'filter each child' || sentence === 'filter each child node') {
        return filter_each_child_node;
    } else {
        //throw 'NYI';
    }

    if (sentence === 'filter child node by signature' || sentence === 'filter each child by signature' || sentence === 'filter each child node by signature') {
        return filter_each_child_node_by_signature;
    } else {
        //throw 'NYI';
    }

    if (sentence === 'filter child node by type' || sentence === 'filter each child by type' || sentence === 'filter each child node by type') {
        return filter_each_child_node_by_type;
    } else {
        //throw 'NYI';
    }



    // filter.child.by.type

    if (sentence === 'each child node' || sentence === 'each child') {
        return each_child_node;
    } 

    if (sentence === 'each child declaration node' || sentence === 'each child declaration') {
        return each_child_declaration;
    } 

    if (sentence === 'each child identifier node' || sentence === 'each child identifier') {
        return each_child_identifier;
    } 

    // parse it to the nth child general case....
    if (sentence === 'first child node' || sentence === 'first child') {
        return () => node.child_nodes[0];
    } 

    if (sentence === 'find node' || sentence === 'find') {
        return find_node;
    }


    if (sentence === 'find child identifier' || sentence === 'find a childnode which is an identifier too') {
        return find_child_identifier;
    }

    // find.by.type

    // find_node_by_type

    if (sentence === 'find node by type' || sentence === 'find by type') {
        return find_node_by_type;
    }



    // filter_deep_iterate

    if (sentence === 'filter node' || sentence === 'filter' || sentence === 'filter all node' || sentence === 'deep filter') {
        return filter_deep_iterate;
    }

    // filter.child.by.type

    // filter_inner_deep_iterate

    if (sentence === 'filter inner node' || sentence === 'filter inner' || sentence === 'inner filter' || sentence === 'filter inner node' || sentence === 'deep inner filter') {
        return filter_inner_deep_iterate;
    }


    if (sentence === 'second child node' || sentence === 'second child') {
        return () => node.child_nodes[1];
    } 

    if (sentence === 'name' || sentence === 'node name') {
        return () => node.name;
    } 

    // select_child

    if (sentence === 'select by type') {
        return select_by_type;
    }

    if (sentence === 'select by t' || sentence === 'select by type abbreviation' || sentence === 'select by abbreviated type') {
        return select_by_type_abbreviation;
    }

    // select_by_type_abbreviation

    if (sentence === 'select child node' || sentence === 'select child') {
        return select_child;
    }

    if (sentence === 'select child node by signature' || sentence === 'select child by signature') {
        return select_child_node_by_signature;
    }

    if (sentence === 'select by category' || sentence === 'select node by category') {
        return select_by_category;
    }

    // select_each_child_node_by_signature

    // .select.child.by.signature

    // first child identifier

    // each child identifier
    // each child declaration



    


}

//

const create_query = (node, words = []) => {



    const res = {
        //message1: "hello",
        //message2: "everyone"
    };
    
    const handler2 = {
        get: function(target, prop, receiver) {

            //console.log('target', target);
            //console.log('prop', prop);
            //console.log('receiver', receiver);

            //console.log('target === res', target === res);

            if (target === res) {

                if (prop === 'exe') {

                    //throw 'stop';

                    return create_query_execution_fn(node, words);

                    //throw 'NYI'

                    // return the execution function.



                } else if (prop === 'qstring') {
                    return words.join('.');
                } else {
                    words.push(prop);
                    return create_query(node, words);
                }

            } else {
                throw 'stop';
            }

            

            //throw 'NYI';
        }
    };
    
    const proxy2 = new Proxy(res, handler2);

    return proxy2;
}







class JS_AST_Node_Query extends JS_AST_Node_Type_Variable_Declarator {
    constructor(spec = {}) {
        super(spec);

        // query property.

        // but each time provide a new query object.

        //let query;
        Object.defineProperty(this, 'query', {
            get() { 
                return create_query(this);
            },
            enumerable: true,
            configurable: false
        });
        

        this.query_with_words = arr_words => {
            const q = create_query(this, arr_words);
            return q;
        }


        
    }
}

module.exports = JS_AST_Node_Query;