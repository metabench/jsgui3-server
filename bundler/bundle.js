// Could make this a Collection?

// jsgui3-bundle possibly?
//  Could save the whole thing as a ZIP file, or in-memory buffer in ZIP format?






const {Collection} = require('jsgui3-html');

class Bundle extends Collection {
    constructor(spec = {}) {
        super(spec);
    }
}

module.exports = Bundle;