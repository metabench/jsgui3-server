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





if (require.main === module) {

    // Or give the website an array of pages?
    //   Or the website will, if needed, abstract between the content and the pages.

    // Though having an index page could be a useful default.


    // 3 webpages could help.
    //  Maybe an 'API' 4th webpage.
    //    That would then need to describe the top-level API, as well get into some more specific / low level sections.

    


    // const website = new Website({index: index_webpage, control: control_webpage, server: server_webpage})

    const server = new Server({
        // website
    });

    // await server.ready instead???
    // await server.when.ready perhaps with the .when handling making the promise that listens to the event.
    //  server one('ready')

    
    server.one('ready', () => {
        //console.log('server ready to start');

        // server start will change to observable?

        server.start(8080, function (err, cb_start) {
            if (err) {
                throw err;
            } else {
                // Should have build it by now...
    
                console.log('server started');
            }
        });
    })

    // set up the server containing the various pages with the information.
    //  Want to see if this can be expressed in an information-dense syntax here in one file.
    //    Controls that serve concepts.
    //    Could view them on their own pages. Could also change the URL client-side and render the content client-side.

    // Probably do need a client.js file?
    //  May be nice to go without it. Render on the server, activate what is rendered with a standard bundle.

    // Tabbed options for how many pages in the app. Single | Multiple
    //   And show the server-side code, and the specific client-side code used by the server that's needed to render that.

    // Write about the specific build optimisation for SPAs with static HTML that can be cached.

    // Could have placeholder 'coming soon' parts of it.

    // A couple of windows both within a window on the first page could help.
    //   Have a bit of text explaining what things are.

    // Could have 'Introducing jsgui3' in a window.
    //   Could have a context menu with various 'easter egg' like things as well.
    //   Could go to various demos, maybe even a small game within that window.
    //     Or even run Doom there.

    // A larger introduction website would create the Website class instance, set it up so that it represents the website,
    //   then give it to the server to serve.








    // Show the code needed to make a server.

    // The front page should have a 'showcase' window, as well as the code that's used to generate it.



    



}