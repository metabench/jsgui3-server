const JS_AST_Node_Extended_Core = require('./JS_AST_Node_Extended_0-Core');
const JS_AST_Node_Declaration = require('./JS_AST_Node_Declaration');

class JS_AST_Node_Extended extends JS_AST_Node_Extended_Core {
    constructor(spec = {}) {
        super(spec);
    }
}

JS_AST_Node_Extended.from_babel_node = (spec) => {

    const {babel_node} = spec;
    const {type} = babel_node;
    if (type === 'VariableDeclaration' || type === "ClassDeclaration") {
        return new JS_AST_Node_Declaration(spec);
    } else {
        return new JS_AST_Node_Extended_Core(spec);
    }

    //return new JS_AST_Node(spec);
}
JS_AST_Node_Extended.from_spec = spec => {

    let {babel_node} = spec;
    //console.log('spec', spec);

    if (!babel_node) {
        if (spec.source) {
            // create it, but then upgrade its type if necessary.
            //  or first create the babel node.
            //   that seems to make more sense in terms of the order of parsing.
            const parser = require('@babel/parser');
            const babel_ast = parser.parse(spec.source, {
                sourceType: 'module',
                plugins: [
                    'asyncGenerators',
                    'bigInt',
                    'classPrivateMethods',
                    'classPrivateProperties',
                    'classProperties',
                    'doExpressions',
                    //'exportDefaultFrom',
                    'nullishCoalescingOperator',
                    'numericSeparator',
                    'objectRestSpread',
                    'optionalCatchBinding',
                    'optionalChaining',
                ]});

            //console.log('babel_ast', babel_ast);

            babel_node_file = babel_ast;
            babel_node_program = babel_ast.program;

            //console.log('babel_node_program', babel_node_program);

            const {body} = babel_node_program;

            if (body.length === 1) {
                const node0 = body[0];

                babel_node = node0;
            } else {
                throw 'NYI';
            }


        }
    }


    if (babel_node) {
        const {type} = babel_node;
        
        if (type === 'VariableDeclaration' || type === "ClassDeclaration") {
            return new JS_AST_Node_Declaration(spec);
        } else {
            return new JS_AST_Node_Extended_Core(spec);
        }
    } else {
        throw 'stop';
    }

    

    //return new JS_AST_Node(spec);
}
module.exports = JS_AST_Node_Extended;