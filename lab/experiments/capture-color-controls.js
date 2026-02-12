/**
 * Capture Color Controls Screenshots
 * 
 * Starts the jsgui3-html color controls demo server and uses Puppeteer
 * to capture screenshots of each section for visual verification.
 * 
 * Usage:
 *   node lab/experiments/capture-color-controls.js
 * 
 * Prerequisites:
 *   npm install  (puppeteer is a devDependency)
 *   jsgui3-html repo must be at ../jsgui3-html (relative to jsgui3-server)
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { launch_browser, capture_url_screenshots, close_browser } = require('../screenshot-utils');

const JSGUI3_HTML_PATH = path.resolve(__dirname, '..', '..', '..', 'jsgui3-html');
const DEMO_SERVER_SCRIPT = path.join(JSGUI3_HTML_PATH, 'lab', 'color_controls_demo_server.js');
const DEMO_URL = 'http://localhost:3600';
const OUTPUT_DIR = path.join(__dirname, '..', 'results', 'screenshots', 'color-controls');

/**
 * Start the color controls demo server as a child process.
 */
const start_demo_server = () => {
    return new Promise((resolve, reject) => {
        console.log(`Starting demo server: ${DEMO_SERVER_SCRIPT}`);

        if (!fs.existsSync(DEMO_SERVER_SCRIPT)) {
            reject(new Error(`Demo server script not found: ${DEMO_SERVER_SCRIPT}`));
            return;
        }

        const child = spawn('node', [DEMO_SERVER_SCRIPT], {
            cwd: JSGUI3_HTML_PATH,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, HOME: process.env.USERPROFILE || process.env.HOME }
        });

        let started = false;
        const timeout = setTimeout(() => {
            if (!started) {
                reject(new Error('Demo server startup timeout (15s)'));
            }
        }, 15000);

        child.stdout.on('data', (data) => {
            const text = data.toString();
            process.stdout.write(`  [demo-server] ${text}`);
            if (text.includes('running at') && !started) {
                started = true;
                clearTimeout(timeout);
                // Give it a moment to settle
                setTimeout(() => resolve(child), 500);
            }
        });

        child.stderr.on('data', (data) => {
            process.stderr.write(`  [demo-server-err] ${data.toString()}`);
        });

        child.on('error', (err) => {
            clearTimeout(timeout);
            reject(err);
        });

        child.on('exit', (code) => {
            if (!started) {
                clearTimeout(timeout);
                reject(new Error(`Demo server exited with code ${code} before starting`));
            }
        });
    });
};

/**
 * Stop the demo server child process.
 */
const stop_demo_server = (child) => {
    return new Promise((resolve) => {
        if (!child || child.killed) {
            resolve();
            return;
        }

        child.on('exit', () => resolve());
        child.kill('SIGTERM');

        // Force kill after 3s
        setTimeout(() => {
            if (!child.killed) {
                child.kill('SIGKILL');
            }
            resolve();
        }, 3000);
    });
};

const format_bytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ============================================
// Main
// ============================================
const main = async () => {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║  Color Controls Screenshot Capture           ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    let demo_server;

    try {
        // 1. Start demo server
        demo_server = await start_demo_server();
        console.log(`✓ Demo server started (PID: ${demo_server.pid})\n`);

        // 2. Launch Puppeteer browser
        console.log('Launching Puppeteer browser...');
        await launch_browser();
        console.log('✓ Browser launched\n');

        // 3. Capture screenshots
        console.log(`Capturing screenshots to: ${OUTPUT_DIR}\n`);

        const results = await capture_url_screenshots(DEMO_URL, OUTPUT_DIR, {
            width: 1280,
            height: 900,
            wait_ms: 2000,
            section_selectors: [
                '.demo-section:nth-child(2)',   // Section 1: Color_Grid 12x12
                '.demo-section:nth-child(3)',   // Section 2: Color_Grid 4x2
                '.demo-section:nth-child(4)',   // Section 3: Color_Palette
                '.demo-section:nth-child(5)',   // Section 4: Palette Comparison
                '.demo-section:nth-child(6)',   // Section 5: Raw HTML Swatches
                '.demo-section:nth-child(7)',   // Section 6: Optimized Crayola
                '.demo-section:nth-child(8)',   // Section 7: Pastel Palette
                '.demo-section:nth-child(9)'    // Section 8: Extended 144
            ],
            section_names: [
                'section_1_color_grid_12x12',
                'section_2_color_grid_4x2',
                'section_3_color_palette',
                'section_4_palette_comparison',
                'section_5_raw_swatches',
                'section_6_optimized_crayola',
                'section_7_pastel_palette',
                'section_8_extended_144'
            ]
        });

        // 4. Print summary
        console.log('\n════════════════════════════════════════════════');
        console.log('  Screenshot Capture Summary');
        console.log('════════════════════════════════════════════════\n');

        const table_data = results.map(r => ({
            Name: r.name,
            Dimensions: r.error ? 'FAILED' : `${r.width}×${r.height}`,
            Size: r.error ? r.error : format_bytes(r.size_bytes),
            Path: r.error ? '' : path.basename(r.path)
        }));

        console.table(table_data);

        const success_count = results.filter(r => !r.error).length;
        const fail_count = results.filter(r => r.error).length;

        console.log(`\n✓ ${success_count} screenshots captured`);
        if (fail_count > 0) {
            console.log(`⚠ ${fail_count} captures failed`);
        }
        console.log(`\nOutput directory: ${OUTPUT_DIR}`);

    } catch (err) {
        console.error(`\n✗ Error: ${err.message}`);
        if (err.stack) console.error(err.stack);
        process.exitCode = 1;
    } finally {
        // Cleanup
        console.log('\nCleaning up...');
        await close_browser().catch(() => { });
        if (demo_server) {
            await stop_demo_server(demo_server);
            console.log('✓ Demo server stopped');
        }
        console.log('Done.');
    }
};

main();
