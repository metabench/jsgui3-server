// When a declaration is treated as a feature, there is programming less specifically for it being a node.

// Feature is an abstraction on top of JS_AST_Node.
const {each} = require('lang-tools');

const JS_AST_Node_Feature = require('./JS_AST_Node_Feature');

class JS_AST_Node_Feature_Declaration extends JS_AST_Node_Feature {
    constructor(spec = {}) {
        super(spec);
        const {node} = this;

        let declared_keys, assigned_values;

        // Maybe should be .declared.keys?

        const declared = {};

        const assigned = {};


        // and the assigned keys property.


        // // maybe they are not assigned keys after all.

        // .assigned.values


        // a query to get the literal values???

        

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
                            console.log('');
                            console.log('cdec', cdec);
                            console.log('cdec.source', cdec.source);
                            const dec_cn_tstr = cdec.query.collect.child.node.t.exe().join('.');
                            console.log('dec_cn_tstr', dec_cn_tstr);

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
        Object.defineProperty(declared, 'keys', {
            get() { 
                if (!declared_keys) {

                    // Can try the get_object_keys function???

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
                        throw 'NYI';
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

                        console.log('vdrs.length', vdrs.length);

                        if (vdrs.length === 0) {
                            if (this.node.type === 'ClassDeclaration') {
                                const key = this.node.child_nodes[0].name;
                                console.log('key', key);

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


                        //console.log('this.node.type', this.node.type);
                        //console.log('this.node.child_nodes.length', this.node.child_nodes.length);
                        
                        //console.log('this.node.signature', this.node.signature);
                        //console.log('this.node.deep_type_signature', this.node.deep_type_signature);


                        //throw 'NYI';
                    }
                    
                    //throw 'NYI';
                }
                return declared_keys;
            },
            enumerable: true,
            configurable: false
        });

        this.declared = declared;
        this.assigned = assigned;
        


    }
}

module.exports = JS_AST_Node_Feature_Declaration;