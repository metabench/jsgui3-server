const {each, Evented_Class} = require('lang-tools');
const crypto = require('crypto');

const whitespace_chars = {
    '32': true
}

/*

const get_char_type = e_rlc => {
    const {char, char_code} = e_rlc;

    if (char_code === 32 || char_code === 9 || char_code === 13 || char_code === 10) return 'whitespace';
    if (char === '0' || char === '1' || char === '2' || char === '3' || char === '4' || char === '5' || char === '6' || char === '7' || char === '8' || char === '9') return 'digit'

    if (char === '=' || char === '<' || char === '>' || char === '(' || char === ')' || char === '{' || char === "," ||
        char === '}' || char === '[' || char === ']' || char === ':' || char === ';' || char === '?' || char === '!' || char === '.' || char === '&' || char === '%' ||
        char === '"' || char === '\'' || char === '|' || char === '~' || char === '#' || char === '@' ||  
        char === '+' || char === '*' || char === '/' || char === '\\' || char === '-' || char === '^') return 'punctuation'
    if (char_code >= 65 && char_code <= 90) return 'letter' // ucase
    if (char_code >= 97 && char_code <= 122) return 'letter' // lcase
    if (char === '_' || char === '$') return 'letter-like';
    console.log('char', char);
    console.log('e_rlc', e_rlc);
    throw 'unknown';
}
*/

class JS_File extends Evented_Class {
    constructor(spec = {}) {
        super();

        const rs = (() => spec.rs || undefined)();
        const line_break_hex = (() => spec.line_break_hex || '0A')();
        

        let path = spec.path;

        let sha512, source;

        //Object.assign(this, {
        //    body: {}
        //})

        

        Object.defineProperty(this, 'path', {
            get() { return path; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'sha512', {
            get() { return sha512; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'source', {
            get() { return source; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });



        //if (spec.source) source = spec.source;

        
        //this.on('recieve-line-char', e_rlc => {
        //    //console.log('e_rlc', e_rlc);
        //    const char_type = get_char_type(e_rlc)
        //    //console.log('char_type', char_type);
        //    /*
        //    if (!began_first_token_of_line) {
        //        if (whitespace_chars[e_rlc.char_code]) {

        //        } else {
        //            began_first_token_of_line = true;
        //        }
        //    }
        //    */
        //})

        

        if (rs) {
            this.on('complete-file-recieved', (e_end) => {
                const {str_all} = e_end;
                //console.log('e_end', e_end);

                // Work out the hash value here?

                //sha512 = e_end.sha512;
                source = str_all;
                //console.log('source', source);
                //throw 'stop';
            })

            // Wait for subclass listeners to be set up.
            //setTimeout(() => {
                

                // Interpret it in chunks.
                // Read it line by line, after character by character.
                //  Very event driven parser, or partial parser at least.

                //let buf1;

                

                

                // An array of tokens as strings???

                //  Or just be able to identify the first tokens?
                //   The part before the equals sign?

                // Best to creat OO oprogrammatic objects from these.
                //  But maybe best to use an existing parsing tool.

                // Identifying all variable declarations may be possible.
                //   All function calls too...

                // Identifying all local variable references.
                //  Putting it into JS objects would make sense.
                //   Into highly OO JS objects in the right structure.

                // Could raise an event whenever it finds a token.
                //  Then will need to make sense of these tokens.

                // Being able to get a list of which declarations were made where in the code would helo.

                // block, conditional, switch, loop

                // Maybe an existing parser would make a lot more sense.
                //  Be better able to identify 

                // https://esprima.org/
                // 

                //console.log('rs', rs);

                rs.on('data', chunk => {
                    //if (!buf1) {buf1 = chunk} else {
                    // buf1 = Buffer.concat([buf1, chunk]);
                    const l = chunk.length;
                    //console.log('l', l);
                    for (let c = 0; c < l; c++) {
                        this.raise('recieve-byte', {
                            byte_value: chunk.readUInt8(c)
                        });
                    }
                    //}
                });
                let ast;

                rs.on('end', e_end => {

                    

                    //console.log('arr_lines.length', arr_lines.length);
                    this.raise('input-stream-end', {
                        //str_all: str_all,
                        //sha512: gen_hash
                    });

                    this.raise('ready');
                });
            //}, 0);
            // then divide by line break character?
            //  not sure of the formating, probably unicode.
        } else {

            // may have been given the source in the constructor.

            throw 'stop';
        }

    }
}

// Worth being able to load this abstraction from the string text too.


JS_File.load_from_stream = (rs, path) => {
    const res = new JS_File({rs: rs, path: path});
    return res;
}

JS_File.load_from_path = (path) => {

}

// Interpret / arrange a file in terms of the other objects within this system.

// References at the beginning - will also work in terms of references to declarations, platforms, and declaration sequences.

// Make it operate in a streaming way?
//  Event driven too?
//   So it can have events as it goes through the file or the stream.
module.exports = JS_File;
