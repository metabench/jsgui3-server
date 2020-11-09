const JS_File_Babel = require('./JS_File_2-Babel');
const JS_AST_Node = require('../JS_AST/JS_AST_Node');
class JS_File_JS_AST_Node extends JS_File_Babel {
    constructor(spec) {
        super(spec);

        const {each_babel_root_node} = this;

        const each_root_node = callback => each_babel_root_node(body_node => callback(new JS_AST_Node({
            babel_node: body_node,
            full_source: this.source
        })));
            //throw 'stop';

        this.each_root_node = each_root_node;


        Object.defineProperty(this, 'root_nodes', {
            // Using shorthand method names (ES2015 feature).
            // This is equivalent to:
            // get: function() { return bValue; },
            // set: function(newValue) { bValue = newValue; },
            get() { 
                const res = [];
                //return root_babel_declarations; 
                each_root_node(root_node => {
                    res.push(root_node);
                })
                return res;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // root nodes that are single variable declarations.
        // that are multiple variable declarations.

        const filter_each_root_node = this.filter_each_root_node = (fn_filter, callback) => {
            each_root_node(root_node => {
                if (fn_filter(root_node)) callback(root_node);
            })
        }

        const each_root_declaration = this.each_root_declaration = (callback) => {
            filter_each_root_node(node => node.is_declaration, (node => {
                callback(node);
            }));
        }

    }
}

module.exports = JS_File_JS_AST_Node;
