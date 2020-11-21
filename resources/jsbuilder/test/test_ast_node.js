
// Should have more specific tests for JS_AST_Node.
//  Such as getting the source but with renamed local variables.

// Maybe need more tests and fixes for deconstructing expressions.
 



// Load a JS file into an OO structure

const JS_File = require('..//JS_File/JS_File');
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
    const test_script_2 = 'module.exports = lang_mini;';
    const test_script_1 = 'const [a, b, c] = [1, 2, 3];';


    // Item declared as an array.
    //  Still a single declared item, even though it's composed of multiple things.
    //  Would could as an Abstract_Single_Declaration???


    //const test_script_1 = 'const a = [1, 2, 3];';

    // Root node by default?
    //  Makes sense as that's the likely context the developer would use it.
    //   If it has no parent_node.

    const spec = {
        source: test_script_2
    };

    const js_ast_node = JS_AST_Node.from_spec(spec);
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

test_js_ast_node();