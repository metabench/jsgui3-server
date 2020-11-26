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

                        // Need to look at all the child nodes.
                        //console.log('node.child.shared.type', node.child.shared.type);

                        // then go through each child declarator....

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
                                //const sc = are.query.child.shared.category.exe();
                                const sc = are.child.shared.category;
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
                                    const sc = are.child.shared.category;
                                    const st = are.child.shared.type;
                                    if (sc === 'Literal') {
                                        const lvalues = are.query.collect.child.exe();
                                        console.log('lvalues', lvalues);
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
                                            throw 'NYI';
                                        }
                                    } else {
                                        throw 'stop';
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
                        declared_keys.push(node.nav('0').name);
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
                            //console.log('dtr', dtr);
                            const dtr_keys = dtr.keys;
                            //console.log('dtr_keys', dtr_keys);
                            each(dtr_keys, key => declared_keys.push(key));
                        });
                    } else {

                        // Seems like class definitions are not iterating right...?

                        //console.log('vdrs.length', vdrs.length);

                        if (vdrs.length === 0) {
                            if (node.type === 'ClassDeclaration') {
                                const key = node.child_nodes[0].name;
                                //console.log('key', key);

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