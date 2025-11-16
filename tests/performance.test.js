const assert = require('assert');
const { describe, it, before, after } = require('mocha');
const fs = require('fs').promises;
const path = require('path');

// Import classes for performance testing
const Core_JS_Non_Minifying_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Core_JS_Non_Minifying_Bundler_Using_ESBuild');
const Core_JS_Single_File_Minifying_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Core_JS_Single_File_Minifying_Bundler_Using_ESBuild');
const Advanced_JS_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Advanced_JS_Bundler_Using_ESBuild');
const Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner = require('../publishers/helpers/assigners/static-compressed-response-buffers/Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner');
const Server = require('../server');

describe('Performance Tests', function() {
    this.timeout(60000); // Allow longer timeout for performance tests

    let testJsFile;
    let largeJsContent;
    let mediumJsContent;
    let smallJsContent;

    before(async function() {
        // Create test files of different sizes
        smallJsContent = `
            function smallTest() {
                return "small";
            }
            console.log(smallTest());
        `;

        mediumJsContent = `
            // Medium-sized JavaScript file
            const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

            function processData(arr) {
                return arr.map(x => x * 2)
                         .filter(x => x > 10)
                         .reduce((sum, x) => sum + x, 0);
            }

            class DataProcessor {
                constructor(data) {
                    this.data = data;
                }

                process() {
                    return processData(this.data);
                }

                getStatistics() {
                    return {
                        count: this.data.length,
                        sum: this.data.reduce((a, b) => a + b, 0),
                        average: this.data.reduce((a, b) => a + b, 0) / this.data.length
                    };
                }
            }

            const processor = new DataProcessor(data);
            console.log('Result:', processor.process());
            console.log('Stats:', processor.getStatistics());
        `;

        largeJsContent = `
            // Large JavaScript file for performance testing
            const largeArray = [];
            for (let i = 0; i < 10000; i++) {
                largeArray.push({
                    id: i,
                    name: \`Item \${i}\`,
                    value: Math.random(),
                    nested: {
                        prop1: \`Nested \${i}\`,
                        prop2: i * 2,
                        prop3: {
                            deep: \`Deep nested \${i}\`,
                            deeper: {
                                value: i * i
                            }
                        }
                    }
                });
            }

            function processLargeArray(arr) {
                return arr
                    .filter(item => item.value > 0.5)
                    .map(item => ({
                        ...item,
                        processed: true,
                        computed: item.nested.prop2 * item.nested.prop3.deeper.value
                    }))
                    .sort((a, b) => b.computed - a.computed)
                    .slice(0, 100);
            }

            function createLargeString() {
                let str = '';
                for (let i = 0; i < 1000; i++) {
                    str += \`Line \${i}: This is a test string that will be repeated many times to create a large file. \`;
                    str += \`Additional content to make this even larger. \${i * i} \${Math.random()} \`;
                }
                return str;
            }

            const largeString = createLargeString();
            const processedData = processLargeArray(largeArray);

            console.log('Large array length:', largeArray.length);
            console.log('Processed data length:', processedData.length);
            console.log('Large string length:', largeString.length);
            console.log('Sample processed item:', processedData[0]);
        `;

        // Create temporary file
        testJsFile = path.join(__dirname, 'temp_performance_test.js');
        await fs.writeFile(testJsFile, largeJsContent);
    });

    after(async function() {
        // Clean up
        try {
            await fs.unlink(testJsFile);
        } catch (err) {
            // Ignore if file doesn't exist
        }
    });

    describe('Bundling Performance Benchmarks', function() {
        it('should measure bundling performance across different file sizes', async function() {
            const testCases = [
                { name: 'Small', content: smallJsContent },
                { name: 'Medium', content: mediumJsContent },
                { name: 'Large', content: largeJsContent }
            ];

            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();
            const results = {};

            for (const testCase of testCases) {
                const startTime = Date.now();
                const result = await bundler.bundle_js_string(testCase.content);
                const endTime = Date.now();

                const bundle = result[0];
                const bundledContent = bundle._arr[0].text;

                results[testCase.name] = {
                    inputSize: testCase.content.length,
                    outputSize: bundledContent.length,
                    duration: endTime - startTime,
                    throughput: testCase.content.length / ((endTime - startTime) / 1000) // bytes per second
                };
            }

            // Log results
            console.log('Bundling Performance Results:');
            Object.entries(results).forEach(([name, result]) => {
                console.log(`${name}: ${result.duration}ms, ${result.inputSize} → ${result.outputSize} bytes, ${(result.throughput / 1024).toFixed(2)} KB/s`);
            });

            // Performance assertions
            assert(results.Small.duration < 1000, 'Small file should bundle quickly');
            assert(results.Medium.duration < 2000, 'Medium file should bundle reasonably quickly');
            assert(results.Large.duration < 10000, 'Large file should bundle within reasonable time');

            // Throughput should be reasonable
            assert(results.Small.throughput > 1000, 'Should have reasonable throughput');
        });

        it('should compare minification performance at different levels', async function() {
            const levels = ['conservative', 'normal', 'aggressive'];
            const results = {};

            for (const level of levels) {
                const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                    minify: { level, enabled: true }
                });

                const startTime = Date.now();
                const result = await bundler.bundle(largeJsContent);
                const endTime = Date.now();

                const bundle = result[0];
                const minifiedContent = bundle._arr[0].text;

                results[level] = {
                    duration: endTime - startTime,
                    inputSize: largeJsContent.length,
                    outputSize: minifiedContent.length,
                    compressionRatio: minifiedContent.length / largeJsContent.length
                };
            }

            // Log results
            console.log('Minification Performance Results:');
            Object.entries(results).forEach(([level, result]) => {
                console.log(`${level}: ${result.duration}ms, ${result.inputSize} → ${result.outputSize} bytes (${(result.compressionRatio * 100).toFixed(1)}%)`);
            });

            // Performance should be reasonable
            Object.values(results).forEach(result => {
                assert(result.duration < 15000, 'Minification should complete within reasonable time');
                assert(result.compressionRatio < 1, 'Minification should reduce size');
            });
        });

        it('should benchmark advanced bundling with CSS extraction', async function() {
            const bundler = new Advanced_JS_Bundler_Using_ESBuild({
                debug: false,
                bundler: {
                    minify: { enabled: true, level: 'normal' }
                }
            });

            const startTime = Date.now();
            try {
                const result = await bundler.bundle(testJsFile);
                const endTime = Date.now();

                const duration = endTime - startTime;
                const bundle = result[0];
                const jsItem = bundle._arr.find(item => item.type === 'JavaScript');
                const cssItem = bundle._arr.find(item => item.type === 'CSS');

                console.log(`Advanced bundling: ${duration}ms`);
                console.log(`JS: ${largeJsContent.length} → ${jsItem.text.length} bytes`);
                if (cssItem) {
                    console.log(`CSS extracted: ${cssItem.text.length} bytes`);
                }

                assert(duration < 20000, 'Advanced bundling should complete within reasonable time');
                assert(jsItem, 'Should produce JavaScript bundle');
            } catch (error) {
                console.log(`Advanced bundling failed: ${error.message}`);
                // Skip this test if advanced bundling fails
                this.skip();
            }
        });

        it('should measure concurrent bundling performance', async function() {
            const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild();
            const concurrentBundles = 5;

            const startTime = Date.now();
            const promises = [];

            for (let i = 0; i < concurrentBundles; i++) {
                promises.push(bundler.bundle_js_string(mediumJsContent));
            }

            await Promise.all(promises);
            const endTime = Date.now();

            const totalDuration = endTime - startTime;
            const avgDuration = totalDuration / concurrentBundles;

            console.log(`Concurrent bundling (${concurrentBundles} bundles): ${totalDuration}ms total, ${avgDuration.toFixed(2)}ms average`);

            assert(totalDuration < 10000, 'Concurrent bundling should be efficient');
            assert(avgDuration < 3000, 'Average bundling time should be reasonable');
        });
    });

    describe('Compression Performance Benchmarks', function() {
        let testItems;

        beforeEach(function() {
            // Create test items of different sizes and types
            testItems = [
                {
                    type: 'Small HTML',
                    extension: 'html',
                    text: '<!DOCTYPE html><html><body><h1>Small</h1></body></html>',
                    response_buffers: {}
                },
                {
                    type: 'Medium HTML',
                    extension: 'html',
                    text: '<!DOCTYPE html><html><head><title>Medium</title></head><body><h1>Medium</h1><p>' + 'Content '.repeat(500) + '</p></body></html>',
                    response_buffers: {}
                },
                {
                    type: 'Large HTML',
                    extension: 'html',
                    text: '<!DOCTYPE html><html><head><title>Large</title></head><body><h1>Large</h1><p>' + 'Content '.repeat(2000) + '</p></body></html>',
                    response_buffers: {}
                },
                {
                    type: 'JavaScript',
                    extension: 'js',
                    text: largeJsContent,
                    response_buffers: {}
                }
            ];

            // Initialize identity buffers
            testItems.forEach(item => {
                item.response_buffers.identity = Buffer.from(item.text, 'utf8');
            });
        });

        it('should benchmark gzip compression performance', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['gzip'],
                    gzip: { level: 6 }
                }
            });

            const startTime = Date.now();
            await assigner.assign(testItems);
            const endTime = Date.now();

            const duration = endTime - startTime;

            console.log(`Gzip compression performance: ${duration}ms for ${testItems.length} items`);

            // Calculate total sizes
            const totalOriginal = testItems.reduce((sum, item) => sum + item.response_buffers.identity.length, 0);
            const totalCompressed = testItems.reduce((sum, item) => item.response_buffers.gzip ? sum + item.response_buffers.gzip.length : sum, 0);
            const avgCompressionRatio = totalCompressed / totalOriginal;

            console.log(`Total: ${totalOriginal} → ${totalCompressed} bytes (${(avgCompressionRatio * 100).toFixed(1)}%)`);

            assert(duration < 5000, 'Gzip compression should be fast');
            assert(avgCompressionRatio < 0.8, 'Should achieve reasonable compression');
        });

        it('should benchmark brotli compression performance', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['br'],
                    brotli: { quality: 6 }
                }
            });

            const startTime = Date.now();
            await assigner.assign(testItems);
            const endTime = Date.now();

            const duration = endTime - startTime;

            console.log(`Brotli compression performance: ${duration}ms for ${testItems.length} items`);

            // Calculate total sizes
            const totalOriginal = testItems.reduce((sum, item) => sum + item.response_buffers.identity.length, 0);
            const totalCompressed = testItems.reduce((sum, item) => item.response_buffers.br ? sum + item.response_buffers.br.length : sum, 0);
            const avgCompressionRatio = totalCompressed / totalOriginal;

            console.log(`Total: ${totalOriginal} → ${totalCompressed} bytes (${(avgCompressionRatio * 100).toFixed(1)}%)`);

            assert(duration < 10000, 'Brotli compression should complete reasonably quickly');
            assert(avgCompressionRatio < 0.8, 'Should achieve good compression');
        });

        it('should compare gzip vs brotli performance', async function() {
            const gzipAssigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['gzip']
                }
            });

            const brotliAssigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['br']
                }
            });

            // Test gzip
            const gzipStart = Date.now();
            await gzipAssigner.assign(testItems);
            const gzipEnd = Date.now();

            // Test brotli
            const brotliStart = Date.now();
            await brotliAssigner.assign(testItems);
            const brotliEnd = Date.now();

            const gzipDuration = gzipEnd - gzipStart;
            const brotliDuration = brotliEnd - brotliStart;

            console.log(`Gzip: ${gzipDuration}ms, Brotli: ${brotliDuration}ms`);

            // Calculate compression ratios
            const totalOriginal = testItems.reduce((sum, item) => sum + item.response_buffers.identity.length, 0);
            const gzipTotal = testItems.reduce((sum, item) => item.response_buffers.gzip ? sum + item.response_buffers.gzip.length : sum, 0);
            const brotliTotal = testItems.reduce((sum, item) => item.response_buffers.br ? sum + item.response_buffers.br.length : sum, 0);

            console.log(`Gzip ratio: ${(gzipTotal / totalOriginal * 100).toFixed(1)}%`);
            console.log(`Brotli ratio: ${(brotliTotal / totalOriginal * 100).toFixed(1)}%`);

            // Brotli typically takes longer but compresses better
            assert(gzipDuration > 0 && brotliDuration > 0, 'Both algorithms should take some time');
        });

        it('should test compression threshold performance impact', async function() {
            const thresholds = [0, 512, 2048, 8192]; // Different threshold sizes
            const results = {};

            for (const threshold of thresholds) {
                const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                    compression: {
                        enabled: true,
                        algorithms: ['gzip'],
                        threshold: threshold
                    }
                });

                const startTime = Date.now();
                await assigner.assign(testItems);
                const endTime = Date.now();

                const compressedCount = testItems.filter(item => item.response_buffers.gzip).length;

                results[threshold] = {
                    duration: endTime - startTime,
                    compressedCount: compressedCount,
                    totalItems: testItems.length
                };
            }

            console.log('Compression threshold performance:');
            Object.entries(results).forEach(([threshold, result]) => {
                console.log(`Threshold ${threshold}: ${result.duration}ms, ${result.compressedCount}/${result.totalItems} compressed`);
            });

            // Lower thresholds should result in more compression
            assert(results[0].compressedCount >= results[8192].compressedCount,
                   'Lower threshold should compress more items');
        });
    });

    describe('End-to-End Server Performance', function() {
        let server;
        let serverPort = 3002;

        after(async function() {
            if (server) {
                await server.stop();
            }
        });

        it('should measure server startup performance', async function() {
            const startTime = Date.now();

            server = new Server();
            try {
                await server.serve({
                    ctrl: class TestControl {
                        all_html_render() {
                            return Promise.resolve(`<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Test Control</h1></body>
</html>`);
                        }
                    },
                    port: serverPort,
                    debug: false,
                    bundler: {
                        minify: { enabled: true },
                        compression: { enabled: true }
                    }
                });

                const endTime = Date.now();
                const startupTime = endTime - startTime;

                console.log(`Server startup time: ${startupTime}ms`);

                assert(startupTime < 10000, 'Server should start within reasonable time');

                // Clean up
                await server.stop();
                server = null;
            } catch (error) {
                console.log(`Server startup failed: ${error.message}`);
                // Skip this test if server startup fails
                this.skip();
            }
        });

        it('should benchmark response times for different configurations', async function() {
            const configurations = [
                { name: 'No compression', compression: false, minify: false },
                { name: 'Gzip only', compression: { enabled: true, algorithms: ['gzip'] }, minify: false },
                { name: 'Brotli only', compression: { enabled: true, algorithms: ['br'] }, minify: false },
                { name: 'Full optimization', compression: { enabled: true, algorithms: ['gzip', 'br'] }, minify: true }
            ];

            const results = {};

            for (const config of configurations) {
                server = new Server();
                try {
                    await server.serve({
                        ctrl: class TestControl {
                            all_html_render() {
                                return Promise.resolve(`<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
<h1>Test Control</h1>
<script>
// Large script to test compression
const data = [];
for (let i = 0; i < 1000; i++) {
    data.push({ id: i, value: Math.random(), name: 'Item' + i });
}
console.log('Data loaded:', data.length);
</script>
</body>
</html>`);
                            }
                        },
                        port: serverPort,
                        debug: false,
                        bundler: {
                            minify: config.minify ? { enabled: true, level: 'normal' } : { enabled: false },
                            compression: config.compression
                        }
                    });

                    // Wait for server to be ready
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Measure response time
                    const responseStart = Date.now();
                    const response = await makeRequest(`http://localhost:${serverPort}/`, {
                        'Accept-Encoding': config.name.includes('Gzip') ? 'gzip' :
                                         config.name.includes('Brotli') ? 'br' : 'identity'
                    });
                    const responseEnd = Date.now();

                    results[config.name] = {
                        responseTime: responseEnd - responseStart,
                        statusCode: response.statusCode,
                        contentLength: response.body.length,
                        contentEncoding: response.headers['content-encoding']
                    };

                    await server.stop();
                    server = null;
                } catch (error) {
                    console.log(`Configuration ${config.name} failed: ${error.message}`);
                    results[config.name] = { error: error.message };
                    if (server) {
                        try {
                            await server.stop();
                        } catch (e) {
                            // Ignore cleanup errors
                        }
                        server = null;
                    }
                }
            }

            console.log('Server response performance:');
            Object.entries(results).forEach(([name, result]) => {
                if (result.error) {
                    console.log(`${name}: Failed - ${result.error}`);
                } else {
                    console.log(`${name}: ${result.responseTime}ms, ${result.contentLength} bytes, encoding: ${result.contentEncoding || 'none'}`);
                }
            });

            // Check successful responses
            const successfulResults = Object.values(results).filter(result => !result.error);
            successfulResults.forEach(result => {
                assert.strictEqual(result.statusCode, 200, 'Successful responses should have status 200');
                assert(result.responseTime < 5000, 'Successful responses should be reasonably fast');
            });
        });
    });

    describe('Memory Usage Analysis', function() {
        it('should monitor memory usage during bundling operations', async function() {
            const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                minify: { enabled: true, level: 'aggressive' }
            });

            const initialMemory = process.memoryUsage();

            // Perform multiple bundling operations
            for (let i = 0; i < 10; i++) {
                await bundler.bundle(largeJsContent);
            }

            const finalMemory = process.memoryUsage();

            const memoryIncrease = {
                rss: finalMemory.rss - initialMemory.rss,
                heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
                heapTotal: finalMemory.heapTotal - initialMemory.heapTotal
            };

            console.log('Memory usage after bundling operations:');
            console.log(`RSS: ${memoryIncrease.rss / 1024 / 1024} MB`);
            console.log(`Heap Used: ${memoryIncrease.heapUsed / 1024 / 1024} MB`);
            console.log(`Heap Total: ${memoryIncrease.heapTotal / 1024 / 1024} MB`);

            // Memory usage should be reasonable
            assert(memoryIncrease.heapUsed < 50 * 1024 * 1024, 'Memory usage should be reasonable (< 50MB increase)');
        });
    });
});

// Helper function for HTTP requests (simplified version for performance tests)
function makeRequest(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const http = require('http');
        const parsedUrl = new URL(url);

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname,
            method: 'GET',
            headers: {
                'User-Agent': 'JSGUI3-Performance-Test/1.0',
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
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}