//const babel_node_tools = require('../babel/babel_node_tools');
// Index before query would help.

// Will index the occurrances of various nodes / things.
// Could get more into tree pattern checking too, declaratively saying what to look for and looking for multiple things at once with signature comparisons in a map.

// Indexing at every level looks like it would be useful.
//  so in order to get the info about how the names relate to nodes we consult indexes.

const { each } = require('lang-mini');
const JS_AST_Node_Basics_Find = require('./JS_AST_Node_3.5-Basics_Find');
const JS_AST_Node_Indexes = require('./JS_AST_Node_4.0-Index_Indexes');

const get_node_indexed_property_matches = (node) => {
    // Which of the indexed properties are matched here?
    // And the match values?

    // eg index all Identifier nodes by name
    //  




     
}
class JS_AST_Node_Index extends JS_AST_Node_Basics_Find {
    constructor(spec = {}) {
        super(spec);
        const {deep_iterate, inner, child} = this;

        // normal object can not work with its's 'constructor' property.
        const _map_identifiers_by_name = new Map();
        let is_indexed = false;
        const indexes = new JS_AST_Node_Indexes();
        const handle_found = (index_name, key, value) => {
            return indexes.set(index_name, key, value);
        }

        const setup_node_index = (index_name, fn_selector, fn_key) => {

            if (indexes.has_index(index_name)) {
                throw 'NYI - index already exists'
            } else {
                deep_iterate(node => {
                    if (fn_selector(node)) {
                        const key = fn_key(node);
                        handle_found(index_name, key, node);
                    }
                })
            }
            //return indexes.get_index(index_name);
            
        }

        const get_indexed_nodes_by_key = (index_name, key) => {
            return indexes.get(index_name, key);
        }

        // calling multiple indexing functions on a single iteration?

        // .find.all.identifiers(node => node.name = name)
        // .find.identifiers.by.name(name) could substitute for the index.



        // .idx_lookup_

        // .nodes_by_name

        const old = () => {


            const do_default_indexing = () => {
                // Will find function names too :) The functions being called
                // could we make a shallower version that is more efficient?
                //  ie, it gets the map from below, and adds any relevant items at the current level.
    
                // Making use of child nodes' own indexes would be the optimization here.
                //  Building it out of the indexes of the child nodes, if they have indexes.
    
                deep_iterate(node => {
                    // Are the child nodes all of the same type?
                    // .child_node_shared_type property
    
                    if (node.is_identifier) {
                        const name = node.name;
                        //console.log('name', name);
    
                        //_map_identifiers_by_name[name] = _map_identifiers_by_name[name] || [];
                        //if (!_map_identifiers_by_name.has(name)) _map_identifiers_by_name.set(name, [])
                        handle_found('identifiers_by_name', name, node);
    
                        //_map_identifiers_by_name.get(name).push(node);
                        //console.log('map_identifiers_by_name[name]', _map_identifiers_by_name[name]);
                        //_map_identifiers_by_name[name].push(node);
                    }
                    if (node.is_declaration) {
                        //console.log('have declaration node in index loop');
                        //console.log('node.child_nodes.length', node.child_nodes.length);
                        //console.log('node.signature', node.signature);
                        //console.log('node', node);
                        //console.log('node.child', node.child);
                        //console.log('node.child.count', node.child.count);
                        // node.child.collected.names???
    
                        if (node.child.shared.type === 'VariableDeclarator') {
                            if (node.source.length < 800) {
                                //console.log('node.source', node.source);
                            }
                            node.each.child(dec => {
                                //console.log('dec.babel.node', dec.babel.node);
                                //const id = dec.child.find(node => node.is_identifier);
                                // find.identifier();
                                const id = dec.find(node => node.is_identifier);
                                if (id) {
                                    //console.log('id', id);
                                    //console.log('id.name', id.name);
                                    //_map_names_to_declarations[id.name] = node;
    
                                    //_map_names_to_declarations.set(id.name, node)
                                    handle_found('names_to_declarations', id.name, node);
                                } else {
                                    //console.log('node', node);
                                    //console.log('dec.child.count', dec.child.count);
    
                                    // dec.child.types?
                                    //  dec.child.collect.types
                                    //console.log('dec.child.collect.type', dec.child.collect.type);
                                    // object pattern and member expression.
                                    //  {a, b, c} = lib;
                                    if (dec.child.count === 2) {
                                        const child_types = dec.child.all.type;
                                        // dec.child.collect.category
                                        const child_categories = dec.child.all.category;
                                        //console.log('child_categories', child_categories);
                                        // maybe any expression is allowed.
                                        //  seems that way
                                        if (child_types[0] === 'ObjectPattern' && child_categories[1] === 'Expression') {
                                            const objpat = dec.child_nodes[0];
                                            //console.log('objpat', objpat);
                                            //console.log('objpat.child.shared.type', objpat.child.shared.type);
                                            if (objpat.child.shared.type === 'ObjectProperty') {
                                                objpat.each.child(objprop => {
                                                    //console.log('objprop', objprop);
                                                    //console.log('objprop.source', objprop.source);
                                                    //console.log('objprop.child.count', objprop.child.count);
                                                    if (objprop.child.count === 2) {
                                                        //console.log('objprop.child.first', objprop.child.first);
                                                        //console.log('objprop.child.last', objprop.child.last);
                                                        //console.log('objprop.child.last.source', objprop.child.last.source);
                                                        //console.log('objprop.child.first.source', objprop.child.first.source);
                                                        if (objprop.child.first.source == objprop.child.last.source) {
                                                            const name = objprop.child.first.name;
                                                            //console.log('name', name);
                                                            //_map_names_to_declarations[name] = node;
                                                            //_map_names_to_declarations.set(name, node);
                                                            handle_found('names_to_declarations', name, node);
                                                        } else {
                                                            throw 'stop';
                                                        }
                                                    } else {
                                                        throw 'stop';
                                                    }
                                                })
                                            } else {
                                                throw 'stop';
                                            }
                                        } else {
                                            // can be [ 'ObjectPattern', 'ThisExpression' ]
                                            throw 'stop';
                                        }
                                    } else {
                                        throw 'stop';
                                    }
                                }
                                // dec.id?
                                //  gets the identifier?
                                // dec.child.identifier?  
                            })
                        }
                        // then are all the child nodes of type 'VariableDeclarator'
                        // .deep (self then inner)
                        // .inner (recursively child nodes)
                        // .child
                        //node.child.declarators
                    }
                    
    
                    if (node.is_expression) {
                        if (node.type === 'CallExpression') {
                            //console.log('node.source', node.source);
                            //console.log('node', node);
                            //console.log('node.babel.node', node.babel.node);
    
                            const callee = node.first.child.node;
                            if (callee.is_identifier) {
                                const fncall_name = callee.name;
                                //console.log('fncall_name', fncall_name);
                                //_map_fn_call_names.set(fncall_name, node);
                                handle_found('fn_call_names', fncall_name, node);
                            } else {
    
                                if (callee.type === 'MemberExpression') {
                                    //console.log('callee.child.count', callee.child.count);
                                    let fncall_path = '';
                                    let first = true;
    
                                    // .child.node.count ???
                                    // .child.declaration.count
    
                                    // .count.child?
                                    //  // don't properly have .child any longer.
                                    //    this would be under callee.count.child.node
    
                                    if (callee.child_nodes.length > 1) {
                                        //.each.child.identifier
    
                                        callee.each.child(id => {
                                            if (id.is_identifier) {
                                                if (!first) {
                                                    fncall_path += '.';
                                                } else {
                                                    first = false;
                                                }
                                                fncall_path += id.name;
                                            } else {
                                                //console.log('node.source', node.source);
    
                                                // Calling a function that is a property of an object.
                                                //  Not so interested right now.
    
                                                // Not looking for this now
    
                                                //throw 'stop';
                                            }
                                        })
                                        handle_found('fn_call_names', fncall_name, node);
                                        //_map_fn_call_names.set(fncall_path, node);
                                    } else {
                                        throw 'stop';
                                    }
    
                                }
                                //
                                //throw 'stop';
                            }
                            //throw 'stop';
                        }
                    }
                    //console.log('child.count', child.count);
                    //if (child.count > 0) {
                    //    child.each(cn => {
                    //    })Class constructor {}specClass constructor {}spec
                    //}
                })
                is_indexed = true;
            }
    
    
            const ensure_index = () => {
                // maybe call it standard indexing here.
    
                if (!is_indexed) {
                    do_default_indexing();
                }
            }
            // this.map
            // identifiers.name
    
            Object.defineProperty(this, 'is_indexed', {
                get() { 
                    return is_indexed;
                },
                //set(newValue) { bValue = newValue; },
                enumerable: true,
                configurable: false
            });


        }

        
        /*
        Object.defineProperty(this, 'maps', {
            get() { 
                return maps;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        */
        
        /*
        Object.defineProperty(this, 'map_identifiers_by_name', {
            get() { 
                ensure_index();
                return _map_identifiers_by_name;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        */

        // _map_names_to_declarations

        // declaration.identifier.name

        // Not so sure about the map object here.

        // Makes sense as a verb, a means to access it.

        /*

        const map = {
            declaration: {
                identifier: {
                    
                }
            },
            identifier: {

            }
        }
        Object.defineProperty(map.declaration.identifier, 'name', {
            get() { 
                ensure_index();
                return _map_names_to_declarations;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(map.identifier, 'name', {
            get() { 
                ensure_index();
                return _map_identifiers_by_name;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'map', {
            get() { 
                //ensure_index();
                return map;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        */

        this.setup_node_index = setup_node_index;
        this.get_indexed_nodes_by_key = get_indexed_nodes_by_key;
        // setup_node_index = (index_name, fn_selector, fn_key) => {
            
    }
}
module.exports = JS_AST_Node_Index;