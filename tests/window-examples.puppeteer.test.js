const assert = require('assert');
const path = require('path');
const { describe, it, before, after } = require('mocha');

const Server = require('../server');
const { get_free_port } = require('../port-utils');

const repo_root_path = path.join(__dirname, '..');
const examples_controls_root_path = path.join(repo_root_path, 'examples', 'controls');

let puppeteer;
let browser;

const launch_puppeteer_browser = async () => {
    const launch_options = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launch_options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    return puppeteer.launch(launch_options);
};

const start_example_server = async ({ dir_name, ctrl_name }) => {
    const example_dir_path = path.join(examples_controls_root_path, dir_name);
    const example_client_path = path.join(example_dir_path, 'client.js');

    const jsgui = require(example_client_path);
    const ctrl = jsgui.controls && jsgui.controls[ctrl_name];
    assert(ctrl, `Missing exported control jsgui.controls.${ctrl_name} in ${example_client_path}`);

    const server = new Server({
        Ctrl: ctrl,
        src_path_client_js: example_client_path,
        name: `examples/controls/${dir_name}`
    });

    server.allowed_addresses = ['127.0.0.1'];

    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Publisher ready timeout')), 60000);
        server.on('ready', () => {
            clearTimeout(timeout);
            resolve();
        });
    });

    const port = await get_free_port();
    await new Promise((resolve, reject) => {
        server.start(port, (err) => (err ? reject(err) : resolve()));
    });

    return { server, port };
};

const stop_example_server = async (server) => {
    await new Promise((resolve) => server.close(resolve));
};

const open_example_page = async (port) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    const base_url = `http://127.0.0.1:${port}/`;
    await page.goto(base_url, { waitUntil: 'domcontentloaded' });

    return page;
};

const wait_for_class_state = async (page, selector, class_name, expected) => {
    await page.waitForFunction(
        (selector_arg, class_arg, expected_arg) => {
            const element = document.querySelector(selector_arg);
            if (!element) return false;
            const has_class = element.classList.contains(class_arg);
            return expected_arg ? has_class : !has_class;
        },
        {},
        selector,
        class_name,
        expected
    );
};

const get_tab_page_display = async (page) => {
    return page.evaluate(() => {
        return Array.from(document.querySelectorAll('.tab-page')).map((page_el) => {
            return window.getComputedStyle(page_el).display;
        });
    });
};

const get_checkbox_state = async (page) => {
    return page.$eval('.checkbox input[type="checkbox"]', (el) => el.checked);
};

describe('Window Examples Puppeteer Tests', function () {
    this.timeout(180000);

    before(async function () {
        this.timeout(60000);
        try {
            puppeteer = require('puppeteer');
        } catch (error) {
            this.skip();
            return;
        }

        try {
            browser = await launch_puppeteer_browser();
        } catch (error) {
            this.skip();
        }
    });

    after(async function () {
        if (browser) {
            await browser.close();
            browser = null;
        }
    });

    it('minimize button toggles window state in "1) window"', async function () {
        const { server, port } = await start_example_server({
            dir_name: '1) window',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('.window .title.bar');

            const button_handles = await page.$$('.window .title.bar button.button');
            assert.strictEqual(button_handles.length, 3, 'Expected minimize/maximize/close buttons');

            await button_handles[0].click();
            await wait_for_class_state(page, '.window', 'minimized', true);

            await button_handles[0].click();
            await wait_for_class_state(page, '.window', 'minimized', false);
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server);
        }
    });

    it('tab switching updates visible page in "4) window, tabbed panel"', async function () {
        const { server, port } = await start_example_server({
            dir_name: '4) window, tabbed panel',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('.tab-container');

            const tab_labels = await page.$$('.tab-label');
            assert.strictEqual(tab_labels.length, 2, 'Expected two tab labels');

            const display_before = await get_tab_page_display(page);
            assert.notStrictEqual(display_before[0], 'none', 'First tab should be visible');
            assert.strictEqual(display_before[1], 'none', 'Second tab should be hidden initially');

            await tab_labels[1].click();
            const display_after = await get_tab_page_display(page);
            assert.strictEqual(display_after[0], 'none', 'First tab should be hidden after switch');
            assert.notStrictEqual(display_after[1], 'none', 'Second tab should be visible after switch');
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server);
        }
    });

    it('checkbox label toggles input in "8) window, checkbox/a)"', async function () {
        const { server, port } = await start_example_server({
            dir_name: '8) window, checkbox/a)',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('.checkbox input[type="checkbox"]');

            const label_text = await page.$eval('.checkbox label', (el) => el.textContent.trim());
            assert.strictEqual(label_text, 'A checkbox');

            const initial_checked = await get_checkbox_state(page);
            assert.strictEqual(initial_checked, false, 'Checkbox should start unchecked');

            await page.click('.checkbox label');
            await page.waitForFunction(() => {
                const el = document.querySelector('.checkbox input[type="checkbox"]');
                return el && el.checked === true;
            });

            await page.click('.checkbox label');
            await page.waitForFunction(() => {
                const el = document.querySelector('.checkbox input[type="checkbox"]');
                return el && el.checked === false;
            });
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server);
        }
    });

    it('date picker renders native input in "9) window, date picker"', async function () {
        const { server, port } = await start_example_server({
            dir_name: '9) window, date picker',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('input.date-picker[type="date"]');

            const input_type = await page.$eval('input.date-picker', (el) => el.getAttribute('type'));
            assert.strictEqual(input_type, 'date', 'Expected native date input');
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server);
        }
    });
});
