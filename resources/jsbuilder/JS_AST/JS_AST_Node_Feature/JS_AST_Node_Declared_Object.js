const JS_AST_Node_Feature = require('./JS_AST_Node_Feature');

// Maybe getting this working will be best done with focused attention on separate declaration statements.
//  Definitely want this to be a powerful abstraction, well defined in what it does.

// It will need flexibility and complexity to bridge the gap between declaration syntax in js, and what is in abstract theory a declared programmatic object, which in this
//  case will be linked to the the ast nodes.

// The declared object abstraction will be used on a higher level still.
//  In projects it will be used to understand what is referred to in the input to a module, as that module / file gets imported / loaded into the project.






class JS_AST_Node_Declared_Object extends JS_AST_Node_Feature {
    constructor(spec = {}) {

        //console.log('JS_AST_Node_Declared_Object constructor');
        //console.log('Object.keys(spec)', Object.keys(spec));


        spec.type = 'DeclaredObject';
        super(spec);

        const {js_ast_node, index_in_js_ast_node} = this;


        /*
        let js_ast_node_value;

        Object.defineProperty(this, 'js_ast_node_value', {
            get() {
                return js_ast_node_value;
            },
            set(v) { js_ast_node_value = v; },
            enumerable: true,
            configurable: false
        });
        */


        if (js_ast_node) {

            //console.log('js_ast_node', js_ast_node);

            // go through it, extracting the declarators.

            const have_vdr = vdr => {

                if (vdr.type === 'VariableDeclarator') {

                    if (vdr.child_nodes.length === 2) {
                        const [id, exp_or_lit] = vdr.child_nodes;
                        if (id.type === 'Identifier') {
                            //console.log('exp_or_lit', exp_or_lit);
                            //console.log('exp_or_lit.is_literal', exp_or_lit.is_literal);
                            if (exp_or_lit.is_expression || exp_or_lit.is_literal) {

                                this.name = id.name;
                                this.js_ast_node_value = exp_or_lit;

                                //throw 'NYI';
                            } else {

                                if (exp_or_lit.type === 'Identifier') {
                                    // it's being set by reference using another identifier.

                                    const id2 = exp_or_lit;

                                    this.name = id.name;
                                    this.value_name = id2.name;

                                } else {
                                    throw 'stop';
                                }

                                // It's OK if it's an identifier.

                                //  Not so sure though.
                                //console.log('js_ast_node.source', js_ast_node.source);
                                //console.log('vdr', vdr);

                                //throw 'stop';
                            }

                        } else {
                            throw 'stop';
                        }
                    } else {

                        //console.log('vdr.child_nodes.length', vdr.child_nodes.length);
                        //console.log('vdr.child_nodes', vdr.child_nodes);

                        if (vdr.child_nodes.length === 1) {
                            const id = vdr.child_nodes[0];
                            if (id.type === 'Identifier') {
                                this.name = id.name;
                            } else {
                                throw 'stop';
                            }
                        } else {
                            throw 'stop';
                        }

                        //throw 'stop';
                    }

                    //const [id, ]

                    
                } else {



                    throw 'stop';
                }
            }

            if (js_ast_node.child_nodes.length === 1) {

                const vdr = js_ast_node.child_nodes[0];

                if (vdr.type === 'VariableDeclarator') {
                    //console.log('vdr', vdr);
                    have_vdr(vdr);
                } else {

                    if (vdr.type === 'Identifier') {
                        const id = vdr;
                        //console.log('js_ast_node.source', js_ast_node.source);
                        //console.log('id', id);
                        //console.log('id.name', id.name);

                        this.name = id.name;

                        //throw 'stop';
                    } else {
                        throw 'stop';
                    }
                }
                
            } else {

                //console.log('index_in_js_ast_node', index_in_js_ast_node);
                const vdr = js_ast_node.child_nodes[index_in_js_ast_node];
                have_vdr(vdr);

                //throw 'NYI';
            }
        }
        // .object_name
        // .referenced_node (often the object is set after the =)
        //   cases like if it is a function call result.
        //let referenced_node;
        
    }
}

JS_AST_Node_Declared_Object.arr_from_js_ast_node = (js_ast_node) => {
    // An ast node can have multiple items defined within it.

    // consider 'let a;' where the value does not get set.
    //  it is still declared. just does not have a value / value is undefined.


    if (js_ast_node.type === 'ClassDeclaration') {
        return [new JS_AST_Node_Declared_Object({
            js_ast_node: js_ast_node
        })];
    } else if (js_ast_node.type === 'VariableDeclaration') {
        //

        // Can have multiple declarators.
        //  Interested in getting each of them.
        //   But the array deconstruction case? Object deconstrucion?
        //    May need to do separate work on testing ast_node features.
        //     Features are a higher level abstraction.
        //      They will need to be able to handle different syntax for the same feature.

        // These declared objects will themselves be usable as units.
        //  We will have the inner ast for what it's been declared as.
        //   Ability to look up references? May be better outside of here, at least for the moment.
        const res = [];



        if (js_ast_node.child_nodes.length === 1) {
            const vdr = js_ast_node.child_nodes[0];
            if (vdr.type === 'VariableDeclarator') {

                if (vdr.child_nodes.length === 2) {
                    const id = vdr.child_nodes[0];
                    if (id.type === 'Identifier') {
                        //console.log('id.name', id.name);
                        const fdec = new JS_AST_Node_Declared_Object({
                            js_ast_node: js_ast_node
                        })
                        res.push(fdec);
                    } else {
                        throw 'stop';
                    }
                } else {
                    throw 'stop';
                }


                //throw 'nyi stop';
            } else {
                console.log('js_ast_node.child_nodes.length', js_ast_node.child_nodes.length);
                throw 'stop';
            }
        } else {
            //console.log('js_ast_node.source', js_ast_node.source);
            let index = 0;
            js_ast_node.each.child(vdr => {
                if (vdr.type === 'VariableDeclarator') {
                    if (vdr.child_nodes.length === 1) {
                        // just the identifier, no value set.
                        const id = vdr.child_nodes[0];
                        if (id.type === 'Identifier') {
                            const fdec = new JS_AST_Node_Declared_Object({
                                js_ast_node: js_ast_node,
                                index_in_js_ast_node: index
                            });
                            res.push(fdec);
                        } else {
                            throw 'stop';
                        }

                    } else {
                        //console.log('vdr', vdr);

                        // a var declarator can have both the id as well as the object expression.
                        //  or presumably any other expression.

                        if (vdr.child_nodes.length === 2) {

                            const [id, exp] = vdr.child_nodes;



                            if (id.type === 'Identifier') {
                                if (exp.is_expression) {
                                    const fdec = new JS_AST_Node_Declared_Object({
                                        js_ast_node: js_ast_node,
                                        index_in_js_ast_node: index
                                    });
                                    res.push(fdec);
                                } else {
                                    // could be an identifier.
                                    //  presumably could be a boolean expression too.

                                    if (exp.type === 'Identifier') {
                                        const id2 = exp;
                                        const fdec = new JS_AST_Node_Declared_Object({
                                            js_ast_node: js_ast_node,
                                            index_in_js_ast_node: index
                                        });
                                        res.push(fdec);
                                    } else {
                                        throw 'stop';
                                    }


                                    
                                }

                            } else {
                                throw 'stop';
                            }
                        } else {
                            throw 'stop';
                        }

                        //throw 'NYI';
                    }

                } else {
                    throw 'stop';
                }
                index++;
            })

            //throw 'NYI';
        }
        return res;






        //if ()

        
        

    } else {
        throw 'stop';
    }

}

module.exports = JS_AST_Node_Declared_Object;