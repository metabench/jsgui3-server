const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it } = require('mocha');
const { Page_Context } = require('jsgui3-html');

const admin_ui = require('../admin-ui/client');
const admin_ui_v1 = require('../admin-ui/v1/client');

const Admin_Page = admin_ui.controls && admin_ui.controls.Admin_Page;
const Admin_Shell = admin_ui_v1.controls && admin_ui_v1.controls.Admin_Shell;

const create_page_context = () => new Page_Context({});

const create_admin_page = () => {
    return new Admin_Page({
        context: create_page_context()
    });
};

const create_admin_shell = () => {
    return new Admin_Shell({
        context: create_page_context()
    });
};

const wait_for_turn = () => new Promise((resolve) => setImmediate(resolve));

const file_contains_pattern = (file_path, pattern) => {
    const source_text = fs.readFileSync(file_path, 'utf8');
    return pattern.test(source_text);
};

const get_child_controls = (control) => {
    if (!control || !control.content || !Array.isArray(control.content._arr)) {
        return [];
    }
    return control.content._arr;
};

const control_has_class = (control, class_name) => {
    const class_attribute = control && control.dom && control.dom.attributes && control.dom.attributes.class;
    if (!class_attribute) return false;
    return String(class_attribute).split(/\s+/).includes(class_name);
};

const find_control_by_class = (root_control, class_name) => {
    if (!root_control) return null;
    if (control_has_class(root_control, class_name)) {
        return root_control;
    }
    const child_controls = get_child_controls(root_control);
    for (const child_control of child_controls) {
        const found_control = find_control_by_class(child_control, class_name);
        if (found_control) return found_control;
    }
    return null;
};

describe('Admin UI jsgui control integration', function() {
    it('keeps admin UI modules free of direct DOM selection and HTML string patching', () => {
        const files_to_check = [
            path.join(__dirname, '..', 'admin-ui', 'client.js'),
            path.join(__dirname, '..', 'admin-ui', 'v1', 'controls', 'admin_shell.js')
        ];

        const forbidden_patterns = [
            /\bdocument\./,
            /querySelector/,
            /innerHTML/,
            /createElement/,
            /appendChild/,
            /\.classList\b/
        ];

        files_to_check.forEach((file_path) => {
            forbidden_patterns.forEach((pattern) => {
                assert.strictEqual(
                    file_contains_pattern(file_path, pattern),
                    false,
                    `Forbidden DOM pattern ${pattern} found in ${file_path}`
                );
            });
        });
    });

    it('updates Admin_Page active menu state and title through control APIs', () => {
        const admin_page = create_admin_page();
        admin_page._activate_menu_item('resources');

        const resources_item = admin_page._menu_items.find((item) => item.id === 'resources');
        const overview_item = admin_page._menu_items.find((item) => item.id === 'overview');

        assert(resources_item && resources_item.control.has_class('active'));
        assert(overview_item && !overview_item.control.has_class('active'));

        const title_html = admin_page.page_title.all_html_render();
        assert(title_html.includes('Resources'));
    });

    it('responds to interactive menu click events on Admin_Page controls', () => {
        const admin_page = create_admin_page();
        const settings_item = admin_page._menu_items.find((item) => item.id === 'settings');
        const overview_item = admin_page._menu_items.find((item) => item.id === 'overview');

        settings_item.control.raise('click');

        assert(settings_item.control.has_class('active'));
        assert(!overview_item.control.has_class('active'));
        assert.strictEqual(admin_page._active_section, 'settings');
        assert(admin_page.page_title.all_html_render().includes('Settings'));
    });

    it('renders resources table content using jsgui controls', async () => {
        const admin_shell = create_admin_shell();
        admin_shell._fetch_json = () => Promise.resolve({
            children: [
                { name: 'Resource Alpha', type: 'Publisher', state: 'running' },
                { name: 'Resource Beta', type: 'Resource', state: 'stopped' }
            ]
        });

        await admin_shell._render_resources_section();

        const dynamic_html = admin_shell._dynamic_section.all_html_render();
        const status_html = admin_shell._status_text.all_html_render();

        assert(dynamic_html.includes('Resources'));
        assert(dynamic_html.includes('Resource Alpha'));
        assert(dynamic_html.includes('Publisher'));
        assert(dynamic_html.includes('<table'));
        assert(status_html.includes('Loaded resources: 2'));
    });

    it('renders routes table content using jsgui controls', async () => {
        const admin_shell = create_admin_shell();
        admin_shell._fetch_json = () => Promise.resolve([
            { path: '/api/one', method: 'GET', type: 'api', handler: 'handler_one' },
            { path: '/api/two', method: 'POST', type: 'api', handler: 'handler_two' }
        ]);

        await admin_shell._render_routes_section();

        const dynamic_html = admin_shell._dynamic_section.all_html_render();
        const status_html = admin_shell._status_text.all_html_render();

        assert(dynamic_html.includes('Routes'));
        assert(dynamic_html.includes('Path'));
        assert(dynamic_html.includes('handler_two'));
        assert(dynamic_html.includes('<table'));
        assert(status_html.includes('Loaded routes: 2'));
    });

    it('renders settings snapshot with key-value rows and logout button control', async () => {
        const admin_shell = create_admin_shell();
        admin_shell._fetch_json = () => Promise.resolve({
            server: {
                name: 'Example Server',
                primary_endpoint: 'http://127.0.0.1:52000/',
                listening_endpoints: [
                    { url: 'http://127.0.0.1:52000/' },
                    { url: 'http://192.168.1.2:52000/' }
                ],
                startup_diagnostics: {
                    requested_port: 52000,
                    addresses_attempted: ['127.0.0.1', '192.168.1.2']
                }
            },
            process: {
                node_version: 'v22.0.0',
                platform: 'linux',
                arch: 'x64'
            }
        });

        await admin_shell._render_settings_section();

        const dynamic_html = admin_shell._dynamic_section.all_html_render();
        assert(dynamic_html.includes('Settings (Read-only)'));
        assert(dynamic_html.includes('Example Server'));
        assert(dynamic_html.includes('v22.0.0'));
        assert(dynamic_html.includes('as-logout-btn'));
        assert(dynamic_html.includes('Startup &amp; Network'));
        assert(dynamic_html.includes('Primary Endpoint'));
        assert(dynamic_html.includes('127.0.0.1:52000'));
        assert(dynamic_html.includes('Requested Port'));
    });

    it('renders custom section data for array, object, and scalar payloads', () => {
        const admin_shell = create_admin_shell();
        const section = { id: 'custom_data', label: 'Custom Data' };

        admin_shell._render_custom_section_data(section, [
            { key: 'alpha', value: 1 },
            { key: 'beta', value: 2 }
        ]);
        let dynamic_html = admin_shell._dynamic_section.all_html_render();
        assert(dynamic_html.includes('<table'));
        assert(dynamic_html.includes('alpha'));
        assert(dynamic_html.includes('value'));

        admin_shell._render_custom_section_data(section, {
            enabled: true,
            retries: 3
        });
        dynamic_html = admin_shell._dynamic_section.all_html_render();
        assert(dynamic_html.includes('enabled'));
        assert(dynamic_html.includes('retries'));
        assert(dynamic_html.includes('as-kv-row'));

        admin_shell._render_custom_section_data(section, 'plain text');
        dynamic_html = admin_shell._dynamic_section.all_html_render();
        assert(dynamic_html.includes('plain text'));
        assert(dynamic_html.includes('as-muted'));
    });

    it('loads custom sections into sidebar with separator and custom metadata', async () => {
        const admin_shell = create_admin_shell();
        admin_shell._fetch_json = () => Promise.resolve([
            { id: 'logs', label: 'Logs', icon: 'L', api_path: '/api/admin/v1/logs' },
            { id: 'jobs', label: 'Jobs', icon: 'J', api_path: '/api/admin/v1/jobs' }
        ]);

        await admin_shell._load_custom_sections();

        const nav_html = admin_shell._nav.all_html_render();
        assert.strictEqual(admin_shell._custom_nav_items.length, 2);
        assert(admin_shell._section_labels['custom:logs']);
        assert(admin_shell._section_labels['custom:jobs']);
        assert(nav_html.includes('as-nav-separator'));
        assert(nav_html.includes('L Logs'));
        assert(nav_html.includes('J Jobs'));
    });

    it('syncs nav and tab state when a nav item click is raised', async () => {
        const admin_shell = create_admin_shell();
        let selected_section = null;
        admin_shell._select_section = (section_id) => {
            selected_section = section_id;
            return Promise.resolve();
        };

        admin_shell._sidebar.add_class('as-sidebar-open');
        admin_shell._overlay.add_class('active');

        const resources_nav = admin_shell._nav_items.find((item) => item.id === 'resources');
        const resources_tab = admin_shell._tab_items.find((item) => item.id === 'resources');
        const dashboard_tab = admin_shell._tab_items.find((item) => item.id === 'dashboard');

        resources_nav.control.raise('click');
        await wait_for_turn();

        assert.strictEqual(selected_section, 'resources');
        assert(resources_nav.control.has_class('active'));
        assert(resources_tab.control.has_class('active'));
        assert(!dashboard_tab.control.has_class('active'));
        assert(admin_shell._page_title.all_html_render().includes('Resources'));
        assert(!admin_shell._sidebar.has_class('as-sidebar-open'));
        assert(!admin_shell._overlay.has_class('active'));
    });

    it('syncs nav and tab state when a tab item click is raised', async () => {
        const admin_shell = create_admin_shell();
        let selected_section = null;
        admin_shell._select_section = (section_id) => {
            selected_section = section_id;
            return Promise.resolve();
        };

        const routes_tab = admin_shell._tab_items.find((item) => item.id === 'routes');
        const routes_nav = admin_shell._nav_items.find((item) => item.id === 'routes');
        const dashboard_nav = admin_shell._nav_items.find((item) => item.id === 'dashboard');

        routes_tab.control.raise('click');
        await wait_for_turn();

        assert.strictEqual(selected_section, 'routes');
        assert(routes_tab.control.has_class('active'));
        assert(routes_nav.control.has_class('active'));
        assert(!dashboard_nav.control.has_class('active'));
        assert(admin_shell._page_title.all_html_render().includes('Routes'));
    });

    it('opens and closes the sidebar through hamburger and overlay interactions', () => {
        const admin_shell = create_admin_shell();

        assert(!admin_shell._sidebar.has_class('as-sidebar-open'));
        assert(!admin_shell._overlay.has_class('active'));

        admin_shell._hamburger.raise('click');
        assert(admin_shell._sidebar.has_class('as-sidebar-open'));
        assert(admin_shell._overlay.has_class('active'));

        admin_shell._overlay.raise('click');
        assert(!admin_shell._sidebar.has_class('as-sidebar-open'));
        assert(!admin_shell._overlay.has_class('active'));
    });

    it('activates custom nav item interaction and clears bottom tabs', async () => {
        const admin_shell = create_admin_shell();
        admin_shell._fetch_json = () => Promise.resolve([
            { id: 'logs', label: 'Logs', icon: 'L', api_path: '/api/admin/v1/logs' }
        ]);

        await admin_shell._load_custom_sections();

        let selected_section = null;
        admin_shell._select_section = (section_id) => {
            selected_section = section_id;
            return Promise.resolve();
        };

        const custom_nav_item = admin_shell._custom_nav_items[0];
        custom_nav_item.control.raise('click');
        await wait_for_turn();

        assert.strictEqual(selected_section, 'custom:logs');
        assert(custom_nav_item.control.has_class('active'));
        assert(admin_shell._page_title.all_html_render().includes('Logs'));
        admin_shell._tab_items.forEach((tab_item) => {
            assert(!tab_item.control.has_class('active'));
        });
    });

    it('fires retry interaction from rendered error panel button', () => {
        const admin_shell = create_admin_shell();
        let retry_count = 0;

        admin_shell._render_error('Load failed', () => {
            retry_count += 1;
        });

        const retry_button = find_control_by_class(admin_shell._dynamic_section, 'as-retry-btn');
        assert(retry_button, 'Expected retry button control in error panel');

        retry_button.raise('click');
        assert.strictEqual(retry_count, 1);
    });

    it('fires logout interaction and redirect through settings panel button', async () => {
        const admin_shell = create_admin_shell();
        admin_shell._fetch_json = () => Promise.resolve({
            server: { name: 'Example Server' },
            process: { node_version: 'v22.0.0', platform: 'linux', arch: 'x64' }
        });

        const original_fetch = global.fetch;
        let logout_request = null;
        global.fetch = (url, options) => {
            logout_request = { url, options };
            return Promise.resolve({ ok: true });
        };

        let redirect_count = 0;
        admin_shell._redirect_to_login = () => {
            redirect_count += 1;
        };

        try {
            await admin_shell._render_settings_section();

            const logout_button = find_control_by_class(admin_shell._dynamic_section, 'as-logout-btn');
            assert(logout_button, 'Expected logout button control in settings panel');

            logout_button.raise('click');
            await wait_for_turn();

            assert(logout_request);
            assert.strictEqual(logout_request.url, '/api/admin/v1/auth/logout');
            assert.strictEqual(logout_request.options.method, 'POST');
            assert.strictEqual(logout_request.options.credentials, 'same-origin');
            assert.strictEqual(redirect_count, 1);
        } finally {
            global.fetch = original_fetch;
        }
    });

    it('updates layout mode from window width and stores mode attribute', () => {
        const admin_shell = create_admin_shell();
        const original_window = global.window;
        global.window = { innerWidth: 460 };

        try {
            admin_shell._update_layout_mode();
            assert.strictEqual(admin_shell._layout_mode, 'phone');
            assert.strictEqual(admin_shell.body.dom.attributes['data-layout-mode'], 'phone');

            global.window.innerWidth = 700;
            admin_shell._update_layout_mode();
            assert.strictEqual(admin_shell._layout_mode, 'tablet');
            assert.strictEqual(admin_shell.body.dom.attributes['data-layout-mode'], 'tablet');

            global.window.innerWidth = 1200;
            admin_shell._update_layout_mode();
            assert.strictEqual(admin_shell._layout_mode, 'desktop');
            assert.strictEqual(admin_shell.body.dom.attributes['data-layout-mode'], 'desktop');
        } finally {
            global.window = original_window;
        }
    });

    it('runs activate startup interactions only once and wires resize listener', () => {
        const admin_shell = create_admin_shell();

        let status_calls = 0;
        let sse_calls = 0;
        let custom_calls = 0;
        admin_shell._fetch_status = () => {
            status_calls += 1;
            return Promise.resolve();
        };
        admin_shell._connect_sse = () => {
            sse_calls += 1;
        };
        admin_shell._load_custom_sections = () => {
            custom_calls += 1;
            return Promise.resolve();
        };

        const resize_listener_calls = [];
        const original_window = global.window;
        global.window = {
            innerWidth: 1024,
            addEventListener: (event_name, handler) => {
                resize_listener_calls.push({ event_name, handler });
            }
        };

        try {
            admin_shell.activate();
            admin_shell.activate();

            assert.strictEqual(status_calls, 1);
            assert.strictEqual(sse_calls, 1);
            assert.strictEqual(custom_calls, 1);
            assert.strictEqual(resize_listener_calls.length, 1);
            assert.strictEqual(resize_listener_calls[0].event_name, 'resize');
        } finally {
            global.window = original_window;
        }
    });

    it('handles interactive SSE open, heartbeat, and error flows', () => {
        const admin_shell = create_admin_shell();
        const original_event_source = global.EventSource;
        const original_set_timeout = global.setTimeout;

        const sse_instances = [];
        const timeout_calls = [];
        let heartbeat_payload = null;
        admin_shell._apply_heartbeat = (payload) => {
            heartbeat_payload = payload;
        };

        class Fake_Event_Source {
            constructor(url) {
                this.url = url;
                this.listeners = Object.create(null);
                this.closed = false;
                sse_instances.push(this);
            }

            addEventListener(event_name, handler) {
                this.listeners[event_name] = handler;
            }

            close() {
                this.closed = true;
            }

            emit(event_name, event_data) {
                if (typeof this.listeners[event_name] === 'function') {
                    this.listeners[event_name](event_data);
                }
            }
        }

        global.EventSource = Fake_Event_Source;
        global.setTimeout = (handler, delay) => {
            timeout_calls.push({ handler, delay });
            return timeout_calls.length;
        };

        try {
            admin_shell._connect_sse();
            assert.strictEqual(sse_instances.length, 1);
            assert.strictEqual(sse_instances[0].url, '/api/admin/v1/events');

            sse_instances[0].emit('open', {});
            assert(admin_shell._status_dot.has_class('online'));
            assert(!admin_shell._status_dot.has_class('offline'));
            assert(admin_shell._status_text.all_html_render().includes('SSE connected'));

            sse_instances[0].emit('heartbeat', {
                data: JSON.stringify({
                    uptime: 360,
                    pid: 3001,
                    memory: {
                        heap_used: 1024 * 1024 * 8,
                        heap_total: 1024 * 1024 * 16,
                        rss: 1024 * 1024 * 24
                    },
                    request_count: 11,
                    requests_per_minute: 4,
                    pool_summary: { total: 6, running: 5 },
                    route_count: 9
                })
            });

            assert(heartbeat_payload);
            assert.strictEqual(heartbeat_payload.request_count, 11);
            assert.strictEqual(heartbeat_payload.route_count, 9);

            sse_instances[0].emit('error', {});
            assert(admin_shell._status_dot.has_class('offline'));
            assert(!admin_shell._status_dot.has_class('online'));
            assert.strictEqual(timeout_calls.length, 1);
            assert.strictEqual(timeout_calls[0].delay, 1000);
            assert.strictEqual(admin_shell._sse_backoff, 2000);
            assert.strictEqual(admin_shell._event_source, null);
            assert(sse_instances[0].closed);

            timeout_calls[0].handler();
            assert.strictEqual(sse_instances.length, 2);
        } finally {
            global.EventSource = original_event_source;
            global.setTimeout = original_set_timeout;
        }
    });

    it('redirects on unauthorized fetch_json responses', async () => {
        const admin_shell = create_admin_shell();
        const original_fetch = global.fetch;
        let redirect_count = 0;

        global.fetch = () => Promise.resolve({
            ok: false,
            status: 401
        });
        admin_shell._redirect_to_login = () => {
            redirect_count += 1;
        };

        try {
            await assert.rejects(
                () => admin_shell._fetch_json('/api/admin/v1/status'),
                /Unauthorized/
            );
            assert.strictEqual(redirect_count, 1);
        } finally {
            global.fetch = original_fetch;
        }
    });

    it('replaces previously loaded custom sections on refresh', async () => {
        const admin_shell = create_admin_shell();
        let call_index = 0;
        const responses = [
            [{ id: 'logs', label: 'Logs', icon: 'L', api_path: '/api/admin/v1/logs' }],
            [{ id: 'metrics', label: 'Metrics', icon: 'M', api_path: '/api/admin/v1/metrics' }]
        ];

        admin_shell._fetch_json = () => {
            const response = responses[Math.min(call_index, responses.length - 1)];
            call_index += 1;
            return Promise.resolve(response);
        };

        await admin_shell._load_custom_sections();
        await admin_shell._load_custom_sections();

        const nav_html = admin_shell._nav.all_html_render();
        assert.strictEqual(admin_shell._custom_nav_items.length, 1);
        assert(nav_html.includes('M Metrics'));
        assert(!nav_html.includes('L Logs'));
    });

    it('toggles dashboard and dynamic sections through section selection logic', async () => {
        const admin_shell = create_admin_shell();

        let resources_called = 0;
        admin_shell._render_resources_section = () => {
            resources_called += 1;
            return Promise.resolve();
        };

        await admin_shell._select_section('resources');
        assert.strictEqual(resources_called, 1);
        assert(admin_shell._dashboard_section.has_class('hidden'));
        assert(!admin_shell._dynamic_section.has_class('hidden'));

        await admin_shell._select_section('dashboard');
        assert(!admin_shell._dashboard_section.has_class('hidden'));
        assert(admin_shell._dynamic_section.has_class('hidden'));
    });
});
