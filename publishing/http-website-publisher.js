

// A publisher handles HTTP requests.

// This is going to take over some of the responsibilities of the old website resource, which was unfocused code that was
//  doing some of the main / most important parts of serving the website.


const HTTP_Publisher = require('./http-publisher');

class HTTP_Website_Publisher extends HTTP_Publisher {
    constructor(spec = {}) {
        super(spec)

        // A website property.

        let website;
        if (spec.website) website = spec.website;
        Object.defineProperty(this, 'website', {
            get() {
            return website;
            }
        });

    }
}

module.exports = HTTP_Website_Publisher;