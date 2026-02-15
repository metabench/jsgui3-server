'use strict';

const crypto = require('crypto');

class Admin_Auth_Service {
    constructor(spec = {}) {
        this.user_store = spec.user_store;
        this.session_ttl_ms = Number.isFinite(spec.session_ttl_ms) ? spec.session_ttl_ms : (8 * 60 * 60 * 1000);
        this.cookie_name = spec.cookie_name || 'jsgui_admin_v1_sid';
        this.sessions = new Map();
    }

    _read_json_body(req) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', () => {
                if (chunks.length === 0) return resolve({});
                try {
                    const text = Buffer.concat(chunks).toString('utf8');
                    resolve(text ? JSON.parse(text) : {});
                } catch (error) {
                    reject(error);
                }
            });
            req.on('error', reject);
        });
    }

    _parse_cookies(req) {
        const cookies = {};
        const header = req && req.headers ? req.headers.cookie : '';
        if (!header) return cookies;

        const parts = header.split(';');
        parts.forEach((part) => {
            const idx = part.indexOf('=');
            if (idx === -1) return;
            const key = part.slice(0, idx).trim();
            const value = part.slice(idx + 1).trim();
            cookies[key] = decodeURIComponent(value);
        });
        return cookies;
    }

    _set_session_cookie(res, session_id) {
        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        const cookie_value = this.cookie_name + '=' + encodeURIComponent(session_id) + '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' + Math.floor(this.session_ttl_ms / 1000) + secure;
        res.setHeader('Set-Cookie', cookie_value);
    }

    _clear_session_cookie(res) {
        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        res.setHeader('Set-Cookie', this.cookie_name + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0' + secure);
    }

    _new_session_id() {
        return crypto.randomBytes(24).toString('hex');
    }

    _cleanup_expired() {
        const now = Date.now();
        for (const [id, session] of this.sessions.entries()) {
            if (!session || session.expires_at <= now) {
                this.sessions.delete(id);
            }
        }
    }

    get_session(req) {
        this._cleanup_expired();
        const cookies = this._parse_cookies(req);
        const sid = cookies[this.cookie_name];
        if (!sid) return null;

        const session = this.sessions.get(sid);
        if (!session) return null;
        if (session.expires_at <= Date.now()) {
            this.sessions.delete(sid);
            return null;
        }
        return {
            session_id: sid,
            user: session.user,
            expires_at: session.expires_at
        };
    }

    is_authenticated(req) {
        return !!this.get_session(req);
    }

    has_role(req, role_name) {
        const session = this.get_session(req);
        if (!session || !session.user) return false;
        const roles = Array.isArray(session.user.roles) ? session.user.roles : [];
        return roles.includes(role_name);
    }

    has_any_role(req, role_names) {
        const session = this.get_session(req);
        if (!session || !session.user) return false;
        const roles = Array.isArray(session.user.roles) ? session.user.roles : [];
        if (!Array.isArray(role_names) || role_names.length === 0) return false;
        return role_names.some((role_name) => roles.includes(role_name));
    }

    create_session(user, res) {
        const session_id = this._new_session_id();
        const expires_at = Date.now() + this.session_ttl_ms;
        this.sessions.set(session_id, {
            user,
            created_at: Date.now(),
            expires_at
        });
        this._set_session_cookie(res, session_id);
        return { session_id, expires_at, user };
    }

    destroy_session(req, res) {
        const cookies = this._parse_cookies(req);
        const sid = cookies[this.cookie_name];
        if (sid) this.sessions.delete(sid);
        this._clear_session_cookie(res);
    }

    async handle_login(req, res) {
        if (String(req.method || 'GET').toUpperCase() !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
            return;
        }

        let body;
        try {
            body = await this._read_json_body(req);
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Invalid JSON body' }));
            return;
        }

        const username = body.username;
        const password = body.password;
        const user = this.user_store.verify_credentials(username, password);
        if (!user) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Invalid credentials' }));
            return;
        }

        const session = this.create_session(user, res);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ok: true,
            user: session.user,
            expires_at: session.expires_at
        }));
    }

    handle_logout(req, res) {
        if (String(req.method || 'GET').toUpperCase() !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
            return;
        }

        this.destroy_session(req, res);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
    }

    handle_session(req, res) {
        if (String(req.method || 'GET').toUpperCase() !== 'GET') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
            return;
        }

        const session = this.get_session(req);
        if (!session) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, authenticated: false }));
            return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            ok: true,
            authenticated: true,
            user: session.user,
            expires_at: session.expires_at
        }));
    }
}

module.exports = Admin_Auth_Service;
