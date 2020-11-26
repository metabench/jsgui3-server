

const JS_File = require('../JS_File/JS_File');
const Workspace = require('../Workspace');
//const JS_File_Comprehension = require('../JS_File_Comprehension');
const path = require('path');
const fs = require('fs');
const Project = require('../Project');
const {each} = require('lang-mini');


const test_workspace = () => {

    const lm_path = '../../../../../tools/lang-mini/lang-mini.js'
    const lt_path = '../../../../../tools/lang-tools/lang.js'
    const fnl_path = '../../../../../tools/fnl/fnl.js'
    const filecomp_path = '../JS_File_Comprehension.js';
    const jsfile_path = '../JS_File/JS_File.js';
    const jsbuilder_path = '../JS_Builder.js';
    //const file_path = '../JS_File.js';
    const file_path = lm_path;
    // path of lang mini...

    // Write and test a simple and convenient way for analysing JS files and recompiling them.
    // To start with, find the ways to arrange parts of the JS into 'platforms'.
    // How to then build platforms into JS files.
    //  Will be about closures and sequences.
    //  A lot about unique naming, closures, and getting the sequence of definitions correct.
    // ObjectPattern
    const resolved_path = path.resolve(file_path);
    //console.log('resolved_path', resolved_path);

    const fstream = fs.createReadStream(resolved_path);

    const workspace = new Workspace({
        files: ['../../../../../tools/lang-mini/lang-mini.js', '../../../../../tools/lang-tools/lang.js', '../../../../../tools/fnl/fnl.js'].map(p => path.resolve(p))
    });
    
    //workspace.load_file_stream(resolved_path, fstream);

    workspace.on('add-file-complete', e_add_file_complete => {
        // Imports
        // All the variables declared in the scope, and their names.
        // Exports

        //console.log('e_add_file_complete', e_add_file_complete);
        console.log('Object.keys(e_add_file_complete)', Object.keys(e_add_file_complete));

        const {js_ast_node} = e_add_file_complete;
        console.log('js_ast_node.inner.count', js_ast_node.inner.count);


        // query for the exported keys of any file.
        //  moving that test code into file feature exported keys makes sense.

        // file_name_conflicts

    });

    workspace.on('ready', () => {
        // Look at the index_declaration_names_to_files

        console.log('workspace.index_declaration_names_to_files', workspace.index_declaration_names_to_files);


        // any file name conflicts?
        //  an index of files by names to their paths....

        // index_file_names_to_paths
        console.log('workspace.index_file_names_to_paths', workspace.index_file_names_to_paths);

        console.log('workspace.file_name_conflicts', workspace.file_name_conflicts);

        console.log('workspace.index_js_files_by_name', workspace.index_js_files_by_name);

        const js_file_entries = workspace.index_js_files_by_name.entries();
        console.log('js_file_entries', js_file_entries);


        // The workspace should index the declared objects by type as it goes through?
        //  Or further queries will work that out?

        // The 'features' API on a JS file seems like the right level of abstraction.
        //  Now the improved query (including extraction) system makes the code for finding / referencing those features much more streamlined.
        //   It also introduces query abstractions that would make index lookup possible within these queries, while keeping the same API.

        





        const lang_mini_file = workspace.index_js_files_by_name.get('lang-mini.js')[0];
        console.log('lang_mini_file', lang_mini_file);
        console.log('lang_mini_file.features', lang_mini_file.features);
        console.log('lang_mini_file.features.names', lang_mini_file.features.names);
        console.log('lang_mini_file.features.imported', lang_mini_file.features.imported);
        console.log('lang_mini_file.features.exported', lang_mini_file.features.exported);
        console.log('lang_mini_file.features.exported.value', lang_mini_file.features.exported.value);
        console.log('lang_mini_file.features.exported.value.object_declaration_node.source', lang_mini_file.features.exported.value.object_declaration_node.source);


        // Get keys from a variable declaration.

        // object_declaration_node
        console.log('lang_mini_file.path', lang_mini_file.path);


        // Put it into a platform I expect.
        //   Platform should maybe use some kind of double-link-list? Want it to be very fast to insert code in between other pieces of code.

        // Platforms containing subplatforms?
        //  Platforms only containing declarations? Makes sense for the moment.




        const output_js = workspace.build_output(['is_arr_of_arrs']);

        console.log('output_js', output_js);

        // Makes sense to have a list of features that could be undefined.
        //  eg.imported could be left undefined if there are none.



        // file_name_conflicts
    })

    // then respond when all the files are loaded.

    // workspace ready event?






    // Imports:
    //  Any special case where it's impored under a different name?
    //  In that case, we could create a new const that uses the wanted name.
    //   Need to be careful about not double declaring variables within a larger scope.

    // Should probably get variable name tranformations working first...
    //  When writing to a single scope, it's almost inevitable there would be some variable name conflict before long.
    //  Ability to rename non-exported variables.
    //  Scoping - could have a function that returns the exported variables.
    //   Even like const [v, v2, v3] = get_scope_exports();
    //    But that makes for less compression.
    //  For the moment, want to stick it all in a flat scope.
    //  Would be interesting to provide jsgui / jsgui client to an inner scope where code can just be put inside, and the API is there.
    //   Could have compression that is used before those API objects are produced.

    // Tracking what variables are in place in the new global scope.
    //  Asking a planner what variables it plans to add when it's going to add another class to the scope.











    //  Consider different options for variable names and scoping.
    //  And different candidate / possible transformations being generated. Possibility of unit tests and benchmarks to choose.


    



    // worspace.load_files_by_path([...])
    //  give the path, and it should work out what the files are about.

    // Then as it loads the files (sequentially to start with) it carries out some analysis on each of them.
    //  Will provide that analysis through events.

    // Then when all the files have loaded
    //  Will be able to determine if we have all the requirements for any particular loaded module.
    //   If not, then would be able to find out what the missing modules / files are.

    // Recursive loading of files into the project space will get it done.

    // Workspace would also be useful for working on some particular files together, creating a composite file. We would also know what was required into that composite file.










}

test_workspace();