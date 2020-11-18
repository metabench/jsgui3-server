
const JS_AST_Node_Query_Last = require('./JS_AST_Node_3.0.99-Query_Last');
const JS_AST_Operation = require('./JS_AST_Operation');
const JS_AST_Relationship = require('./JS_AST_Relationship_Node_To_Group');

const JS_AST_Operation_On_Relationship = require('./JS_AST_Operation_On_Relationship');


// Operation_On_Relationship

// Could make a more specific feature extraction part.
//  Will come up with more:

// 2.1 Identify
// 2.2 ??? - Extract_Feature?

// Will identify more information about what JS is contained.
//  Eg if it's a recognised code library structure that can be extracted.
//   Identify the main block of declarations in a (library or framework) file.
//    Identify the variable definitions in there.

// Need more capability here to find and match specified features.

// Asking questions about a piece of code - questions to later determine what it is and how to use it.

// .matches_type_signature(signature)

// . but using a tree is better for checking multiple signatures at once.

// basically 'deep iterate', though could apply to .child or .ancestor

class JS_AST_Node_Query_Each extends JS_AST_Node_Query_Last {
    constructor(spec = {}) {
        super(spec);
        const {each_child_node, filter_each_child_node} = this;

        const myeach = new JS_AST_Operation({name: 'each'});

        //const myeach = cb => deep_iterate(cb);

        
        Object.assign(this, {
            each: myeach
        });

        // .child
        // .inner
        // .node (seems like we need this now rather than just calling each)
        //  now each is an operation, we need to explicitly tell it what to operate on.

        const child = new JS_AST_Relationship({
            name: 'child'
        });

        // And an Operation_Relationship?
        //  each child

        // Operation_Relationship_Node?
        //  Since it's each child node, or some kind of node here, we can make use of that somehow.

        const each_child = new JS_AST_Operation_On_Relationship({
            operation: myeach,
            related: child
        }); // But incomplete without being told what to operate on.


        myeach.child = each_child;


        //child.each = each_child;


        const each_child_assignment_expression = (callback) => filter_each_child_node(node => node.type === 'AssignmentExpression', callback);
        const each_child_expression_statement = (callback) => filter_each_child_node(node => node.type === 'ExpressionStatement', callback);
        const each_child_declaration = (callback) => filter_each_child_node(node => node.is_declaration, callback);
        //const each_declaration_child_node = (callback) => filter_each_child_node(js_ast_node => js_ast_node.is_declaration, callback);
        const each_assignment_expression_child_node = callback => filter_each_child_node(node => node.type === "AssignmentExpression");

        const each_inner_declaration = (callback) => {
            filter_inner_deep_iterate(node => node.is_declaration, node => {
                callback(node);
            })
        }
        
        const each_inner_variable_declarator = callback => each_inner_node_of_type('VariableDeclarator', callback);
        const each_inner_identifier = callback => each_inner_node_of_type('Identifier', callback);


        each_child.node = cb => each_child_node(callback);

        const mechild = myeach.child = cb => each_child_node(cb);
        

        mechild.expression_statement = cb => each_child_expression_statement(cb);
        mechild.assignment_expression = cb => each_child_assignment_expression(cb);
        mechild.declaration = cb => each_child_declaration(cb);
        this.each = myeach;

    }
}

module.exports = JS_AST_Node_Query_Each