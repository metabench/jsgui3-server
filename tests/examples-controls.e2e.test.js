/**
 * E2E regression tests for example control apps under examples/controls/.
 *
 * These tests boot a server for a selected set of examples and validate:
 * - The HTML route renders successfully (even without Accept-Encoding)
 * - Bundled JS and CSS routes are served
 * - The server-rendered HTML includes the expected number of Window controls
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const { describe, it } = require('mocha');

const Server = require('../server');
const { get_free_port } = require('../port-utils');

const repo_root_path = path.join(__dirname, '..');
const examples_controls_root_path = path.join(repo_root_path, 'examples', 'controls');

const examples = [
    { dir_name: '1) window', ctrl_name: 'Demo_UI', expected_window_count: 1 },
    { dir_name: '2) two windows', ctrl_name: 'Demo_UI', expected_window_count: 2 },
    { dir_name: '3) five windows', ctrl_name: 'Demo_UI', expected_window_count: 5 },
    { dir_name: '4) window, tabbed panel', ctrl_name: 'Demo_UI', expected_window_count: 1 },
    { dir_name: '5) window, grid', ctrl_name: 'Demo_UI', expected_window_count: 1 },
    { dir_name: '8) window, checkbox/a)', ctrl_name: 'Demo_UI', expected_window_count: 1 },
    { dir_name: '9) window, date picker', ctrl_name: 'Demo_UI', expected_window_count: 1 },
    { dir_name: '12) window, Select_Options control', ctrl_name: 'Demo_UI', expected_window_count: 1 },
    { dir_name: '13) window, Dropdown_Menu control', ctrl_name: 'Demo_UI', expected_window_count: 1 },
    {
        dir_name: '14d) window, canvas globe',
        ctrl_name: 'Demo_UI',
        expected_window_count: 1,
        expected_canvas_id: 'globeCanvas'
    }
];

function make_request(url, { headers = {} } = {}) {
    return new Promise((resolve, reject) => {
        const parsed_url = new URL(url);
        const options = {
            hostname: parsed_url.hostname,
            port: parsed_url.port,
            path: parsed_url.pathname,
            method: 'GET',
            headers: {
                'User-Agent': 'JSGUI3-Examples-E2E/1.0',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                resolve({
                    status_code: res.statusCode,
                    headers: res.headers,
                    body: Buffer.concat(chunks).toString('utf8')
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        req.end();
    });
}

function count_occurrences(haystack, needle) {
    let idx = 0;
    let count = 0;
    while (true) {
        idx = haystack.indexOf(needle, idx);
        if (idx === -1) return count;
        count++;
        idx += needle.length;
    }
}

async function start_example_server({ dir_name, ctrl_name }) {
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
}

async function close_server(server) {
    await new Promise((resolve) => server.close(resolve));
}

describe('Examples/Controls E2E Regression Tests', function() {
    this.timeout(180000);

    for (const example of examples) {
        it(`should render and serve bundles for "${example.dir_name}"`, async function() {
            const { server, port } = await start_example_server(example);

            try {
                const base_url = `http://127.0.0.1:${port}`;

                const html_response = await make_request(`${base_url}/`, {
                    headers: {
                        // Deliberately omit Accept-Encoding to ensure identity works.
                    }
                });

                assert.strictEqual(html_response.status_code, 200);
                assert(
                    (html_response.headers['content-type'] || '').includes('text/html'),
                    'Expected HTML content-type'
                );

                const window_count = count_occurrences(html_response.body, 'data-jsgui-type="window"');
                assert.strictEqual(
                    window_count,
                    example.expected_window_count,
                    `Expected ${example.expected_window_count} windows, got ${window_count}`
                );
                if (example.expected_canvas_id) {
                    assert(
                        html_response.body.includes(`id="${example.expected_canvas_id}"`),
                        `Expected canvas id "${example.expected_canvas_id}" in HTML`
                    );
                }

                const js_response = await make_request(`${base_url}/js/js.js`);
                assert.strictEqual(js_response.status_code, 200);
                assert(
                    (js_response.headers['content-type'] || '').includes('javascript'),
                    'Expected JavaScript content-type'
                );
                assert(js_response.body.length > 1000, 'Expected non-trivial JS bundle');

                const css_response = await make_request(`${base_url}/css/css.css`);
                assert.strictEqual(css_response.status_code, 200);
                assert(
                    (css_response.headers['content-type'] || '').includes('css'),
                    'Expected CSS content-type'
                );
            } finally {
                await close_server(server);
            }
        });
    }
});
