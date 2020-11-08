const JS_File_Core = require('./JS_File_0-Core');
const {each, tof} = require('lang-mini');


class JS_File_Babel extends JS_File_Core {
    constructor(spec) {
        super(spec);
        let ready = false, babel_ast;
        const root_babel_declarations = [];        

        Object.defineProperty(this, 'babel_ast', {
            // Using shorthand method names (ES2015 feature).
            // This is equivalent to:
            // get: function() { return bValue; },
            // set: function(newValue) { bValue = newValue; },
            get() { return babel_ast; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        // root_declarations
        Object.defineProperty(this, 'root_babel_declarations', {
            // Using shorthand method names (ES2015 feature).
            // This is equivalent to:
            // get: function() { return bValue; },
            // set: function(newValue) { bValue = newValue; },
            get() { return root_babel_declarations; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        const each_babel_root_node = this.each_babel_root_node = (callback) => {
            if (ready) {
                each(babel_ast.program.body, body_node => callback(body_node));
            } else {
                throw 'Not ready';
            }
        }

        this.on('parsed-ast', e_parsed_ast => {
            const {value} = e_parsed_ast;
            const ast = value;
            babel_ast = ast;
            //console.log('ast', ast);
            // Then find declarations etc, declarations within the 'platform' part of the file.
            //  
            //console.log('ast.program', ast.program);
            //console.log('ast.program.body', ast.program.body);

            //let initial_phase = true;

            
            ready = true;
            //console.log('src_body0', src_body0);
            //throw 'stop';
            // And can call upon the node's functions to query things about that declaration / statement.
            //  Functions like extracting all the variable names from it.
            //   the counts of different types of programming constructs it uses.
            // Specifically want to see if it is 'inline' or refers to anything outside of its own scope.
            //  Then the larger Platform / Project system could find and even provide these external references.
            //console.log('ast.program.body.length', ast.program.body.length);
            //console.log('js_ast_node', js_ast_node);
            // Come up with compressed versions of the functions or statements, one by one, where possible.

        });

    }
}

module.exports = JS_File_Babel;
