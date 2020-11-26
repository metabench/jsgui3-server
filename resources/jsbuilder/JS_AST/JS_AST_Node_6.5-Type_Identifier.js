// const babel_node_tools = require('../babel/babel_node_tools');

const { each } = require('lang-mini');
const JS_AST_Node_Type_Block_Statement = require('./JS_AST_Node_6.4-Type_Block_Statement');

class JS_AST_Node_Type_Identifier extends JS_AST_Node_Type_Block_Statement {
    constructor(spec = {}) {
        super(spec);
        

        if (this.type === 'Identifier') {
            // means to find out if / what the scoping issues are with this identifier.


            // Solo identifier

            // Member expression child
            //  first child is the name of the object.

            

            // identifier_node.trace_reference

            // Identifier_type?

            // usage_type property

            // Object Reference
            // Object Property Reference
            // Declared Name

            const get_identifier_usage_type = () => {
                const pn = this.parent_node, idx = this.index;
                if (pn) {
                    //console.log('pn', pn);
                    //console.log('pn.source', pn.source);
                    //console.log('pn', pn);
                    const gpn = pn.parent_node;
                    if (pn.t === 'VDr') {
                        const vdn = pn.parent_node;
                        if (vdn && vdn.t === 'VDn') return 'DeclaredName';
                    } else if (pn.t === 'ArP') {
                        if (gpn) {
                            if (gpn.t === 'VDr') {
                                const ggpn = gpn.parent_node;
                                if (ggpn) {
                                    if (ggpn.t === 'VDn') {
                                        return 'DeclaredName';
                                    } else {
                                        throw 'stop';
                                    }
                                } else {
                                    throw 'stop';
                                }
                            }
                        } else {
                            throw 'stop';
                        }
                    } else {
                        //console.log('this.index', this.index);
                        if (pn.t === 'ME') {
                            if (this.index === 0) {
                                return 'ObjectReference';
                            } else {
                                return 'ObjectPropertyReference';
                            }
                        } else if (pn.t === 'BE') {
                            return 'ObjectReference';
                        } else if (pn.t === 'CaE') {
                            return 'ObjectReference';
                        } else if (pn.t === 'CD') {
                            return 'DeclaredName';
                        } else if (pn.t === 'CM') {
                            return 'DeclaredName';
                        } else if (pn.t === 'AsP') {
                            return 'DeclaredName';
                        } else if (pn.t === 'RS') {
                            return 'ObjectReference';
                        } else {
                            console.log('pn', pn);
                            console.log('gpn', gpn);
                            console.log('this', this);


                            throw 'stop';
                        }
                        
                    }
                } else {
                    throw 'stop';
                }
            }
            Object.defineProperty(this, 'usage_type', {
                get() { 
                    return get_identifier_usage_type();
                },
                enumerable: true,
                configurable: false
            });
            


            // A first go at it.
            //  Could definitely improved, indexing may be an optimization for finding references too.
            this.trace_reference_to_declaration = () => {
                const pn = this.parent_node;
                const ut = this.usage_type;
                if (ut === 'DeclaredName') {
                    const gpn = pn.parent_node;
                    if (pn.t === 'VDr') {
                        const vdn = pn.parent_node;
                        if (vdn && vdn.t === 'VDn') return vdn;
                    } else if (pn.t === 'ArP') {
                        if (gpn) {
                            if (gpn.t === 'VDr') {
                                const ggpn = gpn.parent_node;
                                if (ggpn) {
                                    if (ggpn.t === 'VDn') {
                                        return ggpn;
                                    } else {
                                        throw 'stop';
                                    }
                                } else {
                                    throw 'stop';
                                }
                            }
                        } else {
                            throw 'stop';
                        }
                    } else {
                        //console.log('this', this);
                        //console.log('this.source', this.source);
                        //console.log('this.parent_node', this.parent_node);
                        //console.log('pn.t', pn.t);

                        if (pn.t === 'CD' || pn.t === 'CM' || pn.t === 'AsP') {
                            return pn;
                        } else {
                            throw 'stop';
                        }

                        
                    }

                } else if (ut === 'ObjectReference') {
                    // Now trace back the object declaration by name.

                    const trace_back_named_object_declaration = () => {
                        
                        const map_ancestors = new Map();
                        let res;

                        // check the lower siblings in the same declaration.
                        // this.query.collect.previous.sibling
                        // this.query.each.previous.sibling
                        //  in forward order

                        //console.log('this.parent_node.parent_node', this.parent_node.parent_node);
                        //console.log('this.parent_node.parent_node.source', this.parent_node.parent_node.source);
                        //console.log('this.parent_node.parent_node.parent_node.source', this.parent_node.parent_node.parent_node.source);


                        const search_node_child_nodes = (node) => {
                            if (!res) {
                                each(node.child_nodes, (cn, idx) => {

                                    if (!res && !map_ancestors.has(cn)) {
                                        //if (!passed_ancestor) {
                                            // child declarations of this. check for the name there.
    
                                        if (cn.is_declaration) {
                                            //console.log('cn is dec', cn);
                                            //console.log('cn.declaration.assigned.values', cn.declaration.assigned.values);
                                            //console.log('cn.declaration.declared.keys', cn.declaration.declared.keys);
                                            //console.log('this.name', this.name);

                                            if (cn.declaration.declared.keys.includes(this.name)) {
                                                //return cn.declaration.assigned.values[cn.declaration.declared.keys.indexOf(this.name)]

                                                // .assigned.nodes

                                                res = cn.declaration.assigned.nodes[cn.declaration.declared.keys.indexOf(this.name)];

                                                //res = cn.declaration.assigned.values[cn.declaration.declared.keys.indexOf(this.name)];
                                            }
                                        }
    
                                        //}
                                    } else {
                                        //passed_ancestor = true;
                                    }
    
                                })
                            }
                            
                        }

                        // ok, this seems to work.
                        //  maybe too extensive???
                        this.parent_node.parent_node.sibling.previous.each(psib => {
                            //console.log('ppsib', psib);
                            search_node_child_nodes(psib.parent_node);
                        })
                        this.parent_node.parent_node.parent_node.sibling.previous.each(psib => {
                            //console.log('pppsib', psib);
                            search_node_child_nodes(psib.parent_node);
                        })



                        

                        this.query.each.ancestor.exe(an => {
                            //console.log('an', an);
                            //console.log('an.source', an.source);
                            //console.log('an.t', an.t);
                            //console.log('an.child.count', an.child.count);

                            map_ancestors.set(an, true);

                            //then go through the ancestor child nodes, up until the query node ancestor
                            let passed_ancestor = false;

                            if (!res) {
                                search_node_child_nodes(an);
                            }

                            // any declaration - look for the declared names inside?
                            //  or at a lower index?

                            // do they declare and assign it at a lower index than the one that was used to reach the identifier node?



                            

                        })
                        return res;




                    }

                    const traced = trace_back_named_object_declaration();
                    return traced;

                } else {
                    // ignore ObjectPropertyReference

                }

                const old_way = () => {


                    const pn = this.parent_node, idx = this.index;
                if (pn) {
                    //console.log('pn', pn);
                    //console.log('pn.source', pn.source);
                    //console.log('pn', pn);
                    const gpn = pn.parent_node;
                    if (pn.t === 'VDr') {
                        const vdn = pn.parent_node;
                        if (vdn && vdn.t === 'VDn') return vdn;
                    } else if (pn.t === 'ArP') {
                        if (gpn) {
                            if (gpn.t === 'VDr') {
                                const ggpn = gpn.parent_node;
                                if (ggpn) {
                                    if (ggpn.t === 'VDn') {
                                        return ggpn;
                                    } else {
                                        throw 'stop';
                                    }
                                } else {
                                    throw 'stop';
                                }
                            }
                        } else {
                            throw 'stop';
                        }
                    } else {

                        // BE
                        //  identifier is used to refer to something, need to look up the reference.

                        // trace_back_find_named_object_declaration


                        const trace_back = () => {

                            //console.log('');
                            //console.log('trace back this', this);
                            //console.log('trace back this.source', this.source);
                            // find the next ancestor that is a BE.
                            //  look in that scope

                            // first look for previous declarations made in that same statement...?
                            // each ancestor, then in them look at the child declaration declared names.
                            //  

                            

                    


                        }
                        return trace_back();

                        //throw 'stop';
                    }



                } else {
                    throw 'stop';
                }

                }

                
                

                //throw 'stop';
            }

            




        }
        
    }
}

module.exports = JS_AST_Node_Type_Identifier;