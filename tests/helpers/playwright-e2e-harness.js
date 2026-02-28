const assert = require('assert');
const path = require('path');

const Server = require('../../server');
const { get_free_port } = require('../../port-utils');

const default_viewport = {
    width: 1366,
    height: 900
};

const ensure_playwright_module = () => {
    try {
        return require('playwright');
    } catch {
        return null;
    }
};

const launch_playwright_browser = async (playwright_module, launch_options = {}) => {
    const resolved_playwright = playwright_module || ensure_playwright_module();
    if (!resolved_playwright || !resolved_playwright.chromium) {
        throw new Error('Playwright Chromium is unavailable in this environment.');
    }

    const normalized_options = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...launch_options
    };

    if (!normalized_options.executablePath && process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
        normalized_options.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    }

    return resolved_playwright.chromium.launch(normalized_options);
};

const start_control_example_server = async ({
    examples_root_path,
    dir_name,
    ctrl_name,
    server_name_prefix = 'examples/controls'
}) => {
    const example_dir_path = path.join(examples_root_path, dir_name);
    const example_client_path = path.join(example_dir_path, 'client.js');

    const jsgui_module = require(example_client_path);
    const ctrl_constructor = jsgui_module.controls && jsgui_module.controls[ctrl_name];
    assert(ctrl_constructor, `Missing exported control jsgui.controls.${ctrl_name} in ${example_client_path}`);

    const server_instance = new Server({
        Ctrl: ctrl_constructor,
        src_path_client_js: example_client_path,
        name: `${server_name_prefix}/${dir_name}`
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
        port,
        example_client_path
    };
};

const stop_server_instance = async (server_instance) => {
    if (!server_instance) {
        return;
    }

    await new Promise((resolve) => {
        server_instance.close(() => resolve());
    });
};

const attach_page_probe = (page) => {
    const probe = {
        console_errors: [],
        page_errors: [],
        request_failures: []
    };

    const console_handler = (message) => {
        if (message.type() === 'error') {
            probe.console_errors.push(message.text());
        }
    };

    const page_error_handler = (error) => {
        probe.page_errors.push(error instanceof Error ? error.message : String(error));
    };

    const request_failed_handler = (request) => {
        const failure = request.failure();
        probe.request_failures.push({
            url: request.url(),
            method: request.method(),
            error_text: failure ? failure.errorText : 'unknown'
        });
    };

    page.on('console', console_handler);
    page.on('pageerror', page_error_handler);
    page.on('requestfailed', request_failed_handler);

    probe.detach = () => {
        page.off('console', console_handler);
        page.off('pageerror', page_error_handler);
        page.off('requestfailed', request_failed_handler);
    };

    return probe;
};

const assert_clean_page_probe = (probe, {
    allowed_console_error_patterns = [],
    allowed_page_error_patterns = [],
    allowed_request_failure_patterns = []
} = {}) => {
    const is_allowed_message = (message, allowed_patterns) => {
        return allowed_patterns.some((pattern) => {
            if (pattern instanceof RegExp) {
                return pattern.test(message);
            }
            return String(message).includes(String(pattern));
        });
    };

    const blocked_console_errors = probe.console_errors.filter((message) => {
        return !is_allowed_message(message, allowed_console_error_patterns);
    });

    const blocked_page_errors = probe.page_errors.filter((message) => {
        return !is_allowed_message(message, allowed_page_error_patterns);
    });

    const blocked_request_failures = probe.request_failures.filter((failure_item) => {
        const label = `${failure_item.method} ${failure_item.url} ${failure_item.error_text}`;
        return !is_allowed_message(label, allowed_request_failure_patterns);
    });

    assert.strictEqual(
        blocked_console_errors.length,
        0,
        `Unexpected browser console errors: ${blocked_console_errors.join(' | ')}`
    );
    assert.strictEqual(
        blocked_page_errors.length,
        0,
        `Unexpected browser page errors: ${blocked_page_errors.join(' | ')}`
    );
    assert.strictEqual(
        blocked_request_failures.length,
        0,
        `Unexpected browser request failures: ${JSON.stringify(blocked_request_failures)}`
    );
};

const open_page = async (browser_instance, target_url, options = {}) => {
    const viewport = options.viewport || default_viewport;

    const page = await browser_instance.newPage({ viewport });

    const page_probe = attach_page_probe(page);

    await page.goto(target_url, {
        waitUntil: options.wait_until || 'load'
    });

    return {
        page,
        page_probe
    };
};

const close_page_with_probe = async (page, page_probe) => {
    if (page_probe && typeof page_probe.detach === 'function') {
        page_probe.detach();
    }

    if (page && !page.isClosed()) {
        await page.close();
    }
};

const set_input_value_with_events = async (
    page,
    selector,
    next_value,
    event_names = ['input', 'change']
) => {
    await page.$eval(selector, (element, value, events) => {
        element.value = String(value);
        for (const event_name of events) {
            element.dispatchEvent(new Event(event_name, { bubbles: true }));
        }
    }, next_value, event_names);
};

const wait_for_text_content = async (page, selector, expected_text_or_regex, timeout_ms = 6000) => {
    if (expected_text_or_regex instanceof RegExp) {
        await page.waitForFunction(
            (selector_arg, regex_source, regex_flags) => {
                const element = document.querySelector(selector_arg);
                if (!element) return false;
                const value = (element.textContent || '').trim();
                const expected_regex = new RegExp(regex_source, regex_flags);
                return expected_regex.test(value);
            },
            { timeout: timeout_ms },
            selector,
            expected_text_or_regex.source,
            expected_text_or_regex.flags
        );
        return;
    }

    const expected_text = String(expected_text_or_regex);
    await page.waitForFunction(
        (selector_arg, expected_text_arg) => {
            const element = document.querySelector(selector_arg);
            if (!element) return false;
            return (element.textContent || '').trim() === expected_text_arg;
        },
        { timeout: timeout_ms },
        selector,
        expected_text
    );
};

const drag_by = async (page, selector, delta_x, delta_y) => {
    const locator = page.locator(selector).first();
    const box = await locator.boundingBox();
    assert(box, `Missing bounding box for selector: ${selector}`);

    const start_x = box.x + box.width / 2;
    const start_y = box.y + box.height / 2;

    await page.mouse.move(start_x, start_y);
    await page.mouse.down();
    await page.mouse.move(start_x + delta_x, start_y + delta_y, { steps: 12 });
    await page.mouse.up();
};

const run_interaction_story = async ({
    page,
    story_name,
    steps
}) => {
    assert(Array.isArray(steps) && steps.length > 0, 'Interaction story requires at least one step');

    const step_results = [];

    for (let index = 0; index < steps.length; index += 1) {
        const step_spec = steps[index] || {};
        const step_name = step_spec.name || `step_${index + 1}`;
        const started_at = Date.now();

        try {
            if (typeof step_spec.run === 'function') {
                await step_spec.run(page);
            }
            if (typeof step_spec.assert === 'function') {
                await step_spec.assert(page);
            }

            step_results.push({
                step_name,
                duration_ms: Date.now() - started_at
            });
        } catch (error) {
            error.message = `[${story_name} :: ${step_name}] ${error.message}`;
            throw error;
        }
    }

    return step_results;
};

const wait_for_condition = async (condition_fn, timeout_ms = 6000, interval_ms = 25) => {
    const started_at = Date.now();

    while ((Date.now() - started_at) <= timeout_ms) {
        const condition_result = await condition_fn();
        if (condition_result) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, interval_ms));
    }

    return false;
};

module.exports = {
    ensure_playwright_module,
    launch_playwright_browser,
    start_control_example_server,
    stop_server_instance,
    open_page,
    close_page_with_probe,
    attach_page_probe,
    assert_clean_page_probe,
    set_input_value_with_events,
    wait_for_text_content,
    drag_by,
    run_interaction_story,
    wait_for_condition
};
