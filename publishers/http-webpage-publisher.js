
const jsgui_client = require('jsgui3-client');

const HTTP_Publisher = require('./http-publisher');
const Server_Static_Page_Context = require('../static-page-context');

const HTTP_Webpageorsite_Publisher = require('./http-webpageorsite-publisher');
const {obs} = require('fnl');

const Static_Routes_Responses_Webpage_Bundle_Preparer = require('./helpers/preparers/static/bundle/Static_Routes_Responses_Webpage_Bundle_Preparer');

class HTTP_Webpage_Publisher extends HTTP_Webpageorsite_Publisher {

    constructor(spec = {}) {
        super(spec)

        // A website property.

        let webpage;
        if (spec.webpage) webpage = spec.webpage;
        Object.defineProperty(this, 'webpage', {
            get() {
                return webpage;
            }
        });
        this.static_routes_responses_webpage_bundle_preparer = new Static_Routes_Responses_Webpage_Bundle_Preparer();
        (async() => {
            const res_get_ready = await this.get_ready();
            this.raise('ready', res_get_ready);

        })();

    }

    async get_ready() {
        //await super.get_ready();

        const {static_routes_responses_webpage_bundle_preparer} = this;


        // Its a bundle....
        const webpage_or_website_res_get_ready = await super.get_ready();


        const render_webpage = async () => {

            const {webpage} = this;
            const Ctrl = webpage.content;

            // In business activating it with the page context.

            const static_page_context = new Server_Static_Page_Context();

            const ctrl = new Ctrl({
                context: static_page_context
            });

            // Webpage_CSS_JS_HTML_Bundle_Ready_To_Serve_Preparer

            if (ctrl.head && ctrl.body) {

                const ctrl_css_link = new jsgui_client.controls.link({
                    context: static_page_context
                });
                ctrl_css_link.dom.attributes.rel = 'stylesheet';
                ctrl_css_link.dom.attributes.href = '/css/css.css';
                ctrl.head.add(ctrl_css_link);
                
                const ctrl_js_script_link = new jsgui_client.controls.script({
                    context: static_page_context
                });

                ctrl_js_script_link.dom.attributes.src = '/js/js.js';
                ctrl.body.add(ctrl_js_script_link);
                
                ctrl.active();
                const html = await ctrl.all_html_render();
                return html;
            } else {

                // C reate doc and put control inside that?

                console.trace();
                throw 'NYI';
            }
            
        }

        // Maybe a Webpage_Rendering_Preparer could do this even?

        // Webpage_Renderer even
        //   And it could render jsx, (other react?), 


        const webpage_html = await render_webpage();

        const o_webpage_html = {
            type: 'HTML',
            extension: 'html',
            text: webpage_html
        }

        webpage_or_website_res_get_ready.push(o_webpage_html);

        //console.log('webpage_or_website_res_get_ready._arr.length', webpage_or_website_res_get_ready._arr.length);


        await static_routes_responses_webpage_bundle_preparer.prepare(webpage_or_website_res_get_ready);

        // Then publish it to the router...?
        //   server.serve_prepared_static_routes_bundle ?????
        return webpage_or_website_res_get_ready;
        
    }


    handle_http(req, res) {
        console.log('HTTP_Webpage_Publisher handle_http');
        console.log('req.url', req.url);

        const {webpage} = this;
        
        const Ctrl = webpage.content;
        const ctrl = new Ctrl();
        
        res.writeHead(200, {
            'Content-Type': 'text/html'
          });

        res.end(ctrl.all_html_render());
        
    }
}

module.exports = HTTP_Webpage_Publisher;