const jsgui = require('jsgui3-html');
const {tof, HTML_Document} = jsgui;

const oext = require('obext');

// Should maybe become its own module.

// jsgui3-website and jsgui3-webpage
// jsgui3-application
// jsgui3-ui-app
// jsgui3-app may be enough
//   could build / deploy it to phonegap / other native app wrapper.
//   And could deploy a jsgui3-app as a website...?
//   Deploy same app to other platforms?
// possibly jsgui3-bundler could bundle a website for different uses and formats.
// could have some kind of non-node server operating on client-side apps.

// jsgui3-coming-soon could itself be a website.
//  or a webpage?

// website with a single page.










const Webpage = require('./webpage');
// Website is a Publisher?

const Page_Control_Admin = require('./../controls/page/admin');

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

        if (spec.content) {
            const content = spec.content;

            console.log('content', content);
            console.log('tof(content)', tof(content));

            const t_content = tof(content);

            // And no pages set....

            if (pages.length() === 0) {


                if (t_content === 'function') {

                    // Create first and only page.



                    // is it an instance of an HTML_Document control?
    
                    // no it's a constructor rather than an instance.
    
                    // Need to call that function at some point.
                    //  Maybe the later the better.

                    const root_page = new Webpage({
                        'name': 'Root Webpage',
                        'title': 'jsgui3-server',
                        //'content': 'This is a jsgui3-server root web page.',
                        'content': content,
                        'path': '/'
                    });
                    pages.push(root_page);
    
    
                    /*
                    if (content instanceof HTML_Document) {
                        console.log('t_content', t_content);
                        console.trace();
                        throw 'NYI'; 
                    } else {
                        console.log('t_content', t_content);
                        console.trace();
                        throw 'NYI'; 
                    }
                    */
    
    
    
                    // a constructor (I assume)
                    
    
    
                } else {
                    console.log('t_content', t_content);
                    console.trace();
                    throw 'NYI'; 
                }


            } else {
                throw 'NYI';
            }

            

            //throw 'stop';
        }

        // be able to get 'content' from the spec.
        //  if the setting is a single item for a single page, it could be easier.




        // When a page gets pushed within pages, it will need to be added to the router routes.

        // For the moment, let's start the website with one initial page.


        // Seems not to need any JS.

        // May be better to put some kind of JSGUI content into there.
        //  That will get the bundling working better.

        // Make the content either a page control, or a standard (not full document) jsgui control.

        // But a Control, even a Page_Control, should need and be given a context.?
        //  Maybe not while in unrendered / pre-rendered phase.

        // Could try loading content from disk, and seeing what files get referenced.


        // A control without a Page Context here.
        //  Or the page context would be a rendering of the root_page.

        // Maybe render an actual placeholder control. Site_Placeholder perhaps?

        // What if the content is a Control constructor?
        //  Should be able to call the constructor (in the right circumstances).

        const use_coming_soon_jsgui3 = () => {
            const ctrl_root = new jsgui.Control({

            });
    
            const h1 = new jsgui.h1({});
            h1.add('Website Coming Soon');
            ctrl_root.add(h1);
    
    
            // <a href="url">link text</a>
    
            const p = new jsgui.p({});
            //p.add('This website is being built using jsgui3-server');
            p.add('This website is being built using ');
            const a = new jsgui.a({});
            a.dom.attributes.href = 'https://github.com/metabench/jsgui3-server';
            a.add('jsgui3-server');
            p.add(a);
    
    
            ctrl_root.add(p);
    
            const root_page = new Webpage({
                'name': 'Root Webpage',
                'title': 'jsgui3-server',
                //'content': 'This is a jsgui3-server root web page.',
                'content': ctrl_root,
                'path': '/'
            });
            pages.push(root_page);
    
            console.log('pages.length()', pages.length()); // Could definitely make collections more modern.
        }

        

        


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