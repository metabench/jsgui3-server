// Indexes because it keeps multiple indexes, ie an index of indexes.


// May abandon this object. It will just be direct object references.
class JS_AST_Node_Indexes {
    // Not a type of JS_AST_Node! Change the name?
    constructor(spec = {}) {

        // Two maps: for child nodes?
        // For inner nodes?
        // For all nodes? So the node itself could appear in its own index.
        //  Don't see why not, go for that rather than inner?

        //  Or the inner index can recursively check all its child nodes' own inner indexes, not the 'all' indexes.

        // Go for child indexes to start with.

        // Indexes made lazily on load too.

        // and .index becomes .sibling_index again

        // .lookup_index
        // .lookup_tool

        // .child.index

        // .indexes by relationship

        // .indexes.child.generalised_compressed_type_signature[sig];

        //  a simple object would suffice.
        //   they get put there if there is any value I suppose.
        //    results get put in place during indexing, so it's not a matter of calling a find function, just retrieve it from the index object.





        // index_related_nodes(child_relationship, )


        const map_indexes = new Map();

        const get_index = index_name => {
            if (!map_indexes.has(index_name)) {
                map_indexes.set(index_name, new Map());
            }
            const map_index = map_indexes.get(index_name);
            return map_index;
        }

        const set = (index_name, key, value) => {
            const index = get_index(index_name);
            ////const arr = 
            if (!index.has(key)) {
                index.set(key, []);
            }
            const arr = index.get(key);
            arr.push(value);
        }

        const get = (index_name, key) => {
            const map_idx = map_indexes.get(index_name);
            if (map_idx) {
                const arr_items = map_idx.get(key);
                return arr_items;
            } else {
                throw 'stop';
            }
        }

        const has_index = (index_name) => map_indexes.has(index_name);

        Object.assign(this, {
            set: set,
            get: get,
            has_index: has_index
        });


        



    }
}

module.exports = JS_AST_Node_Indexes;