const assert = require('assert');
const { describe, it, beforeEach, afterEach } = require('mocha');

// Import publisher classes
const HTTP_Webpage_Publisher = require('../publishers/http-webpage-publisher');

describe('Publisher Component Isolation Tests', function() {
    this.timeout(15000); // Increase timeout for publisher operations

    let mockControl;
    let mockWebpage;

    beforeEach(function() {
        // Create mock control class
        mockControl = class MockControl {
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
<head><title>Test Page</title></head>
<body>
    <div id="control-root">
        <h1>Test Control</h1>
        <p>This is a test control for publisher testing.</p>
    </div>
    <script src="/js/js.js"></script>
</body>
</html>`);
            }
        };

        // Create mock webpage
        mockWebpage = {
            content: mockControl
        };
    });

    describe('HTTP_Webpage_Publisher', function() {
        it('should initialize with default configuration', function() {
            const publisher = new HTTP_Webpage_Publisher({
                webpage: mockWebpage
            });

            assert(publisher.webpage === mockWebpage, 'Should store webpage reference');
            assert(publisher.bundler_config, 'Should initialize bundler config');
            assert(publisher.static_routes_responses_webpage_bundle_preparer,
                   'Should create bundle preparer');
        });

        it('should accept and validate bundler configuration', function() {
            const validConfig = {
                webpage: mockWebpage,
                bundler: {
                    compression: {
                        enabled: true,
                        algorithms: ['gzip', 'br'],
                        threshold: 1024
                    },
                    minify: {
                        enabled: true,
                        level: 'normal'
                    },
                    sourcemaps: {
                        enabled: true,
                        format: 'inline'
                    }
                }
            };

            const publisher = new HTTP_Webpage_Publisher(validConfig);
            assert.deepStrictEqual(publisher.bundler_config, validConfig.bundler,
                                 'Should store valid bundler configuration');
        });

        it('should validate compression configuration - boolean enabled', function() {
            assert.throws(() => {
                new HTTP_Webpage_Publisher({
                    webpage: mockWebpage,
                    bundler: {
                        compression: {
                            enabled: 'invalid' // Should be boolean
                        }
                    }
                });
            }, /bundler\.compression\.enabled must be a boolean/);
        });

        it('should validate compression configuration - array algorithms', function() {
            assert.throws(() => {
                new HTTP_Webpage_Publisher({
                    webpage: mockWebpage,
                    bundler: {
                        compression: {
                            algorithms: 'invalid' // Should be array
                        }
                    }
                });
            }, /bundler\.compression\.algorithms must be an array/);
        });

        it('should validate compression configuration - valid algorithms', function() {
            assert.throws(() => {
                new HTTP_Webpage_Publisher({
                    webpage: mockWebpage,
                    bundler: {
                        compression: {
                            algorithms: ['gzip', 'invalid_algorithm']
                        }
                    }
                });
            }, /Invalid compression algorithm: invalid_algorithm/);
        });

        it('should validate compression configuration - threshold number', function() {
            assert.throws(() => {
                new HTTP_Webpage_Publisher({
                    webpage: mockWebpage,
                    bundler: {
                        compression: {
                            threshold: 'invalid' // Should be number
                        }
                    }
                });
            }, /bundler\.compression\.threshold must be a non-negative number/);
        });

        it('should validate compression configuration - negative threshold', function() {
            assert.throws(() => {
                new HTTP_Webpage_Publisher({
                    webpage: mockWebpage,
                    bundler: {
                        compression: {
                            threshold: -1 // Should be non-negative
                        }
                    }
                });
            }, /bundler\.compression\.threshold must be a non-negative number/);
        });

        it('should accept valid compression algorithms', function() {
            const publisher = new HTTP_Webpage_Publisher({
                webpage: mockWebpage,
                bundler: {
                    compression: {
                        algorithms: ['gzip', 'br']
                    }
                }
            });

            assert.deepStrictEqual(publisher.bundler_config.compression.algorithms, ['gzip', 'br']);
        });

        it('should initialize bundle preparer with configuration', function() {
            const config = {
                webpage: mockWebpage,
                bundler: {
                    compression: {
                        enabled: true,
                        algorithms: ['gzip']
                    }
                }
            };

            const publisher = new HTTP_Webpage_Publisher(config);

            // Verify preparer was created with config
            assert(publisher.static_routes_responses_webpage_bundle_preparer,
                   'Should create bundle preparer');
            assert.deepStrictEqual(
                publisher.static_routes_responses_webpage_bundle_preparer.bundler_config,
                config.bundler,
                'Preparer should receive bundler config'
            );
        });

        it('should handle missing bundler configuration gracefully', function() {
            const publisher = new HTTP_Webpage_Publisher({
                webpage: mockWebpage
                // No bundler config
            });

            assert.deepStrictEqual(publisher.bundler_config, {},
                                 'Should default to empty bundler config');
        });

        it('should handle missing compression configuration gracefully', function() {
            const publisher = new HTTP_Webpage_Publisher({
                webpage: mockWebpage,
                bundler: {
                    // Empty bundler config
                }
            });

            assert.deepStrictEqual(publisher.bundler_config, {});
        });

        it('should handle partial bundler configuration', function() {
            const partialConfig = {
                webpage: mockWebpage,
                bundler: {
                    compression: {
                        enabled: true
                        // Missing other compression options
                    }
                    // Missing minify and sourcemaps
                }
            };

            const publisher = new HTTP_Webpage_Publisher(partialConfig);

            assert.strictEqual(publisher.bundler_config.compression.enabled, true);
            assert(!publisher.bundler_config.minify, 'Should not have minify config');
            assert(!publisher.bundler_config.sourcemaps, 'Should not have sourcemaps config');
        });

        it('should handle handle_http method', function() {
            const publisher = new HTTP_Webpage_Publisher({
                webpage: mockWebpage
            });

            // Mock request and response
            const mockReq = {
                url: '/test',
                headers: {}
            };

            let responseWritten = false;
            let statusCode = null;
            let headers = {};

            const mockRes = {
                writeHead: function(code, h) {
                    statusCode = code;
                    headers = h;
                },
                end: function() {
                    responseWritten = true;
                }
            };

            publisher.handle_http(mockReq, mockRes);

            // Note: This test may need adjustment based on actual handle_http implementation
            // For now, just verify it doesn't crash
            assert(responseWritten || statusCode, 'Should handle HTTP request');
        });

        it('should pass configuration to bundle preparer correctly', function() {
            const complexConfig = {
                webpage: mockWebpage,
                bundler: {
                    minify: {
                        enabled: true,
                        level: 'aggressive',
                        options: {
                            drop_console: true
                        }
                    },
                    sourcemaps: {
                        enabled: true,
                        format: 'inline',
                        includeInProduction: false
                    },
                    compression: {
                        enabled: true,
                        algorithms: ['br'],
                        brotli: { quality: 6 },
                        threshold: 2048
                    }
                }
            };

            const publisher = new HTTP_Webpage_Publisher(complexConfig);

            // Verify complex configuration is passed through
            assert.deepStrictEqual(publisher.bundler_config, complexConfig.bundler);
            assert.strictEqual(publisher.static_routes_responses_webpage_bundle_preparer.bundler_config,
                             complexConfig.bundler);
        });

        it('should handle configuration inheritance and defaults', function() {
            // Test that defaults are applied when partial config is provided
            const partialConfig = {
                webpage: mockWebpage,
                bundler: {
                    compression: {
                        // Only specify some options
                        enabled: true
                    }
                }
            };

            const publisher = new HTTP_Webpage_Publisher(partialConfig);

            // Should have the specified option
            assert.strictEqual(publisher.bundler_config.compression.enabled, true);

            // Should not have unspecified options (they will be undefined)
            assert(!publisher.bundler_config.compression.algorithms,
                   'Should not set default algorithms when not specified');
        });
    });

    describe('Configuration Validation Edge Cases', function() {
        it('should handle null/undefined webpage', function() {
            // This might be allowed or not depending on implementation
            const publisher = new HTTP_Webpage_Publisher({
                // No webpage
            });

            assert(!publisher.webpage, 'Should handle missing webpage');
        });

        it('should handle empty bundler config object', function() {
            const publisher = new HTTP_Webpage_Publisher({
                webpage: mockWebpage,
                bundler: {}
            });

            assert.deepStrictEqual(publisher.bundler_config, {});
        });

        it('should handle deeply nested configuration', function() {
            const deepConfig = {
                webpage: mockWebpage,
                bundler: {
                    minify: {
                        options: {
                            compress: {
                                drop_console: true,
                                drop_debugger: true
                            }
                        }
                    }
                }
            };

            const publisher = new HTTP_Webpage_Publisher(deepConfig);

            assert.strictEqual(
                publisher.bundler_config.minify.options.compress.drop_console,
                true
            );
            assert.strictEqual(
                publisher.bundler_config.minify.options.compress.drop_debugger,
                true
            );
        });
    });

    describe('Integration with Static_Routes_Responses_Webpage_Bundle_Preparer', function() {
        it('should create preparer with correct configuration', function() {
            const config = {
                webpage: mockWebpage,
                bundler: {
                    compression: {
                        enabled: true,
                        algorithms: ['gzip']
                    }
                }
            };

            const publisher = new HTTP_Webpage_Publisher(config);

            const preparer = publisher.static_routes_responses_webpage_bundle_preparer;

            // Verify preparer has the config
            assert.strictEqual(preparer.bundler_config, config.bundler);

            // Verify preparer creates compressed response buffers assigner with config
            assert(preparer.compressed_response_buffers_assigner);
            assert.strictEqual(
                preparer.compressed_response_buffers_assigner.compression_config,
                config.bundler.compression
            );
        });
    });
});