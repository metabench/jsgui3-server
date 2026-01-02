const assert = require('assert');
const { describe, it, before, after } = require('mocha');
const http = require('http');
const path = require('path');

// Import server and related classes
const jsgui_module = require('../module');
const Server = jsgui_module.Server;

describe('End-to-End Integration Tests', function() {
    this.timeout(30000); // Allow more time for server startup and requests

    let server;
    let serverPort = 3001; // Use a different port for testing
    let testControl;
    let test_client_path;
    let base_serve_options;
    const wait_for_route = async (url, timeout_ms = 20000) => {
        const start_time = Date.now();
        let last_error = null;
        while (Date.now() - start_time < timeout_ms) {
            try {
                const response = await makeRequest(url, {
                    'Accept-Encoding': 'identity'
                });
                if (response.statusCode === 200) return response;
            } catch (error) {
                last_error = error;
            }
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        const error = last_error || new Error(`Timed out waiting for ${url}`);
        throw error;
    };
    const start_server = async (serve_options) => {
        const server_instance = await Server.serve(serve_options);
        const port = server_instance.port || serve_options.port;
        if (port) {
            await wait_for_route(`http://localhost:${port}/js/js.js`);
        }
        return server_instance;
    };
    const stop_server = async (server_instance) => {
        if (!server_instance) return;
        await new Promise((resolve) => server_instance.close(resolve));
    };

    before(async function() {
        test_client_path = path.join(__dirname, 'fixtures', 'end-to-end-client.js');
        const test_client = require(test_client_path);
        testControl = test_client.controls && test_client.controls.Test_Control;
        assert(testControl, `Missing exported control jsgui.controls.Test_Control in ${test_client_path}`);
        base_serve_options = {
            ctrl: testControl,
            port: serverPort,
            src_path_client_js: test_client_path
        };
    });

    afterEach(async function() {
        await stop_server(server);
        server = null;
    });

    after(async function() {
        // Clean up server
        await stop_server(server);
        server = null;
    });

    describe('Full Server Integration with Minification and Compression', function() {
        it('should serve webpage with minified and compressed JavaScript', async function() {
            // Start server with minification and compression enabled
            server = await start_server({
                ...base_serve_options,
                debug: false, // Enable minification
                bundler: {
                    minify: {
                        enabled: true,
                        level: 'normal'
                    },
                    compression: {
                        enabled: true,
                        algorithms: ['gzip', 'br']
                    }
                }
            });

            const js_identity_response = await makeRequest(`http://localhost:${serverPort}/js/js.js`, {
                'Accept-Encoding': 'identity'
            });

            assert.strictEqual(js_identity_response.statusCode, 200);
            assert(
                !js_identity_response.headers['content-encoding'] ||
                js_identity_response.headers['content-encoding'] === 'identity'
            );

            // Test gzip compressed JavaScript
            const js_gzip_response = await makeRequest(`http://localhost:${serverPort}/js/js.js`, {
                'Accept-Encoding': 'gzip'
            });

            assert.strictEqual(js_gzip_response.statusCode, 200);
            assert.strictEqual(js_gzip_response.headers['content-encoding'], 'gzip');
            assert(js_gzip_response.headers['content-type'].includes('javascript'));

            // Verify the response is actually compressed (should be smaller than identity)
            assert(
                js_gzip_response.body.length < js_identity_response.body.length,
                'JavaScript should be compressed'
            );

            // Test brotli compressed JavaScript
            const br_js_response = await makeRequest(`http://localhost:${serverPort}/js/js.js`, {
                'Accept-Encoding': 'br'
            });

            assert.strictEqual(br_js_response.statusCode, 200);
            assert.strictEqual(br_js_response.headers['content-encoding'], 'br');

            // Brotli should generally be smaller than gzip for text
            assert(
                br_js_response.body.length <= js_gzip_response.body.length,
                'Brotli should be at least as good as gzip'
            );

            // Stop server
            await stop_server(server);
            server = null;
        });

        it('should serve webpage with sourcemaps in debug mode', async function() {
            // Start server in debug mode
            server = await start_server({
                ...base_serve_options,
                debug: true, // Enable sourcemaps
                bundler: {
                    sourcemaps: {
                        enabled: true,
                        format: 'inline'
                    },
                    compression: {
                        enabled: true,
                        algorithms: ['gzip']
                    }
                }
            });

            // Test JavaScript with sourcemaps
            const js_gzip_response = await makeRequest(`http://localhost:${serverPort}/js/js.js`, {
                'Accept-Encoding': 'gzip'
            });

            assert.strictEqual(js_gzip_response.statusCode, 200);
            assert.strictEqual(js_gzip_response.headers['content-encoding'], 'gzip');

            // Decompress to check for sourcemap
            const zlib = require('zlib');
            const decompressed = zlib.gunzipSync(js_gzip_response.body).toString();
            assert(decompressed.includes('//# sourceMappingURL='), 'Debug mode should include inline sourcemaps');

            // Stop server
            await stop_server(server);
            server = null;
        });

        it('should serve compressed CSS', async function() {
            // Start server with compression
            server = await start_server({
                ...base_serve_options,
                debug: false,
                bundler: {
                    compression: {
                        enabled: true,
                        algorithms: ['gzip', 'br']
                    }
                }
            });

            const css_identity_response = await makeRequest(`http://localhost:${serverPort}/css/css.css`, {
                'Accept-Encoding': 'identity'
            });

            assert.strictEqual(css_identity_response.statusCode, 200);
            assert(
                !css_identity_response.headers['content-encoding'] ||
                css_identity_response.headers['content-encoding'] === 'identity'
            );

            // Test gzip compressed CSS
            const css_gzip_response = await makeRequest(`http://localhost:${serverPort}/css/css.css`, {
                'Accept-Encoding': 'gzip'
            });

            assert.strictEqual(css_gzip_response.statusCode, 200);
            assert.strictEqual(css_gzip_response.headers['content-encoding'], 'gzip');
            assert(css_gzip_response.headers['content-type'].includes('css'));

            // Verify CSS content is compressed
            assert(
                css_gzip_response.body.length < css_identity_response.body.length,
                'CSS should be compressed'
            );

            // Stop server
            await stop_server(server);
            server = null;
        });

        it('should serve HTML without compression when below threshold', async function() {
            // Start server with high compression threshold
            server = await start_server({
                ...base_serve_options,
                debug: false,
                bundler: {
                    compression: {
                        enabled: true,
                        threshold: 10000 // Very high threshold
                    }
                }
            });

            // Test HTML (should not be compressed due to threshold)
            const htmlResponse = await makeRequest(`http://localhost:${serverPort}/`, {
                'Accept-Encoding': 'gzip'
            });

            assert.strictEqual(htmlResponse.statusCode, 200);
            assert(!htmlResponse.headers['content-encoding'], 'HTML should not be compressed due to threshold');
            assert(htmlResponse.headers['content-type'].includes('html'));

            // Stop server
            await stop_server(server);
            server = null;
        });

        it('should handle different minification levels', async function() {
            this.timeout(90000);
            const minification_levels = ['conservative', 'normal', 'aggressive'];

            server = await start_server({
                ...base_serve_options,
                debug: true,
                bundler: {
                    compression: {
                        enabled: false
                    }
                }
            });

            const baseline_response = await makeRequest(`http://localhost:${serverPort}/js/js.js`, {
                'Accept-Encoding': 'identity'
            });
            assert.strictEqual(baseline_response.statusCode, 200);
            const baseline_size = baseline_response.body.length;

            await stop_server(server);
            server = null;

            for (const level of minification_levels) {
                // Start server with specific minification level
                server = await start_server({
                    ...base_serve_options,
                    debug: false,
                    bundler: {
                        minify: {
                            enabled: true,
                            level: level
                        },
                        compression: {
                            enabled: false // Disable compression for size comparison
                        }
                    }
                });

                // Test JavaScript
                const minified_response = await makeRequest(`http://localhost:${serverPort}/js/js.js`, {
                    'Accept-Encoding': 'identity'
                });

                assert.strictEqual(minified_response.statusCode, 200);
                assert(
                    minified_response.body.length <= baseline_size,
                    `JavaScript should be minified with ${level} level`
                );

                // Stop server
                await stop_server(server);
                server = null;
            }
        });

        it('should serve identical content with identity encoding when compression disabled', async function() {
            // Start server with compression disabled
            server = await start_server({
                ...base_serve_options,
                debug: false,
                bundler: {
                    compression: {
                        enabled: false
                    }
                }
            });

            // Test with gzip request but compression disabled
            const jsResponse = await makeRequest(`http://localhost:${serverPort}/js/js.js`, {
                'Accept-Encoding': 'gzip'
            });

            assert.strictEqual(jsResponse.statusCode, 200);
            assert(!jsResponse.headers['content-encoding'], 'Should not have content-encoding when compression disabled');

            // Stop server
            await stop_server(server);
            server = null;
        });

        it('should handle multiple concurrent requests', async function() {
            // Start server
            server = await start_server({
                ...base_serve_options,
                debug: false,
                bundler: {
                    compression: {
                        enabled: true,
                        algorithms: ['gzip']
                    }
                }
            });

            // Make multiple concurrent requests
            const requests = [];
            for (let i = 0; i < 5; i++) {
                requests.push(makeRequest(`http://localhost:${serverPort}/js/js.js`, {
                    'Accept-Encoding': 'gzip'
                }));
            }

            const responses = await Promise.all(requests);

            // All requests should succeed
            responses.forEach(response => {
                assert.strictEqual(response.statusCode, 200);
                assert.strictEqual(response.headers['content-encoding'], 'gzip');
            });

            // Stop server
            await stop_server(server);
            server = null;
        });

        it('should serve correct content types', async function() {
            // Start server
            server = await start_server({
                ...base_serve_options,
                debug: false
            });

            // Test different content types
            const tests = [
                { path: '/', expectedType: 'html' },
                { path: '/js/js.js', expectedType: 'javascript' },
                { path: '/css/css.css', expectedType: 'css' }
            ];

            for (const test of tests) {
                const response = await makeRequest(`http://localhost:${serverPort}${test.path}`);
                assert.strictEqual(response.statusCode, 200);
                assert(response.headers['content-type'].includes(test.expectedType),
                       `Should serve correct content type for ${test.path}`);
            }

            // Stop server
            await stop_server(server);
            server = null;
        });
    });

    describe('Error Handling in End-to-End Scenarios', function() {
        it('should handle invalid configuration gracefully', async function() {
            // Try to start server with invalid configuration
            try {
                server = await start_server({
                    ...base_serve_options,
                    bundler: {
                        compression: {
                            enabled: 'invalid' // Invalid boolean
                        }
                    }
                });
                assert.fail('Should have thrown error for invalid configuration');
            } catch (error) {
                assert(error, 'Should throw error for invalid configuration');
            } finally {
                await stop_server(server);
                server = null;
            }
        });

        it('should handle server port conflicts', async function() {
            // Start first server
            const server1 = await start_server({
                ...base_serve_options,
                debug: false,
                host: '127.0.0.1'
            });

            // Try to start second server on same port
            try {
                await start_server({
                    ...base_serve_options,
                    port: serverPort, // Same port
                    debug: false,
                    host: '127.0.0.1'
                });
                assert.fail('Should have failed to start server on occupied port');
            } catch (error) {
                assert(error, 'Should throw error for port conflict');
            }

            // Clean up
            await stop_server(server1);
        });
    });
});

// Helper function to make HTTP requests
function makeRequest(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname,
            method: 'GET',
            headers: {
                'User-Agent': 'JSGUI3-Test/1.0',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = Buffer.alloc(0);

            res.on('data', (chunk) => {
                body = Buffer.concat([body, chunk]);
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}
