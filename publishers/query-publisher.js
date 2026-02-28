/**
 * Query_Publisher — a Function_Publisher pre-configured for the
 * standard data-view query protocol.
 *
 * Wraps a query function (typically from a Query_Resource) into an
 * HTTP endpoint that:
 * - accepts JSON params: { page, page_size, sort, filters }
 * - returns JSON:        { rows, total_count, page, page_size }
 * - handles errors uniformly
 *
 * @example
 *   const Query_Publisher = require('jsgui3-server/publishers/query-publisher');
 *
 *   // With a raw function:
 *   const pub = new Query_Publisher({
 *       name: 'users',
 *       query_fn: async (params) => {
 *           const rows = await db.all('SELECT ...');
 *           return { rows, total_count: 100 };
 *       }
 *   });
 *
 *   // With a Query_Resource (preferred):
 *   const pub2 = Query_Publisher.from_resource(my_query_resource);
 */

const Function_Publisher = require('./http-function-publisher');

class Query_Publisher extends Function_Publisher {
    /**
     * @param {Object}   spec
     * @param {string}   spec.name              - Endpoint name (used in route).
     * @param {Function} spec.query_fn          - async (params) => {rows, total_count}
     * @param {Object}   [spec.schema]          - Column definitions for introspection.
     * @param {number}   [spec.default_page_size=25]
     * @param {number}   [spec.max_page_size=1000]
     */
    constructor(spec = {}) {
        const query_fn = spec.query_fn;
        if (typeof query_fn !== 'function') {
            throw new Error('Query_Publisher requires a query_fn(params) function.');
        }

        const default_page_size = spec.default_page_size || 25;
        const max_page_size = spec.max_page_size || 1000;

        // Wrap the query_fn in a handler that normalizes input/output.
        const handler_fn = async (input) => {
            const params = input || {};

            // Normalize params
            const page = Math.max(1, Math.floor(Number(params.page) || 1));
            const raw_page_size = Number(params.page_size);
            const page_size = Number.isFinite(raw_page_size) && raw_page_size > 0
                ? Math.min(Math.floor(raw_page_size), max_page_size)
                : default_page_size;

            let sort = null;
            if (params.sort && typeof params.sort === 'object' && params.sort.key) {
                sort = {
                    key: String(params.sort.key),
                    dir: String(params.sort.dir || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc'
                };
            }

            let filters = null;
            if (params.filters && typeof params.filters === 'object') {
                filters = params.filters;
            }

            const normalized = { page, page_size, sort, filters };
            const result = await query_fn(normalized);

            return {
                rows: Array.isArray(result.rows) ? result.rows : [],
                total_count: Number.isFinite(result.total_count) ? result.total_count : 0,
                page,
                page_size
            };
        };

        super({
            fn: handler_fn,
            name: spec.name,
            schema: spec.schema || {}
        });

        this.type = 'query';
        this.query_schema = spec.schema || {};
        this.default_page_size = default_page_size;
        this.max_page_size = max_page_size;
    }

    /**
     * Create a Query_Publisher from a Query_Resource instance.
     *
     * @param {Query_Resource} resource - A Query_Resource with a query() method.
     * @param {Object} [options]        - Additional options (name override, schema override).
     * @returns {Query_Publisher}
     */
    static from_resource(resource, options = {}) {
        if (!resource || typeof resource.query !== 'function') {
            throw new Error('from_resource requires a resource with a query() method.');
        }

        return new Query_Publisher({
            name: options.name || resource.name,
            query_fn: (params) => resource.query(params),
            schema: options.schema || resource.schema,
            default_page_size: options.default_page_size || resource.default_page_size,
            max_page_size: options.max_page_size
        });
    }
}

module.exports = Query_Publisher;
