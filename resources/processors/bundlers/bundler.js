const {Evented_Class} = require('jsgui3-html');


// Or just have the bundler itself raise events, no need exactly for an observable.

class Bundler extends Evented_Class {
    constructor(spec = {}) {
        super(spec);
    }

    // API - bundle() obs / promise
    // Obs would be best because of status / progress updates.

    bundle(item) {
        console.trace();
        throw 'Need implementation of specific item bundling'
    }




}

module.exports = Bundler;