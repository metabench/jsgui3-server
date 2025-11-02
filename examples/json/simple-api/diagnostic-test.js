// Comprehensive Diagnostic Test System for JSON API Server
// Tests each component individually to pinpoint failures

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

class DiagnosticTestSystem {
    constructor() {
        this.results = {
            timestamp: new Date(),
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                errors: []
            }
        };
        this.serverProcess = null;
        this.testPort = 3003; // Different port to avoid conflicts
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = level === 'error' ? '❌' : level === 'success' ? '✅' : '🔍';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    recordTest(name, status, details = {}) {
        const test = {
            name,
            status,
            timestamp: new Date(),
            ...details
        };
        this.results.tests.push(test);
        this.results.summary.total++;

        if (status === 'passed') {
            this.results.summary.passed++;
            this.log(`${name}: PASSED`, 'success');
        } else if (status === 'failed') {
            this.results.summary.failed++;
            this.log(`${name}: FAILED - ${details.error || 'Unknown error'}`, 'error');
        } else if (status === 'error') {
            this.results.summary.errors.push(details.error);
            this.log(`${name}: ERROR - ${details.error}`, 'error');
        }

        return test;
    }

    async testModuleLoading() {
        this.log('Testing module loading...');

        try {
            // Test 1: Load Server module
            const Server = require('../../../server');
            if (!Server) {
                throw new Error('Server module not loaded');
            }
            this.recordTest('Module Loading - Server', 'passed');

            // Test 2: Check Server.serve method
            if (typeof Server.serve !== 'function') {
                throw new Error('Server.serve is not a function');
            }
            this.recordTest('Module Loading - Server.serve', 'passed');

            // Test 3: Load serve-factory
            const serveFactory = require('../../../serve-factory');
            if (typeof serveFactory !== 'function') {
                throw new Error('serve-factory module not loaded');
            }
            this.recordTest('Module Loading - serve-factory', 'passed');

            return true;
        } catch (error) {
            this.recordTest('Module Loading', 'error', { error: error.message, stack: error.stack });
            return false;
        }
    }

    async testServerConstruction() {
        this.log('Testing server construction...');

        try {
            const Server = require('../../../server');

            // Test 1: Create server instance
            const server = new Server({
                name: 'Diagnostic Test Server',
                debug: true
            });

            if (!server) {
                throw new Error('Server instance not created');
            }
            this.recordTest('Server Construction - Instance Creation', 'passed');

            // Test 2: Check required properties
            if (!server.resource_pool) {
                throw new Error('Server missing resource_pool');
            }
            this.recordTest('Server Construction - Resource Pool', 'passed');

            if (!server.server_router) {
                throw new Error('Server missing server_router');
            }
            this.recordTest('Server Construction - Router', 'passed');

            // Test 3: Check publish method exists
            if (typeof server.publish !== 'function') {
                throw new Error('Server missing publish method');
            }
            this.recordTest('Server Construction - Publish Method', 'passed');

            return server;
        } catch (error) {
            this.recordTest('Server Construction', 'error', { error: error.message, stack: error.stack });
            return null;
        }
    }

    async testAPISetup(server) {
        this.log('Testing API setup...');

        try {
            // Test 1: Publish API endpoints
            const api = {
                'test-status': () => ({ status: 'test', timestamp: new Date() }),
                'test-data': () => ({ data: [1, 2, 3], count: 3 })
            };

            for (const [name, handler] of Object.entries(api)) {
                server.publish(name, handler);
            }
            this.recordTest('API Setup - Publishing Endpoints', 'passed');

            // Test 2: Check router has routes
            const router = server.router;
            if (!router) {
                throw new Error('Router not accessible');
            }
            this.recordTest('API Setup - Router Access', 'passed');

            return true;
        } catch (error) {
            this.recordTest('API Setup', 'error', { error: error.message, stack: error.stack });
            return false;
        }
    }

    async testHTTPServing(server) {
        this.log('Testing HTTP serving...');

        return new Promise((resolve) => {
            try {
                // Test 1: Start server
                server.start(this.testPort, (err) => {
                    if (err) {
                        this.recordTest('HTTP Serving - Server Start', 'error', { error: err.message });
                        resolve(false);
                        return;
                    }

                    this.recordTest('HTTP Serving - Server Start', 'passed');

                    // Test 2: Make HTTP request
                    setTimeout(() => {
                        this.makeTestRequest('/api/test-status')
                            .then(response => {
                                if (response && response.status === 'test') {
                                    this.recordTest('HTTP Serving - API Response', 'passed');
                                    resolve(true);
                                } else {
                                    this.recordTest('HTTP Serving - API Response', 'failed', {
                                        error: 'Invalid response',
                                        response
                                    });
                                    resolve(false);
                                }
                            })
                            .catch(error => {
                                this.recordTest('HTTP Serving - API Response', 'error', { error: error.message });
                                resolve(false);
                            })
                            .finally(() => {
                                // Clean up server
                                if (server && server.close) {
                                    server.close(() => {
                                        this.log('Test server closed');
                                    });
                                }
                            });
                    }, 1000); // Wait for server to be ready
                });
            } catch (error) {
                this.recordTest('HTTP Serving', 'error', { error: error.message, stack: error.stack });
                resolve(false);
            }
        });
    }

    async testEndToEndIntegration() {
        this.log('Testing end-to-end integration...');

        return new Promise((resolve) => {
            try {
                // Start the actual server process
                this.serverProcess = spawn('node', ['server.js'], {
                    cwd: path.dirname(__filename),
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let serverOutput = '';
                let serverStarted = false;

                const timeout = setTimeout(() => {
                    if (!serverStarted) {
                        this.recordTest('End-to-End - Server Startup', 'failed', {
                            error: 'Server startup timeout'
                        });
                        this.cleanup();
                        resolve(false);
                    }
                }, 15000);

                this.serverProcess.stdout.on('data', (data) => {
                    serverOutput += data.toString();
                    if (serverOutput.includes('🚀 Simple JSON API Server started!') && !serverStarted) {
                        serverStarted = true;
                        clearTimeout(timeout);
                        this.recordTest('End-to-End - Server Startup', 'passed');

                        // Now test the API endpoints
                        setTimeout(async () => {
                            try {
                                // Test status endpoint
                                const statusResponse = await this.makeTestRequest('/api/status', 3002);
                                if (!statusResponse || statusResponse.status !== 'running') {
                                    throw new Error('Status endpoint failed');
                                }

                                // Test messages endpoint
                                const messagesResponse = await this.makeTestRequest('/api/messages', 3002);
                                if (!messagesResponse || !Array.isArray(messagesResponse.messages)) {
                                    throw new Error('Messages endpoint failed');
                                }

                                // Test add message
                                const addResponse = await this.makeTestRequest('/api/add-message', 3002, 'POST', {
                                    text: 'Diagnostic test message',
                                    author: 'Diagnostic System'
                                });
                                if (!addResponse || !addResponse.success) {
                                    throw new Error('Add message endpoint failed');
                                }

                                this.recordTest('End-to-End - API Functionality', 'passed');
                                resolve(true);

                            } catch (error) {
                                this.recordTest('End-to-End - API Functionality', 'error', { error: error.message });
                                resolve(false);
                            } finally {
                                this.cleanup();
                            }
                        }, 1000);
                    }
                });

                this.serverProcess.stderr.on('data', (data) => {
                    console.error('Server stderr:', data.toString());
                });

                this.serverProcess.on('error', (error) => {
                    this.recordTest('End-to-End - Server Process', 'error', { error: error.message });
                    clearTimeout(timeout);
                    resolve(false);
                });

            } catch (error) {
                this.recordTest('End-to-End Integration', 'error', { error: error.message, stack: error.stack });
                resolve(false);
            }
        });
    }

    async makeTestRequest(path, port = this.testPort, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'localhost',
                port: port,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let body = '';

                res.on('data', (chunk) => {
                    body += chunk;
                });

                res.on('end', () => {
                    try {
                        // Handle empty response body
                        if (body.trim() === '') {
                            resolve(null);
                            return;
                        }
                        const response = JSON.parse(body);
                        resolve(response);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${body}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data && method === 'POST') {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    cleanup() {
        if (this.serverProcess) {
            this.serverProcess.kill('SIGTERM');
            setTimeout(() => {
                if (!this.serverProcess.killed) {
                    this.serverProcess.kill('SIGKILL');
                }
            }, 2000);
        }
    }

    generateReport() {
        const report = {
            ...this.results,
            summary: {
                ...this.results.summary,
                successRate: this.results.summary.total > 0 ?
                    ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1) + '%' : '0%'
            }
        };

        // Write to file
        const reportPath = path.join(__dirname, 'diagnostic-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        return report;
    }

    async runAllTests() {
        this.log('🧪 Starting Comprehensive Diagnostic Tests');
        this.log('==========================================\n');

        try {
            // Test 1: Module Loading
            const modulesLoaded = await this.testModuleLoading();
            if (!modulesLoaded) {
                this.log('❌ Module loading failed - cannot continue with other tests');
                return this.generateReport();
            }

            // Test 2: Server Construction
            const server = await this.testServerConstruction();
            if (!server) {
                this.log('❌ Server construction failed - cannot continue with other tests');
                return this.generateReport();
            }

            // Test 3: API Setup
            const apiSetup = await this.testAPISetup(server);
            if (!apiSetup) {
                this.log('❌ API setup failed - cannot continue with HTTP tests');
            }

            // Test 4: HTTP Serving
            await this.testHTTPServing(server);

            // Test 5: End-to-End Integration
            await this.testEndToEndIntegration();

        } catch (error) {
            this.log(`❌ Unexpected error during testing: ${error.message}`, 'error');
            this.recordTest('Unexpected Error', 'error', { error: error.message, stack: error.stack });
        } finally {
            this.cleanup();
        }

        const report = this.generateReport();

        this.log('\n📊 Diagnostic Test Summary');
        this.log('==========================');
        this.log(`Total Tests: ${report.summary.total}`);
        this.log(`Passed: ${report.summary.passed}`);
        this.log(`Failed: ${report.summary.failed}`);
        this.log(`Success Rate: ${report.summary.successRate}`);

        if (report.summary.errors.length > 0) {
            this.log('\n❌ Errors Found:');
            report.summary.errors.forEach((error, index) => {
                this.log(`  ${index + 1}. ${error}`);
            });
        }

        this.log(`\n📄 Detailed report saved to: diagnostic-report.json`);

        return report;
    }
}

// Export for use in other files
module.exports = DiagnosticTestSystem;

// Run if called directly
if (require.main === module) {
    const diagnostic = new DiagnosticTestSystem();
    diagnostic.runAllTests().catch(console.error);
}