
const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Available_In_Scope = require('./JS_AST_Node_2.5-Available_In_Scope');


class JS_AST_Node_Signature extends JS_AST_Node_Available_In_Scope {
    constructor(spec = {}) {
        super(spec);
        const {each_child_node} = this;
        let deep_type_signature, type_signature;
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

        const compress_signature = (str_signature) => {
            // Could even parse it?
            //  Seems easier to compress it as text.

            // Kind of parse...
            //  go through it byte by byte
            //   track the bracket level

            // collect the terms within the brackets.
            //  when we have repeating terms, denote [digit]term
            //   such as 3[ME(ID,ID)]
            //   such as 1+[ME(ID,ID)] when generalised
            //   or      2+[ME(ID,ID)]   maybe, could be an option.
            //    square brackets look helpful when it's more than one short item
            //     could have a sequence to be repeated inside the square brackets.
            //      maybe will do lookback sequence spotting.
            //       the compression could then be more easily generalised

            // This looks like it will be the right kind of syntax to use to pick nodes with specific properties.

            // Once we spot that a node follows a pattern, we can extract the data from inner parts of it.

            // compressed generalised signature call mapping will be useful.
            //  will enable finding objects that match wanted patterns.

            
            


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






