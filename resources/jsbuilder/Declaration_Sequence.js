

// lang-mini, for example, would be represented with this. It's a module that reveals a number of declarations.
//  Internally, it operates in a sequence (kind of). 


const {each, Evented_Class} = require('lang-mini');

class Declaration_Sequence extends Evented_Class {
    constructor(spec) {
        super();
    }
}

module.exports = Declaration_Sequence;