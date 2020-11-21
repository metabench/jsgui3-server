class JS_AST_Node_Feature {

    // Feature_Declaration subclass too?
    //  


    constructor(spec = {}) {
        //let name, type;

        let node, value_name;

        if (spec.name) {
            name = spec.name;
        }
        //if (spec.type) {
        //    type = spec.type;
        //}

        if (spec.js_ast_node) { //check / confirm type?
            node = spec.js_ast_node;
        } else if (spec.node) { //check / confirm type?
            node = spec.node;
        }

        /*
        if (spec.index_in_js_ast_node !== undefined) {
            index_in_node = spec.index_in_js_ast_node;
        } else if (spec.index_in_node !== undefined) {
            index_in_node = spec.index_in_node;
        }
        */

        /*
        Object.defineProperty(this, 'name', {
            get() {
                return name;
            },
            set(v) { name = v; },
            enumerable: true,
            configurable: false
        });
        */

        /*
        Object.defineProperty(this, 'value_name', {
            get() {
                return value_name;
            },
            set(v) { value_name = v; },
            enumerable: true,
            configurable: false
        });
        */
        Object.defineProperty(this, 'node', {
            get() { 
                return node;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // Maybe don't need this, with improved sibling and index property in the node itself.

        /*
        Object.defineProperty(this, 'index_in_node', {
            get() { 
                return index_in_js_ast_node;
            },
            set(v) { index_in_js_ast_node = v; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        */
    }
}
module.exports = JS_AST_Node_Feature;