const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const { Data_Object } = jsgui;

const DEFAULT_ITEMS = Object.freeze([
    { id: 1, name: 'Ada Lovelace', role: 'Engineer', score: 95, joined: '2024-03-01' },
    { id: 2, name: 'Grace Hopper', role: 'Admiral', score: 98, joined: '2024-01-15' },
    { id: 3, name: 'Katherine Johnson', role: 'Analyst', score: 90, joined: '2024-02-20' },
    { id: 4, name: 'Margaret Hamilton', role: 'Lead', score: 92, joined: '2024-04-10' },
    { id: 5, name: 'Dorothy Vaughan', role: 'Supervisor', score: 88, joined: '2024-05-05' },
    { id: 6, name: 'Mary Jackson', role: 'Specialist', score: 85, joined: '2024-06-12' },
    { id: 7, name: 'Hedy Lamarr', role: 'Inventor', score: 91, joined: '2024-07-08' },
    { id: 8, name: 'Radia Perlman', role: 'Architect', score: 94, joined: '2024-08-17' },
    { id: 9, name: 'Frances Allen', role: 'Researcher', score: 89, joined: '2024-09-22' },
    { id: 10, name: 'Annie Easley', role: 'Mathematician', score: 87, joined: '2024-10-30' }
]);

class Data_Grid_Control extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'data_grid_control';
        super(spec);

        this.data.model = new Data_Object({
            search_text: '',
            sort_key: 'name',
            sort_dir: 'asc',
            page_index: 0,
            page_size: 4
        });
        this.data.model.set('items', spec.items || DEFAULT_ITEMS, true);

        this.view.data.model = new Data_Object({
            paged_items: [],
            result_count: 0,
            range_text: '',
            page_text: '',
            total_pages: 1
        });

        this.setup_watchers();
        this.recompute_view();

        if (!spec.el) {
            this.compose();
        }
    }

    format_score(score) {
        if (!Number.isFinite(score)) return '';
        return this.transforms.number.toFixed(score, 0);
    }

    format_joined(iso_date) {
        return this.transforms.date.format_iso_to_locale(iso_date, 'en-US');
    }

    get_items_array() {
        let raw_items = this.data.model && typeof this.data.model.get === 'function'
            ? this.data.model.get('items')
            : this.data.model.items;

        if (raw_items && raw_items.__data_value) {
            raw_items = raw_items.value;
        }

        if (raw_items && typeof raw_items.value === 'function') {
            raw_items = raw_items.value();
        }

        if (Array.isArray(raw_items)) {
            return raw_items.slice();
        }

        if (raw_items && typeof raw_items.toArray === 'function') {
            return raw_items.toArray().slice();
        }

        if (raw_items && Array.isArray(raw_items._arr)) {
            return raw_items._arr.slice();
        }

        return [];
    }

    recompute_view() {
        const items = this.get_items_array();
        const search_text = this.transforms.string.trim(this.data.model.search_text).toLowerCase();
        const sort_key = this.data.model.sort_key || 'name';
        const sort_dir = this.data.model.sort_dir === 'desc' ? 'desc' : 'asc';
        const page_size = Number.isFinite(this.data.model.page_size) ? this.data.model.page_size : 4;

        const filtered_items = search_text
            ? items.filter((item) => {
                const haystack = `${item.name || ''} ${item.role || ''}`.toLowerCase();
                return haystack.includes(search_text);
            })
            : items;

        const sorted_items = filtered_items.slice().sort((a_item, b_item) => {
            const a_value = a_item[sort_key];
            const b_value = b_item[sort_key];
            let comparison = 0;

            if (sort_key === 'score') {
                comparison = Number(a_value || 0) - Number(b_value || 0);
            } else if (sort_key === 'joined') {
                comparison = String(a_value || '').localeCompare(String(b_value || ''));
            } else {
                comparison = String(a_value || '').localeCompare(String(b_value || ''));
            }

            return sort_dir === 'asc' ? comparison : -comparison;
        });

        const total_pages = Math.max(1, Math.ceil(sorted_items.length / page_size));
        let page_index = Number.isFinite(this.data.model.page_index) ? this.data.model.page_index : 0;
        if (page_index > total_pages - 1) {
            page_index = total_pages - 1;
            this.data.model.page_index = page_index;
        }

        const start_index = page_index * page_size;
        const end_index = Math.min(start_index + page_size, sorted_items.length);
        const paged_items = sorted_items.slice(start_index, end_index);

        const range_text = sorted_items.length
            ? `Showing ${start_index + 1}-${end_index} of ${sorted_items.length}`
            : 'No results.';

        this.view.data.model.paged_items = paged_items;
        this.view.data.model.result_count = sorted_items.length;
        this.view.data.model.range_text = range_text;
        this.view.data.model.page_text = `Page ${page_index + 1} of ${total_pages}`;
        this.view.data.model.total_pages = total_pages;
    }

    setup_watchers() {
        const recompute = () => this.recompute_view();

        this.watch(this.data.model, 'items', () => recompute());
        this.watch(this.data.model, 'search_text', () => recompute());
        this.watch(this.data.model, 'sort_key', () => recompute());
        this.watch(this.data.model, 'sort_dir', () => recompute());
        this.watch(this.data.model, 'page_index', () => recompute());
        this.watch(this.data.model, 'page_size', () => recompute());
    }

    update_search_text(raw_value) {
        this.data.model.search_text = raw_value === null || raw_value === undefined
            ? ''
            : String(raw_value);
        this.data.model.page_index = 0;
    }

    set_sort(next_key) {
        if (this.data.model.sort_key === next_key) {
            this.data.model.sort_dir = this.data.model.sort_dir === 'asc' ? 'desc' : 'asc';
        } else {
            this.data.model.sort_key = next_key;
            this.data.model.sort_dir = 'asc';
        }
        this.data.model.page_index = 0;
    }

    set_page_index(next_index) {
        const total_pages = this.view.data.model.total_pages || 1;
        const clamped_index = Math.max(0, Math.min(total_pages - 1, next_index));
        this.data.model.page_index = clamped_index;
    }

    render_rows_control(table_body, paged_items) {
        table_body.clear();

        paged_items.forEach((item) => {
            const row = new jsgui.Control({
                context: this.context,
                tagName: 'tr',
                class: 'grid-row'
            });

            const name_cell = new jsgui.Control({
                context: this.context,
                tagName: 'td',
                content: item.name
            });
            name_cell.dom.attributes['data-col'] = 'name';

            const role_cell = new jsgui.Control({
                context: this.context,
                tagName: 'td',
                content: item.role
            });
            role_cell.dom.attributes['data-col'] = 'role';

            const score_cell = new jsgui.Control({
                context: this.context,
                tagName: 'td',
                content: this.format_score(item.score)
            });
            score_cell.dom.attributes['data-col'] = 'score';

            const joined_cell = new jsgui.Control({
                context: this.context,
                tagName: 'td',
                content: this.format_joined(item.joined)
            });
            joined_cell.dom.attributes['data-col'] = 'joined';

            row.add(name_cell);
            row.add(role_cell);
            row.add(score_cell);
            row.add(joined_cell);

            table_body.add(row);
        });
    }

    render_rows_dom(table_body_el, paged_items) {
        if (!table_body_el) return;
        table_body_el.innerHTML = '';

        paged_items.forEach((item) => {
            const row_el = document.createElement('tr');
            row_el.className = 'grid-row';

            const make_cell = (value, col_name) => {
                const cell_el = document.createElement('td');
                cell_el.setAttribute('data-col', col_name);
                cell_el.textContent = value || '';
                return cell_el;
            };

            row_el.appendChild(make_cell(item.name, 'name'));
            row_el.appendChild(make_cell(item.role, 'role'));
            row_el.appendChild(make_cell(this.format_score(item.score), 'score'));
            row_el.appendChild(make_cell(this.format_joined(item.joined), 'joined'));

            table_body_el.appendChild(row_el);
        });
    }

    activate() {
        if (this.__active) return;
        super.activate();

        if (this._dom_bound) return;
        const root_el = this.dom.el;
        if (!root_el) return;
        this._dom_bound = true;

        const search_input_el = root_el.querySelector('[data-test="search-input"]');
        const table_body_el = root_el.querySelector('[data-test="grid-body"]');
        const range_text_el = root_el.querySelector('[data-test="range-text"]');
        const page_text_el = root_el.querySelector('[data-test="page-text"]');
        const prev_button_el = root_el.querySelector('[data-test="prev-page"]');
        const next_button_el = root_el.querySelector('[data-test="next-page"]');
        const sort_name_el = root_el.querySelector('[data-test="sort-name"]');
        const sort_role_el = root_el.querySelector('[data-test="sort-role"]');
        const sort_score_el = root_el.querySelector('[data-test="sort-score"]');
        const sort_joined_el = root_el.querySelector('[data-test="sort-joined"]');

        const update_sort_labels = () => {
            const sort_key = this.data.model.sort_key || 'name';
            const sort_dir = this.data.model.sort_dir === 'desc' ? 'desc' : 'asc';

            const label_for = (key, label) => {
                if (sort_key !== key) return label;
                return `${label} (${sort_dir})`;
            };

            if (sort_name_el) sort_name_el.textContent = label_for('name', 'Name');
            if (sort_role_el) sort_role_el.textContent = label_for('role', 'Role');
            if (sort_score_el) sort_score_el.textContent = label_for('score', 'Score');
            if (sort_joined_el) sort_joined_el.textContent = label_for('joined', 'Joined');
        };

        const update_page_buttons = () => {
            const page_index = Number.isFinite(this.data.model.page_index) ? this.data.model.page_index : 0;
            const total_pages = this.view.data.model.total_pages || 1;
            const has_prev = page_index > 0;
            const has_next = page_index < total_pages - 1;

            if (prev_button_el) {
                prev_button_el.disabled = !has_prev;
                prev_button_el.classList.toggle('is-disabled', !has_prev);
            }

            if (next_button_el) {
                next_button_el.disabled = !has_next;
                next_button_el.classList.toggle('is-disabled', !has_next);
            }
        };

        if (search_input_el) {
            search_input_el.addEventListener('input', (event) => {
                const raw_value = event && event.target ? event.target.value : '';
                this.update_search_text(raw_value);
            });
        }

        if (prev_button_el) {
            prev_button_el.addEventListener('click', () => {
                this.set_page_index(this.data.model.page_index - 1);
            });
        }

        if (next_button_el) {
            next_button_el.addEventListener('click', () => {
                this.set_page_index(this.data.model.page_index + 1);
            });
        }

        if (sort_name_el) {
            sort_name_el.addEventListener('click', () => this.set_sort('name'));
        }

        if (sort_role_el) {
            sort_role_el.addEventListener('click', () => this.set_sort('role'));
        }

        if (sort_score_el) {
            sort_score_el.addEventListener('click', () => this.set_sort('score'));
        }

        if (sort_joined_el) {
            sort_joined_el.addEventListener('click', () => this.set_sort('joined'));
        }

        this.watch(
            this.data.model,
            'search_text',
            (search_text) => {
                if (search_input_el) {
                    search_input_el.value = search_text || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'paged_items',
            (paged_items) => {
                this.render_rows_dom(table_body_el, Array.isArray(paged_items) ? paged_items : []);
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'range_text',
            (range_text) => {
                if (range_text_el) {
                    range_text_el.textContent = range_text || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'page_text',
            (page_text) => {
                if (page_text_el) {
                    page_text_el.textContent = page_text || '';
                }
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'sort_key',
            () => update_sort_labels(),
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'sort_dir',
            () => update_sort_labels(),
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'page_index',
            () => update_page_buttons(),
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'total_pages',
            () => update_page_buttons(),
            { immediate: true }
        );
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;

        this.add_class('data-grid-control');
        this.dom.attributes['data-test'] = 'data-grid-control';

        const card = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'grid-card'
        });

        const header = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'grid-header'
        });

        const title = new jsgui.Control({
            context: page_context,
            tagName: 'h1',
            class: 'grid-title',
            content: 'Team Directory'
        });

        const search_wrap = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'grid-search'
        });

        const search_input = new jsgui.Control({
            context: page_context,
            tagName: 'input',
            class: 'grid-input'
        });
        search_input.dom.attributes.type = 'search';
        search_input.dom.attributes.placeholder = 'Search by name or role';
        search_input.dom.attributes['data-test'] = 'search-input';

        search_wrap.add(search_input);
        header.add(title);
        header.add(search_wrap);

        const meta = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'grid-meta'
        });

        const range_text = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'grid-range',
            content: this.view.data.model.range_text
        });
        range_text.dom.attributes['data-test'] = 'range-text';

        const page_text = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'grid-page',
            content: this.view.data.model.page_text
        });
        page_text.dom.attributes['data-test'] = 'page-text';

        meta.add(range_text);
        meta.add(page_text);

        const table = new jsgui.Control({
            context: page_context,
            tagName: 'table',
            class: 'grid-table'
        });

        const table_head = new jsgui.Control({
            context: page_context,
            tagName: 'thead'
        });

        const header_row = new jsgui.Control({
            context: page_context,
            tagName: 'tr'
        });

        const make_sort_button = (label_text, test_id) => {
            const button = new jsgui.Control({
                context: page_context,
                tagName: 'button',
                class: 'grid-sort',
                content: label_text
            });
            button.dom.attributes['data-test'] = test_id;
            return button;
        };

        const name_header = new jsgui.Control({
            context: page_context,
            tagName: 'th'
        });
        const role_header = new jsgui.Control({
            context: page_context,
            tagName: 'th'
        });
        const score_header = new jsgui.Control({
            context: page_context,
            tagName: 'th'
        });
        const joined_header = new jsgui.Control({
            context: page_context,
            tagName: 'th'
        });

        const label_for = (key, label) => {
            if (this.data.model.sort_key !== key) return label;
            return `${label} (${this.data.model.sort_dir})`;
        };

        name_header.add(make_sort_button(label_for('name', 'Name'), 'sort-name'));
        role_header.add(make_sort_button(label_for('role', 'Role'), 'sort-role'));
        score_header.add(make_sort_button(label_for('score', 'Score'), 'sort-score'));
        joined_header.add(make_sort_button(label_for('joined', 'Joined'), 'sort-joined'));

        header_row.add(name_header);
        header_row.add(role_header);
        header_row.add(score_header);
        header_row.add(joined_header);
        table_head.add(header_row);

        const table_body = new jsgui.Control({
            context: page_context,
            tagName: 'tbody'
        });
        table_body.dom.attributes['data-test'] = 'grid-body';

        this.render_rows_control(table_body, this.view.data.model.paged_items);

        table.add(table_head);
        table.add(table_body);

        const footer = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'grid-footer'
        });

        const prev_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'grid-button',
            content: 'Prev'
        });
        prev_button.dom.attributes['data-test'] = 'prev-page';

        const next_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'grid-button',
            content: 'Next'
        });
        next_button.dom.attributes['data-test'] = 'next-page';

        footer.add(prev_button);
        footer.add(next_button);

        card.add(header);
        card.add(meta);
        card.add(table);
        card.add(footer);

        this.add(card);
    }
}

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'data_grid_demo_ui';
        super(spec);

        if (!spec.el) {
            this.compose();
        }
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;
        this.body.add_class('data-grid-demo');

        const grid_control = new Data_Grid_Control({
            context: page_context,
            items: DEFAULT_ITEMS
        });

        this.body.add(grid_control);
    }
}

Demo_UI.css = `
* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family: "Garamond", "Georgia", serif;
    background: linear-gradient(140deg, #f7efe3 0%, #eef4fb 55%, #dde4f2 100%);
    color: #1d2430;
}

.data-grid-demo {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 36px;
}

.data-grid-control {
    width: 100%;
    max-width: 820px;
}

.grid-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 30px 34px;
    border: 1px solid #e3d6c5;
    box-shadow: 0 30px 60px rgba(19, 26, 38, 0.18);
    display: grid;
    gap: 18px;
}

.grid-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

.grid-title {
    margin: 0;
    font-size: 26px;
}

.grid-search {
    min-width: 220px;
}

.grid-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 999px;
    border: 1px solid #c7ccd8;
    font-size: 14px;
}

.grid-meta {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #4a5568;
}

.grid-table {
    width: 100%;
    border-collapse: collapse;
}

.grid-table th,
.grid-table td {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 1px solid #e5e9f2;
    font-size: 14px;
}

.grid-table th {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6a5f53;
}

.grid-sort {
    background: none;
    border: none;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6a5f53;
    cursor: pointer;
    padding: 0;
}

.grid-row:hover {
    background: #f8fafc;
}

.grid-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.grid-button {
    padding: 8px 16px;
    border-radius: 999px;
    border: 1px solid #c7ccd8;
    background: #f4f6fb;
    cursor: pointer;
    font-size: 13px;
}

.grid-button.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (max-width: 720px) {
    .grid-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .grid-meta {
        flex-direction: column;
        gap: 6px;
    }
}
`;

jsgui.controls.Data_Grid_Control = Data_Grid_Control;
jsgui.controls.Demo_UI = Demo_UI;
jsgui.controls.data_grid_demo_ui = Demo_UI;

module.exports = jsgui;
