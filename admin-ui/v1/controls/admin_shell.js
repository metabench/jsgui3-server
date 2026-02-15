'use strict';

const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;
const Active_HTML_Document = require('../../../controls/Active_HTML_Document');
const Group_Box = require('./group_box');
const Stat_Card = require('./stat_card');

/**
 * Admin_Shell — root page control for the Admin UI v1 dashboard.
 *
 * Server-side: composes a toolbar, sidebar, and content area with
 * placeholder stat cards. Client-side: fetches /api/admin/v1/status
 * and opens an SSE connection to /api/admin/v1/events for live
 * heartbeat updates.
 *
 * Book reference: Chapter 6 — Implementation Patterns (Admin Shell)
 * Layers: B (View Composition) + D (Concrete Render)
 */
class Admin_Shell extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'admin_shell';
        super(spec);
        const { context } = this;

        this._nav_items = [];
        this._tab_items = [];
        this._section_labels = Object.create(null);
        this._custom_nav_items = [];
        this._custom_nav_separator = null;
        this._custom_sections_list = [];
        this._client_bootstrapped = false;

        if (typeof this.body.add_class === 'function') {
            this.body.add_class('admin-shell');
        }

        const compose = () => {
            // ─── Sidebar ─────────────────────────────────────
            const sidebar = new controls.div({ context, 'class': 'as-sidebar' });
            this.body.add(sidebar);
            this._sidebar = sidebar;

            const brand = new controls.div({ context, 'class': 'as-brand' });
            const brand_icon = new controls.span({ context, 'class': 'as-brand-icon' });
            brand_icon.add('\u2699\uFE0F');
            brand.add(brand_icon);
            const brand_text = new controls.span({ context, 'class': 'as-brand-text' });
            brand_text.add('jsgui3 Admin');
            brand.add(brand_text);
            sidebar.add(brand);

            const nav = new controls.div({ context, 'class': 'as-nav' });
            sidebar.add(nav);
            this._nav = nav;

            this._add_nav_item(nav, 'Dashboard', 'dashboard', true);
            this._add_nav_item(nav, 'Resources', 'resources');
            this._add_nav_item(nav, 'Routes', 'routes');
            this._add_nav_item(nav, 'Settings', 'settings');

            // Server version label at bottom
            const footer = new controls.div({ context, 'class': 'as-sidebar-footer' });
            const version_label = new controls.span({ context, 'class': 'as-version' });
            version_label.add('jsgui3-server');
            footer.add(version_label);
            sidebar.add(footer);

            // ─── Main Area ───────────────────────────────────
            const main = new controls.div({ context, 'class': 'as-main' });
            this.body.add(main);

            // Toolbar
            const toolbar = new controls.div({ context, 'class': 'as-toolbar' });
            main.add(toolbar);

            // Hamburger button (hidden on desktop, visible on tablet/phone)
            const hamburger = new controls.button({ context, 'class': 'as-hamburger' });
            hamburger.dom.attributes.type = 'button';
            hamburger.dom.attributes['aria-label'] = 'Toggle navigation';
            hamburger.add('\u2630');
            toolbar.add(hamburger);
            this._hamburger = hamburger;

            const page_title = new controls.h2({ context, 'class': 'as-page-title' });
            page_title.add('Dashboard');
            toolbar.add(page_title);
            this._page_title = page_title;

            // Status indicator
            const status_dot = new controls.span({ context, 'class': 'as-status-dot online' });
            status_dot.add('\u25CF');
            toolbar.add(status_dot);
            this._status_dot = status_dot;

            // Sidebar overlay backdrop (for tablet/phone)
            const overlay = new controls.div({ context, 'class': 'as-sidebar-overlay' });
            this.body.add(overlay);
            this._overlay = overlay;

            // Content area
            const content = new controls.div({ context, 'class': 'as-content' });
            main.add(content);
            this._content = content;

            // Dashboard section (SSR + initial view)
            const dashboard_section = new controls.div({ context, 'class': 'as-section as-section-dashboard' });
            content.add(dashboard_section);
            this._dashboard_section = dashboard_section;

            // Dynamic section (Resources / Routes / Settings)
            const dynamic_section = new controls.div({ context, 'class': 'as-section as-section-dynamic hidden' });
            content.add(dynamic_section);
            this._dynamic_section = dynamic_section;

            // ─── Dashboard Cards ─────────────────────────────
            this._compose_dashboard(dashboard_section);

            // ─── Status Bar ──────────────────────────────────
            const status_bar = new controls.div({ context, 'class': 'as-statusbar' });
            main.add(status_bar);
            const status_text = new controls.span({ context, 'class': 'as-statusbar-text' });
            status_text.add('Connecting...');
            status_bar.add(status_text);
            this._status_text = status_text;

            this._active_section = 'dashboard';

            // ─── Bottom Tab Bar (phone navigation) ──────────
            const bottom_bar = new controls.div({ context, 'class': 'as-bottom-bar' });
            this.body.add(bottom_bar);

            const tab_items = [
                { label: '\u2302', section: 'dashboard', text: 'Home' },
                { label: '\u25A6', section: 'resources', text: 'Resources' },
                { label: '\u2194', section: 'routes', text: 'Routes' },
                { label: '\u2699', section: 'settings', text: 'Settings' }
            ];
            tab_items.forEach(item => {
                this._add_tab_item(bottom_bar, item, item.section === 'dashboard');
            });

            hamburger.on('click', () => this._toggle_sidebar());
            overlay.on('click', () => this._close_sidebar());
        };

        if (!spec.el) {
            compose();
        }
    }

    _add_nav_item(nav, label, id, active, options = {}) {
        const { context } = this;
        const item = new controls.div({
            context,
            'class': 'as-nav-item' + (active ? ' active' : '')
        });
        item.dom.attributes['data-section'] = id;
        const icon_text = options.icon ? options.icon + ' ' : '';
        item.add(icon_text + label);
        nav.add(item);

        const nav_item_info = {
            id,
            label: options.title || label,
            control: item,
            is_custom: !!options.is_custom
        };
        this._section_labels[id] = nav_item_info.label;
        this._nav_items.push(nav_item_info);
        if (nav_item_info.is_custom) {
            this._custom_nav_items.push(nav_item_info);
        }

        item.on('click', () => {
            this._activate_section_from_nav(id, nav_item_info.label);
        });

        return item;
    }

    _add_tab_item(bottom_bar, item, active) {
        const { context } = this;
        const tab = new controls.div({ context, 'class': 'as-tab-item' + (active ? ' active' : '') });
        tab.dom.attributes['data-section'] = item.section;

        const icon = new controls.span({ context, 'class': 'as-tab-icon' });
        icon.add(item.label);
        tab.add(icon);

        const label = new controls.span({ context, 'class': 'as-tab-label' });
        label.add(item.text);
        tab.add(label);
        bottom_bar.add(tab);

        this._tab_items.push({
            id: item.section,
            label: item.text,
            control: tab
        });

        tab.on('click', () => {
            this._activate_section_from_tab(item.section, item.text);
        });
    }

    _compose_dashboard(container) {
        const { context } = this;

        // Server Info group
        const server_group = new Group_Box({ context, title: 'Server', 'class': 'group-box' });
        container.add(server_group);

        this._card_uptime = new Stat_Card({
            context, label: 'Uptime', value: '—', detail: 'loading...', accent: '#4facfe', 'class': 'stat_card'
        });
        server_group.inner.add(this._card_uptime);

        this._card_pid = new Stat_Card({
            context, label: 'PID', value: '—', detail: 'Process ID', accent: '#00d2ff', 'class': 'stat_card'
        });
        server_group.inner.add(this._card_pid);

        this._card_node = new Stat_Card({
            context, label: 'Node.js', value: '—', detail: 'Runtime version', accent: '#43e97b', 'class': 'stat_card'
        });
        server_group.inner.add(this._card_node);

        // Resources group
        const resources_group = new Group_Box({ context, title: 'Resources', 'class': 'group-box' });
        container.add(resources_group);

        this._card_resources = new Stat_Card({
            context, label: 'Total Resources', value: '—', detail: 'loading...', accent: '#fa709a', 'class': 'stat_card'
        });
        resources_group.inner.add(this._card_resources);

        this._card_routes = new Stat_Card({
            context, label: 'Routes', value: '—', detail: 'Registered endpoints', accent: '#fee140', 'class': 'stat_card'
        });
        resources_group.inner.add(this._card_routes);

        // Memory group
        const memory_group = new Group_Box({ context, title: 'Memory', 'class': 'group-box' });
        container.add(memory_group);

        this._card_heap = new Stat_Card({
            context, label: 'Heap Used', value: '—', detail: 'loading...', accent: '#a18cd1', 'class': 'stat_card'
        });
        memory_group.inner.add(this._card_heap);

        this._card_rss = new Stat_Card({
            context, label: 'RSS', value: '—', detail: 'Resident set size', accent: '#fbc2eb', 'class': 'stat_card'
        });
        memory_group.inner.add(this._card_rss);

        // Telemetry group
        const telemetry_group = new Group_Box({ context, title: 'Telemetry', 'class': 'group-box' });
        container.add(telemetry_group);

        this._card_requests = new Stat_Card({
            context, label: 'Requests', value: '0', detail: '0 req/min', accent: '#f093fb', 'class': 'stat_card'
        });
        telemetry_group.inner.add(this._card_requests);
    }

    // ─── Client-Side Activation ──────────────────────────────

    activate() {
        if (!this.__active) {
            super.activate();
        }

        if (!this._client_bootstrapped) {
            this._client_bootstrapped = true;
            this._update_layout_mode();
            if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
                if (!this._bound_resize_handler) {
                    this._bound_resize_handler = () => this._update_layout_mode();
                }
                window.addEventListener('resize', this._bound_resize_handler);
            }

            this._fetch_status();
            this._connect_sse();
            this._load_custom_sections();
        }
    }

    _update_layout_mode() {
        const has_window = typeof window !== 'undefined';
        const w = has_window && typeof window.innerWidth === 'number'
            ? window.innerWidth
            : 1024;
        let mode = 'desktop';
        if (w <= 480) mode = 'phone';
        else if (w <= 768) mode = 'tablet';
        if (this.body && this.body.dom && this.body.dom.attributes) {
            this.body.dom.attributes['data-layout-mode'] = mode;
        }
        if (this.body && this.body.el && typeof this.body.el.setAttribute === 'function') {
            this.body.el.setAttribute('data-layout-mode', mode);
        }
        this._layout_mode = mode;
    }

    _toggle_sidebar() {
        const sidebar = this._sidebar;
        const overlay = this._overlay;
        if (!sidebar) return;
        const is_open = typeof sidebar.has_class === 'function' && sidebar.has_class('as-sidebar-open');
        if (is_open) {
            this._close_sidebar();
        } else {
            if (typeof sidebar.add_class === 'function') {
                sidebar.add_class('as-sidebar-open');
            }
            if (overlay && typeof overlay.add_class === 'function') {
                overlay.add_class('active');
            }
        }
    }

    _close_sidebar() {
        if (this._sidebar && typeof this._sidebar.remove_class === 'function') {
            this._sidebar.remove_class('as-sidebar-open');
        }
        if (this._overlay && typeof this._overlay.remove_class === 'function') {
            this._overlay.remove_class('active');
        }
    }

    _activate_section_from_nav(section_id, section_label) {
        this._set_active_nav(section_id);
        if (String(section_id).indexOf('custom:') === 0) {
            this._set_active_tab(null);
        } else {
            this._set_active_tab(section_id);
        }
        this._set_page_title(section_label || this._get_section_label(section_id));
        this._close_sidebar();
        this._select_section(section_id);
    }

    _activate_section_from_tab(section_id, section_label) {
        this._set_active_tab(section_id);
        this._set_active_nav(section_id);
        this._set_page_title(section_label || this._get_section_label(section_id));
        this._select_section(section_id);
    }

    _set_active_nav(section_id) {
        this._nav_items.forEach((nav_item) => {
            if (!nav_item.control) return;
            if (nav_item.id === section_id) {
                nav_item.control.add_class('active');
            } else {
                nav_item.control.remove_class('active');
            }
        });
    }

    _set_active_tab(section_id) {
        this._tab_items.forEach((tab_item) => {
            if (!tab_item.control) return;
            if (section_id != null && tab_item.id === section_id) {
                tab_item.control.add_class('active');
            } else {
                tab_item.control.remove_class('active');
            }
        });
    }

    _get_section_label(section_id) {
        return this._section_labels[section_id] || section_id;
    }

    _set_page_title(text) {
        this._set_control_text(this._page_title, text);
    }

    _select_section(section) {
        this._active_section = section;

        const dashboard_section = this._dashboard_section;
        const dynamic_section = this._dynamic_section;
        if (!dashboard_section || !dynamic_section) return Promise.resolve();

        if (section === 'dashboard') {
            dashboard_section.remove_class('hidden');
            dynamic_section.add_class('hidden');
            this._set_status_text('Dashboard view');
            return Promise.resolve();
        }

        dashboard_section.add_class('hidden');
        dynamic_section.remove_class('hidden');

        if (section === 'resources') {
            return this._render_resources_section();
        } else if (section === 'routes') {
            return this._render_routes_section();
        } else if (section === 'settings') {
            return this._render_settings_section();
        } else if (section.startsWith('custom:')) {
            const custom_id = section.substring(7);
            const custom = this._custom_sections_list && this._custom_sections_list.find(s => s.id === custom_id);
            if (custom) {
                return this._render_custom_section(custom);
            }
        }
        return Promise.resolve();
    }

    _set_control_text(control, text) {
        if (!control) return;
        if (typeof control.clear === 'function') {
            control.clear();
        }
        if (typeof control.add === 'function') {
            control.add(String(text == null ? '' : text));
        }
    }

    _clear_control(control) {
        if (control && typeof control.clear === 'function') {
            control.clear();
        }
    }

    _render_loading(message) {
        if (!this._dynamic_section) return;
        this._clear_control(this._dynamic_section);
        const panel = this._create_panel();
        const text = new controls.div({ context: this.context, 'class': 'as-muted' });
        text.add(String(message));
        panel.add(text);
        this._dynamic_section.add(panel);
    }

    _render_error(message, retry_handler) {
        if (!this._dynamic_section) return;
        this._clear_control(this._dynamic_section);

        const panel = this._create_panel();
        const text = new controls.div({ context: this.context, 'class': 'as-error' });
        text.add(String(message));
        panel.add(text);

        const retry_btn = new controls.button({ context: this.context, 'class': 'as-retry-btn' });
        retry_btn.dom.attributes.type = 'button';
        retry_btn.add('Retry');
        if (typeof retry_handler === 'function') {
            retry_btn.on('click', retry_handler);
        }
        panel.add(retry_btn);

        this._dynamic_section.add(panel);
    }

    _render_empty(message) {
        if (!this._dynamic_section) return;
        this._clear_control(this._dynamic_section);

        const panel = this._create_panel();
        const text = new controls.div({ context: this.context, 'class': 'as-muted' });
        text.add(String(message));
        panel.add(text);
        this._dynamic_section.add(panel);
    }

    _fetch_json(url) {
        return fetch(url).then((res) => {
            if (!res.ok) {
                if (res.status === 401) {
                    this._redirect_to_login();
                    throw new Error('Unauthorized');
                }
                throw new Error('HTTP ' + res.status + ' for ' + url);
            }
            return res.json();
        });
    }

    _create_tag_control(tag_name, class_name) {
        const spec = {
            context: this.context,
            tagName: tag_name
        };
        if (class_name) {
            spec.class = class_name;
        }
        return new Control(spec);
    }

    _create_panel(panel_title) {
        const panel = new controls.div({ context: this.context, 'class': 'as-panel' });
        if (panel_title) {
            const title = new controls.h3({ context: this.context, 'class': 'as-panel-title' });
            title.add(String(panel_title));
            panel.add(title);
        }
        return panel;
    }

    _stringify_value(value) {
        if (value == null) return '';
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            } catch (err) {
                return String(value);
            }
        }
        return String(value);
    }

    _create_table_panel(panel_title, column_names, rows_data) {
        const panel = this._create_panel(panel_title);

        const table = this._create_tag_control('table', 'as-table');
        const thead = this._create_tag_control('thead');
        const header_row = this._create_tag_control('tr');

        column_names.forEach((column_name) => {
            const th = this._create_tag_control('th');
            th.add(String(column_name));
            header_row.add(th);
        });
        thead.add(header_row);
        table.add(thead);

        const tbody = this._create_tag_control('tbody');
        rows_data.forEach((row_data) => {
            const row = this._create_tag_control('tr');
            row_data.forEach((cell_value) => {
                const td = this._create_tag_control('td');
                td.add(this._stringify_value(cell_value));
                row.add(td);
            });
            tbody.add(row);
        });
        table.add(tbody);

        panel.add(table);
        return panel;
    }

    _create_kv_row(key_text, value_text) {
        const row = new controls.div({ context: this.context, 'class': 'as-kv-row' });
        const key = new controls.span({ context: this.context, 'class': 'as-kv-key' });
        key.add(String(key_text));
        const value = new controls.span({ context: this.context, 'class': 'as-kv-value' });
        value.add(this._stringify_value(value_text));
        row.add(key);
        row.add(value);
        return row;
    }

    _render_resources_section() {
        this._render_loading('Loading resources...');
        this._set_status_text('Loading resources');

        return this._fetch_json('/api/admin/v1/resources')
            .then((data) => {
                if (!this._dynamic_section) return;

                const children = (data && data.children) || [];
                if (children.length === 0) {
                    this._render_empty('No resources found.');
                    return;
                }

                const rows_data = children.map((resource_item) => {
                    return [
                        resource_item.name || 'Unnamed',
                        resource_item.type || 'Resource',
                        resource_item.state || 'unknown'
                    ];
                });

                this._clear_control(this._dynamic_section);
                this._dynamic_section.add(
                    this._create_table_panel('Resources', ['Name', 'Type', 'State'], rows_data)
                );

                this._set_status_text('Loaded resources: ' + children.length);
            })
            .catch((err) => {
                console.error('[Admin] Failed to load resources:', err);
                this._render_error('Failed to load resources.', () => this._render_resources_section());
                this._set_status_text('Error loading resources');
            });
    }

    _render_routes_section() {
        this._render_loading('Loading routes...');
        this._set_status_text('Loading routes');

        return this._fetch_json('/api/admin/v1/routes')
            .then((routes) => {
                if (!this._dynamic_section) return;

                if (!Array.isArray(routes) || routes.length === 0) {
                    this._render_empty('No routes found.');
                    return;
                }

                const rows_data = routes.map((route) => {
                    return [
                        route.path || '',
                        route.method || 'GET',
                        route.type || 'route',
                        route.handler || 'anonymous'
                    ];
                });

                this._clear_control(this._dynamic_section);
                this._dynamic_section.add(
                    this._create_table_panel('Routes', ['Path', 'Method', 'Type', 'Handler'], rows_data)
                );

                this._set_status_text('Loaded routes: ' + routes.length);
            })
            .catch((err) => {
                console.error('[Admin] Failed to load routes:', err);
                this._render_error('Failed to load routes.', () => this._render_routes_section());
                this._set_status_text('Error loading routes');
            });
    }

    _render_settings_section() {
        this._render_loading('Loading settings snapshot...');
        this._set_status_text('Loading settings snapshot');

        return this._fetch_json('/api/admin/v1/status')
            .then((status) => {
                if (!this._dynamic_section) return;

                const server_name = (status && status.server && status.server.name) || 'jsgui3-server';
                const node_version = (status && status.process && status.process.node_version) || 'unknown';
                const platform = (status && status.process && status.process.platform) || 'unknown';
                const arch = (status && status.process && status.process.arch) || 'unknown';

                const panel = this._create_panel('Settings (Read-only)');
                panel.add(this._create_kv_row('Server Name', server_name));
                panel.add(this._create_kv_row('Node Version', node_version));
                panel.add(this._create_kv_row('Platform', platform + ' / ' + arch));

                const logout_btn = new controls.button({ context: this.context, 'class': 'as-logout-btn' });
                logout_btn.dom.attributes.type = 'button';
                logout_btn.add('Log Out');
                logout_btn.on('click', () => {
                    fetch('/api/admin/v1/auth/logout', {
                        method: 'POST',
                        credentials: 'same-origin'
                    }).finally(() => {
                        this._redirect_to_login();
                    });
                });
                panel.add(logout_btn);

                const muted = new controls.div({ context: this.context, 'class': 'as-muted' });
                muted.add('Authentication and write-actions are intentionally not enabled yet.');
                panel.add(muted);

                this._clear_control(this._dynamic_section);
                this._dynamic_section.add(panel);

                this._set_status_text('Loaded settings snapshot');
            })
            .catch((err) => {
                console.error('[Admin] Failed to load settings snapshot:', err);
                this._render_error('Failed to load settings snapshot.', () => this._render_settings_section());
                this._set_status_text('Error loading settings snapshot');
            });
    }

    _redirect_to_login() {
        if (typeof window !== 'undefined' && window.location) {
            window.location.href = '/admin/v1/login';
        }
    }

    _fetch_status() {
        return this._fetch_json('/api/admin/v1/status')
            .then(data => {
                this._apply_status(data);
                this._set_status_text('Connected — data loaded');
            })
            .catch(err => {
                console.error('[Admin] Failed to fetch status:', err);
                this._set_status_text('Error loading status');
            });
    }

    _apply_status(data) {
        if (!data) return;

        const fmt_bytes = (bytes) => {
            if (bytes == null) return '—';
            const units = ['B', 'KB', 'MB', 'GB'];
            let value = bytes;
            let unit_index = 0;
            while (value >= 1024 && unit_index < units.length - 1) {
                value /= 1024;
                unit_index++;
            }
            return value.toFixed(1) + ' ' + units[unit_index];
        };

        const fmt_uptime = (seconds) => {
            if (seconds == null) return '—';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            if (h > 0) return h + 'h ' + m + 'm';
            if (m > 0) return m + 'm ' + s + 's';
            return s + 's';
        };

        // Process info
        if (data.process) {
            const p = data.process;
            if (this._card_uptime) {
                this._card_uptime.set_value(fmt_uptime(p.uptime));
                this._card_uptime.set_detail('PID ' + p.pid);
            }
            if (this._card_pid) {
                this._card_pid.set_value(String(p.pid));
                this._card_pid.set_detail(p.platform + ' / ' + p.arch);
            }
            if (this._card_node) {
                this._card_node.set_value(p.node_version);
                this._card_node.set_detail(p.platform);
            }
            if (data.process.memory) {
                const mem = data.process.memory;
                if (this._card_heap) {
                    this._card_heap.set_value(fmt_bytes(mem.heap_used));
                    this._card_heap.set_detail(fmt_bytes(mem.heap_total) + ' total');
                }
                if (this._card_rss) {
                    this._card_rss.set_value(fmt_bytes(mem.rss));
                    this._card_rss.set_detail('External: ' + fmt_bytes(mem.external));
                }
            }
        }

        // Pool
        if (data.pool) {
            if (this._card_resources) {
                this._card_resources.set_value(String(data.pool.total || 0));
                const running = data.pool.running || 0;
                const stopped = data.pool.stopped || 0;
                this._card_resources.set_detail(running + ' running, ' + stopped + ' stopped');
            }
        }

        // Routes
        if (data.routes) {
            if (this._card_routes) {
                this._card_routes.set_value(String(data.routes.total || 0));
            }
        }

        // Telemetry
        if (data.telemetry) {
            if (this._card_requests) {
                this._card_requests.set_value(String(data.telemetry.request_count || 0));
                this._card_requests.set_detail((data.telemetry.requests_per_minute || 0) + ' req/min');
            }
        }
    }

    _connect_sse() {
        this._sse_backoff = 1000; // start at 1s
        this._sse_max_backoff = 30000; // cap at 30s
        this._open_sse();
    }

    _open_sse() {
        try {
            if (this._event_source) {
                this._event_source.close();
                this._event_source = null;
            }

            const es = new EventSource('/api/admin/v1/events');
            this._event_source = es;

            es.addEventListener('heartbeat', (e) => {
                try {
                    const data = JSON.parse(e.data);
                    this._apply_heartbeat(data);
                } catch (err) {
                    console.warn('[Admin] Bad heartbeat data:', err);
                }
            });

            es.addEventListener('open', () => {
                // Reset backoff on successful connection
                this._sse_backoff = 1000;
                this._set_status_text('Live — SSE connected');
                if (this._status_dot) {
                    this._status_dot.add_class('online');
                    this._status_dot.remove_class('offline');
                }
            });

            es.addEventListener('error', () => {
                this._set_status_text('SSE disconnected — reconnecting...');
                if (this._status_dot) {
                    this._status_dot.add_class('offline');
                    this._status_dot.remove_class('online');
                }

                // Close and reconnect with backoff
                es.close();
                this._event_source = null;
                const delay = this._sse_backoff;
                this._sse_backoff = Math.min(this._sse_backoff * 2, this._sse_max_backoff);
                console.log('[Admin] SSE reconnecting in ' + delay + 'ms');
                this._sse_reconnect_timer = setTimeout(() => this._open_sse(), delay);
            });
        } catch (err) {
            console.error('[Admin] SSE not available:', err);
        }
    }

    _apply_heartbeat(data) {
        if (!data) return;

        const fmt_bytes = (bytes) => {
            if (bytes == null) return '—';
            const units = ['B', 'KB', 'MB', 'GB'];
            let value = bytes;
            let unit_index = 0;
            while (value >= 1024 && unit_index < units.length - 1) {
                value /= 1024;
                unit_index++;
            }
            return value.toFixed(1) + ' ' + units[unit_index];
        };

        const fmt_uptime = (seconds) => {
            if (seconds == null) return '—';
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            if (h > 0) return h + 'h ' + m + 'm';
            if (m > 0) return m + 'm ' + s + 's';
            return s + 's';
        };

        // Update cards with heartbeat data
        if (this._card_uptime) {
            this._card_uptime.set_value(fmt_uptime(data.uptime));
            this._card_uptime.set_detail('PID ' + data.pid);
        }

        if (data.memory) {
            if (this._card_heap) {
                this._card_heap.set_value(fmt_bytes(data.memory.heap_used));
                this._card_heap.set_detail(fmt_bytes(data.memory.heap_total) + ' total');
            }
            if (this._card_rss) {
                this._card_rss.set_value(fmt_bytes(data.memory.rss));
            }
        }

        if (this._card_requests) {
            this._card_requests.set_value(String(data.request_count || 0));
            this._card_requests.set_detail((data.requests_per_minute || 0) + ' req/min');
        }

        if (data.pool_summary && this._card_resources) {
            this._card_resources.set_value(String(data.pool_summary.total || 0));
            const running = data.pool_summary.running || 0;
            this._card_resources.set_detail(running + ' running');
        }

        if (data.route_count != null && this._card_routes) {
            this._card_routes.set_value(String(data.route_count));
        }

        // Update status bar timestamp
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        this._set_status_text('Live — last update ' + hh + ':' + mm + ':' + ss);
    }

    _set_status_text(text) {
        this._set_control_text(this._status_text, text);
    }

    // ─── Custom Sections (Extensibility) ─────────────────

    /**
     * Fetch custom section metadata from the server and dynamically
     * add nav items to the sidebar. Each custom section gets its own
     * click handler that fetches data from its api_path and renders
     * it using automatic table/key-value rendering.
     */
    _load_custom_sections() {
        this._custom_sections_list = [];

        return this._fetch_json('/api/admin/v1/custom-sections')
            .then(sections => {
                this._remove_custom_nav_items();
                if (!Array.isArray(sections) || sections.length === 0) return;

                this._custom_sections_list = sections;
                if (!this._nav) return;

                this._ensure_custom_nav_separator();

                sections.forEach(section => {
                    const section_id = 'custom:' + section.id;
                    const item = this._add_nav_item(
                        this._nav,
                        section.label || section.id,
                        section_id,
                        false,
                        {
                            icon: section.icon || '',
                            title: section.label || section.id,
                            is_custom: true
                        }
                    );
                    if (this.__active && typeof item.activate === 'function') {
                        item.activate();
                    }
                });
            })
            .catch(err => {
                console.warn('[Admin] Failed to load custom sections:', err);
            });
    }

    _remove_custom_nav_items() {
        const custom_ids = this._custom_nav_items.map((custom_item) => custom_item.id);
        this._custom_nav_items.forEach((custom_item) => {
            if (custom_item.control && typeof custom_item.control.remove === 'function') {
                custom_item.control.remove();
            }
        });
        this._custom_nav_items = [];

        this._nav_items = this._nav_items.filter((nav_item) => !nav_item.is_custom);
        custom_ids.forEach((custom_id) => {
            delete this._section_labels[custom_id];
        });

        if (this._custom_nav_separator && typeof this._custom_nav_separator.remove === 'function') {
            this._custom_nav_separator.remove();
            this._custom_nav_separator = null;
        }
    }

    _ensure_custom_nav_separator() {
        if (this._custom_nav_separator || !this._nav) return;
        const separator = new controls.div({ context: this.context, 'class': 'as-nav-separator' });
        this._nav.add(separator);
        this._custom_nav_separator = separator;
        if (this.__active && typeof separator.activate === 'function') {
            separator.activate();
        }
    }

    /**
     * Render a custom section by fetching its data endpoint.
     * Arrays are rendered as tables, objects as key-value panels,
     * scalars as plain text.
     */
    _render_custom_section(section) {
        if (!this._dashboard_section || !this._dynamic_section) return Promise.resolve();

        this._dashboard_section.add_class('hidden');
        this._dynamic_section.remove_class('hidden');

        this._render_loading('Loading ' + section.label + '...');
        this._set_status_text('Loading ' + section.label);

        return this._fetch_json(section.api_path)
            .then(data => {
                this._render_custom_section_data(section, data);
                this._set_status_text('Loaded ' + section.label);
            })
            .catch(err => {
                console.error('[Admin] Failed to load custom section:', err);
                this._render_error('Failed to load ' + section.label + '.', () => this._render_custom_section(section));
                this._set_status_text('Error loading ' + section.label);
            });
    }

    /**
     * Auto-render data based on shape:
     * - Array of objects → table
     * - Object → key-value panel
     * - Scalar → plain text
     */
    _render_custom_section_data(section, data) {
        if (!this._dynamic_section) return;

        if (Array.isArray(data)) {
            if (data.length === 0) {
                this._render_empty('No data for ' + section.label + '.');
                return;
            }
            const normalized_first_row = (data[0] && typeof data[0] === 'object')
                ? data[0]
                : { value: data[0] };
            const keys = Object.keys(normalized_first_row);
            const rows_data = data.map((row) => {
                const normalized_row = (row && typeof row === 'object') ? row : { value: row };
                return keys.map((key) => normalized_row[key]);
            });

            this._clear_control(this._dynamic_section);
            this._dynamic_section.add(
                this._create_table_panel(section.label, keys, rows_data)
            );
        } else if (data && typeof data === 'object') {
            const panel = this._create_panel(section.label);
            Object.entries(data).forEach((entry) => {
                panel.add(this._create_kv_row(entry[0], entry[1]));
            });
            this._clear_control(this._dynamic_section);
            this._dynamic_section.add(panel);
        } else {
            const panel = this._create_panel();
            const text = new controls.div({ context: this.context, 'class': 'as-muted' });
            text.add(this._stringify_value(data));
            panel.add(text);
            this._clear_control(this._dynamic_section);
            this._dynamic_section.add(panel);
        }
    }
}

Admin_Shell.css = `
/* ─── Reset & Root ───────────────────────────────────────── */
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
    background: #1a1a2e;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    height: 100vh;
    overflow: hidden;
}

/* ─── Shell Grid ─────────────────────────────────────────── */
.admin-shell {
    display: grid;
    grid-template-columns: 240px 1fr;
    height: 100%;
}

/* ─── Sidebar ────────────────────────────────────────────── */
.as-sidebar {
    background: #16213e;
    border-right: 1px solid #2a2a4a;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}
.as-brand {
    padding: 20px;
    font-size: 1.15rem;
    font-weight: 700;
    color: #fff;
    border-bottom: 1px solid #2a2a4a;
    display: flex;
    align-items: center;
    gap: 10px;
}
.as-brand-icon {
    font-size: 1.3rem;
}
.as-nav {
    flex: 1;
    padding: 16px 0;
    overflow-y: auto;
}
.as-nav-item {
    padding: 11px 24px;
    cursor: pointer;
    border-left: 3px solid transparent;
    transition: all 0.15s ease;
    color: #8888aa;
    font-size: 0.9rem;
    user-select: none;
}
.as-nav-item:hover {
    background: rgba(255,255,255,0.04);
    color: #c0c0d0;
}
.as-nav-item.active {
    background: rgba(79, 172, 254, 0.08);
    color: #4facfe;
    border-left-color: #4facfe;
    font-weight: 500;
}
.as-sidebar-footer {
    padding: 14px 20px;
    border-top: 1px solid #2a2a4a;
}
.as-version {
    font-size: 0.7rem;
    color: #555570;
}

/* ─── Custom Section Separator ──────────────────────── */
.as-nav-separator {
    height: 1px;
    background: #2a2a4a;
    margin: 10px 16px;
}

/* ─── Main Area ──────────────────────────────────────────── */
.as-main {
    display: flex;
    flex-direction: column;
    min-width: 0;
}
.as-toolbar {
    height: 56px;
    border-bottom: 1px solid #2a2a4a;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 28px;
    background: #16213e;
    flex-shrink: 0;
}
.as-page-title {
    font-size: 1.1rem;
    font-weight: 500;
    color: #fff;
}
.as-status-dot {
    font-size: 0.65rem;
}
.as-status-dot.online { color: #43e97b; }
.as-status-dot.offline { color: #fa709a; }

/* ─── Content ────────────────────────────────────────────── */
.as-content {
    flex: 1;
    overflow-y: auto;
    padding: 28px;
}
.as-section.hidden {
    display: none;
}
.as-panel {
    background: #20203a;
    border: 1px solid #2f2f52;
    border-radius: 8px;
    padding: 16px;
}
.as-panel-title {
    color: #fff;
    font-size: 0.95rem;
    margin-bottom: 12px;
}
.as-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.82rem;
}
.as-table th,
.as-table td {
    text-align: left;
    border-bottom: 1px solid #303058;
    padding: 8px 10px;
    color: #d4d4e8;
    vertical-align: top;
}
.as-table th {
    color: #9fa4c8;
    font-weight: 600;
}
.as-muted {
    color: #8a8fb0;
    font-size: 0.8rem;
}
.as-error {
    color: #ff8c9d;
    margin-bottom: 10px;
    font-size: 0.82rem;
}
.as-retry-btn {
    border: 1px solid #4facfe;
    background: #1f3552;
    color: #b7ddff;
    border-radius: 6px;
    padding: 6px 10px;
    cursor: pointer;
}
.as-retry-btn:hover {
    background: #294770;
}
.as-logout-btn {
    margin-top: 12px;
    border: 1px solid #ff8c9d;
    background: #5a2230;
    color: #ffd3da;
    border-radius: 6px;
    padding: 6px 10px;
    cursor: pointer;
}
.as-logout-btn:hover {
    background: #743041;
}
.as-kv-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 0;
    border-bottom: 1px solid #303058;
    font-size: 0.82rem;
}
.as-kv-key {
    color: #9fa4c8;
}
.as-kv-value {
    color: #d4d4e8;
}

/* ─── Status Bar ─────────────────────────────────────────── */
.as-statusbar {
    height: 28px;
    border-top: 1px solid #2a2a4a;
    background: #141428;
    display: flex;
    align-items: center;
    padding: 0 20px;
    flex-shrink: 0;
}
.as-statusbar-text {
    font-size: 0.7rem;
    color: #555570;
}

/* ─── Hamburger Button ───────────────────────────────────── */
.as-hamburger {
    display: none;
    background: none;
    border: 1px solid #3a3a5a;
    color: #c0c0d0;
    font-size: 1.3rem;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    line-height: 1;
    margin-right: 12px;
    min-width: 44px;
    min-height: 44px;
    align-items: center;
    justify-content: center;
}
.as-hamburger:hover {
    background: rgba(255,255,255,0.06);
}

/* ─── Sidebar Overlay Backdrop ───────────────────────────── */
.as-sidebar-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 98;
}
.as-sidebar-overlay.active {
    display: block;
}

/* ─── Bottom Tab Bar (phone) ─────────────────────────────── */
.as-bottom-bar {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: #16213e;
    border-top: 1px solid #2a2a4a;
    z-index: 100;
    justify-content: space-around;
    align-items: stretch;
}
.as-tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #6a6a8a;
    font-size: 0.65rem;
    padding: 4px 0;
    min-height: 44px;
    user-select: none;
    transition: color 0.15s;
}
.as-tab-item.active {
    color: #4facfe;
}
.as-tab-icon {
    font-size: 1.2rem;
    line-height: 1;
    margin-bottom: 2px;
}
.as-tab-label {
    font-size: 0.6rem;
    letter-spacing: 0.03em;
}

/* ─── Responsive: Tablet — sidebar overlay (Chapter 2, Layer C) ── */
@media (max-width: 768px) {
    .admin-shell {
        grid-template-columns: 1fr;
    }
    .as-hamburger {
        display: flex;
    }
    .as-sidebar {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: 260px;
        z-index: 99;
        box-shadow: 4px 0 20px rgba(0,0,0,0.4);
    }
    .as-sidebar.as-sidebar-open {
        display: flex;
    }
    .as-nav-item {
        padding: 14px 24px;
        min-height: 44px;
    }
}

/* ─── Responsive: Phone — bottom tab bar + dense content ───── */
@media (max-width: 480px) {
    .as-bottom-bar {
        display: flex;
    }
    .as-content {
        padding: 16px;
        padding-bottom: 72px;
    }
    .as-statusbar {
        bottom: 56px;
        position: fixed;
        left: 0;
        right: 0;
        z-index: 99;
    }
    .as-toolbar {
        padding: 0 12px;
    }
    .as-page-title {
        font-size: 0.95rem;
    }
    .stat_card {
        min-width: 140px;
        max-width: none;
        flex: 1 1 140px;
        padding: 14px 16px;
    }
    .stat-value {
        font-size: 1.4rem;
    }
    .as-table {
        font-size: 0.75rem;
    }
    .as-table th,
    .as-table td {
        padding: 6px 6px;
    }
    .group-box {
        padding: 14px 10px 10px;
        margin-bottom: 14px;
    }
    .group-box-content {
        gap: 10px;
    }
}
`;

controls.Admin_Shell = Admin_Shell;
module.exports = jsgui;
