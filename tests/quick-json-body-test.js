const http = require('http');
const net = require('net');
const assert = require('assert');
const json_body = require('../middleware/json-body');

async function run() {
    // Get free port
    const port = await new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.listen(0, '127.0.0.1', () => {
            const p = srv.address().port;
            srv.close(() => resolve(p));
        });
        srv.on('error', reject);
    });

    const mw = json_body({ limit: 1024 });

    const server = http.createServer((req, res) => {
        mw(req, res, () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                method: req.method,
                body: req.body,
                has_body: req.body !== undefined
            }));
        });
    });

    await new Promise(r => server.listen(port, '127.0.0.1', r));
    console.log('Server on port', port);

    const request = (method, path, body) => new Promise((resolve, reject) => {
        const body_str = body ? JSON.stringify(body) : '';
        const headers = body ? {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body_str)
        } : {};
        const req = http.request({
            hostname: '127.0.0.1', port, path, method, headers
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
        });
        req.on('error', reject);
        if (body_str) req.write(body_str);
        req.end();
    });

    // Test 1: POST with JSON body
    console.log('Test 1: POST with JSON body');
    const r1 = await request('POST', '/', { name: 'Alice', age: 30 });
    assert.strictEqual(r1.status, 200);
    assert.deepStrictEqual(r1.data.body, { name: 'Alice', age: 30 });
    console.log('  PASS');

    // Test 2: GET skips body parsing
    console.log('Test 2: GET skips');
    const r2 = await request('GET', '/');
    assert.strictEqual(r2.status, 200);
    assert.strictEqual(r2.data.has_body, false);
    console.log('  PASS');

    // Test 3: 413 Payload Too Large
    console.log('Test 3: 413 Payload Too Large');
    const big = { data: 'x'.repeat(2000) };
    const r3 = await request('POST', '/', big);
    assert.strictEqual(r3.status, 413);
    console.log('  PASS');

    // Test 4: Invalid JSON
    console.log('Test 4: Invalid JSON → 400');
    const r4 = await new Promise((resolve, reject) => {
        const bad = '{not valid json';
        const req = http.request({
            hostname: '127.0.0.1', port, path: '/', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bad) }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(bad);
        req.end();
    });
    assert.strictEqual(r4.status, 400);
    assert.strictEqual(r4.data.error, 'Invalid JSON');
    console.log('  PASS');

    // Test 5: Empty body
    console.log('Test 5: Empty POST body → null');
    const r5 = await new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1', port, path: '/', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': '0' }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.end();
    });
    assert.strictEqual(r5.status, 200);
    assert.strictEqual(r5.data.body, null);
    console.log('  PASS');

    // Test 6: Non-JSON content-type skipped in strict mode
    console.log('Test 6: Non-JSON content-type skipped');
    const r6 = await new Promise((resolve, reject) => {
        const body = 'hello=world';
        const req = http.request({
            hostname: '127.0.0.1', port, path: '/', method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
    assert.strictEqual(r6.status, 200);
    assert.strictEqual(r6.data.has_body, false);
    console.log('  PASS');

    // Test 7: Non-strict mode parses any content-type
    console.log('Test 7: Non-strict mode');
    const port2 = await new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; srv.close(() => resolve(p)); });
    });
    const mw2 = json_body({ strict: false });
    const server2 = http.createServer((req, res) => {
        mw2(req, res, () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ body: req.body }));
        });
    });
    await new Promise(r => server2.listen(port2, '127.0.0.1', r));
    const r7 = await new Promise((resolve, reject) => {
        const body = '{"key":"val"}';
        const req = http.request({
            hostname: '127.0.0.1', port: port2, path: '/', method: 'POST',
            headers: { 'Content-Type': 'text/plain', 'Content-Length': Buffer.byteLength(body) }
        }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
    assert.deepStrictEqual(r7.body, { key: 'val' });
    console.log('  PASS');
    await new Promise(r => server2.close(r));

    await new Promise(r => server.close(r));
    console.log('\nAll 7 tests PASSED!');
}

run().catch(err => {
    console.error('FAILED:', err);
    process.exit(1);
});
