//const babel_node_tools = require('../babel/babel_node_tools');
// Index before query would help.

// Will index the occurrances of various nodes / things.

// Could get more into tree pattern checking too, declaratively saying what to look for and looking for multiple things at once with signature comparisons in a map.

// Indexing at every level looks like it would be useful.
//  so in order to get the info about how the names relate to nodes we consult indexes.







const { each } = require('../../../../../tools/arr-tools/arr-tools');
const JS_AST_Node_Babel = require('./JS_AST_Node_1-Babel');

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


class JS_AST_Node_Query extends JS_AST_Node_Babel {
    constructor(spec = {}) {
        super(spec);
        const {deep_iterate, each_child_node, filter_each_child_node} = this;
        // sets the childnodes here.
        //  will also make available the relevant bable properties.

        // Use the lower level tools to kind of understand the node.
        //  Provide property getters that will do this.

        // Seeing what pattern / recognised object / pattern it is.
        

        

        this.each_declaration_child_node = (callback) => filter_each_child_node(js_ast_node => js_ast_node.is_declaration, callback);
        const each_assignment_expression_child_node = callback => filter_each_child_node(node => node.type === "AssignmentExpression");


        

        const each_inner_declaration = (callback) => {
            filter_inner_deep_iterate(node => node.is_declaration, node => {
                callback(node);
            })
        }
        

        

        
        const each_inner_variable_declarator = callback => each_inner_node_of_type('VariableDeclarator', callback);
        const each_inner_identifier = callback => each_inner_node_of_type('Identifier', callback);
        
        // Structure signatures of nodes (and all nodes below them) would be relatively easy to put together, and possibly useful.
        //  Will be able to find a programmatic pattern, where parts would often be interchangable.
        
        const each_inner_declaration_declarator_identifier = (callback) => 
            this.each_inner_declaration(node_inner_declaration => 
            node_inner_declaration.each_inner_variable_declarator(decl =>
            decl.each_inner_identifier(ident =>
            callback(ident))))
        
        

        // [TypeName]([TypeName2](...),[TypeName3](...))

        // structure_signaturestructure_signature
        // deep_type_signature
        //  Would be a useful way to identify features with expected types / shapes of the structure of types that can be extracted and treated as a known programmatic quantity.

        //this.structure_signature = 

        let deep_type_signature, type_signature;
        // and then a more shallow type signature.
        //   type_signature could go to depth 2 or 3. Let's try it.
        // Want to be able to get small and usable signatures.

        // Want max depth for the iteration.
        //  The stop function integrated within the iteration would be useful there to get that done.
        //  Maybe an 'options' object now params have got more complex.

        const get_deep_type_signature = () => {
            //let res = '[' + this.type + '(';
            //if (!deep_type_signature) {
            //console.log('');
            //console.log('this.path', this.path);
            //console.log('this.type', this.type);
            let res = '' + this.abbreviated_type, inner_res = '', first = true;

            // Only look at child nodes, not full tree here.
            // each_child_node   inner_deep_iterate
            //  seems fixed now.
            // no longer supports max_depth but at least it works now.

            each_child_node(inner_node => {
                if (!first) inner_res = inner_res + ','
                inner_res = inner_res + inner_node.deep_type_signature
                first = false;
            });
            //res = res + ')';
            if (inner_res.length > 0) {
                res = res + '(' + inner_res + ')';
            } else {

            }
            return res;
        }

        Object.defineProperty(this, 'type_signature', {
            get() { 
                if (!type_signature) type_signature = get_deep_type_signature(1);
                //if (deep_type_signature) return deep_type_signature;
                return type_signature;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'deep_type_signature', {
            get() { 
                if (!deep_type_signature) deep_type_signature = get_deep_type_signature();
                //if (deep_type_signature) return deep_type_signature;
                return deep_type_signature;
                
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'signature', {
            get() { 
                return this.type_signature
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'inner_declaration_names', {
            get() { 
                const res = []; const tm = {};
                filter_each_inner_node(node => node.is_declaration, node => each(node.own_declaration_names, dn => {
                    if (!tm[dn] && typeof dn === 'string') {
                        res.push(dn);
                        tm[dn] = true;
                    }
                }))
                return res;
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'child_declarations', {
            get() { 
                const cns = this.child_nodes;
                const res = [];
                each(cns, cn => {
                    // if it the right node type?
                    if (cn.type === 'VariableDeclaration' || cn.type === 'ClassDeclaration') {
                        res.push(cn);
                    }
                });
                return res;
                //return babel_node; 
            },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        const find_node = (fn_match => {
            let res;
            deep_iterate((js_ast_node, path, depth, stop) => {
                if (fn_match(js_ast_node)) {
                    stop();
                    res = js_ast_node;
                }
            });
            return res;
        });

        // const each_root_assignment_expression = (callback) => each_root_node(node => node.type === 'AssignmentExpression', callback);

        const each_child_assignment_expression = (callback) => filter_each_child_node(node => node.type === 'AssignmentExpression', callback);
        const each_child_expression_statement = (callback) => filter_each_child_node(node => node.type === 'ExpressionStatement', callback);
        const each_child_declaration = (callback) => filter_each_child_node(node => node.is_declaration, callback);
        const deep_iterate_identifiers = (max_depth, callback) => typed_deep_iterate('Identifier', max_depth, callback);
        
        // Identifying if it matches any registered signatures...
        //  Provide functionality for it here, but will use it in subclasses of this.
        //   Somewhere or other will make use of new Signature_Tree functionality.
        //    These signatures are a recursive structure, and if a good algorithm is used, they will be able to be compared and identified quickly.
        //     Will be able to check for multiple possible types of node structures.

        // This will be useful for identifying and extracting features within heirachical documents.
        //  Declarative structures and signatures using rules - will not be so hard to specify what to do with what things, but it's in a flexible system.

        // find variables declared within scope.
        //  and in cases of multiple variables [a, b, c] = [1, 2, 3];

        
        this.find_node = find_node;
        this.get_deep_type_signature = get_deep_type_signature;
        
        this.each_child_assignment_expression = each_child_assignment_expression;
        this.each_child_expression_statement = each_child_expression_statement;
        this.each_child_declaration = each_child_declaration;
        this.each_inner_declaration = each_inner_declaration;
        this.each_inner_declaration_declarator_identifier = each_inner_declaration_declarator_identifier;
        this.each_inner_variable_declarator = each_inner_variable_declarator;
        this.each_inner_identifier = each_inner_identifier;

        

        this.each_assignment_expression_child_node = each_assignment_expression_child_node;
        

        this.deep_iterate_identifiers = deep_iterate_identifiers;





    }
}

// Indexing may work better with / after these queries.
//  Then there could be another layer of queries after index.

module.exports = JS_AST_Node_Query;