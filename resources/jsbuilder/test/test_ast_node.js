
// Should have more specific tests for JS_AST_Node.
//  Such as getting the source but with renamed local variables.

// Maybe need more tests and fixes for deconstructing expressions.
 



// Load a JS file into an OO structure

const JS_File = require('../JS_File/JS_File');
//const JS_File_Comprehension = require('../JS_File_Comprehension');
const path = require('path');
const fs = require('fs');
const Project = require('../Project');
const {each} = require('lang-mini');

//const JS_AST_Node = require('../JS_AST/JS_AST_Node');
const JS_AST_Node = require('../JS_AST_Node_Extended/JS_AST_Node_Extended');

const test_js_ast_node = () => {
    
    // That's a simple declaration.
    //const test_script_1 = 'const firstname = "James", surname = "Vickers", name = firstname + " " + surname, [a, b, c] = [1, 2, 3];';
    //const test_script_2 = 'module.exports = lang_mini;';
    const test_script_1 = 'const [a, b, c] = [1, 2, 3], [d, e, f] = [4, 5, 6];';
    //const test_script_1 = 'const [a, b, c] = [1, 2, 3];';

    //const test_script_3 = 'const {a, b, c} = propertied_object;'

    const test_script_4 = 'const obj = {"a": 1, "b": 2, "c": 3}';

    // Item declared as an array.
    //  Still a single declared item, even though it's composed of multiple things.
    //  Would could as an Abstract_Single_Declaration???


    //const test_script_1 = 'const a = [1, 2, 3];';

    // Root node by default?
    //  Makes sense as that's the likely context the developer would use it.
    //   If it has no parent_node.

    const spec = {
        source: test_script_1
    };

    const js_ast_node = JS_AST_Node.from_spec(spec);

    console.log('js_ast_node', js_ast_node);
    console.log('js_ast_node.source', js_ast_node.source);

    console.log('js_ast_node.child.count', js_ast_node.child.count);

    console.log('js_ast_node.query.count.all.exe()', js_ast_node.query.count.all.exe());

    // mapcall_deep_iterate
    // mapcall_child_nodes
    // deep_iterate_mapcall

    // mapped call ?

    const direct_calling = () => {
        js_ast_node.callmap_deep_iterate(node => node.signature, {
            'ArE(NumL,NumL,NumL)': (node) => {
                console.log('are 3 numlit node', node);
            },
            'ArP(ID,ID,ID)': (node) => {
                console.log('arp 3 id node', node);
            }
        }, node => {
            console.log('default node', node);
        });
    
        js_ast_node.signature_callmap_deep_iterate({
            'ArE(NumL,NumL,NumL)': (node) => {
                console.log('* are 3 numlit node', node);
            },
            'ArP(ID,ID,ID)': (node) => {
                console.log('* arp 3 id node', node);
            }
        }, node => {
            console.log('* default node', node);
        });
    }

    const callmap_calling = () => {
        js_ast_node.query.callmap.exe(node => node.signature, {
            'ArE(NumL,NumL,NumL)': (node) => {
                console.log('are 3 numlit node', node);
            },
            'ArP(ID,ID,ID)': (node) => {
                console.log('arp 3 id node', node);
            }
        }, node => {
            console.log('default node', node);
        });
    
        js_ast_node.query.callmap.by.signature.exe({
            'ArE(NumL,NumL,NumL)': (node) => {
                console.log('!!are 3 numlit node', node);
            },
            'ArP(ID,ID,ID)': (node) => {
                console.log('!!arp 3 id node', node);
            }
        }, node => {
            console.log('!!default node', node);
        });
    }

    

    

    // And it works... now to get it into query.

    // callmap_deep_iterate


    // Let's do a bit more work on getting object declared keys.
    //  .query.collect.objectproperty.exe().query.find.child.identifier.exe().query('name');

    const used_tests = () => {
        const var_decltrs = js_ast_node.query.collect.child.variabledeclarator.exe();
        console.log('var_decltrs', var_decltrs);

        // .id property of the var declarators?
        //  

        const decr_id_names = js_ast_node.query.collect.child.variabledeclarator.exe().query.collect.first.child.name.exe();
        console.log('decr_id_names', decr_id_names);

        //const key_id_names = js_ast_node.query.collect.objectproperty.exe().query.collect.child.identifier.exe().query.collect.name.exe();
        //console.log('key_id_names', key_id_names);

        // OPr

        // .query.select.by.t.exe('OPr');

        const oprs = js_ast_node.query.select.by.t.exe('OPr');
        console.log('oprs', oprs);

        const oprslits = js_ast_node.query.select.by.t.exe('OPr').query.collect.child.literal.exe();
        console.log('oprslits', oprslits);

        const opr_first_child_nodes = js_ast_node.query.select.by.t.exe('OPr').query.collect.first.child.exe(); // working nicely.

        

        // Best to keep this syntax for the moment, the need for query collect and exe make it explicit and simpler to follow.


        // .t.collect('OPr').first.child.node.exe();
        console.log('opr_first_child_nodes', opr_first_child_nodes);


        //const sl_values = opr_first_child_nodes.map(node => node.babel.node.value)
        const sl_values = js_ast_node.query.select.by.t.exe('OPr').query.collect.first.child.value.exe();


        console.log('sl_values', sl_values);

        if (js_ast_node.declaration) {
            console.log('js_ast_node.declaration.declared.keys', js_ast_node.declaration.declared.keys);

            // js_ast_node.query.collect.declared.keys.exe();

            const dc2 = js_ast_node.query.collect.own.declared.keys.exe();
            console.log('dc2', dc2);

            // and the corresponding assigned values.
            // declaration.assigned.values
            // declaration.declared, declaration.assigned

            console.log('js_ast_node.declaration.assigned.values', js_ast_node.declaration.assigned.values);
        }

        // .query.collect.own.assigned.values
        // .query.collect.own.declaration.assigned.value
        // .query.collect.own.declaration.value
        // .query.collect.declaration.value
    }


    



    const various_tests_including_new_query_api = () => {


        console.log('js_ast_node.category', js_ast_node.category);
        console.log('');
        console.log('js_ast_node.source\n' + js_ast_node.source);
        console.log('');

        console.log('js_ast_node', js_ast_node);
        console.log('js_ast_node.child.count', js_ast_node.child.count);
        console.log('js_ast_node.child.shared.type', js_ast_node.child.shared.type);
        console.log('js_ast_node.child.shared.t', js_ast_node.child.shared.t);
        console.log('js_ast_node.type', js_ast_node.type);
        console.log('js_ast_node.declaration', js_ast_node.declaration);

        console.log('js_ast_node.declaration.keys', js_ast_node.declaration.keys);

        const q = js_ast_node.query;

        const qeach = q.each;

        console.log('q', q);
        console.log('qeach', qeach);
        console.log('qeach.text', qeach.text);

        //const q2 = js_ast_node.query.each.child.node;
        const q2 = js_ast_node.query.first.child.node;
        console.log('q2', q2);
        console.log('q2.qstring', q2.qstring); // .qtext? or .querytext? .toString()? qstring for the moment.
        const vdr = q2.exe();
        const vdrcn2 = vdr.query.second.child.exe();
        //console.log('q2.exe()', q2.exe());
        console.log('vdr', vdr);
        console.log('vdrcn2', vdrcn2);
        console.log('js_ast_node', js_ast_node);

        // .query.select.exec
        // .query.select.by.type.exe('ObjectProperty');

        const oprs = js_ast_node.query.select.by.type.exe('ObjectProperty');
        console.log('oprs', oprs);

        const oprns = js_ast_node.query.select.by.type.exe('ObjectProperty').query.collect.child.identifier.name.exe();
        
        console.log('oprns', oprns);


        // Just a simple test to get the structure there for query result .each queries.
        js_ast_node.query.select.by.type.exe('ObjectProperty').query.each.child.exe(cn => {
            console.log('cn', cn);
        });

        js_ast_node.query.select.by.type.exe('ObjectProperty').query.each.child.identifier.exe(cn => {
            console.log('cn', cn);
        });


        const ids = js_ast_node.query.collect.identifier.exe();
        console.log('ids', ids);

        const csigs = js_ast_node.query.collect.child.signature.exe();
        console.log('csigs', csigs);

        console.log('js_ast_node.query.count.child.exe()', js_ast_node.query.count.child.exe());
        console.log('js_ast_node.query.count.identifier.exe()', js_ast_node.query.count.identifier.exe());


        // still for the moment will be clear about the verb used.

        // Pattern category....

        // query.collect.by.category('Pattern');

        //const patterns = js_ast_node.query.select.by.category.exe('Pattern');

        const patterns = js_ast_node.query.collect.pattern.exe();

        console.log('patterns', patterns);

        const oprops = patterns.query.collect.property.exe();
        console.log('oprops', oprops);

        const cfcs = js_ast_node.query.collect.child.exe().query.collect.first.child.exe();


        console.log('cfcs', cfcs);
        console.log('cfcs.length', cfcs.length);

        console.log('cfcs.query', cfcs.query);

        const cfc = cfcs[0];
        const cfc_child_types = cfc.query.collect.child.type.exe()
        const cfc_child_child_counts = cfc.query.collect.child.exe().query.collect.child.count.exe()

        console.log('cfc_child_types', cfc_child_types);
        console.log('cfc_child_child_counts', cfc_child_child_counts);


    }

    const earlier_tests = () => {

        console.log('js_ast_node.category', js_ast_node.category);
        console.log('js_ast_node.source', js_ast_node.source);
        console.log('js_ast_node', js_ast_node);
        console.log('');
        //console.log('js_ast_node.babel.node', js_ast_node.babel.node);

        //console.log('js_ast_node', js_ast_node);
        //console.log('js_ast_node.path', js_ast_node.path);
        //console.log('js_ast_node.depth', js_ast_node.depth);
        //console.log('js_ast_node.is_root', js_ast_node.is_root);
        //console.log('js_ast_node.is_declaration', js_ast_node.is_declaration);
        //console.log('js_ast_node.child_nodes.length', js_ast_node.child_nodes.length);


        //js_ast_node.inner;

        console.log('js_ast_node.inner', js_ast_node.inner);
        console.log('js_ast_node.inner.count', js_ast_node.inner.count);
        console.log('js_ast_node.all.count', js_ast_node.all.count);

        

        // .collect.identifier

        // inner.declaration

        // inner.node

        // js_ast_node.collect.all()

        // collect.all.declaration
        //  seems like that could be built on top of the select syntax.


        const o_select_all =  js_ast_node.select.all;
        console.log('o_select_all', o_select_all);

        const decs = js_ast_node.select.all(node => node.is_declaration);
        console.log('decs', decs);





        // js_ast_node.collect.all.identifier

        // and then .all should use .collect but work as a property.
        //  do that later.


        const ids = js_ast_node.select.all(node => node.is_identifier);
        console.log('ids', ids);
        
        console.log('js_ast_node.child', js_ast_node.child);
        console.log('js_ast_node.child.shared.type', js_ast_node.child.shared.type);
        console.log('js_ast_node.child.count', js_ast_node.child.count);

        // child.filter(fn)

        const ids2 = js_ast_node.collect.inner.identifier();
        console.log('ids2', ids2);


        console.log('js_ast_node.collect.all.identifier', js_ast_node.collect.all.identifier());

        // .each.identifier

        // .iterate.all.identifier?
        js_ast_node.each.identifier(id => {
            console.log('id.source', id.source);
            console.log('id.sibling.count', id.sibling.count);

            console.log('id.sibling.previous.count', id.sibling.previous.count);
            console.log('id.sibling.post.count', id.sibling.post.count);



        })

        

        
        // Find out how many declarators it has.

        

        // Does it have its mirror structure loaded?
        //  The mirror structure is made out of these JS_AST_Nodes.
        //   Would prefer for it to load automatically and not be part of the API.

    }

    

}

test_js_ast_node();