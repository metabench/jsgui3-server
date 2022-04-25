const JS_AST_Node_Category_Statement = require('./JS_AST_Node_5.6-Category_Statement');

const {type_abbreviations, map_expression_categories, map_literal_categories, map_statement_categories, map_categories} = require('../babel/babel_consts');
class JS_AST_Node_Type extends JS_AST_Node_Category_Statement {
    constructor(spec = {}) {
        super(spec);

        Object.defineProperty(this, 'type', {
            get() { return this.babel.node.type; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'abbreviated_type', {
            get() { 
                const abb = type_abbreviations[this.babel.node.type];
                // Maybe need a load more abbreviations now there are more babel types.

                if (abb) {
                    return abb;
                } else {
                    console.log('this.babel.node.type', this.babel.node.type);
                    throw 'stop';
                }
               
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 't', {
            get() { 
                return this.abbreviated_type;
               
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
    }
}

module.exports = JS_AST_Node_Type;



// Declaration and declarator seem like among the most important types to focus on for the moment.
//  A very important objective is to find out about what is declared within a piece of code.
//  Will get these queries, and possibly a small layer on top, getting the relevant info about the files that get used to build the jsgui client application.

// There will be a variety of files and structures to test. As far as reasonable, there will be general purpose interpretation functions being used, want to get it working in
//  some less standard file arrangements, such as exporting the result of a function call. So long as that code is out of the way (OK within this large structure), and only used in the
//  cases where it is relevant, then it's good to have it in there. Will later get the build system correctly interpreting details from a variety of files, specifically react files will
//  be one of the first to be incorporated into the jsgui build system.







// Then have declaration types
//  Class declaration
//  Variable declaration (which includes const)

// Declarator types

// Functionality to enable to effective querying of specific types of nodes, to get data out of them in an easy way.
//  Declaration keys
//  Declaration map_key_to_js_ast_node
//   will match up the object and array deconstruction.

// Continue trying the system with various pieces of syntax, and get out the required data in a simple way.
//  Get it expressed in a nice query (can use filter and select functions) and have specific functions that will be used / needed to interpret imports, exports, and some of the things that
//  come in between.

// More work on scope analysis / iteration / rules?

//  visible_to? so is a node somewhere in the document visible to another node?
//  leave scope itself for the moment from the core, but see if we can get good iteration through it with a simple function, and / or simple rules.








