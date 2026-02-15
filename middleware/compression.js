'use strict';

const zlib = require('zlib');

/**
 * Regex matching compressible MIME base types.
 * Covers JSON, HTML, plain text, CSS, JS, XML, and SVG.
 */
const COMPRESSIBLE_RE = /^(?:text\/(?:html|plain|css|xml|javascript|csv)|application\/(?:json|javascript|x-javascript|xml|xhtml\+xml|manifest\+json)|image\/svg\+xml)/i;

/**
 * Negotiate the best encoding the client accepts.
 * Prefer gzip (fast) > deflate > br (slower but better ratio).
 *
 * @param {string} accept  The Accept-Encoding header value.
 * @returns {string|null}  Chosen encoding token or null.
 */
const negotiate_encoding = (accept) => {
    if (!accept) return null;
    if (accept.includes('gzip'))    return 'gzip';
    if (accept.includes('deflate')) return 'deflate';
    if (accept.includes('br'))     return 'br';
    return null;
};

/**
 * Create a response-compression middleware.
 *
 * Buffers the response body and compresses it when:
 *   1. The client sends an `Accept-Encoding` header the server supports.
 *   2. The response `Content-Type` is compressible (text, JSON, etc.).
 *   3. The body size meets or exceeds the `threshold` (default 1 024 bytes).
 *
 * Streaming responses (where `res.write()` is called before `res.end()`)
 * are passed through uncompressed to avoid breaking SSE or chunked streams.
 *
 * @param {Object} [options]
 * @param {number} [options.threshold=1024]  Minimum body size (bytes) to compress.
 * @param {number} [options.level]           zlib compression level (default: Z_DEFAULT_COMPRESSION).
 * @returns {function(req, res, next): void} Middleware function.
 *
 * @example
 * const compression = require('./middleware/compression');
 * server.use(compression());                   // defaults
 * server.use(compression({ threshold: 512 })); // compress smaller bodies
 */
function create_compression_middleware(options = {}) {
    const threshold = options.threshold !== undefined ? options.threshold : 1024;
    const level     = options.level     !== undefined ? options.level     : zlib.constants.Z_DEFAULT_COMPRESSION;

    /**
     * Pick the right zlib helper for the negotiated encoding.
     */
    const make_compressor = (encoding_token) => {
        switch (encoding_token) {
            case 'gzip':    return (buf, cb) => zlib.gzip(buf, { level }, cb);
            case 'deflate': return (buf, cb) => zlib.deflate(buf, { level }, cb);
            case 'br':      return (buf, cb) => zlib.brotliCompress(buf, cb);
            default:        return null;
        }
    };

    return function compression_middleware(req, res, next) {
        // ── 1. Negotiate encoding ────────────────────────────────
        const accept   = req.headers['accept-encoding'] || '';
        const encoding = negotiate_encoding(accept);
        if (!encoding) return next();

        const compress = make_compressor(encoding);
        if (!compress) return next();

        // ── 2. Save original response methods ────────────────────
        const _writeHead = res.writeHead;
        const _end       = res.end;
        const _write     = res.write;

        let write_head_called  = false;
        let buffered_status    = 200;
        let buffered_headers   = {};
        let streaming          = false;

        // ── 3. Intercept writeHead ───────────────────────────────
        res.writeHead = function (status, reason, headers) {
            if (typeof reason === 'string') {
                // writeHead(status, statusMessage, headers)
                buffered_status  = status;
                buffered_headers = headers || {};
            } else {
                // writeHead(status, headers)
                buffered_status  = status;
                buffered_headers = reason || {};
            }
            write_head_called = true;
            return res;
        };

        // ── 4. Detect streaming writes ───────────────────────────
        res.write = function (chunk, enc, cb) {
            if (!streaming) {
                streaming = true;
                // Flush buffered writeHead so the stream can proceed
                if (write_head_called) {
                    _writeHead.call(res, buffered_status, buffered_headers);
                    write_head_called = false;
                }
            }
            return _write.apply(res, arguments);
        };

        // ── 5. Intercept end — buffer, decide, compress ─────────
        res.end = function (chunk, enc, cb) {
            // Normalise arguments
            if (typeof chunk === 'function') { cb = chunk; chunk = null; enc = null; }
            if (typeof enc   === 'function') { cb = enc;   enc = null; }

            // If streaming was already started, just pass through
            if (streaming) {
                return _end.apply(res, arguments);
            }

            // Build body buffer
            const body = chunk
                ? (Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), enc || 'utf8'))
                : Buffer.alloc(0);

            // ── Resolve content-type ─────────────────────────────
            let content_type = '';
            if (write_head_called && buffered_headers) {
                const keys = Object.keys(buffered_headers);
                for (let i = 0; i < keys.length; i++) {
                    if (keys[i].toLowerCase() === 'content-type') {
                        content_type = buffered_headers[keys[i]];
                        break;
                    }
                }
            }
            if (!content_type && typeof res.getHeader === 'function') {
                content_type = res.getHeader('content-type') || '';
            }
            const base_type = content_type.split(';')[0].trim();

            // ── Decide whether to compress ───────────────────────
            const already_encoded = (write_head_called && buffered_headers)
                ? Object.keys(buffered_headers).some(k => k.toLowerCase() === 'content-encoding')
                : (typeof res.getHeader === 'function' && !!res.getHeader('content-encoding'));

            if (body.length < threshold || !COMPRESSIBLE_RE.test(base_type) || already_encoded) {
                // Pass through uncompressed
                if (write_head_called) _writeHead.call(res, buffered_status, buffered_headers);
                return _end.call(res, body, cb);
            }

            // ── Compress ─────────────────────────────────────────
            compress(body, (err, compressed) => {
                if (err) {
                    // Fallback: send uncompressed
                    if (write_head_called) _writeHead.call(res, buffered_status, buffered_headers);
                    _end.call(res, body, cb);
                    return;
                }

                if (write_head_called) {
                    // Replace/add compression headers in the buffered object
                    buffered_headers['Content-Encoding'] = encoding;
                    buffered_headers['Content-Length']    = compressed.length;

                    // Ensure Vary includes Accept-Encoding
                    const vary = find_header(buffered_headers, 'vary');
                    if (!vary) {
                        buffered_headers['Vary'] = 'Accept-Encoding';
                    } else if (!vary.toLowerCase().includes('accept-encoding')) {
                        set_header(buffered_headers, 'Vary', vary + ', Accept-Encoding');
                    }

                    _writeHead.call(res, buffered_status, buffered_headers);
                } else {
                    // setHeader path (statusCode + setHeader style)
                    if (typeof res.removeHeader === 'function') res.removeHeader('Content-Length');
                    res.setHeader('Content-Encoding', encoding);
                    res.setHeader('Content-Length', compressed.length);
                    const existing_vary = res.getHeader('Vary') || res.getHeader('vary') || '';
                    if (!existing_vary) {
                        res.setHeader('Vary', 'Accept-Encoding');
                    } else if (!existing_vary.toLowerCase().includes('accept-encoding')) {
                        res.setHeader('Vary', existing_vary + ', Accept-Encoding');
                    }
                }

                _end.call(res, compressed, cb);
            });
        };

        next();
    };
}

// ── Header helpers (case-insensitive lookup in a plain object) ────
function find_header(headers, name) {
    const lower = name.toLowerCase();
    for (const k of Object.keys(headers)) {
        if (k.toLowerCase() === lower) return headers[k];
    }
    return undefined;
}

function set_header(headers, name, value) {
    const lower = name.toLowerCase();
    for (const k of Object.keys(headers)) {
        if (k.toLowerCase() === lower) {
            headers[k] = value;
            return;
        }
    }
    headers[name] = value;
}

module.exports = create_compression_middleware;
