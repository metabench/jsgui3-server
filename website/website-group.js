// Multiple sites

// eg google.com, google.co.uk etc
//  all Google country service websites.

// Or all of the websites being served within a single server process.

const jsgui = require('jsgui3-html');

class Website_Group extends jsgui.Collection {
    constructor(spec = {}) {
        super(spec)
    }
}

module.exports = Website_Group;