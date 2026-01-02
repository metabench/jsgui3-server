const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const { Data_Object } = jsgui;

const DEFAULT_ITEMS = Object.freeze([
    {
        id: 'md-1',
        name: 'Aurora Vale',
        role: 'Navigator',
        summary: 'Routes the field team through launch windows.',
        focus: 'Focus: Launch plan'
    },
    {
        id: 'md-2',
        name: 'Beacon Lee',
        role: 'Analyst',
        summary: 'Breaks down the signal into clear priorities.',
        focus: 'Focus: Risk review'
    },
    {
        id: 'md-3',
        name: 'Cascade Rowe',
        role: 'Builder',
        summary: 'Turns notes into resilient systems.',
        focus: 'Focus: Build queue'
    },
    {
        id: 'md-4',
        name: 'Delta Hart',
        role: 'Coordinator',
        summary: 'Keeps the release moving with steady cadence.',
        focus: 'Focus: Milestone prep'
    }
]);

class Master_Detail_Control extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'master_detail_control';
        super(spec);

        this.data.model = new Data_Object({
            selected_index: 0
        });
        this.data.model.set('items', spec.items || DEFAULT_ITEMS, true);

        this.view.data.model = new Data_Object({
            detail_title: '',
            detail_role: '',
            detail_summary: '',
            detail_focus: '',
            nav_text: '',
            has_prev: false,
            has_next: false
        });

        this.setup_watchers();
        this.recompute_view();

        if (!spec.el) {
            this.compose();
        }
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

    setup_watchers() {
        const recompute = () => this.recompute_view();
        this.watch(this.data.model, 'selected_index', () => recompute());
        this.watch(this.data.model, 'items', () => recompute());
    }

    set_selected_index(next_index) {
        const items = this.get_items_array();
        const max_index = Math.max(0, items.length - 1);
        const clamped_index = Math.max(0, Math.min(max_index, next_index));
        this.data.model.selected_index = clamped_index;
    }

    recompute_view() {
        const items = this.get_items_array();
        let selected_index = Number(this.data.model.selected_index) || 0;

        if (items.length === 0) {
            this.view.data.model.detail_title = 'No selection';
            this.view.data.model.detail_role = 'Role: -';
            this.view.data.model.detail_summary = 'No detail available.';
            this.view.data.model.detail_focus = 'Focus: -';
            this.view.data.model.nav_text = 'No items';
            this.view.data.model.has_prev = false;
            this.view.data.model.has_next = false;
            return;
        }

        if (selected_index < 0) {
            selected_index = 0;
            this.data.model.selected_index = 0;
        }
        if (selected_index > items.length - 1) {
            selected_index = items.length - 1;
            this.data.model.selected_index = selected_index;
        }

        const selected_item = items[selected_index];

        this.view.data.model.detail_title = selected_item ? selected_item.name : 'No selection';
        this.view.data.model.detail_role = selected_item ? `Role: ${selected_item.role}` : 'Role: -';
        this.view.data.model.detail_summary = selected_item ? selected_item.summary : 'No detail available.';
        this.view.data.model.detail_focus = selected_item ? selected_item.focus : 'Focus: -';
        this.view.data.model.nav_text = `Item ${selected_index + 1} of ${items.length}`;
        this.view.data.model.has_prev = selected_index > 0;
        this.view.data.model.has_next = selected_index < items.length - 1;
    }

    update_list_selection(list_container, selected_index) {
        if (!list_container) return;
        const list_items = Array.from(list_container.querySelectorAll('[data-index]'));
        list_items.forEach((item_el) => {
            const item_index = Number(item_el.getAttribute('data-index')) || 0;
            const is_active = item_index === selected_index;
            item_el.classList.toggle('is-active', is_active);
            item_el.setAttribute('aria-selected', is_active ? 'true' : 'false');
        });
    }

    update_nav_buttons(prev_button_el, next_button_el, has_prev, has_next) {
        if (prev_button_el) {
            prev_button_el.disabled = !has_prev;
            prev_button_el.classList.toggle('is-disabled', !has_prev);
        }
        if (next_button_el) {
            next_button_el.disabled = !has_next;
            next_button_el.classList.toggle('is-disabled', !has_next);
        }
    }

    activate() {
        if (this.__active) return;
        super.activate();

        if (this._dom_bound) return;
        const root_el = this.dom.el;
        if (!root_el) return;
        this._dom_bound = true;

        const list_container = root_el.querySelector('[data-test="master-list"]');
        const detail_title_el = root_el.querySelector('[data-test="detail-title"]');
        const detail_role_el = root_el.querySelector('[data-test="detail-role"]');
        const detail_summary_el = root_el.querySelector('[data-test="detail-summary"]');
        const detail_focus_el = root_el.querySelector('[data-test="detail-focus"]');
        const nav_text_el = root_el.querySelector('[data-test="nav-text"]');
        const prev_button_el = root_el.querySelector('[data-test="prev-button"]');
        const next_button_el = root_el.querySelector('[data-test="next-button"]');

        if (list_container) {
            list_container.addEventListener('click', (event) => {
                let target = event.target;
                while (target && target !== list_container) {
                    const index_value = target.getAttribute('data-index');
                    if (index_value !== null) {
                        this.set_selected_index(Number(index_value));
                        break;
                    }
                    target = target.parentElement;
                }
            });
        }

        if (prev_button_el) {
            prev_button_el.addEventListener('click', () => {
                this.set_selected_index(this.data.model.selected_index - 1);
            });
        }

        if (next_button_el) {
            next_button_el.addEventListener('click', () => {
                this.set_selected_index(this.data.model.selected_index + 1);
            });
        }

        this.watch(
            this.view.data.model,
            'detail_title',
            (detail_title) => {
                if (detail_title_el) detail_title_el.textContent = detail_title || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'detail_role',
            (detail_role) => {
                if (detail_role_el) detail_role_el.textContent = detail_role || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'detail_summary',
            (detail_summary) => {
                if (detail_summary_el) detail_summary_el.textContent = detail_summary || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'detail_focus',
            (detail_focus) => {
                if (detail_focus_el) detail_focus_el.textContent = detail_focus || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'nav_text',
            (nav_text) => {
                if (nav_text_el) nav_text_el.textContent = nav_text || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            ['has_prev', 'has_next'],
            () => {
                this.update_nav_buttons(
                    prev_button_el,
                    next_button_el,
                    !!this.view.data.model.has_prev,
                    !!this.view.data.model.has_next
                );
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'selected_index',
            (selected_index) => {
                this.update_list_selection(list_container, Number(selected_index) || 0);
            },
            { immediate: true }
        );
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;
        const items = this.get_items_array();
        const selected_index = Number(this.data.model.selected_index) || 0;

        this.add_class('master-detail-control');
        this.dom.attributes['data-test'] = 'master-detail-control';

        const header = new jsgui.Control({
            context: page_context,
            tagName: 'header',
            class: 'md-header'
        });

        header.add(new jsgui.Control({
            context: page_context,
            tagName: 'h1',
            class: 'md-title',
            content: 'Crew Assignments'
        }));
        header.add(new jsgui.Control({
            context: page_context,
            tagName: 'p',
            class: 'md-subtitle',
            content: 'Select a profile to see the detail panel update.'
        }));

        const layout = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'md-layout'
        });

        const list_panel = new jsgui.Control({
            context: page_context,
            tagName: 'section',
            class: 'md-panel md-list-panel'
        });

        const list_title = new jsgui.Control({
            context: page_context,
            tagName: 'h2',
            class: 'md-panel-title',
            content: 'Roster'
        });

        const list = new jsgui.Control({
            context: page_context,
            tagName: 'ul',
            class: 'md-list'
        });
        list.dom.attributes['data-test'] = 'master-list';

        items.forEach((item, index) => {
            const list_item = new jsgui.Control({
                context: page_context,
                tagName: 'li',
                class: 'md-item'
            });
            if (index === selected_index) {
                list_item.add_class('is-active');
            }
            list_item.dom.attributes['data-index'] = String(index);
            list_item.dom.attributes['data-test'] = `master-item-${index}`;
            list_item.dom.attributes.role = 'option';
            list_item.dom.attributes['aria-selected'] = index === selected_index ? 'true' : 'false';

            list_item.add(new jsgui.Control({
                context: page_context,
                tagName: 'div',
                class: 'md-item-name',
                content: item.name
            }));
            list_item.add(new jsgui.Control({
                context: page_context,
                tagName: 'div',
                class: 'md-item-role',
                content: item.role
            }));

            list.add(list_item);
        });

        list_panel.add(list_title);
        list_panel.add(list);

        const detail_panel = new jsgui.Control({
            context: page_context,
            tagName: 'section',
            class: 'md-panel md-detail-panel'
        });

        const detail_title = new jsgui.Control({
            context: page_context,
            tagName: 'h2',
            class: 'md-detail-title',
            content: this.view.data.model.detail_title
        });
        detail_title.dom.attributes['data-test'] = 'detail-title';

        const detail_role = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'md-detail-role',
            content: this.view.data.model.detail_role
        });
        detail_role.dom.attributes['data-test'] = 'detail-role';

        const detail_summary = new jsgui.Control({
            context: page_context,
            tagName: 'p',
            class: 'md-detail-summary',
            content: this.view.data.model.detail_summary
        });
        detail_summary.dom.attributes['data-test'] = 'detail-summary';

        const detail_focus = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'md-detail-focus',
            content: this.view.data.model.detail_focus
        });
        detail_focus.dom.attributes['data-test'] = 'detail-focus';

        const nav_bar = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'md-nav'
        });

        const nav_text = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'md-nav-text',
            content: this.view.data.model.nav_text
        });
        nav_text.dom.attributes['data-test'] = 'nav-text';

        const nav_buttons = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'md-nav-buttons'
        });

        const prev_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'md-button',
            content: 'Prev'
        });
        prev_button.dom.attributes['data-test'] = 'prev-button';

        const next_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'md-button',
            content: 'Next'
        });
        next_button.dom.attributes['data-test'] = 'next-button';

        nav_buttons.add(prev_button);
        nav_buttons.add(next_button);

        nav_bar.add(nav_text);
        nav_bar.add(nav_buttons);

        detail_panel.add(detail_title);
        detail_panel.add(detail_role);
        detail_panel.add(detail_summary);
        detail_panel.add(detail_focus);
        detail_panel.add(nav_bar);

        layout.add(list_panel);
        layout.add(detail_panel);

        this.add(header);
        this.add(layout);
    }
}

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'master_detail_demo_ui';
        super(spec);

        if (!spec.el) {
            this.compose();
        }
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;
        this.body.add_class('master-detail-demo');

        const master_detail = new Master_Detail_Control({
            context: page_context,
            items: DEFAULT_ITEMS
        });

        this.body.add(master_detail);
    }
}

Demo_UI.css = `
:root {
    --md-ink: #1c1b1f;
    --md-muted: #6d6670;
    --md-accent: #cf6d4f;
    --md-panel: #ffffff;
    --md-border: #e2d6cb;
    --md-bg: #f4ede6;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    background: radial-gradient(circle at top, #f8f2ec 0%, #efe4d7 55%, #e5d9cf 100%);
    color: var(--md-ink);
    font-family: "Fraunces", "Georgia", serif;
}

.master-detail-demo {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
}

.master-detail-control {
    width: min(980px, 100%);
    background: var(--md-panel);
    border-radius: 22px;
    padding: 32px 36px 40px;
    border: 1px solid var(--md-border);
    box-shadow: 0 26px 60px rgba(29, 25, 20, 0.18);
}

.md-header {
    margin-bottom: 22px;
}

.md-title {
    margin: 0 0 8px;
    font-size: 30px;
}

.md-subtitle {
    margin: 0;
    color: var(--md-muted);
    font-size: 15px;
}

.md-layout {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 20px;
}

.md-panel {
    background: #fdfaf6;
    border: 1px solid #efe2d7;
    border-radius: 16px;
    padding: 18px 20px;
}

.md-panel-title {
    margin: 0 0 12px;
    font-size: 16px;
}

.md-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
}

.md-item {
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid transparent;
    cursor: pointer;
    background: #fff9f2;
}

.md-item.is-active {
    border-color: var(--md-accent);
    box-shadow: 0 10px 18px rgba(207, 109, 79, 0.2);
}

.md-item-name {
    font-weight: 600;
    font-size: 15px;
}

.md-item-role {
    font-size: 12px;
    color: var(--md-muted);
}

.md-detail-title {
    margin: 0 0 6px;
    font-size: 22px;
}

.md-detail-role {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--md-muted);
}

.md-detail-summary {
    margin: 14px 0;
    font-size: 14px;
}

.md-detail-focus {
    font-size: 13px;
    color: var(--md-accent);
}

.md-nav {
    margin-top: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.md-nav-text {
    font-size: 12px;
    color: var(--md-muted);
}

.md-nav-buttons {
    display: flex;
    gap: 10px;
}

.md-button {
    border: 1px solid #d9c8bc;
    background: #f7efe6;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 12px;
    cursor: pointer;
    font-family: "Assistant", "Arial", sans-serif;
}

.md-button.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@media (max-width: 880px) {
    .md-layout {
        grid-template-columns: 1fr;
    }
}
`;

jsgui.controls.Master_Detail_Control = Master_Detail_Control;
jsgui.controls.Demo_UI = Demo_UI;
jsgui.controls.master_detail_demo_ui = Demo_UI;

module.exports = jsgui;
