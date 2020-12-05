const JS_AST_Node_Category_Pattern = require('./JS_AST_Node_5.4-Category_Pattern');
const JS_AST_Node_Feature_Declaration = require('./JS_AST_Node_Feature/JS_AST_Node_Feature_Declaration');

class JS_AST_Node_Category_Declaration extends JS_AST_Node_Category_Pattern {
    constructor(spec = {}) {
        super(spec);

        Object.defineProperty(this, 'is_declaration', {
            get() { 
                return this.babel.is_declaration;
            },
            enumerable: true,
            configurable: false
        });

        if (this.is_declaration) {

            // include the declaration feature here?
            //  

            const declaration = new JS_AST_Node_Feature_Declaration({ // some of the code is out of the way - maybe it will get complex / longwinded?
                node: this
            });


            // .object_entries...
            //  declared and assigned

            // .assigned.entries?

            


            // then direct property access...

            Object.defineProperty(this, 'declared', {
                get() { 
                    return declaration.declared;
                },
                enumerable: true,
                configurable: false
            });

            Object.defineProperty(this, 'assigned', {
                get() { 
                    return declaration.assigned;
                },
                enumerable: true,
                configurable: false
            });


            // Likely a property directly here rather than in feature?
            //  or a function that is specific to declarations and gets the names of whatever is declared.

            


            // But outside of / on a lower level to the feature, more commands and queries to enable better access to declarations would help.



            // declaration.declared.keys
            // Set up retrieval of info on what is declared.

            //  .declared property?
            // .declared.keys

            // .declared makes for good syntax to access the data.
            //   make use of inner class declaration and variable declaration and declarator nodes.
            //    more detailed code on them will enable the declaration category to work well.

            this.declaration = declaration;
        }
    }
}

module.exports = JS_AST_Node_Category_Declaration;