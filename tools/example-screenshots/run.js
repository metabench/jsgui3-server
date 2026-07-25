/**
 * Example screenshot harness.
 *
 * Discovers every runnable example server under examples/, runs each one in a
 * child process (exactly as a user would with `node server.js`), waits for the
 * HTTP server to become reachable, loads the page in headless puppeteer, and
 * saves a PNG screenshot plus diagnostics (console errors, page errors, failed
 * requests, server stderr).
 *
 * Examples nearly all hardcode port 52000, so they are run sequentially and
 * each child process tree is killed (and the port confirmed free) before the
 * next example starts.
 *
 * Usage:
 *   node tools/example-screenshots/run.js               # run everything
 *   node tools/example-screenshots/run.js --only grid   # filter by substring
 *   node tools/example-screenshots/run.js --timeout 120 # per-example seconds
 *
 * Output: tools/example-screenshots/output/<name>.png
 *         tools/example-screenshots/output/report.json
 *         tools/example-screenshots/output/report.md
 */

const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const { spawn, spawnSync } = require('child_process');

const repo_root_path = path.join(__dirname, '..', '..');
const examples_root_path = path.join(repo_root_path, 'examples');
const output_root_path = path.join(__dirname, 'output');

const default_port = 52000;
const is_windows = process.platform === 'win32';

const parse_cli_args = () => {
    const args = process.argv.slice(2);
    const options = { only: null, timeout_ms: 90000 };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--only' && args[i + 1]) {
            options.only = args[++i].toLowerCase();
        } else if (args[i] === '--timeout' && args[i + 1]) {
            options.timeout_ms = parseInt(args[++i], 10) * 1000;
        }
    }
    return options;
};

// ── Discovery ──────────────────────────────────────────────────

const is_entry_script_source = (source) => {
    // A standalone runnable example: gated on require.main and requires the
    // repo's server module via a relative path.
    return /require\.main\s*===\s*module/.test(source) &&
        /require\(\s*['"]\.[.\/\\]*\/server(\.js)?['"]\s*\)/.test(source);
};

const discover_examples = () => {
    const discovered = [];

    const walk = (dir_path, depth) => {
        if (depth > 3) return;
        const dir_name = path.basename(dir_path);
        if (dir_name === '__old' || dir_name === 'node_modules') return;

        let dir_entries;
        try {
            dir_entries = fs.readdirSync(dir_path, { withFileTypes: true });
        } catch (e) {
            return;
        }

        for (const entry of dir_entries) {
            const entry_path = path.join(dir_path, entry.name);
            if (entry.isDirectory()) {
                walk(entry_path, depth + 1);
            } else if (entry.isFile() && entry.name.endsWith('.js')) {
                const is_client_file = entry.name === 'client.js' || /_client\.js$/.test(entry.name);
                if (is_client_file) continue;

                if (entry.name === 'server.js') {
                    discovered.push(entry_path);
                } else if (!/test/i.test(entry.name)) {
                    // Standalone entry scripts; skip test/diagnostic scripts
                    // (e.g. json/simple-api/diagnostic-test.js) which run and exit.
                    const source = fs.readFileSync(entry_path, 'utf8');
                    if (is_entry_script_source(source)) {
                        discovered.push(entry_path);
                    }
                }
            }
        }
    };

    walk(examples_root_path, 0);
    discovered.sort();
    return discovered;
};

const example_display_name = (entry_path) => {
    return path.relative(examples_root_path, entry_path).replace(/\\/g, '/');
};

const example_output_name = (entry_path) => {
    let relative_name = example_display_name(entry_path);
    relative_name = relative_name.replace(/\/server\.js$/, '').replace(/\.js$/, '');
    return relative_name
        .replace(/[\/\\]/g, '__')
        .replace(/[^a-zA-Z0-9_.-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

const expected_port_for = (entry_path) => {
    const source = fs.readFileSync(entry_path, 'utf8');
    // Port conventions across the examples, in priority order:
    //   server.start(52000, ...)
    //   const port = parseInt(process.env.PORT, 10) || 52015
    //   const port = 8090   /   { port: 8090 }
    const port_patterns = [
        /\.start\(\s*(\d{2,5})/,
        /process\.env\.PORT[^|]*\|\|\s*(\d{2,5})/,
        /\bport\s*[:=]\s*(\d{2,5})/i
    ];
    for (const pattern of port_patterns) {
        const match = source.match(pattern);
        if (match) return parseInt(match[1], 10);
    }
    return default_port;
};

const detect_port_from_stdout = (stdout_text) => {
    // e.g. "Server running at http://127.0.0.1:52021/", "http://localhost:52101", "started on port 52000"
    const stdout_port_patterns = [
        /127\.0\.0\.1:(\d{2,5})/,
        /localhost:(\d{2,5})/i,
        /port[:\s]+(\d{2,5})/i
    ];
    for (const pattern of stdout_port_patterns) {
        const match = stdout_text.match(pattern);
        if (match) return parseInt(match[1], 10);
    }
    return null;
};

// ── Process / network helpers ──────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const probe_http = (port) => new Promise((resolve) => {
    const request = http.get({ host: '127.0.0.1', port, path: '/', timeout: 3000 }, (response) => {
        response.resume();
        resolve({ reachable: true, status: response.statusCode });
    });
    request.on('timeout', () => {
        request.destroy();
        resolve({ reachable: false });
    });
    request.on('error', () => resolve({ reachable: false }));
});

const is_port_in_use = (port) => new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port, timeout: 1500 });
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => resolve(false));
});

const kill_process_tree = (child_process) => {
    if (!child_process || child_process.exitCode !== null) return;
    if (is_windows) {
        spawnSync('taskkill', ['/PID', String(child_process.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
        try { process.kill(-child_process.pid, 'SIGKILL'); } catch (e) {
            try { child_process.kill('SIGKILL'); } catch (e2) { /* already gone */ }
        }
    }
};

const wait_for_port_free = async (port, timeout_ms) => {
    const deadline = Date.now() + timeout_ms;
    while (Date.now() < deadline) {
        if (!(await is_port_in_use(port))) return true;
        await sleep(400);
    }
    return false;
};

// ── Per-example run ────────────────────────────────────────────

const run_example = async (entry_path, browser_instance, options) => {
    const name = example_display_name(entry_path);
    const output_name = example_output_name(entry_path);
    const expected_port = expected_port_for(entry_path);
    const started_at = Date.now();

    const result = {
        name,
        entry: path.relative(repo_root_path, entry_path).replace(/\\/g, '/'),
        expected_port,
        status: 'unknown',
        http_status: null,
        page_title: null,
        body_text_length: null,
        body_text_sample: null,
        content_type: null,
        console_errors: [],
        page_errors: [],
        failed_requests: [],
        server_stderr_tail: null,
        server_stdout_tail: null,
        screenshot: null,
        duration_ms: null
    };

    if (await is_port_in_use(expected_port)) {
        result.status = 'skipped_port_busy';
        result.duration_ms = Date.now() - started_at;
        return result;
    }

    let stdout_buffer = '';
    let stderr_buffer = '';
    let detected_port = null;

    const child = spawn(process.execPath, [entry_path], {
        cwd: path.dirname(entry_path),
        detached: !is_windows,
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.on('data', (chunk) => {
        stdout_buffer += chunk.toString();
        const stdout_port = detect_port_from_stdout(stdout_buffer);
        if (stdout_port) detected_port = stdout_port;
    });
    child.stderr.on('data', (chunk) => { stderr_buffer += chunk.toString(); });

    let child_exited = false;
    child.on('exit', () => { child_exited = true; });

    try {
        // Wait for HTTP readiness (any response counts, including 404).
        const deadline = Date.now() + options.timeout_ms;
        let probe_result = { reachable: false };
        let active_port = expected_port;

        while (Date.now() < deadline && !probe_result.reachable) {
            if (child_exited) break;
            active_port = detected_port || expected_port;
            probe_result = await probe_http(active_port);
            if (!probe_result.reachable) await sleep(500);
        }

        if (child_exited && !probe_result.reachable) {
            result.status = 'server_exited';
            return result;
        }
        if (!probe_result.reachable) {
            result.status = 'timeout_waiting_for_server';
            return result;
        }

        result.http_status = probe_result.status;

        // Load the page in puppeteer and screenshot it.
        const page = await browser_instance.newPage();
        try {
            await page.setViewport({ width: 1280, height: 800 });

            page.on('console', (message) => {
                if (message.type() === 'error') {
                    result.console_errors.push(message.text().slice(0, 500));
                }
            });
            page.on('pageerror', (error) => {
                result.page_errors.push(String(error && error.message || error).slice(0, 500));
            });
            page.on('requestfailed', (request) => {
                result.failed_requests.push(`${request.url()} :: ${request.failure() ? request.failure().errorText : 'unknown'}`);
            });

            const response = await page.goto(`http://127.0.0.1:${active_port}/`, {
                waitUntil: 'networkidle2',
                timeout: 45000
            });
            if (response) {
                result.http_status = response.status();
                result.content_type = response.headers()['content-type'] || null;
            }

            // Give client-side activation / canvas rendering a moment to settle.
            await sleep(2500);

            result.page_title = await page.title();
            const body_text = await page.evaluate(() => document.body ? document.body.innerText : '');
            result.body_text_length = body_text.length;
            result.body_text_sample = body_text.slice(0, 300);

            const screenshot_path = path.join(output_root_path, `${output_name}.png`);
            await page.screenshot({ path: screenshot_path, fullPage: false });
            result.screenshot = path.relative(repo_root_path, screenshot_path).replace(/\\/g, '/');
            result.status = 'screenshot_captured';
        } finally {
            await page.close().catch(() => {});
        }
    } catch (error) {
        result.status = 'error';
        result.page_errors.push(`harness: ${String(error && error.message || error).slice(0, 500)}`);
    } finally {
        kill_process_tree(child);
        const port_to_free = detected_port || expected_port;
        const freed = await wait_for_port_free(port_to_free, 15000);
        if (!freed) {
            console.warn(`  ! port ${port_to_free} still busy after killing ${name}`);
        }
        result.server_stdout_tail = stdout_buffer.slice(-800) || null;
        result.server_stderr_tail = stderr_buffer.slice(-1500) || null;
        result.duration_ms = Date.now() - started_at;
    }

    return result;
};

// ── Report ─────────────────────────────────────────────────────

const status_symbol = (result) => {
    if (result.status !== 'screenshot_captured') return '❌';
    if (result.page_errors.length || result.console_errors.length) return '⚠️';
    if (result.http_status && result.http_status >= 400) return '⚠️';
    return '✅';
};

const load_previous_results = () => {
    const report_json_path = path.join(output_root_path, 'report.json');
    try {
        const previous_report = JSON.parse(fs.readFileSync(report_json_path, 'utf8'));
        return Array.isArray(previous_report.results) ? previous_report.results : [];
    } catch (e) {
        return [];
    }
};

const write_report = (current_results, previous_results) => {
    // Merge: results from this run replace any previous result for the same
    // example, so filtered (--only) re-runs update the full report in place.
    const merged_by_name = new Map();
    for (const result of previous_results) merged_by_name.set(result.name, result);
    for (const result of current_results) merged_by_name.set(result.name, result);
    const results = Array.from(merged_by_name.values())
        .sort((a, b) => a.name.localeCompare(b.name));

    const report_json_path = path.join(output_root_path, 'report.json');
    fs.writeFileSync(report_json_path, JSON.stringify({
        generated_at: new Date().toISOString(),
        total: results.length,
        results
    }, null, 2));

    const lines = ['# Example screenshot report', ''];
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Total examples: ${results.length}`);
    lines.push('');
    lines.push('| | Example | Status | HTTP | Page errors | Console errors | Screenshot |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const result of results) {
        lines.push(`| ${status_symbol(result)} | ${result.name} | ${result.status} | ${result.http_status || ''} | ${result.page_errors.length} | ${result.console_errors.length} | ${result.screenshot ? path.basename(result.screenshot) : ''} |`);
    }
    lines.push('');
    fs.writeFileSync(path.join(output_root_path, 'report.md'), lines.join('\n'));
};

// ── Main ───────────────────────────────────────────────────────

const main = async () => {
    const options = parse_cli_args();
    fs.mkdirSync(output_root_path, { recursive: true });

    let entries = discover_examples();
    if (options.only) {
        entries = entries.filter((entry_path) =>
            example_display_name(entry_path).toLowerCase().includes(options.only));
    }

    console.log(`Discovered ${entries.length} runnable example(s).`);

    const puppeteer = require('puppeteer');
    const launch_options = {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launch_options.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    const browser_instance = await puppeteer.launch(launch_options);

    const previous_results = load_previous_results();
    const results = [];
    try {
        for (let i = 0; i < entries.length; i++) {
            const name = example_display_name(entries[i]);
            process.stdout.write(`[${i + 1}/${entries.length}] ${name} ... `);
            const result = await run_example(entries[i], browser_instance, options);
            results.push(result);
            console.log(`${result.status} (${Math.round(result.duration_ms / 1000)}s)` +
                (result.page_errors.length ? ` page_errors=${result.page_errors.length}` : '') +
                (result.console_errors.length ? ` console_errors=${result.console_errors.length}` : ''));
            // Write the report incrementally so partial runs are still useful.
            write_report(results, previous_results);
        }
    } finally {
        await browser_instance.close().catch(() => {});
    }

    const captured = results.filter((r) => r.status === 'screenshot_captured').length;
    console.log(`\nDone. ${captured}/${results.length} screenshots captured.`);
    console.log(`Report: ${path.join(output_root_path, 'report.md')}`);
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
