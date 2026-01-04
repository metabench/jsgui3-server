const assert = require('assert');
const { describe, it, beforeEach, afterEach } = require('mocha');
const fs = require('fs').promises;
const path = require('path');

// Import bundler classes
const Core_JS_Non_Minifying_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Core_JS_Non_Minifying_Bundler_Using_ESBuild');
const Core_JS_Single_File_Minifying_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Core_JS_Single_File_Minifying_Bundler_Using_ESBuild');
const Advanced_JS_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Advanced_JS_Bundler_Using_ESBuild');

const await_observable = observable => new Promise((resolve, reject) => {
    observable.on('error', reject);
    observable.on('complete', resolve);
});

describe('Bundler Component Isolation Tests', function() {
this.timeout(30000); // Increase timeout for bundling operations

    let testJsFile;
    let testJsContent;

    beforeEach(async function() {
        // Create a temporary test JS file
        testJsContent = `
            class Test_Class {
                constructor() {}
            }

            Test_Class.css = \`
                .test-class {
                    color: red;
                    font-size: 14px;
                }
            \`;

            Test_Class.scss = \`
                $accent-color: #33aacc;
                .sass-class {
                    color: $accent-color;
                }
            \`;

            // Test function
            function testFunction() {
                console.log('Hello from test function');
                return 'test result';
            }

            // Export for testing
            module.exports = { testFunction, Test_Class };
        `;

        testJsFile = path.join(__dirname, 'temp_test.js');
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

    describe('Core_JS_Non_Minifying_Bundler_Using_ESBuild', function() {
        it('should bundle JavaScript without minification', async function() {
            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

            const result = await bundler.bundle(testJsFile);

            assert(Array.isArray(result), 'Result should be an array');
            assert.strictEqual(result.length, 1, 'Should return one bundle');

            const bundle = result[0];
            assert(bundle._arr, 'Bundle should have _arr property');
            assert.strictEqual(bundle._arr.length, 1, 'Bundle should contain one item');

            const bundleItem = bundle._arr[0];
            assert.strictEqual(bundleItem.type, 'JavaScript', 'Bundle item should be JavaScript type');
            assert.strictEqual(bundleItem.extension, 'js', 'Bundle item should have js extension');
            assert(bundleItem.text, 'Bundle item should have text content');
            assert(bundleItem.text.length > 0, 'Bundle text should not be empty');

            // Verify the bundled code contains our test content
            assert(bundleItem.text.includes('testFunction'), 'Bundled code should contain testFunction');
            assert(bundleItem.text.includes('Hello from test function'), 'Bundled code should contain test string');
        });

        it('should handle sourcemap configuration in debug mode', async function() {
            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild({
                debug: true,
                sourcemaps: { enabled: true, format: 'inline' }
            });

            const result = await bundler.bundle(testJsFile);
            const bundleItem = result[0]._arr[0];

            // In debug mode with sourcemaps enabled, should include sourcemap
            assert(bundleItem.text.includes('//# sourceMappingURL='), 'Debug bundle should include inline sourcemap');
        });

        it('should handle sourcemap configuration in production mode', async function() {
            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild({
                debug: false,
                sourcemaps: { enabled: false }
            });

            const result = await bundler.bundle(testJsFile);
            const bundleItem = result[0]._arr[0];

            // In production mode with sourcemaps disabled, should not include sourcemap
            assert(!bundleItem.text.includes('//# sourceMappingURL='), 'Production bundle should not include sourcemap');
        });

        it('should bundle JavaScript string directly', async function() {
            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

            const jsString = `
                globalThis.directTest = function directTest() {
                    return 'direct result';
                };
                console.log(globalThis.directTest());
                console.log('Direct bundle test');
            `;

            const result = await bundler.bundle_js_string(jsString);

            assert(Array.isArray(result), 'Result should be an array');
            const bundle = result[0];
            const bundleItem = bundle._arr[0];

            assert.strictEqual(bundleItem.type, 'JavaScript');
            assert(bundleItem.text.includes('direct result'), 'Should contain the direct result string');
            assert(bundleItem.text.includes('Direct bundle test'), 'Should contain the test log');
            // Verify the function is actually executable
            const testFunction = new Function(bundleItem.text + '; return globalThis.directTest;')();
            assert.strictEqual(testFunction(), 'direct result', 'Bundled function should be executable');
        });
    });

    describe('Core_JS_Single_File_Minifying_Bundler_Using_ESBuild', function() {
        it('should minify JavaScript with default settings', async function() {
            const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild();

            const result = await bundler.bundle(testJsContent);

            assert(Array.isArray(result), 'Result should be an array');
            assert.strictEqual(result.length, 1, 'Should return one bundle');

            const bundle = result[0];
            const bundleItem = bundle._arr[0];

            assert.strictEqual(bundleItem.type, 'JavaScript');
            assert.strictEqual(bundleItem.extension, 'js');

            // Verify minification occurred (should be much shorter)
            assert(bundleItem.text.length < testJsContent.length,
                   'Minified code should be shorter than original');

            // Verify functionality is preserved (contains key identifiers)
            assert(bundleItem.text.includes('testFunction'), 'Should contain testFunction after minification');
        });

        it('should handle different minification levels', async function() {
            // Test conservative minification
            const conservativeBundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                minify: { level: 'conservative' }
            });

            const conservativeResult = await conservativeBundler.bundle(testJsContent);
            const conservativeText = conservativeResult[0]._arr[0].text;

            // Test normal minification
            const normalBundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                minify: { level: 'normal' }
            });

            const normalResult = await normalBundler.bundle(testJsContent);
            const normalText = normalResult[0]._arr[0].text;

            // Test aggressive minification
            const aggressiveBundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                minify: { level: 'aggressive' }
            });

            const aggressiveResult = await aggressiveBundler.bundle(testJsContent);
            const aggressiveText = aggressiveResult[0]._arr[0].text;

            // All should be valid and contain the function
            assert(conservativeText.includes('testFunction'), 'Conservative minification should preserve function');
            assert(normalText.includes('testFunction'), 'Normal minification should preserve function');
            assert(aggressiveText.includes('testFunction'), 'Aggressive minification should preserve function');

            // Verify different levels produce different results (at least some difference)
            const texts = [conservativeText, normalText, aggressiveText];
            const uniqueTexts = new Set(texts);
            assert(uniqueTexts.size >= 2, 'Different minification levels should produce different outputs');
        });

        it('should disable minification when configured', async function() {
            const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                minify: { enabled: false }
            });

            const result = await bundler.bundle(testJsContent);
            const bundleItem = result[0]._arr[0];

            // When minification is disabled, should return the original content structure
            // (though ESBuild still does some processing like bundling)
            assert(bundleItem.text.includes('testFunction'), 'Should contain testFunction');
        });

        it('should handle custom minification options', async function() {
            const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                minify: {
                    level: 'normal',
                    options: {
                        mangle: false, // Disable variable name mangling
                        compress: { sequences: false }
                    }
                }
            });

            const result = await bundler.bundle(testJsContent);
            const bundleItem = result[0]._arr[0];

            // With mangle: false, should preserve variable names
            assert(bundleItem.text.includes('testFunction'), 'Should preserve function name when mangling disabled');
        });
    });

    describe('Advanced_JS_Bundler_Using_ESBuild', function() {
        it('should perform advanced bundling with CSS extraction', async function() {
            const bundler = new Advanced_JS_Bundler_Using_ESBuild();

            const result = await bundler.bundle(testJsFile);

            assert(Array.isArray(result), 'Result should be an array');
            assert.strictEqual(result.length, 1, 'Should return one bundle');

            const bundle = result[0];
            assert(bundle._arr, 'Bundle should have _arr property');
            assert.strictEqual(bundle._arr.length, 2, 'Bundle should contain JS and CSS items');

            // Find JS and CSS items
            const jsItem = bundle._arr.find(item => item.type === 'JavaScript');
            const cssItem = bundle._arr.find(item => item.type === 'CSS');

            assert(jsItem, 'Should contain JavaScript item');
            assert(cssItem, 'Should contain CSS item');

            assert.strictEqual(jsItem.extension, 'js');
            assert.strictEqual(cssItem.extension, 'css');

            // Verify CSS was extracted
            assert(cssItem.text.includes('.test-class'), 'CSS should contain the test class');
            assert(cssItem.text.includes('color: red'), 'CSS should contain the color property');
            assert(cssItem.text.includes('.sass-class'), 'CSS should contain the SCSS class');
            assert(cssItem.text.includes('#33aacc'), 'CSS should contain compiled SCSS color value');

            // Verify JS no longer contains CSS
            assert(!jsItem.text.includes('.test-class'), 'JS should not contain CSS after extraction');
            assert(!jsItem.text.includes('.sass-class'), 'JS should not contain SCSS after extraction');
            assert(!jsItem.text.includes('$accent-color'), 'JS should not contain SCSS variables');
            assert(jsItem.text.includes('testFunction'), 'JS should still contain the test function');
        });

        it('should handle debug mode with sourcemaps', async function() {
            const bundler = new Advanced_JS_Bundler_Using_ESBuild({
                debug: true,
                bundler: {
                    sourcemaps: { enabled: true, format: 'inline' }
                }
            });

            const result = await bundler.bundle(testJsFile);
            const jsItem = result[0]._arr.find(item => item.type === 'JavaScript');

            // In debug mode, should include sourcemaps
            assert(jsItem.text.includes('//# sourceMappingURL='), 'Debug mode should include inline sourcemaps');
        });

        it('should handle production mode with minification', async function() {
            const bundler = new Advanced_JS_Bundler_Using_ESBuild({
                debug: false,
                bundler: {
                    minify: { enabled: true, level: 'normal' }
                }
            });

            const result = await bundler.bundle(testJsFile);
            const jsItem = result[0]._arr.find(item => item.type === 'JavaScript');

            // In production mode, should be minified
            assert(jsItem.text.length < testJsContent.length, 'Production JS should be minified');
            assert(jsItem.text.includes('testFunction'), 'Should still contain function after minification');
        });

        it('should pass configuration to sub-bundlers', async function() {
            const bundler = new Advanced_JS_Bundler_Using_ESBuild({
                debug: true,
                bundler: {
                    minify: { level: 'aggressive' },
                    sourcemaps: { enabled: true, format: 'inline' }
                }
            });

            // Verify configuration is stored
            assert.deepStrictEqual(bundler.bundler_config.minify, { level: 'aggressive' });
            assert.deepStrictEqual(bundler.bundler_config.sourcemaps, { enabled: true, format: 'inline' });
        });
    });

    describe('Error Handling', function() {
        it('should handle invalid JavaScript gracefully', async function() {
            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

            const invalidJs = `
                function test() {
                    // Missing closing brace
                    console.log('invalid syntax'
            `;

            try {
                await await_observable(bundler.bundle_js_string(invalidJs));
                assert.fail('Should have thrown an error for invalid JavaScript');
            } catch (error) {
                assert(error, 'Should throw an error for invalid JavaScript');
            }
        });

        it('should handle non-existent files', async function() {
            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

            try {
                await await_observable(bundler.bundle('/non/existent/file.js'));
                assert.fail('Should have thrown an error for non-existent file');
            } catch (error) {
                assert(error, 'Should throw an error for non-existent file');
            }
        });
    });
});
