const JS_AST_Node_Category_Declaration = require('./JS_AST_Node_5.5-Category_Declaration');


// It turns out that statement analysis will be useful, so this may need to be expanded a lot.


class JS_AST_Node_Category_Statement extends JS_AST_Node_Category_Declaration {
    constructor(spec = {}) {
        super(spec);

        //console.log('0) this', this);
        Object.defineProperty(this, 'is_statement', {
            get() { 
                return this.babel.is_statement;
            },
            enumerable: true,
            configurable: false
        });

        // Can have a specialised statement property to see if it's a module_exports_statement

        if (this.is_statement) {

            // is_object_assign_statement
            
            Object.defineProperty(this, 'is_object_assign_statement', {
                get() {

                    // Object.assign(jsgui.controls, require('./controls/controls'));

                    // St(Ex(1+Ex))

                    // Assign using the results of a require statement.

                    if (this.generalised_compressed_mid_type_category_signature === 'St(Ex(Ex,I,Ex))' || this.generalised_compressed_mid_type_category_signature === 'St(Ex(1+Ex))') {
                        const id_nodes = this.nav(['0/0/0', '0/0/1']);
                        //console.log('referred_to_obj_names', id_nodes);
                        // console.log('id_nodes[0].t', id_nodes[0].t);
                        if (id_nodes[0].t === 'ID' && id_nodes[1].t === 'ID') {

                            if (id_nodes[0].name === 'Object' && id_nodes[1].name === 'assign') {
                                return true;
                            }
                        }
                    }
                    return false;

                    //throw 'stop';
                },
                enumerable: true,
                configurable: false
            });

            // object_assign_statement_info

            Object.defineProperty(this, 'object_assign_statement_interpretation', {
                get() { 
                    if (this.generalised_compressed_mid_type_category_signature === 'St(Ex(Ex,I,Ex))') {
                        const id_nodes = this.nav(['0/0/0', '0/0/1']);

                        const node_assigned_to = this.nav('0/1');
                        if (node_assigned_to.is_identifier) {
                            if (id_nodes[0].t === 'ID' && id_nodes[1].t === 'ID') {

                                if (id_nodes[0].name === 'Object' && id_nodes[1].name === 'assign') {
                                    //return true;
                                    const assigned_to_name = node_assigned_to.name;


                                    const oe = this.nav('0/2');
                                    console.log('oe', oe);
                                    console.log('oe.source', oe.source);

                                    if (oe.type === 'ObjectExpression') {
                                        const assigned_keys = [];

                                        console.log('this.source', this.source);

                                        //if (oe)


                                        oe.query.each.child.exe(opr => {

                                            console.log('opr', opr);

                                            const assigned_key = opr.nav('0').name;

                                            assigned_keys.push(assigned_key);
                                        });

                                        //return [assigned_to_name, assigned_keys];

                                        // could return JS_AST_Node_Interpretation possibly.
                                        return {
                                            name: 'Object.assign(ID.name, {keys})',
                                            value: {
                                                identifier_name: assigned_to_name,
                                                keys: assigned_keys
                                            }
                                        }
                                    } else {

                                        console.log('this.source', this.source);

                                        // Assigning own property members direct to self.

                                        // will need a system to lookup the subobjects too.
                                        //  in a flexible way that works with .property and ['property'].

                                        // Probably a more flexible interpretation object and standard will be good.

                                        // but could use more prefixes like string_... or str...

                                        // but we could / should recognise Object.assign(jsgui, jsgui.controls); and similar as it's own case to code for
                                        

                                        if (oe.t === 'ME') {
                                            if (oe.child.count === 2) {
                                                if (oe.child.shared.type === 'Identifier') {
                                                    const obj_id_names = oe.child_nodes.map(node => node.name);
                                                    return {
                                                        name: 'Object.assign(ID1.name, ID1.ID.name)',
                                                        value: {
                                                            identifier_name: assigned_to_name,
                                                            assigned_object_name_path: obj_id_names
                                                        }
                                                    }
                                                } else {
                                                    throw 'stop';
                                                }
                                            } else {
                                                throw 'stop';
                                            }

                                        } else {
                                            throw 'stop';
                                        }

                                        




                                        throw 'stop';

                                    }

                                    // the child nodes are OPr nodes
                                    
                                } else {
                                    // ignore I think
                                }
                            } else {

                                throw 'stop';

                            }
                        } else {
                            // Not dealing with this case right now, maybe never. Maybe MemberExpression?
                            throw 'stop';
                        }
                        //console.log('referred_to_obj_names', id_nodes);
                        // console.log('id_nodes[0].t', id_nodes[0].t);
                        
                    }
                    return false;

                    //throw 'stop';
                },
                enumerable: true,
                configurable: false
            });

            // More specific names too?
            //   Or in that case signatures would do?

            // // cn.is_assign_object_property_by_identifier_statement
                //  ES(AsE(ME(ID,ID),ID))

            Object.defineProperty(this, 'is_assign_object_property_by_identifier_statement', {
                get() { 
                    return this.type_signature === 'ES(AsE(ME(ID,ID),ID))';

                    //throw 'stop';
                },
                enumerable: true,
                configurable: false
            });

            Object.defineProperty(this, 'assign_object_property_by_identifier_statement_interpretation', {
                get() { 
                    if (this.is_assign_object_property_by_identifier_statement) {
                        //const [id1, id2, id3] =  
                        const names = this.nav(['0/0/0', '0/0/1', '0/1']).map(node => node.name);
                        return {

                            name: 'target_object.property = assigned_object',
                            value: {
                                target_object_name: names[0],
                                property_name: names[1],
                                assigned_object_name: names[2]
                            }

                            
                        }
                    } else {
                        throw 'stop';
                    }
                    //return false;

                    //throw 'stop';
                },
                enumerable: true,
                configurable: false
            });

            




            // object_assignment_info
            //  name of object assigned to, then a list of keys
            //   maybe node of object assigned to... or just be on the lookout for a signle identifier, as that's what we want to detect for the modules
            //    and it's no longer as some kind of special case rule. Makes sense to go through a JS file to interpret it / see what it's about, program statement / entry at a time.
            // Want it to be able to spot a variety of JS patterns.

            // Could even make my own custom JS_AST_Nodes (which can include sub-nodes) that represent JavaScript structures that I use / are useful.
            //  Will be a good way to compile to optimized patterns.






            // object_assign_kvps
            //  [[key, value]] makes sense to use an array of key assignment kvps






            Object.defineProperty(this, 'is_module_exports_statement', {
                get() { 
                    //return this.abbreviated_type;
                    //console.log('');
                    
                    //console.log('1) this.source', this.source);
                    //console.log('1) this.child_nodes.length', this.child_nodes.length);
                    //console.log('1) this.type_category', this.type_category);
                    //console.log('1) this.babel.type', this.babel.type);
                    //console.log('1) this.type_signature', this.type_signature);
                    //console.log('1) this.type_category_signature', this.type_category_signature);
                    //console.log('1) this.generalised_compressed_mid_type_category_signature', this.generalised_compressed_mid_type_category_signature);
                    //console.log('1) this.generalised_compressed_mid_type_category_signature', this.generalised_compressed_mid_type_category_signature);

                    if (this.generalised_compressed_mid_type_category_signature === 'St(Ex(Ex,I))') {
                        const id_nodes = this.nav(['0/0/0', '0/0/1']);
                        //console.log('referred_to_obj_names', id_nodes);
                        //console.log('id_nodes[0].t', id_nodes[0].t);
                        if (id_nodes[0].t === 'ID' && id_nodes[1].t === 'ID') {

                            if (id_nodes[0].name === 'module' && id_nodes[1].name === 'exports') {
                                return true;
                            }
                        }
                    }
                    return false;

                    //throw 'stop';
                },
                //set(newValue) { bValue = newValue; },
                enumerable: true,
                configurable: false
            });


            Object.defineProperty(this, 'module_exported_node', {
                get() { 

                    if (this.is_module_exports_statement) {
                        // for clarity partly
                        // const id_nodes = this.nav(['0/0/0', '0/0/1']);
                        const exported_node = this.nav('0/1');
                        return exported_node;
                        //return false;

                    }

                    //return this.abbreviated_type;
                    //console.log('');
                    
                    //console.log('1) this.source', this.source);
                    //console.log('1) this.child_nodes.length', this.child_nodes.length);
                    //console.log('1) this.type_category', this.type_category);
                    //console.log('1) this.babel.type', this.babel.type);
                    //console.log('1) this.type_signature', this.type_signature);
                    //console.log('1) this.type_category_signature', this.type_category_signature);
                    //console.log('1) this.generalised_compressed_mid_type_category_signature', this.generalised_compressed_mid_type_category_signature);
                    //console.log('1) this.generalised_compressed_mid_type_category_signature', this.generalised_compressed_mid_type_category_signature);

                    

                    //throw 'stop';
                },
                //set(newValue) { bValue = newValue; },
                enumerable: true,
                configurable: false
            });
            // module_exported_node 
            //  could be an identifier node.

            // an is_module_exports_statement property would be cool

            // Could get into further examination of types of statement, what they do

            // Properties that only appear if they are some kinds of statement / thing.

            // Guess by now the child nodes have not been added, so can't look inside it.

            // Need to add a property.

            // Or use an event listener?

            /*
            //this.on('inner-loaded', () => {
                console.log('1) this.source', this.source);
                console.log('1) this.child_nodes.length', this.child_nodes.length);
                console.log('1) this.type_category', this.type_category);
                console.log('1) this.babel.type', this.babel.type);
                //console.log('1) this.type_signature', this.type_signature);
                console.log('1) this.type_category_signature', this.type_category_signature);
                console.log('1) this.generalised_compressed_mid_type_category_signature', this.generalised_compressed_mid_type_category_signature);

                throw 'stop';

            //})
            */

            //console.log('1) this', this);
            

        }
        
        

    }
}

module.exports = JS_AST_Node_Category_Statement;