const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { describe, it, before, after } = require('mocha');

const Server = require('../server');
const { get_free_port } = require('../port-utils');

const repo_root_path = path.join(__dirname, '..');
const examples_controls_root_path = path.join(repo_root_path, 'examples', 'controls');
const screenshots_root_path = path.join(repo_root_path, 'tests', 'screenshots', 'windows');

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
    await page.goto(base_url, { waitUntil: 'load' });

    return page;
};

const normalize_screenshot_label = (value) => {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
};

const build_screenshot_name = (story_name, step_name) => {
    const story_label = normalize_screenshot_label(story_name);
    const step_label = normalize_screenshot_label(step_name);
    return `${story_label}__${step_label}`;
};

const ensure_screenshots_dir = () => {
    fs.mkdirSync(screenshots_root_path, { recursive: true });
};

const capture_screenshot = async (page, story_name, step_name) => {
    ensure_screenshots_dir();
    const screenshot_name = build_screenshot_name(story_name, step_name);
    const file_path = path.join(screenshots_root_path, `${screenshot_name}.png`);
    await page.screenshot({ path: file_path, fullPage: true });
    const stats = fs.statSync(file_path);
    assert.ok(stats.size > 0, `Expected screenshot to be written: ${file_path}`);
    return file_path;
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

const get_window_bcr = async (page, selector = '.window') => {
    return page.$eval(selector, (el) => {
        const rect = el.getBoundingClientRect();
        return {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom
        };
    });
};

const drag_window_by = async (page, selector, delta_x, delta_y) => {
    const handle = await page.$(selector);
    assert(handle, `Missing drag handle for selector: ${selector}`);
    const box = await handle.boundingBox();
    assert(box, `Missing bounding box for selector: ${selector}`);
    const start_x = box.x + box.width / 2;
    const start_y = box.y + box.height / 2;
    await page.mouse.move(start_x, start_y);
    await page.mouse.down();
    await page.mouse.move(start_x + delta_x, start_y + delta_y, { steps: 10 });
    await page.mouse.up();
};

const resize_window_by = async (page, selector, delta_x, delta_y) => {
    const handle = await page.$(selector);
    assert(handle, `Missing resize handle for selector: ${selector}`);
    const box = await handle.boundingBox();
    assert(box, `Missing bounding box for selector: ${selector}`);
    const start_x = box.x + box.width / 2;
    const start_y = box.y + box.height / 2;
    await page.mouse.move(start_x, start_y);
    await page.mouse.down();
    await page.mouse.move(start_x + delta_x, start_y + delta_y, { steps: 10 });
    await page.mouse.up();
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

            await capture_screenshot(page, '1) window', 'before_minimize');
            await button_handles[0].click();
            await wait_for_class_state(page, '.window', 'minimized', true);
            await capture_screenshot(page, '1) window', 'after_minimize');

            await button_handles[0].click();
            await wait_for_class_state(page, '.window', 'minimized', false);
            await capture_screenshot(page, '1) window', 'after_restore');
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server);
        }
    });

    it('maximize button toggles window state in "1) window"', async function () {
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

            await capture_screenshot(page, '1) window', 'before_maximize');
            await button_handles[1].click();
            await wait_for_class_state(page, '.window', 'maximized', true);
            await capture_screenshot(page, '1) window', 'after_maximize');

            await button_handles[1].click();
            await wait_for_class_state(page, '.window', 'maximized', false);
            await capture_screenshot(page, '1) window', 'after_unmaximize');
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server);
        }
    });

    it('dragging the title bar moves the window in "1) window"', async function () {
        const { server, port } = await start_example_server({
            dir_name: '1) window',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('.window .title.bar');

            const initial_bcr = await get_window_bcr(page);
            await capture_screenshot(page, '1) window', 'before_drag');

            await drag_window_by(page, '.window .title.bar', 120, 80);
            await page.waitForTimeout(150);

            const moved_bcr = await get_window_bcr(page);
            assert.ok(
                moved_bcr.left > initial_bcr.left + 10,
                `Expected window to move right (from ${initial_bcr.left} to ${moved_bcr.left})`
            );
            assert.ok(
                moved_bcr.top > initial_bcr.top + 10,
                `Expected window to move down (from ${initial_bcr.top} to ${moved_bcr.top})`
            );
            await capture_screenshot(page, '1) window', 'after_drag');
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server);
        }
    });

    it('resizing updates window bounds in "1) window"', async function () {
        const { server, port } = await start_example_server({
            dir_name: '1) window',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('.window .bottom-right.resize-handle');

            const initial_bcr = await get_window_bcr(page);
            await capture_screenshot(page, '1) window', 'before_resize');

            await resize_window_by(page, '.window .bottom-right.resize-handle', 120, 80);
            await page.waitForTimeout(150);

            const resized_bcr = await get_window_bcr(page);
            assert.ok(
                resized_bcr.width > initial_bcr.width + 20,
                `Expected width to increase (from ${initial_bcr.width} to ${resized_bcr.width})`
            );
            assert.ok(
                resized_bcr.height > initial_bcr.height + 20,
                `Expected height to increase (from ${initial_bcr.height} to ${resized_bcr.height})`
            );
            await capture_screenshot(page, '1) window', 'after_resize');
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server);
        }
    });

    it('focus and close behaviors work in "2) two windows"', async function () {
        const { server, port } = await start_example_server({
            dir_name: '2) two windows',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('.window .title.bar');

            const window_handles = await page.$$('.window');
            assert.strictEqual(window_handles.length, 2, 'Expected two windows');

            await capture_screenshot(page, '2) two windows', 'initial');

            const title_handle = await window_handles[1].$('.title.bar');
            assert(title_handle, 'Missing title bar for second window');
            await title_handle.click();

            await page.waitForFunction(() => {
                const windows = document.querySelectorAll('.window');
                if (windows.length < 2) return false;
                const z_first = parseInt(window.getComputedStyle(windows[0]).zIndex, 10) || 0;
                const z_second = parseInt(window.getComputedStyle(windows[1]).zIndex, 10) || 0;
                return z_second > z_first;
            });

            await capture_screenshot(page, '2) two windows', 'after_focus');

            const button_handles = await window_handles[1].$$('.title.bar button.button');
            assert.strictEqual(button_handles.length, 3, 'Expected minimize/maximize/close buttons');
            await button_handles[2].click();

            await page.waitForFunction(() => document.querySelectorAll('.window').length === 1);
            await capture_screenshot(page, '2) two windows', 'after_close');
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
