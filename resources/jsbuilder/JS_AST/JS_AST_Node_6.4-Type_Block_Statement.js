
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Type_Variable_Declarator = require('./JS_AST_Node_6.3-Type_Variable_Declarator');

class JS_AST_Node_Type_Block_Statement extends JS_AST_Node_Type_Variable_Declarator {
    constructor(spec = {}) {
        super(spec);
        

        if (this.t === 'BS') {
            const get_child_inner_declared_names_and_nodes = () => {
                //throw 'stop';
                //const inner_declaration = this;

                const nbs_inner_declarations = this.query.collect.child.declaration.exe().flat();

                const arr_declared = [];
        
                const handle_found_declared = (str_name, value_node) => {
                    arr_declared.push([str_name, value_node]);
                }
    
                each(nbs_inner_declarations, inner_declaration => {

                    if (inner_declaration.type === 'ClassDeclaration') {
                        const [id, class_body] = inner_declaration.child_nodes;
                        handle_found_declared(id.name, class_body);
                    }

                    //const dcr_count = inner_declaration.query.count.child.declarator.exe();
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

                return arr_declared;
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

module.exports = JS_AST_Node_Type_Block_Statement;