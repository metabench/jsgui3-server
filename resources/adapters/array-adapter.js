/**
 * Array_Adapter — in-memory data adapter for Query_Resource.
 *
 * Applies sort, filter, and pagination to a plain JS array.
 * Useful for prototyping, small datasets, and tests.
 *
 * @example
 *   const adapter = new Array_Adapter({ data: my_array });
 *   const result = await adapter.query({
 *       page: 1,
 *       page_size: 25,
 *       sort: { key: 'name', dir: 'asc' },
 *       filters: { name: { op: 'contains', value: 'alice' } }
 *   });
 *   // => { rows: [...], total_count: 142 }
 */

const FILTER_OPS = {
    contains(cell, value) {
        return String(cell).toLowerCase().includes(String(value).toLowerCase());
    },
    equals(cell, value) {
        // eslint-disable-next-line eqeqeq
        return cell == value;
    },
    strict_equals(cell, value) {
        return cell === value;
    },
    gt(cell, value) {
        return Number(cell) > Number(value);
    },
    gte(cell, value) {
        return Number(cell) >= Number(value);
    },
    lt(cell, value) {
        return Number(cell) < Number(value);
    },
    lte(cell, value) {
        return Number(cell) <= Number(value);
    },
    not_equals(cell, value) {
        // eslint-disable-next-line eqeqeq
        return cell != value;
    }
};

class Array_Adapter {
    /**
     * @param {Object} spec
     * @param {Array}  spec.data - The source array (kept by reference).
     */
    constructor(spec = {}) {
        this.data = spec.data || [];
    }

    /**
     * Replace the underlying data.
     * @param {Array} data
     */
    set_data(data) {
        this.data = data || [];
    }

    /**
     * Query the data with sort, filter, and pagination.
     *
     * @param {Object}       params
     * @param {number}       [params.page=1]
     * @param {number}       [params.page_size=25]
     * @param {Object|null}  [params.sort]         - { key: string, dir: 'asc'|'desc' }
     * @param {Object|null}  [params.filters]      - { column_key: { op: string, value: * }, ... }
     * @returns {Promise<{rows: Array, total_count: number}>}
     */
    async query(params = {}) {
        let rows = this.data.slice();

        // ── Filter ──────────────────────────────────────────────
        if (params.filters && typeof params.filters === 'object') {
            const filter_entries = Object.entries(params.filters);
            for (const [key, filter_spec] of filter_entries) {
                if (!filter_spec) continue;

                let op_name, filter_value;
                if (typeof filter_spec === 'object' && filter_spec.op) {
                    op_name = filter_spec.op;
                    filter_value = filter_spec.value;
                } else {
                    // Shorthand: { name: 'alice' } implies contains
                    op_name = 'contains';
                    filter_value = filter_spec;
                }

                const op_fn = FILTER_OPS[op_name];
                if (!op_fn) continue;

                rows = rows.filter(row => {
                    const cell = row[key];
                    return op_fn(cell, filter_value);
                });
            }
        }

        const total_count = rows.length;

        // ── Sort ────────────────────────────────────────────────
        if (params.sort && params.sort.key) {
            const sort_key = params.sort.key;
            const dir = String(params.sort.dir || 'asc').toLowerCase() === 'desc' ? -1 : 1;

            rows.sort((a, b) => {
                const av = a[sort_key];
                const bv = b[sort_key];

                if (av === bv) return 0;
                if (av === null || av === undefined) return 1;
                if (bv === null || bv === undefined) return -1;

                if (typeof av === 'number' && typeof bv === 'number') {
                    return (av - bv) * dir;
                }

                return String(av).localeCompare(String(bv)) * dir;
            });
        }

        // ── Paginate ────────────────────────────────────────────
        const page_size = Math.max(1, Number(params.page_size) || 25);
        const page = Math.max(1, Number(params.page) || 1);
        const start = (page - 1) * page_size;
        const paged_rows = rows.slice(start, start + page_size);

        return {
            rows: paged_rows,
            total_count,
            page,
            page_size
        };
    }
}

Array_Adapter.FILTER_OPS = FILTER_OPS;

module.exports = Array_Adapter;
