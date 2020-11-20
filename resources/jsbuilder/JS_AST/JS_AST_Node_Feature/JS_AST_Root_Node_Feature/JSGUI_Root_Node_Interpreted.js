// Similar in purpose to a document feature.

// Will be used to handle special cases / unusual ways of declaring exports.

// So the root node could itself feature exports.

// So a feature could be that JSGUI_AST_Interpreter understands it and understands what it's about.
//  However, want the Interpreter to itself be / act as a node within the AST.

// JSGUI_AST_Root_Node_Interpretation

// So it loads the node, an also applies higher level special case rules.
//  If it does not recognise how a JS file works, then program in the special rules that will allow it to.
//  Normal types of syntax should be covered on a lower level. This special case system will allow that to
//  not accumulate too much code clutter and continue to be a nice codebase. 

// So the feature would be 'JSGUI Interpreted'.

// At least special case rules and interpretation can be as lengthy as required to do the task, and stay out of the way of lower level parts.



const Root_Node_Interpreted = require('./JS_AST_Root_Node_Interpreted');



class JSGUI_Root_Node_Interpreted extends Root_Node_Interpreted {
    constructor(spec) {
        super(spec);


        // .exported.type      'object', 'class'
        // .exported.keys

    }
}


module.exports = JSGUI_Root_Node_Interpreted;



