const {each, tof} = require('lang-mini');
const JS_File_JS_AST_Node = require('./JS_File_3-JS_AST_Node');

const JS_File_Import_References = require('./JS_File_Import_References');

// Index prior to this?
//  Or just within JS_File?
//   Would actually make sense here, as some AST trees could be long and worth working on in some ways, or reading info from.

// identifier_name_occurrance_index
//  and provides a reference to each place that identifier name has been used within the scope.
//   then building up an identifier name occurrance index could be done recursively where each node gets its child nodes to calculate their occurrance indexes first.






//const { default: JS_File_JS_AST_Node } = require('./JS_File_2-JS_AST_Node');
//const { default: Import_References } = require('./JS_File_Import_References');
// Will extract relevant AST code functionality. Files often import things at the beginning, then have declarations, then export what was declared at the end.

// Understanding the import declarations so they could be localised.
//  So we can refer to the ast of them, because we have recognised them elsewhere.

// Can build the functions into a js file.
// Later on - renaming local variables within a scope. 

// JS_File_Writable too...
//   .imports = ... or requires
//   .add_platform?

// Or better to create the platform objects out of the functions which have been comprehended from various files.
// JS_File_Platform?
// This will be more about understanding the js file. Basic structure will have already been obtained.

// Maybe a Babel level below?

class JS_File_Comprehension extends JS_File_JS_AST_Node {
    constructor(spec) {
        super(spec);

        

        const {body} = this;

        //const {each_root_node} = this;



        const each_root_node = (callback) => this.body.node.each.child(callback);
        body.each = cb => {
            throw 'NYI'
        }
        body.filter = cb => {
            throw 'NYI'
        }
        body.each.child = (cb) => each_root_node(cb);

        const each_filtered_child_node = (fn, cb) => {
            body.each.child(node => {if (fn(node)) cb(node)})
        };

        body.filter.child = (fn, cb) => each_filtered_child_node(fn, cb);

        body.each.child.expression_statement = (cb) => each_filtered_child_node(node => node.type === 'ExpressionStatement', cb);
        body.each.child.declaration = (cb) => each_filtered_child_node(node => node.is_declaration, cb);

        const deep_iterate = body.each;

        const each_root_declaration = callback => {
            filter_each_root_node(node => node.is_declaration, callback);
        }

        // .collect.root.declaration.name
        // this.collect.root.declaration.name

        this.get_root_declaration_names = () => {

            //throw 'Will be replaced with this.collect.root.declaration.name'

            console.log('!!!Will be replaced with this.collect.root.declaration.name!!!')

            //console.log('get_root_declaration_names');

            // can only do this when it's ready, it its been recieved and parsed.
            const all_body_dec_names = [], map_all_body_dec_names = {};

            //console.log('this', this);
            //console.log('this.body', this.body);
            //console.log('this.body.child_nodes.length', this.body.child_nodes.length);

            this.body.each.child(js_ast_node => {

                //console.log('js_ast_node', js_ast_node);
                // Then a function to search the node for all declaration names.
                //  .get_identifier_names

                //const identifier_names = js_ast_node.get_identifier_names();

                //console.log('js_ast_node.type', js_ast_node.type);
                //throw 'stop';

                const body_node = js_ast_node.babel.node;
                //console.log('body_node', body_node);
                const arr_body_node_declarator_names = [], map_body_node_declarator_names = {};

                if (js_ast_node.type === 'VariableDeclaration') {
                    //console.log('body_node', body_node);

                    each(body_node.declarations, declaration => {
                        //console.log('declaration', declaration);

                        if (declaration.type === 'VariableDeclarator') {
                            const name = declaration.id.name;
                            //console.log('name', name);

                            if (!map_body_node_declarator_names[name]) { // also want the declarator names that are for classes.
                                arr_body_node_declarator_names.push(name);
                                map_body_node_declarator_names[name] = true;
                            }
                        } else {
                            throw 'stop';
                        }
                    })
                }
                if (js_ast_node.type === 'ClassDeclaration') {
                    //console.log('body_node', body_node);
                    const name = body_node.id.name;

                    if (!map_body_node_declarator_names[name]) { // also want the declarator names that are for classes.
                        arr_body_node_declarator_names.push(name);
                        map_body_node_declarator_names[name] = true;
                    }
                }
                //const variable_names = js_ast_node.get_variable_names();
                //console.log('variable_names', variable_names);
    
                //const identifier_names = js_ast_node.get_identifier_names();
                //if (identifier_names.length > 0) console.log('identifier_names', identifier_names);
                let arr_bod_dec_name;
                if (arr_body_node_declarator_names.length > 1) {
                    //console.log('arr_body_node_declarator_names', arr_body_node_declarator_names);
                    // Can have multiple identifiers in a node.
                    //  {a, b, c}
                    arr_bod_dec_name = arr_body_node_declarator_names;
                    //throw 'stop'
                } else if (arr_body_node_declarator_names.length === 1) {
                    arr_bod_dec_name = arr_body_node_declarator_names[0];
                }
                if (arr_bod_dec_name) {
                    //console.log('arr_bod_dec_name', arr_bod_dec_name);
                    const t = tof(arr_bod_dec_name);
                    if (t === 'string') {
                        if (!map_all_body_dec_names[arr_bod_dec_name]) {
                            all_body_dec_names.push(arr_bod_dec_name);
                        }
                    } else if (t === 'array') {
                        each(arr_bod_dec_name, name => {
                            if (!map_all_body_dec_names[name]) {
                                all_body_dec_names.push(name);
                            }
                        })
                    }
                }
            })
            return all_body_dec_names;
        }
        // declaration_details
        //  is it all inline?
        //   can we get a compressed version of it?
        //  where does it refer?
        // eg, do we need the whole of lang-mini, or can we just extract 'each'.

        // For the moment, focus more on lang-mini and a few tools that use it and some functions it has.

        // Maybe another layer 4.1
        //  specific queries to find features.
        //   and get information on those features.

        // Loading things into a platform object makes a lot of sense.
        //  Possibly use Platform within Module (and vice-versa?)  Or Module extends Platform?
        //  

        // also will be replaced.
        let root_declared_names;
        Object.defineProperty(this, 'root_declared_names', {
            // Using shorthand method names (ES2015 feature).
            // This is equivalent to:
            // get: function() { return bValue; },

            get() { 

                if (!root_declared_names) {
                    root_declared_names = this.get_root_declaration_names();
                }

                return root_declared_names;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        // each_root_assignment_expression
        //const each_root_assignment_expression = (callback) => each_root_node(node => node.type === 'AssignmentExpression', callback);
        //this.each_root_node = each_root_node;
        //this.each_root_declaration = each_root_declaration;
        //this.each_root_assignment_expression = each_root_assignment_expression;


        const collect_callbacks = function(fn) {
            const a = arguments;

            const apply_args = [];
            for (let c = 1, l = a.length; c < l; c++) {
                apply_args.push(a[c]);
            }

            const res = [];
            const callback = item => {
                res.push(item);
            }

            apply_args.push(callback);

            

            // May need to apply / call the function with arguments given.

            fn.apply(this, apply_args);

            //fn(item => res.push(item));
            return res;
        }

        const collect_root_nodes = () => {
            const res = [];
            each_root_node(rn => {
                res.push(rn);
            })
            return res;
        }

        const select_root_nodes = (fn_select) => {
            const res = [];
            each_root_node(rn => {
                if (fn_select(rn)) res.push(rn);
            })
            return res;
        }

        const collect_root_declarations = () => collect_callbacks(each_root_declaration);
        const select_root_declarations = (fn_select) => collect_callbacks(each_root_declaration, fn_select);


        // .each .root

        //const collect

        // this.each_babel_root_node

        Object.assign(this, {
            each: cb => deep_iterate(cb),
            collect: {
                root: () => collect_root_nodes()
            },
            filter: {
                root: (fn_filter, callback) => filter_each_root_node(fn_filter, callback)
            },
            select: {
                root: (fn_select) => select_root_nodes(fn_select)
            }
        })

        Object.assign(this.each, {
            root: (callback) => each_root_node(callback)
        })

        // 

        // .each.child(...)
        // .each.child.declaration(...)


        const each_root = this.each.root;
        Object.assign(each_root, {
            declaration: callback => each_root_declaration(callback)
        });

        const collect_root = this.collect.root;
        Object.assign(collect_root, {
            declaration: collect_root_declarations
        });

        const select_root = this.select.root;
        Object.assign(select_root, {
            declaration: select_root_declarations
        });

        const filter_root = this.filter.root;



        //.declaration = each_root_declaration;
        //.declaration = collect_root_declarations;



        // the query objects

        // Think we can have reasonably concise and logical use syntax with these dotted paths.
        //  Later see about compressing property names to just a two or three characters.
        //   (or just one, could be easy and save a lot of app size)


        // .collect
        // .each
        // .select
        // .filter

        // A function call map would make a lot of sense.
        //  Which functions are being called

        // map function calls by name

        // .each.deep.function_call.name


        // collect.root.declaration.name
        // collect.deep.call.require ???







    }
}
JS_File_Comprehension.load_from_stream = (rs, path) => {
    const res = new JS_File_Comprehension({rs: rs, path: path});
    return res;
}
module.exports = JS_File_Comprehension;