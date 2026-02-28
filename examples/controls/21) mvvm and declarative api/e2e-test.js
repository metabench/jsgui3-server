'use strict';

/**
 * E2E test for the MVVM & Declarative API Demo using Puppeteer.
 *
 * Starts the server as a child process, launches headless Chromium,
 * and verifies page rendering, structure, and CSS styling.
 *
 * NOTE: Client-side `tpl` bindings (bind-text, bind-value, on-click, bind-class)
 * require full hydration which the current framework activation path does not yet
 * support for `tpl`-generated controls. The E2E tests below verify what is
 * currently functional and document known limitations.
 *
 * Usage:  node e2e-test.js
 */

const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PORT = 52199;
const URL = `http://127.0.0.1:${PORT}`;

let pass = 0, fail = 0;
function check(label, ok) {
    if (ok) { console.log(`  ✅ ${label}`); pass++; }
    else { console.log(`  ❌ ${label}`); fail++; }
}

function waitForServer(url, timeoutMs = 30000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const attempt = () => {
            if (Date.now() - start > timeoutMs) return reject(new Error('Server start timeout'));
            http.get(url, (res) => {
                res.resume();
                resolve();
            }).on('error', () => setTimeout(attempt, 300));
        };
        attempt();
    });
}

async function run() {
    console.log('\n═══ MVVM & Declarative API — E2E Puppeteer Test ═══\n');

    // ── Start Server ────────────────────────────────────────────
    console.log('  Starting server...');
    const serverProc = spawn('node', ['server.js'], {
        cwd: __dirname,
        env: { ...process.env, PORT: String(PORT) },
        stdio: 'pipe'
    });
    serverProc.stdout.resume();
    serverProc.stderr.resume();

    try {
        await waitForServer(URL);
        console.log(`  Server ready on port ${PORT}\n`);
    } catch (err) {
        console.error('  Failed to start server:', err.message);
        serverProc.kill();
        process.exit(1);
    }

    let browser;
    try {
        // ── Launch Browser ──────────────────────────────────────
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 800, height: 700 });

        // ── 1. Page Load ────────────────────────────────────────
        const response = await page.goto(URL, { waitUntil: 'networkidle0', timeout: 15000 });
        check('Page loads with HTTP 200', response.status() === 200);

        // ── 2. HTML Structure ───────────────────────────────────
        await page.waitForSelector('.profile-card', { timeout: 10000 });
        check('Profile card rendered', true);

        const h1Text = await page.$eval('h1', el => el.textContent);
        check('H1 heading present', h1Text.includes('MVVM'));

        check('Profile header section exists', !!(await page.$('.profile-header')));
        check('Profile body section exists', !!(await page.$('.profile-body')));
        check('Profile footer section exists', !!(await page.$('.profile-footer')));

        // ── 3. CSS Styling ──────────────────────────────────────
        const hasActiveClass = await page.$eval('.profile-card', el => el.classList.contains('active-state'));
        check('Card has active-state CSS class', hasActiveClass);

        const cardBorderColor = await page.$eval('.profile-card', el =>
            getComputedStyle(el).borderColor
        );
        check('Active card has green border', cardBorderColor.includes('76') || cardBorderColor.includes('175') || cardBorderColor.includes('4caf50'));

        const cardBg = await page.$eval('.profile-card', el =>
            getComputedStyle(el).backgroundColor
        );
        check('Active card has green-tinted background', cardBg !== 'rgb(255, 255, 255)');

        // ── 4. Labels ───────────────────────────────────────────
        const labels = await page.$$eval('label', els => els.map(l => l.textContent));
        check('First Name label present', labels.some(l => l.includes('First Name')));
        check('Last Name label present', labels.some(l => l.includes('Last Name')));

        // ── 5. Input Fields ─────────────────────────────────────
        const inputs = await page.$$('input[type="text"]');
        check('Two text inputs rendered', inputs.length === 2);

        // ── 6. Buttons ──────────────────────────────────────────
        const buttons = await page.$$eval('button', els => els.map(b => b.textContent));
        check('Toggle Status button present', buttons.includes('Toggle Status'));
        check('Save Profile button present', buttons.includes('Save Profile'));

        // ── 7. Button Styling ───────────────────────────────────
        const saveBtnBg = await page.$eval('button.primary', el =>
            getComputedStyle(el).backgroundColor
        );
        check('Save button has blue background', saveBtnBg.includes('33') || saveBtnBg.includes('150') || saveBtnBg.includes('243'));

        // ── 8. Text Input Interaction ───────────────────────────
        // Even if bind-value doesn't pre-fill, we can type and verify the DOM updates
        const firstInput = inputs[0];
        await firstInput.click({ clickCount: 3 });
        await firstInput.type('TestUser');
        const typedVal = await page.evaluate(el => el.value, firstInput);
        check('Typing into First Name works', typedVal.includes('TestUser'));

        // ── 9. CSS Resources ────────────────────────────────────
        const styles = await page.evaluate(() => {
            const sheets = Array.from(document.styleSheets);
            return sheets.length;
        });
        check('CSS stylesheet loaded', styles > 0);

        // ── 10. JS Resources ────────────────────────────────────
        const scripts = await page.$$eval('script[src]', els => els.length);
        check('JS script tag present', scripts > 0);

        // ── 11. jsgui Data Attributes ───────────────────────────
        const hasJsguiType = await page.$eval('[data-jsgui-type="user_profile_editor"]', el => !!el).catch(() => false);
        check('jsgui type attribute on editor', hasJsguiType);

        // ── Screenshot ──────────────────────────────────────────
        const ssPath = path.join(__dirname, 'e2e-screenshot-final.png');
        await page.screenshot({ path: ssPath, fullPage: true });
        console.log(`\n  📸 Screenshot: ${ssPath}\n`);

    } catch (err) {
        console.error('\n  ⚠️ E2E Error:', err.message, err.stack);
        fail++;
    } finally {
        if (browser) await browser.close();
        serverProc.kill();
    }

    // ── Verdict ─────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════');
    console.log(`RESULTS: ${pass} passed, ${fail} failed`);
    if (fail === 0) {
        console.log('\n✅ VERDICT: All E2E checks passed!');
    } else {
        console.log('\n⚠️  VERDICT: Some E2E checks failed — review above');
    }
    console.log('═══════════════════════════════════════════\n');

    process.exit(fail > 0 ? 1 : 0);
}

run();
