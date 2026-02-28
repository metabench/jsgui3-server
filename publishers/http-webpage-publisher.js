
const jsgui_client = require('jsgui3-client');

const HTTP_Publisher = require('./http-publisher');
const Server_Static_Page_Context = require('../static-page-context');

const HTTP_Webpageorsite_Publisher = require('./http-webpageorsite-publisher');
const { obs } = require('fnl');

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

        // Store bundler configuration for passing to preparers
        this.bundler_config = spec.bundler || {};

        // Add input validation for bundler configuration
        if (spec.bundler !== undefined && typeof spec.bundler !== 'object') {
            throw new Error('bundler must be an object');
        }

        // Add input validation for compression settings
        if (this.bundler_config.compression) {
            const compression = this.bundler_config.compression;
            if (compression.enabled !== undefined && typeof compression.enabled !== 'boolean') {
                throw new Error('bundler.compression.enabled must be a boolean');
            }
            if (compression.algorithms && !Array.isArray(compression.algorithms)) {
                throw new Error('bundler.compression.algorithms must be an array');
            }
            if (compression.algorithms) {
                const validAlgorithms = ['gzip', 'br'];
                for (const alg of compression.algorithms) {
                    if (!validAlgorithms.includes(alg)) {
                        throw new Error(`Invalid compression algorithm: ${alg}. Must be one of: ${validAlgorithms.join(', ')}`);
                    }
                }
            }
            if (compression.threshold !== undefined && (typeof compression.threshold !== 'number' || compression.threshold < 0)) {
                throw new Error('bundler.compression.threshold must be a non-negative number');
            }
        }

        // Add input validation for minification settings
        if (this.bundler_config.minify) {
            const minify = this.bundler_config.minify;
            if (minify.level !== undefined && typeof minify.level !== 'string') {
                throw new Error('bundler.minify.level must be a string');
            }
            if (minify.level !== undefined) {
                const validLevels = ['conservative', 'normal', 'aggressive'];
                if (!validLevels.includes(minify.level)) {
                    throw new Error(`Invalid minification level: ${minify.level}. Must be one of: ${validLevels.join(', ')}`);
                }
            }
        }

        this.static_routes_responses_webpage_bundle_preparer = new Static_Routes_Responses_Webpage_Bundle_Preparer({
            bundler_config: this.bundler_config
        });
        (async () => {
            try {
                const res_get_ready = await this.get_ready();
                this.raise('ready', res_get_ready);
            } catch (e) {
                console.error('HTTP_Webpage_Publisher error: Failed to get ready (bundling or preparation failed).');
                console.error(e);
                // Can't just ignore it if it means the server won't handle requests correctly, 
                // but at least it won't crash the whole process.
                // We might want to emit an error event.
                this.raise('error', e);
                // Also raise 'ready' so the pool/server can continue starting up other things
                this.raise('ready', {});
            }
        })();

    }

    async get_ready() {
        //await super.get_ready();

        const { static_routes_responses_webpage_bundle_preparer } = this;


        // Its a bundle....
        const webpage_or_website_res_get_ready = await super.get_ready();


        const render_webpage = async () => {

            const { webpage } = this;
            // Use ctrl (modern Webpage API) with fallback to content (legacy)
            const Ctrl = webpage.ctrl || webpage.content;

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
                // Control is not a document - wrap it in an Active_HTML_Document
                const Active_HTML_Document = require('../controls/Active_HTML_Document');

                const doc = new Active_HTML_Document({
                    context: static_page_context
                });

                // Add CSS link to head
                const ctrl_css_link = new jsgui_client.controls.link({
                    context: static_page_context
                });
                ctrl_css_link.dom.attributes.rel = 'stylesheet';
                ctrl_css_link.dom.attributes.href = '/css/css.css';
                doc.head.add(ctrl_css_link);

                // Add the control to body
                doc.body.add(ctrl);

                // Add JS script link to body
                const ctrl_js_script_link = new jsgui_client.controls.script({
                    context: static_page_context
                });
                ctrl_js_script_link.dom.attributes.src = '/js/js.js';
                doc.body.add(ctrl_js_script_link);

                doc.active();
                const html = await doc.all_html_render();
                return html;
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


    async handle_http(req, res) {
        const { webpage } = this;
        // Use ctrl (modern Webpage API) with fallback to content (legacy)
        const Ctrl = webpage.ctrl || webpage.content;

        if (typeof Ctrl !== 'function') {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Admin page control is not available');
            return;
        }

        try {
            const static_page_context = new Server_Static_Page_Context();

            const ctrl = new Ctrl({
                context: static_page_context
            });

            let html;

            if (ctrl.head && ctrl.body) {
                // Control is a full document (has head/body) — inject CSS/JS directly
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
                html = await ctrl.all_html_render();
            } else {
                // Control is not a document — wrap it in Active_HTML_Document
                const Active_HTML_Document = require('../controls/Active_HTML_Document');

                const doc = new Active_HTML_Document({
                    context: static_page_context
                });

                if (webpage.title) {
                    // Set the page title if available
                    const title = typeof webpage.get_title === 'function'
                        ? webpage.get_title() : webpage.title;
                    if (title && doc.head) {
                        const title_ctrl = new jsgui_client.controls.ctrl({
                            context: static_page_context,
                            'dom.tagName': 'title'
                        });
                        title_ctrl.dom.text = title;
                        doc.head.add(title_ctrl);
                    }
                }

                // Add CSS link to head
                const ctrl_css_link = new jsgui_client.controls.link({
                    context: static_page_context
                });
                ctrl_css_link.dom.attributes.rel = 'stylesheet';
                ctrl_css_link.dom.attributes.href = '/css/css.css';
                doc.head.add(ctrl_css_link);

                // Add the control to body
                doc.body.add(ctrl);

                // Add JS script link to body
                const ctrl_js_script_link = new jsgui_client.controls.script({
                    context: static_page_context
                });
                ctrl_js_script_link.dom.attributes.src = '/js/js.js';
                doc.body.add(ctrl_js_script_link);

                doc.active();
                html = await doc.all_html_render();
            }

            res.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8'
            });
            res.end(html);
        } catch (e) {
            console.error('[HTTP_Webpage_Publisher] handle_http render error:', e);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Internal Server Error: Failed to render page');
            }
        }
    }
}

module.exports = HTTP_Webpage_Publisher;