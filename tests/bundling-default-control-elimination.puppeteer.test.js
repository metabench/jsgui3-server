const assert = require('assert');
const path = require('path');
const { describe, it, before, after } = require('mocha');

const Server = require('../server');
const { get_free_port } = require('../port-utils');
const {
    ensure_puppeteer_module,
    launch_puppeteer_browser,
    open_page,
    stop_server_instance,
    assert_clean_page_probe
} = require('./helpers/puppeteer-e2e-harness');

const button_fixture_client_path = path.join(__dirname, 'fixtures', 'bundling-default-button-client.js');
const window_fixture_client_path = path.join(__dirname, 'fixtures', 'bundling-default-window-client.js');

const window_markers = [
    'Minimize window',
    'window_manager',
    '__type_name = "window"',
    "__type_name = 'window'",
    "__type_name='window'",
    'add_class("window")',
    "add_class('window')"
];

const find_window_markers = (bundle_text = '') => {
    return window_markers.filter((marker) => bundle_text.includes(marker));
};

const read_js_bundle_from_page = async (page) => {
    return page.evaluate(async () => {
        const response = await fetch('/js/js.js', { cache: 'no-store' });
        const text = await response.text();
        return {
            status_code: response.status,
            body_text: text
        };
    });
};

const load_fixture_ctrl = (client_path, ctrl_name) => {
    const resolved_client_path = require.resolve(client_path);
    delete require.cache[resolved_client_path];

    const fixture_module = require(resolved_client_path);
    const ctrl_constructor = fixture_module.controls && fixture_module.controls[ctrl_name];
    assert(ctrl_constructor, `Missing exported control jsgui.controls.${ctrl_name} in ${client_path}`);
    return ctrl_constructor;
};

const start_fixture_server = async ({ client_path, ctrl_name, bundler }) => {
    const ctrl_constructor = load_fixture_ctrl(client_path, ctrl_name);

    const server_instance = new Server({
        Ctrl: ctrl_constructor,
        src_path_client_js: client_path,
        name: `tests/bundling/${ctrl_name}`,
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

describe('Bundling Default Control Elimination Puppeteer Tests', function () {
    this.timeout(420000);

    let puppeteer_module = null;
    let browser_instance = null;

    before(async function () {
        this.timeout(60000);

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
    });

    it('removes unused Window code by default and restores it when elimination is disabled', async function () {
        this.timeout(360000);
        let default_server_instance = null;
        let disabled_server_instance = null;
        let default_page = null;
        let disabled_page = null;
        let default_page_probe = null;
        let disabled_page_probe = null;

        try {
            const default_server = await start_fixture_server({
                client_path: button_fixture_client_path,
                ctrl_name: 'Bundling_Default_Button_App'
            });
            default_server_instance = default_server.server_instance;

            const default_open_result = await open_page(
                browser_instance,
                `http://127.0.0.1:${default_server.port}/`,
                { wait_until: 'domcontentloaded' }
            );
            default_page = default_open_result.page;
            default_page_probe = default_open_result.page_probe;

            await default_page.waitForSelector('[data-test="bundle-test-button"]');

            const default_bundle_response = await read_js_bundle_from_page(default_page);
            assert.strictEqual(default_bundle_response.status_code, 200, 'Expected /js/js.js to load in default mode');
            const default_markers = find_window_markers(default_bundle_response.body_text);
            assert.strictEqual(
                default_markers.length,
                0,
                `Unexpected Window markers in default bundle: ${default_markers.join(', ')}`
            );

            assert_clean_page_probe(default_page_probe);

            await close_page_with_probe(default_page, default_page_probe);
            default_page = null;
            default_page_probe = null;

            const disabled_server = await start_fixture_server({
                client_path: button_fixture_client_path,
                ctrl_name: 'Bundling_Default_Button_App',
                bundler: {
                    elimination: {
                        enabled: false,
                        jsgui3_html_controls: {
                            enabled: false
                        }
                    }
                }
            });
            disabled_server_instance = disabled_server.server_instance;

            const disabled_open_result = await open_page(
                browser_instance,
                `http://127.0.0.1:${disabled_server.port}/`,
                { wait_until: 'domcontentloaded' }
            );
            disabled_page = disabled_open_result.page;
            disabled_page_probe = disabled_open_result.page_probe;

            await disabled_page.waitForSelector('[data-test="bundle-test-button"]');

            const disabled_bundle_response = await read_js_bundle_from_page(disabled_page);
            assert.strictEqual(disabled_bundle_response.status_code, 200, 'Expected /js/js.js to load in disabled mode');
            const disabled_markers = find_window_markers(disabled_bundle_response.body_text);
            assert(
                disabled_markers.length > 0,
                'Expected Window markers when elimination is explicitly disabled'
            );

            assert(
                default_bundle_response.body_text.length < disabled_bundle_response.body_text.length,
                'Expected default bundle to be smaller than elimination-disabled bundle'
            );

            assert_clean_page_probe(disabled_page_probe);
        } finally {
            await close_page_with_probe(default_page, default_page_probe);
            await close_page_with_probe(disabled_page, disabled_page_probe);
            await stop_server_instance_with_timeout(default_server_instance);
            await stop_server_instance_with_timeout(disabled_server_instance);
        }
    });

    it('keeps Window code in the default bundle when Window control is used', async () => {
        let server_instance = null;
        let page = null;
        let page_probe = null;

        try {
            const started_server = await start_fixture_server({
                client_path: window_fixture_client_path,
                ctrl_name: 'Bundling_Default_Window_App'
            });
            server_instance = started_server.server_instance;

            const open_result = await open_page(
                browser_instance,
                `http://127.0.0.1:${started_server.port}/`,
                { wait_until: 'domcontentloaded' }
            );
            page = open_result.page;
            page_probe = open_result.page_probe;

            await page.waitForSelector('.bundle-test-window');
            await page.waitForSelector('.bundle-test-window-content');

            const window_buttons = await page.$$('.bundle-test-window .title.bar button.button');
            assert(window_buttons.length >= 2, 'Expected window title bar controls to be rendered');

            const bundle_response = await read_js_bundle_from_page(page);
            assert.strictEqual(bundle_response.status_code, 200, 'Expected /js/js.js to load');
            const markers = find_window_markers(bundle_response.body_text);
            assert(markers.length > 0, 'Expected Window markers when Window control is used');

            assert_clean_page_probe(page_probe);
        } finally {
            await close_page_with_probe(page, page_probe);
            await stop_server_instance_with_timeout(server_instance);
        }
    });
});
