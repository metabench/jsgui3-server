const jsgui = require('jsgui3-html');

const oext = require('obext');

const {obs} = require('fnl');

// Website is a Publisher?

// Won't actually handle the HTTP requests.
const {Collection} = jsgui;
// Will link to / use the HTTP request handlers?

// Not sure this will be used...
//  Maybe it can extend a control?
//  Maybe a new Webpage object (not a Control) will be useful


// For the moment, an abstraction to represent a website.

// A 'name property' mixin?

class Webpage {
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

        // A URL or URL path property would make sense

        let path;

        if (spec.path) {
            path = spec.path;
        };

        Object.defineProperty(this, 'path', {
            get() {
                return path;
            },
            set(value) {
                path = value;
            }
        });
        Object.defineProperty(this, 'url_path', {
            get() {
                return path;
            },
            set(value) {
                path = value;
            }
        });

        // Then its content
        //  Could be as HTML string.
        //  Could be encoded somehow (eg template, rjx)
        //  Could be a Control that represents a page
        //  Could be a Control that goes within a page, and the system needs to serve it within the right page.

        let content;

        if (spec.content) {
            content = spec.content;
        };

        Object.defineProperty(this, 'content', {
            get() {
                return content;
            },
            set(value) {
                content = value;
            }
        });


        // Requirements...
        //  Would depend on the content.

        // Pages or routes...

        // A Collection of Pages.
        //  May not be the best indexed way.
        //  Should be fine for the moment.

        // Storing them all in a tree may be better.
        //  Could make other types of Collection with the same / very similar Collection API.

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


    // A render function...?
    // Async / observable interface by default.

    // Rendering the different parts of it, including building the JS?
    // Or rendering just applies to the Controls.
    // Build or Compile would prepare the relevant dependencies.

    // render_html() returns Observable

    // compile() returns Observable which returns Buffer for each compiled file.
    // build() has got wider connotations than complile(), such as preparing images.

    // Could provide client js files specifically built for that page within that page's directory structure, using the same file name
    //  but with .js extension. A single js file may be a good choice, such as for an app that gets embedded within a larger website.




    //  /pagesubdir/pagename_client.js




}

module.exports = Webpage;