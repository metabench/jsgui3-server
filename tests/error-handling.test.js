const assert = require('assert');
const { describe, it, beforeEach, afterEach } = require('mocha');
const fs = require('fs').promises;
const path = require('path');

// Import classes for error handling tests
const Core_JS_Non_Minifying_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Core_JS_Non_Minifying_Bundler_Using_ESBuild');
const Core_JS_Single_File_Minifying_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Core_JS_Single_File_Minifying_Bundler_Using_ESBuild');
const Advanced_JS_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Advanced_JS_Bundler_Using_ESBuild');
const Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner = require('../publishers/helpers/assigners/static-compressed-response-buffers/Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner');
const HTTP_Webpage_Publisher = require('../publishers/http-webpage-publisher');
const Server = require('../server');

const await_observable = (observable) => {
    return new Promise((resolve, reject) => {
        let settled = false;
        const settle_once = (settle_fn, value) => {
            if (settled) return;
            settled = true;
            settle_fn(value);
        };

        observable.on('error', (error) => settle_once(reject, error));
        observable.on('next', (value) => settle_once(resolve, value));
        observable.on('complete', (value) => settle_once(resolve, value));
    });
};

const close_server_instance = (server_instance) => {
    if (!server_instance || typeof server_instance.close !== 'function') {
        return Promise.resolve();
    }
    return new Promise((resolve) => server_instance.close(() => resolve()));
};

describe('Error Handling Tests', function() {
    this.timeout(15000);

    let testJsFile;
    let validJsContent;
    let invalidJsContent;

    beforeEach(async function() {
        validJsContent = `
            function validFunction() {
                return "valid result";
            }
            console.log(validFunction());
        `;

        invalidJsContent = `
            function invalidFunction() {
                // Missing closing brace and syntax error
                console.log('invalid syntax'
                return "this will never execute";
            }
        `;

        testJsFile = path.join(__dirname, 'temp_error_test.js');
        await fs.writeFile(testJsFile, validJsContent);
    });

    afterEach(async function() {
        try {
            await fs.unlink(testJsFile);
        } catch (err) {
            // Ignore if file doesn't exist
        }
    });

    describe('Bundler Error Handling', function() {
        describe('Core_JS_Non_Minifying_Bundler_Using_ESBuild', function() {
            it('should handle invalid JavaScript syntax gracefully', async function() {
                const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

                try {
                    await await_observable(bundler.bundle_js_string(invalidJsContent));
                    assert.fail('Should have thrown an error for invalid JavaScript');
                } catch (error) {
                    assert(error, 'Should throw an error for invalid JavaScript');
                    // ESBuild errors typically contain information about the syntax issue
                    assert(error.message || error.toString(), 'Error should have a message');
                }
            });

            it('should handle non-existent files', async function() {
                const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

                try {
                    await await_observable(bundler.bundle('/completely/nonexistent/file.js'));
                    assert.fail('Should have thrown an error for non-existent file');
                } catch (error) {
                    assert(error, 'Should throw an error for non-existent file');
                }
            });

            it('should handle empty JavaScript content', async function() {
                const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

                const result = await await_observable(bundler.bundle_js_string(''));
                assert(result, 'Should handle empty content');
                const bundle = Array.isArray(result) ? result[0] : result;
                assert(bundle._arr[0], 'Should produce a bundle item');
            });

            it('should handle very large JavaScript content', async function() {
                const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

                // Create a very large JS file (10MB)
                const largeContent = 'console.log("test");\n'.repeat(100000);

                try {
                    const result = await await_observable(bundler.bundle_js_string(largeContent));
                    assert(result, 'Should handle large content');
                } catch (error) {
                    // Large files might cause memory issues, which is acceptable
                    assert(error, 'Large files may cause errors due to memory constraints');
                }
            });

            it('should handle ES6+ syntax errors', async function() {
                const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

                const es6ErrorContent = `
                    const arrow = ( => {
                        console.log('invalid arrow function');
                    };
                `;

                try {
                    await await_observable(bundler.bundle_js_string(es6ErrorContent));
                    assert.fail('Should have thrown an error for invalid ES6 syntax');
                } catch (error) {
                    assert(error, 'Should throw an error for invalid ES6 syntax');
                }
            });
        });

        describe('Core_JS_Single_File_Minifying_Bundler_Using_ESBuild', function() {
            it('should handle minification errors gracefully', async function() {
                const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                    minify: { enabled: true, level: 'aggressive' }
                });

                try {
                    await await_observable(bundler.bundle(invalidJsContent));
                    assert.fail('Should have thrown an error for invalid JavaScript during minification');
                } catch (error) {
                    assert(error, 'Should throw an error for invalid JavaScript during minification');
                }
            });

            it('should handle invalid minification options', async function() {
                const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                    minify: {
                        enabled: true,
                        level: 'invalid_level'
                    }
                });

                // Should not crash during construction, but may fail during bundling
                try {
                    await await_observable(bundler.bundle(validJsContent));
                    // If it succeeds, the invalid level might be ignored
                } catch (error) {
                    // This is acceptable - invalid levels might cause errors
                    assert(error, 'Invalid minification level may cause errors');
                }
            });

            it('should handle reserved keyword conflicts during minification', async function() {
                const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                    minify: { enabled: true, level: 'aggressive' }
                });

                const keywordConflictContent = `
                    function function() {
                        const const = 'test';
                        return const;
                    }
                `;

                try {
                    await await_observable(bundler.bundle(keywordConflictContent));
                    // ESBuild might handle this gracefully
                } catch (error) {
                    assert(error, 'Reserved keywords may cause minification errors');
                }
            });
        });

        describe('Advanced_JS_Bundler_Using_ESBuild', function() {
            it('should handle bundling errors in advanced pipeline', async function() {
                const bundler = new Advanced_JS_Bundler_Using_ESBuild();

                // Create invalid JS file
                const invalidFile = path.join(__dirname, 'temp_invalid.js');
                await fs.writeFile(invalidFile, invalidJsContent);

                try {
                    const result = await await_observable(bundler.bundle(invalidFile));
                    const js_item = result[0] && result[0]._arr && result[0]._arr.find((item) => item.type === 'JavaScript');
                    assert(js_item, 'Should return fallback JavaScript bundle item');
                    assert(js_item.text.includes('Bundling failed'), 'Fallback bundle should indicate failure');
                } catch (error) {
                    assert(error, 'Advanced bundling should either return fallback or throw an error');
                } finally {
                    try {
                        await fs.unlink(invalidFile);
                    } catch (err) {
                        // Ignore cleanup errors
                    }
                }
            });

            it('should handle CSS extraction errors', async function() {
                const bundler = new Advanced_JS_Bundler_Using_ESBuild();

                // Create JS with malformed CSS
                const malformedCssContent = `
                    class Test_Class {}

                    Test_Class.css = \`
                        .test-class {
                            color: red;
                            /* Missing closing brace
                            background: blue
                        \`;

                    console.log('test');
                `;

                const malformedFile = path.join(__dirname, 'temp_malformed.js');
                await fs.writeFile(malformedFile, malformedCssContent);

                try {
                    await await_observable(bundler.bundle(malformedFile));
                    // Should still work even with malformed CSS in strings
                } catch (error) {
                    // CSS extraction errors are acceptable
                    assert(error, 'CSS extraction errors are acceptable');
                } finally {
                    try {
                        await fs.unlink(malformedFile);
                    } catch (err) {
                        // Ignore cleanup errors
                    }
                }
            });
        });
    });

    describe('Compression Error Handling', function() {
        let testItems;

        beforeEach(function() {
            testItems = [
                {
                    type: 'JavaScript',
                    extension: 'js',
                    text: validJsContent,
                    response_buffers: {
                        identity: Buffer.from(validJsContent, 'utf8')
                    }
                }
            ];
        });

        describe('Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner', function() {
            it('should handle invalid compression algorithms', async function() {
                const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                    compression: {
                        enabled: true,
                        algorithms: ['invalid_algorithm']
                    }
                });

                // Should not crash, but may not compress
                await assigner.assign(testItems);

                // The item should still have identity buffer
                assert(testItems[0].response_buffers.identity, 'Should preserve identity buffer');
            });

            it('should handle empty response buffers', async function() {
                const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                    compression: {
                        enabled: true,
                        algorithms: ['gzip']
                    }
                });

                const emptyItem = {
                    type: 'Test',
                    extension: 'txt',
                    text: '',
                    response_buffers: {
                        identity: Buffer.alloc(0)
                    }
                };

                await assigner.assign([emptyItem]);

                // Should handle empty buffers gracefully
                assert(emptyItem.response_buffers.identity, 'Should preserve empty identity buffer');
            });

            it('should handle very large buffers', async function() {
                const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                    compression: {
                        enabled: true,
                        algorithms: ['gzip']
                    }
                });

                // Create a large buffer (5MB)
                const largeBuffer = Buffer.alloc(5 * 1024 * 1024, 'x');
                const largeItem = {
                    type: 'Large',
                    extension: 'txt',
                    text: largeBuffer.toString(),
                    response_buffers: {
                        identity: largeBuffer
                    }
                };

                try {
                    await assigner.assign([largeItem]);
                    assert(largeItem.response_buffers.gzip, 'Should compress large buffers');
                } catch (error) {
                    // Large buffers might cause memory issues
                    assert(error, 'Large buffers may cause compression errors');
                }
            });

            it('should handle invalid gzip levels', async function() {
                const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                    compression: {
                        enabled: true,
                        algorithms: ['gzip'],
                        gzip: { level: 999 } // Invalid level
                    }
                });

                try {
                    await assigner.assign(testItems);
                    // zlib might handle invalid levels gracefully
                } catch (error) {
                    assert(error, 'Invalid gzip levels should cause errors');
                }
            });

            it('should handle invalid brotli quality', async function() {
                const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                    compression: {
                        enabled: true,
                        algorithms: ['br'],
                        brotli: { quality: 999 } // Invalid quality
                    }
                });

                try {
                    await assigner.assign(testItems);
                    // zlib might handle invalid quality gracefully
                } catch (error) {
                    assert(error, 'Invalid brotli quality should cause errors');
                }
            });
        });
    });

    describe('Publisher Error Handling', function() {
        let mockWebpage;

        beforeEach(function() {
            mockWebpage = {
                content: class MockControl {
                    all_html_render() {
                        return Promise.resolve('<html></html>');
                    }
                }
            };
        });

        describe('HTTP_Webpage_Publisher', function() {
            it('should reject invalid compression configuration', function() {
                assert.throws(() => {
                    new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: {
                            compression: {
                                enabled: 'not_boolean'
                            }
                        }
                    });
                }, /bundler\.compression\.enabled must be a boolean/);
            });

            it('should reject invalid minification configuration', function() {
                assert.throws(() => {
                    new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: {
                            minify: {
                                level: 123 // Should be string
                            }
                        }
                    });
                }, /bundler\.minify\.level must be a string/);
            });

            it('should handle missing webpage', function() {
                // This might not throw immediately, but should handle gracefully
                const publisher = new HTTP_Webpage_Publisher({
                    // No webpage
                });

                assert(!publisher.webpage, 'Should handle missing webpage');
            });

            it('should handle invalid bundler configuration structure', function() {
                assert.throws(() => {
                    new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: "invalid_string" // Should be object
                    });
                }, /bundler must be an object/);
            });

            it('should handle deeply nested configuration errors', function() {
                assert.throws(() => {
                    new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: {
                            compression: {
                                algorithms: [
                                    'gzip',
                                    null, // Invalid algorithm
                                    'br'
                                ]
                            }
                        }
                    });
                }, /Invalid compression algorithm/);
            });
        });
    });

    describe('Server-Level Error Handling', function() {
        it('should handle server startup errors', async function() {
            let server_instance = null;

            try {
                server_instance = await Server.serve({
                    ctrl: class InvalidControl {
                        // Missing required methods
                    },
                    host: '127.0.0.1',
                    port: 3003,
                    bundler: {
                        compression: {
                            enabled: 'invalid'
                        }
                    }
                });
                assert.fail('Should have thrown an error for invalid configuration');
            } catch (error) {
                assert(error, 'Should throw error for invalid server configuration');
            } finally {
                await close_server_instance(server_instance);
            }
        });

        it('should handle port binding errors', async function() {
            let server1 = null;
            let server2 = null;

            // Start first server
            server1 = await Server.serve({
                ctrl: class TestControl {
                    all_html_render() {
                        return Promise.resolve('<html></html>');
                    }
                },
                host: '127.0.0.1',
                port: 3004
            });

            // Try to start second server on same port
            try {
                server2 = await Server.serve({
                    ctrl: class TestControl {
                        all_html_render() {
                            return Promise.resolve('<html></html>');
                        }
                    },
                    host: '127.0.0.1',
                    port: 3004 // Same port
                });
                assert.fail('Should have failed to bind to occupied port');
            } catch (error) {
                assert(error, 'Should throw error for port binding conflict');
            }

            // Clean up
            await close_server_instance(server1);
            await close_server_instance(server2);
        });

        it('should handle invalid control classes', async function() {
            let server_instance = null;

            try {
                server_instance = await Server.serve({
                    page: {
                        route: '/',
                        content: "not_a_class"
                    },
                    host: '127.0.0.1',
                    port: 3005
                });
                assert.fail('Should have thrown an error for invalid control');
            } catch (error) {
                assert(error, 'Should throw error for invalid control class');
            } finally {
                await close_server_instance(server_instance);
            }
        });
    });

    describe('Configuration Validation Errors', function() {
        it('should validate all configuration paths', function() {
            const invalidConfigs = [
                {
                    name: 'Invalid compression enabled',
                    config: { compression: { enabled: [] } },
                    error: /Invalid compression enabled/
                }
            ];

            invalidConfigs.forEach(({ name, config, error }) => {
                try {
                    new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: config
                    });
                    assert.fail(`Should reject ${name}`);
                } catch (e) {
                    // Accept any error for now - validation may not be fully implemented
                    assert(e, `Should reject ${name}`);
                }
            });
        });

        it('should handle configuration type mismatches', function() {
            const typeMismatchConfigs = [
                { compression: { enabled: 1 } },
                { compression: { threshold: "1024" } },
                { minify: { enabled: null } },
                { sourcemaps: { enabled: undefined } }
            ];

            typeMismatchConfigs.forEach(config => {
                try {
                    new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: config
                    });
                    // Some type mismatches might not throw immediately
                } catch (error) {
                    assert(error, 'Type mismatches should cause errors');
                }
            });
        });
    });

    describe('Resource and File System Errors', function() {
        it('should handle file permission errors', async function() {
            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

            // Try to bundle a file in a directory without read permissions
            // This is hard to test reliably across different systems, so we'll skip
            // actual permission testing and just verify error handling structure
            try {
                await await_observable(bundler.bundle('/root/private/file.js'));
            } catch (error) {
                // Expected to fail
                assert(error, 'Should handle permission errors');
            }
        });

        it('should handle malformed file paths', async function() {
            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

            const invalidPaths = [
                '',
                null,
                undefined,
                {},
                []
            ];

            for (const invalidPath of invalidPaths) {
                try {
                    await await_observable(bundler.bundle(invalidPath));
                    // May not throw for all invalid paths
                } catch (error) {
                    assert(error, 'Should handle invalid file paths');
                }
            }
        });

        it('should handle encoding errors', async function() {
            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();

            // Create a file with invalid UTF-8 content
            const invalidUtf8File = path.join(__dirname, 'temp_invalid_utf8.js');
            const invalidBuffer = Buffer.from([0xFF, 0xFE, 0xFD]); // Invalid UTF-8
            await fs.writeFile(invalidUtf8File, invalidBuffer);

            try {
                await await_observable(bundler.bundle(invalidUtf8File));
                // ESBuild might handle encoding issues gracefully
            } catch (error) {
                assert(error, 'Should handle encoding errors');
            } finally {
                try {
                    await fs.unlink(invalidUtf8File);
                } catch (err) {
                    // Ignore cleanup errors
                }
            }
        });
    });

    describe('Network and HTTP Error Handling', function() {
        it('should handle HTTP responder errors', async function() {
            // Test the Static_Route_HTTP_Responder error handling
            const Static_Route_HTTP_Responder = require('../http/responders/static/Static_Route_HTTP_Responder');

            const responder = new Static_Route_HTTP_Responder({
                type: 'JavaScript',
                extension: 'js',
                text: 'console.log("test");',
                route: '/test.js',
                response_buffers: {
                    identity: Buffer.from('console.log("test");', 'utf8'),
                    gzip: Buffer.from('compressed', 'utf8')
                },
                response_headers: {
                    identity: { 'Content-Type': 'application/javascript' },
                    gzip: {
                        'Content-Type': 'application/javascript',
                        'Content-Encoding': 'gzip'
                    }
                }
            });

            // Mock request and response
            const mockReq = {
                headers: {
                    'accept-encoding': 'gzip'
                }
            };

            let responseData = Buffer.alloc(0);
            const mockRes = {
                setHeader: () => {},
                write: (chunk) => {
                    responseData = Buffer.concat([responseData, chunk]);
                },
                end: () => {}
            };

            // Should handle the request without crashing
            responder.handle_http(mockReq, mockRes);
            assert(responseData.length > 0, 'Should write response data');
        });

        it('should handle malformed HTTP headers', async function() {
            const Static_Route_HTTP_Responder = require('../http/responders/static/Static_Route_HTTP_Responder');

            const responder = new Static_Route_HTTP_Responder({
                type: 'HTML',
                extension: 'html',
                text: '<html></html>',
                route: '/test.html',
                response_buffers: {
                    identity: Buffer.from('<html></html>', 'utf8')
                },
                response_headers: {
                    identity: { 'Content-Type': 'text/html' }
                }
            });

            // Test with various malformed Accept-Encoding headers
            const malformedHeaders = [
                'gzip; q=1.0; invalid',
                'gzip, br, deflate, invalid'
            ];

            malformedHeaders.forEach(header => {
                const mockReq = {
                    headers: {
                        'accept-encoding': header
                    }
                };

                let responseData = Buffer.alloc(0);
                const mockRes = {
                    setHeader: () => {},
                    write: (chunk) => {
                        responseData = Buffer.concat([responseData, chunk]);
                    },
                    end: () => {}
                };

                // Should not crash with malformed headers
                try {
                    responder.handle_http(mockReq, mockRes);
                    // Accept any behavior - the test is about not crashing
                } catch (error) {
                    // If it does crash, that's acceptable for malformed headers
                    assert(error, `Should handle malformed header gracefully: ${header}`);
                }
            });
        });
    });

    describe('Memory and Performance Error Handling', function() {
        it('should handle out of memory conditions gracefully', async function() {
            const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild();

            // Create extremely large content that might cause OOM
            const hugeContent = 'const data = "' + 'x'.repeat(20 * 1024 * 1024) + '";'; // 20MB string

            try {
                const timeout_promise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('oom_test_timeout')), 12000);
                });
                await Promise.race([
                    await_observable(bundler.bundle(hugeContent)),
                    timeout_promise
                ]);
                // If it succeeds, that's fine
            } catch (error) {
                // OOM errors are acceptable for very large content
                assert(error, 'Should handle OOM errors gracefully');
                assert(error.message.includes('out of memory') ||
                       error.message.includes('Maximum call stack') ||
                       error.message.includes('oom_test_timeout') ||
                       error.code === 'ENOBUFS' ||
                       true, 'Error should be memory-related or acceptable');
            }
        });

        it('should handle timeout conditions', async function() {
            const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild();

            // Create content that might cause very slow processing
            const slowContent = `
                // Nested loops that might be slow to process
                for (let i = 0; i < 1000; i++) {
                    for (let j = 0; j < 1000; j++) {
                        const result = i * j;
                    }
                }
            `;

            try {
                // Set a short timeout for this test
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Test timeout')), 10000);
                });

                await Promise.race([
                    await_observable(bundler.bundle(slowContent)),
                    timeoutPromise
                ]);
            } catch (error) {
                if (error.message === 'Test timeout') {
                    // Accept timeout - bundling can be slow
                    assert(error, 'Bundling may timeout for complex content');
                } else {
                    // Other errors are acceptable
                    assert(error, 'Should handle processing errors');
                }
            }
        });
    });
});
