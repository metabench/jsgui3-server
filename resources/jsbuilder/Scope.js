const {each, Evented_Class} = require('lang-tools');
const Declaration_Sequence = require('./Abstract_Single_Declaration_Sequence');

class Scope extends Evented_Class {

    // Generally will be a block scope.


    // Declarations are within scope.
    // Only Declarations?

    // Declarations are what matter for the moment.

    constructor(spec) {


        const declarations = new Declaration_Sequence();

        Object.defineProperty(this, 'declarations', {
            get() { return declarations; },
            enumerable: true,
            configurable: false
        });

    }


}

module.exports = Scope;