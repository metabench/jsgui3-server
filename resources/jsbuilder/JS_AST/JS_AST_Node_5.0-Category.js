const JS_AST_Node_Index = require('./JS_AST_Node_4.1-Index');

const {type_abbreviations, map_expression_categories, map_literal_categories, map_statement_categories, map_categories} = require('../babel/babel_consts');


// Could get its category discerner from the root / the js_file?

// is there a .js_file property?

// .root.js_file property?

// Yes, will need to categorise various nodes
//  At least by noting some known signatures, and they would have associated names.

// Maybe call them Signature Matchers?
//  Maybe they will be a tag or flag type of category.




class JS_AST_Node_Category extends JS_AST_Node_Index {
    constructor(spec = {}) {
        super(spec);


        // other types of category

        // // could be assigned categories depending on patterns found.
        //  category in terms of program role

        // what it does
        //  usage category.

        // let's have a usage category property.

        let usage_category;
        Object.defineProperty(this, 'usage_category', {
            get() {
                return usage_category;
            },
            set(value) { usage_category = value; },
            enumerable: true,
            configurable: false
        });

        // Measuring the usage category...
        //  A single class that discerns the usage category would be best.
        //   AST_Node_Usage_Category_Discerner




        Object.defineProperty(this, 'type_category', {
            get() { 
                //console.log('babel', babel);
                //console.log('babel_node', babel_node);
                //console.log('babel.node', babel.node);
                return this.babel.type_category;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'cat', {
            get() { 
                //throw 'NYI'
                //console.log('babel', babel);
                //console.log('babel_node', babel_node);
                //console.log('babel.node', babel.node);
                return this.babel.abbreviated_type_category;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'abbreviated_type_category', {
            get() { 
                //throw 'NYI'
                //console.log('babel', babel);
                //console.log('babel_node', babel_node);
                //console.log('babel.node', babel.node);
                return this.babel.abbreviated_type_category;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

    }
}

module.exports = JS_AST_Node_Category;