const JS_AST_Node_Type_Class_Declaration = require('./JS_AST_Node_6.1-Type_Class_Declaration');

const JS_AST_Node_Feature = require('./JS_AST_Node_Feature/JS_AST_Node_Feature');
const { each } = require('lang-mini');
class JS_AST_Node_Type_Variable_Declaration extends JS_AST_Node_Type_Class_Declaration {
    constructor(spec = {}) {
        super(spec);

        // Possibly 'Declaration' is a feature.
        //  Makes sense really.


        // Code that is specific for variable rather than class declarations would be best here.

        



        if (this.type === 'VariableDeclaration') {
            // .declaration.names
            // .declaration.keys
            // .declaration.map

            // More properties / functions.

            // Iterating declarations and object name usage together.
            //  Could be useful for a few other processes.

            // Could then see how it could be expressed as a query, if there can be further developments with that to do it well.



            const get_child_inner_declared_names_and_nodes = () => {

                throw 'stop';

                const js_ast_node = this;

                // Collect own declared object as well maybe?

                // actually takes effect on a function?
                //  




                const child_declared_object_names_and_nodes =  js_ast_node.query.collect.child.declared.object.exe();
                //console.log('child_declared_object_names_and_nodes', child_declared_object_names_and_nodes);
        
                const res = [];
        
                each(child_declared_object_names_and_nodes, entry => {
                    const [name, node] = entry;
                    //console.log('name', name);
                    //console.log('node', node);
        
                    // then find the first block scope...
        
                    const nbs = node.query.find.exe(node => node.t === 'BS');
                    //console.log('nbs', nbs);
        
                    const nbs_inner_declarations = nbs.query.collect.child.declaration.exe().flat();
                    //console.log('nbs_inner_declarations', nbs_inner_declarations);
        
                    const arr_declared = [];
        
                    const handle_found_declared = (str_name, value_node) => {
                        arr_declared.push([str_name, value_node]);
                    }
        
                    each(nbs_inner_declarations, inner_declaration => {
                        const dcr_count = inner_declaration.query.count.child.declarator.exe();
                        //console.log('dcr_count', dcr_count);
        
                        inner_declaration.query.each.child.declarator.exe(cd => {
                            //console.log('cd', cd);
                            const child_t = cd.query.collect.child.t.exe();
                            //console.log('child_t', child_t);
        
                            const s_cts = cd.query.collect.child.t.exe().join(',');
                            //console.log('s_cts', s_cts);
        
                            if (child_t.length === 2) {
                                if (child_t[0] === 'ID') {
        
                                    if (cd.nav('1').is_expression || cd.nav('1').is_literal) {
                                        const [name, node] = [cd.nav('0').name, cd.nav('1')];
                                        //arr_declared.push([name, node]);
                                        handle_found_declared(name, node);
                                    } else {
                                        throw 'stop';
                                    }
        
                                } else {
        
                                    if (s_cts === 'ArP,ArE') {
                                        // go through them in parallel.
        
                                        const [arraypattern, arrayexpression] = cd.nav(['0', '1']);
                                        //console.log('arraypattern.child.count', arraypattern.child.count);
        
                                        for (let c = 0, l = arraypattern.child.count; c < l; c++) {
                                            const [pattern_item, exp_item] = [arraypattern.child_nodes[c], arrayexpression.child_nodes[c]]
                                            //console.log('pattern_item, exp_item', pattern_item, exp_item);
                                            handle_found_declared(pattern_item.name, exp_item);
        
        
                                        }
        
        
                                        //throw 'stop';
        
                                    } else {
                                        throw 'stop';
                                    }
        
                                    
                                }
                            } else {
                                throw 'stop';
                            }
                        })
                    });
        
                    //console.log('arr_declared', arr_declared);
                    //return arr_declared;
        
                    res.push(arr_declared);
        
                    // iterate_declared_and_used_name_info(node, cb)???
        
                    // so for any declaration, should be able to get the declared objects.
                    //  declaration.get_map_declared_nodes which maps from the name it is assigned to the node.
        
                    // declarator.get_map_declared_nodes
        
        
                    // Then for each declaration, 
        
                })
                return res;
            }

            //get_child_inner_declared_names_and_nodes

            Object.defineProperty(this, 'child_inner_declared_names_and_nodes', {
                get() { 
                    console.log('pre get_child_inner_declared_names_and_nodes')
                    return get_child_inner_declared_names_and_nodes();
                   
                },
                //set(newValue) { bValue = newValue; },
                enumerable: true,
                configurable: false
            });


        }
    }
}

module.exports = JS_AST_Node_Type_Variable_Declaration;