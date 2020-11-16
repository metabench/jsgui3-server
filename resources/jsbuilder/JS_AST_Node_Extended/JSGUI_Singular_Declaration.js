const JS_AST_Node = require('../JS_AST/JS_AST_Node');
const JS_AST_Node_Babel = require('../JS_AST/JS_AST_Node');

class JSGUI_Singular_Declaration extends JS_AST_Node {
    constructor(spec) {

        // Will be one of the simpler features to recognise.

        // A declaration where only one thing gets declared.
        //  Makes sense as an abstraction to use.
        //  Declarations may wind up joined together as output.
        //  They also may be taken apart as input.

        // Lots of singular declarations can be extracted from lang-mini






        // Signature of:
        //   VDn(VDr(ID,x))
        //    x means that anything inside can change, ie it's an expression of some sort.

        // how about .is_expression property?
        //  would depend on the type I expect.



        // These could be found and extracted from JS files.
        //  Maybe Structure_Pattern would be better.
        //   Then extract data from specific and easy to reference parts of it.



        // Won't be compatable with all AST nodes.

        // If it's with an incompatable node, switch the JSGUI declaration specific functionality off.

        // Needs to have a single item being declared...?
        //  Though how about arrays.

        // Some relatively simple rules and queries to see if something is a declaration.







        super(spec);

        // Name property will work differently...?

        Object.defineProperty(this, 'name', {
            get() { return 'JV'; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
    }
}

// Would be useful to get right elsewhere.
//  Or outputting what would go into the constructor of the next one.


// Method to see if a JS_AST_Node is JSGUI_Declaration compatable.
//  Declatations will essentially be for a single item.
//   eg lang-mini will contain lots  of declarations.

// Declarations will need to be in the right order in many situations.
//  There will be a lot more in local scope, more things brought local within a large application.
//  Classes that do very different things. Maybe even with the same original names, but will have to be renamed to different things if in the same scope.




JSGUI_Singular_Declaration.from_js_ast_node = (js_ast_node) => {
    // Would be in a different context / no context when it gets made.

    throw 'NYI';

}

module.exports = JSGUI_Singular_Declaration;