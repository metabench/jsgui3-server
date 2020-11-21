// Indexes because it keeps multiple indexes, ie an index of indexes.

class JS_AST_Node_Indexes {
    // Not a type of JS_AST_Node! Change the name?
    constructor(spec = {}) {

        // scope.find.declared.name
        // scope.find.name

        // scope.parent
        // scope.declarations
        // scope.declarations.count

        // 3.8 scope would make sense
        // before 4.0 index
        // or as a new 4
        //  Querying what is in the scope of a node would definitely be useful.
        //  Previous sibling declarations
        //  Declarations in all ancestor scopes

        // An index of all declarations by name within scope.
        //  Possibly a Declaration / Declarations level would help?
        //   Or it gets done in the indexing part?

        // Indexes of all objects within scope?
        
        // A Scope object which has got properties on it would help.
        //  Scope iterator is one of the main things.

        // Variables defined within the scope (or here I mean as siblings?) of the parents.

        
        




        


        // scope.node.with.name?


        // scope.find.declaration(name)
        // .scope.declarations.name.is(n)
        
                
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