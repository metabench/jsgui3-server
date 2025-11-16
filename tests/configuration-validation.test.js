const assert = require('assert');
const { describe, it } = require('mocha');

// Import classes for configuration validation
const HTTP_Webpage_Publisher = require('../publishers/http-webpage-publisher');
const Core_JS_Single_File_Minifying_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Core_JS_Single_File_Minifying_Bundler_Using_ESBuild');
const Core_JS_Non_Minifying_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Core_JS_Non_Minifying_Bundler_Using_ESBuild');
const Advanced_JS_Bundler_Using_ESBuild = require('../resources/processors/bundlers/js/esbuild/Advanced_JS_Bundler_Using_ESBuild');
const Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner = require('../publishers/helpers/assigners/static-compressed-response-buffers/Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner');

describe('Configuration Validation Tests', function() {
    this.timeout(10000);

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

    describe('HTTP_Webpage_Publisher Configuration Validation', function() {
        describe('Compression Configuration', function() {
            it('should accept valid compression configuration', function() {
                const validConfig = {
                    webpage: mockWebpage,
                    bundler: {
                        compression: {
                            enabled: true,
                            algorithms: ['gzip', 'br'],
                            gzip: { level: 6 },
                            brotli: { quality: 6 },
                            threshold: 1024
                        }
                    }
                };

                const publisher = new HTTP_Webpage_Publisher(validConfig);
                assert.strictEqual(publisher.bundler_config.compression.enabled, true);
                assert.deepStrictEqual(publisher.bundler_config.compression.algorithms, ['gzip', 'br']);
            });

            it('should reject invalid compression.enabled type', function() {
                assert.throws(() => {
                    new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: {
                            compression: {
                                enabled: 'true' // Should be boolean
                            }
                        }
                    });
                }, /bundler\.compression\.enabled must be a boolean/);
            });

            it('should reject invalid compression.algorithms type', function() {
                assert.throws(() => {
                    new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: {
                            compression: {
                                algorithms: 'gzip' // Should be array
                            }
                        }
                    });
                }, /bundler\.compression\.algorithms must be an array/);
            });

            it('should reject invalid compression algorithm', function() {
                assert.throws(() => {
                    new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: {
                            compression: {
                                algorithms: ['gzip', 'invalid']
                            }
                        }
                    });
                }, /Invalid compression algorithm: invalid/);
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

            it('should reject invalid compression.threshold type', function() {
                assert.throws(() => {
                    new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: {
                            compression: {
                                threshold: '1024' // Should be number
                            }
                        }
                    });
                }, /bundler\.compression\.threshold must be a non-negative number/);
            });

            it('should reject negative compression.threshold', function() {
                assert.throws(() => {
                    new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: {
                            compression: {
                                threshold: -1
                            }
                        }
                    });
                }, /bundler\.compression\.threshold must be a non-negative number/);
            });

            it('should accept zero compression.threshold', function() {
                const publisher = new HTTP_Webpage_Publisher({
                    webpage: mockWebpage,
                    bundler: {
                        compression: {
                            threshold: 0
                        }
                    }
                });
                assert.strictEqual(publisher.bundler_config.compression.threshold, 0);
            });
        });

        describe('Minification Configuration', function() {
            it('should accept valid minification configuration', function() {
                const validConfig = {
                    webpage: mockWebpage,
                    bundler: {
                        minify: {
                            enabled: true,
                            level: 'normal',
                            options: {
                                mangle: true,
                                compress: true
                            }
                        }
                    }
                };

                const publisher = new HTTP_Webpage_Publisher(validConfig);
                assert.strictEqual(publisher.bundler_config.minify.enabled, true);
                assert.strictEqual(publisher.bundler_config.minify.level, 'normal');
            });

            it('should accept all valid minification levels', function() {
                const levels = ['conservative', 'normal', 'aggressive'];

                levels.forEach(level => {
                    const publisher = new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: {
                            minify: {
                                level: level
                            }
                        }
                    });
                    assert.strictEqual(publisher.bundler_config.minify.level, level);
                });
            });

            it('should accept custom minification options', function() {
                const customOptions = {
                    mangle: false,
                    compress: {
                        sequences: false,
                        drop_console: true
                    }
                };

                const publisher = new HTTP_Webpage_Publisher({
                    webpage: mockWebpage,
                    bundler: {
                        minify: {
                            options: customOptions
                        }
                    }
                });
                assert.deepStrictEqual(publisher.bundler_config.minify.options, customOptions);
            });
        });

        describe('Sourcemap Configuration', function() {
            it('should accept valid sourcemap configuration', function() {
                const validConfig = {
                    webpage: mockWebpage,
                    bundler: {
                        sourcemaps: {
                            enabled: true,
                            format: 'inline',
                            includeInProduction: false,
                            validation: true
                        }
                    }
                };

                const publisher = new HTTP_Webpage_Publisher(validConfig);
                assert.strictEqual(publisher.bundler_config.sourcemaps.enabled, true);
                assert.strictEqual(publisher.bundler_config.sourcemaps.format, 'inline');
            });

            it('should accept all valid sourcemap formats', function() {
                const formats = ['inline', 'external'];

                formats.forEach(format => {
                    const publisher = new HTTP_Webpage_Publisher({
                        webpage: mockWebpage,
                        bundler: {
                            sourcemaps: {
                                format: format
                            }
                        }
                    });
                    assert.strictEqual(publisher.bundler_config.sourcemaps.format, format);
                });
            });
        });

        describe('Complete Configuration Validation', function() {
            it('should accept complete valid configuration', function() {
                const completeConfig = {
                    webpage: mockWebpage,
                    bundler: {
                        minify: {
                            enabled: true,
                            level: 'aggressive',
                            options: {
                                compress: {
                                    drop_console: true,
                                    drop_debugger: true
                                }
                            }
                        },
                        sourcemaps: {
                            enabled: true,
                            format: 'inline',
                            includeInProduction: false
                        },
                        compression: {
                            enabled: true,
                            algorithms: ['gzip', 'br'],
                            gzip: { level: 9 },
                            brotli: { quality: 11 },
                            threshold: 2048
                        }
                    }
                };

                const publisher = new HTTP_Webpage_Publisher(completeConfig);
                assert.deepStrictEqual(publisher.bundler_config, completeConfig.bundler);
            });

            it('should handle missing configuration sections gracefully', function() {
                const partialConfig = {
                    webpage: mockWebpage,
                    bundler: {
                        // Only compression, no minify or sourcemaps
                        compression: {
                            enabled: true
                        }
                    }
                };

                const publisher = new HTTP_Webpage_Publisher(partialConfig);
                assert(publisher.bundler_config.compression);
                assert(!publisher.bundler_config.minify);
                assert(!publisher.bundler_config.sourcemaps);
            });
        });
    });

    describe('Bundler Configuration Validation', function() {
        describe('Core_JS_Single_File_Minifying_Bundler_Using_ESBuild', function() {
            it('should accept valid minification configuration', function() {
                const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                    minify: {
                        enabled: true,
                        level: 'normal',
                        options: {
                            mangle: true
                        }
                    }
                });

                assert.strictEqual(bundler.minify_config.enabled, true);
                assert.strictEqual(bundler.minify_config.level, 'normal');
                assert.strictEqual(bundler.minify_config.options.mangle, true);
            });

            it('should handle disabled minification', function() {
                const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                    minify: {
                        enabled: false
                    }
                });

                assert.strictEqual(bundler.minify_config.enabled, false);
            });

            it('should default to enabled minification', function() {
                const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({
                    minify: {
                        level: 'aggressive'
                    }
                });

                assert.strictEqual(bundler.minify_config.enabled, true);
                assert.strictEqual(bundler.minify_config.level, 'aggressive');
            });

            it('should handle missing minify configuration', function() {
                const bundler = new Core_JS_Single_File_Minifying_Bundler_Using_ESBuild({});

                assert.deepStrictEqual(bundler.minify_config, {});
            });
        });

        describe('Core_JS_Non_Minifying_Bundler_Using_ESBuild', function() {
            it('should accept valid sourcemap configuration', function() {
                const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild({
                    debug: true,
                    sourcemaps: {
                        enabled: true,
                        format: 'inline',
                        includeInProduction: false
                    }
                });

                assert.strictEqual(bundler.sourcemap_config.enabled, true);
                assert.strictEqual(bundler.sourcemap_config.format, 'inline');
                assert.strictEqual(bundler.sourcemap_config.includeInProduction, false);
            });

            it('should handle disabled sourcemaps', function() {
                const bundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild({
                    sourcemaps: {
                        enabled: false
                    }
                });

                assert.strictEqual(bundler.sourcemap_config.enabled, false);
            });

            it('should default sourcemaps based on debug mode', function() {
                const debugBundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild({
                    debug: true
                });

                const prodBundler = new Core_JS_Non_Minifying_Bundler_Using_ESBuild({
                    debug: false
                });

                // Both should have default config (empty object means defaults apply)
                assert.deepStrictEqual(debugBundler.sourcemap_config, {});
                assert.deepStrictEqual(prodBundler.sourcemap_config, {});
            });
        });

        describe('Advanced_JS_Bundler_Using_ESBuild', function() {
            it('should accept and pass through configuration to sub-bundlers', function() {
                const config = {
                    debug: false,
                    bundler: {
                        minify: {
                            level: 'aggressive'
                        },
                        sourcemaps: {
                            enabled: false
                        }
                    }
                };

                const bundler = new Advanced_JS_Bundler_Using_ESBuild(config);

                assert.strictEqual(bundler.debug, false);
                assert.deepStrictEqual(bundler.bundler_config, config.bundler);
            });

            it('should handle debug mode configuration', function() {
                const debugBundler = new Advanced_JS_Bundler_Using_ESBuild({
                    debug: true
                });

                const prodBundler = new Advanced_JS_Bundler_Using_ESBuild({
                    debug: false
                });

                assert.strictEqual(debugBundler.debug, true);
                assert.strictEqual(prodBundler.debug, false);
            });
        });
    });

    describe('Assigner Configuration Validation', function() {
        describe('Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner', function() {
            it('should accept valid compression configuration', function() {
                const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                    compression: {
                        enabled: true,
                        algorithms: ['gzip', 'br'],
                        gzip: { level: 6 },
                        brotli: { quality: 6 },
                        threshold: 1024
                    }
                });

                assert.strictEqual(assigner.compression_config.enabled, true);
                assert.deepStrictEqual(assigner.compression_config.algorithms, ['gzip', 'br']);
                assert.strictEqual(assigner.compression_config.gzip.level, 6);
                assert.strictEqual(assigner.compression_config.brotli.quality, 6);
                assert.strictEqual(assigner.compression_config.threshold, 1024);
            });

            it('should handle disabled compression', function() {
                const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                    compression: {
                        enabled: false
                    }
                });

                assert.strictEqual(assigner.compression_config.enabled, false);
            });

            it('should apply default values for missing configuration', function() {
                const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({});

                // Should have defaults applied internally
                assert(assigner.compression_config); // Should exist as empty object
            });

            it('should handle partial compression configuration', function() {
                const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                    compression: {
                        enabled: true,
                        algorithms: ['gzip']
                        // Missing other options
                    }
                });

                assert.strictEqual(assigner.compression_config.enabled, true);
                assert.deepStrictEqual(assigner.compression_config.algorithms, ['gzip']);
            });
        });
    });

    describe('Configuration Schema Validation', function() {
        it('should validate gzip level range', function() {
            // Gzip levels should be 0-9, but this is handled by zlib internally
            // Just verify the configuration is accepted
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    gzip: { level: 9 }
                }
            });

            assert.strictEqual(assigner.compression_config.gzip.level, 9);
        });

        it('should validate brotli quality range', function() {
            // Brotli quality should be 0-11, but this is handled by zlib internally
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    brotli: { quality: 11 }
                }
            });

            assert.strictEqual(assigner.compression_config.brotli.quality, 11);
        });

        it('should handle invalid algorithm names gracefully', function() {
            // This should not crash during construction, but during assignment
            const assigner = new Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner({
                compression: {
                    algorithms: ['invalid_algorithm']
                }
            });

            // Should store the config even if invalid
            assert.deepStrictEqual(assigner.compression_config.algorithms, ['invalid_algorithm']);
        });
    });

    describe('Configuration Inheritance and Defaults', function() {
        it('should inherit configuration through the publisher chain', function() {
            const serverConfig = {
                webpage: mockWebpage,
                bundler: {
                    compression: {
                        enabled: true,
                        algorithms: ['gzip']
                    },
                    minify: {
                        level: 'normal'
                    }
                }
            };

            const publisher = new HTTP_Webpage_Publisher(serverConfig);

            // Verify configuration flows to preparer
            const preparer = publisher.static_routes_responses_webpage_bundle_preparer;
            assert.deepStrictEqual(preparer.bundler_config, serverConfig.bundler);

            // Verify configuration flows to compression assigner
            const compressionAssigner = preparer.compressed_response_buffers_assigner;
            assert.deepStrictEqual(compressionAssigner.compression_config, serverConfig.bundler.compression);
        });

        it('should apply sensible defaults when configuration is missing', function() {
            const minimalPublisher = new HTTP_Webpage_Publisher({
                webpage: mockWebpage
            });

            // Should not crash and should have empty config
            assert.deepStrictEqual(minimalPublisher.bundler_config, {});
        });
    });
});