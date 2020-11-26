//const babel_node_tools = require('../babel/babel_node_tools');
// Index before query would help.

// Will index the occurrances of various nodes / things.
// Could get more into tree pattern checking too, declaratively saying what to look for and looking for multiple things at once with signature comparisons in a map.

// Indexing at every level looks like it would be useful.
//  so in order to get the info about how the names relate to nodes we consult indexes.

const { resolvePlugin } = require('@babel/core');
const { each } = require('lang-mini');
const JS_AST_Node_Basics_Callmap = require('./JS_AST_Node_3.6-Basics_Callmap');

class Navigation_Path {
    constructor(spec = {}) {

        const arr_path = [];

        this.push_child = index => {
            arr_path.push(index);
        }

        this.push_parent = () => {
            arr_path.push(-1);
        }

        this.arr_path = arr_path;
    }
}

class JS_AST_Node_Navigate extends JS_AST_Node_Basics_Callmap {
    constructor(spec = {}) {
        super(spec);
        const {deep_iterate, inner, child} = this;

        const navigate = function(path) {
            // parse the path.

            const a = arguments, al = a.length;
            if (al === 1) {
                if (Array.isArray(a[0])) {

                    const res = [];
                    each(a[0], item => {
                        //console.log('* item', item);
                        res.push(this.navigate(item))
                    });
                    return res;

                } else if (typeof a[0] === 'string') {

                    let res = path;

                    const parse_path = path => {
                        // could do it character by cvharacter for fun and security.
                        const res = new Navigation_Path();
                        const maybe_too_elaborate = () => {
                            let pos = 0;
                            let char;
                            const l = path.length;

                            let str_path_so_far;

                            const handle_char = (char) => {
                                console.log('char', char);

                                // on the lookout for ../
                            }
                            while (pos < l) {
                                handle_char(path[pos++]);
                            }
                        }

                        const spath = path.split('/');
                        each(spath, path_item => {
                            if (path_item === '..') {
                                res.push_parent();
                            } else {
                                //console.log('path_item', path_item);

                                const ipathitem = parseInt(path_item);
                                res.push_child(ipathitem);

                                //throw 'stop';

                            }
                        })
                        return res;
                    }

                    const parsed_path = parse_path(path);

                    // Navigate to the position from here I think.

                    let node_pos = this;

                    let stopped = false;

                    //console.log('parsed_path.arr_path', parsed_path.arr_path);
                    //console.log('');
                    //console.log('1) node_pos', node_pos);
                    each(parsed_path.arr_path, path_item => {
                        //console.log('path_item', path_item);
                        //console.log('node_pos', node_pos);
                        if (!stopped) {
                            if (path_item === -1) {
                                // 
                                if (node_pos.parent) {
                                    node_pos = node_pos.parent_node;
                                } else {
                                    stopped = true;
                                }
                            } else {
                                if (node_pos.child_nodes[path_item]) {
                                    node_pos = node_pos.child_nodes[path_item];
                                } else {
                                    stopped = true;
                                }
                            }
                        }
                        
                    });

                    if (stopped) {
                        res = undefined;
                    } else {
                        res = node_pos;
                    }

                    return res;

                } else {
                    throw 'stop';
                }
            } else {
                throw 'stop';
            }
            

            //const spath = path.split('')

            

        }

        //this.navigate = navigate;
        //this.
        Object.defineProperty(this, 'navigate', {
            get() { 
                return navigate;
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'nav', {
            get() { 
                return navigate;
            },
            enumerable: true,
            configurable: false
        });
        
        
        // and navigating that outputs variable names to an object as well.
        //  want programmer friendly syntax for that.

        // .navigate([paths], [variable names]) // this syntax makes it easier to add variable names later. But const [...] is good for that anyway.
        // .navigate({path: variable_name, ...})


    }
}
module.exports = JS_AST_Node_Navigate;