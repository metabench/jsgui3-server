
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Available_In_Scope = require('./JS_AST_Node_2.5-Available_In_Scope');


function isLetter(c) {
    return c.toLowerCase() != c.toUpperCase();
}


class Signature_Node {
    constructor(spec = {}) {

        const child_nodes = [];
        this.child_nodes = child_nodes;
        this.append_child = (node) => child_nodes.push(node);


        this.create_child_node = name => {
            const res = new Signature_Node({
                name: name,
                depth: this.depth + 1,
                parent_node: this
            });
            this.append_child(res);
            return res;
        }

        const set_inner_from_string = (string) => {
            
        }


        // Bit of a long and tricky function but it works OK now, fairly efficient I think. Not recursive construction.
        const set_from_string = (string) => {
            //console.log('string', string);
            // term(...)
            const iterate_sig_string_items = (string, callback) => {
                const l = string.length;
                let depth = 0;
                let res = true;
                // need to check for just one outer layer item / node.

                let pos_name_started;

                const read_name = (pos) => {
                    const pos0 = pos_name_started;
                    const res = string.substring(pos0, pos);
                    //console.log('res', res);
                    return res;
                }

                let number = 0;


                const last_node_at_depth = {};

                //const arr_nodes_at_depth_0 = [];

                const collect_name = (pos, depth) => {
                    const name = read_name(pos);
                    //console.log('name', name, depth);
                    

                    last_node_at_depth[depth] = number;

                    const ocb = {
                        name: name,
                        start: pos_name_started,
                        end: pos,
                        depth: depth,
                        number: number++
                    }
                    if (depth > 0) {
                        ocb.parent_number = last_node_at_depth[depth - 1];
                    } else {
                        //if (depth === 0) {
                            //arr_nodes_at_depth_0.push(ocb);
                        //} else {
                            //throw 'stop';
                        //}
                    }
                    //const parent_number = 
                    callback(ocb);

                    
                }

                let last_char_was_punct = false;

                //const map_pos_depth_started = {
                //    0: 0
                //};

                for (let c = 0; c < l; c++) {
                    

                    const char = string[c];
                    //console.log('char', char);
                    //console.log('isLetter(char)', isLetter(char));
                    if (char === '(') {
                        if (!last_char_was_punct) collect_name(c, depth);
                        pos_name_started = undefined;
                        depth++;
                        //map_pos_depth_started[depth] = c;
                        last_char_was_punct = true;
                    } else if (char === ')') {
                        if (!last_char_was_punct) collect_name(c, depth);
                        pos_name_started = undefined;
                        //map_pos_depth_started[depth] = undefined; //???
                        depth--;

                        last_char_was_punct = true;
                    } else if (char === ',') {
                        if (!last_char_was_punct) collect_name(c, depth);
                        pos_name_started = undefined;
                        //depth--;

                        last_char_was_punct = true;
                    } else if (char === '_') { // treat like a letter
                        if (pos_name_started === undefined) pos_name_started = c;
                        last_char_was_punct = false;
                    } else if (isLetter(char)) {
                        if (pos_name_started === undefined) pos_name_started = c;
                        last_char_was_punct = false;

                        if (c === l - 1) {
                            collect_name(c + 1, depth);
                        }
                    } else {
                        //console.log('string', string);
                        throw 'stop';
                    }
                }


                //console.log('net depth', depth);
                if (depth === 0) {
                    //console.log('arr_nodes_at_depth_0.length', arr_nodes_at_depth_0.length);

                    //if (arr_nodes_at_depth_0.length === 1) {

                    //}
                } else {
                    //res = false;
                    throw 'Depth sync error';
                }
            }

            const validate_format = (string) => {

                // and the count at depth 0 here too...



                // byte by byte
                const l = string.length;
                let depth = 0;
                let res = true;
                // need to check for just one outer layer item / node.

                let pos_name_started;

                let depth_0_item_count = 0;

                const read_name = (pos) => {
                    const pos0 = pos_name_started;
                    const res = string.substring(pos0, pos);
                    //console.log('res', res);
                    return res;
                }

                const collect_name = (pos, depth) => {
                    const name = read_name(pos);
                    //console.log('name', name, depth);
                    if (depth === 0) depth_0_item_count++;
                }

                let last_char_was_punct = false;

                //const map_pos_depth_started = {
                //    0: 0
                //};

                for (let c = 0; c < l; c++) {
                    

                    const char = string[c];
                    //console.log('char', char);
                    //console.log('isLetter(char)', isLetter(char));
                    if (char === '(') {
                        if (!last_char_was_punct) collect_name(c, depth);
                        pos_name_started = undefined;
                        depth++;
                        //map_pos_depth_started[depth] = c;
                        last_char_was_punct = true;
                    }
                    if (char === ')') {
                        if (!last_char_was_punct) collect_name(c, depth);
                        pos_name_started = undefined;
                        //map_pos_depth_started[depth] = undefined; //???
                        depth--;

                        last_char_was_punct = true;
                    }
                    if (char === ',') {
                        if (!last_char_was_punct) collect_name(c, depth);
                        pos_name_started = undefined;
                        //depth--;

                        last_char_was_punct = true;
                    }
                    if (isLetter(char)) {
                        if (pos_name_started === undefined) pos_name_started = c;
                        last_char_was_punct = false;
                    }
                }
                //console.log('net depth', depth);
                if (depth === 0) {
                    if (depth_0_item_count === 1) {

                    } else {
                        return false;
                    }
                } else {
                    res = false;
                }
                return res;



            }

            const valid_format = validate_format(string);
            //console.log('valid_format', valid_format);

            // save the iteration as an array?
            //  want to check that there is only 1 item at depth 0.

            const onodes = {};

            const o_real_nodes = {};

            iterate_sig_string_items(string, ecb => {
                //console.log('ecb', ecb);
                const {number, depth, parent_number, name} = ecb;
                onodes[number] = ecb;

                if (number === 0) {
                    if (depth === 0) {
                        this.name = name;
                        o_real_nodes[0] = this;
                    } else {
                        throw 'stop';
                    }
                } else {
                    const real_parent = o_real_nodes[parent_number];
                    //console.log('parent_number', parent_number);
                    //console.log('real_parent', real_parent);
                    //console.log('o_real_nodes', o_real_nodes);

                    if (real_parent) {
                        const new_node = real_parent.create_child_node(name);
                        //console.log('new_node', new_node);
                        o_real_nodes[number] = new_node;
                    } else {
                        throw 'stop';
                    }
                }
            })

            //console.log('onodes', onodes);

            //throw 'stop';
        }



        if (spec.string) {
            //console.log('spec.string', spec.string);
            set_from_string(spec.string);
        }

        if (spec.name) this.name = spec.name;
        if (spec.depth) this.depth = spec.depth;
        if (spec.parent_node) this.parent_node = spec.parent_node;

        let _signature;

        Object.defineProperty(this, 'signature', {
            get() { 

                if (!_signature) {
                    let sig = '';
                    sig = sig + this.name;
                    //console.log('this.child_nodes.length', this.child_nodes.length);
                    if (this.child_nodes.length > 0) {
                        sig = sig + '(';
                        let first = true;
                        each(this.child_nodes, cn => {
                            if (!first) {
                                sig = sig + ',';
                                
                            } else {
                                first = false;
                            }
                            sig = sig + cn.signature;
                        });
                        sig = sig + ')';
                    }
                    _signature = sig;
                }
                return _signature;
                
            },
            enumerable: true,
            configurable: false
        });

        // iterate child sequences?

        Object.defineProperty(this, 'generalised_compressed_signature', {
            // A tool for matching, rather than for restricted expression of what is correct.
            get() {
                let first = true, res = '';

                res = res + this.name;

                const handle_sequence = (sig, repetitions) => {
                    //console.log('sig', sig);
                    if (!first) {
                        res = res + ',';
                    } else {
                        first = false;
                    }
                    if (repetitions > 1) {
                        res = res + '1+';
                    }
                    //res = res + '[' + sig + ']'; // for clarity???
                    res = res + sig; // for clarity???
                    //return res;
                }
                if (this.child_nodes.length > 0) {
                    res = res + '(';


                    let last_sig;
                    let num_repetitions;
                    each(this.child_nodes, (cn, idx) => {
                        
                        const sig = cn.generalised_compressed_signature;

                        if (last_sig === sig) {
                            num_repetitions++;
                        } else {
                            
                            if (idx > 0) {
                                handle_sequence(last_sig, num_repetitions);
                            }
                            num_repetitions = 1;
                        }

                        if (idx === this.child_nodes.length - 1) {
                            handle_sequence(sig, num_repetitions);
                        }
                        last_sig = sig;

                        //sig = sig + cn.signature;
                    });

                    res = res + ')';

                }

                
                return res;
            },
            enumerable: true,
            configurable: false
        });
        

        Object.defineProperty(this, 'compressed_signature', {
            get() {
                let first = true, res = '';

                res = res + this.name;

                const handle_sequence = (sig, repetitions) => {
                    //console.log('sig', sig);
                    if (!first) {
                        res = res + ',';
                    } else {
                        first = false;
                    }
                    if (repetitions > 1) {
                        res = res + repetitions;
                    }
                    //res = res + '[' + sig + ']'; // for clarity???
                    res = res + sig; // for clarity???
                    //return res;
                }
                if (this.child_nodes.length > 0) {
                    res = res + '(';


                    let last_sig;
                    let num_repetitions;
                    each(this.child_nodes, (cn, idx) => {
                        
                        const sig = cn.compressed_signature;

                        if (last_sig === sig) {
                            num_repetitions++;
                        } else {
                            
                            if (idx > 0) {
                                handle_sequence(last_sig, num_repetitions);
                            }
                            num_repetitions = 1;
                        }

                        if (idx === this.child_nodes.length - 1) {
                            handle_sequence(sig, num_repetitions);
                        }
                        last_sig = sig;

                        //sig = sig + cn.signature;
                    });

                    res = res + ')';

                }

                
                return res;


            },
            enumerable: true,
            configurable: false
        });

        // Get a compressed signature property.

        // When going through child nodes, get the (compressed) signature of those child nodes, and when they are repeated, build a cache of repeated
        
        // Analysis of repeated child signatures?
        //  All repeated, relatively easy.
        
        // When we read a child sig, check the child sig stack
        //  No items on stack: put new sig item on stack
        //  One item already on stack: Check if it's the same as the one on the stack
        //   is the same - put it on the stack
        //   is not the same: empty the stack, putting the stacked sigs into the result
        // When done with the children, empty the stack.

        // Look ahead, spot repeats?
        // Look into, spot repeats?

        // Normal sig: but are all the child node sigs repeated?
        //  Only checking for all repeated internally?
        //  Want better pattern recognition.

        // Could create map / index of internal signatures?
        //  Could make a compression scheme at the beginning with algrebra?
        //  

        // So put the child results into a signature buffer.
        // Then read through the signature buffer, appropriately writing results to the string.











    }

}



// Parsed Signature?
// Maybe dont need
class Signature_Tree {
    constructor(spec = {}) {

        // Single root node

    }

}

const compress_signature = str_signature => {
    // Can try doing this just in terms of the string...

    // So can look ahead / behind for repeating terms

    // Will, from the cursor, run checks for repeated sections.

    
    //console.log('compress_signature str_signature', str_signature);
    //let i = 0;

    // look ahead for repeated patterns?

    // at each character
    //  find the next


    // need to go through the string, character by character
    // will need to know what completed terms are behind it.

    // Seems like full-on tree parsing is what is required.

    const parsed_signature = new Signature_Node({string: str_signature});
    //console.log('parsed_signature', parsed_signature);


    return parsed_signature.compressed_signature;
}


const gcompress_signature = str_signature => {
    // Can try doing this just in terms of the string...

    // So can look ahead / behind for repeating terms

    // Will, from the cursor, run checks for repeated sections.

    
    //console.log('compress_signature str_signature', str_signature);
    //let i = 0;
    const parsed_signature = new Signature_Node({string: str_signature});
    //console.log('parsed_signature', parsed_signature);
    return parsed_signature.generalised_compressed_signature;
}


class JS_AST_Node_Signature extends JS_AST_Node_Available_In_Scope {
    constructor(spec = {}) {
        super(spec);
        const {each_child_node} = this;
        let deep_type_signature, type_signature, category_signature, mid_category_signature;


        let shallow_type_signature, shallow_type_category_signature;

        let middeep_type_category_signature, middeep_type_signature;
        // and then a more shallow type signature.
        //   type_signature could go to depth 2 or 3. Let's try it.
        // Want to be able to get small and usable signatures.

        // Want max depth for the iteration.
        //  The stop function integrated within the iteration would be useful there to get that done.
        //  Maybe an 'options' object now params have got more complex.

        const get_deep_type_signature = (max_depth) => {
            //let res = '[' + this.type + '(';
            //if (!deep_type_signature) {
            //console.log('');
            //console.log('this.path', this.path);
            //console.log('this.type', this.type);

            //let starting_depth = this.depth;

            if (get_deep_type_signature === undefined) {
                console.trace();
                throw 'stop';
            }

            if (max_depth > 0) {
                let res = '' + this.abbreviated_type, inner_res = '', first = true;

                // Only look at child nodes, not full tree here.
                // each_child_node   inner_deep_iterate
                //  seems fixed now.
                // no longer supports max_depth but at least it works now.

                each_child_node(inner_node => {
                    if (!first) inner_res = inner_res + ','
                    inner_res = inner_res + inner_node.get_deep_type_signature(max_depth - 1)
                    if (inner_res.length > 0) first = false;
                    
                });
                //res = res + ')';
                if (inner_res.length > 0) {
                    res = res + '(' + inner_res + ')';
                } else {

                }
                return res;
            } else {
                return '';
            }

            
        }

        const get_deep_type_category_signature = (max_depth) => {
            //console.log('max_depth', max_depth);
            if (max_depth > 0) {
                let res = '' + this.abbreviated_type_category, inner_res = '', first = true;

                // Only look at child nodes, not full tree here.
                // each_child_node   inner_deep_iterate
                //  seems fixed now.
                // no longer supports max_depth but at least it works now.

                each_child_node(inner_node => {
                    if (!first) inner_res = inner_res + ','
                    inner_res = inner_res + inner_node.get_deep_type_category_signature(max_depth - 1)
                    if (inner_res.length > 0) first = false;
                    
                });
                //res = res + ')';
                if (inner_res.length > 0) {
                    res = res + '(' + inner_res + ')';
                } else {

                }
                return res;
            } else {
                return '';
            }
        }


        Object.defineProperty(this, 'type_signature', {
            get() { 
                if (!type_signature) type_signature = get_deep_type_signature(100);
                //if (deep_type_signature) return deep_type_signature;
                return type_signature;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'type_category_signature', {
            get() { 
                if (!category_signature) category_signature = get_deep_type_category_signature(100);
                //if (deep_type_signature) return deep_type_signature;
                return category_signature;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'middeep_type_category_signature', {
            get() { 
                if (!middeep_type_category_signature) middeep_type_category_signature = get_deep_type_category_signature(5);
                //if (deep_type_signature) return deep_type_signature;
                return middeep_type_category_signature;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'mid_type_category_signature', {
            get() { 
                if (!mid_category_signature) mid_category_signature = get_deep_type_category_signature(4);
                //if (deep_type_signature) return deep_type_signature;
                return mid_category_signature;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'shallow_type_category_signature', {
            get() { 
                if (!shallow_type_category_signature) shallow_type_category_signature = get_deep_type_category_signature(3);
                //if (deep_type_signature) return deep_type_signature;
                return shallow_type_category_signature;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'shallow_type_signature', {
            get() { 
                if (!shallow_type_signature) shallow_type_signature = get_deep_type_signature(3);
                //if (deep_type_signature) return deep_type_signature;
                return shallow_type_signature;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'deep_type_signature', {
            get() { 
                if (!deep_type_signature) deep_type_signature = get_deep_type_signature(100);
                //if (deep_type_signature) return deep_type_signature;
                return deep_type_signature;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'middeep_type_signature', {
            get() { 
                if (!middeep_type_signature) middeep_type_signature = get_deep_type_signature(5);
                //if (deep_type_signature) return deep_type_signature;
                return middeep_type_signature;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });


        Object.defineProperty(this, 'compressed_middeep_type_signature', {
            get() { 
                const mts = this.middeep_type_signature;
                const compressed = compress_signature(mts);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'compressed_mid_type_signature', {
            get() { 
                const mts = this.mid_type_signature;
                const compressed = compress_signature(mts);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'compressed_shallow_type_signature', {
            get() { 
                const mts = this.shallow_type_signature;
                const compressed = compress_signature(mts);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'compressed_mid_type_category_signature', {
            get() { 
                const mts = this.mid_type_category_signature;
                const compressed = compress_signature(mts);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'compressed_middeep_type_category_signature', {
            get() { 
                const mts = this.middeep_type_category_signature;
                const compressed = compress_signature(mts);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'compressed_shallow_type_category_signature', {
            get() { 
                const mts = this.shallow_type_category_signature;
                const compressed = compress_signature(mts);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // generalised_compressed_deep_type_signature

        Object.defineProperty(this, 'generalised_compressed_shallow_type_signature', {
            get() { 
                const mts = this.shallow_type_signature;
                const compressed = gcompress_signature(mts);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'generalised_compressed_deep_type_signature', {
            get() { 
                const mts = this.deep_type_signature;
                const compressed = gcompress_signature(mts);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'generalised_compressed_mid_type_signature', {
            get() { 
                const mts = this.mid_type_signature;
                const compressed = gcompress_signature(mts);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'generalised_compressed_middeep_type_signature', {
            get() { 
                const mts = this.middeep_type_signature;
                const compressed = gcompress_signature(mts);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // gcompress_signature 

        Object.defineProperty(this, 'generalised_compressed_signature', {
            get() { 
                const mts = this.type_signature;
                const compressed = gcompress_signature(mts);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'generalised_compressed_type_category_signature', {
            get() { 
                const sig = this.type_category_signature;
                const compressed = gcompress_signature(sig);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'generalised_compressed_mid_type_category_signature', {
            get() { 
                const sig = this.mid_type_category_signature;
                // console.log('sig', sig);
                const compressed = gcompress_signature(sig);
                // console.log('compressed', compressed);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'generalised_compressed_middeep_type_category_signature', {
            get() { 
                const sig = this.middeep_type_category_signature;
                // console.log('sig', sig);
                const compressed = gcompress_signature(sig);
                // console.log('compressed', compressed);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'generalised_compressed_shallow_type_category_signature', {
            get() { 
                const sig = this.shallow_type_category_signature;
                // console.log('sig', sig);
                const compressed = gcompress_signature(sig);
                // console.log('compressed', compressed);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'compressed_signature', {
            get() { 
                const mts = this.type_signature;
                const compressed = compress_signature(mts);
                return compressed;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        // pc.mid_signature

        Object.defineProperty(this, 'mid_type_signature', {
            get() { 
                return get_deep_type_signature(4);
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'signature', {
            get() { 
                return this.type_signature
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        this.get_deep_type_signature = get_deep_type_signature;
        this.get_deep_type_category_signature = get_deep_type_category_signature;

        // Not sure where advanced signatures will fit in.
        //  Possibly with the .extract command and .query.extract.exe('advanced extraction signature')
        //   eg ArP(ID*,ID*,ID*) extracts them into an array
        //   eg ArP(ID*n,ID*n,ID*n) to get the names
        //  Be able to parse an advanced signature, and produce a basic signature from it.
        //   This will find the node where the extraction takes place.

        // extracting from inner paths too...

        // this.extract_inner_path_nodes(['0/0', '1/0']);
        // // this.extract_by_inner_path
        // this.collect.by.inner.path?
        //  some of these extractions would come under 'collect'.
        //   when they get collected into an array.

        // find_by_inner_path

        // and paths of nodes relative to each other.

        // node.path_from
        //  ../ being parent node.

        



        //  That seems like a way along the way to extracting using the advanced signatures.
        //  Extraction with advanced signatures could make concise and clear code that extracts data from AST trees.


    }
}

module.exports = JS_AST_Node_Signature;



// Scope next...?
//  A function that iterates backwards through the scope.

// .scoped being a group of those scoped nodes

// node.scope.find.identifier.by.name(n)

// node.scope.all.declaration

// node.scope.each.declaration()

// node.shared.scope.all being all nodes in the shared scope
// node.scope being the scope internal to that node itself?

// Will have some kinds of more basic processes that deal with scope.
//  not so OO to begin with, but ability to get the names of all declarations in scope.

// The scope or maybe in_scope relationship could be a useful way to do it.
//  Also_In_Scope relationship?
//  Available_In_Scope
// 2.5-Available_Declarations_In_Scope
//  Just In_Scope as a relationship works OK.
//   Available_In_Scope is a bit clearer though. Maybe In_Scope is fine when it's a relationship, it's clear enough maybe.



if (require.main === module) {
    //console.log('called directly');

    const str_sig = 'ES(CaE(ME(ID,ID),ID,OE(OPr(ID,ID),OPr(ID,ID),OPr(ID,SL),OPr(ID,ID))))';
    const parsed_sig = new Signature_Node({string: str_sig});

    console.log('str_sig', str_sig);
    console.log('parsed_sig', parsed_sig);
    console.log('parsed_sig.signature', parsed_sig.signature);
    console.log('parsed_sig.compressed_signature', parsed_sig.compressed_signature);

    // Be able to generalise
    //  May only be appropriate in some cases.
    //   Would turn all numbers greater than 1 into 1+ - but that's wrong in some situations.
    //    It would have to depend on 
    //   Would be used to search for cases

    // What about getting compressed signatures directly from the nodes, without having to parse and remake the signatures?
    //  not sure for the moment, may want to make changable compression schemes.







} else {
    //console.log('required as a module');
}


