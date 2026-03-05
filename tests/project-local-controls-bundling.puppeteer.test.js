const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const { describe, it, before, after } = require('mocha');

const Server = require('../server');
const { get_free_port } = require('../port-utils');
const {
    ensure_puppeteer_module,
    launch_puppeteer_browser,
    open_page,
    stop_server_instance,
    assert_clean_page_probe,
    extract_esbuild_warning_headers_from_bundle,
    assert_no_unexpected_esbuild_warning_headers
} = require('./helpers/puppeteer-e2e-harness');

const window_markers = [
    'Minimize window',
    'window_manager',
    '__type_name = "window"',
    "__type_name = 'window'",
    "__type_name='window'",
    'add_class("window")',
    "add_class('window')"
];

const count_window_markers = (bundle_text = '') => {
    return window_markers.reduce((total, marker) => {
        return total + (bundle_text.includes(marker) ? 1 : 0);
    }, 0);
};

const allowed_esbuild_warning_patterns = [
    /\[different-path-case\]/
];

const get_server_esbuild_warning_headers = (server_instance) => {
    const latest_wp_bundle = server_instance && server_instance.latest_wp_bundle;
    assert(latest_wp_bundle, 'Expected server_instance.latest_wp_bundle to inspect esbuild warnings');
    return extract_esbuild_warning_headers_from_bundle(latest_wp_bundle);
};

const assert_no_unexpected_server_esbuild_warnings = (server_instance, {
    allowed_warning_patterns = [],
    required_warning_patterns = []
} = {}) => {
    const warning_headers = get_server_esbuild_warning_headers(server_instance);
    assert_no_unexpected_esbuild_warning_headers(warning_headers, {
        allowed_warning_patterns,
        required_warning_patterns
    });
    return warning_headers;
};

const temp_fixture_specs = [
    {
        file_name: 'temp_project_local_value_formatter.js',
        source_text: `
const format_click_count = (next_count) => {
    const normalized_count = Number.isFinite(next_count) ? next_count : 0;
    return 'Clicks: ' + String(normalized_count);
};

module.exports = { format_click_count };
`.trimStart()
    },
    {
        file_name: 'temp_project_local_status_chip.js',
        source_text: `
const jsgui = require('jsgui3-html');
const { Control } = jsgui;

class Project_Local_Status_Chip extends Control {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            const chip_label = spec.label || 'ready';
            this.add_class('project-local-status-chip');
            this.add('Status: ' + String(chip_label));
        }
    }
}

Project_Local_Status_Chip.css = \`
.project-local-status-chip {
    display: inline-block;
    padding: 4px 10px;
    border: 1px solid #8e44ad;
    border-radius: 999px;
    background: #f7ecff;
    color: #5c2c73;
    font-size: 12px;
}
\`;

module.exports = { Project_Local_Status_Chip };
`.trimStart()
    },
    {
        file_name: 'temp_project_local_counter_panel.js',
        source_text: `
const jsgui = require('jsgui3-html');
const controls_registry = jsgui['controls'];
const { Control } = jsgui;
const { format_click_count } = require('./temp_project_local_value_formatter');
const { Project_Local_Status_Chip } = require('./temp_project_local_status_chip');

class Project_Local_Counter_Panel extends Control {
    constructor(spec = {}) {
        super(spec);
        this._click_count = 0;
        if (!spec.el) {
            const context = this.context;
            this.add_class('project-local-counter-panel');

            const heading = new controls_registry.h3({ context });
            heading.dom.attributes['data-test'] = 'project-local-title';
            heading.add('Project Local Counter');
            this.add(heading);

            const count_readout = new controls_registry.div({ context });
            count_readout.dom.attributes['data-test'] = 'project-local-count';
            count_readout.add(format_click_count(this._click_count));
            this.add(count_readout);

            const increment_button = new controls_registry.button({ context });
            increment_button.dom.attributes.type = 'button';
            increment_button.dom.attributes['data-test'] = 'project-local-increment';
            increment_button.add('Increment');
            this.add(increment_button);

            const status_chip = new Project_Local_Status_Chip({
                context,
                label: 'loaded'
            });
            status_chip.dom.attributes['data-test'] = 'project-local-chip';
            this.add(status_chip);
        }
    }
}

Project_Local_Counter_Panel.css = \`
.project-local-counter-panel {
    margin: 16px;
    padding: 14px;
    border: 2px dashed #1f6feb;
    border-radius: 8px;
    background: #f8fbff;
}
\`;

module.exports = { Project_Local_Counter_Panel };
`.trimStart()
    },
    {
        file_name: 'temp_project_local_controls_client.js',
        source_text: `
const jsgui = require('jsgui3-html');
const controls_registry = jsgui['controls'];
const { Project_Local_Counter_Panel } = require('./temp_project_local_counter_panel');

if (typeof window !== 'undefined') {
    window.__project_local_controls_client_loaded = true;
}

class Project_Local_Bundling_App extends controls_registry['Active_HTML_Document'] {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'project_local_bundling_app';
        super(spec);

        if (!spec.el) {
            const context = this.context;
            const root = new controls_registry.div({ context });
            root.dom.attributes['data-test'] = 'project-local-root';
            root.add_class('project-local-root');
            root.add('Project-local controls loaded');

            const local_counter_panel = new Project_Local_Counter_Panel({ context });
            local_counter_panel.dom.attributes['data-test'] = 'project-local-counter-panel';
            root.add(local_counter_panel);

            this.body.add(root);
        }
    }
}

controls_registry.Project_Local_Counter_Panel = Project_Local_Counter_Panel;
controls_registry.Project_Local_Bundling_App = Project_Local_Bundling_App;

module.exports = jsgui;
`.trimStart()
    }
];

const write_temp_fixture_files = async () => {
    const fixture_dir_path = await fs.mkdtemp(path.join(__dirname, 'temp_project_local_controls_'));

    for (const fixture_spec of temp_fixture_specs) {
        const fixture_path = path.join(fixture_dir_path, fixture_spec.file_name);
        await fs.writeFile(fixture_path, fixture_spec.source_text, 'utf8');
    }

    return {
        fixture_dir_path,
        client_file_path: path.join(fixture_dir_path, 'temp_project_local_controls_client.js')
    };
};

const remove_fixture_dir_if_exists = async (fixture_dir_path) => {
    try {
        await fs.rm(fixture_dir_path, { recursive: true, force: true });
    } catch (err) {
        if (err && err.code !== 'ENOENT') {
            throw err;
        }
    }
};

const clear_require_cache_for_fixture_dir = (fixture_dir_path) => {
    if (!fixture_dir_path) {
        return;
    }

    const fixture_dir_prefix = fixture_dir_path.endsWith(path.sep)
        ? fixture_dir_path
        : `${fixture_dir_path}${path.sep}`;

    for (const cache_key of Object.keys(require.cache)) {
        if (cache_key.startsWith(fixture_dir_prefix)) {
            delete require.cache[cache_key];
        }
    }
};

const read_bundle_from_page = async (page, route_path) => {
    return page.evaluate(async (next_route_path) => {
        const response = await fetch(next_route_path, { cache: 'no-store' });
        const body_text = await response.text();
        return {
            status_code: response.status,
            body_text
        };
    }, route_path);
};

const load_fixture_control = (client_file_path, control_name, fixture_dir_path) => {
    clear_require_cache_for_fixture_dir(fixture_dir_path);
    const resolved_client_file_path = require.resolve(client_file_path);
    delete require.cache[resolved_client_file_path];

    const client_module = require(resolved_client_file_path);
    const control_constructor = client_module.controls && client_module.controls[control_name];
    assert(control_constructor, `Missing exported control jsgui.controls.${control_name} in ${client_file_path}`);
    return control_constructor;
};

const start_fixture_server = async ({ client_file_path, control_name, fixture_dir_path, bundler }) => {
    const control_constructor = load_fixture_control(client_file_path, control_name, fixture_dir_path);

    const server_instance = new Server({
        Ctrl: control_constructor,
        src_path_client_js: client_file_path,
        name: `tests/project-local/${control_name}`,
        bundler
    });

    server_instance.allowed_addresses = ['127.0.0.1'];

    await new Promise((resolve, reject) => {
        const timeout_handle = setTimeout(() => reject(new Error('Publisher ready timeout')), 60000);
        server_instance.on('ready', () => {
            clearTimeout(timeout_handle);
            resolve();
        });
    });

    const port = await get_free_port();
    await new Promise((resolve, reject) => {
        server_instance.start(port, (error) => {
            if (error) reject(error);
            else resolve();
        });
    });

    return {
        server_instance,
        port
    };
};

const close_page_with_probe = async (page, page_probe) => {
    if (page_probe && typeof page_probe.detach === 'function') {
        page_probe.detach();
    }
    if (page) {
        await page.close();
    }
};

const stop_server_instance_with_timeout = async (server_instance, timeout_ms = 12000) => {
    if (!server_instance) {
        return;
    }
    await Promise.race([
        stop_server_instance(server_instance),
        new Promise((resolve) => setTimeout(resolve, timeout_ms))
    ]);
};

const run_project_local_controls_scenario = async ({
    browser_instance,
    client_file_path,
    fixture_dir_path,
    bundler,
    allowed_warning_patterns = []
}) => {
    let server_instance = null;
    let page = null;
    let page_probe = null;

    try {
        const started_server = await start_fixture_server({
            client_file_path,
            control_name: 'Project_Local_Bundling_App',
            fixture_dir_path,
            bundler
        });
        server_instance = started_server.server_instance;

        const open_result = await open_page(
            browser_instance,
            `http://127.0.0.1:${started_server.port}/`,
            { wait_until: 'domcontentloaded' }
        );
        page = open_result.page;
        page_probe = open_result.page_probe;

        await page.waitForSelector('[data-test="project-local-root"]');
        await page.waitForSelector('[data-test="project-local-counter-panel"]');
        await page.waitForSelector('[data-test="project-local-chip"]');
        await page.waitForSelector('[data-test="project-local-increment"]');
        await page.waitForFunction(() => window.__project_local_controls_client_loaded === true, { timeout: 12000 });

        const initial_count_text = await page.$eval('[data-test="project-local-count"]', (element) => {
            return String(element.textContent || '').trim();
        });
        assert.strictEqual(initial_count_text, 'Clicks: 0');

        const js_bundle_response = await read_bundle_from_page(page, '/js/js.js');
        assert.strictEqual(js_bundle_response.status_code, 200, 'Expected /js/js.js to load');
        assert(js_bundle_response.body_text.includes('project-local-increment'), 'Expected project-local increment marker in JS bundle');
        assert(js_bundle_response.body_text.includes('Project Local Counter'), 'Expected project-local heading marker in JS bundle');

        const css_bundle_response = await read_bundle_from_page(page, '/css/css.css');
        assert.strictEqual(css_bundle_response.status_code, 200, 'Expected /css/css.css to load');
        assert(css_bundle_response.body_text.includes('.project-local-counter-panel'), 'Expected project-local panel CSS in CSS bundle');
        assert(css_bundle_response.body_text.includes('.project-local-status-chip'), 'Expected project-local status-chip CSS in CSS bundle');

        assert_no_unexpected_server_esbuild_warnings(server_instance, { allowed_warning_patterns });

        assert_clean_page_probe(page_probe);

        return {
            js_bytes: Buffer.byteLength(js_bundle_response.body_text, 'utf8'),
            css_bytes: Buffer.byteLength(css_bundle_response.body_text, 'utf8'),
            window_marker_count: count_window_markers(js_bundle_response.body_text)
        };
    } finally {
        await close_page_with_probe(page, page_probe);
        await stop_server_instance_with_timeout(server_instance);
    }
};

describe('Project-Local Controls Bundling Puppeteer E2E Tests', function () {
    this.timeout(420000);

    let puppeteer_module = null;
    let browser_instance = null;
    let fixture_dir_path = null;
    let fixture_client_file_path = null;

    before(async function () {
        this.timeout(90000);
        const fixture_write_result = await write_temp_fixture_files();
        fixture_dir_path = fixture_write_result.fixture_dir_path;
        fixture_client_file_path = fixture_write_result.client_file_path;

        puppeteer_module = ensure_puppeteer_module();
        if (!puppeteer_module) {
            this.skip();
            return;
        }

        try {
            browser_instance = await launch_puppeteer_browser(puppeteer_module);
        } catch {
            this.skip();
        }
    });

    after(async function () {
        if (browser_instance) {
            await browser_instance.close();
            browser_instance = null;
        }

        clear_require_cache_for_fixture_dir(fixture_dir_path);
        await remove_fixture_dir_if_exists(fixture_dir_path);
        fixture_dir_path = null;
        fixture_client_file_path = null;
    });

    it('bundles and runs project-local controls with default elimination', async function () {
        const metrics = await run_project_local_controls_scenario({
            browser_instance,
            client_file_path: fixture_client_file_path,
            fixture_dir_path
        });

        assert(metrics.js_bytes > 1000, 'Expected non-trivial JS bundle size for project-local controls');
        assert(metrics.css_bytes > 100, 'Expected non-trivial CSS bundle size for project-local controls');
        assert.strictEqual(
            metrics.window_marker_count,
            0,
            'Expected default elimination to remove unused Window control code for project-local app'
        );
    });

    it('keeps project-local controls working when elimination is disabled and default bundle stays smaller', async function () {
        const default_metrics = await run_project_local_controls_scenario({
            browser_instance,
            client_file_path: fixture_client_file_path,
            fixture_dir_path
        });
        const elimination_disabled_metrics = await run_project_local_controls_scenario({
            browser_instance,
            client_file_path: fixture_client_file_path,
            fixture_dir_path,
            allowed_warning_patterns: allowed_esbuild_warning_patterns,
            bundler: {
                elimination: {
                    enabled: false,
                    jsgui3_html_controls: {
                        enabled: false
                    }
                }
            }
        });

        assert(elimination_disabled_metrics.js_bytes > 1000, 'Expected non-trivial JS bundle size with elimination disabled');
        assert(elimination_disabled_metrics.css_bytes > 100, 'Expected non-trivial CSS bundle size with elimination disabled');
        assert(
            elimination_disabled_metrics.window_marker_count > 0,
            'Expected elimination-disabled bundle to retain Window control markers'
        );
        assert(
            default_metrics.js_bytes < elimination_disabled_metrics.js_bytes,
            'Expected default elimination JS bundle to stay smaller than elimination-disabled bundle'
        );
    });
});
