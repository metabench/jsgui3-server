// const babel_node_tools = require('../babel/babel_node_tools');

const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Type_Variable_Declarator = require('./JS_AST_Node_6.3-Type_Variable_Declarator');

const enable_array_as_queryable = require('./query/enable_array_as_queryable');



// The QFM seems like it should be global, or relate to the root node.
//  Or a single one gets created once programmatically and the nodes use it.


// Right now though, the functions apply to that node.
//  Seems like functions will need rewriting to apply in a general case to any node.
//   Likely worth doing that later on...?

// This index will need to provide functions relevant to the node - so it will have to be per node.
//  Possibly / always it will have preloaded ngrams though.

// For the moment, get it working. The functions were always declared within the context of the node they operate in and its been convenient in many ways, maybe essential in some.

// later on, the index could at least know the name of the function to call, so could call the function of the specific node.




class Query_Function_Map {
    constructor(spec) {

        const map_fns = new Map();
        const map_ngrams = new Map();

        const arr_fns = [];
        const arr_ngrams = [];

        const ngram_assign_fn = (single_word_term_name, fn) => {
            if (!map_fns.has(single_word_term_name)) {
                map_fns.set(single_word_term_name, fn);
                arr_fns.push(fn);
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
                    } else {
                        if (typeof a[0] === 'string' && Array.isArray(a[1])) {
                            each(a[1], item => ngrams.assign(a[0], item));
                        } else {
                            throw 'stop';
                        }
                        //
                    }
                    //if (typeof a[1] === 'string' && typeof a[0] === 'function') {
                    //    return ngram_assign_term(a[1], a[0]);
                    //}
                } else {

                    if (al === 1) {
                        if (typeof a[0] === 'object') {

                            if (!Array.isArray(a[0])) {
                                const o = a[0];
                                each(o, (value, key) => {
                                    ngrams.assign(key, value);
                                })
                            } else {
                                throw 'stop';
                            }

                        }
                    } else {
                        throw 'stop';
                    }
                    //throw 'NYI';
                }
            }
        };

        
        Object.defineProperty(ngrams, 'list', {
            get() { 
                return Array.from(map_ngrams.keys()).sort();
            },
            enumerable: true,
            configurable: false
        });
        const functions = {
            //count: () => arr_fns.length,
            assign: function() {
                const a = arguments;
                const al = a.length;
                if (al === 2) {
                    if (typeof a[0] === 'string' && typeof a[1] === 'function') {

                        const c0 = a[0].split(' ');
                        //const c1 = a[1].split(' ');
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
                    if (al === 1) {
                        //throw 'NYI';

                        if (Array.isArray(a[0])) {
                            each(a[0], fn => functions.assign(fn));
                        }

                        if (typeof a[0] === 'function') {
                            const n = a[0].name;
                            if (n !== undefined) {
                                return functions.assign(n, a[0]);
                            } else {
                                throw 'Must provide a function name if the function does not already have it as its property.'
                            }
                        }
                    } else {
                        throw 'stop';
                    }
                }
            }
        };

        Object.defineProperty(functions, 'count', {
            get() { 
                return arr_fns.length;
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(functions, 'names', {
            get() { 
                return Array.from(map_fns.keys()).sort();
            },
            enumerable: true,
            configurable: false
        });

        // map_fns

        this.get = str_ngram => {
            const term = map_ngrams.get(str_ngram);
            if (term) {
                const fn = map_fns.get(term);

                if (fn) {
                    return fn;
                } else {
                    console.log('term', term);
                    console.trace();
                    throw 'stop';
                    // should not happen.
                }

            } else {
                console.log('term not found for ngram: "' + str_ngram + '".');
            }
        }

        Object.defineProperty(this, 'ngrams', {
            get() { 
                return ngrams;
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'functions', {
            get() { 
                return functions;
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'fns', {
            get() { 
                return functions;
            },
            enumerable: true,
            configurable: false
        });
    }
}

const assign_node_ngrams = (qfm) => {

    qfm.ngrams.assign({
        signature_callmap_deep_iterate: ['callmap by signature', 'callmap deep iterate by signature'],
        callmap_deep_iterate: ['callmap', 'callmap deep iterate'],
        callmap_child_nodes: ['callmap child', 'callmap child node'],
        collect_child_nodes: ['collect child node', 'collect child'],
        collect_first_child_node: ['collect first child node', 'collect first child'],
        collect_child_type: ['collect child type', 'collect child node type'],
        collect_child_abbreviated_type: ['collect child t', 'collect child node t', 'collect child abbreviated type', 'collect child type abbreviation', 'collect child node abbreviated type', 'collect child node type abbreviation'],
        collect_child_category: ['collect child category', 'collect child node category'],
        collect_child_count: ['collect child count', 'collect child node count'],
        collect_first_child_name: ['collect first child name', 'collect first child node name'],
        collect_child_value: ['collect child value', 'collect child node value'],
        collect_first_child_first_child: ['collect first child first child', 'collect first child node first child node'],
        collect_first_child_second_child: ['collect first child second child', 'collect first child node second child node'],
        collect_second_child_first_child: ['collect second child first child', 'collect second child node first child node'],
        collect_second_child_second_child: ['collect second child second child', 'collect second child node second child node'],
        collect_first_child_first_child_name: ['collect first child first child name', 'collect first child node first child name', 'collect first child node first child node name'],
        collect_first_child_value: ['collect first child value', 'collect first child node value'],
        collect_second_child_node: ['collect second child node', 'collect second child'],
        collect_third_child_node: ['collect third child node', 'collect third child'],
        collect_child_name: ['collect child node name', 'collect child name'],
        collect_identifier_nodes: ['collect identifier', 'collect identifier node'],
        collect_expression_nodes: ['collect expression', 'collect expression node'],
        collect_objectproperty_nodes: ['collect objectproperty', 'collect objectproperty node'],
        collect_child_node_signature: ['collect child signature', 'collect child node signature', 'collect each child signature', 'collect each child node signature'],
        collect_child_identifier_nodes: ['collect child identifier', 'collect child node identifier node'],
        collect_child_identifier_name: ['collect child identifier name', 'collect child node identifier name'],
        collect_id_name: ['collect id name'],
        collect_child_variable_declarations: ['collect child variabledeclaration'],
        collect_child_declarations: ['collect child declaration'],
        collect_child_variable_declarators: ['collect child variabledeclarator'],
        collect_child_literal: ['collect child literal'],
        collect_declared_keys: ['collect own declared key','collect own declaration declared key', 'collect own declared keys', 'collect own declaration declared keys'],
        collect_self_if_objectexpression: ['collect self if objectexpression', 'collect self if type objectexpression', 'collect self if own type is objectexpression'],
        //collect_declaration_assigned_values: ['collect own declaration assigned values', 'collect own declaration assigned values'],
        collect_name: ['collect name', 'collect own name', 'collect node name'],
        collect_value: ['collect value', 'collect own value', 'collect node value'],
        collect_pattern_nodes: ['collect pattern', 'collect pattern node', 'collect node with category pattern'],
        collect_property_nodes: ['collect property', 'collect property node', 'collect node with category property'],
        count_child_nodes: ['count child node', 'count child', 'child count', 'child node count'],
        count_all_nodes: ['count all', 'count all node'],
        count_identifier_nodes: ['count identifier node', 'count identifier'],

        each_first_child: ['each first child', 'each first child node'],
        //each_child_node: ['each child', 'each child node'],

        filter_each_child_node: ['filter child node', 'filter each child', 'filter each child node'],

        filter_each_child_variabledeclaration_node: ['filter child variabledeclaration', 'filter child variabledeclaration node', 'filter each child variabledeclaration', 'filter each child variabledeclaration node'],
        filter_each_child_node_by_signature: ['filter child node by signature', 'filter each child by signature', 'filter each child node by signature'],
        filter_each_child_node_by_type: ['filter child node by type', 'filter each child by type', 'filter each child node by type'],
        each_child_node: ['each child node', 'each child'],
        each_child_declarator: ['each child declarator node', 'each child declarator'],
        each_child_objectproperty: ['each child objectproperty node', 'each child objectproperty'],
        each_child_variabledeclaration: ['each child variabledeclaration node', 'each child variabledeclaration'],
        each_child_declaration: ['each child declaration node', 'each child declaration'],
        each_child_identifier: ['each child identifier node', 'each child identifier'],
        find_node: ['find node', 'find'],
        find_memberexpression: ['find memberexpression node', 'find memberexpression'],
        find_child_identifier: ['find child identifier', 'find a childnode which is an identifier too'],
        find_node_by_type: ['find node by type', 'find by type'],
        filter_deep_iterate: ['filter node', 'filter', 'filter all node'],
        filter_inner_deep_iterate: ['filter inner node', 'filter inner', 'inner filter', 'filter inner node'],
        select_by_type: ['select by type'],
        select_by_type_abbreviation: ['select by t', 'select by type abbreviation', 'select by abbreviated type'],
        select_by_child_count: ['select by child count', 'select by child node count', 'select by number of child nodes'],
        select_child_by_first_child_type: ['select child by first child type', 'select child node by first child node type'],
        select_by_first_child_type: ['select by first child type', 'select by first child node type'],
        select_child: ['select child node', 'select child'],
        select_child_node_by_signature: ['select child node by signature', 'select child by signature'],
        select_by_category: ['select by category',  'select node by category'],
        select_by_first_child_first_child_name: ['select by first child first child name', 'select node by first child first child name'],
        select_self: ['select self', 'select own node'],
        select_self_if_signature_is: ['select self by signature', 'select self if signature is', 'select self if signature']
    })
}


const create_query_execution_fn = (node, words) => {
    //console.log('words', words);

    const {
        deep_iterate,
        filter_each_child_node,
        find_node, filter_deep_iterate, filter_inner_deep_iterate, filter_child_nodes_by_type,
        select_all, select_child, select_inner,
        callmap_deep_iterate, signature_callmap_deep_iterate, callmap_child_nodes, signature_callmap_child_nodes
    } = node;

    const sentence = words.join(' ');


    const qfm = new Query_Function_Map();

    

    //console.log('qfm.fns.count', qfm.fns.count);
    //console.log('qfm.fns.names', qfm.fns.names.sort());
    // signature_callmap_deep_iterate

    const apply_functions = () => {


        const each_child_declarator = (callback) => filter_each_child_node(node => node.category === 'Declarator', callback);
        const each_child_objectproperty = callback => filter_each_child_node(node => node.type === 'ObjectProperty', callback);
        const each_child_variabledeclaration = callback => filter_each_child_node(node => node.type === 'VariableDeclaration', callback);
        const each_child_declaration = (callback) => filter_each_child_node(node => node.is_declaration, callback);
        const each_child_identifier = (callback) => filter_each_child_node(node => node.is_identifier, callback);
        const filter_each_child_node_by_signature = (signature, callback) => filter_each_child_node(node => node.signature === signature, callback);
        const filter_each_child_node_by_type = (type, callback) => filter_each_child_node(node => node.type === type, callback);
        const filter_each_child_variabledeclaration_node = (filterer, callback) => each_child_variabledeclaration(node => {
            if (filterer(node)) callback(node);
        });
        const filter_each_child_node_by_category = (category, callback) => filter_each_child_node(node => node.category === category, callback);

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
        const find_node_by_type = type => find_node(node => node.type === type);
        const find_memberexpression = () => find_node_by_type('MemberExpression')

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

        const collect_child_name = () => {
            const res = [];
            each_child_node(node => {
                if (node.name !== undefined) res.push(node.name);
            })
            return res;
        }
        const collect_id_name = () => { //looks deeper for an identifier, though in the right cases that identifier is a property of its parent (like in Babel)
            const res = [];
            if (node.id) {
                if (node.id.name !== undefined) res.push(node.id.name);
            }
            return res;
        } // identifiers that are child nodes
        const collect_child_identifier_name = () => {
            const res = [];
            filter_each_child_node_by_type('Identifier', node => {
                res.push(node.name);
            })
            return res;
        }

        const collect_objectproperty_nodes = () => select_by_type('ObjectProperty');
        const collect_identifier_nodes = () => select_by_type('Identifier');
        const collect_pattern_nodes = () => select_by_category('Pattern');
        const collect_expression_nodes = () => select_by_category('Expression');
        const collect_property_nodes = () => select_by_category('Property');
        const collect_child_identifier_nodes = () => select_child(node => node.is_identifier);
        
        const collect_child_node_signature = () => {
            const res = [];
            each_child_node(node => {
                res.push(node.signature);
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
        const collect_child_variable_declarators = () => {
            return select_child_node_by_type('VariableDeclarator');
        }

        const collect_child_variable_declarations = () => select_child_node_by_type('VariableDeclaration');
        const collect_child_declarations = () => select_child_node_by_category('Declaration');

        // collect_child_variable_declarations
        const collect_child_literal = () => {
            return select_child_node_by_category('Literal');
        }
        
        const count_identifier_nodes = () => {
            let res = 0;
            deep_iterate(node => {
                if (node.is_identifier) res++;
            })
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

        const each_first_child = (callback) => {
            if (node.child_nodes[0]) callback(node.child_nodes[0]); 
        }
        const each_child_node = (callback) => {
            //let idx = 0;
            let c = 0;
            const cns = node.child_nodes;
            const l = cns.length;
            for (c = 0; c < l; c++) {
                callback(cns[c], c);
            }
        }
        qfm.fns.assign('each_child_declarator', each_child_declarator);
        qfm.fns.assign(each_child_objectproperty);
        qfm.fns.assign(each_child_variabledeclaration);
        qfm.fns.assign(each_child_declaration);
        qfm.fns.assign([each_child_identifier]);
        qfm.fns.assign([
            each_first_child, each_child_node,
            filter_each_child_node_by_signature, filter_each_child_node_by_type,
            filter_each_child_variabledeclaration_node, filter_each_child_node_by_category
        ]);
        qfm.fns.assign([
            select_child_node_by_signature, select_child_node_by_type,
            select_child_node_by_category
        
        ]);
        qfm.fns.assign([
            find_child_node, find_child_node_by_type,
            find_child_identifier, find_node_by_type, find_memberexpression
        
        ]);
        qfm.fns.assign([
            select_by_type, select_by_type_abbreviation,
            select_by_child_count, select_child_by_first_child_type, select_by_first_child_type, select_by_category, select_by_first_child_first_child_name
        ]);
        qfm.fns.assign([
            collect_child_name, collect_id_name,
            collect_child_identifier_name, 
            collect_objectproperty_nodes, collect_identifier_nodes, collect_pattern_nodes, collect_expression_nodes, collect_property_nodes, collect_child_identifier_nodes
        ]);

        qfm.fns.assign([
            collect_child_node_signature, collect_self_if_objectexpression, collect_declared_keys,
            collect_declaration_assigned_values, collect_child_variable_declarators, collect_child_variable_declarations,
            collect_child_declarations, collect_child_literal
        ]);

        const collect_child_nodes = () => {
            const res = [];
            each(node.child_nodes, cn => res.push(cn));
            enable_array_as_queryable(res);
            return res;
        }
        const collect_first_child_node = () => {
            const res = [];
            if (node.child_nodes[0]) res.push(node.child_nodes[0]);
            return res;
        }
        const collect_child_type = () => {
            const res = [];
            each(node.child_nodes, cn => res.push(cn.type));
            return res;
        }
        const collect_child_abbreviated_type = () => {
            const res = [];
            each(node.child_nodes, cn => res.push(cn.t));
            return res;
        }
        const collect_child_category = () => {
            const res = [];
            each(node.child_nodes, cn => res.push(cn.category));
            return res;
        }

        const collect_child_count = () => [node.child_nodes.length];

        const collect_first_child_name = () => {
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

        const collect_child_value = () => {
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

        const collect_first_child_first_child = () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[0] && node.child_nodes[0].child_nodes[0]) {
                res.push(node.child_nodes[0].child_nodes[0]);
            }
            enable_array_as_queryable(res);
            return res;
        }

        const collect_first_child_second_child = () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[0] && node.child_nodes[0].child_nodes[1]) {
                res.push(node.child_nodes[0].child_nodes[1]);
            }
            enable_array_as_queryable(res);
            return res;
        }

        const collect_second_child_first_child = () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[1] && node.child_nodes[1].child_nodes[0]) {
                res.push(node.child_nodes[1].child_nodes[0]);
            }
            enable_array_as_queryable(res);
            return res;
        }

        const collect_second_child_second_child = () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[1] && node.child_nodes[1].child_nodes[1]) {
                res.push(node.child_nodes[1].child_nodes[1]);
            }
            enable_array_as_queryable(res);
            return res;
        }

        const collect_first_child_first_child_name = () => {
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

        const collect_first_child_value = () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[0]) res.push(node.child_nodes[0].value);
            //enable_array_as_queryable(res);
            return res;
        }

        const collect_second_child_node = () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[1]) res.push(node.child_nodes[1]);
            enable_array_as_queryable(res);
            return res;
        }

        const collect_third_child_node = () => {
            const res = [];
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[2]) res.push(node.child_nodes[2]);
            enable_array_as_queryable(res);
            return res;
        }

        const collect_name = () => {
            //node.babel.node
            //console.log('node.babel.node', node.babel.node);
            //throw 'stop';

            const res = [];
            //console.log('node.value', node.value);
            if (node.name) res.push(node.name);
            return res;
        };

        const collect_value = () => {
            //node.babel.node
            //console.log('node.babel.node', node.babel.node);
            //throw 'stop';

            const res = [];
            //console.log('node.value', node.value);
            if (node.value) res.push(node.value);
            return res;
        };

        const count_child_nodes = () => node.child_nodes.length;

        qfm.fns.assign([
            collect_child_count,
            collect_child_nodes, collect_first_child_node, collect_child_type, collect_child_abbreviated_type, collect_child_category,
            collect_first_child_name, collect_child_value,
            collect_first_child_first_child, collect_first_child_second_child,
            collect_second_child_first_child, collect_second_child_second_child,
            collect_first_child_value,
            collect_second_child_node, collect_third_child_node,
            collect_name, collect_value
        ]);

        qfm.fns.assign([count_child_nodes, count_identifier_nodes, count_all_nodes]);
        qfm.fns.assign([select_self, select_self_if_signature_is]);


    }
    apply_functions();
    assign_node_ngrams(qfm);

    

    // select_each_child_node_by_signature

    const ng_exe_fn = qfm.get(sentence);
    //console.log('ng_exe_fn', ng_exe_fn);
    //console.log('qfm.ngrams.list', qfm.ngrams.list);

    if (ng_exe_fn) {
        return ng_exe_fn;
    } else {
        console.trace();
        throw 'No matching function call name was found for: "' + sentence + '".'
    }

}

//

const create_query = (node, words = []) => {

    // The query gets created incrementally.

    // Can create all the query execution functions on startup?
    //  Cache them?

    //console.log('words', words);


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