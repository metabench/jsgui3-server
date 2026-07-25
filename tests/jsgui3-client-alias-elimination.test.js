const assert = require('assert');
const { describe, it, before, after } = require('mocha');
const fs = require('fs').promises;
const path = require('path');

const Advanced_JS_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Advanced_JS_Bundler_Using_ESBuild');
const JSGUI3_HTML_Control_Optimizer = require('../resources/processors/bundlers/js/esbuild/JSGUI3_HTML_Control_Optimizer');

// Regression tests for the jsgui3-client alias blind spot.
//
// jsgui3-client re-exports the full jsgui3-html surface, and the serving-path
// bundler substitutes a pruning shim for every `require('jsgui3-html')` —
// including the one inside jsgui3-client itself. Before the fix, aliases from
// `const jsgui = require('jsgui3-client')` were never registered, so
// destructures such as `const {mixins} = jsgui` were invisible to the scan.
// The optimizer then emitted a near-empty shim which hollowed out
// jsgui3-client's re-exports: `jsgui.mixins` became undefined in the browser
// (crashing activation of every example that used it) and stock control CSS
// (e.g. the Window chrome) vanished from served bundles.

const create_default_bundler = () => {
    return new Advanced_JS_Bundler_Using_ESBuild({
        debug: false,
        bundler: {
            minify: {
                enabled: true,
                level: 'normal'
            }
        }
    });
};

const await_bundle = (bundle_observable) => new Promise((resolve, reject) => {
    let settled = false;
    const settle_once = (settle_fn, value) => {
        if (settled) return;
        settled = true;
        settle_fn(value);
    };
    bundle_observable.on('error', (error) => settle_once(reject, error));
    bundle_observable.on('next', (value) => settle_once(resolve, Array.isArray(value) ? value : [value]));
    bundle_observable.on('complete', (value) => settle_once(resolve, Array.isArray(value) ? value : [value]));
});

const extract_bundle_items = (bundle_result) => {
    const bundle = bundle_result[0];
    const js_item = bundle._arr.find((item) => item.type === 'JavaScript');
    const css_item = bundle._arr.find((item) => item.type === 'CSS');
    const analysis = bundle.bundle_analysis && bundle.bundle_analysis.jsgui3_html_control_scan;
    return {
        js_text: (js_item && js_item.text) || '',
        css_text: (css_item && css_item.text) || '',
        analysis
    };
};

describe('jsgui3-client alias elimination tests', function () {
    this.timeout(180000);

    const fixture_paths = [];
    const fixture_dir = __dirname;
    let via_client_fixture_path = null;
    let side_effect_only_fixture_path = null;

    const write_fixture = async (file_name, source_text) => {
        const fixture_path = path.join(fixture_dir, file_name);
        await fs.writeFile(fixture_path, source_text, 'utf8');
        fixture_paths.push(fixture_path);
        return fixture_path;
    };

    before(async function () {
        // Mirrors the shape of the older examples (examples/box, examples/controls):
        // everything is reached through the jsgui3-client re-export surface.
        via_client_fixture_path = await write_fixture('temp_jsgui3_client_alias_mixins_window_client.js', `
const jsgui = require('jsgui3-client');
const {controls, Control, mixins} = jsgui;
const {dragable} = mixins;
const {Window} = controls;

class Temp_Client_Alias_Demo extends Control {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            this.window_instance = new Window({ context: this.context, title: 'demo' });
        }
    }
    activate() {
        super.activate();
        dragable(this.window_instance);
    }
}

controls.Temp_Client_Alias_Demo = Temp_Client_Alias_Demo;
module.exports = jsgui;
`);

        side_effect_only_fixture_path = await write_fixture('temp_jsgui3_client_side_effect_only_client.js', `
require('jsgui3-client');
module.exports = {};
`);
    });

    after(async function () {
        for (const fixture_path of fixture_paths) {
            try {
                await fs.unlink(fixture_path);
            } catch (err) {
                // Fixture already removed; ignore.
            }
        }
    });

    it('registers package aliases for jsgui3-client requires and detects usage through them', async function () {
        const optimizer = new JSGUI3_HTML_Control_Optimizer({ cacheEnabled: false });
        const result = await optimizer.optimize(via_client_fixture_path);

        assert.strictEqual(result.enabled, true);
        assert.ok(result.manifest.package_aliases.includes('jsgui'),
            `expected 'jsgui' package alias, got: ${JSON.stringify(result.manifest.package_aliases)}`);
        assert.ok(result.manifest.used_identifiers.includes('mixins'),
            `expected 'mixins' in used_identifiers, got: ${JSON.stringify(result.manifest.used_identifiers)}`);
        assert.ok(result.manifest.used_identifiers.includes('Window'),
            `expected 'Window' in used_identifiers, got: ${JSON.stringify(result.manifest.used_identifiers)}`);
        assert.ok(result.manifest.selected_root_features.includes('mixins'),
            `expected 'mixins' root feature, got: ${JSON.stringify(result.manifest.selected_root_features)}`);
        assert.ok(result.manifest.selected_controls.includes('Window'),
            `expected Window to be selected, got: ${JSON.stringify(result.manifest.selected_controls)}`);
    });

    it('fails open when the package is used but no identifiers are detectable', async function () {
        const optimizer = new JSGUI3_HTML_Control_Optimizer({ cacheEnabled: false });
        const result = await optimizer.optimize(side_effect_only_fixture_path);

        assert.strictEqual(result.enabled, false);
        assert.strictEqual(result.reason, 'package_usage_without_detected_identifiers');
    });

    it('keeps mixins and Window (JS + CSS) in served bundles for jsgui3-client consumers', async function () {
        const bundler = create_default_bundler();
        const bundle_result = await await_bundle(bundler.bundle(via_client_fixture_path));
        const { js_text, css_text, analysis } = extract_bundle_items(bundle_result);

        assert.ok(analysis, 'expected control scan analysis on the bundle');
        assert.ok(analysis.selected_root_features.includes('mixins'),
            `expected 'mixins' root feature in analysis, got: ${JSON.stringify(analysis.selected_root_features)}`);

        // The dragable mixin implementation must be present in the served JS —
        // before the fix it was stripped, so `const {dragable} = mixins` threw
        // in the browser and client-side activation never ran.
        assert.ok(js_text.includes('dragable'),
            'expected the dragable mixin to be present in the bundled JS');

        // Window chrome CSS must be extracted into the CSS bundle — before the
        // fix stock control CSS was absent and windows rendered frameless.
        assert.ok(/\.window\b/.test(css_text),
            `expected .window CSS rules in the extracted CSS (got ${css_text.length} bytes)`);
    });
});
