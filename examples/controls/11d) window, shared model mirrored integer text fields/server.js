const jsgui = require('./client');

const {Demo_UI} = jsgui.controls;
const Server = require('../../../server');


// what would be the (best?) way to include the whole thing in one JS file?
//  Maybe don't try that right now.
//  maybe standardise on the dir, then client.js and server.js inside.



// Want to exclude this from the client bundle.
//  Some kind of marking to say that it's server-side only?

// Need to include JSGUI3 js within the client document.
//   Seems like an earlier code simplification removed this functionality?
//   Just specifying a Ctrl for the server - and giving it the 'disk_path_client_js'.
//     May as well fix that....


// The server code may be tiny, it seems best not to abstract it away totally though.
// At least not for the moment.

// from_string or parse_string in the data_types seems like it could be important.
//   or attempt_parse_string????
//   parse.string perhaps???

// So the data model can be updated with a string value, it gets parsed.
//   Or maybe it's the view model that needs to copy the type restriction of the data model?

//   Maybe work on more harmony between the Data_Model and View_Model.
//     Maybe the View_Model in some cases should actually be a string, in others not.

// parse_string for the moment....

//  May need to only parse valid numbers???

// validate_string perhaps???
//   could use a regex.





if (require.main === module) {

    // By default should include the JS and the CSS.
    // By reference, serving them from their respective paths.


    // This API is not working right now.

    // A very simple syntax for running a single control would be great.

    // Need to in the default (server) configuration build and serve the client-side app.
    // Want to be able to make interactive apps quickly with minimal server side code that needs to be written as boilerplate to
    // get the app running.

    // Though maybe defining a webpage, that serves the client js, and renders the control on the server, and activates it on the client,
    // would be the right approach.

    // Want to make the code really explicit, in a simple way.


    // eg { '/': Demo_UI }
    // eg { '*': Demo_UI }
    //  as at least it explicitly assigns it to the '/' route


    // But worth keeping the '/' Ctrl property?
    //  Could change it to explicitly setting the route(s).

    // Do want it to build the client js on start.

    // Could extract the CSS from the file itself, or maybe better reading it from the classes and objects that are loaded / referenced.
    // All kinds of complex server program structures exist already, so could use Publishers if needed for some things.
    //  But need to keep the surface-level API really simple.

    // Maybe define a Webpage and maybe use / define an HTML_Webpage_Publisher for example too.
    // The clearest code would be really explicit about what it does, but in terms of almost English idioms
    //  and on the surface-level not spelling out in great detail what it's doing, but referencing objects and
    //  instructions with clear purposes, though details could be obscure at the top level. Eg it's the publisher's responsibility
    //  to include the CSS and JS that's needed to get it to run. A publisher is referenced and used, and it does its thing.

    // The Server could automatically involk the use of a Publisher.
    //  May be better to either require or recommend more explicit code, have them in the examples,
    //  but also to document some shortcuts, defaults, and abbreviations (though they may omit some essential info, so not recommended for beginners)

    // Could have a tabbed view for examples for 'explicit' and 'short' notations when there are multiple.

    // jsgui3-html-suite may be of use, for some more extended controls that are built on top of jsgui3-html, but not specifically
    // client or server.






    const server = new Server({
        Ctrl: Demo_UI,
        //debug: true,
        // Giving it the Ctrl and disk path client js should enable to server to get the JS-bundled CSS from the file(s).
        //  Putting the JS files through proper parsing and into a syntax tree would be best.

        //'js_mode': 'debug',
        'src_path_client_js': require.resolve('./client.js'),
        //debug: true // should not minify the js, should include the symbols.
        //js_client: require.resolve('./square_box.js')
    });
    // A callback or event for when the bundling has been completed
    //  a 'ready' event.

    // then start the server....
    // be able to choose the port / ports?
    console.log('waiting for server ready event');
    server.one('ready', () => {
        console.log('server ready');

        // server start will change to observable?

        server.start(52000, function (err, cb_start) {
            if (err) {
                throw err;
            } else {
                // Should have build it by now...
    
                console.log('server started');
            }
        });
    })

    

}