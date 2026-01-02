const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const { Data_Object } = jsgui;
const { apply_theme_overrides } = require('jsgui3-html/control_mixins/theme');

const THEME_OPTIONS = Object.freeze({
    copper: {
        label: 'Copper Studio',
        tokens: {
            bg: '#fdf6ec',
            surface: '#ffffff',
            accent: '#d05f3b',
            ink: '#2a2018',
            muted: '#6f5b4b'
        }
    },
    tide: {
        label: 'Tide Atlas',
        tokens: {
            bg: '#eef4f7',
            surface: '#ffffff',
            accent: '#2b6cb0',
            ink: '#10253b',
            muted: '#5c6b7a'
        }
    }
});

class Theming_Control extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'theming_control';
        super(spec);

        this.data.model = new Data_Object({
            theme_name: 'copper'
        });

        this.view.data.model = new Data_Object({
            theme_label: '',
            accent_value: '',
            surface_value: '',
            bg_value: '',
            ink_value: '',
            muted_value: ''
        });

        this.apply_theme_from_name(this.data.model.theme_name);

        if (!spec.el) {
            this.compose();
        }
    }

    apply_theme_from_name(theme_name, options = {}) {
        const next_theme = THEME_OPTIONS[theme_name] || THEME_OPTIONS.copper;
        const tokens = next_theme.tokens || {};

        apply_theme_overrides(this, tokens);

        if (options.dom_el) {
            const dom_el = options.dom_el;
            Object.keys(tokens).forEach((token_name) => {
                dom_el.style.setProperty(`--theme-${token_name}`, tokens[token_name]);
            });
            dom_el.setAttribute('data-theme', theme_name);
        }

        this.view.data.model.theme_label = next_theme.label;
        this.view.data.model.accent_value = tokens.accent || '';
        this.view.data.model.surface_value = tokens.surface || '';
        this.view.data.model.bg_value = tokens.bg || '';
        this.view.data.model.ink_value = tokens.ink || '';
        this.view.data.model.muted_value = tokens.muted || '';
    }

    update_theme_buttons(button_map, active_theme) {
        Object.keys(button_map).forEach((theme_key) => {
            const button_el = button_map[theme_key];
            if (!button_el) return;
            const is_active = theme_key === active_theme;
            button_el.classList.toggle('is-active', is_active);
            button_el.setAttribute('aria-pressed', is_active ? 'true' : 'false');
        });
    }

    activate() {
        if (this.__active) return;
        super.activate();

        if (this._dom_bound) return;
        const root_el = this.dom.el;
        if (!root_el) return;
        this._dom_bound = true;

        const theme_label_el = root_el.querySelector('[data-test="theme-name"]');
        const accent_el = root_el.querySelector('[data-test="token-accent"]');
        const surface_el = root_el.querySelector('[data-test="token-surface"]');
        const bg_el = root_el.querySelector('[data-test="token-bg"]');
        const ink_el = root_el.querySelector('[data-test="token-ink"]');
        const muted_el = root_el.querySelector('[data-test="token-muted"]');

        const button_map = {
            copper: root_el.querySelector('[data-test="theme-copper"]'),
            tide: root_el.querySelector('[data-test="theme-tide"]')
        };

        Object.keys(button_map).forEach((theme_key) => {
            const button_el = button_map[theme_key];
            if (!button_el) return;
            button_el.addEventListener('click', () => {
                this.data.model.theme_name = theme_key;
            });
        });

        this.watch(
            this.data.model,
            'theme_name',
            (theme_name) => {
                this.apply_theme_from_name(theme_name, { dom_el: root_el });
                this.update_theme_buttons(button_map, theme_name);
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'theme_label',
            (theme_label) => {
                if (theme_label_el) theme_label_el.textContent = theme_label || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'accent_value',
            (accent_value) => {
                if (accent_el) accent_el.textContent = accent_value || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'surface_value',
            (surface_value) => {
                if (surface_el) surface_el.textContent = surface_value || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'bg_value',
            (bg_value) => {
                if (bg_el) bg_el.textContent = bg_value || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'ink_value',
            (ink_value) => {
                if (ink_el) ink_el.textContent = ink_value || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'muted_value',
            (muted_value) => {
                if (muted_el) muted_el.textContent = muted_value || '';
            },
            { immediate: true }
        );
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;

        this.add_class('theming-control');
        this.dom.attributes['data-test'] = 'theming-control';
        this.dom.attributes['data-theme'] = this.data.model.theme_name;

        const header = new jsgui.Control({
            context: page_context,
            tagName: 'header',
            class: 'theme-header'
        });

        header.add(new jsgui.Control({
            context: page_context,
            tagName: 'h1',
            class: 'theme-title',
            content: 'Theme Tokens'
        }));
        header.add(new jsgui.Control({
            context: page_context,
            tagName: 'p',
            class: 'theme-subtitle',
            content: 'Switch token sets and watch the UI update.'
        }));

        const button_row = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'theme-buttons'
        });

        const copper_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'theme-button',
            content: 'Copper'
        });
        copper_button.dom.attributes['data-test'] = 'theme-copper';

        const tide_button = new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'theme-button',
            content: 'Tide'
        });
        tide_button.dom.attributes['data-test'] = 'theme-tide';

        button_row.add(copper_button);
        button_row.add(tide_button);

        const layout = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'theme-layout'
        });

        const token_panel = new jsgui.Control({
            context: page_context,
            tagName: 'section',
            class: 'theme-panel'
        });

        const label = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'theme-label',
            content: this.view.data.model.theme_label
        });
        label.dom.attributes['data-test'] = 'theme-name';

        const token_list = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'theme-token-list'
        });

        const make_token_row = (label_text, test_id, value) => {
            const row = new jsgui.Control({
                context: page_context,
                tagName: 'div',
                class: 'theme-token'
            });
            row.add(new jsgui.Control({
                context: page_context,
                tagName: 'span',
                class: 'token-label',
                content: label_text
            }));
            const value_span = new jsgui.Control({
                context: page_context,
                tagName: 'span',
                class: 'token-value',
                content: value
            });
            value_span.dom.attributes['data-test'] = test_id;
            row.add(value_span);
            return row;
        };

        token_list.add(make_token_row('Accent', 'token-accent', this.view.data.model.accent_value));
        token_list.add(make_token_row('Surface', 'token-surface', this.view.data.model.surface_value));
        token_list.add(make_token_row('Background', 'token-bg', this.view.data.model.bg_value));
        token_list.add(make_token_row('Ink', 'token-ink', this.view.data.model.ink_value));
        token_list.add(make_token_row('Muted', 'token-muted', this.view.data.model.muted_value));

        token_panel.add(label);
        token_panel.add(token_list);

        const preview_panel = new jsgui.Control({
            context: page_context,
            tagName: 'section',
            class: 'theme-panel theme-preview'
        });

        const preview_card = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'preview-card'
        });
        preview_card.dom.attributes['data-test'] = 'preview-card';

        preview_card.add(new jsgui.Control({
            context: page_context,
            tagName: 'h2',
            class: 'preview-title',
            content: 'Preview Card'
        }));
        preview_card.add(new jsgui.Control({
            context: page_context,
            tagName: 'p',
            class: 'preview-body',
            content: 'Tokens drive the colors, borders, and emphasis styles.'
        }));
        preview_card.add(new jsgui.Control({
            context: page_context,
            tagName: 'button',
            class: 'preview-action',
            content: 'Primary action'
        }));

        preview_panel.add(preview_card);

        layout.add(token_panel);
        layout.add(preview_panel);

        this.add(header);
        this.add(button_row);
        this.add(layout);
    }
}

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'theming_demo_ui';
        super(spec);

        if (!spec.el) {
            this.compose();
        }
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;
        this.body.add_class('theming-demo');

        const theme_control = new Theming_Control({
            context: page_context
        });

        this.body.add(theme_control);
    }
}

Demo_UI.css = `
:root {
    --theme-bg: #fdf6ec;
    --theme-surface: #ffffff;
    --theme-accent: #d05f3b;
    --theme-ink: #2a2018;
    --theme-muted: #6f5b4b;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    background: var(--theme-bg);
    color: var(--theme-ink);
    font-family: "Sora", "Trebuchet MS", sans-serif;
}

.theming-demo {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 42px 24px;
}

.theming-control {
    width: min(980px, 100%);
    background: var(--theme-surface);
    border-radius: 24px;
    padding: 32px 36px 40px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 26px 60px rgba(30, 30, 40, 0.15);
}

.theme-header {
    margin-bottom: 18px;
}

.theme-title {
    margin: 0 0 8px;
    font-size: 30px;
}

.theme-subtitle {
    margin: 0;
    color: var(--theme-muted);
    font-size: 15px;
}

.theme-buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 18px;
}

.theme-button {
    border: 1px solid rgba(0, 0, 0, 0.15);
    background: transparent;
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 13px;
    cursor: pointer;
}

.theme-button.is-active {
    background: var(--theme-accent);
    border-color: var(--theme-accent);
    color: #ffffff;
}

.theme-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

.theme-panel {
    background: #fbfaf7;
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    padding: 18px 20px;
}

.theme-label {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
}

.theme-token-list {
    display: grid;
    gap: 10px;
}

.theme-token {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--theme-muted);
}

.token-label {
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.token-value {
    font-weight: 600;
    color: var(--theme-ink);
}

.theme-preview {
    background: linear-gradient(140deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6));
}

.preview-card {
    background: var(--theme-bg);
    border-radius: 16px;
    padding: 20px;
    border: 1px solid rgba(0, 0, 0, 0.06);
}

.preview-title {
    margin: 0 0 8px;
    font-size: 20px;
}

.preview-body {
    margin: 0 0 16px;
    color: var(--theme-muted);
    font-size: 14px;
}

.preview-action {
    background: var(--theme-accent);
    border: none;
    color: #ffffff;
    padding: 10px 16px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 13px;
}

@media (max-width: 900px) {
    .theme-layout {
        grid-template-columns: 1fr;
    }
}
`;

jsgui.controls.Theming_Control = Theming_Control;
jsgui.controls.Demo_UI = Demo_UI;
jsgui.controls.theming_demo_ui = Demo_UI;

module.exports = jsgui;
