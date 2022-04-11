// Multiple sites

// eg google.com, google.co.uk etc
//  all Google country service websites.

const jsgui = require('jsgui3-html');

class Website_Group extends jsgui.Collection {
    constructor(spec = {}) {
        super(spec)
    }
}

module.exports = Website_Group;