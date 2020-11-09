const JS_File_Core = require('./JS_File_0-Core');

class JS_File_Early_Parse extends JS_File_Core {
    constructor(spec) {
        super(spec);

        let code_type;
        Object.defineProperty(this, 'code_type', {
            // Using shorthand method names (ES2015 feature).
            // This is equivalent to:
            // get: function() { return bValue; },
            // set: function(newValue) { bValue = newValue; },
            get() { return code_type; },
            //set(newValue) { bValue = newValue; },
            enumerable: true,
            configurable: false
        });

        
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

    }
}

module.exports = JS_File_Early_Parse;
