
const {tof} = require('lang-tools');

class HTTP_Responder {
    constructor(spec) {
        const t_spec = tof(spec);
        if (t_spec === 'object') {
            Object.assign(this, spec);
        } else {
            console.trace();
            throw 'stop';
        }
    }
}

module.exports = HTTP_Responder;