const JS_File_Query_Features = require('./JS_File_4.1-Query_Features.js');
const Variable_Name_Provider = require('../Variable_Name_Provider');
const { each } = require('lang-mini');
class JS_File_Planning extends JS_File_Query_Features {
    constructor(spec) {
        super(spec);

        // string path of the variable within the ast.
        //  can use that path to find the position at a later stage.
        //  Need to keep the planning stage separate for the moment.

        // Want a way to access the paths of the nodes too.

        // (node, path)

        // propose_local_variable_name_remapping

        const get_proposed_root_definitions_inner_name_remappings = this.get_proposed_root_definitions_inner_name_remappings = () => {
            const res = {};
            this.each_root_declaration(node => {
                //console.log('node', node);
                const idns = node.inner_declaration_names;
                //throw 'stop';

                if (idns.length > 0) {
                    //console.log('');
                    //console.log('node.own_declaration_names', node.own_declaration_names);

                    if (node.own_declaration_names.length === 1) {
                        const own_name = node.own_declaration_names[0];
                        //console.log('idns', idns);

                        const l_max = 2;

                        const arr_names_for_shortening = idns.filter(x => x.length > l_max);
                        //console.log('arr_names_for_shortening', arr_names_for_shortening);

                        if (arr_names_for_shortening.length > 0) {
                            const namer = new Variable_Name_Provider();
                            const map_renames = {};
                            each(arr_names_for_shortening, name => {
                                const new_name = namer.get_l();
                                map_renames[name] = new_name;
                            });
                            //console.log('map_renames', map_renames);
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
    }
}

module.exports = JS_File_Planning;
