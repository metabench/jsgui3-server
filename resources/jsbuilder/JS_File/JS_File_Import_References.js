// May be removed / a changed version made.
//  Possibly a more general version, not just for JS files (in theory)

// But this could be useful for understanding what the import references are and matching the code for them.

// An abstraction that represents an understanding of the references that get imported into a JS_File.
//   Likely to be:
//    Generated when a js file is loaded
//    Used to understand where in the working and therefore output structure the functionality goes (if it is treated as a block).






class Import_References {
    constructor(spec = {}) {

        const arr = [];
        Object.defineProperty(this, 'arr', {
            //set: function(v) { arr = v; },
            get() { return arr; },
            enumerable: true,
            configurable: false
        });

        this.push = value => arr.push(value);

    }
}

module.exports = Import_References;