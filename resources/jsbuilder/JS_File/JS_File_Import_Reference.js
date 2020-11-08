
class Import_Reference {
    constructor(spec = {}) {

        // name and value pair.

        let name, value;

        Object.defineProperty(this, 'name', {
            set: function(v) { name = v; },
            get() { return name; },
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(this, 'value', {
            set: function(v) { value = v; },
            get() { return value; },
            enumerable: true,
            configurable: false
        });
    }
}

module.exports = Import_Reference;