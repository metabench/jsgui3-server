const { Resource } = require('jsgui3-html');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const http = require('http');
const https = require('https');
const lib_net = require('net');
const lib_path = require('path');

const default_health_interval_ms = 30000;
const default_health_timeout_ms = 5000;
const default_health_failures_before_unhealthy = 3;
const default_stop_timeout_ms = 5000;
const default_kill_timeout_ms = 2000;
const default_restart_backoff_base_ms = 1000;
const max_restart_backoff_ms = 60000;
const default_startup_health_retry_interval_ms = 500;
const default_startup_health_timeout_ms = 15000;

const pm2_online_statuses = new Set(['online', 'launching', 'waiting restart']);

const to_error_message = (error_value) => {
    if (!error_value) return null;
    if (typeof error_value === 'string') return error_value;
    if (error_value instanceof Error) return error_value.message;
    return String(error_value);
};

class Process_Resource extends Resource {
    constructor(spec = {}) {
        super(spec);

        this.command = spec.command;
        this.args = Array.isArray(spec.args) ? spec.args : [];
        this.cwd = spec.cwd;
        this.env = spec.env && typeof spec.env === 'object' ? { ...spec.env } : {};

        this.auto_restart = spec.autoRestart === true;
        this.max_restarts = Number.isInteger(spec.maxRestarts) ? spec.maxRestarts : 5;

        this.health_check = spec.healthCheck || null;
        this.health_interval_ms = Number.isFinite(spec.healthIntervalMs)
            ? Number(spec.healthIntervalMs)
            : Number(this.health_check?.intervalMs) || default_health_interval_ms;
        this.health_timeout_ms = Number.isFinite(spec.healthTimeoutMs)
            ? Number(spec.healthTimeoutMs)
            : Number(this.health_check?.timeoutMs) || default_health_timeout_ms;
        this.health_failures_before_unhealthy = Number.isInteger(spec.healthFailuresBeforeUnhealthy)
            ? spec.healthFailuresBeforeUnhealthy
            : Number(this.health_check?.failuresBeforeUnhealthy) || default_health_failures_before_unhealthy;

        this.stop_timeout_ms = Number.isFinite(spec.stopTimeoutMs)
            ? Number(spec.stopTimeoutMs)
            : default_stop_timeout_ms;
        this.kill_timeout_ms = Number.isFinite(spec.killTimeoutMs)
            ? Number(spec.killTimeoutMs)
            : default_kill_timeout_ms;

        this.restart_backoff_base_ms = Number.isFinite(spec.restartBackoffBaseMs)
            ? Number(spec.restartBackoffBaseMs)
            : default_restart_backoff_base_ms;

        this.startup_health_retry_interval_ms = Number.isFinite(spec.startupHealthRetryIntervalMs)
            ? Number(spec.startupHealthRetryIntervalMs)
            : default_startup_health_retry_interval_ms;
        this.startup_health_timeout_ms = Number.isFinite(spec.startupHealthTimeoutMs)
            ? Number(spec.startupHealthTimeoutMs)
            : default_startup_health_timeout_ms;

        this.process_manager = this._normalize_process_manager(spec.processManager);

        this.state = 'stopped';
        this.pid = null;
        this.child_process = null;
        this.start_timestamp = null;
        this.restart_count = 0;
        this.last_health_check = null;
        this.memory_usage = null;

        this.consecutive_health_failures = 0;
        this._unhealthy_raised = false;

        this._manual_stop_requested = false;
        this._pending_restart_timer = null;
        this._health_timer = null;
        this._memory_timer = null;
        this._stdout_remainder = '';
        this._stderr_remainder = '';

        this._current_exit_promise = null;
        this._resolve_current_exit = null;

        this._operation_promise = Promise.resolve();
    }

    _normalize_process_manager(process_manager_spec) {
        if (!process_manager_spec) {
            return { type: 'direct' };
        }

        if (typeof process_manager_spec === 'string') {
            return { type: process_manager_spec.toLowerCase() };
        }

        if (typeof process_manager_spec === 'object') {
            const normalized_manager = {
                ...process_manager_spec,
                type: String(process_manager_spec.type || 'direct').toLowerCase()
            };
            return normalized_manager;
        }

        return { type: 'direct' };
    }

    _resolve_with_optional_callback(operation_promise, callback) {
        if (typeof callback === 'function') {
            operation_promise.then(
                (result) => callback(null, result),
                (error) => callback(error)
            );
            return;
        }
        return operation_promise;
    }

    _enqueue_operation(operation_fn) {
        const next_promise = this._operation_promise.then(() => operation_fn());
        this._operation_promise = next_promise.catch(() => {
            // Keep the chain alive for future operations.
        });
        return next_promise;
    }

    _set_state(next_state) {
        const previous_state = this.state;
        if (previous_state === next_state) {
            return;
        }

        this.state = next_state;
        this.raise('state_change', {
            from: previous_state,
            to: next_state,
            timestamp: Date.now()
        });
    }

    _clear_pending_restart_timer() {
        if (this._pending_restart_timer) {
            clearTimeout(this._pending_restart_timer);
            this._pending_restart_timer = null;
        }
    }

    _sleep(duration_ms) {
        return new Promise((resolve) => setTimeout(resolve, duration_ms));
    }

    _resolve_pm2_command() {
        if (this.process_manager.pm2Path) {
            return this.process_manager.pm2Path;
        }

        if (process.env.PM2_PATH) {
            return process.env.PM2_PATH;
        }

        const pm2_binary_name = process.platform === 'win32' ? 'pm2.cmd' : 'pm2';
        const local_pm2_binary = lib_path.join(process.cwd(), 'node_modules', '.bin', pm2_binary_name);
        if (fs.existsSync(local_pm2_binary)) {
            return local_pm2_binary;
        }

        return pm2_binary_name;
    }

    _run_exec_file(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            execFile(command, args, {
                maxBuffer: 8 * 1024 * 1024,
                ...options
            }, (error, stdout, stderr) => {
                if (error) {
                    error.stdout = stdout;
                    error.stderr = stderr;
                    reject(error);
                    return;
                }
                resolve({ stdout, stderr });
            });
        });
    }

    _normalize_sse_line(line) {
        if (line.endsWith('\r')) {
            return line.slice(0, -1);
        }
        return line;
    }

    _bind_stream_line_events(stream, event_name, remainder_key) {
        if (!stream || typeof stream.on !== 'function') {
            return;
        }

        stream.on('data', (chunk) => {
            this[remainder_key] = `${this[remainder_key] || ''}${chunk.toString('utf8')}`;
            let newline_index = this[remainder_key].indexOf('\n');
            while (newline_index >= 0) {
                const raw_line = this[remainder_key].slice(0, newline_index);
                this[remainder_key] = this[remainder_key].slice(newline_index + 1);
                this.raise(event_name, {
                    line: this._normalize_sse_line(raw_line),
                    pid: this.pid,
                    timestamp: Date.now()
                });
                newline_index = this[remainder_key].indexOf('\n');
            }
        });

        stream.on('end', () => {
            if (this[remainder_key]) {
                this.raise(event_name, {
                    line: this._normalize_sse_line(this[remainder_key]),
                    pid: this.pid,
                    timestamp: Date.now()
                });
                this[remainder_key] = '';
            }
        });
    }

    _create_exit_waiter() {
        this._current_exit_promise = new Promise((resolve) => {
            this._resolve_current_exit = resolve;
        });
    }

    _resolve_exit_waiter(exit_info) {
        if (this._resolve_current_exit) {
            this._resolve_current_exit(exit_info);
        }
        this._resolve_current_exit = null;
        this._current_exit_promise = null;
    }

    async _wait_for_exit(exit_promise, timeout_ms) {
        if (!exit_promise) {
            return true;
        }

        return new Promise((resolve) => {
            let settled = false;
            const complete = (result) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout_handle);
                resolve(result);
            };

            const timeout_handle = setTimeout(() => complete(false), timeout_ms);
            exit_promise.then(() => complete(true), () => complete(true));
        });
    }

    async _start_internal({ manual_start = false } = {}) {
        if (manual_start) {
            this.restart_count = 0;
        }

        if (this.state === 'running' || this.state === 'starting') {
            return this.status;
        }

        this._clear_pending_restart_timer();
        this._manual_stop_requested = false;

        this._set_state('starting');

        if (this.process_manager.type === 'pm2') {
            await this._start_pm2_process();
        } else {
            await this._start_direct_process();
        }

        const initial_health_ok = await this._wait_for_initial_health();
        if (!initial_health_ok && this.health_check) {
            const startup_health_error = new Error(`Startup health check failed for resource "${this.name || 'unnamed'}".`);
            this.raise('unhealthy', {
                timestamp: Date.now(),
                consecutiveFailures: this.consecutive_health_failures,
                state: this.state,
                error: startup_health_error.message
            });

            try {
                await this._stop_internal();
            } catch {
                // Best effort shutdown after failed startup health checks.
            }

            this._set_state('crashed');
            this.raise('crashed', {
                timestamp: Date.now(),
                restartCount: this.restart_count,
                error: startup_health_error.message
            });
            throw startup_health_error;
        }

        this.start_timestamp = Date.now();
        this._set_state('running');

        this._start_runtime_timers();

        return this.status;
    }

    _start_runtime_timers() {
        this._stop_runtime_timers();

        const runtime_interval_ms = this.health_check
            ? this.health_interval_ms
            : default_health_interval_ms;

        if (this.health_check) {
            this._health_timer = setInterval(() => {
                this._run_health_check().catch((error) => {
                    this.raise('health_check', {
                        healthy: false,
                        latencyMs: null,
                        error: to_error_message(error),
                        timestamp: Date.now()
                    });
                });
            }, runtime_interval_ms);
            this._health_timer.unref?.();
        }

        this._memory_timer = setInterval(() => {
            this._update_memory_usage().catch(() => {
                // Ignore periodic metric errors.
            });
        }, runtime_interval_ms);
        this._memory_timer.unref?.();
    }

    _stop_runtime_timers() {
        if (this._health_timer) {
            clearInterval(this._health_timer);
            this._health_timer = null;
        }
        if (this._memory_timer) {
            clearInterval(this._memory_timer);
            this._memory_timer = null;
        }
    }

    async _start_direct_process() {
        if (!this.command) {
            throw new Error('Process_Resource requires `command` when processManager is direct.');
        }

        const merged_env = {
            ...process.env,
            ...this.env
        };

        const child_process = spawn(this.command, this.args, {
            cwd: this.cwd || process.cwd(),
            env: merged_env,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        this.child_process = child_process;
        this.pid = child_process.pid || null;
        this._stdout_remainder = '';
        this._stderr_remainder = '';

        this._create_exit_waiter();

        this._bind_stream_line_events(child_process.stdout, 'stdout', '_stdout_remainder');
        this._bind_stream_line_events(child_process.stderr, 'stderr', '_stderr_remainder');

        child_process.once('error', (error) => {
            this.raise('stderr', {
                line: `spawn_error: ${to_error_message(error)}`,
                pid: this.pid,
                timestamp: Date.now()
            });
        });

        child_process.once('exit', (code, signal) => {
            this.raise('exit', {
                code,
                signal,
                timestamp: Date.now()
            });
            this._resolve_exit_waiter({ code, signal });
            this._handle_process_exit(code, signal).catch(() => {
                // Exit handling errors should not crash the server.
            });
        });

        await this._sleep(20);
    }

    async _start_pm2_process() {
        const pm2_command = this._resolve_pm2_command();

        if (!this.name) {
            throw new Error('Process_Resource using PM2 requires a resource name.');
        }

        let pm2_args;
        if (this.process_manager.ecosystem) {
            pm2_args = ['start', this.process_manager.ecosystem, '--only', this.name];
        } else {
            if (!this.command) {
                throw new Error('Process_Resource PM2 mode requires `command` or `ecosystem`.');
            }
            pm2_args = ['start', this.command, '--name', this.name];
            if (this.cwd) {
                pm2_args.push('--cwd', this.cwd);
            }
            if (this.args.length > 0) {
                pm2_args.push('--', ...this.args);
            }
        }

        await this._run_exec_file(pm2_command, pm2_args, {
            env: {
                ...process.env,
                ...this.env
            },
            cwd: this.cwd || process.cwd()
        });

        await this._refresh_pm2_status();
    }

    async _wait_for_initial_health() {
        if (!this.health_check) {
            return true;
        }

        const deadline_timestamp = Date.now() + this.startup_health_timeout_ms;
        while (Date.now() < deadline_timestamp) {
            const health_result = await this._run_health_check();
            if (health_result.healthy) {
                return true;
            }
            await this._sleep(this.startup_health_retry_interval_ms);
        }

        return false;
    }

    async _handle_process_exit(exit_code, signal) {
        this._stop_runtime_timers();

        const exit_was_expected = this._manual_stop_requested || this.state === 'stopping';

        this.child_process = null;
        this.pid = null;
        this.start_timestamp = null;

        if (exit_was_expected) {
            this._manual_stop_requested = false;
            this._set_state('stopped');
            return;
        }

        if (exit_code === 0) {
            this._set_state('stopped');
            return;
        }

        if (this.auto_restart) {
            this._schedule_auto_restart();
            return;
        }

        this._set_state('crashed');
        this.raise('crashed', {
            code: exit_code,
            signal,
            restartCount: this.restart_count,
            timestamp: Date.now()
        });
    }

    _schedule_auto_restart() {
        this.restart_count += 1;

        if (this.restart_count > this.max_restarts) {
            this._set_state('crashed');
            this.raise('crashed', {
                restartCount: this.restart_count,
                maxRestarts: this.max_restarts,
                timestamp: Date.now()
            });
            return;
        }

        const delay_ms = Math.min(
            this.restart_backoff_base_ms * (2 ** Math.max(0, this.restart_count - 1)),
            max_restart_backoff_ms
        );

        this._set_state('restarting');
        this._pending_restart_timer = setTimeout(() => {
            this._pending_restart_timer = null;
            this._enqueue_operation(() => this._start_internal({ manual_start: false })).catch((error) => {
                this._set_state('crashed');
                this.raise('crashed', {
                    restartCount: this.restart_count,
                    error: to_error_message(error),
                    timestamp: Date.now()
                });
            });
        }, delay_ms);
        this._pending_restart_timer.unref?.();
    }

    async _run_health_check() {
        const started_at = Date.now();

        let health_result;
        try {
            health_result = await this._perform_health_probe();
        } catch (error) {
            health_result = {
                healthy: false,
                error: to_error_message(error)
            };
        }

        const latency_ms = Date.now() - started_at;
        const normalized_result = {
            healthy: !!health_result.healthy,
            latencyMs: latency_ms,
            timestamp: Date.now()
        };

        if (health_result.error) {
            normalized_result.error = to_error_message(health_result.error);
        }
        if (health_result.statusCode !== undefined) {
            normalized_result.statusCode = health_result.statusCode;
        }

        this.last_health_check = normalized_result;
        this.raise('health_check', normalized_result);

        if (normalized_result.healthy) {
            this.consecutive_health_failures = 0;
            this._unhealthy_raised = false;
        } else {
            this.consecutive_health_failures += 1;
            if (!this._unhealthy_raised && this.consecutive_health_failures >= this.health_failures_before_unhealthy) {
                this._unhealthy_raised = true;
                this.raise('unhealthy', {
                    consecutiveFailures: this.consecutive_health_failures,
                    lastHealthCheck: normalized_result,
                    timestamp: Date.now()
                });
            }
        }

        return normalized_result;
    }

    async _perform_health_probe() {
        if (!this.health_check) {
            return { healthy: true };
        }

        const health_type = String(this.health_check.type || 'http').toLowerCase();
        if (health_type === 'http') {
            return this._perform_http_health_probe();
        }
        if (health_type === 'tcp') {
            return this._perform_tcp_health_probe();
        }
        if (health_type === 'custom') {
            return this._perform_custom_health_probe();
        }

        throw new Error(`Unsupported healthCheck.type: ${this.health_check.type}`);
    }

    _perform_http_health_probe() {
        return new Promise((resolve) => {
            if (!this.health_check?.url) {
                resolve({ healthy: false, error: 'healthCheck.url is required for HTTP health checks.' });
                return;
            }

            let parsed_url;
            try {
                parsed_url = new URL(this.health_check.url);
            } catch (error) {
                resolve({ healthy: false, error: to_error_message(error) });
                return;
            }

            const request_module = parsed_url.protocol === 'https:' ? https : http;
            const request = request_module.request({
                method: 'GET',
                protocol: parsed_url.protocol,
                hostname: parsed_url.hostname,
                port: parsed_url.port || (parsed_url.protocol === 'https:' ? 443 : 80),
                path: `${parsed_url.pathname || '/'}${parsed_url.search || ''}`,
                timeout: this.health_timeout_ms
            }, (response) => {
                const healthy = response.statusCode === 200;
                response.resume();
                resolve({
                    healthy,
                    statusCode: response.statusCode
                });
            });

            request.once('timeout', () => {
                request.destroy(new Error('HTTP health check timeout'));
            });

            request.once('error', (error) => {
                resolve({ healthy: false, error: to_error_message(error) });
            });

            request.end();
        });
    }

    _perform_tcp_health_probe() {
        return new Promise((resolve) => {
            const tcp_host = this.health_check.host || '127.0.0.1';
            const tcp_port = Number(this.health_check.port);
            if (!Number.isFinite(tcp_port)) {
                resolve({ healthy: false, error: 'healthCheck.port is required for TCP health checks.' });
                return;
            }

            const socket = lib_net.createConnection({
                host: tcp_host,
                port: tcp_port
            });

            const cleanup = () => {
                socket.removeAllListeners('connect');
                socket.removeAllListeners('timeout');
                socket.removeAllListeners('error');
                socket.end();
                socket.destroy();
            };

            socket.setTimeout(this.health_timeout_ms);
            socket.once('connect', () => {
                cleanup();
                resolve({ healthy: true });
            });
            socket.once('timeout', () => {
                cleanup();
                resolve({ healthy: false, error: 'TCP health check timeout' });
            });
            socket.once('error', (error) => {
                cleanup();
                resolve({ healthy: false, error: to_error_message(error) });
            });
        });
    }

    async _perform_custom_health_probe() {
        const custom_fn = this.health_check.fn || this.health_check.custom;
        if (typeof custom_fn !== 'function') {
            throw new Error('healthCheck.fn (or healthCheck.custom) must be a function for custom checks.');
        }

        const probe_result = await custom_fn(this);
        if (typeof probe_result === 'boolean') {
            return { healthy: probe_result };
        }

        if (probe_result && typeof probe_result === 'object') {
            return {
                healthy: !!probe_result.healthy,
                ...probe_result
            };
        }

        return { healthy: !!probe_result };
    }

    async _update_memory_usage() {
        if (this.process_manager.type === 'pm2') {
            await this._refresh_pm2_status();
            return;
        }

        if (!this.pid) {
            this.memory_usage = null;
            return;
        }

        this.memory_usage = await this._read_direct_process_memory_usage(this.pid);
    }

    async _read_direct_process_memory_usage(pid) {
        if (process.platform === 'win32') {
            return this._read_windows_memory_usage(pid);
        }
        return this._read_unix_memory_usage(pid);
    }

    async _read_unix_memory_usage(pid) {
        try {
            const { stdout } = await this._run_exec_file('ps', ['-o', 'rss=', '-p', String(pid)]);
            const rss_kb = Number.parseInt(String(stdout || '').trim(), 10);
            if (!Number.isFinite(rss_kb)) {
                return null;
            }
            return {
                rssBytes: rss_kb * 1024,
                source: 'ps',
                timestamp: Date.now()
            };
        } catch {
            return null;
        }
    }

    async _read_windows_memory_usage(pid) {
        try {
            const { stdout } = await this._run_exec_file('tasklist', ['/FI', `PID eq ${pid}`, '/FO', 'CSV', '/NH']);
            const first_line = String(stdout || '').trim().split(/\r?\n/)[0] || '';
            if (!first_line || first_line.startsWith('INFO:')) {
                return null;
            }
            const csv_columns = first_line.replace(/^"|"$/g, '').split('","');
            const memory_column = csv_columns[4] || '';
            const normalized_memory = Number.parseInt(memory_column.replace(/[^\d]/g, ''), 10);
            if (!Number.isFinite(normalized_memory)) {
                return null;
            }
            return {
                rssBytes: normalized_memory * 1024,
                source: 'tasklist',
                timestamp: Date.now()
            };
        } catch {
            return null;
        }
    }

    _map_pm2_status_to_resource_state(pm2_status) {
        const normalized_pm2_status = String(pm2_status || '').toLowerCase();
        if (pm2_online_statuses.has(normalized_pm2_status)) {
            return 'running';
        }
        if (normalized_pm2_status === 'stopped') {
            return 'stopped';
        }
        if (normalized_pm2_status === 'errored') {
            return 'crashed';
        }
        if (normalized_pm2_status === 'stopping') {
            return 'stopping';
        }
        if (normalized_pm2_status === 'launching') {
            return 'starting';
        }
        return this.state;
    }

    async _read_pm2_process_info() {
        const pm2_command = this._resolve_pm2_command();
        const { stdout } = await this._run_exec_file(pm2_command, ['jlist'], {
            env: {
                ...process.env,
                ...this.env
            },
            cwd: this.cwd || process.cwd()
        });

        const parsed = JSON.parse(String(stdout || '[]'));
        if (!Array.isArray(parsed)) {
            return null;
        }

        const found = parsed.find((item) => item && item.name === this.name);
        return found || null;
    }

    async _refresh_pm2_status() {
        try {
            const pm2_process_info = await this._read_pm2_process_info();
            if (!pm2_process_info) {
                this.pid = null;
                this.memory_usage = null;
                return;
            }

            const next_pid = Number.isFinite(pm2_process_info.pid) ? pm2_process_info.pid : null;
            this.pid = next_pid;

            if (pm2_process_info.monit && typeof pm2_process_info.monit === 'object') {
                this.memory_usage = {
                    rssBytes: Number(pm2_process_info.monit.memory) || null,
                    cpuPercent: Number(pm2_process_info.monit.cpu) || null,
                    source: 'pm2',
                    timestamp: Date.now()
                };
            }

            const pm2_status = pm2_process_info.pm2_env && pm2_process_info.pm2_env.status;
            const mapped_state = this._map_pm2_status_to_resource_state(pm2_status);
            if (mapped_state && mapped_state !== this.state && this.state !== 'stopping' && this.state !== 'restarting') {
                this._set_state(mapped_state);
            }
        } catch {
            // Ignore PM2 status refresh errors during periodic updates.
        }
    }

    async _stop_direct_process() {
        if (!this.child_process) {
            this.pid = null;
            this.start_timestamp = null;
            return;
        }

        const child_process = this.child_process;
        const exit_promise = this._current_exit_promise;

        try {
            child_process.kill('SIGTERM');
        } catch {
            // Ignore signal delivery errors.
        }

        let did_exit = await this._wait_for_exit(exit_promise, this.stop_timeout_ms);
        if (!did_exit) {
            try {
                child_process.kill('SIGKILL');
            } catch {
                // Ignore signal delivery errors.
            }
            did_exit = await this._wait_for_exit(this._current_exit_promise, this.kill_timeout_ms);
        }

        if (!did_exit) {
            this.child_process = null;
            this.pid = null;
            this.start_timestamp = null;
        }
    }

    async _stop_pm2_process() {
        const pm2_command = this._resolve_pm2_command();
        await this._run_exec_file(pm2_command, ['stop', this.name], {
            env: {
                ...process.env,
                ...this.env
            },
            cwd: this.cwd || process.cwd()
        });

        this.pid = null;
        this.start_timestamp = null;
    }

    async _stop_internal() {
        this._clear_pending_restart_timer();
        this._stop_runtime_timers();

        if (this.state === 'stopped') {
            return this.status;
        }

        this._manual_stop_requested = true;
        this._set_state('stopping');

        if (this.process_manager.type === 'pm2') {
            await this._stop_pm2_process();
            this._manual_stop_requested = false;
        } else {
            await this._stop_direct_process();
            if (!this.child_process && !this._current_exit_promise) {
                this._manual_stop_requested = false;
            }
        }

        this.start_timestamp = null;
        this.memory_usage = null;
        this._set_state('stopped');
        return this.status;
    }

    start(callback) {
        const operation_promise = this._enqueue_operation(() => this._start_internal({ manual_start: true }));
        return this._resolve_with_optional_callback(operation_promise, callback);
    }

    stop(callback) {
        const operation_promise = this._enqueue_operation(() => this._stop_internal());

        return this._resolve_with_optional_callback(operation_promise, callback);
    }

    restart(callback) {
        const operation_promise = this._enqueue_operation(async () => {
            this._set_state('restarting');
            await this._stop_internal();
            return this._start_internal({ manual_start: true });
        });

        return this._resolve_with_optional_callback(operation_promise, callback);
    }

    get status() {
        const uptime = this.start_timestamp ? Math.max(0, Date.now() - this.start_timestamp) : 0;

        return {
            state: this.state,
            pid: this.pid,
            uptime,
            restartCount: this.restart_count,
            lastHealthCheck: this.last_health_check,
            memoryUsage: this.memory_usage,
            processManager: {
                type: this.process_manager.type
            }
        };
    }

    get_abstract() {
        const status_snapshot = this.status;
        return {
            name: this.name,
            state: status_snapshot.state,
            pid: status_snapshot.pid,
            uptime: status_snapshot.uptime,
            restartCount: status_snapshot.restartCount
        };
    }
}

module.exports = Process_Resource;
