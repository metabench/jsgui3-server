const babel_node_tools = require('../babel/babel_node_tools');
const {each} = require('lang-mini');
const {deep_iterate_babel_node} = babel_node_tools;
const parser = require('@babel/parser');
const generate = require('@babel/generator').default;

//console.log('generate', generate);
//console.log('generate', Object.keys(generate));
//console.log('generate', generate);
//throw 'stop';

// import generate from "@babel/generator";
const JS_AST_Node_Core = require('./JS_AST_Node_0-Core');
const { resolvePlugin } = require('@babel/core');

const {type_abbreviations, type_category_abbreviations, map_expression_categories, map_literal_categories, map_statement_categories, map_categories} = require('../babel/babel_consts');



/*

module.exports = {
    type_abbreviations: type_abbreviations,
    map_expression_categories: map_expression_categories,
    map_literal_categories: map_literal_categories,
    map_categories: map_categories
}

*/

const get_abbreviated_type_category = type => {
    const cat = get_type_category(type);
    const acat = type_category_abbreviations[cat];
    return acat;
}

const get_type_category = (type) => {

    const res = map_categories[type];
    if (!res) {
        console.log('type');
        throw 'NYI';
    }
    return res;


    // Literal

    // Declaration

    // Declarator

    // Expression

    // Statement

    // Pattern

    // Identifier - Seem not to fit a category, or be one of its own.
}
class JS_AST_Node_Babel extends JS_AST_Node_Core {
    constructor(spec = {}) {
        super(spec);
        // sets the childnodes here.
        //  will also make available the relevant bable properties.
        // .babel.type
        let babel_ast; // only for the root node. A root node of JS_AST can have a babel as
        let babel_node, babel_node_file, babel_node_program;
        const babel = {
            // Maybe a parse function here.
            //  and a .parsed property.
        }
        if (spec.babel_node) {
            babel_node = babel.node = spec.babel_node;
            // Then it needs to parse it within its own system.
            //  
            //const {type} = babel_node;
            //console.log('type', type);
            // Don't do this automatically here.
            //
            // Iterate through the babel node, building a structure that mirrors it and links back to it.
        }

        const filter_deep_iterate_babel_node = (babel_node, fn_filter, callback) => deep_iterate_babel_node(babel_node, (bn, path, depth) => fn_filter(bn) ? callback(bn, path, depth) : undefined)
        const inner_deep_iterate_babel_node = (babel_node, callback) => filter_deep_iterate_babel_node(babel_node, bn => bn !== babel_node, callback)

        const get_parent_path = path => {
            let res = path.split('/');
            let res2 = res.slice(0, res.length - 2);
            return res2.join('/') + '/';
        }

        /*
        const get_babel_node_child_nodes = (babel_node) => {
            const {type} = babel_node;
            if (type === 'VariableDeclaration') {
                return babel_node.declarations;
            } else if (type === 'VariableDeclarator') {
                return [babel_node.id, babel_node.init];
            } else if (type === 'Identifier') {
                return [];
            } else if (type === 'NumericLiteral') {
                return [];
            } else if (type === 'ArrayExpression') {
                return babel_node.elements;
            } else {
                console.log('type', type);
                throw 'NYI';
            }
        }
        */


        const load_mirror_structure = () => {
            if (this.root_node === this) {

                let index_from_root = 0;

                const map_nodes_by_path = {};
                const map_babel_nodes_by_path = {};
                const map_js_ast_nodes_by_path = {
                    '/': this
                };
                deep_iterate_babel_node(babel_node, (inner_babel_node, path, depth, stop) => {
                    //console.log('node.name', node.id?.name);
                    //console.log('depth', depth);

                    if (babel_node === inner_babel_node) {
                        //throw 'stop';
                    } else {
                        //console.log('1) path', path);
                        //console.log('babel_node.type', babel_node.type);
                        const parent_path = get_parent_path(path);
                        //console.log('parent_path', parent_path);
                        map_babel_nodes_by_path[path] = inner_babel_node;
                        const parent_babel_node = map_babel_nodes_by_path[parent_path];
                        const parent_js_ast_node = map_js_ast_nodes_by_path[parent_path];
                        const new_node = parent_js_ast_node.create_append_child({
                            babel_node: inner_babel_node,
                            path: path,
                            index_from_root: index_from_root++,
                            depth: depth
                        });
                        map_js_ast_nodes_by_path[path] = new_node;
                    }
                })
            } else {
                throw 'stop';
            }
        }

        Object.defineProperty(this, 'babel', {


            get() { 
                //console.log('babel object requested');
                return babel; 
            },
            enumerable: true,
            configurable: false
        });
        
        //if (spec.full_source) {
        //    full_source = spec.full_source;
        //}
        
        

        // Abbreviated_type....

        

        //const 

        // May use something (new) from lang-mini or lang-tools to parse the tree easily.
        //  Signature_Tree object. Will be abstract in that it's not closely integrated with the AST tree functionality, could be reused elsewhere.


        

        Object.defineProperty(babel, 'start', {
            get() { return babel_node.start; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(babel, 'end', {
            get() { return babel_node.end; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(babel, 'name', {
            get() { return babel_node.name; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: true
        });


        // only for identifiers.

        

        Object.defineProperty(babel, 'node', {
            get() { 
                return babel_node; 
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(babel, 'type', {
            get() { 
                //console.log('babel', babel);
                //console.log('babel_node', babel_node);
                //console.log('babel.node', babel.node);
                return babel_node.type; 
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        //let category;
        Object.defineProperty(babel, 'type_category', {
            get() { 
                //console.log('babel', babel);
                //console.log('babel_node', babel_node);
                //console.log('babel.node', babel.node);
                //category = ;
                return get_type_category(babel_node.type); 
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(babel, 'abbreviated_type_category', {
            get() { 
                //console.log('babel', babel);
                //console.log('babel_node', babel_node);
                //console.log('babel.node', babel.node);
                //category = ;
                return get_abbreviated_type_category(babel_node.type); 
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        

        Object.defineProperty(babel, 'is_identifier', {
            get() { 
                return babel.type === 'Identifier';
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(babel, 'is_declaration', {
            get() { 
                return babel.type === 'VariableDeclaration' || babel.type === 'ClassDeclaration';
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(babel, 'is_expression', {
            get() { 
                return !!map_expression_categories[babel.type];
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(babel, 'is_statement', {
            get() { 
                return !!map_statement_categories[babel.type];
            },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(babel, 'is_literal', {
            get() { 
                return !!map_literal_categories[babel.type];
            },
            enumerable: true,
            configurable: false
        });
        
        Object.defineProperty(babel, 'ast', {
            get() { 

                if (this.root === this) {

                } else {
                    // will return undefined, for the moment
                }
            },
            set(val) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        if (this.root_node === this) {

            //console.log('babel_node', babel_node);

            if (!babel_node) {
                const {source} = this;
                //console.log('source', source);
                const babel_ast = parser.parse(source, {
                    sourceType: 'module',
                    plugins: [
                        'asyncGenerators',
                        'bigInt',
                        'classPrivateMethods',
                        'classPrivateProperties',
                        'classProperties',
                        'doExpressions',
                        //'exportDefaultFrom',
                        'nullishCoalescingOperator',
                        'numericSeparator',
                        'objectRestSpread',
                        'optionalCatchBinding',
                        'optionalChaining',
                    ]});

                //console.log('babel_ast', babel_ast);

                babel_node_file = babel_ast;
                babel_node_program = babel_ast.program;

                //console.log('babel_node_program', babel_node_program);

                const {body} = babel_node_program;

                if (body.length === 1) {
                    const node0 = body[0];

                    babel_node = node0;
                } else {
                    throw 'NYI';
                }
                //throw 'stop';
            }
            //throw 'stop';
            if (babel_node) {
                //console.log('1) babel_node', babel_node);
                const {type} = babel_node;
                //if (true || type === 'File') {
                load_mirror_structure({
                    root_node: this.root_node
                });

                //setTimeout(() => {
                //    this.raise('inner-loaded', {});
                //}, 0);

                // inner-nodes-loaded
                // inner-js_ast-loaded
                // inner-loaded

                


                //}
            } else {
    
                
            }

            this.generate = () => {
                //const code = this.source;
                const ast = this.babel.node;

                // generate(ast).code;
                

                /*
                const output = generate(
                ast,
                {
                    // * options * /
                },
                code
                );

                */

                const output = generate(ast).code;

                //console.log('output', output);
                return output;
            }
            
        }

        /*
        import { parse } from "@babel/parser";
        import generate from "@babel/generator";
        
        const code = "class Example {}";
        const ast = parse(code);
        
        const output = generate(
          ast,
          {
            // * options * /
          },
          code
        );
        */
        
    }
}
JS_AST_Node_Babel.from_babel_node = (spec) => {
    return new JS_AST_Node_Babel(spec);
}


module.exports = JS_AST_Node_Babel;