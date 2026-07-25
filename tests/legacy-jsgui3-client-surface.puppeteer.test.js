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

// End-to-end guard for the legacy jsgui3-client consumption surface.
//
// The older examples reach jsgui3-html entirely through jsgui3-client's
// re-exports (`const {controls, Control, mixins} = require('jsgui3-client')`).
// The serving bundler substitutes a pruning shim for jsgui3-html — including
// the require inside jsgui3-client — so any scan blind spot on this surface
// hollows out the re-exports: mixins became undefined (crashing activation of
// ~25 examples) and stock control CSS vanished (chrome-less windows). This
// test serves a legacy-style app with the DEFAULT bundler configuration and
// asserts the page activates cleanly with real Window chrome.

const legacy_fixture_client_path = path.join(__dirname, 'fixtures', 'legacy-jsgui3-client-surface-client.js');

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
        name: `tests/legacy-surface/${ctrl_name}`
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

    return { server_instance, port };
};

describe('Legacy jsgui3-client surface puppeteer tests', function () {
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

    it('activates a jsgui3-client style app with mixins and Window chrome intact', async function () {
        this.timeout(360000);
        let server_instance = null;
        let page = null;
        let page_probe = null;

        try {
            const started_server = await start_fixture_server({
                client_path: legacy_fixture_client_path,
                ctrl_name: 'Legacy_Client_Surface_App'
            });
            server_instance = started_server.server_instance;

            const open_result = await open_page(
                browser_instance,
                `http://127.0.0.1:${started_server.port}/`,
                { wait_until: 'domcontentloaded' }
            );
            page = open_result.page;
            page_probe = open_result.page_probe;

            // Server-rendered window present.
            await page.waitForSelector('.legacy-surface-window');
            await page.waitForSelector('.legacy-surface-window-content');

            // Client-side activation completed — before the jsgui3-client alias
            // fix the bundle threw at module load and this class never appeared.
            await page.waitForSelector('.legacy-surface-activated', { timeout: 30000 });

            // Window chrome CSS was served and applied (the .window rules set
            // position: absolute; without them windows render in document flow).
            const window_position = await page.$eval(
                '.legacy-surface-window',
                (element) => getComputedStyle(element).position
            );
            assert.strictEqual(window_position, 'absolute',
                'Expected .window CSS to be applied (position: absolute) to the Window control');

            // The mixins module made it into the served JS bundle.
            const bundle_response = await page.evaluate(async () => {
                const response = await fetch('/js/js.js', { cache: 'no-store' });
                const text = await response.text();
                return { status_code: response.status, body_text: text };
            });
            assert.strictEqual(bundle_response.status_code, 200, 'Expected /js/js.js to load');
            assert(bundle_response.body_text.includes('dragable'),
                'Expected the dragable mixin to be present in the served JS bundle');

            // No page errors or console errors during load and activation.
            assert_clean_page_probe(page_probe);
        } finally {
            if (page_probe && typeof page_probe.detach === 'function') {
                page_probe.detach();
            }
            if (page) {
                await page.close();
            }
            if (server_instance) {
                await Promise.race([
                    stop_server_instance(server_instance),
                    new Promise((resolve) => setTimeout(resolve, 12000))
                ]);
            }
        }
    });
});
