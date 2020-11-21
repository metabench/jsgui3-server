// When a declaration is treated as a feature, there is programming less specifically for it being a node.

// Feature is an abstraction on top of JS_AST_Node.
const {each} = require('lang-mini');

const JS_AST_Node_Feature = require('./JS_AST_Node_Feature');

class JS_AST_Node_Feature_Declarator extends JS_AST_Node_Feature {
    constructor(spec = {}) {
        super(spec);
        const {node} = this;

        let keys;
        Object.defineProperty(this, 'keys', {
            get() { 

                if (!keys) {
                    keys = [];

                    const found_key = key => {
                        keys.push(key);
                    }

                    console.log('node', node);
                    console.log('node.source', node.source);

                    // are there 2 child nodes?

                    // array pattern and array expression

                    if (node.child.count === 2) {
                        if (node.child_nodes[0].type === 'ArrayPattern' && node.child_nodes[1].type === 'ArrayExpression') {

                            const [arp, are] = node.child_nodes;

                            if(arp.child.count === are.child.count) {
                                //console.log('node.each.child.identifier', );

                                console.log('arp', arp);
                                console.log('arp.child.count', arp.child.count);
                                console.log('arp.child.shared.type', arp.child.shared.type);

                                if (arp.child.shared.type === 'Identifier') {
                                    arp.each.child(id => {
                                        console.log('id', id);
                                        console.log('id.name', id.name);
                                        found_key(id.name);
                                    })
                                } else {
                                    throw 'stop';
                                }
                            }


                            
                        } else {
                            throw 'stop';
                        }

                    } else {
                        throw 'NYI';
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