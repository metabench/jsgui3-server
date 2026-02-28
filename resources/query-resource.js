/**
 * Query_Resource — a Resource subclass that holds a data adapter
 * and exposes a standard query(params) method.
 *
 * Pluggable adapters let you swap the backing store (in-memory array,
 * SQL database, REST API, etc.) while keeping a uniform interface.
 *
 * @example
 *   const Query_Resource = require('jsgui3-server/resources/query-resource');
 *   const Array_Adapter  = require('jsgui3-server/resources/adapters/array-adapter');
 *
 *   const resource = new Query_Resource({
 *       name: 'products',
 *       adapter: new Array_Adapter({ data: products }),
 *       schema: {
 *           columns: [
 *               { key: 'name',  label: 'Name',  sortable: true, filterable: true },
 *               { key: 'price', label: 'Price', sortable: true }
 *           ],
 *           default_page_size: 25
 *       }
 *   });
 */

const { Resource } = require('jsgui3-html');

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 1000;

class Query_Resource extends Resource {
    /**
     * @param {Object}  spec
     * @param {string}  spec.name              - Resource name (visible in admin-ui / resource pool).
     * @param {Object}  spec.adapter           - Data adapter with a `query(params)` method.
     * @param {Object}  [spec.schema]          - Column definitions, default_page_size, etc.
     */
    constructor(spec = {}) {
        super(spec);
        if (!spec.adapter || typeof spec.adapter.query !== 'function') {
            throw new Error('Query_Resource requires an adapter with a query(params) method.');
        }
        this.adapter = spec.adapter;
        this.schema = spec.schema || {};
        this.default_page_size = (this.schema && this.schema.default_page_size) || DEFAULT_PAGE_SIZE;
    }

    /**
     * Start the resource (and the adapter if it supports it).
     */
    start(callback) {
        if (this.adapter && typeof this.adapter.start === 'function') {
            const result = this.adapter.start();
            if (result && typeof result.then === 'function') {
                return result.then(
                    () => { if (typeof callback === 'function') callback(null, true); },
                    (err) => { if (typeof callback === 'function') callback(err); else throw err; }
                );
            }
        }
        if (typeof callback === 'function') callback(null, true);
        return Promise.resolve(true);
    }

    /**
     * Stop the resource (and the adapter if it supports it).
     */
    stop(callback) {
        if (this.adapter && typeof this.adapter.stop === 'function') {
            const result = this.adapter.stop();
            if (result && typeof result.then === 'function') {
                return result.then(
                    () => { if (typeof callback === 'function') callback(null, true); },
                    (err) => { if (typeof callback === 'function') callback(err); else throw err; }
                );
            }
        }
        if (typeof callback === 'function') callback(null, true);
        return Promise.resolve(true);
    }

    /**
     * Normalize and validate query params, then delegate to the adapter.
     *
     * @param {Object} params - Raw query params from the client.
     * @returns {Promise<{rows: Array, total_count: number, page: number, page_size: number}>}
     */
    async query(params = {}) {
        const normalized = this._normalize_params(params);
        const result = await this.adapter.query(normalized);

        // Ensure the response has the standard shape.
        return {
            rows: Array.isArray(result.rows) ? result.rows : [],
            total_count: Number.isFinite(result.total_count) ? result.total_count : 0,
            page: normalized.page,
            page_size: normalized.page_size
        };
    }

    /**
     * Normalize raw params into a clean query spec.
     * @private
     */
    _normalize_params(params = {}) {
        const page = Math.max(1, Math.floor(Number(params.page) || 1));
        const raw_page_size = Number(params.page_size);
        const page_size = Number.isFinite(raw_page_size) && raw_page_size > 0
            ? Math.min(Math.floor(raw_page_size), MAX_PAGE_SIZE)
            : this.default_page_size;

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

        return { page, page_size, sort, filters };
    }
}

Query_Resource.DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;
Query_Resource.MAX_PAGE_SIZE = MAX_PAGE_SIZE;

module.exports = Query_Resource;
