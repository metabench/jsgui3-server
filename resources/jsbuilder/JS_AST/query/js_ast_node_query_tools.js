const {each} = require('lang-mini');
//const { isArray } = require('./Query_Result');
//c//onst Query_Result = require('./Query_Result');
const Query_Function_Map = require('./Query_Function_Map');
//const Query_Result = require('./JS_AST_Node_Query_Result');
//const enable_array_as_queryable = () => {};




class JS_AST_Node_Query_Result extends Array {

    constructor(spec = {}) {

        //if (isArray(spec)) {

        //}
        super();

        

        let words;
        if (spec.words) {
            words = spec.words;
        }

        // .query property, will produce another query object.

        Object.defineProperty(this, 'query', {
            get() { 
                return create_query(this, words);
            },
            enumerable: false,
            configurable: false
        });

        Object.defineProperty(this, 'is_query_result', {
            get() { 
                return true;
            },
            enumerable: false,
            configurable: false
        });
    }

}

const Query_Result = JS_AST_Node_Query_Result;

JS_AST_Node_Query_Result.from_array = (arr) => {
    if (arr instanceof JS_AST_Node_Query_Result) {
        console.trace();
        throw 'Already a Query_Result';
    } else {
        const res = new JS_AST_Node_Query_Result();
        each(arr, item => res.push(item));
    }
}

// Seems like it would be tricky to hack this / load queries in after they have been set up.
//  // Or, if it does not find the query (text) here, it checks whether there is that query in the Extended Query Set.


// Basically want to define the extended query features to cover some more longwinded searches and operations.
//  They don't fit in with being such general AST queries, but specifically for tracing through what happens in JS programs, and more specific types of
//   JS programs too.



const assign_node_ngrams = (qfm) => {

    qfm.ngrams.assign({
        signature_callmap_deep_iterate: ['callmap by signature', 'callmap deep iterate by signature'],
        callmap_deep_iterate: ['callmap', 'callmap deep iterate'],
        callmap_child_nodes: ['callmap child', 'callmap child node'],
        collect_child_nodes: ['collect child node', 'collect child'],
        collect_first_child_node: ['collect first child node', 'collect first child'],
        collect_all_signature: ['collect all signature', 'collect all node signature'], // collect.child.declared.objects
        collect_child_declared_objects: ['collect child declared object', 'collect child node declared object', 'collect child declaration declared object'],
        collect_child_type: ['collect child type', 'collect child node type'],
        collect_child_abbreviated_type: ['collect child t', 'collect child node t', 'collect child abbreviated type', 'collect child type abbreviation', 'collect child node abbreviated type', 'collect child node type abbreviation'],
        collect_child_category: ['collect child category', 'collect child node category'],
        collect_child_count: ['collect child count', 'collect child node count'],
        collect_child_node_signature: ['collect child signature', 'collect child node signature', 'collect each child signature', 'collect each child node signature'],
        collect_child_identifier_nodes: ['collect child identifier', 'collect child node identifier node'],
        collect_child_identifier_name: ['collect child identifier name', 'collect child node identifier name'],
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
        
        collect_id_name: ['collect id name'],
        collect_child_variable_declarations: ['collect child variabledeclaration'],
        collect_child_declarations: ['collect child declaration'],
        collect_child_variable_declarators: ['collect child variabledeclarator'],
        collect_child_literal: ['collect child literal'],
        collect_declared_keys: ['collect own declared key','collect own declaration declared key', 'collect own declared keys', 'collect own declaration declared keys'],
        collect_self_if_objectexpression: ['collect self if objectexpression', 'collect self if type objectexpression', 'collect self if type is objectexpression', 'collect self if own type is objectexpression'],
        //collect_declaration_assigned_values: ['collect own declaration assigned values', 'collect own declaration assigned values'],
        collect_name: ['collect name', 'collect own name', 'collect node name'],
        //collect_signature: ['collect signature', 'collect own signature', 'collect node signature'],
        collect_value: ['collect value', 'collect own value', 'collect node value'],
        collect_pattern_nodes: ['collect pattern', 'collect pattern node', 'collect node with category pattern'],
        collect_property_nodes: ['collect property', 'collect property node', 'collect node with category property'],
        collect_require_call_nodes: ['collect require call', 'collect require call node', 'collect all require call node'],

        
        count_child_nodes: ['count child node', 'count child', 'child count', 'child node count'],
        count_all_nodes: ['count all', 'count all node'],
        count_child_declarator: ['count child declarator', 'count child declarator node'],
        count_identifier_nodes: ['count identifier node', 'count identifier'],

        each_first_child: ['each first child', 'each first child node'],
        //filter_each_child_node_by_signature: [],
        //each_child_node: ['each child', 'each child node'], // collect.child.declared.objects

        filter_each_child_node: ['filter child node', 'filter each child', 'filter each child node'],

        filter_each_child_variabledeclaration_node: ['filter child variabledeclaration', 'filter child variabledeclaration node', 'filter each child variabledeclaration', 'filter each child variabledeclaration node'],
        filter_each_child_node_by_signature: [
            'each child with signature', 'each child node with signature', 
            'each child node with matching signature', 'each child node matching signature',
            'each child with matching signature', 'each child matching signature',
            
            'filter child node by signature', 'filter each child by signature', 'filter each child node by signature'],
        filter_each_child_node_by_type: ['filter child node by type', 'filter each child by type', 'filter each child node by type'],
        each_child_node: ['each child node', 'each child'],
        each_child_declarator: ['each child declarator node', 'each child declarator'],
        each_child_objectproperty: ['each child objectproperty node', 'each child objectproperty'],
        each_child_variabledeclaration: ['each child variabledeclaration node', 'each child variabledeclaration'],
        each_child_declaration: ['each child declaration node', 'each child declaration'],
        each_child_identifier: ['each child identifier node', 'each child identifier'],

        each_inner_node: ['each inner node', 'each inner'],
        each_ancestor_node: ['each ancestor node', 'each ancestor'],

        each_own_name: ['each name', 'each own name'],

        find_node: ['find node', 'find'],
        find_memberexpression: ['find memberexpression node', 'find memberexpression'],
        find_child_identifier: ['find child identifier', 'find a childnode which is an identifier too'],
        find_node_by_type: ['find node by type', 'find by type'],
        filter_deep_iterate: ['filter node', 'filter', 'filter all node'],
        filter_inner_deep_iterate: ['filter inner node', 'filter inner', 'inner filter', 'filter inner node'],
        select_by_type: ['select by type', 'select node by type'],
        select_by_type_abbreviation: ['select by t', 'select by type abbreviation', 'select by abbreviated type'],
        select_by_child_count: ['select by child count', 'select by child node count', 'select by number of child nodes'],
        select_child_by_first_child_type: ['select child by first child type', 'select child node by first child node type'],
        select_by_first_child_type: ['select by first child type', 'select by first child node type'],
        select_child: ['select child node', 'select child'],
        select_child_by_type: ['select child node by type', 'select child by type',
            'select child node of type', 'select child of type'],
        select_child_node_by_signature: ['select child node by signature', 'select child by signature'],
        select_child_declaration_by_declared_name: ['select child declaration by declared name', 'select child node declaration by declared name'],
        select_by_category: ['select by category',  'select node by category'],
        select_by_first_child_first_child_name: ['select by first child first child name', 'select node by first child first child name'],
        select_self: ['select self', 'select own node'],
        select_self_if_signature_is: ['select self by signature', 'select self if signature is', 'select self if signature']
    })
}

// select child declaration by declared name



//const create_query_execution_fn_qr_results = 

// a run_query function here too?

// exe_query

const create_query_execution_fn = (node, words) => {
    //console.log('words', words);

    //console.log('node', node);

    /*
    const {
        deep_iterate,
        filter_each_child_node,
        find_node, filter_deep_iterate, filter_inner_deep_iterate, filter_child_nodes_by_type,
        select_all, select_child, select_inner,
        callmap_deep_iterate, signature_callmap_deep_iterate, callmap_child_nodes, signature_callmap_child_nodes
    } = node;
    */
    const sentence = words.join(' ');

    const qfm = new Query_Function_Map();

    const {each_ancestor_node} = node;


    

    //console.log('qfm.fns.count', qfm.fns.count);
    //console.log('qfm.fns.names', qfm.fns.names.sort());
    // signature_callmap_deep_iterate

    const apply_functions = () => {

        const filter_each_child_node = (filter, callback) => {
            return node.filter_each_child_node(filter, callback);

        }

        // find_node

        const find_node = (finder) => {
            const res = new Query_Result();
            res.push(node.find_node(finder));
            return res;
        }

        const deep_iterate = node.deep_iterate;

        //const each_ancestor_node = 


        const each_child_declarator = (callback) => filter_each_child_node(node => node.type_category === 'Declarator', callback);
        const each_child_objectproperty = callback => filter_each_child_node(node => node.type === 'ObjectProperty', callback);
        const each_child_variabledeclaration = callback => filter_each_child_node(node => node.type === 'VariableDeclaration', callback);
        const each_child_declaration = (callback) => filter_each_child_node(node => node.is_declaration, callback);
        const each_child_identifier = (callback) => filter_each_child_node(node => node.is_identifier, callback);
        const filter_each_child_node_by_signature = (signature, callback) => filter_each_child_node(node => node.signature === signature, callback);
        const filter_each_child_node_by_type = (type, callback) => filter_each_child_node(node => node.type === type, callback);
        const filter_each_child_variabledeclaration_node = (filterer, callback) => each_child_variabledeclaration(node => {
            if (filterer(node)) callback(node);
        });
        const filter_each_child_node_by_category = (category, callback) => filter_each_child_node(node => node.type_category === category, callback);

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

        const select_child_by_type = (type) => {
            const res= new Query_Result();
            filter_each_child_node_by_type(type, node => res.push(node));
            //enable_array_as_queryable(res);
            return res;
        }

        const select_child_node_by_signature = (signature) => {
            const res= new Query_Result();
            filter_each_child_node_by_signature(signature, node => res.push(node));
            //enable_array_as_queryable(res);
            return res;
        }

        const select_all = (selector) => {
            //return new Query_Result.from_array(node.select_all(selector));
            const res = new Query_Result();
            const r1 = node.select_all(selector);
            each(r1, item => res.push(item));
            //throw 'stop';
            return res;
            
        }

        // select_child

        const select_child = (selector) => {
            //return new Query_Result.from_array(node.select_all(selector));
            const res = new Query_Result();
            const r1 = node.select_child(selector);
            each(r1, item => res.push(item));
            //throw 'stop';
            return res;
            
        }

        const select_child_node_by_type = (type) => {
            const res= new Query_Result();
            filter_each_child_node_by_type(type, node => res.push(node));
            //enable_array_as_queryable(res);
            return res;
        }

        const select_child_node_by_category = (cateogry) => {
            const res= new Query_Result();
            filter_each_child_node_by_category(cateogry, node => res.push(node));
            //enable_array_as_queryable(res);
            return res;
        }
        const select_by_type = type => select_all(node => node.type === type);
        const select_by_type_abbreviation = t => select_all(node => node.t === t);
        const select_by_child_count = target_count => select_all(node => node.child.count === target_count);
        // select.child.by.first.child.type

        // select_child_declaration_by_declared_name

        const select_child_declaration_by_declared_name = target_declared_name => select_child(node => {
            let res = false;

            // declaration.declared.keys

            if (node.is_declaration) {
                const declared_keys = node.declaration.declared.keys;

                //console.log('declared_keys', declared_keys);
                return declared_keys.includes(target_declared_name);

            }

            //throw 'stop';

            return res;
        })

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
        const select_by_category = category => select_all(node => node.type_category === category);
        const select_by_first_child_first_child_name = name => {

            //console.log('node', node);

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
            const res = new Query_Result();
            each_child_node(node => {
                if (node.name !== undefined) res.push(node.name);
            })
            return res;
        }
        const collect_id_name = () => { //looks deeper for an identifier, though in the right cases that identifier is a property of its parent (like in Babel)
            const res= new Query_Result();
            if (node.id) {
                if (node.id.name !== undefined) res.push(node.id.name);
            }
            return res;
        } // identifiers that are child nodes
        const collect_child_identifier_name = () => {
            const res= new Query_Result();
            filter_each_child_node_by_type('Identifier', node => {
                res.push(node.name);
            })
            return res;
        }

        const collect_all_signature = () => {
            const res= new Query_Result();
            deep_iterate(node => {
                res.push(node.signature);
            })
            return res;
        }

        const collect_objectproperty_nodes = () => select_by_type('ObjectProperty');
        const collect_identifier_nodes = () => select_by_type('Identifier');
        const collect_pattern_nodes = () => select_by_category('Pattern');
        const collect_expression_nodes = () => select_by_category('Expression');
        const collect_property_nodes = () => select_by_category('Property');

        const collect_require_call_nodes = () => select_all(node => node.is_require_call);

        const collect_child_identifier_nodes = () => select_child(node => node.is_identifier);
        
        const collect_child_node_signature = () => {
            const res= new Query_Result();
            each_child_node(node => {
                res.push(node.signature);
            })
            return res;
        }
        const collect_self_if_objectexpression = () => {
            const res= new Query_Result();
            if (node.type === 'ObjectExpression') {
                res.push(node);
            }
            //enable_array_as_queryable(res);
            return res;
        }

        const collect_declared_keys = () => {
            const res= new Query_Result();
            if (node.is_declaration) {
                each(node.declaration.declared.keys, k => res.push(k));
            }
            //enable_array_as_queryable(res);
            return res;
        }
        const collect_declaration_assigned_values = () => {
            const res= new Query_Result();
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

        const count_matching_child = (fn_match) => {
            let res = 0;
            each_child_node(cn => {
                if (fn_match(cn)) res++
            })
            return res;
        }

        const count_child_declarator = () => count_matching_child(cn => cn.type === 'VariableDeclarator');
        const select_self = fn_check => {
            const res= new Query_Result();
            //console.log('2) node', node);
            if (fn_check(node)) {
                res.push(node);
            }
            //console.log('res', res);
            //enable_array_as_queryable(res);
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

        //const each_child_with_signature = (signature, callback) => filter_each_child_node(node => node.signature === signature, callback);

        qfm.fns.assign('each_child_declarator', each_child_declarator);
        qfm.fns.assign(each_child_objectproperty);
        qfm.fns.assign(each_child_variabledeclaration);
        qfm.fns.assign(each_child_declaration);
        qfm.fns.assign([each_ancestor_node, each_child_identifier]);
        qfm.fns.assign([
            each_first_child, each_child_node,
            filter_each_child_node_by_signature, filter_each_child_node_by_type,
            filter_each_child_variabledeclaration_node, filter_each_child_node_by_category
        ]);
        qfm.fns.assign([
            select_child_node_by_signature, select_child_by_type,
            select_child_node_by_category, select_child, select_child_by_first_child_type, select_child_declaration_by_declared_name
        
        ]);
        qfm.fns.assign([
            find_node,
            find_child_node, find_child_node_by_type,
            find_child_identifier, find_node_by_type, find_memberexpression
        
        ]);
        qfm.fns.assign([
            select_by_type, select_by_type_abbreviation,
            select_by_child_count, select_by_first_child_type, select_by_category, select_by_first_child_first_child_name
        ]);
        qfm.fns.assign([
            collect_child_name, collect_id_name,
            collect_child_identifier_name, 
            collect_objectproperty_nodes, collect_identifier_nodes, collect_pattern_nodes, collect_expression_nodes, collect_property_nodes, collect_child_identifier_nodes
        ]);

        qfm.fns.assign([
            collect_all_signature,
            collect_child_node_signature, collect_self_if_objectexpression, collect_declared_keys,
            collect_declaration_assigned_values, collect_child_variable_declarators, collect_child_variable_declarations,
            collect_child_declarations, collect_child_literal,

            collect_require_call_nodes
        ]);

        const collect_child_nodes = () => {
            const res = new Query_Result();
            each(node.child_nodes, cn => res.push(cn));
            enable_array_as_queryable(res);
            return res;
        }
        const collect_first_child_node = () => {
            const res = new Query_Result();
            if (node.child_nodes[0]) res.push(node.child_nodes[0]);
            return res;
        }
        const collect_child_type = () => {
            const res = new Query_Result();
            each(node.child_nodes, cn => res.push(cn.type));
            
            return res;
        }
        const collect_child_abbreviated_type = () => {
            const res = new Query_Result();
            //console.log('***** res', res);
            each(node.child_nodes, cn => res.push(cn.t));
            //console.log('node.child_nodes', node.child_nodes);
            //console.log('node.child_nodes.length', node.child_nodes.length);
            //console.log('***** res', res);
            //console.log('res.length', res.length);
            return res;
        }
        const collect_child_category = () => {
            const res= new Query_Result();
            each(node.child_nodes, cn => res.push(cn.type_category));
            return res;
        }

        const collect_child_count = () => [node.child_nodes.length];

        const collect_first_child_name = () => {
            const res= new Query_Result();
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
            const res= new Query_Result();
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
            const res= new Query_Result();
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[0] && node.child_nodes[0].child_nodes[0]) {
                res.push(node.child_nodes[0].child_nodes[0]);
            }
            enable_array_as_queryable(res);
            return res;
        }

        const collect_first_child_second_child = () => {
            const res= new Query_Result();
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[0] && node.child_nodes[0].child_nodes[1]) {
                res.push(node.child_nodes[0].child_nodes[1]);
            }
            enable_array_as_queryable(res);
            return res;
        }

        const collect_second_child_first_child = () => {
            const res= new Query_Result();
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[1] && node.child_nodes[1].child_nodes[0]) {
                res.push(node.child_nodes[1].child_nodes[0]);
            }
            enable_array_as_queryable(res);
            return res;
        }

        const collect_second_child_second_child = () => {
            const res= new Query_Result();
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[1] && node.child_nodes[1].child_nodes[1]) {
                res.push(node.child_nodes[1].child_nodes[1]);
            }
            enable_array_as_queryable(res);
            return res;
        }

        const collect_first_child_first_child_name = () => {
            const res= new Query_Result();
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
            const res= new Query_Result();
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[0]) res.push(node.child_nodes[0].value);
            //enable_array_as_queryable(res);
            return res;
        }

        const collect_second_child_node = () => {
            const res= new Query_Result();
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[1]) res.push(node.child_nodes[1]);
            enable_array_as_queryable(res);
            return res;
        }

        const collect_third_child_node = () => {
            const res = new Query_Result();
            //each(node.child_nodes, cn => res.push(cn));
            if (node.child_nodes[2]) res.push(node.child_nodes[2]);
            enable_array_as_queryable(res);
            return res;
        }

        const collect_name = () => {
            //node.babel.node
            //console.log('node.babel.node', node.babel.node);
            //throw 'stop';

            const res = new Query_Result();
            //console.log('node.value', node.value);
            if (node.name) res.push(node.name);
            return res;
        };

        const each_own_name = (callback) => { // useful in combination with other queries.
            if (node.name !== undefined) callback(node.name);
        }
        const each_inner_node = (callback) => {
            deep_iterate(inode => {
                if (node !== inode) callback(inode);
            })
        }

        const collect_child_declared_objects = () => {
            const res = new Query_Result();
            //console.log('node', node);
            each_child_declarator(cdr => {
                //console.log('cdr', cdr);

                const [c1, c2] = cdr.nav(['0', '1']);
                if (c1.t === 'ArP' && c2.t === 'ArE') {
                    
                    const l = c1.child_nodes.length;
                    for (let c = 0; c < l; c++) {
                        res.push([c1.child_nodes[c].name, c1.child_nodes[c]]);
                    }
                    
                    //c1.query.each.child.exe(id => res.push(id.name));



                } else {
                    //console.log('cdr', cdr);

                    const obj_name = cdr.nav('0').name;
                    //console.log('obj_name', obj_name);
                    const eo = cdr.nav('1');

                    res.push([obj_name, eo]);

                    // object    oe[multi opr]
                    //throw 'stop';
                }

            });
            //throw 'stop';
            return res;
        }

        

        // collect_signature

        // collect.all.signature may be best....

        const collect_value = () => {
            //node.babel.node
            //console.log('node.babel.node', node.babel.node);
            //throw 'stop';

            const res = new Query_Result();
            //console.log('node.value', node.value);
            if (node.value) res.push(node.value);
            return res;
        };

        const count_child_nodes = () => node.child_nodes.length;

        qfm.fns.assign([

            collect_child_declared_objects,

            collect_child_count,
            collect_child_nodes, collect_first_child_node, collect_child_type, collect_child_abbreviated_type, collect_child_category,
            collect_first_child_name, collect_child_value,
            collect_first_child_first_child, collect_first_child_second_child,
            collect_second_child_first_child, collect_second_child_second_child,
            collect_first_child_value,
            collect_second_child_node, collect_third_child_node,
            collect_name, collect_value,

            each_own_name,
            each_inner_node
        ]);

        qfm.fns.assign([count_child_nodes, count_identifier_nodes, count_all_nodes, count_child_declarator]);
        qfm.fns.assign([select_self, select_self_if_signature_is]);


    }
    apply_functions();
    assign_node_ngrams(qfm);

    const add_query_fn = (arr_sentences, query_fn) => {
        const sorted_names = arr_sentences.slice().sort(function(a,b) {
            return a.length - b.length; //ASC, For Descending order use: b - a
        });
        const shortest_name = sorted_names[0];
        const fn_name = shortest_name.split(' ').join('_');

        // qfm.fns.assign('each_child_declarator', each_child_declarator);

        qfm.fns.assign(fn_name, query_fn);
        each(arr_sentences, sentence => {
            qfm.ngrams.assign(fn_name, sentence);
        })

    }

    add_query_fn(['callmap inner', 'callmap inner node'], (fntostring, objcallmap, fndefault) => node.callmap_inner_nodes(fntostring, objcallmap, fndefault))



    // Hopefully we can have a decent bunch of inline queries that do useful things.

    //add_query_fn(['...'], fn);


    // select_each_child_node_by_signature

    const ng_exe_fn = qfm.get(sentence);
    //console.log('ng_exe_fn', ng_exe_fn);
    //console.log('qfm.ngrams.list', qfm.ngrams.list);

    if (ng_exe_fn) {

        // function to execute the query and to put the result into a Query_Result array.

        // JS_AST_Query_Result

        /*
        const fn_res = function() {
            const a = arguments;

            const res = ng_exe_fn.apply(node, a);
            //const res2 = new Query_Result();
            //each(res, item => res2.push(item));

            return res2;
        }
        */

        // Could instead put the items into a results object....

        return ng_exe_fn;
    } else {
        console.trace();
        throw 'No matching function call name was found for: "' + sentence + '".'
    }
}


const create_query = (incoming, words = []) => {

    //console.log('create_query incoming', incoming);
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

            if (incoming.is_js_ast_node) {
                if (target === res) {

                    if (prop === 'exe') {
    
                        //throw 'stop';
                        //console.log('pre create_query_execution_fn');
                        //return (incoming, words) => Query_Result.from_array(create_query_execution_fn(incoming, words));
                        return create_query_execution_fn(incoming, words);
    
                        //throw 'NYI'
    
                        // return the execution function.
    
    
    
                    } else if (prop === 'qstring') {
                        return words.join('.');
                    } else {
                        words.push(prop);
                        return create_query(incoming, words);
                    }
    
                } else {
                    throw 'stop';
                }
            } else {

                // Create an execution function that gets executed on all of the incoming.

                if (incoming instanceof Query_Result) {

                    if (target === res) {

                        if (prop === 'exe') {
        
                            //throw 'stop';
                            //console.log('incoming Query_Result - pre create_query_execution_fn');
                            // Multiple items in that one query result?

                            // can do subresults here....
                            //console.log('incoming', incoming);

                            const res = function() {
                                const a = arguments;
                                const res = new Query_Result();
                                each(incoming, incoming_item => {
                                    //console.log('incoming_item', incoming_item);

                                    if (incoming_item.is_js_ast_node) {
                                        const qres = create_query_execution_fn(incoming_item, words).apply(incoming_item, a);
                                        if (Array.isArray(qres)) {
                                            if (qres.length > 0) {
                                                res.push(qres);
                                            }
                                        } else {
                                            res.push(qres);
                                        }
                                        
                                    } else {
                                        if (incoming_item instanceof Query_Result) {
                                            //console.log('incoming_item', incoming_item);

                                            each(incoming_item, item_item => {
                                                if (!item_item.is_js_ast_node) {
                                                    throw 'Does not support nested incoming items (yet).'
                                                }
                                            })


                                            each(incoming_item, node => {
                                                const qres = create_query_execution_fn(node, words).apply(node, a);
                                                if (Array.isArray(qres)) {
                                                    if (qres.length > 0) {
                                                        res.push(qres);
                                                    }
                                                } else {
                                                    res.push(qres);
                                                }
                                            })

                                            //throw 'stop';

                                            // seems more interesting to add it not as flat....

                                            // Execute multiple functions....

                                            // Start a result object here for each of the results.
                                            //  But I don't know about any queries on nested result objects.




                                        }
                                    }

                                    
                                })
                                return res;

                            }


                            //return (incoming, words) => Query_Result.from_array(create_query_execution_fn(incoming, words));
                            //return create_query_execution_fn(incoming, words);
                            return res;
        
                            //throw 'NYI'
        
                            // return the execution function.
        
        
        
                        } else if (prop === 'qstring') {
                            return words.join('.');
                        } else {
                            words.push(prop);
                            return create_query(incoming, words);
                        }
        
                    } else {
                        throw 'stop';
                    }


                    
                } else {
                    throw 'stop';
                }

                

            }

            
        }
    };
    const proxy2 = new Proxy(res, handler2);
    return proxy2;
}

// .query.extend_with_further_query ???

module.exports = {
    //enable_array_as_queryable: enable_array_as_queryable,
    //create_query_execution_fn_unwrapped_results: create_query_execution_fn_unwrapped_results,
    create_query: create_query,
    Query_Result: JS_AST_Node_Query_Result
}