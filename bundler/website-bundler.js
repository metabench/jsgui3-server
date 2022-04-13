const Bundler = require('./bundler');
const Bundle = require('./bundle');
const {obs} = require('fnl');
const {tof} = require('jsgui3-html');

//  Get everything ready to serve.

// Would need a JS file that contains refs to all of the components used.
//  Examine what is in the website and what JS it needs.

// Bundling up the contents of a small/medium website so that contents are compressed and ready to serve.
// Could be useful for deploying to Android / iOS devices, maybe as apps.



class Website_Bundler extends Bundler {
    constructor(spec = {}) {
        super(spec);
    }
}


module.exports = Website_Bundler;