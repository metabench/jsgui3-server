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