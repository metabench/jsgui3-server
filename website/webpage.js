// Late 2023 - have now made other Website and Webpage packages.
//  Seems like they are not only for the Server, but can be defined in the abstract before being served.





const jsgui = require('jsgui3-html');

const oext = require('obext');

const {obs} = require('fnl');

// Website is a Publisher?

const Webpage = require('jsgui3-webpage');

// Won't actually handle the HTTP requests.
const {Collection} = jsgui;


// But perhaps Active_Webpage will help somewhere...?

// Server_Instance_Of_Active_Webpage
//   Can get complex and explicit with the structures and the names - moving the complexity away from single files.








// Will link to / use the HTTP request handlers?

// Not sure this will be used...
//  Maybe it can extend a control?
//  Maybe a new Webpage object (not a Control) will be useful


// For the moment, an abstraction to represent a website.

// A 'name property' mixin?
//  Though could / should an HTML document control be used here?
//    Probably not, because it's a specific type of web page. By far the most common one I think though.
//    And the Webpage (helpfully) connects the path with the document.


class Obselete_Style_Webpage {

    // The object itself... not so essential right now.

    // Maybe will use jsgui3-website instead.
    // Could basically be a JS Obj (class) that assigns itself from its spec.
    //  




    constructor(spec = {}) {
        // Variety of routes get served with variety of different formats and options.
        // Maybe will connect handlers with functionality.

        // Could contain a bunch of resources.
        // Then there are the relevant resource publishers.
        let name = spec.name;
        Object.defineProperty(this, 'name', { get() { return name; }, set(value) { name = value; } });

        let title = spec.title;
        Object.defineProperty(this, 'title', { get() { return title; }, set(value) { title = value; } });

        let path = spec.path;
        Object.defineProperty(this, 'path', { get() { return path; }, set(value) { path = value; } });
        Object.defineProperty(this, 'url_path', { get() { return path; }, set(value) { path = value; } });

        let content = spec.content;
        Object.defineProperty(this, 'content', { get() { return content; }, set(value) { content = value; } });
    }

}

module.exports = Webpage;