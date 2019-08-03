/*
    Will move code from the js resource to here.
    Some code is a bit more general.

    Could have browserify here too?
    Idea being to make the js resource code a lot clearer and more concise.

*/

const {each} = require('lang-mini');


// Strings of js?
//  Array of lines?

// Dealing with array of lines makes sense here.

const analyse_js_doc_formatting = (str_js) => {

    let line_break;
    let s_js, str_indentation;

    //  or char code.

    // go through character by character.
    //  detect \r\n
    //  can try splitting by that first...

    const split_detect_line_break = () => {
        const s_rn = str_js.split('\r\n');

        if (s_rn.length > 1) {
            console.log('s_rn.length', s_rn.length);
            s_js = s_rn;
            line_break = '\r\n';
        } else {
            s_js = str_js.split('\n');
            line_break = '\n';
        }
    }

    split_detect_line_break();

    console.log('s_js.length', s_js.length);
    console.log('line_break', line_break);

    // a map of them?
    //  finding a common factor with all / almost all of them...
    //   most likely 2 or 4 with spaces.
    // maybe ignore the indentations with comment lines.

    
    // keep a map of the number of indentation characters
    //  then can detect if the factor is either 2 or 4.

    const map_num_spaces = {};


    // Find the proportion in this map that are a factor of both 2 and 4
    //  Find the proportion that fit in with each.

    // formatting parse.
    const analyse_indentation = () => {

        let line_beginning_spaces, line_beginning_tabs, l, i, stop;
        let line_begins_with_space, line_begins_with_tab;
        let count_lines_beginning_space = 0, count_lines_beginning_tab = 0;

        let arr_num_indentations = new Array(s_js.length);
        let arr_num_tabs = new Array(s_js.length);
        let arr_num_spaces = new Array(s_js.length);
        let arr_unindented_lines = new Array(s_js.length);

        let arr_indentation_parsed_lines = new Array(s_js.length);

        

        each(s_js, (line, line_num) => {
            line_begins_with_space = false;
            line_begins_with_tab = false;
            line_beginning_spaces = 0;
            line_beginning_tabs = 0;
            // should not be both tabs and spaces.
            //  error if there is a mix?
            //  or just consider it indented by whichever is first.
            l = line.length;
            i = 0;
            stop = false;
            while (i < l && stop === false) {
                // String#charCodeAt()
                const charcode = line.charCodeAt(i);
                if (i === 0) {
                    //console.log('');
                    //console.log('line', line);
                    //console.log('[i, charcode]', [i, charcode]);
                    //console.log('');

                    // space is 32
                    // tab is 9

                    if (charcode === 9) {
                        // tab
                        line_beginning_tabs++;
                        count_lines_beginning_tab++;
                        line_begins_with_tab = true;
                    } else if (charcode === 32) {
                        // space
                        count_lines_beginning_space++;
                        line_beginning_spaces++;
                        line_begins_with_space = true;
                    } else {
                        stop = true;
                    }
                } else {
                    if (line_begins_with_tab) {
                        // Indentation stops with any non-tab character.
                        if (charcode === 9) {
                            // tab
                            line_beginning_tabs++;
                            //count_lines_beginning_tab++;
                            //line_begins_with_tab = true;
                        } else {
                            stop = true;
                        }

                    } else if (line_begins_with_space) {
                        // Indentation stops with any non-space character.
                        if (charcode === 32) {
                            // tab
                            line_beginning_spaces++;
                            //count_lines_beginning_tab++;
                            //line_begins_with_tab = true;
                        } else {
                            stop = true;
                        }
                    } else {
                        throw 'Unexpected.';
                    }

                    // set the arrays of these counts per line.

                    if (line_beginning_tabs > 0) {
                        arr_num_tabs[line_num] = line_beginning_tabs;
                    }
                    if (line_begins_with_space > 0) {
                        arr_num_spaces[line_num] = line_beginning_spaces;
                    }

                }
                i++;
            }

            console.log('');
            console.log('line', line);
            console.log('line.length', line.length);
            console.log('line_begins_with_space', line_begins_with_space);
            console.log('line_begins_with_tab', line_begins_with_tab);
            console.log('line_beginning_spaces', line_beginning_spaces);
            console.log('line_beginning_tabs', line_beginning_tabs);


            if (line_begins_with_tab) {
                
                // A map of the number of tabs...?


            } else if (line_begins_with_space) {
                
                map_num_spaces[line_beginning_spaces] = map_num_spaces[line_beginning_spaces] || 0;
                map_num_spaces[line_beginning_spaces]++;
            }
        });

        // Determine if the indentation uses spaces or tabs.

        console.log('count_lines_beginning_space', count_lines_beginning_space);
        console.log('count_lines_beginning_tab', count_lines_beginning_tab);

        let str_indentation;

        // Go through the lines again I think....




        if (count_lines_beginning_space > count_lines_beginning_tab) {
            console.log('indentation uses spaces');
            console.log('map_num_spaces', map_num_spaces);

            // the proportion dividing into 4
            // proportion dividing into 2

            let count_factor_2 = 0;
            let count_factor_4 = 0;

            //let count_lines_beginning_space = 0;

            each(map_num_spaces, (num_occurrances, str_num_spaces) => {
                const num_spaces = parseInt(str_num_spaces, 10);
                if (num_spaces % 2 === 0) count_factor_2 += num_occurrances;
                if (num_spaces % 4 === 0) count_factor_4 += num_occurrances;
                //count_lines_beginning_space += num_occurrances;
            })

            console.log('count_factor_2', count_factor_2);
            console.log('count_factor_4', count_factor_4);
            console.log('count_lines_beginning_space', count_lines_beginning_space);

            let r2 = count_factor_2 / count_lines_beginning_space;
            let r4 = count_factor_4 / count_lines_beginning_space;

            console.log('r2', r2);
            console.log('r4', r4);

            // >= 90%.

            let indentation_length;

            if (r4 >= 0.9) {
                str_indentation = '    ';
                indentation_length = 4;
            } else if (r2 >= 0.9) {
                str_indentation = '  ';
                indentation_length = 2;
            } else {
                //throw 
                throw 'NYI';
            }

            console.log('arr_num_spaces', arr_num_spaces);

            // Then calculate how many indentations per line...

            // // arr_unindented_lines, arr_indentation_parsed_lines, arr_num_indentations

            each(arr_num_spaces, (num_spaces, line_num) => {
                const num_indentations = Math.floor((num_spaces || 0) / indentation_length);
                //console.log('num_indentations', num_indentations);
                arr_num_indentations[line_num] = num_indentations;
                const unindented_line = s_js[line_num].substr(num_indentations * indentation_length);
                //console.log('unindented_line', unindented_line);
                arr_unindented_lines[line_num] = unindented_line;
            })



        } else {
            console.log('indentation uses tabs');
            str_indentation = '\t';
            console.log('arr_num_tabs', arr_num_tabs);

            throw 'NYI';
        }

        console.log('str_indentation', str_indentation);
        console.log('str_indentation.length', str_indentation.length);
        // also the unindented string lines, alongside their indentation levels.
        // recreate the lines....
        //  


        // return unindented lines as well....

        const arr_res = new Array(s_js.length);
        for (let c = 0; c < s_js.length; c++) {
            arr_res[c] = [arr_num_indentations[c] || 0, arr_unindented_lines[c]];
        }

        const obj_res = {
            //js_lines: s_js,
            parsed_lines: arr_res,
            str_indentation: str_indentation
        }
        return obj_res;
        // If factor 4 is high enough...
        //  Want the total line count
        //  Total line count with any spaces...

    }

    const indentation_analysis = analyse_indentation();

    // Now go through the lines and look at indentation.

    const res = {
        arr_lines: s_js,
        line_break: line_break,
        indentation_analysis: indentation_analysis
    }

    return res;

}

// function to split out the client js from a root js file.

const extract_client_js = (js_formatting_info) => {
    const {line_break, indentation_analysis} = js_formatting_info;
    const {parsed_lines, str_indentation} = indentation_analysis;



    //  parsed line: [indentation level, str line]
    // takes the split lines...
    let block_type;
    // line types:
    //  require
    //  
    // only identify some specific types of lines.

    // Will need to change a / the jsgui3-html reference to jsgui3-client.
    let line_type;

    // And specific parsing for some line types.

    // Need to change a require line here.
    //const map_

    // Looking forward to making simple js demo and example files.
    //  running full apps from them.
    //   some easy copy and paste getting started examples.

    // Detect and parse?
    //  Makes sense to do parsing once it's detected.
    //  Maybe only need to parse require statements.


    // Removing comment blocks...?

    const map_line_type_detect_parse = {

        // beginning of server side block
        // end of code block

        begin_server_block: (line) => {
            // line beings: if (require.main === module) {
            console.log('line', line);
            console.log('typeof line', typeof line);
            if (line.startsWith('if (require.main === module) {')) return true;


            return false;
        },
        end_block: line => {


            // only having } in the line?
            
            console.log('line.length', line.length);

            if (line.length <3) {
                if (line.startsWith('}')) return true;
            }



            return false;

        },

        require: (line) => {
            let s1 = 'require(';
            let pos1 = line.indexOf(s1);
            let res = false;

            if (pos1 > -1) {
                let pos2 = pos1 + s1.length;
                let pos3 = line.indexOf(')');
                let rpath = JSON.parse(line.substring(pos2, pos3).split('\'').join('"'));
                console.log('rpath', rpath);

                //let res = ['require']

                res = {
                    name: 'require',
                    path: rpath
                }
            }
            return res;
        }
    }

    /*
    const map_line_type_parsing = {
        require: (line) => {

        }
    }
    */

    // Does seem like a bit more work to make this client js compilation from single file.
    //  Will greatly improve coder experience.

    // Marking the blocks first could make sense?

    // Determine the block types as we go through.
    //  At this stage, remove all server-side blocks.
    //   main module thing.

    // Result array...
    // Transformed lines...

    const arr_client_js_lines = [];
    each(parsed_lines, (arr_line_info, line_num) => {
        console.log();
        const [indentation_level, unindented_line] = arr_line_info;
        let res_unindented_line = unindented_line;

        line_type = undefined;
        let do_js_copy_to_client = true;
        
        if (indentation_level === 0) {
            console.log('unindented_line', unindented_line);

            

            each(map_line_type_detect_parse, (fn, name, stop) => {
                const detection = fn(unindented_line);
                console.log('detection', detection);

                if (detection) {
                    stop();
                    //const {name} = detection;
                    console.log('name', name);

                    // detection of the beginning / end of server side (main module) code.

                    if (name === 'require') {
                        const {path} = detection;
                        console.log('path', path);

                        // Can create a new / different line.
                        //  Depending on what gets required.

                        if (path === 'jsgui3-html') {
                            res_unindented_line = unindented_line.split('jsgui3-html').join('jsgui3-client');
                            console.log('res_unindented_line', res_unindented_line);
                        }
                        //
                    }

                    if (name === 'begin_server_block') {
                        block_type = 'server_block';
                    }
                    if (name === 'end_block') {
                        if (block_type === 'server_block') {
                            do_js_copy_to_client = false;
                        }
                        block_type = undefined;
                        
                    }

                    // if we are not in a server block, copy it over to the compiled client js result.

                    
                    

                    






                    // Check for block ends...

                }

                // or end of block.?
                // suppress line write
                

            })

            

            // Look at that line for some specific things.

            // line_type as well.
            // Already in a block_type?

            // Different possible statements.
            //  Some line types / code defs will be quite specific.

            // line begins 'const x = require(

            // Could textually break down the lines to make conclusions...
            //  Semicolon within strings may be a bit tricky.
            //   Avoid handling that right now.

            // different detection functions for specific things.
            //  go through them.
            //   specific detection functions for each line may work best and simplest. Not so good perf when it gets more complex.
            //    but this will be relatively simple.

        }

        if (block_type === 'server_block') {
            do_js_copy_to_client = false;
        }

        //console.log('res_unindented_line', res_unindented_line);

        console.log('do_js_copy_to_client', do_js_copy_to_client);
        if (do_js_copy_to_client) {
            // blank out the line?
            // and put the indentation amount back.
            let indent = str_indentation.repeat(indentation_level);
            arr_client_js_lines.push(indent + res_unindented_line);
        }
    })

    console.log('arr_client_js_lines', arr_client_js_lines);
    console.log('arr_client_js_lines.length', arr_client_js_lines.length);

    let client_js = arr_client_js_lines.join(line_break);


    return client_js;


}


//const split_client_server_js = ()


const process_js = {
    analyse_js_doc_formatting: analyse_js_doc_formatting,    // parse_js_lines?
    extract_client_js: extract_client_js

}

// analyse_js_doc_formatting extract_client_js

module.exports = process_js;

