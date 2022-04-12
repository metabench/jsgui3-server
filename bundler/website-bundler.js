const Bundler = require('./bundler');
const Bundle = require('./bundle');
const {obs} = require('fnl');
const {tof} = require('jsgui3-html');

// Will put the JS together. Maybe images?
//  Get everything ready to serve.


class Website_Bundler extends Bundler {
    constructor(spec = {}) {
        super(spec);
    }
}


module.exports = Website_Bundler;