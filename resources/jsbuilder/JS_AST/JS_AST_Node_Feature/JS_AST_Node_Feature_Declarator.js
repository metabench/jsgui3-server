// When a declaration is treated as a feature, there is programming less specifically for it being a node.

// Feature is an abstraction on top of JS_AST_Node.
const {each} = require('lang-tools');

const JS_AST_Node_Feature = require('./JS_AST_Node_Feature');

class JS_AST_Node_Feature_Declarator extends JS_AST_Node_Feature {
    constructor(spec = {}) {
        super(spec);
        const {node} = this;

        // inner keys?
        // .key for itself?

        let keys;
        Object.defineProperty(this, 'keys', {
            get() { 

                if (!keys) {
                    console.log('node', node);
                    console.log('node.source', node.source);
                    keys = [];
                    const found_key = key => {
                        keys.push(key);
                    }
                    //console.log('node', node);
                    //console.log('node.source', node.source);
                    // are there 2 child nodes?
                    // array pattern and array expression

                    //console.log('node.child.count', node.child.count);
                    //throw 'stop';

                    if (node.child.count === 2) {
                        if (node.child_nodes[0].type === 'ArrayPattern' && node.child_nodes[1].type === 'ArrayExpression') {

                            const [arp, are] = node.child_nodes;

                            if(arp.child.count === are.child.count) {
                                //console.log('node.each.child.identifier', );

                                //console.log('arp', arp);
                                //console.log('arp.child.count', arp.child.count);
                                //console.log('arp.child.shared.type', arp.child.shared.type);

                                if (arp.child.shared.type === 'Identifier') {
                                    arp.query.each.child.exe(id => {
                                        //console.log('id', id);
                                        //console.log('id.name', id.name);
                                        found_key(id.name);
                                    })
                                } else {
                                    throw 'stop';
                                }
                            } else {
                                throw 'stop';
                            }
                            
                        } else {

                            // check for 

                            //

                            if (node.child_nodes[0].is_identifier) {
                                console.log('node.child_nodes[1].category', node.child_nodes[1].category);

                                if (node.child_nodes[1].category === 'Expression') {
                                    //found_key(node.child_nodes[0].name);

                                    // No, the keys are not like this, they are inner.
                                    //  Possibly a prompt to improve the query system and have keys use that or be part of it.


                                } else {
                                    //throw 'NYI';
                                }

                                

                            } else {
                                //console.log('node.child_nodes', node.child_nodes);

                                if (node.child_nodes[0].type === 'ObjectPattern') {
                                    const opa = node.child_nodes[0];
                                    if (opa.child.shared.type === 'ObjectProperty') {
                                        each(opa.child_nodes, opr => {
                                            //console.log('opr', opr);
                                            //console.log('opr.source', opr.source);

                                            if (opr.child.count === 1) {
                                                const id = opr.child_nodes[0];
                                                if (id.is_identifier) {
                                                    found_key(id.name);
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
                                    throw 'stop';
                                }

                                //throw 'stop';
                            }
                        }

                    } else {

                        // variable declarator with a single identifier inside...
                        //  

                        // probably seems worth ignoring for now.... except logging it.

                        console.log('');
                        console.log('**node', node);
                        console.log('**node.source', node.source);
                        console.log('');

                        //throw 'NYI';
                    }
                }
                return keys;
            },
            enumerable: true,
            configurable: false
        });
    }
}

module.exports = JS_AST_Node_Feature_Declarator;