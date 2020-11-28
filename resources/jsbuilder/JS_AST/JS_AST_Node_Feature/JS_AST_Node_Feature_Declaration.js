// When a declaration is treated as a feature, there is programming less specifically for it being a node.

// Feature is an abstraction on top of JS_AST_Node.
const {each} = require('lang-mini');

const JS_AST_Node_Feature = require('./JS_AST_Node_Feature');

class JS_AST_Node_Feature_Declaration extends JS_AST_Node_Feature {
    constructor(spec = {}) {
        super(spec);
        const {node} = this;

        let declared_keys, assigned_values, assigned_nodes;

        // Maybe should be .declared.keys?

        const declared = {};

        const assigned = {};

        Object.defineProperty(assigned, 'values', {
            get() { 
                if (!assigned_values) {
                    assigned_values = [];

                    //console.log('node', node);
                    //console.log('node.source', node.source);

                    if (node.type === 'VariableDeclaration') {
                        node.query.each.child.declarator.exe(cdec => {
                            //console.log('');
                            //console.log('cdec', cdec);
                            //console.log('cdec.source', cdec.source);
                            const qr = cdec.query.collect.child.node.t.exe();
                            const dec_cn_tstr = qr.join('.');
                            //console.log('dec_cn_tstr', dec_cn_tstr);
                            //console.log('qr', qr);

                            // Can use a signature map.
                            
                            //  node.query.callmap.child.declarator.signature.exe({sig1: (node) => {}, sig2: node => {}}, unmapped_node => {})



                            if (dec_cn_tstr === 'ArP.ArE') {


                                // ArrayPattern.ArrayExpression
                                const are = cdec.child_nodes[1];
                                //console.log('are', are);
    
                                // then are they literals inside?
    
                                // .find child shared category?
                                //  but query needs the verb.
                                //   maybe collect is the default one now.
                                //const sc = are.query.child.shared.type_category.exe();
                                const sc = are.child.shared.type_category;
                                //console.log('sc', sc);

                                //throw 'stop';
    
                                const st = are.child.shared.type;
                                //console.log('st', st);
    
                                if (sc === 'Literal') {
                                    // can get the values....
    
                                    const lvalues = are.query.collect.child.value.exe();
                                    //console.log('lvalues', lvalues);
                                    each(lvalues, v => assigned_values.push(v));
    
                                } else {



                                    throw 'NYI';
                                }
                                //console.log(sc);
                                //if (are.)
                            } else {

                                // .query.select.by.child.count.exe(2).query.select.where.first.child.is.identifier.exe().select.where.second.child.is.literal.exe()
                                // .quert.select.where.child.count.is.exe(2)

                                if (cdec.child.count === 2) {
                                    if (cdec.child_nodes[0].is_identifier) {


                                        if (cdec.child_nodes[1].is_literal) {
                                            const [name, value] = [cdec.child_nodes[0].name, cdec.child_nodes[1].value];
                                            //console.log('[name, value]', [name, value]);
                                            assigned_values.push(value);

                                        } else {
                                            // is it an expression?
                                            //  we could give it the node?

                                            // leaving it for the moment???

                                            if (cdec.child_nodes[1].is_expression) {
                                                assigned_values.push(cdec.child_nodes[1]);

                                            }



                                        }

                                        //throw 'yay';
                                        

                                    } else {
                                        throw 'NYI';
                                    }


                                } else {
                                    throw 'stop';
                                }

                                //console.log('dec_cn_tstr', dec_cn_tstr);
                                //throw 'NYI';


                            }

                        });

                        
                    } else if (node.type === 'ClassDeclaration') {
                        throw 'NYI';
                    } else {
                        throw 'stop';
                    }
                }
                return assigned_values;
            }});

            class PlaceholderNode {
                constructor(spec = {}) {
                    if (spec.module) this.module = spec.module;
                    if (spec.key) this.key = spec.key;


                }
            }

            Object.defineProperty(assigned, 'nodes', {
                get() { 
                    if (!assigned_nodes) {
                        assigned_nodes = [];
                        if (node.type === 'VariableDeclaration') {
                            node.query.each.child.declarator.exe(cdec => {
                                const qr = cdec.query.collect.child.node.t.exe();
                                const dec_cn_tstr = qr.join('.');
                                if (dec_cn_tstr === 'ArP.ArE') {
                                    const are = cdec.child_nodes[1];
                                    const sc = are.child.shared.type_category;
                                    const st = are.child.shared.type;
                                    if (sc === 'Literal') {
                                        const lvalues = are.query.collect.child.exe();
                                        //console.log('lvalues', lvalues);
                                        each(lvalues, v => assigned_nodes.push(v));
                                    } else {
                                        throw 'NYI';
                                    }
                                    //console.log(sc);
                                    //if (are.)
                                } else {
    
                                    // .query.select.by.child.count.exe(2).query.select.where.first.child.is.identifier.exe().select.where.second.child.is.literal.exe()
                                    // .quert.select.where.child.count.is.exe(2)
    
                                    if (cdec.child.count === 2) {
                                        if (cdec.child_nodes[0].is_identifier) {
    
    
                                            if (cdec.child_nodes[1].is_literal) {
                                                const [name, value] = [cdec.child_nodes[0].name, cdec.child_nodes[1]];
                                                //console.log('[name, value]', [name, value]);
                                                assigned_nodes.push(value);
    
                                            } else {
                                                // is it an expression?
                                                //  we could give it the node?
    
                                                // leaving it for the moment???
    
                                                if (cdec.child_nodes[1].is_expression) {
                                                    assigned_nodes.push(cdec.child_nodes[1]);
                                                }
                                            }
                                        } else {

                                            if (node.is_require_call) {

                                                throw 'stop';
                                            }

                                            //console.log('node', node);
                                            //console.log('node.source', node.source);

                                            if (node.child.count === 2) {
                                                const [c0, c1] = node.nav([0, 1]);
                                                if (c1.is_require_call) {
                                                    //console.log('c1.type', c1.type);
                                                    throw 'stop';
                                                }

                                                if (c0.t === 'VDr' && c1.t === 'CaE') {
                                                    const opa = c0.nav('0');
                                                    if (opa.t === 'OPa') {
                                                        opa.query.each.child.exe(opr => {
                                                            if (opr.t === 'OPr') {
                                                                const name = opr.nav('0').name;
                                                                // but not looking for the names here.
                                                            } else {
                                                                throw 'stop';
                                                            }
                                                        })
                                                    } else {
                                                        throw 'stop';
                                                    }

                                                    

                                                }
                                            } else {

                                                if (node.child.count === 1) {
                                                    const cn = node.nav('0');
                                                    //console.log('cn', cn);

                                                    if (cn.t === 'VDr') {

                                                        //console.log('cn.child.count', cn.child.count);

                                                        if (cn.child.count === 1) {
                                                            const ccn = cn.nav('0');
                                                            if (ccn.t === 'OPa') {
                                                                //console.log('ccn.child.count', ccn.child.count);
                                                                //console.log('ccn', ccn);
                                                                if (ccn.child.count === 2) {

                                                                    throw 'NYI';
                                                                } else {
                                                                    throw 'stop';
                                                                }
                                                            } else {
                                                                throw 'stop';
                                                            }
                                                        } else {
                                                            if (cn.nav('0').t === 'OPa') {


                                                                if (cn.nav('1').is_require_call) {

                                                                    //console.log('found the require call');

                                                                    const required_path = cn.nav('1/0').value;

                                                                    //console.log('required_path', required_path);

                                                                    //console.log('info1', cn.nav('0').child.count);

                                                                    each(cn.nav('0').child_nodes, cn => {
                                                                        // ignore the node for now here.

                                                                        const name = cn.nav('0').name;

                                                                        assigned_nodes.push(new PlaceholderNode({
                                                                            module: required_path,
                                                                            name: name
                                                                        }))
                                                                    })

                                                                }


                                                                //throw 'NYI';
                                                            } else {
                                                                throw 'NYI';
                                                            }

                                                            //throw 'stop';
                                                        }

                                                    } else {
                                                        throw 'stop';
                                                    }
                                                }

                                                //console.log('node.child.count', (node.child.count));


                                                //throw 'stop';
                                            }

                                            // assigned to parts of a require statement.
                                            //  maybe use some kind of external signifier.
                                            //   Maybe an External_Placeholder_Node?

                                            // Placeholder_Node
                                            //   module name
                                            //    exported key from module

                                            // 1) Recognise a require call
                                            // 2) Return results saying that the nodes are indeed assigned, and they are assigned to an exported key from a module.
                                            
                                            // Mainly need to know that the values are assigned to keys from a module
                                            //  Another part of the system could then load that module.






                                            //throw 'NYI';
                                        }
                                    } else {

                                        //console.log('node.child.shared.type', node.child.shared.type);
                                        if (node.child.shared.type === 'VariableDeclarator') {
                                            let all_1_child = true;
                                            each(node.child_nodes, cn => {
                                                all_1_child = all_1_child && cn.child.count === 1;
                                            });
                                            if (all_1_child) {
                                                // safe to say its the identifier child
                                                // no assigned nodes here.
                                            } else {
                                                throw 'stop';
                                            }

                                        } else {
                                            console.log('node.source', node.source);
                                            console.log('node', node);

                                            throw 'stop';
                                        }

                                        
                                    }
                                }
                            });
                        } else if (node.type === 'ClassDeclaration') {
                            throw 'NYI';
                        } else {
                            throw 'stop';
                        }
                    }
                    return assigned_nodes;
        }});

        Object.defineProperty(declared, 'keys', {
            get() { 
                if (!declared_keys) {
                    // Can try the get_object_keys function???
                    //console.log('node', node);
                    //console.log('node.source', node.source);
                    declared_keys = [];

                    if (node.type === 'VariableDeclaration') {
                        //console.log('node', node);
                        //const ks = node.query.collect.child.variabledeclarator.exe().query.collect.id.name.exe();
                        const vdars = node.query.collect.child.variabledeclarator.exe();
                        //console.log('vdars', vdars);
                        //console.log('vdars[0].id', vdars[0].id);
                        const collected_keys = vdars.query.collect.id.name.exe();
                        each(collected_keys, key => declared_keys.push(key));
                        //console.log('collected_keys', collected_keys);
                    } else if (node.type === 'ClassDeclaration') {

                        // do the class decs below...
                        //declared_keys.push(node.nav('0').name);
                        //throw 'NYI';
                    } else {
                        throw 'stop';
                    }

                    //throw 'stop';
                    
                    const vdrs = node.query.select.child.node.exe(node => node.type === 'VariableDeclarator'); // and the new query system works.
                    if (vdrs.length > 0) {
                        //console.log('vdrs', vdrs);
                        // No, a variable declarator that assigns object keys should return those keys, not the object name itself.
                        each(vdrs, vdr => {
                            const dtr = vdr.declarator;
                            const dtr_keys = dtr.keys;
                            each(dtr_keys, key => declared_keys.push(key));
                        });
                    } else {
                        // Seems like class definitions are not iterating right...?
                        //console.log('vdrs.length', vdrs.length);
                        if (vdrs.length === 0) {
                            if (node.type === 'ClassDeclaration') {
                                const key = node.child_nodes[0].name;
                                //console.log('1) key', key);
                                if (key !== undefined) {
                                    declared_keys.push(key);
                                } else {
                                    throw 'stop';
                                }
                                //throw 'NYI';
                            } else {
                                throw 'stop';
                            }

                        } else {
                            throw 'NYI';
                        }
                    }
                    //throw 'NYI';
                }
                return declared_keys.flat();
            },
            enumerable: true,
            configurable: false
        });

        this.declared = declared;
        this.assigned = assigned;
    }
}

module.exports = JS_AST_Node_Feature_Declaration;