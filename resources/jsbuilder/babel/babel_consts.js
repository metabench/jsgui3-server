
const type_abbreviations = {
    //'ArrowFunctionExpression': 'AFE',
    'ArrowFunctionExpression': 'AFE',
    'AssignmentExpression': 'AsE',
    'AssignmentPattern': 'AsP',
    'ArrayExpression': 'ArE',
    'ArrayPattern': 'ArP',
    'BinaryExpression': 'BE',
    'BlockStatement': 'BS',
    'BooleanLiteral': 'BL',
    'CallExpression': 'CaE', // change to CaE? Need to change sigs being looked for.
    'ClassBody': 'CB',
    'ClassDeclaration': 'CD',
    'ClassExpression': 'ClE',
    'ClassMethod': 'CM',
    'ConditionalExpression': 'CoE',
    'EmptyStatement': '__',
    'ExpressionStatement': 'ES',
    'File': 'F',
    'ForStatement': 'FS',
    'ForInStatement': 'FIS',
    'FunctionExpression': 'FE',
    'Identifier': 'ID',
    'IfStatement': 'IS',
    'LogicalExpression': 'LE',
    'MemberExpression': 'ME',
    'NullLiteral': 'null',
    'NumericLiteral': 'NumL',
    'NewExpression': 'NE',
    'ObjectExpression': 'OE',
    'ObjectMethod': 'OM',
    'ObjectPattern': 'OPa',
    'ObjectProperty': 'OPr',
    'Program': 'P',
    'ReturnStatement': 'RS',
    'RestElement': 'RE',
    'RegExpLiteral': 'RL',
    'StringLiteral': 'SL',
    'Super': 'S',
    'ThisExpression': 'TE',
    'ThrowStatement': 'TS',
    'UnaryExpression': 'UnE',
    'UpdateExpression': 'UpE',
    'VariableDeclaration': 'VDn',
    'VariableDeclarator': 'VDr',
    'WhileStatement': 'WS'
}

// ArrowFunctionExpression

const map_expression_categories = {
    'ArrowFunctionExpression': true,
    'AssignmentExpression': true,
    'ArrayExpression': true,
    'BinaryExpression': true,
    'CallExpression': true,
    'ClassExpression': true,
    'ConditionalExpression': true,
    // ExpressionStatement false because it's a statement
    'FunctionExpression': true,
    'LogicalExpression': true,
    'MemberExpression': true,
    'NewExpression': true,
    'ObjectExpression': true,
    'ThisExpression': true,
    'UnaryExpression': true,
    'UpdateExpression': true
}

const map_literal_categories = {
    'BooleanLiteral': true,
    

    'NullLiteral': true,
    'NumericLiteral': true,
    'RegExpLiteral': true,
    'StringLiteral': true

    // Must be more

    // ExpressionStatement false because it's a statement
    /*
    'FunctionExpression': true,
    'LogicalExpression': true,
    'MemberExpression': true,
    'NewExpression': true,
    'ObjectExpression': true,
    'ThisExpression': true,
    'UnaryExpression': true,
    'UpdateExpression': true
    */

}

const map_statement_categories = {
    BlockStatement: true,
    EmptyStatement: true,
    ExpressionStatement: true,
    ForStatement: true,
    ForInStatement: true,
    ReturnStatement: true,
    ThrowStatement: true,
    WhileStatement: true
}

const map_categories = {
    //'ArrowFunctionExpression': 'AFE',
    'ArrowFunctionExpression': 'Expression',
    'AssignmentExpression': 'Expression',
    'AssignmentPattern': 'Pattern',
    'ArrayExpression': 'Expression',
    'ArrayPattern': 'APPattern',
    'BinaryExpression': 'Expression',
    'BlockStatement': 'Statement',
    'BooleanLiteral': 'Literal',
    'CallExpression': 'Expression',
    'ClassBody': 'Body',
    'ClassDeclaration': 'Declaration',
    'ClassExpression': 'Expression',
    'ClassMethod': 'Method',
    'ConditionalExpression': 'Expression',
    'EmptyStatement': 'Statement',
    'ExpressionStatement': 'Statement',
    'ForStatement': 'Statement',
    'ForInStatement': 'Statement',
    'File': 'File',
    'FunctionExpression': 'Expression',
    'Identifier': 'Identifier',
    'IfStatement': 'Statement',
    'LogicalExpression': 'Expression',
    'MemberExpression': 'Expression',
    'NullLiteral': 'Literal',
    'NumericLiteral': 'Literal',
    'NewExpression': 'Expression',
    'ObjectExpression': 'Expression',
    'ObjectMethod': 'Method',
    'ObjectPattern': 'Pattern',
    'ObjectProperty': 'Property',
    'Program': 'Program',
    'RestElement': 'Element',
    'ReturnStatement': 'Statement',
    'RegExpLiteral': 'Literal',
    'StringLiteral': 'Literal',
    'Super': 'Super',
    'ThisExpression': 'Expression',
    'ThrowStatement': 'Statement',
    'UnaryExpression': 'Expression',
    'UpdateExpression': 'Expression',
    'VariableDeclaration': 'Declaration',
    'VariableDeclarator': 'Declarator',
    'WhileStatement': 'Statement'
}

module.exports = {
    type_abbreviations: type_abbreviations,
    map_expression_categories: map_expression_categories,
    map_literal_categories: map_literal_categories,
    map_categories: map_categories,
    map_statement_categories: map_statement_categories
}