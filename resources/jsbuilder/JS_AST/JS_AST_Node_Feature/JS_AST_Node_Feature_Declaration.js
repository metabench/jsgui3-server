// When a declaration is treated as a feature, there is programming less specifically for it being a node.

// Feature is an abstraction on top of JS_AST_Node.
const {each} = require('lang-mini');

const JS_AST_Node_Feature = require('./JS_AST_Node_Feature');

class JS_AST_Node_Feature_Declaration extends JS_AST_Node_Feature {
    constructor(spec = {}) {
        super(spec);
        const {node} = this;

        let keys;

        // Maybe should be .declared.keys?

        Object.defineProperty(this, 'keys', {
            get() { 
                if (!keys) {

                    // Can try the get_object_keys function???

                    keys = [];

                    if (node.type === 'VariableDeclaration') {
                        //console.log('node', node);
                        //const ks = node.query.collect.child.variabledeclarator.exe().query.collect.id.name.exe();
                        const vdars = node.query.collect.child.variabledeclarator.exe();
                        //console.log('vdars', vdars);
                        //console.log('vdars[0].id', vdars[0].id);
                        const collected_keys = vdars.query.collect.id.name.exe();
                        each(collected_keys, key => keys.push(key));
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
                            each(dtr_keys, key => keys.push(key));
                        });
                    } else {

                        // Seems like class definitions are not iterating right...?

                        console.log('vdrs.length', vdrs.length);

                        if (vdrs.length === 0) {
                            if (this.node.type === 'ClassDeclaration') {
                                const key = this.node.child_nodes[0].name;
                                console.log('key', key);

                                if (key !== undefined) {
                                    keys.push(key);
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
                return keys;
            },
            enumerable: true,
            configurable: false
        });
        


    }
}

module.exports = JS_AST_Node_Feature_Declaration;