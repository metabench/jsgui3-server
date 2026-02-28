const jsgui = require('jsgui3-html');

const HTTP_Publisher = require('./http-publisher');

const {
    Evented_Class, tf
} = jsgui;

const {
    observable
} = require('fnl');

// Publishing could use a lower level HTTP_Handling.



// May need a lot more work for flexibility and auth
//  Maybe can use middleware.

// Websocket: the server should have some kind of websocket request amalgamator or router.
//  Only one wesocket connection should be open between each client and server.
//  May be worth leaving for the moment.

// Websocket would be below the level of the publishers.
//  Need a unified ws api, but data available separately.
//  It would be a single comm channel unlike multiple HTTP requests.

// Use some more general, lower level HTTP?



/**
 * Function_Publisher — publishes a JavaScript function as an HTTP API endpoint.
 *
 * Wraps a plain function (sync or async) so it can be called over HTTP.
 * Incoming JSON request bodies are parsed and passed as the function's
 * first argument.  Return values are JSON-serialised back to the client.
 *
 * ## Metadata for OpenAPI / Swagger
 *
 * When constructed via `server.publish()`, a `meta` object may be
 * attached to the spec.  The publisher stores this as `this.api_meta`
 * and the OpenAPI generator reads it to produce Swagger documentation.
 *
 * Supported `meta` / shorthand fields:
 *
 * | Field          | Type     | Purpose                                  |
 * |----------------|----------|------------------------------------------|
 * | `method`       | string   | HTTP method (`'GET'`, `'POST'`, etc.)    |
 * | `summary`      | string   | One-line summary for Swagger UI          |
 * | `description`  | string   | Multi-line Markdown description          |
 * | `tags`         | string[] | Grouping tags in the Swagger UI          |
 * | `params`       | Object   | Request body schema (simple format)      |
 * | `returns`      | Object   | Response body schema (simple format)     |
 * | `deprecated`   | boolean  | Mark endpoint as deprecated              |
 * | `operationId`  | string   | Custom OpenAPI operation ID              |
 *
 * @extends HTTP_Publisher
 * @see {@link module:openapi} for the spec generator that reads `api_meta`.
 */
class Function_Publisher extends HTTP_Publisher {
    /**
     * Create a new Function_Publisher.
     *
     * @param {Function|Object} spec - Either a bare function or an options object.
     * @param {Function}  spec.fn          - The function to publish.
     * @param {string}    [spec.name]      - Endpoint name (used in route).
     * @param {Object}    [spec.schema]    - Schema for introspection.
     * @param {Object}    [spec.meta]      - API metadata for OpenAPI generation.
     * @param {string}    [spec.summary]   - Shorthand for `meta.summary`.
     * @param {string}    [spec.description] - Shorthand for `meta.description`.
     * @param {string[]}  [spec.tags]      - Shorthand for `meta.tags`.
     * @param {Object}    [spec.params]    - Shorthand for `meta.params`.
     * @param {Object}    [spec.returns]   - Shorthand for `meta.returns`.
     * @param {string}    [spec.method]    - Shorthand for `meta.method`.
     */
    constructor(spec) {
        super(spec);
        //let fn = this.fn = spec;
        // attach a spec to the function?
        // including a schema or params list for the fn?
        let fn;
        if (typeof spec === 'function') {
            fn = spec;
        } else {
            fn = spec.fn;
            this.name = spec.name;
            if (spec.schema) {
                this.schema = spec.schema;
            } else {
                this.schema = {};
            }

            // ── Extended API metadata for OpenAPI / Swagger generation ──
            //
            // Metadata can be supplied in two ways:
            //   1. Nested under `spec.meta` (from server.publish())
            //   2. As top-level shorthand fields on the spec itself
            //
            // Both are merged into `this.api_meta`, with `spec.meta`
            // taking precedence over shorthand fields.
            //
            // The OpenAPI generator (openapi.js) reads `this.api_meta`
            // to produce requestBody, responses, tags, summary, etc.
            this.api_meta = {};
            if (spec.meta && typeof spec.meta === 'object') {
                this.api_meta = { ...spec.meta };
            }
            // Merge top-level shorthand fields (lower precedence).
            if (spec.summary) this.api_meta.summary = this.api_meta.summary || spec.summary;
            if (spec.description) this.api_meta.description = this.api_meta.description || spec.description;
            if (spec.tags) this.api_meta.tags = this.api_meta.tags || spec.tags;
            if (spec.params) this.api_meta.params = this.api_meta.params || spec.params;
            if (spec.returns) this.api_meta.returns = this.api_meta.returns || spec.returns;
            if (spec.method) this.api_meta.method = this.api_meta.method || spec.method;
        }
        this.type = 'function';
        //let fn = spec;
        //console.log('Function_Publisher constructor fn', fn);
        //console.log('Function_Publisher constructor fn', fn.toString());
        // But will need to route to the function publisher.

        this.handle_http = (req, res) => {
            const { method, headers } = req;

            // ── Parse query string from the URL ──
            let query_params = {};
            try {
                const parsed_url = new URL(req.url, `http://${headers.host || 'localhost'}`);
                query_params = Object.fromEntries(parsed_url.searchParams.entries());
            } catch (e) {
                // Fallback: no query params if URL parsing fails.
            }

            const content_type = headers['content-type'];

            const chunks = [];

            req.on('data', data => {
                chunks.push(data);
            });

            req.on('end', () => {
                const buf_input = Buffer.concat(chunks);

                // ── Parse request body ──
                let body_input = null;
                if (buf_input.length > 0) {
                    if (!content_type) {
                        // No content-type but has body — try JSON parse.
                        try {
                            body_input = JSON.parse(buf_input.toString());
                        } catch (e) {
                            body_input = buf_input.toString();
                        }
                    } else if (content_type.startsWith('text/plain')) {
                        body_input = buf_input.toString();
                    } else if (content_type === 'application/json' || content_type.startsWith('application/json')) {
                        const inputStr = buf_input.toString();
                        if (inputStr.trim() !== '') {
                            body_input = JSON.parse(inputStr);
                        }
                    } else {
                        // Unknown content type — try JSON, fall back to string.
                        try {
                            body_input = JSON.parse(buf_input.toString());
                        } catch (e) {
                            body_input = buf_input.toString();
                        }
                    }
                }

                // ── Merge inputs: path params < query params < body ──
                // Priority (highest wins): body > query > path params
                const path_params = (req.params && typeof req.params === 'object') ? req.params : {};
                const has_query = Object.keys(query_params).length > 0;
                const has_path = Object.keys(path_params).length > 0;
                const has_body = body_input !== null && body_input !== undefined;

                let merged_input;
                if (has_body && typeof body_input === 'object' && !Array.isArray(body_input)) {
                    // Body is an object — merge with path + query params.
                    merged_input = { ...path_params, ...query_params, ...body_input };
                } else if (has_body) {
                    // Body is a string or array — use as-is if no path/query params.
                    if (has_path || has_query) {
                        merged_input = { ...path_params, ...query_params, _body: body_input };
                    } else {
                        merged_input = body_input;
                    }
                } else if (has_query || has_path) {
                    // No body — use path + query params as input.
                    merged_input = { ...path_params, ...query_params };
                } else {
                    // Nothing at all.
                    merged_input = undefined;
                }

                const output_all = (call_res) => {
                    const tcr = tf(call_res);
                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    res.end(JSON.stringify(call_res));
                }

                try {
                    const fn_res = fn(merged_input);
                    const tfr = tf(fn_res);

                    if (tfr === 'p') {
                        // promise
                        fn_res.then(call_res => {
                            output_all(call_res);
                        }, err => {
                            console.error('Function execution error:', err);
                            if (!res.headersSent) {
                                res.writeHead(500, {
                                    'Content-Type': 'application/json'
                                });
                                res.end(JSON.stringify({ error: err.message }));
                            }
                        });
                    } else if (tfr === 's') {
                        res.writeHead(200, {
                            'Content-Type': 'text/plain;charset=UTF-8'
                        });
                        res.end(fn_res);
                    } else if (tfr === 'o' || tfr === 'a') {
                        res.writeHead(200, {
                            'Content-Type': 'application/json'
                        });
                        res.end(JSON.stringify(fn_res));
                    } else if (tfr === 'u' || tfr === 'n') {
                        // undefined or null return — send empty 200
                        res.writeHead(200, {
                            'Content-Type': 'application/json'
                        });
                        res.end('null');
                    } else {
                        console.log('tfr', tfr);
                        console.trace();
                        throw 'NYI';
                    }
                } catch (err) {
                    console.error('Function execution error:', err);
                    if (!res.headersSent) {
                        res.writeHead(500, {
                            'Content-Type': 'application/json'
                        });
                        res.end(JSON.stringify({ error: err.message }));
                    }
                }
            });




            /*
        
            
        
            
            */



            /*
            let obs2_handler = data => {
                //console.log('data', data);
                let s_data = JSON.stringify(data);
                //res.write(s_data + '\n');
                res.write('event: message\ndata:' + s_data + '\n\n');
            }
            obs2.on('next', obs2_handler);
            */
        }
        if (spec.schema) this.schema = spec.schema;
    }
}

module.exports = Function_Publisher;