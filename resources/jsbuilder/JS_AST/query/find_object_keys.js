const {each} = require('lang-tools');


// Doesn't use the index - at least not yet.
//  Maybe the indexing system of nodes will be of use here.

const check_object_declaration_by_name = (node, name) => {
    // not deep
    let res = false;
    if (node.is_declaration) {
        const keys = node.declaration.keys;
        //console.log('keys', keys);

        if (keys.length === 1) {
            const key = keys[0];
            if (key === name) {
                res = node;
            }
        } else {
            throw 'NYI';
        }

        //throw 'NYI'
    } else {
        // do nothing
    }
    return res;
}

const find_object_declaration_by_name = (node_operation_root, name) => {

    let res;


    each(node_operation_root.child_nodes, (cn, idx, stop) => {
        const checked_for_declaration_name = check_object_declaration_by_name(cn, name);
        //console.log('checked_for_declaration_name', checked_for_declaration_name);

        if (checked_for_declaration_name) {
            res = checked_for_declaration_name;
            stop();
        }
    })

    //throw 'stop';
    return res;
}

const find_program_node = node => {
    if (node.type === 'Program') return node;
    if (node.parent_node) {
        return find_program_node(node.parent_node);
    }

}


// So far set up to run on the program as a whole.


// An improved query system could better specify what's being looked for.
//  Maybe extending the system from bottom-up to be able to .query an object's keys makes sense.

// Also, should focus more on the inner keys properties?
//  Or just reading the keys from the specifically relevant AST nodes.
//   And improved query would help to find them better.

// find_object_keys looks a bit confused in what it's looking at and doing.
// possibly smaller functions would work better?







const find_object_keys = (node) => {

    // find the program node to start with.
    //  will search that only in this function.
    //   may need to rename this fn, but searching the program node is what this fn is about.



    

    //const keys = [];


    //console.log('');
    //console.log('find_object_keys node', node);
    //console.log('find_object_keys node.source', node.source);
    //console.log('find_object_keys node.name', node.name);
    //console.log('find_object_keys node.path', node.path);


    


    let exported_obj_name = node.name;

    console.log('exported_obj_name', exported_obj_name);



    //throw 'stop';


    if (!exported_obj_name) {
        let name;
        node.deep_iterate((n, i, other, stop) => {
            //console.log('n', n);
            if (n.is_identifier) {
                if (!name) name = n.name;
                //console.log('name', name);
                stop(); //does not seem to work
            }
        })
        if (name) {
            exported_obj_name = name;
            //console.log('exported_obj_name', exported_obj_name);
            //throw 'stop';
        } else {
            throw 'stop';
        }


        
    }

    //console.log('node.source', node.source);
    // The declaration node for the object.

    //console.log('node.parent.node', node.parent.node);
    //console.log('node.gparent.node', node.gparent.node);
    //console.log('node.ggparent.node', node.ggparent.node);


    // not necessarily....
    const module_exports_statement = node.gparent.node;
    console.log('module_exports_statement', module_exports_statement);
    console.log('module_exports_statement.index', module_exports_statement.index);



    //const program = module_exports_statement.parent.node;
    const program = find_program_node(node);

    const res = [];

    const handle_key = key => res.push(key);

    console.log('module_exports_statement', module_exports_statement);
    //throw 'stop';

    if (program.type === 'Program') {

        const prev_nodes = program.child_nodes.slice(0, module_exports_statement.index);
        let exported_object_declaration_node;
        let exported_object_further_assignment_object_name;
        let exported_object_further_assignment_object_declaration; 

        console.log('prev_nodes.length', prev_nodes.length);
        //throw 'stop';

        each(prev_nodes, prev_node => {
            if (prev_node.is_declaration) {
                //console.log('prev_node.declaration.keys', prev_node.declaration.keys);


                

                if (prev_node.declaration.keys.length === 1) {

                    

                    if (prev_node.declaration.keys[0] === exported_obj_name) {
                        exported_object_declaration_node = prev_node;
                    }

                } else {

                    // do any of these keys contain the name we are looking for?

                    if (prev_node.declaration.keys.includes(exported_obj_name)) {
                        throw 'NYI';
                    }

                    //console.log('prev_node', prev_node);
                    //console.log('prev_node.source', prev_node.source);
                    //throw 'NYI';
                }

            } else {
                //console.log('');
                //console.log('prev_node', prev_node);
                //console.log('prev_node.source', prev_node.source);
                //console.log('prev_node.signature', prev_node.signature);

                // also need to check for  

                if (prev_node.signature === 'ES(AsE(ME(ID,ID),ID))') {
                    //console.log('exported_obj_name', exported_obj_name);
                    // can we do collect identifiers?
                    const ids = [];
                    prev_node.deep_iterate(node => {
                        if (node.is_identifier) ids.push(node);
                    });
                    //console.log('ids', ids);

                    const [obj_name, prop_name, value_name] = ids.map(id => id.name);
                    //console.log('[obj_name, prop_name, value_name]', [obj_name, prop_name, value_name]);

                    if (obj_name === exported_obj_name) {


                        //console.log('prop_name', prop_name);

                        handle_key(prop_name);

                        //throw 'NYI';
                    }
                    //throw 'NYI';
                }
                //                           
                if (prev_node.signature === 'ES(CE(ME(ID,ID),ID,ID))') {  // object.assign
                    // eg Object.assign(ec, lang_mini);

                    const me = prev_node.child_nodes[0].child_nodes[0];
                    //console.log('me', me);
                    const [id1, id2] = me.child_nodes;
                    const [name1, name2] = [id1.name, id2.name];
                    //console.log('[name1, name2]', [name1, name2]);

                    if (name1 === 'Object' && name2 === 'assign') {
                        const assign_target = prev_node.child_nodes[0].child_nodes[1];
                        //console.log('assign_target.name', assign_target.name);

                        if (assign_target.name === exported_obj_name) {
                            // have found a point where object.assign is used to assign properties to the value that is being exported.

                            const assignment_object = prev_node.child_nodes[0].child_nodes[2];

                            
                            //console.log('assignment_object.source', assignment_object.source);

                            exported_object_further_assignment_object_name = assignment_object.name;


                        }

                    }

                }



                // Could be assigning something to the object we want?

                // Want to be on the lookout for Object.assign(exported_object, ...)



                // Does it assign anything (any keys?) to the exported object?
                //throw 'NYI';

            }
        });


        console.log('exported_object_declaration_node', exported_object_declaration_node);

        //const keys_eodn = find_object_keys(exported_object_declaration_node);
        //console.log('keys_eodn', keys_eodn);
        if (exported_object_declaration_node) console.log('exported_object_declaration_node.declaration.keys', exported_object_declaration_node.declaration.keys);

        // .internal_keys
        //  .

        console.log('exported_object_further_assignment_object_name', exported_object_further_assignment_object_name);
        //throw 'stop';

        if (exported_object_further_assignment_object_name && !exported_object_further_assignment_object_declaration) {
            //console.log('exported_object_further_assignment_object_name', exported_object_further_assignment_object_name);

            // find the node where that exported_object_further_assignment_object was defined.

            exported_object_further_assignment_object_declaration = find_object_declaration_by_name(program, exported_object_further_assignment_object_name);
            //console.log('exported_object_further_assignment_object_declaration', exported_object_further_assignment_object_declaration);


            // The more advanced query system could be really good for looking up these keys.
            // But it's worth seeing what can be found without it for the moment.




            // Want to find out what is being assigned to the object with that name.

            // .parent.node.select.child

            // .parent.filter.child.declaration(declaration => declaration.has_name(exported_object_further_assignment_object_name))

            // Seems like we need a bit more on the querying, can run tests that just query single nodes for a bit longer.

            // .parent.find.child.declaration.keys

            // .parent.collect.child.declaration.keys
            //  can have some nice syntax, and tests.
            //  worth writing out pieces of nice syntax, and working on the implementation.

            // Probably worth making a Query class that gets returned a lot.

            // Or maybe work on a new API, .query
            //  and then when .query is working well, see if we can set up shortcuts to it.

            // .query looks like a good place to set up queries and specifically use a query object abstraction.
            //  this will just be for describing the queries, when we have the query description, other code would be used to execute that query.

            // const pn = node.parent.node;
            // const q = pn.query.collect.child.declaration.keys;
            // const qres = pn.exequery(q);

            // If all these things happen within the initial query object, and are properties of it, then it can make a consistent API.
            //  Everything returned will be a query object.
            








            // Lookup the history of that object...

            //  lookup_object_keys
            //   seems like a possible piece of external functionality on top of the main class structure.
            //   as in, makes use of it, but is a query that is more application-level, and defined in a way in which it can be self-contained.
            //    it's not so formulaic, so it seems. The query directory could be put to use now.

            // see what assignments are made to lang_mini

            // find_object_keys_by_name
            //  only within the root makes sense.

            // find_object_assignments_made

            //  and a recursive version?
            //   could see about that later on, but querying / reading what gets exported from various jsgui files such as lang.js will be what we need for this stage of the building.

            // for the moment, want good queries on the files as a preparatory stage for the transformations and building.








            //console.trace();
            //throw 'NYI';
        }

        if (exported_object_further_assignment_object_declaration) {
            // go looking at the keys that get assigned to that.


            //console.log('exported_object_further_assignment_object_declaration', exported_object_further_assignment_object_declaration);
            //console.log('exported_object_further_assignment_object_declaration.parent.node', exported_object_further_assignment_object_declaration.parent.node);
            //console.log('exported_object_further_assignment_object_declaration.gparent.node', exported_object_further_assignment_object_declaration.gparent.node);
            const eofad_keys = find_object_keys(exported_object_further_assignment_object_declaration);
            each(eofad_keys, key => res.push(key));



            //console.log('eofad_keys', eofad_keys);
            //throw 'NYI';

            //
            //

        }

    } else {
        throw 'stop';
    }

    // then look through previous siblings for declarations 

    //console.log('node', node);
    //console.log('node.source', node.source);


    //console.log('exported_obj_name', exported_obj_name);


    return res;

    //throw 'NYI';


}

module.exports = find_object_keys;