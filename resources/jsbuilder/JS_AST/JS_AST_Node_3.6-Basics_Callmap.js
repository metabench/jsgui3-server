//const babel_node_tools = require('../babel/babel_node_tools');
// Index before query would help.

// Will index the occurrances of various nodes / things.
// Could get more into tree pattern checking too, declaratively saying what to look for and looking for multiple things at once with signature comparisons in a map.

// Indexing at every level looks like it would be useful.
//  so in order to get the info about how the names relate to nodes we consult indexes.

const { each } = require('lang-mini');
const JS_AST_Node_Basics_Find = require('./JS_AST_Node_3.5-Basics_Find');
const JS_AST_Node_Indexes = require('./JS_AST_Node_4.0-Index_Indexes');


// Callmap being it raises different calls depending on what it finds.
//  so it runs a string serialization on the node...?
//   would be a simple way to do callmap for types.




class JS_AST_Node_Index extends JS_AST_Node_Basics_Find {
    constructor(spec = {}) {
        super(spec);
        const {deep_iterate, each_child_node, inner, child} = this;

        const each_inner_node = (callback) => {
            deep_iterate(inode => {
                if (this !== inode) callback(inode);
            })
        }
        //const callmap = {};

        const callmap = (fntostring, map_handlers, default_handler) => {
            const str = fntostring(this);
            // such as get the signature
            let res;
            if (map_handlers[str]) {
                res = map_handlers[str](this);
            } else {
                if (default_handler) res = default_handler(this);
            }
            return res;
        }

        const callmap_deep_iterate = (fntostring, map_handlers, default_handler) => {
            deep_iterate(node => {
                node.callmap(fntostring, map_handlers, default_handler);
            })
        }
        const callmap_child_nodes = (fntostring, map_handlers, default_handler) => {
            each_child_node(node => {
                node.callmap(fntostring, map_handlers, default_handler);
            })
        }
        const callmap_inner_nodes = (fntostring, map_handlers, default_handler) => {
            each_inner_node(node => {
                node.callmap(fntostring, map_handlers, default_handler);
            })
        }

        const signature_callmap_deep_iterate = (map_handlers, default_handler) => callmap_deep_iterate(node => node.signature, map_handlers, default_handler);
        const signature_callmap_child_nodes = (map_handlers, default_handler) => callmap_child_nodes(node => node.signature, map_handlers, default_handler);
        const signature_callmap_inner_nodes = (map_handlers, default_handler) => callmap_child_nodes(node => node.signature, map_handlers, default_handler);
        // 

        this.callmap = callmap;
        this.callmap_deep_iterate = callmap_deep_iterate;
        this.callmap_child_nodes = callmap_child_nodes;
        this.callmap_inner_nodes = callmap_inner_nodes;
        this.signature_callmap_deep_iterate = signature_callmap_deep_iterate;
        this.signature_callmap_child_nodes = signature_callmap_child_nodes;
        this.signature_callmap_inner_nodes = signature_callmap_inner_nodes;
    }
}
module.exports = JS_AST_Node_Index;