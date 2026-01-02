const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const { Data_Object } = jsgui;

const CARD_CONFIGS = Object.freeze([
    {
        key: 'select',
        title: 'Selectable Card',
        description: 'Click to toggle selection state.',
        mixins: ['selectable']
    },
    {
        key: 'drag',
        title: 'Dragable Card',
        description: 'Drag within the canvas to explore movement.',
        mixins: ['dragable', 'selectable']
    },
    {
        key: 'resize',
        title: 'Resizable Card',
        description: 'Resize from the corner handle.',
        mixins: ['resizable', 'selectable']
    }
]);

class Mixins_Demo_Control extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'mixins_demo_control';
        super(spec);

        this.card_controls = [];

        this.data.model = new Data_Object({
            selected_index: 0
        });

        this.view.data.model = new Data_Object({
            selected_title: '',
            selected_mixins_text: '',
            selected_hint: ''
        });

        this.setup_watchers();
        this.update_selected_summary();

        if (!spec.el) {
            this.compose();
        }
    }

    setup_watchers() {
        this.watch(this.data.model, 'selected_index', () => this.update_selected_summary());
    }

    get_card_config(index) {
        return CARD_CONFIGS[index] || CARD_CONFIGS[0];
    }

    set_selected_index(next_index) {
        const max_index = Math.max(0, CARD_CONFIGS.length - 1);
        const clamped_index = Math.max(0, Math.min(max_index, next_index));
        this.data.model.selected_index = clamped_index;
        this.apply_selection_to_cards();
    }

    update_selected_summary() {
        const selected_index = Number(this.data.model.selected_index) || 0;
        const selected_config = this.get_card_config(selected_index);
        const mixin_text = selected_config.mixins.join(', ');

        this.view.data.model.selected_title = selected_config.title;
        this.view.data.model.selected_mixins_text = `Mixins: ${mixin_text}`;
        this.view.data.model.selected_hint = selected_config.description;
    }

    apply_mixins_to_card(card_control, config) {
        if (card_control._mixins_applied) return;
        card_control._mixins_applied = true;

        jsgui.mx.selectable(card_control);
        card_control.selectable = true;

        if (config.mixins.includes('dragable')) {
            jsgui.mx.dragable(card_control, { mode: 'translate' });
        }

        if (config.mixins.includes('resizable')) {
            jsgui.mx.resizable(card_control);
        }
    }

    apply_selection_to_cards() {
        const selected_index = Number(this.data.model.selected_index) || 0;
        const root_el = this.dom && this.dom.el ? this.dom.el : null;
        this.card_controls.forEach((card_control, index) => {
            const is_selected = index === selected_index;
            if (card_control.selected !== is_selected) {
                card_control.selected = is_selected;
            }
            if (is_selected) {
                card_control.add_class('selected');
            } else {
                card_control.remove_class('selected');
            }
        });
        if (root_el) {
            const card_els = Array.from(root_el.querySelectorAll('[data-index]'));
            card_els.forEach((card_el) => {
                const index_value = Number(card_el.getAttribute('data-index')) || 0;
                card_el.classList.toggle('selected', index_value === selected_index);
            });
        }
    }

    activate() {
        if (this.__active) return;
        super.activate();

        if (this._dom_bound) return;
        const root_el = this.dom.el;
        if (!root_el) return;
        this._dom_bound = true;

        const selected_title_el = root_el.querySelector('[data-test="selected-title"]');
        const selected_mixins_el = root_el.querySelector('[data-test="selected-mixins"]');
        const selected_hint_el = root_el.querySelector('[data-test="selected-hint"]');

        root_el.addEventListener('click', (event) => {
            let target = event.target;
            while (target && target !== root_el) {
                const index_value = target.getAttribute('data-index');
                if (index_value !== null) {
                    this.set_selected_index(Number(index_value));
                    break;
                }
                target = target.parentElement;
            }
        });

        this.card_controls.forEach((card_control, index) => {
            const config = this.get_card_config(index);
            this.apply_mixins_to_card(card_control, config);
            card_control.on('change', (event) => {
                if (event.name === 'selected' && event.value) {
                    this.set_selected_index(index);
                }
            });
        });

        this.apply_selection_to_cards();

        this.watch(
            this.view.data.model,
            'selected_title',
            (selected_title) => {
                if (selected_title_el) selected_title_el.textContent = selected_title || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'selected_mixins_text',
            (selected_mixins_text) => {
                if (selected_mixins_el) selected_mixins_el.textContent = selected_mixins_text || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'selected_hint',
            (selected_hint) => {
                if (selected_hint_el) selected_hint_el.textContent = selected_hint || '';
            },
            { immediate: true }
        );
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;

        this.add_class('mixins-demo-control');
        this.dom.attributes['data-test'] = 'mixins-demo-control';

        const header = new jsgui.Control({
            context: page_context,
            tagName: 'header',
            class: 'mixins-header'
        });

        header.add(new jsgui.Control({
            context: page_context,
            tagName: 'h1',
            class: 'mixins-title',
            content: 'Mixins Playground'
        }));
        header.add(new jsgui.Control({
            context: page_context,
            tagName: 'p',
            class: 'mixins-subtitle',
            content: 'Selectable, dragable, and resizable behaviors layered onto cards.'
        }));

        const layout = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'mixins-layout'
        });

        const canvas = new jsgui.Control({
            context: page_context,
            tagName: 'section',
            class: 'mixins-canvas'
        });

        const card_grid = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'mixins-grid'
        });

        CARD_CONFIGS.forEach((config, index) => {
            const card = new jsgui.Control({
                context: page_context,
                tagName: 'div',
                class: 'mixins-card'
            });
            card.dom.attributes['data-index'] = String(index);
            card.dom.attributes['data-test'] = `mixins-card-${config.key}`;

            card.add(new jsgui.Control({
                context: page_context,
                tagName: 'div',
                class: 'card-title',
                content: config.title
            }));
            card.add(new jsgui.Control({
                context: page_context,
                tagName: 'div',
                class: 'card-body',
                content: config.description
            }));

            this.card_controls.push(card);
            card_grid.add(card);
        });

        canvas.add(card_grid);

        const inspector = new jsgui.Control({
            context: page_context,
            tagName: 'aside',
            class: 'mixins-inspector'
        });

        inspector.add(new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'inspector-label',
            content: 'Active card'
        }));

        const selected_title = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'inspector-title',
            content: this.view.data.model.selected_title
        });
        selected_title.dom.attributes['data-test'] = 'selected-title';

        const selected_mixins = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'inspector-mixins',
            content: this.view.data.model.selected_mixins_text
        });
        selected_mixins.dom.attributes['data-test'] = 'selected-mixins';

        const selected_hint = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'inspector-hint',
            content: this.view.data.model.selected_hint
        });
        selected_hint.dom.attributes['data-test'] = 'selected-hint';

        inspector.add(selected_title);
        inspector.add(selected_mixins);
        inspector.add(selected_hint);

        layout.add(canvas);
        layout.add(inspector);

        this.add(header);
        this.add(layout);
    }
}

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'mixins_demo_ui';
        super(spec);

        if (!spec.el) {
            this.compose();
        }
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;
        this.body.add_class('mixins-demo');

        const mixins_control = new Mixins_Demo_Control({
            context: page_context
        });

        this.body.add(mixins_control);
    }
}

Demo_UI.css = `
:root {
    --mx-ink: #141316;
    --mx-muted: #616168;
    --mx-accent: #4b7b63;
    --mx-panel: #ffffff;
    --mx-border: #dfe2d8;
    --mx-bg: #f3f5ee;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    background: linear-gradient(160deg, #eef3ec 0%, #f4efe7 55%, #eee7dc 100%);
    color: var(--mx-ink);
    font-family: "Cabinet Grotesk", "Segoe UI", sans-serif;
}

.mixins-demo {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
}

.mixins-demo-control {
    width: min(1000px, 100%);
    background: var(--mx-panel);
    border-radius: 26px;
    padding: 32px 36px 40px;
    border: 1px solid var(--mx-border);
    box-shadow: 0 28px 70px rgba(26, 24, 18, 0.16);
}

.mixins-header {
    margin-bottom: 20px;
}

.mixins-title {
    margin: 0 0 8px;
    font-size: 30px;
}

.mixins-subtitle {
    margin: 0;
    color: var(--mx-muted);
    font-size: 15px;
}

.mixins-layout {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr;
    gap: 20px;
}

.mixins-canvas {
    background: #fdfcf8;
    border-radius: 18px;
    border: 1px solid #e3e6dc;
    padding: 18px 20px;
    min-height: 260px;
}

.mixins-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
}

.mixins-card {
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #e0e2d8;
    padding: 14px 16px;
    min-height: 120px;
    position: relative;
    cursor: pointer;
}

.mixins-card.selected {
    border-color: var(--mx-accent);
    box-shadow: 0 12px 22px rgba(75, 123, 99, 0.2);
}

.card-title {
    font-weight: 600;
    margin-bottom: 6px;
}

.card-body {
    font-size: 13px;
    color: var(--mx-muted);
}

.mixins-inspector {
    background: #fdfcf8;
    border-radius: 18px;
    border: 1px solid #e3e6dc;
    padding: 18px 20px;
    display: grid;
    gap: 12px;
}

.inspector-label {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 12px;
    color: var(--mx-muted);
}

.inspector-title {
    font-size: 18px;
    font-weight: 600;
}

.inspector-mixins {
    font-size: 13px;
    color: var(--mx-accent);
}

.inspector-hint {
    font-size: 13px;
    color: var(--mx-muted);
}

@media (max-width: 900px) {
    .mixins-layout {
        grid-template-columns: 1fr;
    }
}
`;

jsgui.controls.Mixins_Demo_Control = Mixins_Demo_Control;
jsgui.controls.Demo_UI = Demo_UI;
jsgui.controls.mixins_demo_ui = Demo_UI;

module.exports = jsgui;
