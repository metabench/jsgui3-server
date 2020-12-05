const {each, Evented_Class} = require('lang-mini');
// caps, shift+r
const ErrorInterpretation = require('./ErrorInterpretation');
const Interpretation = require('./Interpretation');

// Worth making a substantial paltform on top of the already successful JS_AST_Node
//  It's the right way to get object lifecycle discovery supported on a lower level than it was at.

// Code often gets developed within the testing files, but then it needs to be put in a lower level.
//  It was being written with all sorts of long test names, did not appear sustainable and adaptable that way.

// The standard interpreter will have all sorts of useful interpretations loaded into it.
//  Will interpret enough to list what happens in terms of variables being declared and changed.
//  Seems like a good higher level of finding out and denoting what any code is for.

const JS_AST_Node = require('../JS_AST_Node');



//   Interpretations of programs include
//     What is required
//      full objects or keys from it
//     The varible names declared within the program scope, ofc including what is required
//     Variables getting set to literals - no problem including the literal values within the interpretation.
//     Array that tracks the declarations and changes to any variables declared in the scope
//     Map object that tracks the declared variables / classes themselves. Which keys do they have? What types are they where applicable?
//     What gets exported - and this could make use of the map object that knows what keys objects have

// The child processes could generate compression plans too
// Or themselves do compression?

// Compression would go deeper with variable renaming.
//  May be best to leave it, as we may want to make use of local variable names (probably will) to get plenty in the local scope and available.
//  Would need to come up with a compression schema that spans multiple JS files.

// Compression schema can be generated centrally, and compression instructions, or just a few specific rules, could be sent to the child processes to do the compression.
//  Aiming for a very high performance build system.
//   After compression, will do some forms of caching too, possibly using hidden files, or a smaller number of files that keep the interpreted info, and only updates them when the files have
//   changed.
//   Would use checksum comparison to spot file changes.

// Expect to make a surprisingly fast build system, and could even make it do distributed JS builds quickly.
//  Maybe could run it as a web service too. Likely not much point as there should be the power locally?
//   Could work well in some cases at least. Developing on Raspberry Pi for example, could reliably offload builds (or at least major parts of them) to an online service.


















// Looks like it will be quite a big task to get done.
//  Only needs to interpret the code (static analysis) rather than run it.

// Will be very useful because a separarte interpreter can run in each thread looking at separate JS files.
//  The interpretations will be useful to quickly compile the program.
//   Create build plan from the interpretations...

// Or use the interpretations to load the project or workspace scoped information.
//  Will be able to know about, and list, all the functions declared (as found by interpreter) within the program body scope, or whatever closure we are looking at (considering to be main)

// There may be some program signatures that mean it is to be interpreted differently.







// Can load signature tests and interpretations into the interpreter.


// Interpreter will have a variety of maps for node signatures.
//  Recognised node specialisations?

//  Registered node specialisations?

// nsr - node specialisation recognition
// nsr seems like a decent acronym and shorthand for something that could be used a lot.

// .add_node_speciality_description
//  says what the node does
//  the paths of the child nodes to extract
//   not so sure about any js algorithms to do any extraction. making it very declarative at this stage would be best
//   giving it a string query which it uses for extraction would be fine.
//    ability to extract multiple child nodes / properties from them, using a string query.
//    .nav('0/1/...') maybe or .nav('0/1/*') for all child nodes (as an array or queryable array-like)
//  so probably need only a small improvement to .nav for better extractions...?
//    .nav('0/*.name') would get all of the names as an array / array-like. Or some later part of a string query / additional parameter to say we want the names.
//  Though the algo could automatically get identifier names when we have the identifier very often
//   SO LONG AS NO AMBIGUITY GET INTRODUCED

//    .nav('ID')  


// load_specialisation_description({})

// .specialisations.load
// .count
// .list.name


// So each node specialisation should have

// Should it be able to use multiple signature tests?
//  Not sure of the point.
//   May make most sense if each node specialisation only applied to one signature.
//    Not so sure though.
//    Likely could use equivalent specialisations to do the same thing but with different signatures where required.


//  short_name
//  name
//  description
//  at least one of:
//   mid gen comp cat sig
//   mid gen comp type sig
//   mid comp cat sig
//   mid comp type sig
//   mid cat sig
//   mid type sig

// Mid level signatures seem OK for most of it

// Maybe use l4 and l5 signatures if they are needed to identify anything in particular, but right now it seems unlikely.
//  So checking against a variety of depth 3 signature indexes will be good enough to detect all the features being looked for for the moment.

// Should probably define specialisations for where we can certainly and unambiguously understand the syntax and get meaning interpreted from it.


/*
{


}

*/


// And need to have parsing of Confirmation Clause Language.
//  Parsing these confirmation clauses into proper OO makes sense for executing these well and having possible future queries of greater complexity.

//  Interestingly, could use the JS parsing we already have to make sense of these confirmation clauses.
//   Though they are not necessarily in JS, such as for the '='.

// Does look like using the JS parsing capabilities we already have is the way ahead here!
//  Fine to make use of all this stuff on a lower level.


class Extractor {
    constructor(spec = {}) {

        const map_extractor_tests_by_source = new Map();


        //const extract_from_node = (node, str_extraction) => {

        //}

        //this.extract = extract_from_node;

        const get_fn_spec_extract = (spec_extract) => {

            console.log('spec_extract', spec_extract);

            if (typeof spec_extract === 'string') {
                const js_ast = new JS_AST_Node({
                    source: spec_extract
                });
                console.log('js_ast.deep_type_signature', js_ast.deep_type_signature);
                console.log('js_ast.source', js_ast.source);

                const dts = js_ast.deep_type_signature;

                if (dts === 'ES(ME(CaE(ID,SL),ID))') {
                    const [id1, id2, sl] = js_ast.nav(['0/0/0', '0/1', '0/0/1']);
                    const [name1, name2, value] = [id1.name, id2.name, sl.value];


                    console.log('[id1, id2, sl]', [id1, id2, sl]);
                    console.log('[name1, name2, value]', [name1, name2, value]);

                    const [operation_name, property_name, path] = [name1, name2, value];


                    if (operation_name === 'nav') {

                        if (property_name === 'name') {

                            const fn_res = (node) => {
                                const found_node = node.nav(path);
                                if (found_node) {
                                    return found_node.name;
                                }
                            }
                            return fn_res;
                        } else {
                            throw 'Unsupported property name'
                        }

                    } else {
                        throw 'Unsupported extraction operation'
                    }


                } else {
                    throw 'Unsupported extraction operation'
                }

            } else {

                // Make it able to handle objects with multiple keys.
                //  Will extract multiple things that way.

                if (typeof spec_extract === 'object') {
                    if (Array.isArray(spec_extract)) {
                        throw 'stop';
                    } else {

                        const fn_res = (node) => {
                            const res = {};
                            each(spec_extract, (sub_spec_extract, key) => {
                                const fn_inner = get_fn_spec_extract(sub_spec_extract);
                                const inner_res = fn_inner(node);
                                res[key] = inner_res;
                            })

                            return res;

                        }
                        return fn_res;


                    }
                }



                
            }



            throw 'NYI';

        }

        this.get_fn_spec_extract = get_fn_spec_extract;
    }
    
}

const extractor = new Extractor();


class Confirmer {
    constructor(spec = {}) {


        const map_fn_confirmation_tests_by_arr_json = new Map();

        const map_fn_single_tests_by_js_source = new Map();

        // May be quite longwinded to support limited syntax.
        //  Still, it's an extensible mechanism for the queries to be expressed in JS, though it's really only looking out for a very limited range of queries
        //   ways to confirm a node.

        // Programmed in this kind of a way to better support the interpretation of nodes (particularly program child nodes) over multiple processes.
        //  Will be able to make a fast system that uses multiple cores to parse individual JS files.

        // These separate processes could be given renaming schemes determined centrally to use in a compression stage.
        //  Possibly the interpretations could provide far more, such as all (block) scopes where local variables can get declared.
        //   Need to consider function scope rules for var as well though.

        // The interpretations may be a good few KB each.
        // When deciding renaming, the central part would notify the processes of the new naming scheme
        //  possibly sending over the whole naming scheme?
        //  Seems better to send needed variable name changes over to the processes.
        //   The processes may hold JS files that refer to a name that gets shortened - so they will need to be made aware of changes to the names of anything they import.









        const create_fn_confirmation_test = (arr_confirmation_test) => {

            const arr_fn_subtests = [];


            if (Array.isArray(arr_confirmation_test)) {


                // console.log('arr_confirmation_test', arr_confirmation_test);

                // Should create sub-test functions I expect.

                each(arr_confirmation_test, js_ct => {
                    const js_ast = new JS_AST_Node({
                        source: js_ct
                    });
                    //console.log('js_ast.deep_type_signature', js_ast.deep_type_signature);
                    //console.log('js_ast.source', js_ast.source);

                    const dts = js_ast.deep_type_signature;


                    if (dts === 'ES(BE(ME(CaE(ID,SL),ID),SL))') {
                        const [be, id1, id2, sl1, sl2] = js_ast.nav(['0', '0/0/0/0', '0/0/1', '0/0/0/1', '0/1']);
                        //console.log('[be, id1, id2, sl1, sl2]', [be, id1, id2, sl1, sl2]);

                        const names = [id1.name, id2.name];
                        const values = [sl1.value, sl2.value];

                        //console.log('names', names);
                        //console.log('values', values);

                        //console.log('be.babel.node', be.babel.node);

                        const str_op = be.babel.node.operator;
                        if (str_op === '===') {

                            const [fn_name, property_name] = names;


                            if (fn_name === 'nav') {

                                if (property_name === 'name') {

                                    const [nav_path, expected_name] = values;

                                    const res_fn_test = node => {
                                        const navved_to_node = node.nav(nav_path);
                                        //console.log('navved_to_node', navved_to_node);
                                        if (navved_to_node) {
                                            const navved_to_node_name = navved_to_node.name;

                                            if (navved_to_node_name !== undefined) {
                                                return (navved_to_node_name === expected_name);
                                            }

                                            
                                        }
                                        return false;
                                    }

                                    arr_fn_subtests.push(res_fn_test);

                                    //const navved_to_node = 


                                } else {
                                    throw 'Unsupported property'
                                }


                            } else {
                                throw 'Unsupported operation'
                            }


                        } else {


                            throw 'Unsupported operator'


                        }


                    } else if (dts === 'ES(BE(ME(CaE(ID,SL),ID),ME(CaE(ID,SL),ID)))') {
                        console.log('js_ast.source', js_ast.source);


                    } else {

                        console.log('dts', dts);

                        throw 'Unrecognised syntax';

                    }
                })

            } else {
                throw 'stop';

            }

            console.log('arr_fn_subtests.length', arr_fn_subtests.length);


            const fn_res = node => {

                let passes = true;
                const l = arr_fn_subtests.length;
                let c = 0;

                while (passes && c < l) {
                    const fn_subtest = arr_fn_subtests[c++];
                    passes = passes && fn_subtest(node);
                }

                return passes;
            }
            return fn_res;
            //throw 'NYI';

        }

        
        this.get_fn_confirmation_test = arr_confirmation_test => {
            console.log('arr_confirmation_test', arr_confirmation_test);

            const ct_json = JSON.stringify(arr_confirmation_test);

            // is it cached???
            console.log('ct_json', ct_json);
            const cloned_arr_confirmation_test = JSON.parse(ct_json);

            const initially_found_fnconf = map_fn_confirmation_tests_by_arr_json.get(ct_json);

            if (initially_found_fnconf) {
                return initially_found_fnconf;
            } else {
                // need to create the confirmation test function.

                const new_fnconf = create_fn_confirmation_test(cloned_arr_confirmation_test);
                map_fn_confirmation_tests_by_arr_json.set(ct_json, new_fnconf);
                return new_fnconf;
            }

            //throw 'NYI';
        }

        this.confirm_node_specialisation = (node, arr_specialisation_confirmation) => {
            console.log('node', node);
            console.log('arr_specialisation_confirmation', arr_specialisation_confirmation);

            const fn_test = this.get_fn_confirmation_test(arr_specialisation_confirmation);
            console.log('fn_test', fn_test);

            return fn_test(node);

            throw 'NYI';

        }
    }

}
const confirmer = new Confirmer();









const get_interpretation_object_lifecycle_events = (interpretation) => {

    const res = [];

    //console.log('interpretation', interpretation);
    console.log('interpretation.specialisation_name:', interpretation.specialisation_name);
    console.log('interpretation.extracted:', interpretation.extracted);

    //throw 'stop';


    return res;
}

// A much more flexible, extensible and efficient way to see what a node does.


const confirm_node_specialisation = (node, obj_spec_spec) => {
    console.log('obj_spec_spec', obj_spec_spec);

    const obj_spec_confirm = obj_spec_spec.confirm;


    return confirmer.confirm_node_specialisation(node, obj_spec_confirm);


    // should be an array

    if (Array.isArray(obj_spec_confirm)) {
        console.log('obj_spec_confirm', obj_spec_confirm);
        let passing_tests_so_far = true; // no tests yet


        
        each(obj_spec_confirm, confirmation_test => {



            if (Array.isArray(confirmation_test)) {


                /*

                // length 3, middle one is '='
                //  equality test
                //   only test for the moment.
                //    Could even allow such tests to be nested. Not yet.


                if (confirmation_test.length === 3) {

                    if (confirmation_test[1] === '=') {



                        throw 'NYI';

                    } else {
                        throw 'NYI';
                    }


                } else {
                    throw 'NYI';
                }
                */


            } else {
                throw 'NYI' // Probably don't want to support functions, only syntax given in the simple and serialisable manner of js objects (potentially including string queries)
            }

        })


        // Then each item should be an array.

    } else {
        throw 'stop';
    }

    throw 'NYI';

}


class Interpreter extends Evented_Class {
    constructor(spec = {}) {
        super(spec);


        // array of all specialisations
        //  don't want to separately test for each of them.
        //  want to get the signatures, including various different types of them.

        // node.sig6 .mid6? .m6? .mid6sigs? .the_6_mid_signatures
        //  

        // Will need to register a signature for each specialisation.

        // A number of maps (1 to 1 enforced I think) of signatures (4 different mid sigs supported) that correspond to the specialisations.


        // indexes / maps of the different mid signatures to those specialisations.
        const map_gmid_cat_sps = new Map();
        const map_gmid_type_sps = new Map();
        const map_mid_cat_sps = new Map();
        const map_mid_type_sps = new Map();



        


        // Does not take a node in its spec.
        //  Maybe further rules
        //  However, want the default set of rules to be good enough to start with.
        //   Though that could be done using spec rule loading of course.

        const specialisations = {

            match: (node) => {

                // Does the node match any of the specialisations loaded?

                // First match by signature comparisons, then there will be other tests to be done sequentially
                //  

                const gmidcat = node.generalised_compressed_mid_type_category_signature;


                const found_spec_gmidcat = map_gmid_cat_sps.get(gmidcat);

                if (found_spec_gmidcat) {
                    console.log('found_spec_gmidcat', found_spec_gmidcat);
                    const confirmed = confirm_node_specialisation(node, found_spec_gmidcat);
                    console.log('1) confirmed', confirmed);
                    if (confirmed) return found_spec_gmidcat;


                } else {
                    const gmidtype = node.generalised_compressed_mid_type_signature;
                    const found_spec_gmidtype = map_gmid_type_sps.get(gmidtype);

                    if (found_spec_gmidtype) {
                        console.log('found_spec_gmidtype', found_spec_gmidtype);
                        const confirmed = confirm_node_specialisation(node, found_spec_gmidtype);
                        console.log('2) confirmed', confirmed);
                        if (confirmed) return found_spec_gmidtype;

                    } else {
                        const midcat = node.compressed_mid_type_category_signature;
                        const found_spec_midcat = map_mid_cat_sps.get(midcat);

                        if (found_spec_midcat) {
                            console.log('found_spec_midcat', found_spec_midcat);

                            const confirmed = confirm_node_specialisation(node, found_spec_midcat);
                            console.log('3) confirmed', confirmed);
                            if (confirmed) return found_spec_midcat;
                        } else {
                            const midtype = node.compressed_mid_type_signature;
                            const found_spec_midtype = map_mid_type_sps.get(midtype);

                            if (found_spec_midtype) {
                                console.log('4) found_spec_midtype', found_spec_midtype);

                                const confirmed = confirm_node_specialisation(node, found_spec_midtype);
                                console.log('4) confirmed', confirmed);

                                if (confirmed) return found_spec_midtype;


                            } else {
                                console.log('no matching node specialisation found for node', node);

                            }
                        }
                    }

                }
                return false;
                //if (map_gmid_cat_sps


                



                // Then a later function will do data extraction from that discovered specialised node.

            },

            add: (obj_specialisation_spec) => {

                // must have one of the signatures.

                // At this stage, can parse the confirmation parts

                // Could create a spec_confirmation class?
                //  spec_confirmer class maybe?

                // JS_AST_Node_Confirmer()

                // And the confirmer could be optimized separately if necessary.
                




                const {sig} = obj_specialisation_spec;

                // sig should be an object

                if (typeof sig === 'object') {

                    if (typeof sig.mid === 'object') {
                        const fn_confirm = confirmer.get_fn_confirmation_test(obj_specialisation_spec.confirm);


                        // .gtype
                        // .gcat
                        if (typeof sig.mid.type === 'string') {
                            // use 

                            if (map_mid_type_sps.has(sig.mid.type)) {
                                throw 'stop';
                            } else {
                                map_mid_type_sps.set(sig.mid.type, obj_specialisation_spec);
                            }

                        } else if (typeof sig.mid.cat === 'string') {
                            if (map_mid_cat_sps.has(sig.mid.cat)) {
                                throw 'stop';
                            } else {
                                map_mid_cat_sps.set(sig.mid.cat, obj_specialisation_spec);
                            }
                        } else if (typeof sig.mid.gtype === 'string') {
                            // use 
                            if (map_gmid_type_sps.has(sig.mid.gtype)) {
                                throw 'stop';
                            } else {
                                map_gmid_type_sps.set(sig.mid.gtype, obj_specialisation_spec);
                            }

                        } else if (typeof sig.mid.gcat === 'string') {
                            // use 
                            if (map_gmid_cat_sps.has(sig.mid.gcat)) {
                                throw 'stop';
                            } else {
                                map_gmid_cat_sps.set(sig.mid.gcat, obj_specialisation_spec);
                            }


                        } else {
                            throw 'Signatures must be given as strings'
                        }

                    } else {
                        throw 'Only mid (depth 3) signatures currently supported'
                    }

                } else {
                    throw 'stop';
                }


                // must have some means to identify it in an index.

            }

        };

        //let specialisations;
        Object.defineProperty(this, 'specialisations', {
            get() { 
                return specialisations;
            },
            enumerable: true,
            configurable: false
        });
        

    }
    interpret(node) {
        if (node.is_js_ast_node) {

            const interpret_node_child_nodes_as_scope = () => {
                const arr_object_lifecycle_events = [];
                node.query.each.child.exe(cn => {
                    const cn_interpretation = this.interpret(cn);
                    console.log('cn_interpretation', cn_interpretation);

                    if (cn_interpretation !== undefined) {
                        const cn_interpreted_object_lifecycle_events = get_interpretation_object_lifecycle_events(cn_interpretation);

                        if (cn_interpreted_object_lifecycle_events && cn_interpreted_object_lifecycle_events.length > 0) {
                            each(cn_interpreted_object_lifecycle_events, cn_int_lse => {
                                arr_object_lifecycle_events.push(cn_int_lse);
                            })
                        }
                        // Get the interpretation for the child node.
                        //  Use the interpretation to adjust variables....
                    }

                    
                })
            }

            if (node.type === 'Program') {

                // interpret child nodes as scope.
                //  want the lifecycle events for the object there.
                //  possibly, a full list of keys for each object whenever they get changed.
                //  be comprehensive, detailed, and unambiguous with the output. Not all would be needed and used.
                //   Can pass plenty of data between processes quickly if it's in a simple format.

                interpret_node_child_nodes_as_scope();



            } else if (node.type === 'BlockStatement') {

                // interpret child nodes as scope.
                //  want the lifecycle events for the object there.
                //  possibly, a full list of keys for each object whenever they get changed.
                //  be comprehensive, detailed, and unambiguous with the output. Not all would be needed and used.
                //   Can pass plenty of data between processes quickly if it's in a simple format.

                interpret_node_child_nodes_as_scope();



            } else if (node.type === 'File') {
                throw 'NYI';
            } else {
                



                console.log('node.compressed_mid_type_signature', node.compressed_mid_type_signature);
                console.log('node.generalised_compressed_mid_type_signature', node.generalised_compressed_mid_type_signature);
                console.log('node.compressed_mid_type_category_signature', node.compressed_mid_type_category_signature);
                console.log('node.generalised_compressed_mid_type_category_signature', node.generalised_compressed_mid_type_category_signature);
                console.log('node.source', node.source);


                // check the node signatures to see if it matches any of the stored specialisations.

                const m = this.specialisations.match(node);

                console.log('m', m);

                if (m) {

                    const spec_extract = m.extract;

                    if (typeof spec_extract === 'string') {
                        const fn_spec_extract = extractor.get_fn_spec_extract(spec_extract);
                        const extracted = fn_spec_extract(node);
                        console.log('extracted', extracted);

                        //return extracted;

                        const res = new Interpretation({
                            specialisation_name: m.name,
                            extracted: extracted
                        });
                        return res;
                        //throw 'NYI';
                    } else {

                        if (typeof spec_extract === 'object') {
                            if (Array.isArray(spec_extract)) {
                                throw 'stop';
                            } else {

                                // Can still use get_fn_spec_extract I expect?
                                //  So long as it can make the objects out of inner extractions

                                console.log('spec_extract', spec_extract);
                                const fn_spec_extract = extractor.get_fn_spec_extract(spec_extract);
                                const extracted = fn_spec_extract(node);
                                console.log('extracted', extracted);

                                const res = new Interpretation({
                                    specialisation_name: m.name,
                                    extracted: extracted
                                });
                                return res;

                            }
                        } else {
                            throw 'stop';
                        }


                        
                    }

                    


                    
                }




                //throw 'NYI';
            }

            // Interpretation will include a variety of pieces of information.

            // total depth
            // total node count
            // child node count


            // likely:
            //  locations of found code features
            //   which get found by patterns / tests

            // possibly:
            //  locations of found code patterns


        } else {
            return new ErrorInterpretation({
                message: 'Must provide a valid JS_AST_Node (or subclass of it, or API compatible alternative).'
            });
        }
    }
}

module.exports = Interpreter;