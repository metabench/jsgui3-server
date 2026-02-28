/**
 * JSON body parser middleware for jsgui3-server.
 *
 * Parses `application/json` request bodies and attaches the result to
 * `req.body`.  Designed for use with raw `(req, res)` handlers registered
 * via `server.publish(name, fn, { raw: true })`.
 *
 * Function-wrapped routes (`HTTP_Function_Publisher`) already parse the
 * body internally — this middleware is only needed for raw routes that
 * receive POST/PUT/PATCH with JSON payloads.
 *
 * ### Usage
 *
 * ```js
 * // As global middleware (all routes):
 * const json_body = require('jsgui3-server/middleware/json-body');
 * server.use(json_body());
 *
 * // With options:
 * server.use(json_body({ limit: 1024 * 1024 })); // 1MB limit
 * ```
 *
 * ### Options
 *
 * | Option   | Type     | Default    | Description                              |
 * |----------|----------|------------|------------------------------------------|
 * | `limit`  | number   | `5242880`  | Max body size in bytes (default 5MB)     |
 * | `strict` | boolean  | `true`     | Only parse `application/json` content-type. When `false`, always attempt JSON parse. |
 *
 * ### Behaviour
 *
 * - **GET/HEAD/DELETE** (no body expected): calls `next()` immediately.
 * - **No Content-Type or non-JSON**: skips parsing, calls `next()` (unless `strict: false`).
 * - **Empty body**: sets `req.body = null`, calls `next()`.
 * - **Valid JSON**: sets `req.body` to the parsed object/array/value.
 * - **Invalid JSON**: responds with `400 Bad Request` and a JSON error.
 * - **Body exceeds limit**: responds with `413 Payload Too Large`.
 * - **Already parsed** (`req.body` already set): skips, calls `next()`.
 *
 * @module middleware/json-body
 * @param {Object} [options={}] - Parser options.
 * @returns {Function} Express-style `(req, res, next)` middleware.
 */

'use strict';

const DEFAULT_LIMIT = 5 * 1024 * 1024; // 5MB

const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD', 'DELETE', 'OPTIONS']);

/**
 * Create a JSON body parser middleware.
 *
 * @param {Object} [options={}]
 * @param {number} [options.limit=5242880] - Max body size in bytes.
 * @param {boolean} [options.strict=true] - Only parse application/json.
 * @returns {Function} Middleware `(req, res, next)`.
 */
const json_body = (options = {}) => {
    const limit = options.limit || DEFAULT_LIMIT;
    const strict = options.strict !== false;

    return (req, res, next) => {
        // Skip methods that shouldn't have a body.
        if (METHODS_WITHOUT_BODY.has(req.method)) {
            return next();
        }

        // Skip if body already parsed by another middleware.
        if (req.body !== undefined) {
            return next();
        }

        // Check content-type in strict mode.
        const content_type = req.headers['content-type'] || '';
        if (strict && !content_type.startsWith('application/json')) {
            return next();
        }

        const chunks = [];
        let size = 0;
        let too_large = false;

        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > limit) {
                too_large = true;
                // Stop collecting chunks but let the stream drain naturally.
            } else {
                chunks.push(chunk);
            }
        });

        req.on('end', () => {
            if (too_large) {
                if (!res.headersSent) {
                    res.writeHead(413, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Payload Too Large', limit }));
                }
                return;
            }

            const raw = Buffer.concat(chunks).toString('utf-8');

            if (raw.trim() === '') {
                req.body = null;
                return next();
            }

            try {
                req.body = JSON.parse(raw);
                next();
            } catch (err) {
                if (!res.headersSent) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Invalid JSON',
                        message: err.message
                    }));
                }
            }
        });
    };
};

module.exports = json_body;
