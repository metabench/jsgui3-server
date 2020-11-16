const JS_File_Core = require('./JS_File_0-Core');

class JS_File_Early_Parse extends JS_File_Core {
    constructor(spec) {
        super(spec);

        let code_type;
        let export_name;

        

        
        this.on('recieve-line', e_recieve_line => {
            //console.log('e_recieve_line', e_recieve_line);
            const {str} = e_recieve_line;
            if (str.startsWith('module.exports')) {
                //console.log('str', str);
                const [mexp, name] = str.split(';').join('').split(' ').join('').split('=');
                //console.log('name', name);
                export_name = name;
                code_type = 'CommonJS';
                this.raise('parsed-code-type', {
                    value: code_type
                });
                //console.log('pre raise parsed-export-name');
                this.raise('parsed-export-name', {
                    value: name
                });
            }
        });
        
        // preparsing? early parsing?
        this.on('parsed-export-name', e_parse => {
            const {value} = e_parse;
            console.log('parsed-export-name', value);
            export_name = value;
        });
        this.on('parsed-root-class-name', e_parse => {
            const {value} = e_parse;
            //console.log('parsed-root-class-name', value);
            root_class_name = value;
        });

        const arr_lines = [];
        const ta_line_buffer = new Uint8Array(1024);
        let byte_in_line_num = 0, line_num = 0;

        let last_recieved_byte;
        let recieved_byte;

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

        this.on('input-stream-end', e_isend => {
            //const {str_all, sha512} = e_isend;

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

            /*

            var hash = crypto.createHash('sha512');
            //passing the data to be hashed
            //data = hash.update('salt1', 'utf-8');
            const data = hash.update('str_all', 'utf-8');
            //Creating the hash in the required format
            const gen_hash = data.digest('hex');
            //Printing the output on the console
            console.log("hash : " + gen_hash);

            */
            //throw 'stop';

            this.raise('complete-file-recieved', {
                str_all: str_all
            })
        })

        // No, will have an export object or feature?
        //  .export object that can be queried makes a lot of sense.

        


        Object.defineProperty(this, 'export_name', {
            // Using shorthand method names (ES2015 feature).
            // This is equivalent to:
            // get: function() { return bValue; },
            // set: function(newValue) { bValue = newValue; },
            get() { return export_name; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });


    }
}

module.exports = JS_File_Early_Parse;
