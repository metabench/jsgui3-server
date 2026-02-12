const assert = require('assert');
const path = require('path');
const { describe, it } = require('mocha');

const JSGUI3_HTML_Control_Optimizer = require('../resources/processors/bundlers/js/esbuild/JSGUI3_HTML_Control_Optimizer');

const entry_file_path = path.join(__dirname, 'fixtures', 'bundling-default-button-client.js');

describe('Control Optimizer Cache Behavior Tests', function () {
    this.timeout(60000);

    it('records cache hits on repeated optimize calls when cache is enabled', async function () {
        const optimizer = new JSGUI3_HTML_Control_Optimizer({
            package_name: 'jsgui3-html',
            cacheEnabled: true,
            sharedCache: false
        });

        const first_result = await optimizer.optimize(entry_file_path);
        const second_result = await optimizer.optimize(entry_file_path);

        assert.strictEqual(first_result.enabled, true);
        assert.strictEqual(second_result.enabled, true);
        assert(first_result.manifest.selected_controls.includes('Button'));

        const cache_stats = optimizer.cache_stats;
        assert(cache_stats.entry_analysis_misses >= 1, 'Expected at least one entry analysis cache miss');
        assert(cache_stats.entry_analysis_hits >= 1, 'Expected at least one entry analysis cache hit');
        assert(cache_stats.controls_map_hits >= 1, 'Expected cached controls map reuse');
    });

    it('avoids cache hits when cache is disabled', async function () {
        const optimizer = new JSGUI3_HTML_Control_Optimizer({
            package_name: 'jsgui3-html',
            cacheEnabled: false,
            sharedCache: false
        });

        const first_result = await optimizer.optimize(entry_file_path);
        const second_result = await optimizer.optimize(entry_file_path);

        assert.strictEqual(first_result.enabled, true);
        assert.strictEqual(second_result.enabled, true);

        const cache_stats = optimizer.cache_stats;
        assert.strictEqual(cache_stats.entry_analysis_hits, 0, 'Expected no entry analysis cache hits');
        assert.strictEqual(cache_stats.file_scan_hits, 0, 'Expected no file scan cache hits');
        assert.strictEqual(cache_stats.controls_map_hits, 0, 'Expected no controls map cache hits');
        assert(cache_stats.file_scan_misses >= 2, 'Expected repeated uncached file scans');
        assert(cache_stats.controls_map_misses >= 2, 'Expected repeated uncached controls map reads');
    });
});
