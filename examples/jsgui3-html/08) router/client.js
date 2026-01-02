const jsgui = require('jsgui3-client');
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const { Data_Object } = jsgui;

const ROUTE_MAP = Object.freeze({
    overview: {
        title: 'Overview',
        body: 'Start here to see route switching in action.',
        hint: 'Hash route: #overview'
    },
    metrics: {
        title: 'Metrics',
        body: 'Track momentum, throughput, and focus signals.',
        hint: 'Hash route: #metrics'
    },
    settings: {
        title: 'Settings',
        body: 'Tune controls and preferences for the workspace.',
        hint: 'Hash route: #settings'
    }
});

class Router_Control extends jsgui.Control {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'router_control';
        super(spec);

        this.data.model = new Data_Object({
            route_name: 'overview'
        });

        this.view.data.model = new Data_Object({
            route_title: '',
            route_body: '',
            route_hint: ''
        });

        this.setup_watchers();
        this.update_view_for_route(this.data.model.route_name);

        if (!spec.el) {
            this.compose();
        }
    }

    setup_watchers() {
        this.watch(
            this.data.model,
            'route_name',
            (route_name) => {
                this.update_view_for_route(route_name);
            }
        );
    }

    get_route_config(route_name) {
        return ROUTE_MAP[route_name] || ROUTE_MAP.overview;
    }

    set_route(route_name, options = {}) {
        const target_route = ROUTE_MAP[route_name] ? route_name : 'overview';
        this.data.model.route_name = target_route;

        if (options.update_hash && typeof window !== 'undefined') {
            window.location.hash = target_route;
        }
    }

    update_view_for_route(route_name) {
        const route_config = this.get_route_config(route_name);
        this.view.data.model.route_title = route_config.title;
        this.view.data.model.route_body = route_config.body;
        this.view.data.model.route_hint = route_config.hint;
    }

    update_nav_active(nav_buttons, active_route) {
        nav_buttons.forEach((button_el) => {
            const button_route = button_el.getAttribute('data-route');
            const is_active = button_route === active_route;
            button_el.classList.toggle('is-active', is_active);
            button_el.setAttribute('aria-current', is_active ? 'page' : 'false');
        });
    }

    activate() {
        if (this.__active) return;
        super.activate();

        if (this._dom_bound) return;
        const root_el = this.dom.el;
        if (!root_el) return;
        this._dom_bound = true;

        const title_el = root_el.querySelector('[data-test="route-title"]');
        const body_el = root_el.querySelector('[data-test="route-body"]');
        const hint_el = root_el.querySelector('[data-test="route-hint"]');
        const nav_buttons = Array.from(root_el.querySelectorAll('[data-route]'));

        nav_buttons.forEach((button_el) => {
            button_el.addEventListener('click', (event) => {
                event.preventDefault();
                const route_name = button_el.getAttribute('data-route');
                this.set_route(route_name, { update_hash: true });
            });
        });

        if (typeof window !== 'undefined') {
            const apply_hash_route = () => {
                const raw_hash = window.location.hash || '';
                const route_name = raw_hash.replace('#', '').trim();
                if (ROUTE_MAP[route_name]) {
                    this.set_route(route_name, { update_hash: false });
                }
            };
            apply_hash_route();
            window.addEventListener('hashchange', apply_hash_route);
        }

        this.watch(
            this.view.data.model,
            'route_title',
            (route_title) => {
                if (title_el) title_el.textContent = route_title || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'route_body',
            (route_body) => {
                if (body_el) body_el.textContent = route_body || '';
            },
            { immediate: true }
        );

        this.watch(
            this.view.data.model,
            'route_hint',
            (route_hint) => {
                if (hint_el) hint_el.textContent = route_hint || '';
            },
            { immediate: true }
        );

        this.watch(
            this.data.model,
            'route_name',
            (route_name) => {
                this.update_nav_active(nav_buttons, route_name);
            },
            { immediate: true }
        );
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;

        this.add_class('router-control');
        this.dom.attributes['data-test'] = 'router-control';

        const header = new jsgui.Control({
            context: page_context,
            tagName: 'header',
            class: 'router-header'
        });

        header.add(new jsgui.Control({
            context: page_context,
            tagName: 'h1',
            class: 'router-title',
            content: 'Route Switcher'
        }));
        header.add(new jsgui.Control({
            context: page_context,
            tagName: 'p',
            class: 'router-subtitle',
            content: 'Navigate between routes and sync with the hash.'
        }));

        const nav = new jsgui.Control({
            context: page_context,
            tagName: 'nav',
            class: 'router-nav'
        });

        const make_nav_button = (label_text, route_name) => {
            const button = new jsgui.Control({
                context: page_context,
                tagName: 'a',
                class: 'router-link',
                content: label_text
            });
            button.dom.attributes.href = `#${route_name}`;
            button.dom.attributes['data-route'] = route_name;
            button.dom.attributes['data-test'] = `nav-${route_name}`;
            return button;
        };

        nav.add(make_nav_button('Overview', 'overview'));
        nav.add(make_nav_button('Metrics', 'metrics'));
        nav.add(make_nav_button('Settings', 'settings'));

        const route_panel = new jsgui.Control({
            context: page_context,
            tagName: 'section',
            class: 'router-panel'
        });

        const route_title = new jsgui.Control({
            context: page_context,
            tagName: 'h2',
            class: 'route-title',
            content: this.view.data.model.route_title
        });
        route_title.dom.attributes['data-test'] = 'route-title';

        const route_body = new jsgui.Control({
            context: page_context,
            tagName: 'p',
            class: 'route-body',
            content: this.view.data.model.route_body
        });
        route_body.dom.attributes['data-test'] = 'route-body';

        const route_hint = new jsgui.Control({
            context: page_context,
            tagName: 'div',
            class: 'route-hint',
            content: this.view.data.model.route_hint
        });
        route_hint.dom.attributes['data-test'] = 'route-hint';

        route_panel.add(route_title);
        route_panel.add(route_body);
        route_panel.add(route_hint);

        this.add(header);
        this.add(nav);
        this.add(route_panel);
    }
}

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'router_demo_ui';
        super(spec);

        if (!spec.el) {
            this.compose();
        }
    }

    compose() {
        // Framework expects the method name `compose`.
        const page_context = this.context;
        this.body.add_class('router-demo');

        const router_control = new Router_Control({
            context: page_context
        });

        this.body.add(router_control);
    }
}

Demo_UI.css = `
:root {
    --rt-ink: #16161d;
    --rt-muted: #5b5966;
    --rt-accent: #41749b;
    --rt-panel: #ffffff;
    --rt-border: #d7d9e2;
    --rt-bg: #eef1f6;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    background: linear-gradient(140deg, #e9eef5 0%, #f2f4f8 50%, #ece8df 100%);
    color: var(--rt-ink);
    font-family: "Manrope", "Arial", sans-serif;
}

.router-demo {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px;
}

.router-control {
    width: min(860px, 100%);
    background: var(--rt-panel);
    border-radius: 24px;
    padding: 32px 36px 40px;
    border: 1px solid var(--rt-border);
    box-shadow: 0 24px 60px rgba(20, 23, 35, 0.16);
}

.router-header {
    margin-bottom: 18px;
}

.router-title {
    margin: 0 0 8px;
    font-size: 30px;
}

.router-subtitle {
    margin: 0;
    color: var(--rt-muted);
    font-size: 15px;
}

.router-nav {
    display: flex;
    gap: 12px;
    margin: 20px 0;
    flex-wrap: wrap;
}

.router-link {
    text-decoration: none;
    color: var(--rt-ink);
    border: 1px solid #d2d6e0;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 13px;
}

.router-link.is-active {
    background: var(--rt-accent);
    border-color: var(--rt-accent);
    color: #ffffff;
}

.router-panel {
    background: #fdfcf9;
    border-radius: 16px;
    padding: 20px 22px;
    border: 1px solid #e4e6ee;
}

.route-title {
    margin: 0 0 8px;
    font-size: 22px;
}

.route-body {
    margin: 0 0 14px;
    font-size: 14px;
    color: var(--rt-muted);
}

.route-hint {
    font-size: 12px;
    color: var(--rt-accent);
}
`;

jsgui.controls.Router_Control = Router_Control;
jsgui.controls.Demo_UI = Demo_UI;
jsgui.controls.router_demo_ui = Demo_UI;

module.exports = jsgui;
