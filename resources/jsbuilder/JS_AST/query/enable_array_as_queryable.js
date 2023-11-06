const {each} = require('lang-tools');

const create_query_execution_fn = (arr, words = []) => {
    //console.log('words', words);

    /*
    const {
        each_child_node, filter_each_child_node,
        find_node, filter_deep_iterate, filter_inner_deep_iterate, filter_child_nodes_by_type,
        select_all, select_child, select_inner
    } = node;
    */

    let proceed = true;

    

    if (proceed) {



        //console.log('arr', arr);
        console.log('* words', words);

        const sentence = words.join(' ');
        console.log('sentence', sentence);

        // if the first word is collect, apply that query to each of the nodes in the array and amalgamate the results.

        if (words[0] === 'select') {
            return (selector) => {
                const res = [];
                each(arr, node => {
                    const node_res = node.query_with_words(words).exe(selector);
                    //console.log('node_res', node_res);

                    if (Array.isArray(node_res)) {
                        each(node_res, i => {
                            if (i !== undefined) {
                                res.push(i);
                                
                            } else {
                                console.trace();
                                throw 'stop';
                            }
                        });
                    } else {
                        throw 'stop';
                    }

                    
                    
                })
                enable_array_as_queryable(res);
                return res;
            }
        } else if (words[0] === 'collect') {
            return () => {
                const res = [];
                each(arr, node => {
                    const node_res = node.query_with_words(words).exe();
                    //console.log('node_res', node_res);

                    if (Array.isArray(node_res)) {
                        each(node_res, i => {
                            if (i !== undefined) {
                                res.push(i);
                                
                            } else {
                                console.trace();
                                throw 'stop';
                            }
                        });
                    } else {
                        throw 'stop';
                    }

                    
                    
                })
                enable_array_as_queryable(res);
                return res;
            }
        } else {

            if (words[0] === 'each') {
                return (callback) => {
                    //const res = [];
                    each(arr, node => {
                        //console.log('words', words);
                        const node_res = node.query_with_words(words).exe(callback);
                        //console.log('node_res', node_res);

                        /*
                        each(node_res, i => {
                            //res.push(i);
                            callback(i);
                        });
                        */
                        
                    })
                    //return res;
                }
            } else if (words[0] === 'find') {
                return (callback) => {
                    //const res = [];

                    let res;
                    each(arr, node => {

                        if (!res) {
                            //console.log('words', words);
                            const node_res = node.query_with_words(words).exe(callback);
                            //console.log('node_res', node_res);

                            //throw 'stop';

                            if (node_res) {
                                res = node_res;
                            } else {
                                throw 'stop';
                            }
                        }
                        

                        

                        /*
                        each(node_res, i => {
                            //res.push(i);
                            callback(i);
                        });
                        */
                        
                    })
                    return res;
                }
            } else {
                throw 'NYI';
            }

            
            
        }


    }

    


    throw 'NYI';
    
}



const create_query = (arr, words = []) => {



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

                    return create_query_execution_fn(arr, words);

                    //throw 'NYI'

                    // return the execution function.



                } else if (prop === 'qstring') {
                    return words.join('.');
                } else {
                    words.push(prop);
                    return create_query(arr, words);
                }

            } else {
                throw 'stop';
            }
        }
    };
    
    const proxy2 = new Proxy(res, handler2);

    return proxy2;
}

const enable_array_as_queryable = (arr) => {

    let proceed = true;
    //console.log('arr', arr);

    each(arr, item => {
        //console.log('item', item);
        //if (!Array.isArray(item)) proceed = false;
        if (!item || !item.babel) {
            proceed = false;
        }
    })

    // will of course provide a query property.

    if (!arr.query && proceed) arr.query = create_query(arr);
    return arr;

}

module.exports = enable_array_as_queryable;