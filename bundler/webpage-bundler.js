const Bundler = require('./bundler');
const Bundle = require('./bundle');
const {obs} = require('fnl');
const {tof} = require('jsgui3-html');

// Will put the JS together. Maybe images?
//  Get everything ready to serve.



const bundle_web_page = (webpage, options) => {
    const {content} = webpage;

    // Then depending on the content type

    const t_content = tof(content);

    console.log('content', content);
    console.log('t_content', t_content);

    return obs((next, complete, error) => {
        const res = new Bundle();

        // The observable could / should return updates along the way, things that contribute to the full result.



        if (t_content === 'string') {
            // Hardly anything to bundle. No JS required, so it seems.
            // Maybe put it inside a basic JSGUI page control...?

            // Page may still have a title.
            const html = `<html><head><title>${webpage.title}</title></head><body>${content}</body></html>`;
            const buff = Buffer.from(html, "utf-8");

            // and value with different types of compression....
            //  worth having them ready.
            res.push({
                'path': webpage.path,
                'value': buff,
                'content-type': 'text/html'
            });
            complete(res);

        } else {
            throw 'NYI';

            // or error nyi.
        }

    });

    

    //throw 'NYI';
}

class Webpage_Bundler extends Bundler {
    constructor(spec = {}) {
        super(spec);
    }
}

Webpage_Bundler.bundle_web_page = bundle_web_page;

module.exports = Webpage_Bundler;