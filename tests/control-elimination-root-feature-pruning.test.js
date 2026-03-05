const assert = require('assert');
const { describe, it, before, after } = require('mocha');
const fs = require('fs').promises;
const path = require('path');

const Advanced_JS_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Advanced_JS_Bundler_Using_ESBuild');

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

const extract_bundle_metrics = (bundle_result) => {
    const bundle = bundle_result[0];
    const js_item = bundle._arr.find((item) => item.type === 'JavaScript');
    const js_text = (js_item && js_item.text) || '';
    const analysis = bundle.bundle_analysis && bundle.bundle_analysis.jsgui3_html_control_scan;
    return {
        js_bytes: Buffer.byteLength(js_text, 'utf8'),
        analysis
    };
};

describe('Control Elimination Root Feature Pruning Tests', function () {
    this.timeout(180000);

    const full_resource_feature_set = [
        'resource',
        'resource_data_kv',
        'resource_data_transform',
        'resource_compilation',
        'resource_compiler',
        'resource_load_compiler'
    ];

    const fixture_paths = [];
    const fixture_dir = __dirname;
    let controls_only_fixture_path = null;
    let router_feature_fixture_path = null;
    let mixins_feature_fixture_path = null;
    let resource_load_compiler_alias_fixture_path = null;
    let resource_compiler_alias_fixture_path = null;
    let resource_compiler_bracket_alias_fixture_path = null;
    let resource_compiler_direct_bracket_alias_fixture_path = null;
    let resource_destructure_alias_fixture_path = null;
    let resource_static_bracket_alias_fixture_path = null;
    let resource_dynamic_bracket_alias_fixture_path = null;

    const write_fixture = async (file_name, source_text) => {
        const fixture_path = path.join(fixture_dir, file_name);
        await fs.writeFile(fixture_path, source_text, 'utf8');
        fixture_paths.push(fixture_path);
        return fixture_path;
    };

    before(async function () {
        controls_only_fixture_path = await write_fixture('temp_control_elimination_root_features_controls_only_client.js', `
const jsgui = require('jsgui3-html');
const controls = jsgui.controls;

class Temp_Root_Features_Controls_Only_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            const button = new controls.Button({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Root_Features_Controls_Only_App };
`);

        router_feature_fixture_path = await write_fixture('temp_control_elimination_root_features_router_client.js', `
const Router = require('jsgui3-html').Router;
const jsgui = require('jsgui3-html');
const controls = jsgui.controls;

class Temp_Root_Features_Router_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            this.router_instance = new Router();
            const button = new controls.Button({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Root_Features_Router_App };
`);

        mixins_feature_fixture_path = await write_fixture('temp_control_elimination_root_features_mixins_client.js', `
const mixins_registry = require('jsgui3-html').mixins;
const jsgui = require('jsgui3-html');
const controls = jsgui.controls;

class Temp_Root_Features_Mixins_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            this.mixins_registry = mixins_registry;
            const button = new controls.Button({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Root_Features_Mixins_App };
`);

        resource_load_compiler_alias_fixture_path = await write_fixture('temp_control_elimination_root_features_resource_load_compiler_alias_client.js', `
const resource_api = require('jsgui3-html').Resource;
const jsgui = require('jsgui3-html');
const controls = jsgui.controls;

class Temp_Root_Features_Resource_Load_Compiler_Alias_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            resource_api.load_compiler('temp_noop_compiler', (input) => input, {});
            const button = new controls.Button({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Root_Features_Resource_Load_Compiler_Alias_App };
`);

        resource_compiler_alias_fixture_path = await write_fixture('temp_control_elimination_root_features_resource_compiler_alias_client.js', `
const ui = require('jsgui3-html');
const resource_api = ui.Resource;
const controls = ui.controls;

class Temp_Root_Features_Resource_Compiler_Alias_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            this.compiler_instance = new resource_api.Compiler({ name: 'temp_compiler' });
            const button = new controls.Button({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Root_Features_Resource_Compiler_Alias_App };
`);

        resource_compiler_bracket_alias_fixture_path = await write_fixture('temp_control_elimination_root_features_resource_compiler_bracket_alias_client.js', `
const ui = require('jsgui3-html');
const resource_api = ui['Resource'];
const controls = ui['controls'];

class Temp_Root_Features_Resource_Compiler_Bracket_Alias_App extends controls['Active_HTML_Document'] {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            this.compiler_instance = new resource_api.Compiler({ name: 'temp_compiler_bracket_alias' });
            const button_constructor = controls['Button'];
            const button = new button_constructor({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Root_Features_Resource_Compiler_Bracket_Alias_App };
`);

        resource_compiler_direct_bracket_alias_fixture_path = await write_fixture('temp_control_elimination_root_features_resource_compiler_direct_bracket_alias_client.js', `
const resource_api = require('jsgui3-html')['Resource'];
const controls = require('jsgui3-html')['controls'];

class Temp_Root_Features_Resource_Compiler_Direct_Bracket_Alias_App extends controls['Active_HTML_Document'] {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            this.compiler_instance = new resource_api.Compiler({ name: 'temp_compiler_direct_bracket_alias' });
            const button_constructor = controls['Button'];
            const button = new button_constructor({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Root_Features_Resource_Compiler_Direct_Bracket_Alias_App };
`);

        resource_destructure_alias_fixture_path = await write_fixture('temp_control_elimination_root_features_resource_destructure_alias_client.js', `
const ui = require('jsgui3-html');
const resource_api = ui.Resource;
const { Data_KV: Data_KV_Resource } = resource_api;
const controls = ui.controls;

class Temp_Root_Features_Resource_Destructure_Alias_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            this.kv_resource = new Data_KV_Resource({ name: 'temp_store' });
            const button = new controls.Button({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Root_Features_Resource_Destructure_Alias_App };
`);

        resource_static_bracket_alias_fixture_path = await write_fixture('temp_control_elimination_root_features_resource_static_bracket_alias_client.js', `
const ui = require('jsgui3-html');
const resource_api = ui.Resource;
const compiler_constructor = resource_api['Compiler'];
const controls = ui.controls;

class Temp_Root_Features_Resource_Static_Bracket_Alias_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            this.compiler_instance = new compiler_constructor({ name: 'temp_compiler_bracket' });
            const button = new controls.Button({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Root_Features_Resource_Static_Bracket_Alias_App };
`);

        resource_dynamic_bracket_alias_fixture_path = await write_fixture('temp_control_elimination_root_features_resource_dynamic_bracket_alias_client.js', `
const ui = require('jsgui3-html');
const resource_api = ui.Resource;
const controls = ui.controls;

class Temp_Root_Features_Resource_Dynamic_Bracket_Alias_App extends controls.Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        if (!spec.el) {
            const feature_name = 'Compiler';
            this.dynamic_resource_feature = resource_api[feature_name];
            const button = new controls.Button({ context: this.context, text: 'ok' });
            this.body.add(button);
        }
    }
}

module.exports = { Temp_Root_Features_Resource_Dynamic_Bracket_Alias_App };
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

    it('keeps optional root features out of controls-only bundles', async function () {
        const bundler = create_default_bundler();
        const metrics = extract_bundle_metrics(await bundler.bundle(controls_only_fixture_path));

        assert(metrics.analysis, 'Expected control scan manifest for controls-only fixture');
        assert(Array.isArray(metrics.analysis.selected_root_features), 'Expected selected_root_features array');
        assert.strictEqual(metrics.analysis.selected_root_features.length, 0, 'Expected no optional root features for controls-only usage');
    });

    it('includes router root feature only when explicitly referenced', async function () {
        const bundler = create_default_bundler();
        const controls_only_metrics = extract_bundle_metrics(await bundler.bundle(controls_only_fixture_path));
        const router_metrics = extract_bundle_metrics(await bundler.bundle(router_feature_fixture_path));

        assert(router_metrics.analysis, 'Expected control scan manifest for router fixture');
        assert(
            router_metrics.analysis.selected_root_features.includes('router'),
            'Expected router in selected_root_features'
        );
        assert(
            router_metrics.js_bytes > controls_only_metrics.js_bytes,
            'Expected router-feature bundle to be larger than controls-only bundle'
        );
    });

    it('includes mixins root feature only when explicitly referenced', async function () {
        const bundler = create_default_bundler();
        const metrics = extract_bundle_metrics(await bundler.bundle(mixins_feature_fixture_path));

        assert(metrics.analysis, 'Expected control scan manifest for mixins fixture');
        assert(
            metrics.analysis.selected_root_features.includes('mixins'),
            'Expected mixins in selected_root_features'
        );
    });

    it('detects Resource.load_compiler when Resource is aliased directly', async function () {
        const bundler = create_default_bundler();
        const metrics = extract_bundle_metrics(await bundler.bundle(resource_load_compiler_alias_fixture_path));

        assert(metrics.analysis, 'Expected control scan manifest for Resource.load_compiler alias fixture');
        assert(
            metrics.analysis.selected_root_features.includes('resource'),
            'Expected resource in selected_root_features for Resource.load_compiler alias fixture'
        );
        assert(
            metrics.analysis.selected_root_features.includes('resource_compiler'),
            'Expected resource_compiler in selected_root_features for Resource.load_compiler alias fixture'
        );
        assert(
            metrics.analysis.selected_root_features.includes('resource_load_compiler'),
            'Expected resource_load_compiler in selected_root_features for Resource.load_compiler alias fixture'
        );
        assert.strictEqual(
            metrics.analysis.dynamic_resource_access_detected,
            false,
            'Did not expect dynamic_resource_access_detected for static Resource.load_compiler alias fixture'
        );
    });

    it('detects Resource.Compiler when Resource is derived from package alias', async function () {
        const bundler = create_default_bundler();
        const metrics = extract_bundle_metrics(await bundler.bundle(resource_compiler_alias_fixture_path));

        assert(metrics.analysis, 'Expected control scan manifest for Resource.Compiler alias fixture');
        assert(
            metrics.analysis.selected_root_features.includes('resource'),
            'Expected resource in selected_root_features for Resource.Compiler alias fixture'
        );
        assert(
            metrics.analysis.selected_root_features.includes('resource_compiler'),
            'Expected resource_compiler in selected_root_features for Resource.Compiler alias fixture'
        );
    });

    it('detects Resource.Compiler when Resource alias is assigned from static bracket access', async function () {
        const bundler = create_default_bundler();
        const metrics = extract_bundle_metrics(await bundler.bundle(resource_compiler_bracket_alias_fixture_path));

        assert(metrics.analysis, 'Expected control scan manifest for Resource.Compiler bracket alias fixture');
        assert(
            metrics.analysis.selected_root_features.includes('resource'),
            'Expected resource in selected_root_features for Resource.Compiler bracket alias fixture'
        );
        assert(
            metrics.analysis.selected_root_features.includes('resource_compiler'),
            'Expected resource_compiler in selected_root_features for Resource.Compiler bracket alias fixture'
        );
        assert.strictEqual(
            metrics.analysis.dynamic_resource_access_detected,
            false,
            'Did not expect dynamic_resource_access_detected for Resource.Compiler bracket alias fixture'
        );
    });

    it('detects Resource.Compiler when Resource alias is assigned from direct require bracket access', async function () {
        const bundler = create_default_bundler();
        const metrics = extract_bundle_metrics(await bundler.bundle(resource_compiler_direct_bracket_alias_fixture_path));

        assert(metrics.analysis, 'Expected control scan manifest for Resource.Compiler direct bracket alias fixture');
        assert(
            metrics.analysis.selected_root_features.includes('resource'),
            'Expected resource in selected_root_features for Resource.Compiler direct bracket alias fixture'
        );
        assert(
            metrics.analysis.selected_root_features.includes('resource_compiler'),
            'Expected resource_compiler in selected_root_features for Resource.Compiler direct bracket alias fixture'
        );
        assert.strictEqual(
            metrics.analysis.dynamic_resource_access_detected,
            false,
            'Did not expect dynamic_resource_access_detected for Resource.Compiler direct bracket alias fixture'
        );
    });

    it('detects resource subfeatures from Resource alias destructuring', async function () {
        const bundler = create_default_bundler();
        const metrics = extract_bundle_metrics(await bundler.bundle(resource_destructure_alias_fixture_path));

        assert(metrics.analysis, 'Expected control scan manifest for Resource alias destructuring fixture');
        assert(
            metrics.analysis.selected_root_features.includes('resource'),
            'Expected resource in selected_root_features for Resource alias destructuring fixture'
        );
        assert(
            metrics.analysis.selected_root_features.includes('resource_data_kv'),
            'Expected resource_data_kv in selected_root_features for Resource alias destructuring fixture'
        );
    });

    it('detects resource subfeatures from static Resource alias bracket access', async function () {
        const bundler = create_default_bundler();
        const metrics = extract_bundle_metrics(await bundler.bundle(resource_static_bracket_alias_fixture_path));

        assert(metrics.analysis, 'Expected control scan manifest for static Resource alias bracket fixture');
        assert(
            metrics.analysis.selected_root_features.includes('resource_compiler'),
            'Expected resource_compiler in selected_root_features for static Resource alias bracket fixture'
        );
        assert.strictEqual(
            metrics.analysis.dynamic_resource_access_detected,
            false,
            'Did not expect dynamic_resource_access_detected for static Resource alias bracket fixture'
        );
    });

    it('falls back to full resource family for dynamic Resource alias bracket access', async function () {
        const bundler = create_default_bundler();
        const controls_only_metrics = extract_bundle_metrics(await bundler.bundle(controls_only_fixture_path));
        const metrics = extract_bundle_metrics(await bundler.bundle(resource_dynamic_bracket_alias_fixture_path));

        assert(metrics.analysis, 'Expected control scan manifest for dynamic Resource alias bracket fixture');
        assert.strictEqual(
            metrics.analysis.dynamic_control_access_detected,
            false,
            'Dynamic Resource alias bracket access should not trigger dynamic control fallback'
        );
        assert.strictEqual(
            metrics.analysis.dynamic_resource_access_detected,
            true,
            'Expected dynamic_resource_access_detected for dynamic Resource alias bracket fixture'
        );
        for (const feature_name of full_resource_feature_set) {
            assert(
                metrics.analysis.selected_root_features.includes(feature_name),
                `Expected ${feature_name} in selected_root_features for dynamic Resource alias bracket fixture`
            );
        }
        assert(
            metrics.js_bytes > controls_only_metrics.js_bytes,
            'Expected dynamic Resource alias fixture bundle to be larger than controls-only bundle'
        );
    });
});
