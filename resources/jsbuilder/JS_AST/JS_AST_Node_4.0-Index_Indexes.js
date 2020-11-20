// Indexes because it keeps multiple indexes, ie an index of indexes.

class JS_AST_Node_Indexes {
    // Not a type of JS_AST_Node! Change the name?
    constructor(spec = {}) {

         
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
            }
        }

        this.set = set;
        this.get = get;


    }
}

module.exports = JS_AST_Node_Indexes;