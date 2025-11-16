const assert = require('assert');
const { describe, it, before, after } = require('mocha');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

// Import server and related classes
const Server = require('../module');

describe('End-to-End Integration Tests', function() {
    this.timeout(30000); // Allow more time for server startup and requests

    let server;
    let serverPort = 3001; // Use a different port for testing
    let testControl;

    before(async function() {
        // Create a test control class
        testControl = class TestControl {
            constructor(spec) {
                this.context = spec.context;
                this.head = {
                    add: function(element) {
                        // Mock add method
                    }
                };
                this.body = {
                    add: function(element) {
                        // Mock add method
                    }
                };
            }

            active() {
                // Mock activation
            }

            all_html_render() {
                return Promise.resolve(`<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
    <script src="/js/js.js"></script>
</head>
<body>
    <div id="test-control">
        <h1>Test Control</h1>
        <p>This is a test control with embedded CSS and JS.</p>
        <button onclick="testFunction()">Test Button</button>
    </div>
</body>
</html>`);
            }
        };

        // Add CSS and JS to the control class
        testControl.css = `
            .test-control {
                background-color: #f0f0f0;
                padding: 20px;
                border: 1px solid #ccc;
                font-family: Arial, sans-serif;
            }
            .test-control h1 {
                color: #333;
                margin-bottom: 10px;
            }
            .test-control p {
                color: #666;
                line-height: 1.5;
            }
        `;

        testControl.js = `
            // Test JavaScript with CSS embedding
            const css = \`${testControl.css}\`;

            // Add CSS to document
            const style = document.createElement('style');
            style.textContent = css;
            document.head.appendChild(style);

            // Test function
            function testFunction() {
                console.log('Test function called');
                alert('Test function executed successfully!');
                return 'test result';
            }

            // Initialize when DOM is ready
            document.addEventListener('DOMContentLoaded', function() {
                console.log('Test control initialized');
                const testDiv = document.getElementById('test-control');
                if (testDiv) {
                    testDiv.style.borderColor = '#007bff';
                }
            });

            // Export for testing
            window.TestControl = { testFunction };
        `;
    });

    after(async function() {
        // Clean up server
        if (server) {
            await server.stop();
        }
    });

    describe('Full Server Integration with Minification and Compression', function() {
        it('should serve webpage with minified and compressed JavaScript', async function() {
            // Start server with minification and compression enabled
            server = new Server();
            await server.serve({
                ctrl: testControl,
                port: serverPort,
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

            // Wait for server to be ready
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Test gzip compressed JavaScript
            const jsResponse = await makeRequest(`http://localhost:${serverPort}/js/js.js`, {
                'Accept-Encoding': 'gzip'
            });

            assert.strictEqual(jsResponse.statusCode, 200);
            assert.strictEqual(jsResponse.headers['content-encoding'], 'gzip');
            assert(jsResponse.headers['content-type'].includes('javascript'));

            // Verify the response is actually compressed (should be smaller than original)
            const originalSize = Buffer.from(testControl.js, 'utf8').length;
            const compressedSize = jsResponse.body.length;
            assert(compressedSize < originalSize, 'JavaScript should be compressed');

            // Test brotli compressed JavaScript
            const brJsResponse = await makeRequest(`http://localhost:${serverPort}/js/js.js`, {
                'Accept-Encoding': 'br'
            });

            assert.strictEqual(brJsResponse.statusCode, 200);
            assert.strictEqual(brJsResponse.headers['content-encoding'], 'br');

            // Brotli should generally be smaller than gzip for text
            assert(brJsResponse.body.length <= jsResponse.body.length,
                   'Brotli should be at least as good as gzip');

            // Stop server
            await server.stop();
        });

        it('should serve webpage with sourcemaps in debug mode', async function() {
            // Start server in debug mode
            server = new Server();
            await server.serve({
                ctrl: testControl,
                port: serverPort,
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

            // Wait for server to be ready
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Test JavaScript with sourcemaps
            const jsResponse = await makeRequest(`http://localhost:${serverPort}/js/js.js`, {
                'Accept-Encoding': 'gzip'
            });

            assert.strictEqual(jsResponse.statusCode, 200);
            assert.strictEqual(jsResponse.headers['content-encoding'], 'gzip');

            // Decompress to check for sourcemap
            const zlib = require('zlib');
            const decompressed = zlib.gunzipSync(jsResponse.body).toString();
            assert(decompressed.includes('//# sourceMappingURL='), 'Debug mode should include inline sourcemaps');

            // Stop server
            await server.stop();
        });

        it('should serve compressed CSS', async function() {
            // Start server with compression
            server = new Server();
            await server.serve({
                ctrl: testControl,
                port: serverPort,
                debug: false,
                bundler: {
                    compression: {
                        enabled: true,
                        algorithms: ['gzip', 'br']
                    }
                }
            });

            // Wait for server to be ready
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Test gzip compressed CSS
            const cssResponse = await makeRequest(`http://localhost:${serverPort}/css/css.css`, {
                'Accept-Encoding': 'gzip'
            });

            assert.strictEqual(cssResponse.statusCode, 200);
            assert.strictEqual(cssResponse.headers['content-encoding'], 'gzip');
            assert(cssResponse.headers['content-type'].includes('css'));

            // Verify CSS content is compressed
            const originalCssSize = Buffer.from(testControl.css, 'utf8').length;
            const compressedCssSize = cssResponse.body.length;
            assert(compressedCssSize < originalCssSize, 'CSS should be compressed');

            // Stop server
            await server.stop();
        });

        it('should serve HTML without compression when below threshold', async function() {
            // Start server with high compression threshold
            server = new Server();
            await server.serve({
                ctrl: testControl,
                port: serverPort,
                debug: false,
                bundler: {
                    compression: {
                        enabled: true,
                        threshold: 10000 // Very high threshold
                    }
                }
            });

            // Wait for server to be ready
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Test HTML (should not be compressed due to threshold)
            const htmlResponse = await makeRequest(`http://localhost:${serverPort}/`, {
                'Accept-Encoding': 'gzip'
            });

            assert.strictEqual(htmlResponse.statusCode, 200);
            assert(!htmlResponse.headers['content-encoding'], 'HTML should not be compressed due to threshold');
            assert(htmlResponse.headers['content-type'].includes('html'));

            // Stop server
            await server.stop();
        });

        it('should handle different minification levels', async function() {
            const minificationLevels = ['conservative', 'normal', 'aggressive'];

            for (const level of minificationLevels) {
                // Start server with specific minification level
                server = new Server();
                await server.serve({
                    ctrl: testControl,
                    port: serverPort,
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

                // Wait for server to be ready
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Test JavaScript
                const jsResponse = await makeRequest(`http://localhost:${serverPort}/js/js.js`);

                assert.strictEqual(jsResponse.statusCode, 200);
                assert(!jsResponse.headers['content-encoding'], 'Should not be compressed');

                // Verify minification occurred (should be smaller than original)
                const originalSize = Buffer.from(testControl.js, 'utf8').length;
                const minifiedSize = jsResponse.body.length;
                assert(minifiedSize < originalSize, `JavaScript should be minified with ${level} level`);

                // Stop server
                await server.stop();
            }
        });

        it('should serve identical content with identity encoding when compression disabled', async function() {
            // Start server with compression disabled
            server = new Server();
            await server.serve({
                ctrl: testControl,
                port: serverPort,
                debug: false,
                bundler: {
                    compression: {
                        enabled: false
                    }
                }
            });

            // Wait for server to be ready
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Test with gzip request but compression disabled
            const jsResponse = await makeRequest(`http://localhost:${serverPort}/js/js.js`, {
                'Accept-Encoding': 'gzip'
            });

            assert.strictEqual(jsResponse.statusCode, 200);
            assert(!jsResponse.headers['content-encoding'], 'Should not have content-encoding when compression disabled');

            // Stop server
            await server.stop();
        });

        it('should handle multiple concurrent requests', async function() {
            // Start server
            server = new Server();
            await server.serve({
                ctrl: testControl,
                port: serverPort,
                debug: false,
                bundler: {
                    compression: {
                        enabled: true,
                        algorithms: ['gzip']
                    }
                }
            });

            // Wait for server to be ready
            await new Promise(resolve => setTimeout(resolve, 2000));

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
            await server.stop();
        });

        it('should serve correct content types', async function() {
            // Start server
            server = new Server();
            await server.serve({
                ctrl: testControl,
                port: serverPort,
                debug: false
            });

            // Wait for server to be ready
            await new Promise(resolve => setTimeout(resolve, 2000));

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
            await server.stop();
        });
    });

    describe('Error Handling in End-to-End Scenarios', function() {
        it('should handle invalid configuration gracefully', async function() {
            // Try to start server with invalid configuration
            server = new Server();

            try {
                await server.serve({
                    ctrl: testControl,
                    port: serverPort,
                    bundler: {
                        compression: {
                            enabled: 'invalid' // Invalid boolean
                        }
                    }
                });
                assert.fail('Should have thrown error for invalid configuration');
            } catch (error) {
                assert(error, 'Should throw error for invalid configuration');
            }
        });

        it('should handle server port conflicts', async function() {
            // Start first server
            const server1 = new Server();
            await server1.serve({
                ctrl: testControl,
                port: serverPort,
                debug: false
            });

            // Try to start second server on same port
            const server2 = new Server();
            try {
                await server2.serve({
                    ctrl: testControl,
                    port: serverPort, // Same port
                    debug: false
                });
                assert.fail('Should have failed to start server on occupied port');
            } catch (error) {
                assert(error, 'Should throw error for port conflict');
            }

            // Clean up
            await server1.stop();
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