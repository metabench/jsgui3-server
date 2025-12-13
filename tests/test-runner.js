#!/usr/bin/env node

/**
 * Comprehensive Test Runner for JSGUI3 Minification, Compression, and Sourcemaps
 *
 * This test runner executes all test suites and provides detailed reporting
 * for the minification, compression, and sourcemap features.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class TestRunner {
    constructor() {
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            suites: []
        };

        this.testFiles = [
            'bundlers.test.js',
            'assigners.test.js',
            'publishers.test.js',
            'configuration-validation.test.js',
            'end-to-end.test.js',
            'content-analysis.test.js',
            'performance.test.js',
            'error-handling.test.js',
            'examples-controls.e2e.test.js'
        ];
    }

    async runAllTests() {
        console.log('🚀 Starting JSGUI3 Minification, Compression & Sourcemaps Test Suite\n');
        console.log('=' .repeat(80));

        const startTime = Date.now();

        for (const testFile of this.testFiles) {
            await this.runTestFile(testFile);
        }

        this.testResults.duration = Date.now() - startTime;

        this.printSummary();
        this.generateReport();

        return this.testResults.failed === 0;
    }

    async runTestFile(testFile) {
        const testPath = path.join(__dirname, testFile);

        try {
            await fs.access(testPath);
        } catch (error) {
            console.log(`⚠️  Skipping ${testFile} - file not found`);
            this.testResults.suites.push({
                name: testFile,
                status: 'skipped',
                error: 'File not found'
            });
            this.testResults.skipped++;
            return;
        }

        console.log(`\n📋 Running ${testFile}...`);

        return new Promise((resolve) => {
            const mocha = spawn('node', ['node_modules/mocha/bin/mocha.js', testPath, '--timeout', '30000', '--reporter', 'spec'], {
                stdio: 'inherit',
                cwd: process.cwd(),
                env: { ...process.env, JSGUI_DEBUG: '0' }
            });

            let output = '';
            let errorOutput = '';

            mocha.stdout?.on('data', (data) => {
                output += data.toString();
            });

            mocha.stderr?.on('data', (data) => {
                errorOutput += data.toString();
            });

            mocha.on('close', (code) => {
                const suiteResult = {
                    name: testFile,
                    status: code === 0 ? 'passed' : 'failed',
                    exitCode: code,
                    output: output,
                    errorOutput: errorOutput
                };

                this.testResults.suites.push(suiteResult);

                if (code === 0) {
                    console.log(`✅ ${testFile} passed`);
                    this.testResults.passed++;
                } else {
                    console.log(`❌ ${testFile} failed (exit code: ${code})`);
                    this.testResults.failed++;
                }

                this.testResults.total++;
                resolve();
            });

            mocha.on('error', (error) => {
                console.log(`❌ ${testFile} error: ${error.message}`);
                this.testResults.suites.push({
                    name: testFile,
                    status: 'error',
                    error: error.message
                });
                this.testResults.failed++;
                this.testResults.total++;
                resolve();
            });
        });
    }

    printSummary() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(80));

        console.log(`Total Test Suites: ${this.testResults.total}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`⚠️  Skipped: ${this.testResults.skipped}`);
        console.log(`⏱️  Duration: ${(this.testResults.duration / 1000).toFixed(2)}s`);

        const successRate = this.testResults.total > 0 ?
            ((this.testResults.passed / this.testResults.total) * 100).toFixed(1) : 0;
        console.log(`📈 Success Rate: ${successRate}%`);

        if (this.testResults.failed > 0) {
            console.log('\n❌ Failed Test Suites:');
            this.testResults.suites
                .filter(suite => suite.status === 'failed' || suite.status === 'error')
                .forEach(suite => {
                    console.log(`   - ${suite.name}: ${suite.error || 'Exit code ' + suite.exitCode}`);
                });
        }

        console.log('\n' + '='.repeat(80));

        if (this.testResults.failed === 0) {
            console.log('🎉 All tests passed! The minification, compression, and sourcemap features are working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please review the implementation and fix the issues.');
        }
    }

    async generateReport() {
        const reportPath = path.join(__dirname, '..', 'test-report.json');

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.testResults.total,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                skipped: this.testResults.skipped,
                duration: this.testResults.duration,
                successRate: this.testResults.total > 0 ?
                    ((this.testResults.passed / this.testResults.total) * 100).toFixed(1) : 0
            },
            suites: this.testResults.suites.map(suite => ({
                name: suite.name,
                status: suite.status,
                exitCode: suite.exitCode,
                error: suite.error
            })),
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                cwd: process.cwd()
            }
        };

        try {
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
            console.log(`📄 Detailed report saved to: ${reportPath}`);
        } catch (error) {
            console.log(`⚠️  Failed to save report: ${error.message}`);
        }
    }

    async runSpecificTest(testName) {
        if (!this.testFiles.includes(testName)) {
            console.log(`❌ Test file '${testName}' not found. Available tests:`);
            this.testFiles.forEach(file => console.log(`   - ${file}`));
            return false;
        }

        console.log(`🎯 Running specific test: ${testName}\n`);
        console.log('='.repeat(80));

        const startTime = Date.now();
        await this.runTestFile(testName);
        this.testResults.duration = Date.now() - startTime;

        this.printSummary();
        this.generateReport();

        return this.testResults.failed === 0;
    }

    async runWithOptions(options) {
        if (options.debug) {
            process.env.JSGUI_DEBUG = '1';
            console.log('🐛 Debug mode enabled');
        }

        if (options.verbose) {
            console.log('📝 Verbose output enabled');
        }

        if (options.specific) {
            return await this.runSpecificTest(options.specific);
        } else {
            return await this.runAllTests();
        }
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const options = {
        debug: args.includes('--debug'),
        verbose: args.includes('--verbose'),
        specific: args.find(arg => arg.startsWith('--test='))?.split('=')[1]
    };

    const runner = new TestRunner();

    try {
        const success = await runner.runWithOptions(options);
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    }
}

// Export for programmatic use
module.exports = TestRunner;

// Run if called directly
if (require.main === module) {
    main();
}
