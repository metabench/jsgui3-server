

// lang-mini, for example, would be represented with this. It's a module that reveals a number of declarations.
//  Internally, it operates in a sequence (kind of). 


const {each, Evented_Class} = require('lang-mini');

class Declaration_Sequence extends Evented_Class {
    constructor(spec = {}) {
        super();


        // A double linked list could be better though.

        const arr = [];

        this.push = (declaration) => {
            arr.push(declaration);
        };

        Object.defineProperty(this, 'arr', {
            get() { return arr; },
            enumerable: false,
            configurable: false
        });
        
    }

    *iterator() {
        for (let key in this.arr) {
            const value = arr[key];
            yield value;
        }
    }

    // Implement "iterable protocol"
    [Symbol.iterator]() {
        return this.iterator();
    }
}

module.exports = Declaration_Sequence;