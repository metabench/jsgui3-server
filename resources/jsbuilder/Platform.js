// Make a platform about providing variables.

const {each, Evented_Class} = require('lang-mini');
const Declaration_Sequence = require('./Abstract_Single_Declaration_Sequence');

class Platform extends Evented_Class {
    constructor(spec) {
        super(spec);
        const map_local_module_directories = {};
        const scope = new Scope();
    }
}

module.exports = Platform;