const JS_File_Query_Features = require('./JS_File_4.1-Query_Features.js');
const Variable_Name_Provider = require('../Variable_Name_Provider');
const { each } = require('lang-mini');
class JS_File_Planning extends JS_File_Query_Features {
    constructor(spec) {
        super(spec);

        // Overview?


        // a .module_outline_info or module_io_info makes sense.

        // .module_io_info

        // .io_info property makes a lot of sense when it comes to knowing the keys that get imported and exported
        //  and possibly a little more about those keys.
        //   Could use placeholders for the moment.
        //    Seems like the best ways to refer to things outside of the file.


        // Finding patterns, such as:

        // VDn(VDr()?) // eg optional
        // VDn(VDr()+) // meaning 1 or more
        // VDn(VDr()*) // 0 or more???
        // VDn(ID, ?)

        // Lower level detail of indexing, indexing in a way so that wildards can find it
        //  or at least any number of repeated child nodes.
        
        // automated indexing?

        // query.index.lookup
        // query.index.ensure.exe(index_name, fn_node_to_index_key_string)


        // Default indexes?
        //  Lazily loaded default indexes.

        // .ensure_default_index(default_index_name);

        // for the moment just ensuring a bunch of named indexes would work.
        //  Would create the indexes mainly on the Program node.

        // Creation of node flags and sets would be useful too.

        









        // string path of the variable within the ast.
        //  can use that path to find the position at a later stage.
        //  Need to keep the planning stage separate for the moment.

        // Want a way to access the paths of the nodes too.

        // (node, path)

        // propose_local_variable_name_remapping

        /*

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
        */



        // file.module_import_declare_assign_export_info
        // file.module_lifecycle_info = file.module_import_declare_assign_export_info


        // .lifecycle_info?
        // .module_outline_info
        //  seems like a useful property that itself could have a lot of information.

        // Iterate over child nodes with a pattern matcher.
        //  And it would want to match specific nodes in specific positions.

        // Improved indexing of all statements would help.
        //  Meaning we are able to find all assignments to a specific node.

        // More advanced and specific indexing of nodes would definitely help.
        //  Possibly best to code it so that queries can be replaced once there is an index.
        //   Or call an appropriate query with result caching / indexing?

        // Call maps on generalised signatures?
        //  Meaning there could be x children of type in some situations.

        // Iterating all nodes, but being on the lookout for a bunch of specific code patterns.







        



        // .module_io_info property

        // information on what is required
        //  which keys are provided
        //  provided directly from imported module
        //  provided as properties of imported module

        // then what happens to those keys as the module proceeds
        //  .property
        //  Object.assign(obj, {...})
        // so track which keys get added to the object throughout the program, going through the program child nodes to see if any of them assign anything to any of the imported objects.

        // an object created that is an instance of a class defined or imported
        //  



        // then see what gets exported, including object









    }
}

module.exports = JS_File_Planning;
