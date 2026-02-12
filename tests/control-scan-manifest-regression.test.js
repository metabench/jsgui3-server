const assert = require('assert');
const { describe, it, before, after } = require('mocha');
const fs = require('fs').promises;
const path = require('path');

const Advanced_JS_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Advanced_JS_Bundler_Using_ESBuild');

const fixture_file_path = path.join(__dirname, 'fixtures', 'control_scan_manifest_expectations.json');
const update_snapshots = process.env.UPDATE_CONTROL_SCAN_MANIFEST === '1';

const normalize_manifest = (manifest) => {
    const safe_array = (value) => Array.isArray(value) ? Array.from(value).sort() : [];
    const safe_paths = (value) => Array.isArray(value) ? value.map(file_path => path.basename(file_path)).sort() : [];

    return {
        entry_file: manifest && manifest.entry_file_path ? path.basename(manifest.entry_file_path) : null,
        uses_jsgui3_html: Boolean(manifest && manifest.uses_jsgui3_html),
        dynamic_control_access_detected: Boolean(manifest && manifest.dynamic_control_access_detected),
        reachable_files: safe_paths(manifest && manifest.reachable_files),
        used_identifiers: safe_array(manifest && manifest.used_identifiers),
        selected_controls: safe_array(manifest && manifest.selected_controls),
        unmatched_identifiers: safe_array(manifest && manifest.unmatched_identifiers),
        package_aliases: safe_array(manifest && manifest.package_aliases),
        controls_aliases: safe_array(manifest && manifest.controls_aliases)
    };
};

const extract_scan_manifest = (bundle_result) => {
    const bundle = bundle_result[0];
    const analysis = bundle && bundle.bundle_analysis && bundle.bundle_analysis.jsgui3_html_control_scan;
    assert(analysis, 'Expected bundle_analysis.jsgui3_html_control_scan metadata');
    return analysis;
};

describe('Control Scan Manifest Regression Tests', function () {
    this.timeout(120000);

    const temp_fixture_paths = [];

    const write_temp_fixture = async (file_name, source_text) => {
        const temp_path = path.join(__dirname, file_name);
        await fs.writeFile(temp_path, source_text, 'utf8');
        temp_fixture_paths.push(temp_path);
        return temp_path;
    };

    before(async function () {
        // Ensure fixture directory exists when update mode writes snapshots.
        await fs.mkdir(path.dirname(fixture_file_path), { recursive: true });
    });

    after(async function () {
        await Promise.all(temp_fixture_paths.map(async (temp_path) => {
            try {
                await fs.unlink(temp_path);
            } catch (err) {
                // Ignore missing temp files.
            }
        }));
    });

    it('should match strict manifest snapshot for static and dynamic alias usage', async function () {
        const static_alias_fixture_path = await write_temp_fixture('temp_control_scan_static_alias_client.js', `
const ui = require('jsgui3-html');
const ui_controls = ui.controls;
const { Button: Button_Control } = ui_controls;

class Tiny_Static_Alias_App extends ui_controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            const button = new Button_Control({ context: this.context });
            button.add('ok');
            this.body.add(button);
        }
    }
}

module.exports = { Tiny_Static_Alias_App };
`);

        const dynamic_alias_fixture_path = await write_temp_fixture('temp_control_scan_dynamic_alias_client.js', `
const ui = require('jsgui3-html');
const ui_controls = ui.controls;

class Tiny_Dynamic_Alias_App extends ui_controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            const control_name = 'Button';
            const Dynamic_Control = ui_controls[control_name];
            const button = new Dynamic_Control({ context: this.context });
            button.add('ok');
            this.body.add(button);
        }
    }
}

module.exports = { Tiny_Dynamic_Alias_App };
`);

        const bundler = new Advanced_JS_Bundler_Using_ESBuild({
            debug: false,
            bundler: {
                minify: {
                    enabled: true,
                    level: 'normal'
                },
                elimination: {
                    enabled: true,
                    jsgui3_html_controls: {
                        enabled: true
                    }
                }
            }
        });

        const static_manifest = extract_scan_manifest(await bundler.bundle(static_alias_fixture_path));
        const dynamic_manifest = extract_scan_manifest(await bundler.bundle(dynamic_alias_fixture_path));

        const snapshot = {
            static_alias: normalize_manifest(static_manifest),
            dynamic_alias: normalize_manifest(dynamic_manifest)
        };

        if (update_snapshots) {
            await fs.writeFile(fixture_file_path, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
            return;
        }

        let expected_snapshot;
        try {
            const expected_text = await fs.readFile(fixture_file_path, 'utf8');
            expected_snapshot = JSON.parse(expected_text);
        } catch (err) {
            assert.fail(
                `Missing manifest expectation fixture at ${fixture_file_path}. ` +
                'Run with UPDATE_CONTROL_SCAN_MANIFEST=1 to generate it.'
            );
        }

        assert.deepStrictEqual(snapshot, expected_snapshot);
    });
});
