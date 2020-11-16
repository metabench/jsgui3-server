class JS_AST_Node_Feature {
    constructor(spec = {}) {
        let name, type;

        let js_ast_node, index_in_js_ast_node, value_name;

        if (spec.name) {
            name = spec.name;
        }
        if (spec.type) {
            type = spec.type;
        }

        if (spec.js_ast_node) { //check / confirm type?
            js_ast_node = spec.js_ast_node;
        }

        if (spec.index_in_js_ast_node !== undefined) {
            index_in_js_ast_node = spec.index_in_js_ast_node;
        }

        Object.defineProperty(this, 'name', {
            get() {
                return name;
            },
            set(v) { name = v; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'value_name', {
            get() {
                return value_name;
            },
            set(v) { value_name = v; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'js_ast_node', {
            get() { 
                return js_ast_node;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'index_in_js_ast_node', {
            get() { 
                return index_in_js_ast_node;
            },
            set(v) { index_in_js_ast_node = v; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
    }
}
module.exports = JS_AST_Node_Feature;