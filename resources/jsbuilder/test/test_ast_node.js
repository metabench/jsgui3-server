
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
    //const test_script_1 = 'const [a, b, c] = [1, 2, 3];';


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

    // inner.declaration

    // inner.node

    // js_ast_node.collect.all()

    // collect.all.declaration
    //  seems like that could be built on top of the select syntax.


    const o_select_all =  js_ast_node.select.all;
    console.log('o_select_all', o_select_all);

    const decs = js_ast_node.select.all(node => node.is_declaration);
    console.log('decs', decs);

    const ids = js_ast_node.select.all(node => node.is_identifier);
    console.log('ids', ids);
    



    const older_than_now = () => {




        if (js_ast_node.child_nodes.length === 1) {
            const declaration0 = js_ast_node.first.child.node;
            //console.log('declaration0', declaration0);
            console.log('declaration0.source', declaration0.source);
            console.log('declaration0.child_nodes.length', declaration0.child_nodes.length);
            //console.log('declaration0.child_nodes', declaration0.child_nodes);
            //console.log('declaration0.child_nodes[0].type', declaration0.child_nodes[0].type);
            //console.log('declaration0.child_nodes[1].type', declaration0.child_nodes[1].type);
    
            const identifier = declaration0.child_nodes[0];
            console.log('identifier', identifier);
    
    
            // .find.node.by.type
    
            // find.node would be ok syntax (at least for the moment.)
    
    
            // Maybe the convenient syntax will be used just for query composition
            //  Then the query will be executed in a further step.
            //  Seems worthwhile to sweeten the syntax.
    
            // dec.find.node.by.type('Identifier');
            //  
    
            // dec.find.node(node => ... )
    
    
            const iref2 = declaration0.find.node(node => node.type === 'Identifier');
            console.log('iref2', iref2);
    
            // Seems like a JSGUI_Singular_Declaration would be useful.
            //  Then could be compiled into some sort of sequence.
    
            console.log('iref2.type_signature', iref2.type_signature);
            console.log('js_ast_node.type_signature', js_ast_node.type_signature);
    
            const first_child_node = js_ast_node.first.child.node;
            console.log('first_child_node', first_child_node);
    
            console.log('js_ast_node.child_nodes.length', js_ast_node.child_nodes.length);
    
    
    
            // want to try node.all.select
    
            // node.all.select(fn_selector)
    
    
    
    
    
            // .count could be a JS_AST_Operation
            //  
    
    
            // 3.1.5
            // Query_Count
    
    
    
            // .count.child.node
    
            // Looks like we now have decent parsing / representation of single objects.
    
            //js_ast_node.deep_iterate(node => {
            //    console.log('deep_iterate: node', node);
            //})
            // get_declared_names
            
    
            // And having a wildcard in the signature...
            //  Would need to make a matching algorithm that deals with these wildcards.
            //  I suppose splitting into an array and doing comparisons.
            
            // Signature: VDn(VDr(ID,SL))
    
            // How about VDn(VDr(ID,x)) where it's clear that x is a variable (not sure that we say wildcard)
    
            // Consistent text width signatures would help with a matching process.
            //  A quicker way of matching against keys - at least quicker to implement, less thorough in some ways.
            //   Would need to be matched at the right depth level.
    
            // Such as shallow_type_signature
    
    
    
            // Names of all variables declared within.
            //  Variables' declared names
    
    
    
    
    
    
    
    
        } else {
            //throw 'NYI';
            //console.log('js_ast_node.child_nodes', js_ast_node.child_nodes);
            console.log('js_ast_node.type_signature', js_ast_node.type_signature);
            console.log('js_ast_node.deep_type_signature', js_ast_node.deep_type_signature);
    
            console.log('js_ast_node', js_ast_node);
    
            //console.log('js_ast_node.get_declared_names()', js_ast_node.get_declared_names());
    
            // Could be identifiers that are not within a declaration.
    
    
    
            // then get the names that are locally declared within a block.
            // all references made.
    
            // All 
    
    
    
            // want the declared items.
            //  meaning it joins together its identifier name as well as what it gets set to.
    
    
    
            // Parse it into multiple Declaration objects.
            //  JSGUI_Declaration?
    
            // May be the better coding strategy to add more functionality to the existing classes, possibly further interpretation.
            //  Could hard-code a few structures.
    
            // Or use extensions of existing types.
    
            // Or Abstract_Declaration, meaning the statements used to render it have not been chosen.
            // Abstract_Single_Declaration
            //  Not related to the language syntax like the AST_Node and Babel declaration objects are.
    
    
    
    
        }





    }

    
    // Find out how many declarators it has.

    

    // Does it have its mirror structure loaded?
    //  The mirror structure is made out of these JS_AST_Nodes.
    //   Would prefer for it to load automatically and not be part of the API.

}

test_js_ast_node();