'use strict';

const crypto = require('crypto');

class Admin_User_Store {
    constructor(spec = {}) {
        this._users = new Map();
        this._scrypt_cost = spec.scrypt_cost || 16384;
    }

    _hash_password(password, salt) {
        const key = crypto.scryptSync(password, salt, 64, { N: this._scrypt_cost });
        return key.toString('hex');
    }

    add_user(spec = {}) {
        const username = String(spec.username || '').trim();
        const password = String(spec.password || '');
        const roles = Array.isArray(spec.roles) ? spec.roles : ['admin_read'];

        if (!username) throw new Error('username is required');
        if (!password) throw new Error('password is required');

        const salt = crypto.randomBytes(16).toString('hex');
        const password_hash = this._hash_password(password, salt);

        this._users.set(username, {
            username,
            salt,
            password_hash,
            roles,
            created_at: Date.now()
        });

        return { username, roles: roles.slice() };
    }

    has_user(username) {
        return this._users.has(username);
    }

    get_user(username) {
        const user = this._users.get(username);
        if (!user) return null;
        return {
            username: user.username,
            roles: user.roles.slice(),
            created_at: user.created_at
        };
    }

    verify_credentials(username, password) {
        const user = this._users.get(String(username || ''));
        if (!user) return null;

        const attempted_hash = this._hash_password(String(password || ''), user.salt);
        const expected = Buffer.from(user.password_hash, 'hex');
        const attempted = Buffer.from(attempted_hash, 'hex');

        if (expected.length !== attempted.length) return null;
        const ok = crypto.timingSafeEqual(expected, attempted);
        if (!ok) return null;

        return {
            username: user.username,
            roles: user.roles.slice()
        };
    }
}

module.exports = Admin_User_Store;
