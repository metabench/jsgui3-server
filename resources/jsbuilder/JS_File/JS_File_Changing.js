const JS_File_Comprehension = require('./JS_FIle_Comprehension');
const Variable_Name_Provider = require('../Variable_Name_Provider');
const { each } = require('../../../../../tools/arr-tools/arr-tools');

class JS_File_Changing extends JS_File_Comprehension {
    constructor(spec) {
        super(spec);

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
        




        const get_proposed_root_definitions_inner_name_remappings = this.get_proposed_root_definitions_inner_name_remappings = () => {
            const res = {};
            this.each_root_declaration(node => {
                //console.log('node', node);
                const idns = node.inner_declaration_names;
                //throw 'stop';

                if (idns.length > 0) {
                    console.log('');
                    console.log('node.own_declaration_names', node.own_declaration_names);

                    if (node.own_declaration_names.length === 1) {
                        const own_name = node.own_declaration_names[0];
                        console.log('idns', idns);

                        const l_max = 2;

                        const arr_names_for_shortening = idns.filter(x => x.length > l_max);
                        console.log('arr_names_for_shortening', arr_names_for_shortening);

                        if (arr_names_for_shortening.length > 0) {
                            const namer = new Variable_Name_Provider();
                            const map_renames = {};
                            each(arr_names_for_shortening, name => {
                                const new_name = namer.get_l();
                                map_renames[name] = new_name;
                            });
                            console.log('map_renames', map_renames);
                            res[own_name] = map_renames;
                        }


                    } else {
                        console.log('node', node);
                        throw 'stop';
                    }
                }

            });
            return res;
        }

        this.remap_root_definition_inner_names = () => {
            const remappings = get_proposed_root_definitions_inner_name_remappings();
            
            // then access the root nodes by these keys...

            // get map root node definitions by names
            // or property map_root_declarations
            //  by name can be implicit.

        }

    }
}
JS_File_Changing.load_from_stream = (rs, path) => {
    const res = new JS_File_Changing({rs: rs, path: path});
    return res;
}
module.exports = JS_File_Changing;
