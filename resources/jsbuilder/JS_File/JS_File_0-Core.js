const {each, Evented_Class} = require('lang-mini');
const crypto = require('crypto');

const whitespace_chars = {
    '32': true
}

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

class JS_File extends Evented_Class {
    constructor(spec = {}) {
        super();

        const rs = (() => spec.rs || undefined)();
        const line_break_hex = (() => spec.line_break_hex || '0A')();

        let path = spec.path;
        
        const ta_line_buffer = new Uint8Array(1024);
        let byte_in_line_num = 0;

        let line_num = 0;
        //let last_recieved_byte;
        //let recieved_byte;
        // Separate the chunks and the raise an event for each line.
        //  Charactrer by character???

        // Array or something of the tokens?

        //let first_token_of_line_char_pos = -1;
        //let began_first_token_of_line = false;
        //this.on('readline', e_readline => {

        //});



        let last_recieved_byte;
        let recieved_byte;

        let sha512, source;

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

        this.on('input-stream-end', (e_end) => {
            const {str_all} = e_end;
            sha512 = e_end.sha512;
            source = str_all;
        })


        this.on('recieve-line-char', e_rlc => {
            //console.log('e_rlc', e_rlc);
            const char_type = get_char_type(e_rlc)
            //console.log('char_type', char_type);
            /*
            if (!began_first_token_of_line) {
                if (whitespace_chars[e_rlc.char_code]) {

                } else {
                    began_first_token_of_line = true;
                }
            }
            */

        })

        const arr_lines = [];



        this.on('recieve-line', e_recieve_line => {
            //console.log('e_recieve_line', e_recieve_line);
            const {str} = e_recieve_line;

            // and strip the tabs and whitespace.
            arr_lines.push(str);
        });


        this.on('recieve-line', e_recieve_line => {
            //console.log('e_recieve_line', e_recieve_line);
            const {str} = e_recieve_line;

            // and strip the tabs and whitespace.
            //arr_lines.push(str);

            // process the line character by character.
            
            //console.log('e_recieve_linestr', str);

            // And break up the line into statements;

            const s = e_recieve_line.str, l = s.length;
            for (let c = 0; c < l; c++) {
                const ch = s[c];
                this.raise('recieve-line-char', {
                    line_num: line_num,
                    char: ch,
                    char_code: s.charCodeAt(c)
                })
            }
        });


        

        this.on('recieve-byte', e_receive_byte => {
            last_recieved_byte = recieved_byte;
            recieved_byte = e_receive_byte.byte_value;
            ta_line_buffer[byte_in_line_num++] = recieved_byte;
            //console.log('e_receive_byte', e_receive_byte);

            if (recieved_byte === 10) {
                // lf
                if (last_recieved_byte === 13) {
                    // cr, for windows

                    const line_until_crlf = new Uint8Array(ta_line_buffer.subarray(0, byte_in_line_num - 2));

                    this.raise('recieve-line', {
                        ta_line: line_until_crlf,
                        bytes_length: byte_in_line_num,
                        str: String.fromCharCode.apply(null, line_until_crlf)
                    })

                } else {

                    const line_until_lf = new Uint8Array(ta_line_buffer.subarray(0, byte_in_line_num - 1));
                    this.raise('recieve-line', {
                        ta_line: line_until_lf,
                        bytes_length: byte_in_line_num,
                        str: String.fromCharCode.apply(null, line_until_lf)
                    })
                }
                ta_line_buffer.fill(0);
                line_num++;
                byte_in_line_num = 0;
            }
        });

        if (rs) {

            // Wait for subclass listeners to be set up.
            //setTimeout(() => {
                

                // Interpret it in chunks.
                // Read it line by line, after character by character.
                //  Very event driven parser, or partial parser at least.

                //let buf1;

                const ta_line_buffer = new Uint8Array(1024);
                let byte_in_line_num = 0;

                let line_num = 0;
                let last_recieved_byte;
                let recieved_byte;
                // Separate the chunks and the raise an event for each line.
                //  Charactrer by character???

                // Array or something of the tokens?

                //let first_token_of_line_char_pos = -1;
                let began_first_token_of_line = false;

                

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

                    const line_until_end = new Uint8Array(ta_line_buffer.subarray(0, byte_in_line_num));
                    const str = String.fromCharCode.apply(null, line_until_end);
                    this.raise('recieve-line', {
                        ta_line: line_until_end,
                        bytes_length: byte_in_line_num,
                        str: str,
                        last: true
                    });
                    const str_all = arr_lines.join('\n');
                    //var crypto = require('crypto');
                    var hash = crypto.createHash('sha512');
                    //passing the data to be hashed
                    //data = hash.update('salt1', 'utf-8');
                    const data = hash.update('str_all', 'utf-8');
                    //Creating the hash in the required format
                    const gen_hash = data.digest('hex');
                    //Printing the output on the console
                    console.log("hash : " + gen_hash);

                    //console.log('arr_lines.length', arr_lines.length);
                    this.raise('input-stream-end', {
                        str_all: str_all,
                        sha512: gen_hash
                    });

                    this.raise('ready');
                });
            //}, 0);
            // then divide by line break character?
            //  not sure of the formating, probably unicode.
        }

    }
}
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
