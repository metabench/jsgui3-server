const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs').promises;
const { describe, it, before } = require('mocha');

const Server = require('../server');
const { get_free_port } = require('../port-utils');

const style_config = {
    sourcemaps: {
        enabled: true,
        inline: true,
        include_sources: true
    }
};

let sass_available = true;
try {
    require('sass');
} catch (error) {
    sass_available = false;
}

const sass_mix_client_js = [
    "const jsgui = require('jsgui3-html');",
    "const { Control } = jsgui;",
    "const { controls } = jsgui;",
    "",
    "class Sass_Mix_Control extends Control {",
    "    constructor(spec = {}) {",
    "        super(spec);",
    "        const { context } = this;",
    "        if (!spec.el) {",
    "            const container = new controls.div({ context, class: 'sass-mix-control' });",
    "            this.add(container);",
    "        }",
    "    }",
    "}",
    "",
    "Sass_Mix_Control.css = `",
    ".sass-mix-control { border-color: red; }",
    "`;",
    "",
    "Sass_Mix_Control.scss = `",
    "$accent_color: #ff7700;",
    ".sass-mix-control {",
    "  border-color: blue;",
    "  background: $accent_color;",
    "  &:hover { color: #222; }",
    "}",
    "`;",
    "",
    "controls.Sass_Mix_Control = Sass_Mix_Control;",
    "module.exports = jsgui;",
    ""
].join('\n');

const sass_only_client_js = [
    "const jsgui = require('jsgui3-html');",
    "const { Control } = jsgui;",
    "const { controls } = jsgui;",
    "",
    "class Sass_Only_Control extends Control {",
    "    constructor(spec = {}) {",
    "        super(spec);",
    "        const { context } = this;",
    "        if (!spec.el) {",
    "            const container = new controls.div({ context, class: 'sass-only-control' });",
    "            this.add(container);",
    "        }",
    "    }",
    "}",
    "",
    "Sass_Only_Control.sass = `",
    "$primary_color: #336699",
    ".sass-only-control",
    "  color: $primary_color",
    "  &:hover",
    "    color: #000000",
    "`;",
    "",
    "controls.Sass_Only_Control = Sass_Only_Control;",
    "module.exports = jsgui;",
    ""
].join('\n');

const sass_css_mix_client_js = [
    "const jsgui = require('jsgui3-html');",
    "const { Control } = jsgui;",
    "const { controls } = jsgui;",
    "",
    "class Sass_Css_Mix_Control extends Control {",
    "    constructor(spec = {}) {",
    "        super(spec);",
    "        const { context } = this;",
    "        if (!spec.el) {",
    "            const container = new controls.div({ context, class: 'sass-css-mix-control' });",
    "            this.add(container);",
    "        }",
    "    }",
    "}",
    "",
    "Sass_Css_Mix_Control.css = `",
    ".sass-css-mix-control { padding: 4px; }",
    "`;",
    "",
    "Sass_Css_Mix_Control.sass = `",
    "$mix_color: #123456",
    ".sass-css-mix-control",
    "  color: $mix_color",
    "`;",
    "",
    "controls.Sass_Css_Mix_Control = Sass_Css_Mix_Control;",
    "module.exports = jsgui;",
    ""
].join('\n');

const make_request = (url, { headers = {} } = {}) => {
    return new Promise((resolve, reject) => {
        const parsed_url = new URL(url);
        const options = {
            hostname: parsed_url.hostname,
            port: parsed_url.port,
            path: parsed_url.pathname,
            method: 'GET',
            headers: {
                'User-Agent': 'JSGUI3-Sass-E2E/1.0',
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
};

const write_temp_client_file = async (file_name, file_contents) => {
    const file_path = path.join(__dirname, file_name);
    await fs.writeFile(file_path, file_contents, 'utf8');
    return file_path;
};

const remove_file_if_exists = async (file_path) => {
    try {
        await fs.unlink(file_path);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
};

const start_test_server = async ({ client_path, control_name }) => {
    delete require.cache[require.resolve(client_path)];
    const client_module = require(client_path);
    const ctrl = client_module.controls && client_module.controls[control_name];
    assert(ctrl, `Missing exported control jsgui.controls.${control_name} in ${client_path}`);

    const server = new Server({
        Ctrl: ctrl,
        src_path_client_js: client_path,
        name: `tests/${control_name}`,
        debug: true,
        style: style_config
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

const close_server = async (server) => {
    await new Promise((resolve) => server.close(resolve));
};

const extract_inline_sourcemap = (css_text) => {
    const sourcemap_match = css_text.match(/\/\*# sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)\s*\*\//);
    assert(sourcemap_match, 'Expected inline CSS sourcemap comment');
    const sourcemap_json = Buffer.from(sourcemap_match[1], 'base64').toString('utf8');
    return JSON.parse(sourcemap_json);
};

const sourcemap_contains = (sourcemap, needle) => {
    const sources_content = Array.isArray(sourcemap.sourcesContent) ? sourcemap.sourcesContent : [];
    return sources_content.some((content) => typeof content === 'string' && content.includes(needle));
};

describe('Sass/CSS Control E2E Tests', function() {
    this.timeout(90000);

    before(function() {
        if (!sass_available) {
            this.skip();
        }
    });

    it('should compile mixed css + scss in order with sourcemaps', async function() {
        const client_path = await write_temp_client_file('temp_sass_mix_client.js', sass_mix_client_js);
        const { server, port } = await start_test_server({
            client_path,
            control_name: 'Sass_Mix_Control'
        });

        try {
            const base_url = `http://127.0.0.1:${port}`;
            const css_response = await make_request(`${base_url}/css/css.css`);
            assert.strictEqual(css_response.status_code, 200);
            assert((css_response.headers['content-type'] || '').includes('css'), 'Expected CSS content-type');

            const css_text = css_response.body;
            const red_index = css_text.indexOf('border-color: red');
            const blue_index = css_text.indexOf('border-color: blue');
            assert(red_index !== -1, 'Expected CSS from .css template literal');
            assert(blue_index !== -1, 'Expected CSS from .scss template literal');
            assert(red_index < blue_index, 'Expected .css output to precede .scss output');
            assert(css_text.includes('background: #ff7700'), 'Expected SCSS variable compilation');
            assert(css_text.includes('.sass-mix-control:hover'), 'Expected nested SCSS selector output');

            const css_sourcemap = extract_inline_sourcemap(css_text);
            assert(Array.isArray(css_sourcemap.sources), 'Expected sourcemap sources array');
            assert(Array.isArray(css_sourcemap.sourcesContent), 'Expected sourcemap sourcesContent array');
            assert(sourcemap_contains(css_sourcemap, '$accent_color'), 'Expected sourcemap to include SCSS source content');
            assert(sourcemap_contains(css_sourcemap, 'border-color: red'), 'Expected sourcemap to include CSS source content');

            const js_response = await make_request(`${base_url}/js/js.js`);
            assert.strictEqual(js_response.status_code, 200);
            assert(!js_response.body.includes('border-color: red'), 'Expected CSS template literal to be stripped from JS');
            assert(!js_response.body.includes('$accent_color'), 'Expected SCSS template literal to be stripped from JS');
        } finally {
            await close_server(server);
            await remove_file_if_exists(client_path);
        }
    });

    it('should compile indented sass with sourcemaps', async function() {
        const client_path = await write_temp_client_file('temp_sass_only_client.js', sass_only_client_js);
        const { server, port } = await start_test_server({
            client_path,
            control_name: 'Sass_Only_Control'
        });

        try {
            const base_url = `http://127.0.0.1:${port}`;
            const css_response = await make_request(`${base_url}/css/css.css`);
            assert.strictEqual(css_response.status_code, 200);
            assert((css_response.headers['content-type'] || '').includes('css'), 'Expected CSS content-type');

            const css_text = css_response.body;
            assert(css_text.includes('.sass-only-control'), 'Expected Sass selector output');
            assert(css_text.includes('color: #336699'), 'Expected Sass variable compilation');
            assert(css_text.includes('.sass-only-control:hover'), 'Expected nested Sass selector output');

            const css_sourcemap = extract_inline_sourcemap(css_text);
            assert(Array.isArray(css_sourcemap.sources), 'Expected sourcemap sources array');
            assert(Array.isArray(css_sourcemap.sourcesContent), 'Expected sourcemap sourcesContent array');
            assert(sourcemap_contains(css_sourcemap, '$primary_color'), 'Expected sourcemap to include Sass source content');

            const js_response = await make_request(`${base_url}/js/js.js`);
            assert.strictEqual(js_response.status_code, 200);
            assert(!js_response.body.includes('$primary_color'), 'Expected Sass template literal to be stripped from JS');
        } finally {
            await close_server(server);
            await remove_file_if_exists(client_path);
        }
    });

    it('should compile mixed css + sass in order without inaccurate sourcemaps', async function() {
        const client_path = await write_temp_client_file('temp_sass_css_mix_client.js', sass_css_mix_client_js);
        const { server, port } = await start_test_server({
            client_path,
            control_name: 'Sass_Css_Mix_Control'
        });

        try {
            const base_url = `http://127.0.0.1:${port}`;
            const css_response = await make_request(`${base_url}/css/css.css`);
            assert.strictEqual(css_response.status_code, 200);
            assert((css_response.headers['content-type'] || '').includes('css'), 'Expected CSS content-type');

            const css_text = css_response.body;
            const padding_index = css_text.indexOf('padding: 4px');
            const color_index = css_text.indexOf('color: #123456');
            assert(padding_index !== -1, 'Expected CSS output from .css template literal');
            assert(color_index !== -1, 'Expected Sass output from .sass template literal');
            assert(padding_index < color_index, 'Expected .css output to precede .sass output');
            assert(!css_text.includes('/*# sourceMappingURL='), 'Expected no inline sourcemap for mixed css + sass compilation');

            const js_response = await make_request(`${base_url}/js/js.js`);
            assert.strictEqual(js_response.status_code, 200);
            assert(!js_response.body.includes('padding: 4px'), 'Expected CSS template literal to be stripped from JS');
            assert(!js_response.body.includes('$mix_color'), 'Expected Sass template literal to be stripped from JS');
        } finally {
            await close_server(server);
            await remove_file_if_exists(client_path);
        }
    });
});
