const assert = require('assert');
const path = require('path');
const { describe, it, before, after } = require('mocha');

const Server = require('../server');
const Website = require('jsgui3-website');
const Webpage = require('jsgui3-webpage');
const serve_site = require('../serve-site');
const { get_free_port } = require('../port-utils');
const {
    ensure_playwright_module,
    launch_playwright_browser,
    open_page,
    close_page_with_probe,
    stop_server_instance,
    assert_clean_page_probe,
    wait_for_text_content
} = require('./helpers/playwright-e2e-harness');

const activation_client_path = path.join(__dirname, 'fixtures', 'client-activation-client.js');
const auto_client_entry_control_path = path.join(__dirname, 'fixtures', 'auto-client-entry-control.js');

const load_activation_controls = () => {
    const resolved_client_path = require.resolve(activation_client_path);
    delete require.cache[resolved_client_path];
    const fixture_module = require(resolved_client_path);
    const app_ctrl_constructor = fixture_module.controls && fixture_module.controls.Activation_E2E_App;
    const widget_ctrl_constructor = fixture_module.controls && fixture_module.controls.Activation_E2E_Widget;
    assert(app_ctrl_constructor, `Missing exported control jsgui.controls.Activation_E2E_App in ${activation_client_path}`);
    assert(widget_ctrl_constructor, `Missing exported control jsgui.controls.Activation_E2E_Widget in ${activation_client_path}`);
    return { app_ctrl_constructor, widget_ctrl_constructor };
};

const load_activation_ctrl = () => load_activation_controls().app_ctrl_constructor;

const load_auto_client_entry_ctrl = () => {
    const resolved_control_path = require.resolve(auto_client_entry_control_path);
    delete require.cache[resolved_control_path];
    const fixture_module = require(resolved_control_path);
    assert(fixture_module.Auto_Client_Entry_Widget, `Missing Auto_Client_Entry_Widget in ${auto_client_entry_control_path}`);
    return fixture_module.Auto_Client_Entry_Widget;
};

const load_auto_client_entry_controls = () => {
    const resolved_control_path = require.resolve(auto_client_entry_control_path);
    delete require.cache[resolved_control_path];
    const fixture_module = require(resolved_control_path);
    assert(fixture_module.Auto_Client_Page_Placeholder, `Missing Auto_Client_Page_Placeholder in ${auto_client_entry_control_path}`);
    assert(fixture_module.Auto_Client_Entry_Widget, `Missing Auto_Client_Entry_Widget in ${auto_client_entry_control_path}`);
    return {
        page_placeholder_ctrl: fixture_module.Auto_Client_Page_Placeholder,
        auto_ctrl_constructor: fixture_module.Auto_Client_Entry_Widget
    };
};

const start_server_with_client_activation = async () => {
    const ctrl_constructor = load_activation_ctrl();
    const server_instance = new Server({
        Ctrl: ctrl_constructor,
        src_path_client_js: activation_client_path,
        name: 'tests/client-activation/server-serve'
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

const start_serve_site_activation_server = async () => {
    const { widget_ctrl_constructor } = load_activation_controls();
    const site = new Website({
        name: 'Activation Site',
        pages: {
            '/': new Webpage({
                id: 'activation_home',
                path: '/',
                title: 'Activation',
                client_js: activation_client_path,
                ctrl: widget_ctrl_constructor
            })
        }
    });

    const server_instance = await serve_site(site, { port: 'auto' });
    return { server_instance, port: server_instance.port };
};

const start_serve_site_auto_client_entry_server = async () => {
    const auto_ctrl_constructor = load_auto_client_entry_ctrl();
    const site = new Website({
        name: 'Auto Client Entry Site',
        pages: {
            '/': new Webpage({
                id: 'auto_activation_home',
                path: '/',
                title: 'Auto Activation',
                ctrl: auto_ctrl_constructor
            })
        }
    });

    const server_instance = await serve_site(site, { port: 'auto' });
    return { server_instance, port: server_instance.port };
};

const start_serve_site_dynamic_slot_client_controls_server = async () => {
    const { page_placeholder_ctrl, auto_ctrl_constructor } = load_auto_client_entry_controls();
    const site = new Website({
        name: 'Dynamic Slot Client Controls Site',
        pages: {
            '/': new Webpage({
                id: 'dynamic_activation_home',
                path: '/',
                title: 'Dynamic Activation',
                ctrl: page_placeholder_ctrl,
                slots: {
                    main: () => auto_ctrl_constructor
                },
                client_controls: [auto_ctrl_constructor]
            })
        }
    });

    const server_instance = await serve_site(site, { port: 'auto' });
    return { server_instance, port: server_instance.port };
};

const start_serve_site_metadata_client_entry_server = async () => {
    const auto_ctrl_constructor = load_auto_client_entry_ctrl();

    class Metadata_Auto_Client_Entry_Widget extends auto_ctrl_constructor {}
    Metadata_Auto_Client_Entry_Widget.client_module_path = auto_client_entry_control_path;
    Metadata_Auto_Client_Entry_Widget.client_export_name = 'Auto_Client_Entry_Widget';

    const site = new Website({
        name: 'Metadata Client Entry Site',
        pages: {
            '/': new Webpage({
                id: 'metadata_activation_home',
                path: '/',
                title: 'Metadata Activation',
                ctrl: Metadata_Auto_Client_Entry_Widget
            })
        }
    });

    const server_instance = await serve_site(site, { port: 'auto' });
    return { server_instance, port: server_instance.port };
};

describe('Client-side jsgui activation e2e', function () {
    this.timeout(240000);

    let playwright_module = null;
    let browser_instance = null;

    before(async function () {
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

    it('activates SSR controls when served through the existing Server Ctrl publisher', async () => {
        let server_instance = null;
        let page = null;
        let page_probe = null;

        try {
            const started_server = await start_server_with_client_activation();
            server_instance = started_server.server_instance;

            const open_result = await open_page(
                browser_instance,
                `http://127.0.0.1:${started_server.port}/`,
                { wait_until: 'load' }
            );
            page = open_result.page;
            page_probe = open_result.page_probe;

            await page.waitForSelector('[data-test="activation-root"]');
            await page.waitForFunction(() => {
                return window.__jsgui_activation_e2e && window.__jsgui_activation_e2e.activated === true;
            });

            const state = await page.getAttribute('[data-test="activation-root"]', 'data-activation-state');
            assert.strictEqual(state, 'activated');
            await wait_for_text_content(page, '[data-test="activation-status"]', 'activated');

            const bundle_statuses = await page.evaluate(async () => {
                const js_response = await fetch('/js/js.js', { cache: 'no-store' });
                const css_response = await fetch('/css/css.css', { cache: 'no-store' });
                return {
                    js_status: js_response.status,
                    css_status: css_response.status
                };
            });
            assert.strictEqual(bundle_statuses.js_status, 200);
            assert.strictEqual(bundle_statuses.css_status, 200);

            await page.click('[data-test="activation-button"]');
            await wait_for_text_content(page, '[data-test="activation-status"]', 'clicked:1');
            const click_count = await page.getAttribute('[data-test="activation-root"]', 'data-click-count');
            assert.strictEqual(click_count, '1');

            assert_clean_page_probe(page_probe);
        } finally {
            await close_page_with_probe(page, page_probe);
            await stop_server_instance(server_instance);
        }
    });

    it('activates Webpage controls through serve_site when client_js is declared', async () => {
        let server_instance = null;
        let page = null;
        let page_probe = null;

        try {
            const started_server = await start_serve_site_activation_server();
            server_instance = started_server.server_instance;

            const open_result = await open_page(
                browser_instance,
                `http://127.0.0.1:${started_server.port}/`,
                { wait_until: 'load' }
            );
            page = open_result.page;
            page_probe = open_result.page_probe;

            await page.waitForSelector('[data-test="activation-root"]');
            await page.waitForFunction(() => {
                return window.__jsgui_activation_e2e && window.__jsgui_activation_e2e.activated === true;
            });

            const state = await page.getAttribute('[data-test="activation-root"]', 'data-activation-state');
            assert.strictEqual(state, 'activated');

            await wait_for_text_content(page, '[data-test="activation-status"]', 'activated');

            const generated_asset_statuses = await page.evaluate(async () => {
                const script_src = Array.from(document.scripts)
                    .map((script) => script.getAttribute('src'))
                    .find((src) => src && src.includes('/js/'));
                const css_href = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                    .map((link) => link.getAttribute('href'))
                    .find((href) => href && href.includes('/css/'));
                const js_response = script_src ? await fetch(script_src, { cache: 'no-store' }) : null;
                const css_response = css_href ? await fetch(css_href, { cache: 'no-store' }) : null;
                return {
                    script_src,
                    css_href,
                    js_status: js_response && js_response.status,
                    css_status: css_response && css_response.status
                };
            });
            assert(generated_asset_statuses.script_src, 'Expected serve_site to inject a generated client JS script');
            assert(generated_asset_statuses.css_href, 'Expected serve_site to inject generated bundle CSS');
            assert.strictEqual(generated_asset_statuses.js_status, 200);
            assert.strictEqual(generated_asset_statuses.css_status, 200);

            await page.click('[data-test="activation-button"]');
            await wait_for_text_content(page, '[data-test="activation-status"]', 'clicked:1');

            assert_clean_page_probe(page_probe);
        } finally {
            await close_page_with_probe(page, page_probe);
            await stop_server_instance(server_instance);
        }
    });

    it('generates a serve_site client entry for module-exported controls without client_js', async () => {
        let server_instance = null;
        let page = null;
        let page_probe = null;

        try {
            const started_server = await start_serve_site_auto_client_entry_server();
            server_instance = started_server.server_instance;

            const open_result = await open_page(
                browser_instance,
                `http://127.0.0.1:${started_server.port}/`,
                { wait_until: 'load' }
            );
            page = open_result.page;
            page_probe = open_result.page_probe;

            await page.waitForSelector('[data-test="auto-activation-root"]');
            await page.waitForFunction(() => {
                return window.__jsgui_auto_client_entry_e2e
                    && window.__jsgui_auto_client_entry_e2e.activated === true;
            });

            const state = await page.getAttribute('[data-test="auto-activation-root"]', 'data-activation-state');
            assert.strictEqual(state, 'activated');
            await wait_for_text_content(page, '[data-test="auto-activation-status"]', 'activated');

            const generated_asset_statuses = await page.evaluate(async () => {
                const script_src = Array.from(document.scripts)
                    .map((script) => script.getAttribute('src'))
                    .find((src) => src && src.includes('/js/auto-activation-home.js'));
                const css_href = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                    .map((link) => link.getAttribute('href'))
                    .find((href) => href && href.includes('/css/auto-activation-home.css'));
                const js_response = script_src ? await fetch(script_src, { cache: 'no-store' }) : null;
                const css_response = css_href ? await fetch(css_href, { cache: 'no-store' }) : null;
                return {
                    script_src,
                    css_href,
                    js_status: js_response && js_response.status,
                    css_status: css_response && css_response.status
                };
            });
            assert(generated_asset_statuses.script_src, 'Expected generated serve_site client JS route');
            assert(generated_asset_statuses.css_href, 'Expected generated serve_site bundle CSS route');
            assert.strictEqual(generated_asset_statuses.js_status, 200);
            assert.strictEqual(generated_asset_statuses.css_status, 200);

            await page.click('[data-test="auto-activation-button"]');
            await wait_for_text_content(page, '[data-test="auto-activation-status"]', 'clicked:1');

            assert_clean_page_probe(page_probe);
        } finally {
            await close_page_with_probe(page, page_probe);
            await stop_server_instance(server_instance);
        }
    });

    it('uses client_controls metadata to activate dynamic slot function output', async () => {
        let server_instance = null;
        let page = null;
        let page_probe = null;

        try {
            const started_server = await start_serve_site_dynamic_slot_client_controls_server();
            server_instance = started_server.server_instance;

            const open_result = await open_page(
                browser_instance,
                `http://127.0.0.1:${started_server.port}/`,
                { wait_until: 'load' }
            );
            page = open_result.page;
            page_probe = open_result.page_probe;

            await page.waitForSelector('[data-test="auto-activation-root"]');
            await page.waitForFunction(() => {
                return window.__jsgui_auto_client_entry_e2e
                    && window.__jsgui_auto_client_entry_e2e.activated === true;
            });

            const state = await page.getAttribute('[data-test="auto-activation-root"]', 'data-activation-state');
            assert.strictEqual(state, 'activated');
            await wait_for_text_content(page, '[data-test="auto-activation-status"]', 'activated');

            const script_src = await page.evaluate(() => {
                return Array.from(document.scripts)
                    .map((script) => script.getAttribute('src'))
                    .find((src) => src && src.includes('/js/dynamic-activation-home.js'));
            });
            assert(script_src, 'Expected generated JS route for dynamic slot client_controls page');

            await page.click('[data-test="auto-activation-button"]');
            await wait_for_text_content(page, '[data-test="auto-activation-status"]', 'clicked:1');

            assert_clean_page_probe(page_probe);
        } finally {
            await close_page_with_probe(page, page_probe);
            await stop_server_instance(server_instance);
        }
    });

    it('uses static control module metadata when a constructor is not directly exported', async () => {
        let server_instance = null;
        let page = null;
        let page_probe = null;

        try {
            const started_server = await start_serve_site_metadata_client_entry_server();
            server_instance = started_server.server_instance;

            const open_result = await open_page(
                browser_instance,
                `http://127.0.0.1:${started_server.port}/`,
                { wait_until: 'load' }
            );
            page = open_result.page;
            page_probe = open_result.page_probe;

            await page.waitForSelector('[data-test="auto-activation-root"]');
            await page.waitForFunction(() => {
                return window.__jsgui_auto_client_entry_e2e
                    && window.__jsgui_auto_client_entry_e2e.activated === true;
            });

            const state = await page.getAttribute('[data-test="auto-activation-root"]', 'data-activation-state');
            assert.strictEqual(state, 'activated');

            const script_src = await page.evaluate(() => {
                return Array.from(document.scripts)
                    .map((script) => script.getAttribute('src'))
                    .find((src) => src && src.includes('/js/metadata-activation-home.js'));
            });
            assert(script_src, 'Expected generated JS route for metadata-backed page control');

            await page.click('[data-test="auto-activation-button"]');
            await wait_for_text_content(page, '[data-test="auto-activation-status"]', 'clicked:1');

            assert_clean_page_probe(page_probe);
        } finally {
            await close_page_with_probe(page, page_probe);
            await stop_server_instance(server_instance);
        }
    });
});