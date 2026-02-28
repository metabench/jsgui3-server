const assert = require('assert');
const path = require('path');
const { describe, it, before, after } = require('mocha');

const Server = require('../server');
const { get_free_port } = require('../port-utils');
const {
    ensure_playwright_module,
    launch_playwright_browser,
    open_page,
    close_page_with_probe,
    stop_server_instance,
    assert_clean_page_probe
} = require('./helpers/playwright-e2e-harness');

const button_fixture_client_path = path.join(__dirname, 'fixtures', 'bundling-default-button-client.js');

const load_fixture_ctrl = (client_path, ctrl_name) => {
    const resolved_client_path = require.resolve(client_path);
    delete require.cache[resolved_client_path];

    const fixture_module = require(resolved_client_path);
    const ctrl_constructor = fixture_module.controls && fixture_module.controls[ctrl_name];
    assert(ctrl_constructor, `Missing exported control jsgui.controls.${ctrl_name} in ${client_path}`);
    return ctrl_constructor;
};

const start_fixture_server = async ({ client_path, ctrl_name }) => {
    const ctrl_constructor = load_fixture_ctrl(client_path, ctrl_name);

    const server_instance = new Server({
        Ctrl: ctrl_constructor,
        src_path_client_js: client_path,
        name: `tests/playwright/${ctrl_name}`
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

describe('Playwright Smoke Tests', function () {
    this.timeout(240000);

    let playwright_module = null;
    let browser_instance = null;

    before(async function () {
        this.timeout(60000);

        playwright_module = ensure_playwright_module();
        if (!playwright_module) {
            this.skip();
            return;
        }

        try {
            browser_instance = await launch_playwright_browser(playwright_module);
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

    it('opens a locally served page and verifies core webpage assets', async function () {
        let server_instance = null;
        let page = null;
        let page_probe = null;

        try {
            const started_server = await start_fixture_server({
                client_path: button_fixture_client_path,
                ctrl_name: 'Bundling_Default_Button_App'
            });

            server_instance = started_server.server_instance;

            const open_result = await open_page(
                browser_instance,
                `http://127.0.0.1:${started_server.port}/`,
                { wait_until: 'domcontentloaded' }
            );
            page = open_result.page;
            page_probe = open_result.page_probe;

            await page.waitForSelector('[data-test="bundle-test-button"]');

            const button_text = await page.textContent('[data-test="bundle-test-button"]');
            assert.strictEqual((button_text || '').trim(), 'Run', 'Expected rendered button text from fixture control');

            const bundle_statuses = await page.evaluate(async () => {
                const js_response = await fetch('/js/js.js', { cache: 'no-store' });
                const css_response = await fetch('/css/css.css', { cache: 'no-store' });
                return {
                    js_status: js_response.status,
                    css_status: css_response.status
                };
            });

            assert.strictEqual(bundle_statuses.js_status, 200, 'Expected JavaScript bundle to be served');
            assert.strictEqual(bundle_statuses.css_status, 200, 'Expected CSS bundle to be served');

            assert_clean_page_probe(page_probe);
        } finally {
            await close_page_with_probe(page, page_probe);
            await stop_server_instance(server_instance);
        }
    });
});
