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

        const filter_deep_iterate = (fn_filter, max_depth, callback) => {

            if (!callback && typeof max_depth === 'function') {
                callback = max_depth;
                max_depth = undefined;
            }

            deep_iterate(max_depth, (js_ast_node, depth, path) => {
                if (fn_filter(js_ast_node)) callback(js_ast_node, path, depth);
            })
        }

        const inner_deep_iterate = (max_depth, callback) => {
            if (!callback && typeof max_depth === 'function') {
                callback = max_depth;
                max_depth = undefined;
            }
            filter_deep_iterate(js_ast_node => js_ast_node !== this, max_depth, callback);
        }

        const typed_deep_iterate = (babel_type, max_depth, callback) => {
            if (!callback && typeof max_depth === 'function') {
                callback = max_depth;
                max_depth = undefined;
            }
            filter_deep_iterate(js_ast_node => js_ast_node.type === babel_type, max_depth, callback);
        }
        const each_child_node = callback => each(this.child_nodes, callback);

        const filter_each_child_node = (filter, callback) => each_child_node(js_ast_node => {
            if (filter(js_ast_node)) {
                callback(js_ast_node);
            }
        });

        const select_child_nodes = fn_select => {
            const res = [];
            filter_each_child_node(fn_select, cn => res.push(cn));
            return res;
        }
        
        const filter_inner_deep_iterate = (filter, callback) => inner_deep_iterate((node) => filter(node) ? callback(node) : undefined)
        const each_inner_node_of_type = (type, callback) => {
            filter_inner_deep_iterate(node => node.type === type, node => callback(node));
        }





        // .collect (gets them in an array)
        // .select (uses a selection filter)

        const select_child_nodes = (selector) => {
            const res = [];
            filter_each_child_node(selector, cn => res.push(cn));
            return res;
        }

        // only finds the first
        const find_child_node = (finder, callback) => {
            let res;
            each_child_node((cn, idx, stop) => {
                if (finder(cn)) {
                    res = cn;
                    stop();
                }
            });
            return res;
        }

        this.deep = {
            iterate: deep_iterate,
            filter: filter_deep_iterate
        }

        this.inner = {
            iterate: inner_deep_iterate,
            filter: filter_inner_deep_iterate
        }



        const child = this.child = {
            collect: {

            },
            //each: each_child_node,
            //filter: filter_each_child_node,
            find: find_child_node,
            select: select_child_nodes,
            shared: {

            }
        }

        Object.defineProperty(this.child, 'first', {
            get() { 
                if (child_nodes.length > 0) {
                    return child_nodes[0];
                }
                
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this.child, 'last', {
            get() { 
                if (child_nodes.length > 0) {
                    return child_nodes[child_nodes.length - 1];
                }
                
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this.child, 'count', {
            get() { 
                return child_nodes.length;
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this.child, 'nodes', {
            get() { 
                return child_nodes;
            },
            enumerable: true,
            configurable: false
        });

        let child_shared_type;

        Object.defineProperty(this.child.shared, 'type', {
            get() { 
                if (child_shared_type === undefined) {
                    child.each((cn, idx, stop) => {
                        if (child_shared_type === undefined) {
                            child_shared_type = cn.type;
                        } else {
                            if (cn.type === child_shared_type) {
                                // all good
                            } else {
                                child_shared_type = false;
                                stop();
                            }
                        }

                    })
                }
                return child_shared_type;
                //return child_nodes.length;
            },
            enumerable: true,
            configurable: false
        });
        // then this.child.each
        //  this.child.deep  effectively this inner

        let arr_child_types;

        Object.defineProperty(this.child.collect, 'type', {
            get() { 
                if (arr_child_types === undefined) {
                    arr_child_types = [];
                    child.each((cn, idx, stop) => {
                        arr_child_types.push(cn.type);
                    })
                }
                return arr_child_types;
            },
            enumerable: true,
            configurable: false
        });

        let arr_child_categories;

        Object.defineProperty(this.child.collect, 'category', {
            get() { 
                if (arr_child_categories === undefined) {
                    arr_child_categories = [];
                    child.each((cn, idx, stop) => {
                        arr_child_categories.push(cn.category);
                    })
                }
                return arr_child_categories;
            },
            enumerable: true,
            configurable: false
        });


        // Will remove these, change the API, will use more dots and objects.
        //  Will follow more of a pattern and be quite cool.
        this.each_child_node = each_child_node;
        this.typed_deep_iterate = typed_deep_iterate;
        this.filter_each_child_node = filter_each_child_node;
        this.filter_deep_iterate = filter_deep_iterate;
        this.inner_deep_iterate = inner_deep_iterate;
        this.each_inner_node_of_type = each_inner_node_of_type;


        // each, filter, collect, select

        Object.assign(this, {
            each: {
                child: each_child_node
            },
            filter: {
                child: filter_each_child_node
            },
            collect: {
                child: this.child_nodes
            },
            select: {
                child: select_child_nodes
            }
        })
    }
}

JS_AST_Node_Core.from_spec = spec => {
    return new JS_AST_Node_Core(spec);
}

// from_string?

module.exports = JS_AST_Node_Core;