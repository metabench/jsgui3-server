//const babel_node_tools = require('../babel/babel_node_tools');

const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Type_Variable_Declarator = require('./JS_AST_Node_6.3-Type_Variable_Declarator');



const create_query_execution_fn = (node, words) => {
    console.log('words', words);

    const {find_node, filter_deep_iterate, filter_inner_deep_iterate, filter_each_child_node, filter_child_nodes_by_type} = node;

    /*

    this.filter = filter;
        this.filter_deep_iterate = filter_deep_iterate;
        this.filter_inner_deep_iterate = filter_inner_deep_iterate;
        this.filter_each_child_node = filter_each_child_node;
        this.filter_child_nodes_by_type = filter_child_nodes_by_type;

    */

    // Does seem best to use some kind of OO parsing into a query object.
    //  That would then have the structure to support longer queries.


    // filter child node by type
    //  then the execution function has a single type parameter.

    // can have a variety of English sentences and match them up with the calls to do it.
    //  see that the Basic part makes the right functions to do many of these things.

    const sentence = words.join(' ');
    console.log('sentence', sentence);

    // each.child.declaration.with.name
    // each.child.declaration.filter.by.name

    if (sentence === 'filter child node' || sentence === 'filter each child' || sentence === 'filter each child node') {
        return node.filter_each_child_node;
    } else {
        //throw 'NYI';
    }

    if (sentence === 'each child node' || sentence === 'each child') {
        return node.each_child_node;
    } else {
        //throw 'NYI';
    }

    if (sentence === 'first child node' || sentence === 'first child') {
        return () => node.child_nodes[0];
    } else {
        //throw 'NYI';
    }

    if (sentence === 'second child node' || sentence === 'second child') {
        return () => node.child_nodes[1];
    } else {
        //throw 'NYI';
    }

    // first child identifier

    // each child identifier
    // each child declaration



    


}

//

const create_query = (node, words = []) => {



    const res = {
        //message1: "hello",
        //message2: "everyone"
    };
    
    const handler2 = {
        get: function(target, prop, receiver) {

            //console.log('target', target);
            //console.log('prop', prop);
            //console.log('receiver', receiver);

            //console.log('target === res', target === res);

            if (target === res) {

                if (prop === 'exe') {

                    //throw 'stop';

                    return create_query_execution_fn(node, words);

                    //throw 'NYI'

                    // return the execution function.



                } else if (prop === 'qstring') {
                    return words.join('.');
                } else {
                    words.push(prop);
                    return create_query(node, words);
                }

            } else {
                throw 'stop';
            }

            

            //throw 'NYI';
        }
    };
    
    const proxy2 = new Proxy(res, handler2);

    return proxy2;
}







class JS_AST_Node_Query extends JS_AST_Node_Type_Variable_Declarator {
    constructor(spec = {}) {
        super(spec);

        // query property.

        // but each time provide a new query object.

        //let query;
        Object.defineProperty(this, 'query', {
            get() { 
                return create_query(this);
            },
            enumerable: true,
            configurable: false
        });
        


        
    }
}

module.exports = JS_AST_Node_Query;