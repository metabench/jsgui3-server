// Could make this a Collection?

// jsgui3-bundle possibly?
//  Could save the whole thing as a ZIP file, or in-memory buffer in ZIP format?




// Not so sure it's best as a collection...?
//   Maybe it could work though.
//   Simple collection code could be fine.




// bundle.add(obj that is part of the bundle)





const {Collection} = require('jsgui3-html');

class Bundle extends Collection {
    constructor(spec = {}) {
        super(spec);
    }
}

module.exports = Bundle;