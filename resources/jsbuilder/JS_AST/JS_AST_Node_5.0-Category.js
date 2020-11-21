const JS_AST_Node_Index = require('./JS_AST_Node_4.1-Index');

const {type_abbreviations, map_expression_categories, map_literal_categories, map_statement_categories, map_categories} = require('../babel/babel_consts');




class JS_AST_Node_Category extends JS_AST_Node_Index {
    constructor(spec = {}) {
        super(spec);

        Object.defineProperty(this, 'category', {
            get() { 
                //console.log('babel', babel);
                //console.log('babel_node', babel_node);
                //console.log('babel.node', babel.node);
                return this.babel.category;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'cat', {
            get() { 
                throw 'NYI'
                //console.log('babel', babel);
                //console.log('babel_node', babel_node);
                //console.log('babel.node', babel.node);
                return babel.abbreviated_category;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

    }
}

module.exports = JS_AST_Node_Category;