//const babel_node_tools = require('../babel/babel_node_tools');
// Index before query would help.

// Will index the occurrances of various nodes / things.

// Could get more into tree pattern checking too, declaratively saying what to look for and looking for multiple things at once with signature comparisons in a map.

// Indexing at every level looks like it would be useful.
//  so in order to get the info about how the names relate to nodes we consult indexes.







const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Query_Features = require('./JS_AST_Node_3.8-Query_Features');

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


// A separate indexing system, maybe written in an abstract way could be of use.
//  

// Should also know what we are looking for when we index something.
//  That is why a tree makes the most sense to algorithmically check not just whether a node should be indexed according to one criteria,
//   but which out of multiple criteria apply.

// Could try an Indexing_Decision_Tree.

// Recognition of patterns / structures of nodes (using a tree most likely) does seem important / useful.
//  





// Maybe multiple indexes too.
//  So there will be an index by different properties.

// A name index of nodes.
//  Will associate the js ast node objects with the names.

// Indexes of a variety of different things.
//  These will make accessing these objects later much faster.

// Indexing of structures does make sense in some ways.
//  Such as being able to find the same structure elsewhere.
//   Would help spot possible abstractions.

// Can leave this for the moment and just work on extracting the necessary things and possibly doing some more focused indexing.

// I think indexing the identifier nodes' names inside any node makes sense to do.


const get_node_indexed_property_matches = (node) => {
    // Which of the indexed properties are matched here?

    // And the match values?

    // eg index all Identifier nodes by name
    //  



}


class JS_AST_Node_Index extends JS_AST_Node_Query_Features {
    constructor(spec = {}) {
        super(spec);
        const {deep_iterate, inner, child} = this;

        // normal object can not work with its's 'constructor' property.
        const _map_identifiers_by_name = new Map();
        let is_indexed = false;

        // Makes sense after querying functionality has been set up.

        // Maybe we should have another level for querying, maybe indexed-query
        //  Indexes will be nice for connecting things together quickly.

        // Index of the names of all functions being called.
        // Index of the full.dotted.object.paths of every one that is used.

        // Want flexibility and concise code with different indexes.

        // access the indexes as functions for the moment.

        const indexes = new Map();
        const maps = new Map();




        // .indexed.

        // .index_system.define_index(index_name, fn_indexer)

        // index.get(value)
        // index_system.get(index_name, value);

        // .cmap as a verb to create a map

        // .map.create(name, fn_mapper)



        // .map.identifier.name
        







        // and do a map of declarations by name as well.
        //  though that's tricky in some ways.
        //  could navigate the tree back from any node to see if it's part of a declaration or reference.

        //let child_node_shared_type; // now available as node.child.shared.type

        const _map_names_to_declarations = new Map();

        const _map_fn_call_names = new Map();

        maps.set('names_to_declarations', _map_names_to_declarations);

        // The name could possibly occur multiple times internally.
        //  As in, be declared multiple times, should be in different scopes. Maybe var does this?



        const build_index = () => {

            // Will find function names too :) The functions being called
            //  

            // could we make a shallower version that is more efficient?
            //  ie, it gets the map from below, and adds any relevant items at the current level.

            // Making use of child nodes' own indexes would be the optimization here.
            //  Building it out of the indexes of the child nodes, if they have indexes.

            deep_iterate(node => {

                // Are the child nodes all of the same type?
                // .child_node_shared_type property

                if (node.is_identifier) {
                    const name = node.name;
                    // 

                    //console.log('name', name);
                    //_map_identifiers_by_name[name] = _map_identifiers_by_name[name] || [];
                    if (!_map_identifiers_by_name.has(name)) _map_identifiers_by_name.set(name, [])
                    _map_identifiers_by_name.get(name).push(node);
                    //console.log('map_identifiers_by_name[name]', _map_identifiers_by_name[name]);
                    //_map_identifiers_by_name[name].push(node);
                }
                if (node.is_declaration) {
                    //console.log('have declaration node in index loop');
                    //console.log('node.child_nodes.length', node.child_nodes.length);
                    console.log('node.signature', node.signature);
                    console.log('node', node);
                    console.log('node.child', node.child);
                    //console.log('node.child.count', node.child.count);
                    // node.child.collected.names???

                    if (node.child.shared.type === 'VariableDeclarator') {
                        if (node.source.length < 800) {
                            //console.log('node.source', node.source);
                        }
                        node.each.child(dec => {
                            //console.log('dec.babel.node', dec.babel.node);

                            //const id = dec.child.find(node => node.is_identifier);
                            const id = dec.find(node => node.is_identifier);




                            if (id) {
                                //console.log('id', id);
                                //console.log('id.name', id.name);
                                //_map_names_to_declarations[id.name] = node;

                                _map_names_to_declarations.set(id.name, node)
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
                                                    //console.log('objprop.child.first.source', objprop.child.first.source);
                                                    //console.log('objprop.child.last.source', objprop.child.last.source);


                                                    if (objprop.child.first.source == objprop.child.last.source) {
                                                        const name = objprop.child.first.name;
                                                        //console.log('name', name);

                                                        //_map_names_to_declarations[name] = node;
                                                        _map_names_to_declarations.set(name, node)


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
                            _map_fn_call_names.set(fncall_name, node);
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
                                    _map_fn_call_names.set(fncall_path, node);
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

                //    })

                //}
            })
            is_indexed = true;
        }

        const ensure_index = () => {
            if (!is_indexed) {
                build_index();
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
        

    }
}

module.exports = JS_AST_Node_Index;