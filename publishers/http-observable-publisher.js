const HTTP_Publisher = require('./http-publisher');

const default_keep_alive_interval_ms = 15000;

// Want to do this over websockets too.
//  Should be a single ws point.
//   Could give out connection keys alongside the HTTP request.
//    All the security needed - give out a 256 bit key in the HTML doc, require it to open the websocket connection.
//     Seems simple, would work with a single process auth provider, then could have centralised auth and token issuance and checking.

class Observable_Publisher extends HTTP_Publisher {
    constructor(spec = {}) {
        super(spec);

        let obs;
        if (spec && spec.obs) {
            obs = spec.obs;
            if (spec.schema) this.schema = spec.schema;
        } else {
            obs = spec;
        }

        if (!obs || typeof obs.on !== 'function') {
            throw new Error('No observable found.');
        }

        this.type = 'observable';
        this.obs = obs;

        this.keep_alive_interval_ms = (spec && spec.keep_alive_interval_ms !== undefined)
            ? spec.keep_alive_interval_ms
            : default_keep_alive_interval_ms;

        this.is_paused = (typeof obs.status === 'string' && obs.status === 'paused');

        this.active_sse_connections = new Set();
        this._keep_alive_timer = null;

        this._source_handlers_bound = false;
        this._bind_source_handlers();
    }

    _bind_source_handlers() {
        if (this._source_handlers_bound) return;
        this._source_handlers_bound = true;

        const { obs } = this;

        this._source_next_handler = (data) => {
            if (this.is_paused) return;
            this._broadcast_sse_data(data);
        };

        this._source_complete_handler = (data) => {
            this._broadcast_sse_event('complete', data);
            this._close_all_sse_connections();
        };

        this._source_error_handler = (err) => {
            this._broadcast_sse_event('error', this._normalize_error(err));
            this._close_all_sse_connections();
        };

        this._source_paused_handler = () => {
            this.is_paused = true;
            this._broadcast_sse_event('paused', { status: 'paused' });
        };

        this._source_resumed_handler = () => {
            this.is_paused = false;
            this._broadcast_sse_event('resumed', { status: 'ok' });
        };

        obs.on('next', this._source_next_handler);
        obs.on('complete', this._source_complete_handler);
        obs.on('error', this._source_error_handler);
        obs.on('paused', this._source_paused_handler);
        obs.on('resumed', this._source_resumed_handler);
    }

    _unbind_source_handlers() {
        if (!this._source_handlers_bound) return;
        this._source_handlers_bound = false;

        const { obs } = this;
        const safe_off = (event_name, handler) => {
            if (typeof obs.off === 'function' && handler) {
                obs.off(event_name, handler);
            }
        };

        safe_off('next', this._source_next_handler);
        safe_off('complete', this._source_complete_handler);
        safe_off('error', this._source_error_handler);
        safe_off('paused', this._source_paused_handler);
        safe_off('resumed', this._source_resumed_handler);

        this._source_next_handler = null;
        this._source_complete_handler = null;
        this._source_error_handler = null;
        this._source_paused_handler = null;
        this._source_resumed_handler = null;
    }

    _normalize_error(err) {
        if (!err) return { message: 'Unknown error' };
        if (typeof err === 'string') return { message: err };
        if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack };
        return { message: String(err) };
    }

    _stringify_sse_data(data) {
        if (data === undefined) return '';
        if (typeof data === 'string') return data;
        try {
            return JSON.stringify(data);
        } catch (err) {
            return JSON.stringify({
                error: 'non_serializable',
                message: this._normalize_error(err).message
            });
        }
    }

    _write_sse(res, s) {
        try {
            res.write(s);
            return true;
        } catch (e) {
            return false;
        }
    }

    _broadcast_raw_sse(s) {
        const arr_connections = Array.from(this.active_sse_connections);
        for (const res of arr_connections) {
            if (res.destroyed || res.writableEnded) {
                this.active_sse_connections.delete(res);
                continue;
            }
            const ok = this._write_sse(res, s);
            if (!ok || res.destroyed || res.writableEnded) {
                this.active_sse_connections.delete(res);
            }
        }
        this._maybe_stop_keep_alive_timer();
    }

    _broadcast_sse_data(data) {
        const s_data = this._stringify_sse_data(data);
        this._broadcast_raw_sse(`data: ${s_data}\n\n`);
    }

    _broadcast_sse_event(event_name, data) {
        const s_data = this._stringify_sse_data(data);
        this._broadcast_raw_sse(`event: ${event_name}\ndata: ${s_data}\n\n`);
    }

    _close_all_sse_connections() {
        const arr_connections = Array.from(this.active_sse_connections);
        this.active_sse_connections.clear();
        for (const res of arr_connections) {
            try {
                if (!res.writableEnded) res.end();
            } catch (e) { }
        }
        this._maybe_stop_keep_alive_timer();
    }

    _ensure_keep_alive_timer() {
        if (!this.keep_alive_interval_ms) return;
        if (this._keep_alive_timer) return;

        this._keep_alive_timer = setInterval(() => {
            this._broadcast_raw_sse(`: keep-alive ${Date.now()}\n\n`);
        }, this.keep_alive_interval_ms);

        if (typeof this._keep_alive_timer.unref === 'function') {
            this._keep_alive_timer.unref();
        }
    }

    _maybe_stop_keep_alive_timer() {
        if (this._keep_alive_timer && this.active_sse_connections.size === 0) {
            clearInterval(this._keep_alive_timer);
            this._keep_alive_timer = null;
        }
    }

    pause() {
        this.is_paused = true;
        if (this.obs && typeof this.obs.pause === 'function') {
            this.obs.pause();
        } else {
            this._broadcast_sse_event('paused', { status: 'paused' });
        }
    }

    resume() {
        this.is_paused = false;
        if (this.obs && typeof this.obs.resume === 'function') {
            this.obs.resume();
        } else {
            this._broadcast_sse_event('resumed', { status: 'ok' });
        }
    }

    stop() {
        if (this.obs && typeof this.obs.stop === 'function') {
            this.obs.stop();
        }
        this._broadcast_sse_event('stopped', { status: 'stopped' });
        this._close_all_sse_connections();
        this._unbind_source_handlers();
    }

    _handle_http_control(req, res) {
        const chunks = [];

        req.on('data', chunk => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            const content_type = (req.headers['content-type'] || '').toLowerCase();
            const body = Buffer.concat(chunks).toString();

            let action = '';
            if (content_type.includes('application/json')) {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    action = parsed.action || parsed.command || parsed.cmd || '';
                } catch (e) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: false, error: 'Invalid JSON body' }));
                    return;
                }
            } else {
                action = body.trim();
            }

            const action_lc = String(action || 'status').toLowerCase();

            if (action_lc === 'pause') this.pause();
            else if (action_lc === 'resume') this.resume();
            else if (action_lc === 'stop') this.stop();
            else if (action_lc !== 'status') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'Unknown action', action: action_lc }));
                return;
            }

            const obs_status = (this.obs && typeof this.obs.status === 'string')
                ? this.obs.status
                : (this.is_paused ? 'paused' : 'ok');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                ok: true,
                action: action_lc,
                status: obs_status,
                connections: this.active_sse_connections.size
            }));
        });

        req.on('error', (err) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: this._normalize_error(err) }));
        });
    }

    handle_http(req, res) {
        const method = String(req.method || 'GET').toUpperCase();

        if (method === 'POST') {
            this._handle_http_control(req, res);
            return;
        }

        if (method !== 'GET') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
            return;
        }

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Transfer-Encoding': 'chunked',
            'X-Accel-Buffering': 'no'
        });

        // SSE handshake (consumed by client demo; ignored by tests).
        this._write_sse(res, 'data: OK\n\n');

        this.active_sse_connections.add(res);
        this._ensure_keep_alive_timer();

        if (this.is_paused) {
            this._write_sse(res, `event: paused\ndata: ${this._stringify_sse_data({ status: 'paused' })}\n\n`);
        }

        let removed = false;
        const remove_connection = () => {
            if (removed) return;
            removed = true;
            this.active_sse_connections.delete(res);
            this._maybe_stop_keep_alive_timer();
        };

        req.on('close', remove_connection);
        res.on('close', remove_connection);
        res.on('finish', remove_connection);
    }
}

module.exports = Observable_Publisher;
