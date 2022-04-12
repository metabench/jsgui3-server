const jsgui = require('jsgui3-html');

const oext = require('obext');

const Webpage = require('./webpage');
// Website is a Publisher?

// Won't actually handle the HTTP requests.

// Will link to / use the HTTP request handlers?

const {Collection} = jsgui;
// For the moment, an abstraction to represent a website.

// A 'name property' mixin?

// Not sure this even needs routes / router. Does not need to be optimised for serving at this stage.

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

        // When a page gets pushed within pages, it will need to be added to the router routes.

        // For the moment, let's start the website with one initial page.


        // Seems not to need any JS.
        const root_page = new Webpage({
            'name': 'Root Webpage',
            'title': 'jsgui3-server',
            'content': 'This is a jsgui3-server root web page.',
            'path': '/'
        });
        pages.push(root_page);

        console.log('pages.length()', pages.length()); // Could definitely make collections more modern.

        


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