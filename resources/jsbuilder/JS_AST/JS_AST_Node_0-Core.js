const {each} = require('lang-mini');

class JS_AST_Node_Core {
    constructor(spec = {}) {

        // When constructered, and given source, is root, and does not already have a babel node in the spec, will parse the source with the babel parser.
        //  

        // Depth
        // Path

        // Source
        let root_node, parent_node, sibling_index;
        const child_nodes = [];

        let depth, path;
        let full_source; // only for the root.

        //console.log('JS_AST_Node_Core Object.keys(spec)', Object.keys(spec));

        if (spec.root_node) {
            if (spec.root_node === true) {
                root_node = this;
            } else {
                root_node = spec.root_node;
            }
        }
        if (spec.parent_node) {
            parent_node = spec.parent_node;
        }
        if (typeof spec.sibling_index === 'number') {
            sibling_index = spec.sibling_index;
        }

        if (!parent_node) {
            root_node = this;
        }

        if (root_node === this) {
            if (spec.source) {
                full_source = spec.source;
            }
        }


        const idx_named_nodes = {};

        const get_arr_named_node = (name) => {
            idx_named_nodes[name] = idx_named_nodes[name] || [];
            return idx_named_nodes[name];
        }

        const index_named_node = (name, node) => get_arr_named_node(name).push(node);
        
        

        let next_sibling_node, previous_sibling_node;



        Object.defineProperty(this, 'source', {
            get() { 
                //console.log('full_source', full_source);
                if (full_source) {
                    return full_source;
                } else {
                    if (this.root_node && this.root_node !== this) {
                        const rn = this.root_node;

                        const {babel} = this;
                        if (babel) {
                            const {start, end} = babel;
                            const full_source = this.root_node.source;
                            //console.log('full_source', full_source);
                            return full_source.substring(start, end);
                        }
                    }
                }

                //return source;
            },
            enumerable: true,
            configurable: false
        });

        if (typeof spec.depth === 'number') {
            depth = spec.depth;
            
        } else {
            depth = 0;
        }
        if (typeof spec.path === 'string') {
            path = spec.path;
        } else {
            path = '/';
        }

        this.append_child = (js_ast_node) => {
            child_nodes.push(js_ast_node);
        }
        this.create_append_child = (spec) => {
            const spec2 = {
                babel_node: spec.babel_node,
                parent_node: this,
                root_node: this.root_node,
                path: spec.path
            }

            //const res = new this.constructor(spec2);
            // a from_spec function could load up specific subtypes.

            const res = this.constructor.from_spec(spec2);
            //console.log('');
            //console.log('create_append_child res.path', res.path);
            //console.log('create_append_child res.type', res.type);
            this.append_child(res);
            return res;
        }

        Object.defineProperty(this, 'parent_node', {
            get() { 
                return parent_node;
            },
            enumerable: true,
            configurable: false
        });


        this.remove = () => {
            const {parent_node} = this;
            if (parent_node) {
                const i = parent_node.child_nodes.indexOf(this);
                if (typeof i === 'number') {
                    parent_node.child_nodes.splice(i, 1);
                }
            }
        }


        /*
            // Remove node - tell the parent to remove that node from its childnodes.

            function removeItemOnce(arr, value) {
                var index = arr.indexOf(value);
                if (index > -1) {
                    arr.splice(index, 1);
                }
                return arr;
            }

        */


        Object.defineProperty(this, 'root_node', {
            get() { 
                return root_node;
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'is_root', {
            get() { 
                return root_node === this;
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'child_nodes', {
            get() { 
                return child_nodes;
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'depth', {
            get() { 
                return depth;
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'path', {
            get() { 
                return path;
            },
            enumerable: true,
            configurable: false
        });

        const deep_iterate_INNER = (depth, path, common, callback) => {
            const {max_depth, stop} = common;
            let sibling_number = 0;

            callback(this, path, depth, stop);
            //console.log('max_depth', max_depth);

            //console.log('child_nodes', child_nodes);
            //console.log('child_nodes.length', child_nodes.length);

            if (child_nodes.length > 0 && max_depth === undefined || max_depth === false || depth <= max_depth) {
                each(child_nodes, child_node => {
                    //console.log('child_node', child_node);
                    child_node.deep_iterate_INNER(depth + 1, path + sibling_number++ + '/', common, callback);
                });
            }
        }

        const deep_iterate = (max_depth, callback) => {
            if (!callback && typeof max_depth === 'function') {
                callback = max_depth;
                max_depth = undefined;
            }

            const common = {
                max_depth: max_depth,
                stopped: false,
                stop: () => {
                    common.stopped = true;
                }
            }

            

            deep_iterate_INNER(depth, path, common, callback);
        }
        this.deep_iterate_INNER = deep_iterate_INNER;
        this.deep_iterate = deep_iterate;

        // Moved down from Query - these are the basics, makes sense in core???

        const each_child_node = callback => each(this.child_nodes, callback);

        const filter_each_child_node = (filter, callback) => each_child_node(js_ast_node => {
            if (filter(js_ast_node)) {
                callback(js_ast_node);
            }
        });

        this.each_child_node = each_child_node;
        this.filter_each_child_node = filter_each_child_node;

        

    }
}

JS_AST_Node_Core.from_spec = spec => {
    return new JS_AST_Node_Core(spec);
}

// from_string?

module.exports = JS_AST_Node_Core;