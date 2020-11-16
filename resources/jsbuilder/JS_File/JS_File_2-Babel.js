const JS_File_Early_Parse = require('./JS_File_1-Early_Parse');
const {each, tof} = require('lang-mini');

const parser = require('@babel/parser');

class JS_File_Babel extends JS_File_Early_Parse {
    constructor(spec) {
        super(spec);
        let ready = false, babel_ast;
        //const babel_root_declarations = [];        

        Object.defineProperty(this, 'babel_ast', {
            get() { return babel_ast; },
            enumerable: true,
            configurable: false
        });
        // root_declarations

        /*
        Object.defineProperty(this, 'babel_root_declarations', {
            get() { return babel_root_declarations; },
            enumerable: true,
            configurable: false
        });
        */

        Object.defineProperty(this, 'babel_root_nodes', {
            get() { return babel_ast.program.body; },
            enumerable: true,
            configurable: false
        });

        const each_babel_root_node = (callback) => {
            if (ready) {
                each(babel_ast.program.body, body_node => callback(body_node));
            } else {
                throw 'Not ready';
            }
        }

        // 'complete-file-recieved'  

        this.on('complete-file-recieved', (e_end) => {
            const {str_all} = e_end;
            //sha512 = e_end.sha512;
            //source = str_all;
            //console.log('str_all.length', str_all.length);
            //console.log('arr_lines', arr_lines);

            //console.log('str_all', str_all);

            //throw 'stop';

            babel_ast = parser.parse(str_all, {
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
            //console.log('ast', ast);
            this.raise('parsed-ast', {
                value: babel_ast
            });
        })

        this.on('parsed-ast', e_parsed_ast => ready = true);

    }
}

module.exports = JS_File_Babel;
