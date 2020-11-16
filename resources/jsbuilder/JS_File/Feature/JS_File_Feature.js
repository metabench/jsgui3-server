class JS_File_Feature {
    constructor(spec = {}) {

        let name;

        if (spec.name) {
            name = spec.name;
        }

        Object.defineProperty(this, 'name', {
            get() { return name; },
            enumerable: true,
            configurable: false
        });
    }
}

module.exports = JS_File_Feature;