class Interpretation {
    constructor(spec = {}) {
        
        /*
        let node;
        if (spec.node) node = spec.node;
        Object.defineProperty(this, 'node', {
            get() { 
                return node;
            },
            enumerable: true,
            configurable: false
        });
        */

        // specialisation name
        //  then 'extracted'
        //   whatever has been extracted from that node, will be a plain js object.



        let specialisation_name;
        if (spec.specialisation_name) specialisation_name = spec.specialisation_name;
        Object.defineProperty(this, 'specialisation_name', {
            get() { 
                return specialisation_name;
            },
            enumerable: true,
            configurable: false
        });

        let extracted;
        if (spec.extracted) extracted = spec.extracted;
        Object.defineProperty(this, 'extracted', {
            get() { 
                return extracted;
            },
            enumerable: true,
            configurable: false
        });


        let message;
        if (spec.message) message = spec.message;
        Object.defineProperty(this, 'message', {
            get() { 
                return message;
            },
            enumerable: true,
            configurable: false
        });


        let node;
        if (spec.node) node = spec.node;
        Object.defineProperty(this, 'node', {
            get() { 
                return node;
            },
            enumerable: true,
            configurable: false
        });

        Object.defineProperty(this, 'obj', {
            get() { 
                return {
                    specialisation: {
                        name: this.specialisation_name
                    },
                    node: this.node,
                    extracted: extracted
                };
            },
            enumerable: true,
            configurable: false
        });
        
        

    }
}

module.exports = Interpretation;