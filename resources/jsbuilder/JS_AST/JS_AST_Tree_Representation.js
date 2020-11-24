
class JS_AST_Tree_Representation_Node {
    constructor(spec = {}) {

    }
}


class JS_AST_Tree_Representation {
    constructor(spec = {}) {


        const parse_non_recursive = str => {
            // cursor and finite state machine type parsing.

            
        }


        const parse_str = str => {

        }

        if (spec.str) {
            parse_str(spec.str);
        }

    }



    
    
}

JS_AST_Tree_Representation.from_string = str => new JS_AST_Tree_Representation({str: str});

module.exports = JS_AST_Tree_Representation;