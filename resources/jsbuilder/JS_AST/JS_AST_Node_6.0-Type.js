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