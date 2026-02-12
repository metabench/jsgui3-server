const HTTP_Publisher = require('./http-publisher');

const default_keepalive_interval_ms = 15000;
const default_event_history_size = 200;

const to_data_string = (data_value) => {
    if (data_value === undefined) {
        return '';
    }
    if (typeof data_value === 'string') {
        return data_value;
    }
    try {
        return JSON.stringify(data_value);
    } catch (error) {
        return JSON.stringify({
            error: 'non_serializable',
            message: error instanceof Error ? error.message : String(error)
        });
    }
};

class HTTP_SSE_Publisher extends HTTP_Publisher {
    constructor(spec = {}) {
        super(spec);

        this.name = spec.name || this.name || 'events';
        this.keepalive_interval_ms = Number.isFinite(spec.keepaliveIntervalMs)
            ? Number(spec.keepaliveIntervalMs)
            : default_keepalive_interval_ms;
        this.max_clients = Number.isFinite(spec.maxClients)
            ? Number(spec.maxClients)
            : Number.POSITIVE_INFINITY;
        this.event_history_size = Number.isInteger(spec.eventHistorySize)
            ? spec.eventHistorySize
            : default_event_history_size;

        this.clients = new Map();
        this.event_history = [];
        this.next_event_id = 0;

        this._keepalive_timer = null;
    }

    get client_count() {
        return this.clients.size;
    }

    _generate_client_id() {
        return `sse_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
    }

    _parse_connection_url(req) {
        const host_header = req.headers.host || 'localhost';
        return new URL(req.url || '/', `http://${host_header}`);
    }

    _extract_last_event_id(req, parsed_url) {
        const query_value = parsed_url.searchParams.get('lastEventId')
            || parsed_url.searchParams.get('last_event_id');
        const header_value = req.headers['last-event-id'];
        const raw_value = query_value || header_value;

        if (raw_value === undefined || raw_value === null || raw_value === '') {
            return null;
        }

        const parsed_value = Number.parseInt(String(raw_value), 10);
        if (!Number.isFinite(parsed_value)) {
            return null;
        }
        return parsed_value;
    }

    _ensure_keepalive_timer() {
        if (this._keepalive_timer || !Number.isFinite(this.keepalive_interval_ms) || this.keepalive_interval_ms <= 0) {
            return;
        }

        this._keepalive_timer = setInterval(() => {
            this._broadcast_comment('keepalive');
        }, this.keepalive_interval_ms);
        this._keepalive_timer.unref?.();
    }

    _maybe_stop_keepalive_timer() {
        if (this._keepalive_timer && this.clients.size === 0) {
            clearInterval(this._keepalive_timer);
            this._keepalive_timer = null;
        }
    }

    _write_to_client(client_id, payload_text) {
        const client_entry = this.clients.get(client_id);
        if (!client_entry) {
            return false;
        }

        const { res } = client_entry;
        if (!res || res.destroyed || res.writableEnded) {
            this._disconnect_client(client_id, 'write_failed');
            return false;
        }

        try {
            res.write(payload_text);
            return true;
        } catch {
            this._disconnect_client(client_id, 'write_failed');
            return false;
        }
    }

    _format_event_payload(event_name, data_value, event_id) {
        const payload_lines = [];
        if (event_id !== undefined && event_id !== null) {
            payload_lines.push(`id: ${event_id}`);
        }

        if (event_name) {
            payload_lines.push(`event: ${event_name}`);
        }

        const data_text = to_data_string(data_value);
        const data_lines = data_text.split(/\r?\n/);
        if (data_lines.length === 0) {
            payload_lines.push('data:');
        } else {
            for (const line of data_lines) {
                payload_lines.push(`data: ${line}`);
            }
        }

        payload_lines.push('');
        payload_lines.push('');
        return payload_lines.join('\n');
    }

    _record_event(event_record) {
        this.event_history.push(event_record);
        while (this.event_history.length > this.event_history_size) {
            this.event_history.shift();
        }
    }

    _broadcast_comment(comment_text) {
        const payload = `:${comment_text}\n\n`;
        const client_ids = Array.from(this.clients.keys());
        for (const client_id of client_ids) {
            this._write_to_client(client_id, payload);
        }
    }

    _send_event_to_clients(client_ids, event_name, data_value) {
        const event_id = ++this.next_event_id;
        const payload_text = this._format_event_payload(event_name, data_value, event_id);

        const delivered_client_ids = [];
        for (const client_id of client_ids) {
            const did_write = this._write_to_client(client_id, payload_text);
            if (did_write) {
                const client_entry = this.clients.get(client_id);
                if (client_entry) {
                    client_entry.last_event_id = event_id;
                }
                delivered_client_ids.push(client_id);
            }
        }

        this._record_event({
            id: event_id,
            event: event_name,
            data: data_value,
            timestamp: Date.now()
        });

        return {
            eventId: event_id,
            deliveredClientIds: delivered_client_ids
        };
    }

    _replay_events_since(client_id, last_event_id) {
        if (last_event_id === null) {
            return;
        }

        const replay_candidates = this.event_history.filter((entry) => entry.id > last_event_id);
        for (const replay_event of replay_candidates) {
            const payload_text = this._format_event_payload(replay_event.event, replay_event.data, replay_event.id);
            const did_write = this._write_to_client(client_id, payload_text);
            if (!did_write) {
                break;
            }
        }
    }

    _disconnect_client(client_id, reason = 'disconnect') {
        const client_entry = this.clients.get(client_id);
        if (!client_entry) {
            return;
        }

        this.clients.delete(client_id);
        const { req, res } = client_entry;

        if (req) {
            req.removeAllListeners('close');
        }

        try {
            if (res && !res.writableEnded) {
                res.end();
            }
        } catch {
            // Ignore disconnect write errors.
        }

        this.raise('client_disconnected', {
            clientId: client_id,
            reason,
            timestamp: Date.now(),
            connectedClients: this.client_count
        });

        this._maybe_stop_keepalive_timer();
    }

    handle_http(req, res) {
        const request_method = String(req.method || 'GET').toUpperCase();
        if (request_method !== 'GET') {
            res.writeHead(405, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
                ok: false,
                error: 'Method Not Allowed'
            }));
            return;
        }

        if (this.client_count >= this.max_clients) {
            res.writeHead(503, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({
                ok: false,
                error: 'SSE client limit reached'
            }));
            return;
        }

        const parsed_url = this._parse_connection_url(req);
        const requested_client_id = parsed_url.searchParams.get('clientId') || parsed_url.searchParams.get('client_id');
        const client_id = requested_client_id || this._generate_client_id();
        const last_event_id = this._extract_last_event_id(req, parsed_url);

        if (this.clients.has(client_id)) {
            this._disconnect_client(client_id, 'replaced');
        }

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Transfer-Encoding': 'chunked',
            'X-Accel-Buffering': 'no'
        });

        res.write(`retry: 3000\n`);
        res.write(':connected\n\n');

        this.clients.set(client_id, {
            client_id,
            req,
            res,
            connected_at: Date.now(),
            last_event_id
        });

        this._ensure_keepalive_timer();

        this.raise('client_connected', {
            clientId: client_id,
            lastEventId: last_event_id,
            timestamp: Date.now(),
            connectedClients: this.client_count
        });

        this._replay_events_since(client_id, last_event_id);

        const disconnect_handler = () => {
            this._disconnect_client(client_id, 'closed');
        };

        req.on('close', disconnect_handler);
        res.on('close', disconnect_handler);
        res.on('finish', disconnect_handler);
    }

    broadcast(event_name, data_value) {
        const target_client_ids = Array.from(this.clients.keys());
        return this._send_event_to_clients(target_client_ids, event_name, data_value);
    }

    send(client_id, event_name, data_value) {
        if (!this.clients.has(client_id)) {
            return {
                eventId: null,
                deliveredClientIds: []
            };
        }

        return this._send_event_to_clients([client_id], event_name, data_value);
    }

    stop(callback) {
        const stop_promise = new Promise((resolve) => {
            if (this._keepalive_timer) {
                clearInterval(this._keepalive_timer);
                this._keepalive_timer = null;
            }

            const connected_client_ids = Array.from(this.clients.keys());
            for (const client_id of connected_client_ids) {
                this._disconnect_client(client_id, 'stopped');
            }

            resolve(true);
        });

        if (typeof callback === 'function') {
            stop_promise.then(() => callback(null, true), callback);
            return;
        }

        return stop_promise;
    }
}

module.exports = HTTP_SSE_Publisher;
