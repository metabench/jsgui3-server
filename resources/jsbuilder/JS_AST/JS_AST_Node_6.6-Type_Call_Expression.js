// const babel_node_tools = require('../babel/babel_node_tools');

const { each } = require('lang-mini');
const JS_AST_Node_Type_Identifier = require('./JS_AST_Node_6.5-Type_Identifier');

//const Query_Result = require('./query/Query_Result');

// The QFM seems like it should be global, or relate to the root node.
//  Or a single one gets created once programmatically and the nodes use it.


// Right now though, the functions apply to that node.
//  Seems like functions will need rewriting to apply in a general case to any node.
//   Likely worth doing that later on...?

// This index will need to provide functions relevant to the node - so it will have to be per node.
//  Possibly / always it will have preloaded ngrams though.

// For the moment, get it working. The functions were always declared within the context of the node they operate in and its been convenient in many ways, maybe essential in some.

// later on, the index could at least know the name of the function to call, so could call the function of the specific node.




//


// JS_AST_Node_Query_Capable?
//  As we want a JS_AST_Node_Query class???

class JS_AST_Node_Type_Call_Expression extends JS_AST_Node_Type_Identifier {
    constructor(spec = {}) {
        super(spec);
        
        if (this.type === 'CallExpression') {



            Object.defineProperty(this, 'is_call_expression', {
                get() { 
                    return true;
                },
                enumerable: true,
                configurable: false
            });
            Object.defineProperty(this, 'is_callexpression', {
                get() { 
                    return true;
                },
                enumerable: true,
                configurable: false
            });

            Object.defineProperty(this, 'is_require_call', {
                get() { 
                    //console.log('this', this);
                    //console.log('this.child.count', this.child.count);


                    // none set up yet.

                    //throw 'stop';

                    if (this.child.count > 0 && this.nav('0').name === 'require') {
                        return true;
                    }

                    return false;

                    //throw 'stop';
                    //return true;
                },
                enumerable: true,
                configurable: false
            });

            Object.defineProperty(this, 'required_module_path', {
                get() { 

                    //if (this.nav('0').name === 'require') {
                    //    return true;
                    //}

                    if (this.is_require_call) {
                        const c1 = this.nav('1');

                        if (c1.t === 'SL') {
                            return c1.value;
                        } else {
                            throw 'stop';
                        }
                    } 

                    

                    

                    //throw 'stop';
                    //return true;
                },
                enumerable: true,
                configurable: false
            });
            


        }
    }
}

module.exports = JS_AST_Node_Type_Call_Expression;