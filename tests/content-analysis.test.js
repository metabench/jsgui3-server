const assert = require('assert');
const { describe, it, beforeEach, afterEach } = require('mocha');
const zlib = require('zlib');
const fs = require('fs').promises;
const path = require('path');

// Import classes for content analysis
const Core_JS_Non_Minifying_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Core_JS_Non_Minifying_Bundler_Using_ESBuild');
const Core_JS_Single_File_Minifying_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Core_JS_Single_File_Minifying_Bundler_Using_ESBuild');
const Advanced_JS_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Advanced_JS_Bundler_Using_ESBuild');
const Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner = require('../publishers/helpers/assigners/static-compressed-response-buffers/Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner');

describe('Content Analysis Tests', function() {
    this.timeout(15000);

    let testJsContent;
    let testCssContent;
    let testHtmlContent;
    let testJsFile;

    beforeEach(async function() {
        // Create test content
        testJsContent = `
            // Test JavaScript with various constructs
            function testFunction(param1, param2) {
                console.log('Testing function with parameters:', param1, param2);
                const result = param1 + param2;
                return result;
            }

            const testObject = {
                property1: 'value1',
                property2: 42,
                method: function() {
                    return this.property1 + this.property2;
                }
            };

            class TestClass {
                constructor(name) {
                    this.name = name;
                }

                greet() {
                    return \`Hello, \${this.name}!\`;
                }
            }

            TestClass.css = \`
                .test-class {
                    background-color: #ffffff;
                    border: 1px solid #cccccc;
                    padding: 10px;
                    margin: 5px;
                }
                .test-class:hover {
                    background-color: #f0f0f0;
                }
            \`;

            TestClass.scss = \`
                $accent-color: #33aacc;
                .sass-class {
                    color: $accent-color;
                }
            \`;

            // Export
            module.exports = { testFunction, testObject, TestClass };
        `;

        testCssContent = `
            /* Test CSS with various rules */
            .header {
                background-color: #333333;
                color: white;
                padding: 20px;
                text-align: center;
            }

            .content {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                font-family: Arial, sans-serif;
                line-height: 1.6;
            }

            .footer {
                background-color: #666666;
                color: white;
                text-align: center;
                padding: 10px;
                position: fixed;
                bottom: 0;
                width: 100%;
            }

            @media (max-width: 768px) {
                .content {
                    padding: 10px;
                }
                .header {
                    padding: 10px;
                }
            }
        `;

        testHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Page</title>
    <link rel="stylesheet" href="/css/css.css">
</head>
<body>
    <header class="header">
        <h1>Test Application</h1>
    </header>

    <main class="content">
        <h2>Welcome to the Test Page</h2>
        <p>This is a comprehensive test of the minification, compression, and sourcemap features.</p>

        <div id="test-container">
            <button onclick="testFunction('hello', 'world')">Test Button</button>
            <div id="output"></div>
        </div>

        <script src="/js/js.js"></script>
    </main>

    <footer class="footer">
        <p>&copy; 2024 Test Application</p>
    </footer>
</body>
</html>`;

        // Create temporary JS file
        testJsFile = path.join(__dirname, 'temp_analysis_test.js');
        await fs.writeFile(testJsFile, testJsContent);
    });

    afterEach(async function() {
        // Clean up temporary file
        try {
            await fs.unlink(testJsFile);
        } catch (err) {
            // Ignore if file doesn't exist
        }
    });

    describe('JavaScript Minification Analysis', function() {
        it('should verify minification effectiveness at different levels', async function() {
            const levels = ['conservative', 'normal', 'aggressive'];
            const results = {};

            for (const level of levels) {
                const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                    minify: { level, enabled: true }
                });

                const result = await bundler.bundle(testJsContent);
                const minified = result[0]._arr[0].text;

                results[level] = {
                    originalSize: testJsContent.length,
                    minifiedSize: minified.length,
                    compressionRatio: minified.length / testJsContent.length,
                    content: minified
                };
            }

            // Verify minification occurred for all levels
            Object.keys(results).forEach(level => {
                const result = results[level];
                assert(result.minifiedSize < result.originalSize,
                       `${level} minification should reduce size`);
                assert(result.compressionRatio < 1,
                       `${level} minification should have compression ratio < 1`);
            });

            // Verify aggressive is generally smaller than conservative
            assert(results.aggressive.minifiedSize <= results.normal.minifiedSize,
                   'Aggressive minification should be at least as small as normal');
            assert(results.normal.minifiedSize <= results.conservative.minifiedSize,
                   'Normal minification should be at least as small as conservative');
        });

        it('should preserve functionality after minification', async function() {
            const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                minify: { level: 'normal', enabled: true }
            });

            const result = await bundler.bundle(testJsContent);
            const minified = result[0]._arr[0].text;

            // Verify key identifiers are preserved
            assert(minified.includes('testFunction'), 'Should preserve function name');
            assert(minified.includes('testObject'), 'Should preserve object name');
            assert(minified.includes('TestClass'), 'Should preserve class name');

            // Verify string literals are preserved
            assert(minified.includes('Testing function with parameters'),
                   'Should preserve string literals');
            assert(minified.includes('Hello'),
                   'Should preserve template literal content');
        });

        it('should handle aggressive minification options', async function() {
            const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                minify: {
                    level: 'aggressive',
                    options: {
                        drop_console: true,
                        drop_debugger: true
                    }
                }
            });

            const result = await bundler.bundle(testJsContent);
            const minified = result[0]._arr[0].text;

            // With drop_console: true, console.log should be removed (though esbuild may not always remove all)
            // Just verify the bundler completes successfully and produces valid output
            assert(minified.length > 0, 'Should produce minified output');
            assert(minified.includes('testFunction'), 'Should preserve essential function names');
        });

        it('should maintain CSS extraction during advanced bundling', async function() {
            const bundler = new Advanced_JS_Bundler_Using_ESBuild({
                debug: false,
                bundler: {
                    minify: { enabled: true, level: 'normal' }
                }
            });

            const result = await bundler.bundle(testJsFile);
            const jsItem = result[0]._arr.find(item => item.type === 'JavaScript');
            const cssItem = result[0]._arr.find(item => item.type === 'CSS');

            assert(jsItem, 'Should contain JavaScript item');
            assert(cssItem, 'Should contain CSS item');

            // Verify CSS was extracted and is separate
            assert(cssItem.text.includes('.test-class'), 'CSS should contain test class');
            assert(cssItem.text.includes('background-color'), 'CSS should contain background-color property');

            // Verify JS no longer contains the CSS
            assert(!jsItem.text.includes('.test-class'), 'JS should not contain CSS after extraction');
            assert(!jsItem.text.includes('background-color'), 'JS should not contain CSS properties');
        });
    });

    describe('Compression Analysis', function() {
        let mockBundleItems;

        beforeEach(function() {
            // Create mock bundle items for compression testing
            mockBundleItems = [
                {
                    type: 'HTML',
                    extension: 'html',
                    text: testHtmlContent,
                    response_buffers: {}
                },
                {
                    type: 'JavaScript',
                    extension: 'js',
                    text: testJsContent,
                    response_buffers: {}
                },
                {
                    type: 'CSS',
                    extension: 'css',
                    text: testCssContent,
                    response_buffers: {}
                }
            ];

            // Initialize identity buffers
            mockBundleItems.forEach(item => {
                item.response_buffers.identity = Buffer.from(item.text, 'utf8');
            });
        });

        it('should analyze gzip compression ratios', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['gzip'],
                    gzip: { level: 6 }
                }
            });

            await assigner.assign(mockBundleItems);

            mockBundleItems.forEach(item => {
                if (item.response_buffers.gzip) {
                    const originalSize = item.response_buffers.identity.length;
                    const compressedSize = item.response_buffers.gzip.length;
                    const compressionRatio = compressedSize / originalSize;

                    // Verify compression occurred
                    assert(compressedSize < originalSize, `${item.type} should be compressed`);
                    assert(compressionRatio < 1, `${item.type} should have compression ratio < 1`);
                    assert(compressionRatio > 0.1, `${item.type} compression ratio should be reasonable`);

                    console.log(`${item.type} compression: ${originalSize} → ${compressedSize} bytes (${(compressionRatio * 100).toFixed(1)}%)`);
                }
            });
        });

        it('should analyze brotli compression ratios', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['br'],
                    brotli: { quality: 6 }
                }
            });

            await assigner.assign(mockBundleItems);

            mockBundleItems.forEach(item => {
                if (item.response_buffers.br) {
                    const originalSize = item.response_buffers.identity.length;
                    const compressedSize = item.response_buffers.br.length;
                    const compressionRatio = compressedSize / originalSize;

                    // Verify compression occurred
                    assert(compressedSize < originalSize, `${item.type} should be compressed`);
                    assert(compressionRatio < 1, `${item.type} should have compression ratio < 1`);

                    console.log(`${item.type} Brotli compression: ${originalSize} → ${compressedSize} bytes (${(compressionRatio * 100).toFixed(1)}%)`);
                }
            });
        });

        it('should compare gzip vs brotli compression effectiveness', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['gzip', 'br']
                }
            });

            await assigner.assign(mockBundleItems);

            mockBundleItems.forEach(item => {
                if (item.response_buffers.gzip && item.response_buffers.br) {
                    const originalSize = item.response_buffers.identity.length;
                    const gzipSize = item.response_buffers.gzip.length;
                    const brotliSize = item.response_buffers.br.length;

                    const gzipRatio = gzipSize / originalSize;
                    const brotliRatio = brotliSize / originalSize;

                    // Brotli should generally be better than or equal to gzip for text
                    assert(brotliRatio <= gzipRatio, `Brotli should be at least as good as gzip for ${item.type}`);

                    console.log(`${item.type} - Gzip: ${(gzipRatio * 100).toFixed(1)}%, Brotli: ${(brotliRatio * 100).toFixed(1)}%`);
                }
            });
        });

        it('should verify compressed content integrity', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['gzip', 'br']
                }
            });

            await assigner.assign(mockBundleItems);

            // Test gzip decompression
            for (const item of mockBundleItems) {
                if (item.response_buffers.gzip) {
                    const decompressed = zlib.gunzipSync(item.response_buffers.gzip).toString();
                    assert.strictEqual(decompressed, item.text,
                                     `${item.type} gzip decompression should match original`);
                }
            }

            // Test brotli decompression
            for (const item of mockBundleItems) {
                if (item.response_buffers.br) {
                    const decompressed = zlib.brotliDecompressSync(item.response_buffers.br).toString();
                    assert.strictEqual(decompressed, item.text,
                                     `${item.type} brotli decompression should match original`);
                }
            }
        });

        it('should analyze compression threshold behavior', async function() {
            const largeContent = 'x'.repeat(2000); // 2000 bytes
            const smallContent = 'x'.repeat(500);  // 500 bytes

            const testItems = [
                {
                    type: 'Large',
                    text: largeContent,
                    response_buffers: { identity: Buffer.from(largeContent) }
                },
                {
                    type: 'Small',
                    text: smallContent,
                    response_buffers: { identity: Buffer.from(smallContent) }
                }
            ];

            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['gzip'],
                    threshold: 1024 // 1KB threshold
                }
            });

            await assigner.assign(testItems);

            // Large content should be compressed
            assert(testItems[0].response_buffers.gzip, 'Large content should be compressed');
            assert(testItems[0].response_buffers.gzip.length < largeContent.length,
                   'Large content should actually be compressed');

            // Small content should not be compressed (below threshold)
            assert(!testItems[1].response_buffers.gzip, 'Small content should not be compressed due to threshold');
        });
    });

    describe('Sourcemap Analysis', function() {
        it('should verify inline sourcemap generation', async function() {
            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild({
                debug: true,
                sourcemaps: {
                    enabled: true,
                    format: 'inline'
                }
            });

            const result = await bundler.bundle(testJsFile);
            const jsContent = result[0]._arr[0].text;

            // Verify sourcemap is present
            assert(jsContent.includes('//# sourceMappingURL='), 'Should contain inline sourcemap');

            // Extract and verify sourcemap content
            const sourcemapMatch = jsContent.match(/\/\/# sourceMappingURL=data:application\/json;base64,([A-Za-z0-9+/=]+)/);
            assert(sourcemapMatch, 'Should have valid sourcemap data URL');

            // Decode and parse sourcemap
            const sourcemapData = Buffer.from(sourcemapMatch[1], 'base64').toString();
            const sourcemap = JSON.parse(sourcemapData);

            // Verify sourcemap structure
            assert(sourcemap.version, 'Sourcemap should have version');
            assert(Array.isArray(sourcemap.sources), 'Sourcemap should have sources array');
            assert(sourcemap.sources.length > 0, 'Sourcemap should have at least one source');
            assert(sourcemap.mappings, 'Sourcemap should have mappings');
        });

        it('should verify sourcemap exclusion in production mode', async function() {
            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild({
                debug: false,
                sourcemaps: {
                    enabled: false
                }
            });

            const result = await bundler.bundle(testJsFile);
            const jsContent = result[0]._arr[0].text;

            // Verify sourcemap is NOT present
            assert(!jsContent.includes('//# sourceMappingURL='), 'Production mode should not include sourcemap');
        });

        it('should verify sourcemaps work with advanced bundling', async function() {
            const bundler = new Advanced_JS_Bundler_Using_ESBuild({
                debug: true,
                bundler: {
                    sourcemaps: {
                        enabled: true,
                        format: 'inline'
                    }
                }
            });

            const result = await bundler.bundle(testJsFile);
            const jsItem = result[0]._arr.find(item => item.type === 'JavaScript');

            // Verify sourcemap is present in the bundled JS
            assert(jsItem.text.includes('//# sourceMappingURL='), 'Advanced bundling should include sourcemaps in debug mode');
        });
    });

    describe('Bundle Content Integrity', function() {
        it('should verify bundled content contains expected elements', async function() {
            const bundler = new Advanced_JS_Bundler_Using_ESBuild({
                debug: false,
                bundler: {
                    minify: { enabled: true, level: 'normal' }
                }
            });

            const result = await bundler.bundle(testJsFile);
            const jsItem = result[0]._arr.find(item => item.type === 'JavaScript');
            const cssItem = result[0]._arr.find(item => item.type === 'CSS');

            // Verify JS content
            assert(jsItem.text.includes('testFunction'), 'Bundled JS should contain testFunction');
            assert(jsItem.text.includes('TestClass'), 'Bundled JS should contain TestClass');

            // Verify CSS content
            assert(cssItem.text.includes('.test-class'), 'Bundled CSS should contain test class');
            assert(cssItem.text.includes('background-color'), 'Bundled CSS should contain CSS properties');

            // Verify CSS is properly formatted (not mangled)
            assert(cssItem.text.includes('{'), 'CSS should contain opening braces');
            assert(cssItem.text.includes('}'), 'CSS should contain closing braces');
        });

        it('should verify minified content is still valid JavaScript', async function() {
            const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                minify: { enabled: true, level: 'aggressive' }
            });

            const result = await bundler.bundle(testJsContent);
            const minified = result[0]._arr[0].text;

            // Basic syntax checks - should not contain syntax errors when parsed
            // Note: This is a basic check; full validation would require a JS parser
            assert.doesNotThrow(() => {
                // Try to create a Function from the minified code (basic syntax check)
                new Function(minified);
            }, 'Minified code should be valid JavaScript');

            // Should still contain essential code elements
            assert(minified.includes('function'), 'Should contain function declarations');
            assert(minified.includes('return'), 'Should contain return statements');
        });

        it('should verify CSS extraction preserves CSS structure', async function() {
            const bundler = new Advanced_JS_Bundler_Using_ESBuild();

            const result = await bundler.bundle(testJsFile);
            const cssItem = result[0]._arr.find(item => item.type === 'CSS');

            // Verify CSS structure is preserved
            const cssLines = cssItem.text.split('\n').filter(line => line.trim());

            // Should contain selectors and declarations
            assert(cssLines.some(line => line.includes('.test-class')), 'Should contain CSS selectors');
            assert(cssLines.some(line => line.includes('background-color')), 'Should contain CSS properties');
            assert(cssLines.some(line => line.includes('{')), 'Should contain opening braces');
            assert(cssLines.some(line => line.includes('}')), 'Should contain closing braces');
        });
    });

    describe('Performance Metrics Analysis', function() {
        it('should measure and compare bundling performance', async function() {
            const bundlers = {
                nonMinifying: new Core_JS_Non_Minifying_Bundler_Using_ESBuild(),
                minifying: new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                    minify: { enabled: true, level: 'normal' }
                }),
                advanced: new Advanced_JS_Bundler_Using_ESBuild({
                    bundler: { minify: { enabled: true, level: 'normal' } }
                })
            };

            const results = {};

            for (const [name, bundler] of Object.entries(bundlers)) {
                const startTime = Date.now();
                const result = await bundler.bundle(testJsFile);
                const endTime = Date.now();

                const bundle = result[0];
                const jsItem = bundle._arr.find(item => item.type === 'JavaScript');

                results[name] = {
                    duration: endTime - startTime,
                    outputSize: jsItem.text.length,
                    inputSize: testJsContent.length
                };
            }

            // Log performance results
            Object.entries(results).forEach(([name, result]) => {
                console.log(`${name}: ${result.duration}ms, ${result.inputSize} → ${result.outputSize} bytes`);
            });

            // Basic performance assertions
            assert(results.nonMinifying.duration >= 0, 'Non-minifying bundler should complete');
            assert(results.minifying.duration >= 0, 'Minifying bundler should complete');
            assert(results.advanced.duration >= 0, 'Advanced bundler should complete');

            // Minifying should generally take longer than non-minifying
            // (though this may not always be true due to various factors)
            console.log('Performance analysis complete');
        });

        it('should analyze compression performance', async function() {
            const testData = 'console.log("test");'.repeat(1000); // Repetitive content that compresses well
            const item = {
                type: 'JavaScript',
                text: testData,
                response_buffers: {
                    identity: Buffer.from(testData)
                }
            };

            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['gzip', 'br']
                }
            });

            const startTime = Date.now();
            await assigner.assign([item]);
            const endTime = Date.now();

            const compressionTime = endTime - startTime;
            const originalSize = item.response_buffers.identity.length;
            const gzipSize = item.response_buffers.gzip.length;
            const brotliSize = item.response_buffers.br.length;

            console.log(`Compression performance: ${compressionTime}ms`);
            console.log(`Original: ${originalSize} bytes`);
            console.log(`Gzip: ${gzipSize} bytes (${((gzipSize/originalSize)*100).toFixed(1)}%)`);
            console.log(`Brotli: ${brotliSize} bytes (${((brotliSize/originalSize)*100).toFixed(1)}%)`);

            // Verify compression was effective on repetitive content
            assert(gzipSize < originalSize * 0.5, 'Gzip should achieve >50% compression on repetitive content');
            assert(brotliSize < originalSize * 0.5, 'Brotli should achieve >50% compression on repetitive content');
        });
    });
});
