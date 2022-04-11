const jsgui = require('jsgui3-html');

const oext = require('obext');

// Website is a Publisher?

// Won't actually handle the HTTP requests.

// Will link to / use the HTTP request handlers?

const {Collection} = jsgui;
// For the moment, an abstraction to represent a website.

// A 'name property' mixin?

class Website {
    constructor(spec = {}) {
        // Variety of routes get served with variety of different formats and options.

        // Maybe will connect handlers with functionality.

        // Could contain a bunch of resources.
        // Then there are the relevant resource publishers.

        let name;

        if (spec.name) {
            name = spec.name;
        };

        Object.defineProperty(this, 'name', {
            get() {
                return name;
            },
            set(value) {
                name = value;
            }
        });

        let pages = new Collection();
        Object.defineProperty(this, 'pages', {
            get() {
                return pages;
            }
        });


        // Pages or routes...

        //  The website may have a routing tree, not a router?
        //  Or both.

        // The website can have pages, sections, menus etc.
        //  This could be a place (not Control) where the Controls are held together.

        // Web pages....
        // As well as applications / controls.

        // Web pages can have a path (to serve on). The path is something more of a server property, but when editing it
        //  intuitively is a property of the page itself.
        // Web pages can load in other content
        //  Some of it required to exist / be available at a specific address.



        /*
            website.pages.add(name, content);

            website.pages.front = ...
        */

        



    }

}

module.exports = Website;