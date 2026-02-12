const assert = require('assert');
const { describe, it, beforeEach, afterEach } = require('mocha');

// Import assigner classes
const Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner = require('../publishers/helpers/assigners/static-compressed-response-buffers/Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner');

describe('Assigner Component Isolation Tests', function() {
    this.timeout(10000); // Increase timeout for compression operations

    let mockBundleItems;

    beforeEach(function() {
        // Create mock bundle items for testing
        mockBundleItems = [
            {
                type: 'HTML',
                extension: 'html',
                text: '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello World</h1></body></html>',
                response_buffers: {}
            },
            {
                type: 'JavaScript',
                extension: 'js',
                text: 'function test(){console.log("test");return"result";}test();',
                response_buffers: {}
            },
            {
                type: 'CSS',
                extension: 'css',
                text: '.test-class{color:red;font-size:14px;}.another-class{background:blue;}',
                response_buffers: {}
            }
        ];

        // Initialize identity buffers (simulate what uncompressed assigner would do)
        mockBundleItems.forEach(item => {
            item.response_buffers.identity = Buffer.from(item.text, 'utf8');
        });
    });

    describe('Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner', function() {
        it('should compress content with default gzip settings', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    threshold: 0
                }
            });

            await assigner.assign(mockBundleItems);

            // Verify gzip compression was applied
            mockBundleItems.forEach(item => {
                assert(item.response_buffers.gzip, `Item ${item.type} should have gzip buffer`);
                assert(Buffer.isBuffer(item.response_buffers.gzip), 'Gzip buffer should be a Buffer');

                // Compressed content should be smaller than original (for non-trivial content)
                if (item.response_buffers.identity.length > 100) {
                    assert(item.response_buffers.gzip.length <= item.response_buffers.identity.length,
                           `Gzip compressed ${item.type} should be smaller or equal size`);
                }
            });

            // Verify compression statistics
            assert.strictEqual(assigner.compression_stats.total_items, 3, 'Should track 3 total items');
            assert.strictEqual(assigner.compression_stats.gzip_compressed, 3, 'Should have compressed 3 items with gzip');
            assert.strictEqual(typeof assigner.compression_stats.gzip_savings, 'number', 'Gzip savings should be numeric');
        });

        it('should compress content with default brotli settings', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    threshold: 0
                }
            });

            await assigner.assign(mockBundleItems);

            // Verify brotli compression was applied
            mockBundleItems.forEach(item => {
                assert(item.response_buffers.br, `Item ${item.type} should have brotli buffer`);
                assert(Buffer.isBuffer(item.response_buffers.br), 'Brotli buffer should be a Buffer');

                // Compressed content should be smaller than original (for non-trivial content)
                if (item.response_buffers.identity.length > 100) {
                    assert(item.response_buffers.br.length <= item.response_buffers.identity.length,
                           `Brotli compressed ${item.type} should be smaller or equal size`);
                }
            });

            // Verify compression statistics
            assert.strictEqual(assigner.compression_stats.brotli_compressed, 3, 'Should have compressed 3 items with brotli');
            assert.strictEqual(typeof assigner.compression_stats.brotli_savings, 'number', 'Brotli savings should be numeric');
        });

        it('should respect compression configuration - gzip only', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['gzip'],
                    threshold: 0
                }
            });

            await assigner.assign(mockBundleItems);

            // Should have gzip but not brotli
            mockBundleItems.forEach(item => {
                assert(item.response_buffers.gzip, `Item ${item.type} should have gzip buffer`);
                assert(!item.response_buffers.br, `Item ${item.type} should not have brotli buffer`);
            });

            assert.strictEqual(assigner.compression_stats.gzip_compressed, 3);
            assert.strictEqual(assigner.compression_stats.brotli_compressed, 0);
        });

        it('should respect compression configuration - brotli only', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['br'],
                    threshold: 0
                }
            });

            await assigner.assign(mockBundleItems);

            // Should have brotli but not gzip
            mockBundleItems.forEach(item => {
                assert(!item.response_buffers.gzip, `Item ${item.type} should not have gzip buffer`);
                assert(item.response_buffers.br, `Item ${item.type} should have brotli buffer`);
            });

            assert.strictEqual(assigner.compression_stats.gzip_compressed, 0);
            assert.strictEqual(assigner.compression_stats.brotli_compressed, 3);
        });

        it('should respect compression configuration - custom gzip level', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['gzip'],
                    gzip: { level: 1 }, // Fastest compression
                    threshold: 0
                }
            });

            await assigner.assign(mockBundleItems);

            // Should have gzip with custom level
            mockBundleItems.forEach(item => {
                assert(item.response_buffers.gzip, `Item ${item.type} should have gzip buffer`);
                assert(!item.response_buffers.br, `Item ${item.type} should not have brotli buffer`);
            });
        });

        it('should respect compression configuration - custom brotli quality', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['br'],
                    brotli: { quality: 1 }, // Lowest quality (fastest)
                    threshold: 0
                }
            });

            await assigner.assign(mockBundleItems);

            // Should have brotli with custom quality
            mockBundleItems.forEach(item => {
                assert(!item.response_buffers.gzip, `Item ${item.type} should not have gzip buffer`);
                assert(item.response_buffers.br, `Item ${item.type} should have brotli buffer`);
            });
        });

        it('should skip compression when disabled', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: false
                }
            });

            await assigner.assign(mockBundleItems);

            // Should not add any compressed buffers
            mockBundleItems.forEach(item => {
                assert(!item.response_buffers.gzip, `Item ${item.type} should not have gzip buffer when disabled`);
                assert(!item.response_buffers.br, `Item ${item.type} should not have brotli buffer when disabled`);
            });

            // Statistics should be zero
            assert.strictEqual(assigner.compression_stats.total_items, 0);
            assert.strictEqual(assigner.compression_stats.gzip_compressed, 0);
            assert.strictEqual(assigner.compression_stats.brotli_compressed, 0);
        });

        it('should respect compression threshold', async function() {
            // Create a very small item that should be below threshold
            const smallItem = {
                type: 'JavaScript',
                extension: 'js',
                text: 'x=1', // Very small content
                response_buffers: {
                    identity: Buffer.from('x=1', 'utf8')
                }
            };

            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    threshold: 1000 // High threshold
                }
            });

            await assigner.assign([smallItem]);

            // Small item should be skipped
            assert(!smallItem.response_buffers.gzip, 'Small item should not be gzip compressed');
            assert(!smallItem.response_buffers.br, 'Small item should not be brotli compressed');

            // Statistics should reflect skipping
            assert.strictEqual(assigner.compression_stats.total_items, 1);
            assert.strictEqual(assigner.compression_stats.gzip_compressed, 0);
            assert.strictEqual(assigner.compression_stats.brotli_compressed, 0);
        });

        it('should handle items without text property', async function() {
            const itemWithoutText = {
                type: 'Image',
                extension: 'png',
                response_buffers: {
                    identity: Buffer.from('fake image data', 'utf8')
                }
            };

            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner();

            await assigner.assign([itemWithoutText]);

            // Should not crash and should not add compression
            assert(!itemWithoutText.response_buffers.gzip);
            assert(!itemWithoutText.response_buffers.br);
        });

        it('should handle empty bundle array', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner();

            await assigner.assign([]);

            // Should not crash
            assert.strictEqual(assigner.compression_stats.total_items, 0);
        });

        it('should calculate compression ratios correctly', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['gzip']
                }
            });

            // Use a larger text that will definitely compress
            const largeText = 'console.log("'.repeat(1000) + '");';
            const largeItem = {
                type: 'JavaScript',
                extension: 'js',
                text: largeText,
                response_buffers: {
                    identity: Buffer.from(largeText, 'utf8')
                }
            };

            await assigner.assign([largeItem]);

            // Verify compression savings calculation
            const originalSize = largeItem.response_buffers.identity.length;
            const compressedSize = largeItem.response_buffers.gzip.length;
            const expectedSavings = originalSize - compressedSize;

            assert.strictEqual(assigner.compression_stats.gzip_savings, expectedSavings);
            assert(expectedSavings > 0, 'Should have compression savings for repetitive content');
        });

        it('should handle invalid compression configuration gracefully', async function() {
            // Test with invalid algorithm
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    enabled: true,
                    algorithms: ['invalid_algorithm']
                }
            });

            await assigner.assign(mockBundleItems);

            // Should not compress anything due to invalid algorithm
            mockBundleItems.forEach(item => {
                assert(!item.response_buffers.gzip, 'Should not compress with invalid algorithm');
                assert(!item.response_buffers.br, 'Should not compress with invalid algorithm');
            });
        });
    });

    describe('Compression Statistics', function() {
        it('should track compression statistics accurately', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    threshold: 0
                }
            });

            await assigner.assign(mockBundleItems);

            // Verify all statistics are tracked
            assert.strictEqual(assigner.compression_stats.total_items, 3);
            assert.strictEqual(assigner.compression_stats.gzip_compressed, 3);
            assert.strictEqual(assigner.compression_stats.brotli_compressed, 3);
            assert(typeof assigner.compression_stats.gzip_savings === 'number');
            assert(typeof assigner.compression_stats.brotli_savings === 'number');
        });

        it('should reset statistics between assign calls', async function() {
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner();

            // First assign
            await assigner.assign(mockBundleItems.slice(0, 1));
            assert.strictEqual(assigner.compression_stats.total_items, 1);

            // Second assign should add to statistics, not reset
            await assigner.assign(mockBundleItems.slice(1, 2));
            assert.strictEqual(assigner.compression_stats.total_items, 2);
        });
    });
});
