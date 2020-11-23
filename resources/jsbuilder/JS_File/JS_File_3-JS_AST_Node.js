const JS_File_Babel = require('./JS_File_2-Babel');
const JS_AST_Node = require('../JS_AST/JS_AST_Node');

//const JS_AST_Node_Root_Interpreted = require('../JS_AST/JS_AST_Node_Feature/JS_AST_Root_Node_Feature/JS_AST_Root_Node_Interpreted');

const JS_AST_Node_Root_Interpreted = require('../JS_AST/JS_AST_Node_Feature/JS_AST_Root_Node_Feature/JS_AST_Root_Node_Interpreted');

class JS_File_JS_AST_Node extends JS_File_Babel {
    constructor(spec) {
        super(spec);0

        // This looks like the place to create the mirror of the Babel structure.
        //  Respond to ast-ready.

        let js_ast_node_file;
        let node_body, node_root;

        this.on('parsed-ast', e_parsed_ast => {

            //console.log('e_parsed_ast', e_parsed_ast);
            //throw 'stop';

            // This is the point where the mirror AST_Node construction gets made.
            //  Each of these nodes will have a path from the root of the document.

            // Will later work on 

            // Create an AST node that represents the document.
            //  then there will be a body node

            //console.log('e_parsed_ast', e_parsed_ast);
            //throw 'stop';

            // Make a root node with extra feature detection capabilities.
            //  with

            // The root node is the file node. That's questionable though.
            //  Prefer to think of the body root.
            //  But need to start saying body rather than root.


            js_ast_node_file = new JS_AST_Node_Root_Interpreted({
                babel_node: e_parsed_ast.value,
                source: this.source,
                root_node: true
            });

            node_root = js_ast_node_file;
            //console.log('Object.keys(js_ast_node_file)', Object.keys(js_ast_node_file));
            //console.log('(js_ast_node_file.type)', (js_ast_node_file.type));
            //const node_body = js_ast_node_file.child_nodes[0].child_nodes[0];
            node_body = js_ast_node_file.child_nodes[0];

            //console.log('(node_body.type)', (node_body.type));
            //throw 'stop';

            this.raise('parsed-node_body', {
                value: node_body
            });

            this.raise('parsed-js_ast', {
                value: js_ast_node_file
            });

            //console.log('js_ast_node_file', js_ast_node_file);
            //console.log('js_ast_node_file.type', js_ast_node_file.type);
            //console.log('js_ast_node_file.babel.type', js_ast_node_file.babel.type);
            //console.log('js_ast_node_file.babel.node', js_ast_node_file.babel.node);
            //throw 'stop';
        });

        Object.defineProperty(this, 'js_ast_node_file', {
            get() { 
                return js_ast_node_file;
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'node_root', {
            get() { 
                return node_root;
            },
            enumerable: true,
            configurable: false
        });

    }
}

module.exports = JS_File_JS_AST_Node;
