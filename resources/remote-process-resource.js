const { Resource } = require('jsgui3-html');
const http = require('http');
const https = require('https');

const default_poll_interval_ms = 30000;
const default_http_timeout_ms = 6000;
const default_history_size = 100;
const default_unreachable_failures_before_event = 3;

const to_error_message = (error_value) => {
    if (!error_value) return null;
    if (typeof error_value === 'string') return error_value;
    if (error_value instanceof Error) return error_value.message;
    return String(error_value);
};

class Remote_Process_Resource extends Resource {
    constructor(spec = {}) {
        super(spec);

        this.host = spec.host || '127.0.0.1';
        this.port = Number(spec.port) || 80;
        this.protocol = String(spec.protocol || 'http').toLowerCase();
        this.poll_interval_ms = Number.isFinite(spec.pollIntervalMs)
            ? Number(spec.pollIntervalMs)
            : default_poll_interval_ms;
        this.http_timeout_ms = Number.isFinite(spec.httpTimeoutMs)
            ? Number(spec.httpTimeoutMs)
            : default_http_timeout_ms;

        this.endpoints = {
            status: '/',
            start: '/api/start',
            stop: '/api/stop',
            health: '/api/health',
            ...(spec.endpoints || {})
        };

        this.history_size = Number.isInteger(spec.historySize)
            ? spec.historySize
            : default_history_size;
        this.unreachable_failures_before_event = Number.isInteger(spec.unreachableFailuresBeforeEvent)
            ? spec.unreachableFailuresBeforeEvent
            : default_unreachable_failures_before_event;

        this.state = 'stopped';
        this.last_polled_status = null;
        this.last_polled_at = null;
        this.consecutive_failures = 0;
        this.history = [];

        this._poll_timer = null;
        this._unreachable_raised = false;
        this._operation_promise = Promise.resolve();
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

    _enqueue_operation(operation_fn) {
        const next_promise = this._operation_promise.then(() => operation_fn());
        this._operation_promise = next_promise.catch(() => {
            // Keep the operation chain alive.
        });
        return next_promise;
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

    _normalize_path(endpoint_path) {
        if (!endpoint_path) return '/';
        if (endpoint_path.startsWith('/')) return endpoint_path;
        return `/${endpoint_path}`;
    }

    _request_json(method, endpoint_path, body) {
        return new Promise((resolve, reject) => {
            const request_module = this.protocol === 'https' ? https : http;
            const normalized_path = this._normalize_path(endpoint_path);

            const request_options = {
                method,
                host: this.host,
                port: this.port,
                path: normalized_path,
                timeout: this.http_timeout_ms,
                headers: {
                    'Accept': 'application/json'
                }
            };

            let request_payload = null;
            if (body !== undefined) {
                request_payload = Buffer.from(JSON.stringify(body), 'utf8');
                request_options.headers['Content-Type'] = 'application/json';
                request_options.headers['Content-Length'] = request_payload.length;
            }

            const request = request_module.request(request_options, (response) => {
                const response_chunks = [];
                response.on('data', (chunk) => response_chunks.push(chunk));
                response.on('end', () => {
                    const raw_body = Buffer.concat(response_chunks).toString('utf8');
                    let parsed_body = null;
                    if (raw_body.length > 0) {
                        try {
                            parsed_body = JSON.parse(raw_body);
                        } catch {
                            parsed_body = raw_body;
                        }
                    }

                    const response_result = {
                        statusCode: response.statusCode,
                        headers: response.headers,
                        body: parsed_body,
                        rawBody: raw_body
                    };

                    if (response.statusCode >= 400) {
                        const error = new Error(`Remote process request failed with status ${response.statusCode}`);
                        error.response = response_result;
                        reject(error);
                        return;
                    }

                    resolve(response_result);
                });
            });

            request.once('timeout', () => {
                request.destroy(new Error(`Request timed out after ${this.http_timeout_ms}ms`));
            });
            request.once('error', reject);

            if (request_payload) {
                request.write(request_payload);
            }
            request.end();
        });
    }

    _extract_state_from_payload(status_payload) {
        if (!status_payload || typeof status_payload !== 'object') {
            return null;
        }

        if (typeof status_payload.state === 'string') {
            return status_payload.state;
        }

        if (typeof status_payload.status === 'string') {
            return status_payload.status;
        }

        if (typeof status_payload.running === 'boolean') {
            return status_payload.running ? 'running' : 'stopped';
        }

        return null;
    }

    _record_snapshot(snapshot) {
        this.history.push(snapshot);
        while (this.history.length > this.history_size) {
            this.history.shift();
        }
    }

    _start_polling() {
        if (this._poll_timer) {
            return;
        }

        this._poll_timer = setInterval(() => {
            this._poll_status_once().catch(() => {
                // Poll failures are handled within _poll_status_once.
            });
        }, this.poll_interval_ms);
        this._poll_timer.unref?.();
    }

    _stop_polling() {
        if (this._poll_timer) {
            clearInterval(this._poll_timer);
            this._poll_timer = null;
        }
    }

    async _poll_status_once() {
        try {
            const response = await this._request_json('GET', this.endpoints.status);
            const status_payload = response.body && typeof response.body === 'object'
                ? response.body
                : { raw: response.body };

            const inferred_state = this._extract_state_from_payload(status_payload) || this.state;
            const now_timestamp = Date.now();

            this.last_polled_status = status_payload;
            this.last_polled_at = now_timestamp;
            this.consecutive_failures = 0;

            this._record_snapshot({
                timestamp: now_timestamp,
                status: status_payload,
                state: inferred_state,
                reachable: true
            });

            if (this.state === 'unreachable') {
                this.raise('recovered', {
                    timestamp: now_timestamp,
                    status: status_payload
                });
            }
            this._unreachable_raised = false;
            this._set_state(inferred_state);

            return this.status;
        } catch (error) {
            const now_timestamp = Date.now();
            this.consecutive_failures += 1;
            this.last_polled_at = now_timestamp;

            this._record_snapshot({
                timestamp: now_timestamp,
                reachable: false,
                error: to_error_message(error)
            });

            if (this.state !== 'unreachable') {
                this._set_state('unreachable');
            }

            if (!this._unreachable_raised && this.consecutive_failures >= this.unreachable_failures_before_event) {
                this._unreachable_raised = true;
                this.raise('unreachable', {
                    timestamp: now_timestamp,
                    consecutiveFailures: this.consecutive_failures,
                    error: to_error_message(error)
                });
            }

            throw error;
        }
    }

    async _post_control(endpoint_key, payload) {
        const endpoint_path = this.endpoints[endpoint_key];
        if (!endpoint_path) {
            throw new Error(`Missing endpoint configuration for ${endpoint_key}`);
        }

        const response = await this._request_json('POST', endpoint_path, payload);
        return response.body;
    }

    start(callback) {
        const operation_promise = this._enqueue_operation(async () => {
            await this._post_control('start');
            this._start_polling();
            await this._poll_status_once();
            return this.status;
        });
        return this._resolve_with_optional_callback(operation_promise, callback);
    }

    stop(callback) {
        const operation_promise = this._enqueue_operation(async () => {
            try {
                await this._post_control('stop');
            } finally {
                this._stop_polling();
            }

            this._set_state('stopped');
            return this.status;
        });
        return this._resolve_with_optional_callback(operation_promise, callback);
    }

    restart(callback) {
        const operation_promise = this._enqueue_operation(async () => {
            await this._post_control('stop');
            await this._post_control('start');
            this._start_polling();
            await this._poll_status_once();
            return this.status;
        });
        return this._resolve_with_optional_callback(operation_promise, callback);
    }

    get status() {
        const remote_status = this.last_polled_status && typeof this.last_polled_status === 'object'
            ? this.last_polled_status
            : {};
        const uptime_value = Number(remote_status.uptime || remote_status.uptimeMs || 0) || 0;
        const restart_count_value = Number(remote_status.restartCount || remote_status.restart_count || 0) || 0;
        const memory_usage_value = remote_status.memoryUsage || remote_status.memory_usage || null;
        const last_health_check_value = remote_status.lastHealthCheck || remote_status.last_health_check || null;
        const pid_value = Number.isFinite(remote_status.pid) ? remote_status.pid : null;

        return {
            state: this.state,
            pid: pid_value,
            uptime: uptime_value,
            restartCount: restart_count_value,
            lastHealthCheck: last_health_check_value,
            memoryUsage: memory_usage_value,
            processManager: {
                type: 'remote'
            },
            host: this.host,
            port: this.port,
            lastPolledAt: this.last_polled_at,
            pollIntervalMs: this.poll_interval_ms,
            httpTimeoutMs: this.http_timeout_ms,
            consecutiveFailures: this.consecutive_failures,
            remote: this.last_polled_status
        };
    }

    get_abstract() {
        return {
            name: this.name,
            state: this.state,
            host: this.host,
            port: this.port,
            consecutiveFailures: this.consecutive_failures,
            lastPolledAt: this.last_polled_at
        };
    }
}

module.exports = Remote_Process_Resource;
