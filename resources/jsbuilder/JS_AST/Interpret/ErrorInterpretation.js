const Interpretation = require('./Interpretation');

class ErrorInterpretation extends Interpretation {
    constructor(spec = {}) {
        super(spec);
    }
}

module.exports = ErrorInterpretation;