/**
 * Screenshot Utilities for jsgui3-server
 * 
 * Reusable Puppeteer-based screenshot capture, extracted from
 * tests/window-examples.puppeteer.test.js patterns.
 * 
 * Usage:
 *   const { launch_browser, capture_page, close_browser } = require('./screenshot-utils');
 *   await launch_browser();
 *   const result = await capture_page('http://localhost:3600', {
 *       output_path: './screenshots/full_page.png',
 *       full_page: true
 *   });
 *   await close_browser();
 */

const fs = require('fs');
const path = require('path');

let puppeteer;
let browser;

/**
 * Launch a headless Puppeteer browser.
 * @param {Object} [options]
 * @param {boolean} [options.headless=true]
 * @param {string} [options.executable_path] - Custom Chrome/Chromium path
 * @returns {Promise<import('puppeteer').Browser>}
 */
const launch_browser = async (options = {}) => {
    if (browser) return browser;

    if (!puppeteer) {
        puppeteer = require('puppeteer');
    }

    const launch_options = {
        headless: options.headless !== false ? 'new' : false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    };

    if (options.executable_path || process.env.PUPPETEER_EXECUTABLE_PATH) {
        launch_options.executablePath = options.executable_path || process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    browser = await puppeteer.launch(launch_options);
    return browser;
};

/**
 * Capture a screenshot of a URL.
 * @param {string} url - URL to navigate to
 * @param {Object} [options]
 * @param {string} [options.output_path] - File path for the PNG
 * @param {boolean} [options.full_page=true] - Capture full scrollable page
 * @param {number} [options.width=1280] - Viewport width
 * @param {number} [options.height=720] - Viewport height
 * @param {number} [options.wait_ms=1000] - Wait time after load before capture
 * @param {string} [options.wait_for_selector] - CSS selector to wait for
 * @returns {Promise<{path: string, width: number, height: number, size_bytes: number}>}
 */
const capture_page = async (url, options = {}) => {
    if (!browser) {
        throw new Error('Browser not launched. Call launch_browser() first.');
    }

    const {
        output_path,
        full_page = true,
        width = 1280,
        height = 720,
        wait_ms = 1000,
        wait_for_selector
    } = options;

    const page = await browser.newPage();

    try {
        await page.setViewport({ width, height });
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

        if (wait_for_selector) {
            await page.waitForSelector(wait_for_selector, { timeout: 10000 });
        }

        if (wait_ms > 0) {
            await new Promise(r => setTimeout(r, wait_ms));
        }

        // Ensure output directory exists
        if (output_path) {
            fs.mkdirSync(path.dirname(output_path), { recursive: true });
        }

        const screenshot_path = output_path || path.join(process.cwd(), 'screenshot.png');
        await page.screenshot({ path: screenshot_path, fullPage: full_page });

        const stats = fs.statSync(screenshot_path);
        const dimensions = await page.evaluate(() => ({
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight
        }));

        return {
            path: screenshot_path,
            width: dimensions.width,
            height: dimensions.height,
            size_bytes: stats.size
        };
    } finally {
        await page.close();
    }
};

/**
 * Capture a screenshot of a specific element on a page.
 * @param {string} url - URL to navigate to
 * @param {string} selector - CSS selector for the element
 * @param {Object} [options]
 * @param {string} [options.output_path] - File path for the PNG
 * @param {number} [options.width=1280] - Viewport width
 * @param {number} [options.height=720] - Viewport height
 * @param {number} [options.wait_ms=1000] - Wait time after load
 * @returns {Promise<{path: string, width: number, height: number, size_bytes: number}>}
 */
const capture_element = async (url, selector, options = {}) => {
    if (!browser) {
        throw new Error('Browser not launched. Call launch_browser() first.');
    }

    const {
        output_path,
        width = 1280,
        height = 720,
        wait_ms = 1000
    } = options;

    const page = await browser.newPage();

    try {
        await page.setViewport({ width, height });
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        await page.waitForSelector(selector, { timeout: 10000 });

        if (wait_ms > 0) {
            await new Promise(r => setTimeout(r, wait_ms));
        }

        if (output_path) {
            fs.mkdirSync(path.dirname(output_path), { recursive: true });
        }

        const element = await page.$(selector);
        if (!element) {
            throw new Error(`Element not found: ${selector}`);
        }

        const screenshot_path = output_path || path.join(process.cwd(), 'element_screenshot.png');
        await element.screenshot({ path: screenshot_path });

        const stats = fs.statSync(screenshot_path);
        const box = await element.boundingBox();

        return {
            path: screenshot_path,
            width: Math.round(box.width),
            height: Math.round(box.height),
            size_bytes: stats.size
        };
    } finally {
        await page.close();
    }
};

/**
 * Capture multiple screenshots from a single URL — full page + individual sections.
 * @param {string} url - URL to screenshot
 * @param {string} output_dir - Directory to save screenshots
 * @param {Object} [options]
 * @param {string[]} [options.section_selectors] - CSS selectors for individual section captures
 * @param {string[]} [options.section_names] - Names for screenshot files (parallel to selectors)
 * @param {number} [options.width=1280]
 * @param {number} [options.height=720]
 * @param {number} [options.wait_ms=1000]
 * @returns {Promise<Array<{name: string, path: string, width: number, height: number, size_bytes: number}>>}
 */
const capture_url_screenshots = async (url, output_dir, options = {}) => {
    const {
        section_selectors = [],
        section_names = [],
        width = 1280,
        height = 720,
        wait_ms = 1000
    } = options;

    fs.mkdirSync(output_dir, { recursive: true });

    const results = [];

    // Full page capture
    const full_result = await capture_page(url, {
        output_path: path.join(output_dir, 'full_page.png'),
        full_page: true,
        width,
        height,
        wait_ms
    });
    results.push({ name: 'full_page', ...full_result });

    // Section captures
    for (let i = 0; i < section_selectors.length; i++) {
        const selector = section_selectors[i];
        const name = section_names[i] || `section_${i + 1}`;

        try {
            const section_result = await capture_element(url, selector, {
                output_path: path.join(output_dir, `${name}.png`),
                width,
                height,
                wait_ms: 500
            });
            results.push({ name, ...section_result });
        } catch (err) {
            console.warn(`  ⚠ Failed to capture "${name}" (${selector}): ${err.message}`);
            results.push({ name, error: err.message });
        }
    }

    return results;
};

/**
 * Close the Puppeteer browser.
 */
const close_browser = async () => {
    if (browser) {
        await browser.close();
        browser = null;
    }
};

module.exports = {
    launch_browser,
    capture_page,
    capture_element,
    capture_url_screenshots,
    close_browser
};
