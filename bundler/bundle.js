// Could make this a Collection?

const {Collection} = require('jsgui3-html');

class Bundle extends Collection {
    constructor(spec = {}) {
        super(spec);
    }
}

module.exports = Bundle;