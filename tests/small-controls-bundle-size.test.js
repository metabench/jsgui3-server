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

const to_module_literal = (file_path) => file_path.replace(/\\/g, '\\\\');

const find_window_markers = (js_text, css_text) => {
    const search_text = `${js_text || ''}\n${css_text || ''}`;
    return window_markers.filter(marker => search_text.includes(marker));
};

const bundle_fixture = async (bundler, fixture_path) => {
    const bundle_result = await bundler.bundle(fixture_path);
    const bundle = bundle_result[0];

    const js_item = bundle._arr.find(item => item.type === 'JavaScript');
    const css_item = bundle._arr.find(item => item.type === 'CSS');

    const js_text = (js_item && js_item.text) || '';
    const css_text = (css_item && css_item.text) || '';
    const markers_found = find_window_markers(js_text, css_text);

    return {
        js_bytes: Buffer.byteLength(js_text, 'utf8'),
        css_bytes: Buffer.byteLength(css_text, 'utf8'),
        markers_found,
        bundle_analysis: bundle.bundle_analysis || null
    };
};

describe('Small Controls Bundle Size and Window Exclusion Tests', function () {
    this.timeout(180000);

    const fixture_paths = [];
    const fixture_metrics = {};

    const fixture_dir = __dirname;
    const jsgui_html_root = path.dirname(require.resolve('jsgui3-html'));

    const active_html_document_path = to_module_literal(path.join(jsgui_html_root, 'controls/organised/1-standard/5-ui/Active_HTML_Document.js'));
    const button_control_path = to_module_literal(path.join(jsgui_html_root, 'controls/organised/0-core/0-basic/0-native-compositional/button.js'));
    const date_picker_control_path = to_module_literal(path.join(jsgui_html_root, 'controls/organised/0-core/0-basic/0-native-compositional/date-picker.js'));
    const color_picker_control_path = to_module_literal(path.join(jsgui_html_root, 'controls/organised/0-core/0-basic/1-compositional/color-picker.js'));

    const write_fixture = async (file_name, source_text) => {
        const fixture_path = path.join(fixture_dir, file_name);
        await fs.writeFile(fixture_path, source_text, 'utf8');
        fixture_paths.push(fixture_path);
        return fixture_path;
    };

    before(async function () {
        const broad_import_fixture = await write_fixture('temp_small_controls_broad_client.js', `
const jsgui = require('jsgui3-html');
const controls = jsgui.controls;

class Tiny_Broad_Import_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            const button = new controls.Button({ context: this.context });
            button.add('ok');
            this.body.add(button);
        }
    }
}

module.exports = { Tiny_Broad_Import_App };
`);

        const button_only_fixture = await write_fixture('temp_small_controls_button_only_client.js', `
const Active_HTML_Document = require('${active_html_document_path}');
const Button = require('${button_control_path}');

class Tiny_Button_Only_App extends Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            const button = new Button({ context: this.context });
            button.add('ok');
            this.body.add(button);
        }
    }
}

module.exports = { Tiny_Button_Only_App };
`);

        const date_picker_only_fixture = await write_fixture('temp_small_controls_date_picker_only_client.js', `
const Active_HTML_Document = require('${active_html_document_path}');
const Date_Picker = require('${date_picker_control_path}');

class Tiny_Date_Picker_Only_App extends Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            const date_picker = new Date_Picker({ context: this.context });
            this.body.add(date_picker);
        }
    }
}

module.exports = { Tiny_Date_Picker_Only_App };
`);

        const color_picker_only_fixture = await write_fixture('temp_small_controls_color_picker_only_client.js', `
const Active_HTML_Document = require('${active_html_document_path}');
const Color_Picker = require('${color_picker_control_path}');

class Tiny_Color_Picker_Only_App extends Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            const color_picker = new Color_Picker({ context: this.context });
            this.body.add(color_picker);
        }
    }
}

module.exports = { Tiny_Color_Picker_Only_App };
`);

        const default_bundler = new Advanced_JS_Bundler_Using_ESBuild({
            debug: false,
            bundler: {
                minify: {
                    enabled: true,
                    level: 'normal'
                }
            }
        });

        const disabled_elimination_bundler = new Advanced_JS_Bundler_Using_ESBuild({
            debug: false,
            bundler: {
                minify: {
                    enabled: true,
                    level: 'normal'
                },
                elimination: {
                    enabled: false,
                    jsgui3_html_controls: {
                        enabled: false
                    }
                }
            }
        });

        const cache_disabled_bundler = new Advanced_JS_Bundler_Using_ESBuild({
            debug: false,
            bundler: {
                minify: {
                    enabled: true,
                    level: 'normal'
                },
                elimination: {
                    enabled: true,
                    jsgui3_html_controls: {
                        cache: {
                            enabled: false
                        }
                    }
                }
            }
        });

        fixture_metrics.broad_import_default = await bundle_fixture(default_bundler, broad_import_fixture);
        fixture_metrics.broad_import_elimination_disabled = await bundle_fixture(disabled_elimination_bundler, broad_import_fixture);
        fixture_metrics.broad_import_cache_disabled = await bundle_fixture(cache_disabled_bundler, broad_import_fixture);
        fixture_metrics.button_only = await bundle_fixture(default_bundler, button_only_fixture);
        fixture_metrics.date_picker_only = await bundle_fixture(default_bundler, date_picker_only_fixture);
        fixture_metrics.color_picker_only = await bundle_fixture(default_bundler, color_picker_only_fixture);

        console.log('[small-controls-bundle-size] metrics', JSON.stringify(fixture_metrics, null, 2));
    });

    after(async function () {
        await Promise.all(fixture_paths.map(async fixture_path => {
            try {
                await fs.unlink(fixture_path);
            } catch (err) {
                // Ignore missing temp fixture files.
            }
        }));
    });

    it('should exclude Window markers in broad jsgui3-html imports by default', function () {
        assert.strictEqual(fixture_metrics.broad_import_default.markers_found.length, 0,
            `Unexpected Window markers in broad default bundle: ${fixture_metrics.broad_import_default.markers_found.join(', ')}`);
    });

    it('should include Window markers when control elimination is explicitly disabled', function () {
        assert(fixture_metrics.broad_import_elimination_disabled.markers_found.length > 0,
            'Expected broad import bundle with elimination disabled to contain Window markers');
    });

    it('should keep elimination behavior when cache is disabled', function () {
        assert.strictEqual(fixture_metrics.broad_import_cache_disabled.markers_found.length, 0,
            `Unexpected Window markers in cache-disabled elimination bundle: ${fixture_metrics.broad_import_cache_disabled.markers_found.join(', ')}`);
    });

    it('should exclude Window markers when only Button control is directly imported', function () {
        assert.strictEqual(fixture_metrics.button_only.markers_found.length, 0,
            `Unexpected Window markers in button-only bundle: ${fixture_metrics.button_only.markers_found.join(', ')}`);
    });

    it('should exclude Window markers when only Date_Picker control is directly imported', function () {
        assert.strictEqual(fixture_metrics.date_picker_only.markers_found.length, 0,
            `Unexpected Window markers in date-picker-only bundle: ${fixture_metrics.date_picker_only.markers_found.join(', ')}`);
    });

    it('should exclude Window markers when only Color_Picker control is directly imported', function () {
        assert.strictEqual(fixture_metrics.color_picker_only.markers_found.length, 0,
            `Unexpected Window markers in color-picker-only bundle: ${fixture_metrics.color_picker_only.markers_found.join(', ')}`);
    });

    it('should produce smaller JS bundles for direct small-control imports than broad import', function () {
        assert(fixture_metrics.button_only.js_bytes < fixture_metrics.broad_import_elimination_disabled.js_bytes,
            'Button-only bundle should be smaller than broad import bundle with elimination disabled');
        assert(fixture_metrics.date_picker_only.js_bytes < fixture_metrics.broad_import_elimination_disabled.js_bytes,
            'Date-picker-only bundle should be smaller than broad import bundle with elimination disabled');
        assert(fixture_metrics.color_picker_only.js_bytes < fixture_metrics.broad_import_elimination_disabled.js_bytes,
            'Color-picker-only bundle should be smaller than broad import bundle with elimination disabled');
    });

    it('should reduce broad-import JS size when default elimination scan is active', function () {
        assert(fixture_metrics.broad_import_default.js_bytes < fixture_metrics.broad_import_elimination_disabled.js_bytes,
            'Default broad-import bundle should be smaller than broad-import bundle with elimination disabled');
    });

    it('should expose control scan analysis metadata for default broad import bundle', function () {
        const analysis = fixture_metrics.broad_import_default.bundle_analysis &&
            fixture_metrics.broad_import_default.bundle_analysis.jsgui3_html_control_scan;
        assert(analysis, 'Expected bundle_analysis.jsgui3_html_control_scan metadata');
        assert(Array.isArray(analysis.selected_controls), 'Expected selected_controls array in control scan metadata');
        assert(analysis.selected_controls.includes('Button'), 'Expected Button in selected_controls');
        assert(!analysis.selected_controls.includes('Window'), 'Expected Window not to be selected');
    });
});
