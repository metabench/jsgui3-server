// When a declaration is treated as a feature, there is programming less specifically for it being a node.

// Feature is an abstraction on top of JS_AST_Node.
const {each} = require('lang-mini');

const JS_AST_Node_Feature = require('./JS_AST_Node_Feature');

class JS_AST_Node_Feature_Declaration extends JS_AST_Node_Feature {
    constructor(spec = {}) {
        super(spec);
        const {node} = this;

        let keys;
        Object.defineProperty(this, 'keys', {
            get() { 
                if (!keys) {
                    keys = [];
                    const vdrs = node.select.child(node => node.type === 'VariableDeclarator');
                    if (vdrs.length > 0) {
                        //console.log('vdrs', vdrs);
                        each(vdrs, vdr => {
                            const dtr = vdr.declarator;
                            //console.log('dtr', dtr);
                            const dtr_keys = dtr.keys;
                            //console.log('dtr_keys', dtr_keys);
                            each(dtr_keys, key => keys.push(key));
                        });
                    } else {
                        throw 'NYI';
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