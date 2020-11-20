
const type_abbreviations = {
    //'ArrowFunctionExpression': 'AFE',
    'ArrowFunctionExpression': 'AFE',
    'AssignmentExpression': 'AsE',
    'AssignmentPattern': 'AP',
    'ArrayExpression': 'ArE',
    'ArrayPattern': 'AP',
    'BinaryExpression': 'BE',
    'BlockStatement': 'BS',
    'BooleanLiteral': 'BL',
    'CallExpression': 'CE',
    'ClassBody': 'CB',
    'ClassDeclaration': 'CD',
    'ClassMethod': 'CM',
    'EmptyStatement': '__',
    'ExpressionStatement': 'ES',
    'File': 'F',
    'ForStatement': 'FS',
    'FunctionExpression': 'FE',
    'Identifier': 'ID',
    'IfStatement': 'IS',
    'LogicalExpression': 'LE',
    'MemberExpression': 'ME',
    'NullLiteral': 'null',
    'NumericLiteral': 'NumL',
    'NewExpression': 'NE',
    'ObjectExpression': 'OE',
    'ObjectPattern': 'OPa',
    'ObjectProperty': 'OPr',
    'Program': 'P',
    'ReturnStatement': 'RS',
    'StringLiteral': 'SL',
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
    'ClassMethod': 'Method',
    'EmptyStatement': 'Statement',
    'ExpressionStatement': 'Statement',
    'ForStatement': 'Statement',
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
    'ObjectPattern': 'Pattern',
    'ObjectProperty': 'Property',
    'Program': 'Program',
    'ReturnStatement': 'Statement',
    'StringLiteral': 'Literal',
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