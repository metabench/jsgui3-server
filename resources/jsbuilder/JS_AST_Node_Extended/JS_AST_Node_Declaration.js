//const JS_AST_Node = require('../JS_AST/JS_AST_Node');
const {each} = require('lang-mini');
const JS_AST_Node_Extended_Core = require('./JS_AST_Node_Extended_0-Core');


// Don't think we will proceed this way
//  Already have specialised node types as part of the main structure, but the functionality only gets added / is available in matching cases.

// Don't think we want / need this, it makes the design overall more complex (even though it could be optimal too)



class JS_AST_Node_Declaration extends JS_AST_Node_Extended_Core {
    constructor(spec) {
        super(spec);


        // the type must be declaration.

        if (!this.is_declaration) {
            throw 'stop';
        }

        // Have tools for extracting specific information from declarations.
        //  Possibly for making a compressed version.

        // get own names.

        const get_declared_names = () => {
            if (this.is_declaration === true) {
                const cns = this.child_nodes;
                const map_names = {}, arr_names = [];
                const handle_name = (name) => {
                    if (!map_names[name]) {
                        map_names[name] = true;
                        arr_names.push(name);
                    }
                }

                if (this.type === 'VariableDeclaration') {

                    each (cns, cn => {
                        //const tcn = ;
                        if (cn.type === 'VariableDeclarator') {
                            const gfc = cn.child_nodes[0];
                            console.log('gfc', gfc);
                            if (gfc.type === 'Identifier') {
                                console.log('gfc.name', gfc.name);
                                handle_name(gfc.name);
                            } else if (gfc.type === 'ArrayPattern') {
                                // each child, should be an identifier
                                each (gfc.child_nodes, ggc => {
                                    if (ggc.type === 'Identifier') {
                                        //console.log('ggc.name', ggc.name);
                                        handle_name(ggc.name);
                                    } else {
                                        throw 'stop';
                                    }
                                })
                            } else {
                                throw 'stop';
                            }
                        } else {

                            console.log('cn.type', cn.type);
                            console.log('this', this);
                            throw 'stop';


                            

                            
                        }
                    })


                } else {
                    //console.log('this.type', this.type);
                    //console.log('this', this);

                    if (this.type === 'ClassDeclaration') {
                        const dec_id = this.child_nodes[0];
                        //console.log('dec_id', dec_id);
                        

                        if (dec_id.type === 'Identifier') {
                            //console.log('dec_id.name', dec_id.name);
                            handle_name(dec_id.name);
                        } else {
                            throw 'stop';
                        }

                    } else {
                        throw 'stop';
                    }


                    //if (this.type === 'ClassDeclaration') {
                    //    const gnc0 = this.child_nodes[0];
                    //    console.log('gcn0', gcn0);
                    //} else {


                        


                   // }
                    //throw 'stop';
                }

                
                //console.log('arr_names', arr_names);
                return arr_names;
            } else {
                throw 'stop';
            }
        }

        this.get_declared_names = get_declared_names;

    }
}

/*
JS_AST_Node_Declaration.from_js_ast_node = (js_ast_node) => {
    // Would be in a different context / no context when it gets made.

    throw 'NYI';

}
*/
module.exports = JS_AST_Node_Declaration;