

const JS_AST_Node = require('../../JS_AST_Node');
const JS_AST_Root_Node_Feature_Exports = require('./JS_AST_Root_Node_Feature_Exports');
const {each} = require('lang-mini');
// A map of named / relevant inner nodes could be a useful feature of the ast node overall.

// or is it an index if it's mapping to an array?

// idx_named_nodes (so it can apply to ancestors or others in the ast)

// map_named_inner_nodes

// map_named_inner_nodes['exports'] = [...] // always an array


class JS_AST_Root_Node_Interpreted extends JS_AST_Node {

    // Root node features could be of use.
    //  Want to recognise features in a convenient way.
    //  Signatures could definitely help with that
    //   But a feature may not be best recognised with a signature.

    // Could do a more formal decision tree for determining features.
    // could have a set of determinations and values.
    //  


    // This is the best place for it to come up with more info on the import and export?
    //  Or further down near the core?

    constructor(spec) {
        super(spec);

        const {get_arr_named_node, index_named_node} = this;

        // .exported.type      'object', 'class'
        // .exported.keys

        // This will handle non-special case things.
        //  If there is demand jsgui or other special cases could be brought into normal interpretation.

        // An index of the relevant statements.

        let ast_node_exports_statement;
        let arr_ast_node_import_statements = [];

        const get_module_exports_statement_node = () => {
            // Get the Member Expression module.exports

            //  Signature matches probably are the best way to compare for the moment.
            //   How about just indexing shallow signatures?

            // Looking it up from the index seems like it makes the most sense.

            // sig_from_source
            // sig(src)


            // Maybe set this up before.
            // Nodes by type as well?
            this.setup_node_index('identifiers_by_name', node => node.is_identifier, node => node.name);

            let res;
            const mod_ids = this.get_indexed_nodes_by_key('identifiers_by_name', 'module');
            each(mod_ids, node => {
                // want to be able to get the next sibling from a node easily.
                console.log('node', node);
                console.log('node.parent_node', node.parent_node);

                console.log('node.sibling.count', node.sibling.count);

                if (node.sibling.count === 1) {
                    const sibling = node.sibling.collect()[0];
                    console.log('sibling.name', sibling.name);
                    if (sibling.name === 'exports') {
                        console.log('node.parent_node.parent_node', node.parent_node.parent_node);
                        console.log('node.parent_node.parent_node.parent_node', node.parent_node.parent_node.parent_node);
                        console.log('node.parent.node.parent.node.parent.node', node.parent.node.parent.node.parent.node);
                        console.log('node.ggparent.node', node.ggparent.node);
                        console.log('node.ggparent.node.is_statement', node.ggparent.node.is_statement);

                        // node.ancestor.find(ancestor => ancestor.index = 2);


                        // .gparent_node, ggparent_node

                        // node.ggparent relationship for example

                        // node.ancestor.at(2)



                        // parent and ancestor relationships could use some work.



                        // parent. ...
                        // ancestor.find.statement

                        // ancestor.statement

                        res = node.parent_node;
                    }
                }

                // .nextSibling property
                // .siblings
                // .next_siblings
                // .previous_siblings
                // .siblings.next


            });
            
            

            //console.log('mod_ids', mod_ids);
            return res;

        }

        const interpret = () => {
            // what it finds, in terms of the object that gets exported
            // a one word summary of the module type.

            // interpreted summary type name

            // type_name would do as a property of the interpretation object.

            // The exports statement.

            // has exports boolean?

            // summary type ('simple-class'), '('simple-module')', 
            //  'module' or 'class' - meaning that it's noticed some other things going on which need attention or may be helpful for interpreting the file.
            //   




            // Failure case
            //  Can not identify exports statement
            //   Though maybe that's fine on the application level rather than library level.
            //  Failed to parse / is not JS??? Probably not at this stage.
            //  
        }

        let exports;
        Object.defineProperty(this, 'exports', {
            get() { 
                if (exports === undefined) {
                    // Worth creating some kind of 'feature' object here.
                    //  Would have more understanding of the node being exported?

                    // Create the exports feature, and that will be given the module.exports statement (or maybe the exported statement)

                    // exports.exported.node
                    //  could be ok for the moment.

                    // will really be querying the exports object
                    //  exports.exported.keys
                    //  exports.exported.type

                    // // const $1 = new $2($3);\n 
                    // const $1 = new $2($3);\n 

                    // find the exports statement.
                    //this.select


                    //exports = new JS_AST_Root_Node_Exports_Feature({});

                    const module_exports_statement = get_module_exports_statement_node();
                    console.log('module_exports_statement', module_exports_statement);
                     
                     

                    






                }
                return exports;
            },
            enumerable: true,
            configurable: false
        });
        
        
        //
        // Further properties.
        //  Need to look into .exports.
        //   Don't want so much functionality on the JS_File side of things, it's better to layer the relevant abstractions on top of JS_AST_Node.







    }
}

module.exports = JS_AST_Root_Node_Interpreted;