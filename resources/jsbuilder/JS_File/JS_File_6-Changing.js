const JS_File_Planning = require('./JS_File_5-Planning');
const Variable_Name_Provider = require('../Variable_Name_Provider');
const { each } = require('lang-mini');

const {transform} = require("@babel/core");
// import { transform } from "@babel/core";
const generate = require("@babel/generator").default;
//import generate from "@babel/generator";
//console.log('generate', generate);
//throw 'stop';

class JS_File_Changing extends JS_File_Planning {
    constructor(spec) {
        super(spec);

        // Can try smaller code replacements for the moment.
        //  Make the right code replacement API on top of lower levels such as Babel.

        // Maybe another output stage makes the most sense.
        //  Babel_Output possibly. Rename lower class Babel_Parse.

        // Use babel transform functionality, taking the output from 'planning'.

        // JS_File_Babel_Changing

        // Functionality such as changing variable names, possibly throughout, possibly within local scopes.
        // Within each local scope, change the variable names?

        // Or within every inner scope of the root nodes, do it once and separately?
        //  Would seem a good way, with

        // Then each scope has its own map_renames.
        //  If done fully / properly

        // We just get the inner names of the root definitions.

        // Make a remapped new version of the file?
        //  change in place?

        // For the moment, could change the values in place.
        //  Will cause confusion if not careful regarding positioning.
        //   As positioning values have been set - may need to make that more dynamic, or avoid the problem.

        // A planning stage below this?
        //  A module level that will generate plans or information that form planning behaviour.
        //  Coming up with new arrangements.
        //   Possibly multiple new arrangements and selecting one.


        const {get_proposed_root_definitions_inner_name_remappings} = this;

        this.remap_root_definition_inner_names = () => {
            const remappings = get_proposed_root_definitions_inner_name_remappings();
            console.log('remappings', remappings);
            // then access the root nodes by these keys...
            
            //throw 'stop';

            let {babel_ast} = this;
            console.log('babel_ast', babel_ast);


            const old_attempt = () => {
                let c = 0;

                this.each_root_declaration(node => {
                    //console.log('node', node);
                    const idns = node.inner_declaration_names;
                    //throw 'stop';

                    if (idns.length > 0) {
                        //console.log('');
                        //console.log('node.own_declaration_names', node.own_declaration_names);

                        if (node.own_declaration_names.length === 1) {
                            const own_name = node.own_declaration_names[0];
                            console.log('');
                            console.log('own_name', own_name);

                            const own_remappings = remappings[own_name];
                            console.log('own_remappings', own_remappings);

                            // then want to iterate inner declarations.
                            // put together the map of ast nodes...
                            const map_nodes = {};

                            node.each_inner_declaration(node_inner_dec => {
                                //console.log('node_inner_dec', node_inner_dec);
                                const {babel_node} = node_inner_dec;

                                // node.name could be useful.
                                //  if it's got a single name
                                // own_declaration_names

                                const odns = node_inner_dec.own_declaration_names;
                                if (odns.length === 1) {
                                    const inner_declaration_name = odns[0];
                                    console.log('inner_declaration_name', inner_declaration_name);
                                    map_nodes[inner_declaration_name] = node_inner_dec;
                                    //console.log('babel_node', babel_node);
                                    //console.log('node_inner_dec.name', node_inner_dec.name);
                                    //console.log('node_inner_dec.own_declaration_names', node_inner_dec.own_declaration_names);
                                } else {
                                    // ignore this case for the moment.
                                    /*
                                    console.log('odns', odns);
                                    console.log('odns.length', odns.length);
                                    console.log('node.source', node.source);
                                    throw 'stop';
                                    */
                                }
                                //console.log('node_inner_dec.source', node_inner_dec.source);
                            });
                            //throw 'stop';

                            // Having a problem doing the modifications now....
                            //  Possibly making the Babel layer would be of use.
                            //   Could put more Babel functionality there.
                            //    Make it clearer too.
                            //     Move out of comprehension.
                            //      Could call that Basic_Parse? Early_Parse makes sense.
                            //       Comprehension still there, but above Babel.
                            

                            each(own_remappings, (replacement, old) => {
                                console.log('old, replacement', [old, replacement]);
                                const node = map_nodes[old];
                                //console.log('node', node);
                                if (node) {
                                    console.log('node.source\n', node.source);
                                    console.log('node.babel_node', node.babel_node);

                                    if (node.babel_node.declarations.length === 1) {
                                        const babel_declarator = node.babel_node.declarations[0];
                                        console.log('babel_declarator', babel_declarator);

                                        babel_declarator.id.name = replacement;
                                        //throw 'stop';
                                    } else {
                                        throw 'stop';
                                    }
                                    console.log('');
                                }
                                

                            });
                            //console.log('node.babel_node', node.babel_node);
                        }

                    }
                    c++;
                });

                // this.source

                const output = generate(babel_ast, this.source);
                console.log('output.code', output.code);

            }


            //if (c >= 4) throw 'stop';

            //throw 'stop';

            // get map root node definitions by names
            // or property map_root_declarations
            //  by name can be implicit.

            // Will require accessing the associated babel nodes.
        }

    }
}
JS_File_Changing.load_from_stream = (rs, path) => {
    const res = new JS_File_Changing({rs: rs, path: path});
    return res;
}
module.exports = JS_File_Changing;
