const {Evented_Class} = require('jsgui3-html');

class Bundler extends Evented_Class {
    constructor(spec = {}) {
        super(spec);
    }
}

module.exports = Bundler;