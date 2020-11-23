//const babel_node_tools = require('../babel/babel_node_tools');

const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Type_Variable_Declarator = require('./JS_AST_Node_6.3-Type_Variable_Declarator');

const enable_array_as_queryable = require('./query/enable_array_as_queryable');



// The QFM seems like it should be global, or relate to the root node.
//  Or a single one gets created once programmatically and the nodes use it.


class Query_Function_Map {
    constructor(spec) {

        const map_fns = new Map();
        const map_ngrams = new Map();

        const arr_fns = [];
        const arr_ngrams = [];

        const ngram_assign_fn = (single_word_term_name, fn) => {
            if (!map_fns.has(single_word_term_name)) {
                map_fns.set(single_word_term_name, fn);
            } else {
                throw 'Phrase "' + str_ngram + '" is already loaded for the word "' + single_word_term_name + '".';
            }
            return true;
        }

        const ngram_assign_term = (single_word_term_name, str_ngram) => {
            if (!map_ngrams.has(single_word_term_name)) {
                map_ngrams.set(str_ngram, single_word_term_name);
            } else {
                throw 'Phrase "' + str_ngram + '" is already loaded for the word "' + single_word_term_name + '".';
            }
            return true;
        }

        const ngrams = {
            assign: function() {
                const a = arguments;
                const al = a.length;
                if (al === 2) {
                    if (typeof a[0] === 'string' && typeof a[1] === 'string') {

                        const c0 = a[0].split(' ');
                        const c1 = a[1].split(' ');

                        if (c0.length > 1) {
                            throw 'stop';
                        }

                        return ngram_assign_term(a[0], a[1]);



                        //
                    } else {
                        throw 'stop';
                    }
                    //if (typeof a[1] === 'string' && typeof a[0] === 'function') {
                    //    return ngram_assign_term(a[1], a[0]);
                    //}
                } else {
                    throw 'NYI';
                }

            }
        };
        const functions = {
            assign: function() {
                const a = arguments;
                const al = a.length;
                if (al === 2) {
                    if (typeof a[0] === 'string' && typeof a[1] === 'function') {

                        const c0 = a[0].split(' ');
                        const c1 = a[1].split(' ');

                        if (c0.length > 1) {
                            throw 'stop';
                        }

                        return ngram_assign_fn(a[0], a[1]);



                        //
                    }
                    //if (typeof a[1] === 'string' && typeof a[0] === 'function') {
                    //    return ngram_assign_term(a[1], a[0]);
                    //}
                } else {
                    throw 'NYI';
                }

            }
        };

        this.get = str_ngram => {
            const term = map_ngrams.get(str_ngram);

            if (term) {
                const fn = map_fns.get(term);

                if (term) {
                    return term;
                } else {
                    throw 'stop';
                    // should not happen.
                }

            } else {
                console.log('term not found for ngram: "' + ngram + '".');
            }

        }

        //const ngram_functions = {};
        //const 


        // .ngrams.

    }
}




const create_query_execution_fn = (node, words) => {
    //console.log('words', words);

    const {
        deep_iterate,
        each_child_node, filter_each_child_node,
        find_node, filter_deep_iterate, filter_inner_deep_iterate, filter_child_nodes_by_type,
        select_all, select_child, select_inner,
        callmap_deep_iterate, signature_callmap_deep_iterate, callmap_child_nodes, signature_callmap_child_nodes
    } = node;

    // A Query_Processor object could be of use.
    //  Not right now though. Don't want too big an arch change as it works smoothly right now.
    //  Changes towards better abstraction could help.
    //   Not so sure about going full OO though. I like the quite simple way it works at the moment.
    //   Maybe a large index of phrase to function names.
    //    Then different modules could load phrases. Better automation of synonyms.
    //     This will effectively generate n-grams for the various different things that can be expressed, then look them up.
    //     At the moment I have a quite large number of n-grams listed, but it would also be nice to have it arranged so there could be index.ngram_count

    // Then there could be more / better systems to wrap some inner functions to present them in different ways to the query system.

    // the query system would also have a map of the function names (which are one word long) and have those functions loaded.

    // function.name property? would be sensible.

    // query_system.functions.assign({ })
    // query_system.ngrams.assign{ {select_all: ['select all nodes']} }

    // ngrams.assign(`multiline string assignments`)

    // Query_Function_Index
    //  not the whole system.








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

    // each_child_declarator

    const each_child_declarator = (callback) => filter_each_child_node(node => node.category === 'Declarator', callback);
    const each_child_objectproperty = callback => filter_each_child_node(node => node.type === 'ObjectProperty', callback);

    const each_child_variabledeclaration = callback => filter_each_child_node(node => node.type === 'VariableDeclaration', callback);

    const each_child_declaration = (callback) => filter_each_child_node(node => node.is_declaration, callback);
    const each_child_identifier = (callback) => filter_each_child_node(node => node.is_identifier, callback);

    // each_child_identifier

    const filter_each_child_node_by_signature = (signature, callback) => filter_each_child_node(node => node.signature === signature, callback);
    const filter_each_child_node_by_type = (type, callback) => filter_each_child_node(node => node.type === type, callback);

    // filter_each_child_variabledeclaration_node

    const filter_each_child_variabledeclaration_node = (filterer, callback) => each_child_variabledeclaration(node => {
        if (filterer(node)) callback(node);
    });

    const filter_each_child_node_by_category = (category, callback) => filter_each_child_node(node => node.category === category, callback);


    const select_child_node_by_signature = (signature) => {
        const res = [];
        filter_each_child_node_by_signature(signature, node => res.push(node));
        enable_array_as_queryable(res);
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

    const find_memberexpression = () => find_node_by_type('MemberExpression')


    const select_by_type = type => select_all(node => node.type === type);
    const select_by_type_abbreviation = t => select_all(node => node.t === t);
    const select_by_child_count = target_count => select_all(node => node.child.count === target_count);
    // select.child.by.first.child.type

    const select_child_by_first_child_type = target_child_type => select_child(node => {
        let res = false;

        if (node.child_nodes[0]) {
            if (node.child_nodes[0].type === target_child_type) res = true
        }

        return res;
    });

    // 
    const select_by_first_child_type = target_child_type => select_all(node => {
        let res = false;

        if (node.child_nodes[0]) {
            if (node.child_nodes[0].type === target_child_type) res = true
        }

        return res;
    });

    // select_by_child_count
    const select_by_category = category => select_all(node => node.category === category);

    const select_by_first_child_first_child_name = name => {
        return select_all(node => {
            
            const cn1 = node.child_nodes[0];
            let res = false;

            if (cn1) {
                const gcn1 = cn1.child_nodes[0];
                if (gcn1) {
                    const nn = gcn1.name;
                    if (nn !== undefined) {
                        if (nn === name) res = true;
                    }
                }
            }
            return res;

        });
    }


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
            if (node.id.name !== undefined) res.push(node.id.name);
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

    const collect_self_if_objectexpression = () => {
        const res = [];
        if (node.type === 'ObjectExpression') {
            res.push(node);
        }
        enable_array_as_queryable(res);
        return res;
    }

    // it's select if there is an if statement.
    /*

    const collect_self_if_signature_is = signature => collect_self_if(node => node.signature === signature);

    const collect_self_if = fn_check => {
        const res = [];
        console.log('2) node', node);
        if (fn_check(node)) {
            res.push(node);
        }
        console.log('res', res);
        enable_array_as_queryable(res);
        return res;
    }

    */

    const collect_declared_keys = () => {
        const res = [];
        if (node.is_declaration) {
            each(node.declaration.declared.keys, k => res.push(k));
        }
        enable_array_as_queryable(res);
        return res;
    }

    const collect_declaration_assigned_values = () => {
        const res = [];
        if (node.is_declaration) {
            const vals = declaration.assigned.values;
            each(vals, v => res.push(v));
        }
        return res;
    }

    const count_all_nodes = () => {
        let res = 0;
        deep_iterate(n => res++);
        return res;
    }

    const select_self = fn_check => {
        const res = [];
        //console.log('2) node', node);
        if (fn_check(node)) {
            res.push(node);
        }
        //console.log('res', res);
        enable_array_as_queryable(res);
        return res;
    }

    const select_self_if_signature_is = signature => select_self(node => node.signature === signature);

    // signature_callmap_deep_iterate

    if (sentence === 'callmap by signature' || sentence === 'callmap deep iterate by signature') {
        // not so sure about the query results for callmap....
        return (map_handlers, fn_default_handler) => {
            signature_callmap_deep_iterate(map_handlers, fn_default_handler);
        }
    }

    if (sentence === 'callmap' || sentence === 'callmap deep iterate') {
        // not so sure about the query results for callmap....

        return (fntostring, map_handlers, fn_default_handler) => {
            callmap_deep_iterate(fntostring, map_handlers, fn_default_handler);
        }

    }

    if (sentence === 'callmap child' || sentence === 'callmap child nodes') {
        // not so sure about the query results for callmap....

        return (fntostring, map_handlers, fn_default_handler) => {
            callmap_child_nodes(fntostring, map_handlers, fn_default_handler);
        }

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

    if (sentence === 'collect first child node' || sentence === 'collect first child') {

        return () => {
            const res = [];
            if (node.child_nodes[0]) res.push(node.child_nodes[0]);
            return res;
        }
    }

    if (sentence === 'collect child type' || sentence === 'collect child node type') {
        return () => {
            const res = [];
            each(node.child_nodes, cn => res.push(cn.type));
            return res;
        }
    }

    if (sentence === 'collect child t' || sentence === 'collect child node t' ||
        sentence === 'collect child abbreviated type' || sentence === 'collect child type abbreviation' ||
        sentence === 'collect child node abbreviated type' || sentence === 'collect child node type abbreviation') {
        return () => {
            const res = [];
            each(node.child_nodes, cn => res.push(cn.t));
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
            if (node.child_nodes[0]) {
                if (node.child_nodes[0].name) {
                    res.push(node.child_nodes[0].name);
                }
            }
            //enable_array_as_queryable(res);
            return res;
        }
    }

    // collect.child.value

    if (sentence === 'collect child value' || sentence === 'collect child node value') {
        return () => {
            const res = [];
            each(node.child_nodes, cn => {
                const v = cn.value;
                if (v !== undefined) {
                    res.push(v);
                }
            });
            //if (node.child_nodes[0]) res.push(node.child_nodes[0].value);


            //enable_array_as_queryable(res);
            return res;
        }
    }

    if (sentence === 'collect first child first child' || sentence === 'collect first child node first child node') {
        return () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[0] && node.child_nodes[0].child_nodes[0]) {
                res.push(node.child_nodes[0].child_nodes[0]);
            }
            enable_array_as_queryable(res);
            return res;
        }
    }

    if (sentence === 'collect first child second child' || sentence === 'collect first child node second child node') {
        return () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[0] && node.child_nodes[0].child_nodes[1]) {
                res.push(node.child_nodes[0].child_nodes[1]);
            }
            enable_array_as_queryable(res);
            return res;
        }
    }

    if (sentence === 'collect second child second child' || sentence === 'collect second child node second child node') {
        return () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[1] && node.child_nodes[1].child_nodes[1]) {
                res.push(node.child_nodes[1].child_nodes[1]);
            }
            enable_array_as_queryable(res);
            return res;
        }
    }

    if (sentence === 'collect first child first child name' || sentence === 'collect first child node first child name' || sentence === 'collect first child node first child node name') {
        return () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[0] && node.child_nodes[0].child_nodes[0]) {
                const n = node.child_nodes[0].child_nodes[0].name;
                if (n !== undefined) {
                    res.push(n);
                }
                //res.push(node.child_nodes[0].child_nodes[0]);
            }
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

    if (sentence === 'collect id name') {
        return collect_id_name;
    }

    const collect_child_variable_declarators = () => {
        return select_child_node_by_type('VariableDeclarator');
    }

    const collect_child_variable_declarations = () => select_child_node_by_type('VariableDeclaration');
    const collect_child_declarations = () => select_child_node_by_category('Declaration');

    // collect_child_variable_declarations
    const collect_child_literal = () => {
        return select_child_node_by_category('Literal');
    }

    // collect.child.variabledeclaration

    if (sentence === 'collect child variabledeclaration') {
        return collect_child_variable_declarations;
    }
    if (sentence === 'collect child declaration') {
        return collect_child_declarations;
    }

    if (sentence === 'collect child variabledeclarator') {
        return collect_child_variable_declarators;
    }
    if (sentence === 'collect child literal') {
        return collect_child_literal;
    }

    // or just key with all nouns being singular despite operating on plurals?
    if (sentence === 'collect own declared key' || sentence === 'collect own declaration declared key' ||
        sentence === 'collect own declared keys' || sentence === 'collect own declaration declared keys') {
        return collect_declared_keys;
    }

    // 

    if (sentence === 'collect self if objectexpression' || sentence === 'collect self if type objectexpression' || sentence === 'collect self if own type is objectexpression') {
        return collect_self_if_objectexpression;
    }

    if (sentence === 'collect self if signature' || sentence === 'collect self if signature is' || sentence === 'collect self if own signature is') {
        return collect_self_if_signature_is;
    }

    // 'collect', 'self', 'if', 'signature', 'is'



    if (sentence === 'collect own declaration assigned values' || sentence === 'collect own declaration assigned values') {
        return collect_declaration_assigned_values;
    }

    // .query.collect.own.declaration.assigned.value

    // collect.child.variabledeclarator

    if (sentence === 'collect name' || sentence === 'collect own name' || sentence === 'collect node name') {
        return () => [node.name];
    }

    if (sentence === 'collect value') {
        return () => {
            //node.babel.node
            console.log('node.babel.node', node.babel.node);
            //throw 'stop';

            const res = [];
            console.log('node.value', node.value);
            if (node.value) res.push(node.value);
            return res;
        };
    }


    if (sentence === 'collect pattern' || sentence === 'collect pattern node' || sentence === 'collect node with category pattern') {
        return collect_pattern_nodes;
    }
    if (sentence === 'collect property' || sentence === 'collect property node' || sentence === 'collect node with category property') {
        return collect_property_nodes;
    }

    if (sentence === 'count child node' || sentence === 'count child' || sentence === 'child count' || sentence === 'child node count') {
        return () => node.child_nodes.length;
    }

    if (sentence === 'count all' || sentence === 'count all node') {
        return count_all_nodes;
    }
    

    if (sentence === 'count identifier node' || sentence === 'count identifier' || sentence === 'identifier count' || sentence === 'identifier node count') {
        return count_identifier_nodes;
    }

    // counts...


    if (sentence === 'filter child node' || sentence === 'filter each child' || sentence === 'filter each child node') {
        return filter_each_child_node;
    } else {
        //throw 'NYI';
    }

    if (sentence === 'filter child variabledeclaration' || sentence === 'filter each child variabledeclaration' || sentence === 'filter each child variabledeclaration node') {
        return filter_each_child_variabledeclaration_node;
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
    }

    // filter child node by child count || filter child nodes by their child counts



    // filter.child.by.type

    if (sentence === 'each') {
        return callback => callback(node);
    }

    if (sentence === 'each child node' || sentence === 'each child') {
        return each_child_node;
    }

    // each.child.declarator

    // Declarator

    // each.child.variabledeclaration

    if (sentence === 'each child declarator node' || sentence === 'each child declarator') {
        return each_child_declarator;
    }
    if (sentence === 'each child objectproperty node' || sentence === 'each child objectproperty') {
        return each_child_objectproperty;
    } 

    if (sentence === 'each child variabledeclaration node' || sentence === 'each child variabledeclaration') {
        return each_child_variabledeclaration;
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

    if (sentence === 'find memberexpression node' || sentence === 'find memberexpression' ||
        sentence === 'find node of type memberexpression' || sentence === 'find node with type memberexpression' || 
        sentence === 'find node that has type memberexpression') {
        return find_memberexpression;
    }

    // find_memberexpression


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

    // select.by.child.count

    if (sentence === 'select by child count' || sentence === 'select by child node count' || sentence === 'select by number of child nodes') {
        return select_by_child_count;
    }


    // select_child_by_first_child_type

    if (sentence === 'select child by first child type' || sentence === 'select child node by first child node type') {
        return select_child_by_first_child_type;
    }

    if (sentence === 'select by first child type' || sentence === 'select by first child node type') {
        return select_by_first_child_type;
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

    // select node by first child first child name

    if (sentence === 'select by first child first child name' || sentence === 'select node by first child first child name') {
        return select_by_first_child_first_child_name;
    }

    if (sentence === 'select self' || sentence === 'select own node') {
        return select_self;
    }

    if (sentence === 'select self by signature' || sentence === 'select self if signature is' || sentence === 'select self if signature') {
        return select_self_if_signature_is;
    }

    // select_each_child_node_by_signature

    // .select.child.by.signature

    // first child identifier

    // each child identifier
    // each child declaration

}

//

const create_query = (node, words = []) => {

    // Can create all the query execution functions on startup?
    //  Cache them?


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