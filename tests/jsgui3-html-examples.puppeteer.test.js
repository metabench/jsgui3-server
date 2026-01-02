const assert = require('assert');
const path = require('path');
const fs = require('fs').promises;
const { describe, it, before, after } = require('mocha');

const Server = require('../server');
const { get_free_port } = require('../port-utils');

const repo_root_path = path.join(__dirname, '..');
const examples_root_path = path.join(repo_root_path, 'examples', 'jsgui3-html');
const fixtures_root_path = path.join(__dirname, 'fixtures', 'jsgui3-html');

let puppeteer;
let browser_instance;

const launch_browser = async () => {
    const launch_options = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    };

    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launch_options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    return puppeteer.launch(launch_options);
};

const load_fixture = async (fixture_name) => {
    const fixture_path = path.join(fixtures_root_path, fixture_name);
    const raw_fixture = await fs.readFile(fixture_path, 'utf8');
    return JSON.parse(raw_fixture);
};

const start_example_server = async ({ dir_name, ctrl_name }) => {
    const example_dir_path = path.join(examples_root_path, dir_name);
    const example_client_path = path.join(example_dir_path, 'client.js');

    const jsgui = require(example_client_path);
    const ctrl = jsgui.controls && jsgui.controls[ctrl_name];
    assert(ctrl, `Missing exported control jsgui.controls.${ctrl_name} in ${example_client_path}`);

    const server_instance = new Server({
        Ctrl: ctrl,
        src_path_client_js: example_client_path,
        name: `examples/jsgui3-html/${dir_name}`
    });

    server_instance.allowed_addresses = ['127.0.0.1'];

    await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Publisher ready timeout')), 60000);
        server_instance.on('ready', () => {
            clearTimeout(timeout);
            resolve();
        });
    });

    const port = await get_free_port();
    await new Promise((resolve, reject) => {
        server_instance.start(port, (err) => (err ? reject(err) : resolve()));
    });

    return { server_instance, port };
};

const stop_example_server = async (server_instance) => {
    await new Promise((resolve) => server_instance.close(resolve));
};

const open_example_page = async (port) => {
    const page = await browser_instance.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
    return page;
};

const wait_for_text = async (page, selector, expected_text) => {
    await page.waitForFunction(
        (selector_arg, expected_arg) => {
            const element = document.querySelector(selector_arg);
            if (!element) return false;
            return element.textContent.trim() === expected_arg;
        },
        {},
        selector,
        expected_text
    );
};

const wait_for_input_value = async (page, selector, expected_value) => {
    await page.waitForFunction(
        (selector_arg, expected_arg) => {
            const element = document.querySelector(selector_arg);
            if (!element) return false;
            return element.value === expected_arg;
        },
        {},
        selector,
        expected_value
    );
};

const wait_for_class = async (page, selector, class_name, expected_state) => {
    await page.waitForFunction(
        (selector_arg, class_arg, expected_arg) => {
            const element = document.querySelector(selector_arg);
            if (!element) return false;
            return element.classList.contains(class_arg) === expected_arg;
        },
        {},
        selector,
        class_name,
        expected_state
    );
};

const ensure_classes = async (page, selector, expected_classes) => {
    const class_list = await page.$eval(selector, (el) => Array.from(el.classList));
    expected_classes.forEach((class_name) => {
        assert(
            class_list.includes(class_name),
            `Expected ${selector} to include class '${class_name}', got ${class_list.join(', ')}`
        );
    });
};

const set_input_value = async (page, selector, next_value) => {
    await page.$eval(
        selector,
        (el, value) => {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        },
        next_value
    );
};

const get_grid_names = async (page) => {
    return page.$$eval('[data-test="grid-body"] tr', (rows) => {
        return rows.map((row) => {
            const cell = row.querySelector('[data-col="name"]');
            return cell ? cell.textContent.trim() : '';
        });
    });
};

const wait_for_first_grid_name = async (page, expected_name) => {
    await page.waitForFunction(
        (expected_name_arg) => {
            const first_row = document.querySelector('[data-test="grid-body"] tr');
            if (!first_row) return false;
            const cell = first_row.querySelector('[data-col="name"]');
            if (!cell) return false;
            return cell.textContent.trim() === expected_name_arg;
        },
        {},
        expected_name
    );
};

describe('JSGUI3-HTML Example Puppeteer Tests', function () {
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
            browser_instance = await launch_browser();
        } catch (error) {
            this.skip();
        }
    });

    after(async function () {
        if (browser_instance) {
            await browser_instance.close();
            browser_instance = null;
        }
    });

    it('supports MVVM bindings and validation in mvvm-counter example', async function () {
        const expectations = await load_fixture('counter_expectations.json');
        const { server_instance, port } = await start_example_server({
            dir_name: '01) mvvm-counter',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('[data-test="counter-display"]');

            await wait_for_text(page, '[data-test="counter-display"]', expectations.initial.display_text);
            await wait_for_text(page, '[data-test="counter-status"]', expectations.initial.status_text);
            await ensure_classes(page, '[data-test="counter-display"]', expectations.initial.display_classes);

            await page.click('[data-test="increment-button"]');
            await wait_for_text(page, '[data-test="counter-display"]', expectations.after_increment.display_text);
            await wait_for_text(page, '[data-test="counter-status"]', expectations.after_increment.status_text);
            await ensure_classes(page, '[data-test="counter-display"]', expectations.after_increment.display_classes);

            await page.click('[data-test="increment-button"]');
            await wait_for_text(page, '[data-test="counter-display"]', expectations.after_second_increment.display_text);
            await wait_for_text(page, '[data-test="counter-status"]', expectations.after_second_increment.status_text);
            await ensure_classes(page, '[data-test="counter-display"]', expectations.after_second_increment.display_classes);

            await set_input_value(page, '[data-test="step-input"]', '3');
            await page.click('[data-test="increment-button"]');
            await wait_for_text(page, '[data-test="counter-display"]', expectations.after_step_increment.display_text);
            await wait_for_text(page, '[data-test="counter-status"]', expectations.after_step_increment.status_text);
            await ensure_classes(page, '[data-test="counter-display"]', expectations.after_step_increment.display_classes);

            await page.click('[data-test="reset-button"]');
            await wait_for_text(page, '[data-test="counter-display"]', expectations.after_reset.display_text);
            await wait_for_text(page, '[data-test="counter-status"]', expectations.after_reset.status_text);
            await ensure_classes(page, '[data-test="counter-display"]', expectations.after_reset.display_classes);

            await set_input_value(page, '[data-test="step-input"]', '0');
            await wait_for_text(page, '[data-test="step-error"]', expectations.invalid_step.step_error);
            await wait_for_class(page, '[data-test="increment-button"]', expectations.invalid_step.disabled_class, true);
            await wait_for_class(page, '[data-test="decrement-button"]', expectations.invalid_step.disabled_class, true);
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server_instance);
        }
    });

    it('transforms locale dates and validates ranges in date-transform example', async function () {
        const expectations = await load_fixture('date_transform_expectations.json');
        const { server_instance, port } = await start_example_server({
            dir_name: '02) date-transform',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('[data-test="iso-input"]');

            await wait_for_input_value(page, '[data-test="iso-input"]', expectations.default.iso_value);
            await wait_for_text(page, '[data-test="local-display"]', expectations.default.local_display);
            await wait_for_text(page, '[data-test="format-text"]', expectations.default.format_text);
            await wait_for_text(page, '[data-test="range-message"]', expectations.default.range_message);

            await page.select('[data-test="locale-select"]', expectations.locale_gb.locale);
            await wait_for_text(page, '[data-test="format-text"]', expectations.locale_gb.format_text);
            await wait_for_text(page, '[data-test="local-display"]', expectations.locale_gb.local_display);

            await set_input_value(page, '[data-test="locale-input"]', expectations.locale_gb.valid_input);
            await wait_for_input_value(page, '[data-test="iso-input"]', expectations.locale_gb.iso_value);

            await page.select('[data-test="locale-select"]', expectations.locale_us.locale);
            await wait_for_text(page, '[data-test="format-text"]', expectations.locale_us.format_text);
            await wait_for_text(page, '[data-test="local-display"]', expectations.locale_us.local_display);

            await set_input_value(page, '[data-test="iso-input"]', expectations.out_of_range.iso_value);
            await wait_for_text(page, '[data-test="range-message"]', expectations.out_of_range.range_message);

            await page.select('[data-test="locale-select"]', expectations.locale_gb.locale);
            await set_input_value(page, '[data-test="locale-input"]', expectations.locale_gb.invalid_input);
            await wait_for_text(page, '[data-test="locale-error"]', expectations.locale_gb.error);
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server_instance);
        }
    });

    it('validates registration fields in form-validation example', async function () {
        const expectations = await load_fixture('form_validation_expectations.json');
        const { server_instance, port } = await start_example_server({
            dir_name: '03) form-validation',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('[data-test="full-name-input"]');

            await wait_for_text(page, '[data-test="full-name-error"]', expectations.initial.full_name_error);
            await wait_for_text(page, '[data-test="email-error"]', expectations.initial.email_error);
            await wait_for_text(page, '[data-test="password-error"]', expectations.initial.password_error);
            await wait_for_text(page, '[data-test="confirm-password-error"]', expectations.initial.confirm_password_error);
            await wait_for_text(page, '[data-test="status-text"]', expectations.initial.status_text);

            await set_input_value(page, '[data-test="email-input"]', expectations.invalid_email.email);
            await wait_for_text(page, '[data-test="email-error"]', expectations.invalid_email.error);

            await set_input_value(page, '[data-test="full-name-input"]', expectations.valid.full_name);
            await set_input_value(page, '[data-test="email-input"]', expectations.valid.email);
            await set_input_value(page, '[data-test="website-input"]', expectations.valid.website);
            await set_input_value(page, '[data-test="password-input"]', expectations.valid.password);
            await set_input_value(page, '[data-test="confirm-password-input"]', expectations.valid.confirm_password);

            await wait_for_text(page, '[data-test="summary-text"]', expectations.valid.summary_text);
            await wait_for_text(page, '[data-test="status-text"]', expectations.valid.status_text);
            await wait_for_class(page, '[data-test="submit-button"]', 'is-disabled', false);

            await page.click('[data-test="submit-button"]');
            await wait_for_text(page, '[data-test="feedback-text"]', expectations.submit.feedback);
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server_instance);
        }
    });

    it('filters, sorts, and paginates in data-grid example', async function () {
        const expectations = await load_fixture('data_grid_expectations.json');
        const { server_instance, port } = await start_example_server({
            dir_name: '04) data-grid',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('[data-test="grid-body"]');

            await wait_for_text(page, '[data-test="range-text"]', expectations.initial.range_text);
            await wait_for_text(page, '[data-test="page-text"]', expectations.initial.page_text);
            await wait_for_first_grid_name(page, expectations.initial.first_name);

            const initial_names = await get_grid_names(page);
            assert.strictEqual(initial_names.length, expectations.initial.row_count);

            await set_input_value(page, '[data-test="search-input"]', expectations.search.query);
            await wait_for_text(page, '[data-test="range-text"]', expectations.search.range_text);
            await wait_for_text(page, '[data-test="page-text"]', expectations.search.page_text);
            await wait_for_first_grid_name(page, expectations.search.first_name);

            const search_names = await get_grid_names(page);
            assert.strictEqual(search_names.length, expectations.search.row_count);

            await set_input_value(page, '[data-test="search-input"]', '');
            await wait_for_text(page, '[data-test="range-text"]', expectations.reset.range_text);
            await wait_for_text(page, '[data-test="page-text"]', expectations.reset.page_text);

            await page.click('[data-test="sort-score"]');
            await wait_for_first_grid_name(page, expectations.sort_score.first_name);

            await page.click('[data-test="next-page"]');
            await wait_for_text(page, '[data-test="page-text"]', expectations.page_2.page_text);
            await wait_for_first_grid_name(page, expectations.page_2.first_name);
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server_instance);
        }
    });

    it('syncs selection in master-detail example', async function () {
        const expectations = await load_fixture('master_detail_expectations.json');
        const { server_instance, port } = await start_example_server({
            dir_name: '05) master-detail',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('[data-test="detail-title"]');

            await wait_for_text(page, '[data-test="detail-title"]', expectations.initial.detail_title);
            await wait_for_text(page, '[data-test="detail-role"]', expectations.initial.detail_role);
            await wait_for_text(page, '[data-test="nav-text"]', expectations.initial.nav_text);

            await page.click('[data-test="next-button"]');
            await wait_for_text(page, '[data-test="detail-title"]', expectations.after_next.detail_title);
            await wait_for_text(page, '[data-test="nav-text"]', expectations.after_next.nav_text);

            await page.click('[data-test="master-item-3"]');
            await wait_for_text(page, '[data-test="detail-title"]', expectations.last_item.detail_title);
            await wait_for_text(page, '[data-test="nav-text"]', expectations.last_item.nav_text);
            await wait_for_class(page, '[data-test="master-item-3"]', 'is-active', true);
            await wait_for_class(page, '[data-test="next-button"]', 'is-disabled', true);
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server_instance);
        }
    });

    it('switches token themes in theming example', async function () {
        const expectations = await load_fixture('theming_expectations.json');
        const { server_instance, port } = await start_example_server({
            dir_name: '06) theming',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('[data-test="theme-name"]');

            await wait_for_text(page, '[data-test="theme-name"]', expectations.initial.theme_label);
            await wait_for_text(page, '[data-test="token-accent"]', expectations.initial.accent_value);

            await page.click('[data-test="theme-tide"]');
            await wait_for_text(page, '[data-test="theme-name"]', expectations.tide.theme_label);
            await wait_for_text(page, '[data-test="token-accent"]', expectations.tide.accent_value);
            await wait_for_class(page, '[data-test="theme-tide"]', 'is-active', true);
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server_instance);
        }
    });

    it('highlights mixin selections in mixins example', async function () {
        const expectations = await load_fixture('mixins_expectations.json');
        const { server_instance, port } = await start_example_server({
            dir_name: '07) mixins',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('[data-test="selected-title"]');

            await wait_for_text(page, '[data-test="selected-title"]', expectations.initial.selected_title);
            await wait_for_text(page, '[data-test="selected-mixins"]', expectations.initial.selected_mixins_text);

            await page.click('[data-test="mixins-card-resize"]');
            await wait_for_text(page, '[data-test="selected-title"]', expectations.resizable.selected_title);
            await wait_for_text(page, '[data-test="selected-mixins"]', expectations.resizable.selected_mixins_text);
            await wait_for_class(page, '[data-test="mixins-card-resize"]', 'selected', true);
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server_instance);
        }
    });

    it('switches hash routes in router example', async function () {
        const expectations = await load_fixture('router_expectations.json');
        const { server_instance, port } = await start_example_server({
            dir_name: '08) router',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('[data-test="route-title"]');

            await wait_for_text(page, '[data-test="route-title"]', expectations.initial.route_title);
            await wait_for_text(page, '[data-test="route-hint"]', expectations.initial.route_hint);

            await page.click('[data-test="nav-metrics"]');
            await wait_for_text(page, '[data-test="route-title"]', expectations.metrics.route_title);
            await wait_for_text(page, '[data-test="route-hint"]', expectations.metrics.route_hint);
            await wait_for_class(page, '[data-test="nav-metrics"]', 'is-active', true);
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server_instance);
        }
    });

    it('runs the resource transform pipeline in resource-transform example', async function () {
        const expectations = await load_fixture('resource_transform_expectations.json');
        const { server_instance, port } = await start_example_server({
            dir_name: '09) resource-transform',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('[data-test="transform-status"]');

            await wait_for_text(page, '[data-test="transform-status"]', expectations.initial.status_text);
            await wait_for_text(page, '[data-test="summary-text"]', expectations.initial.summary_text);

            await page.click('[data-test="run-transform"]');
            await wait_for_text(page, '[data-test="transform-status"]', expectations.after_run.status_text);
            await wait_for_text(page, '[data-test="summary-text"]', expectations.after_run.summary_text);
            await wait_for_text(page, '[data-test="output-line-0"]', expectations.after_run.first_line);
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server_instance);
        }
    });

    it('surfaces binding debugger summaries and logs in binding-debugger example', async function () {
        const expectations = await load_fixture('binding_debugger_expectations.json');
        const { server_instance, port } = await start_example_server({
            dir_name: '10) binding-debugger',
            ctrl_name: 'Demo_UI'
        });

        let page;
        try {
            page = await open_example_page(port);
            await page.waitForSelector('[data-test="count-display"]');

            await wait_for_text(page, '[data-test="count-display"]', expectations.initial.display_text);
            await wait_for_text(page, '[data-test="status-text"]', expectations.initial.status_text);
            await wait_for_text(page, '[data-test="summary-line"]', expectations.initial.summary_line);

            await page.click('[data-test="increment-button"]');
            await wait_for_text(page, '[data-test="count-display"]', expectations.after_increment.display_text);
            await wait_for_text(page, '[data-test="log-entry-0"]', expectations.after_increment.log_entry);

            await page.click('[data-test="enable-debug"]');
            await wait_for_text(page, '[data-test="debug-status"]', expectations.after_enable.debug_status);
            await wait_for_text(page, '[data-test="log-entry-0"]', expectations.after_enable.log_entry);
        } finally {
            if (page) {
                await page.close();
            }
            await stop_example_server(server_instance);
        }
    });
});
