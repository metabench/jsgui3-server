const assert = require('assert');
const { describe, it, before, after } = require('mocha');
const fs = require('fs').promises;
const path = require('path');

const Advanced_JS_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Advanced_JS_Bundler_Using_ESBuild');

const window_markers = [
    'Minimize window',
    'window_manager',
    '__type_name = "window"',
    "__type_name = 'window'",
    "__type_name='window'",
    'add_class("window")',
    "add_class('window')"
];

const find_window_markers = (js_text = '', css_text = '') => {
    const search_text = `${js_text}\n${css_text}`;
    return window_markers.filter((marker) => search_text.includes(marker));
};

const create_bundler = (disable_elimination) => {
    const bundler_config = {
        minify: {
            enabled: true,
            level: 'normal'
        }
    };

    if (disable_elimination) {
        bundler_config.elimination = {
            enabled: false,
            jsgui3_html_controls: {
                enabled: false
            }
        };
    }

    return new Advanced_JS_Bundler_Using_ESBuild({
        debug: false,
        bundler: bundler_config
    });
};

const extract_bundle_metrics = (bundle_result) => {
    const bundle = bundle_result[0];
    const js_item = bundle._arr.find((item) => item.type === 'JavaScript');
    const css_item = bundle._arr.find((item) => item.type === 'CSS');
    const js_text = (js_item && js_item.text) || '';
    const css_text = (css_item && css_item.text) || '';
    const manifest = bundle.bundle_analysis && bundle.bundle_analysis.jsgui3_html_control_scan;

    return {
        js_bytes: Buffer.byteLength(js_text, 'utf8'),
        css_bytes: Buffer.byteLength(css_text, 'utf8'),
        markers_found: find_window_markers(js_text, css_text),
        manifest
    };
};

describe('Control Elimination Static Bracket Access Tests', function () {
    this.timeout(180000);

    const fixture_paths = [];
    const fixture_dir = __dirname;
    let static_bracket_fixture_path = null;
    let controls_alias_static_bracket_fixture_path = null;
    let dynamic_bracket_fixture_path = null;

    const write_fixture = async (file_name, source_text) => {
        const fixture_path = path.join(fixture_dir, file_name);
        await fs.writeFile(fixture_path, source_text, 'utf8');
        fixture_paths.push(fixture_path);
        return fixture_path;
    };

    before(async function () {
        static_bracket_fixture_path = await write_fixture('temp_control_elimination_static_bracket_client.js', `
const jsgui = require('jsgui3-html');
const controls = jsgui.controls;

class Temp_Static_Bracket_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            const button_constructor = controls['Button'];
            const button = new button_constructor({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Static_Bracket_App };
`);

        controls_alias_static_bracket_fixture_path = await write_fixture('temp_control_elimination_static_bracket_controls_alias_client.js', `
const jsgui = require('jsgui3-html');
const controls_registry = jsgui['controls'];

class Temp_Static_Bracket_Controls_Alias_App extends controls_registry['Active_HTML_Document'] {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            const button_constructor = controls_registry['Button'];
            const button = new button_constructor({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Static_Bracket_Controls_Alias_App };
`);

        dynamic_bracket_fixture_path = await write_fixture('temp_control_elimination_dynamic_bracket_client.js', `
const jsgui = require('jsgui3-html');
const controls = jsgui.controls;

class Temp_Dynamic_Bracket_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            const control_name = 'Button';
            const control_constructor = controls[control_name];
            const button = new control_constructor({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Dynamic_Bracket_App };
`);
    });

    after(async function () {
        await Promise.all(fixture_paths.map(async (fixture_path) => {
            try {
                await fs.unlink(fixture_path);
            } catch (err) {
                // Ignore missing temporary files.
            }
        }));
    });

    it('keeps elimination enabled for static bracket access and reduces bundle size', async function () {
        const default_bundler = create_bundler(false);
        const disabled_bundler = create_bundler(true);

        const default_metrics = extract_bundle_metrics(await default_bundler.bundle(static_bracket_fixture_path));
        const disabled_metrics = extract_bundle_metrics(await disabled_bundler.bundle(static_bracket_fixture_path));

        assert(default_metrics.manifest, 'Expected control scan manifest for static bracket fixture');
        assert.strictEqual(
            default_metrics.manifest.dynamic_control_access_detected,
            false,
            'Static bracket access should not be treated as dynamic'
        );
        assert(
            Array.isArray(default_metrics.manifest.selected_controls) &&
            default_metrics.manifest.selected_controls.includes('Button'),
            'Expected Button in selected_controls for static bracket fixture'
        );
        assert(
            !default_metrics.manifest.selected_controls.includes('Window'),
            'Did not expect Window in selected_controls for static bracket fixture'
        );
        assert.strictEqual(
            default_metrics.markers_found.length,
            0,
            `Unexpected Window markers in static bracket default bundle: ${default_metrics.markers_found.join(', ')}`
        );
        assert(
            disabled_metrics.markers_found.length > 0,
            'Expected Window markers when elimination is disabled for static bracket fixture'
        );
        assert(
            default_metrics.js_bytes < disabled_metrics.js_bytes,
            'Expected static bracket default bundle to be smaller than elimination-disabled bundle'
        );
    });

    it('still disables elimination for truly dynamic bracket access', async function () {
        const default_bundler = create_bundler(false);
        const disabled_bundler = create_bundler(true);

        const default_metrics = extract_bundle_metrics(await default_bundler.bundle(dynamic_bracket_fixture_path));
        const disabled_metrics = extract_bundle_metrics(await disabled_bundler.bundle(dynamic_bracket_fixture_path));
        const js_size_delta = Math.abs(default_metrics.js_bytes - disabled_metrics.js_bytes);

        assert(default_metrics.manifest, 'Expected control scan manifest for dynamic bracket fixture');
        assert.strictEqual(
            default_metrics.manifest.dynamic_control_access_detected,
            true,
            'Dynamic bracket access should be detected and disable elimination'
        );
        assert(
            default_metrics.markers_found.length > 0,
            'Expected Window markers in default bundle when control access is truly dynamic'
        );
        assert(
            js_size_delta < 4096,
            `Expected dynamic default bundle size to be close to elimination-disabled size (delta=${js_size_delta})`
        );
    });

    it('keeps elimination enabled when controls alias is assigned from static bracket access', async function () {
        const default_bundler = create_bundler(false);
        const disabled_bundler = create_bundler(true);

        const default_metrics = extract_bundle_metrics(await default_bundler.bundle(controls_alias_static_bracket_fixture_path));
        const disabled_metrics = extract_bundle_metrics(await disabled_bundler.bundle(controls_alias_static_bracket_fixture_path));

        assert(default_metrics.manifest, 'Expected control scan manifest for controls-alias static bracket fixture');
        assert.strictEqual(
            default_metrics.manifest.dynamic_control_access_detected,
            false,
            'Static controls alias bracket access should not be treated as dynamic'
        );
        assert(
            default_metrics.manifest.selected_controls.includes('Active_HTML_Document'),
            'Expected Active_HTML_Document in selected_controls for controls-alias static bracket fixture'
        );
        assert(
            default_metrics.manifest.selected_controls.includes('Button'),
            'Expected Button in selected_controls for controls-alias static bracket fixture'
        );
        assert(
            !default_metrics.manifest.selected_controls.includes('Window'),
            'Did not expect Window in selected_controls for controls-alias static bracket fixture'
        );
        assert.strictEqual(
            default_metrics.markers_found.length,
            0,
            `Unexpected Window markers in controls-alias static bracket default bundle: ${default_metrics.markers_found.join(', ')}`
        );
        assert(
            disabled_metrics.markers_found.length > 0,
            'Expected Window markers when elimination is disabled for controls-alias static bracket fixture'
        );
        assert(
            default_metrics.js_bytes < disabled_metrics.js_bytes,
            'Expected controls-alias static bracket default bundle to be smaller than elimination-disabled bundle'
        );
    });
});
