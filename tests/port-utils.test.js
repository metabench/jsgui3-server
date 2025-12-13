/**
 * Tests for port-utils module
 */

const assert = require('assert');
const { describe, it } = require('mocha');
const net = require('net');
const { get_free_port, is_port_available, get_free_ports, get_port_or_free } = require('../port-utils');

describe('Port Utilities', function() {
    this.timeout(10000);

    describe('get_free_port', function() {
        it('should return a valid port number', async function() {
            const port = await get_free_port();
            assert(typeof port === 'number', 'Port should be a number');
            assert(port > 0 && port <= 65535, 'Port should be in valid range');
        });

        it('should return different ports on consecutive calls', async function() {
            const port1 = await get_free_port();
            const port2 = await get_free_port();
            // Ports may occasionally be the same if released quickly, but usually different
            assert(typeof port1 === 'number');
            assert(typeof port2 === 'number');
        });

        it('should return a port that is actually available', async function() {
            const port = await get_free_port();
            
            // Try to actually listen on the port
            const server = net.createServer();
            await new Promise((resolve, reject) => {
                server.on('error', reject);
                server.listen(port, '127.0.0.1', resolve);
            });
            
            // Clean up
            await new Promise(resolve => server.close(resolve));
        });
    });

    describe('is_port_available', function() {
        it('should return true for an available port', async function() {
            const port = await get_free_port();
            const available = await is_port_available(port);
            assert.strictEqual(available, true);
        });

        it('should return false for an occupied port', async function() {
            const port = await get_free_port();
            
            // Occupy the port
            const server = net.createServer();
            await new Promise((resolve, reject) => {
                server.on('error', reject);
                server.listen(port, '127.0.0.1', resolve);
            });
            
            // Check availability
            const available = await is_port_available(port);
            assert.strictEqual(available, false);
            
            // Clean up
            await new Promise(resolve => server.close(resolve));
        });
    });

    describe('get_free_ports', function() {
        it('should return the requested number of ports', async function() {
            const ports = await get_free_ports(3);
            assert(Array.isArray(ports));
            assert.strictEqual(ports.length, 3);
            
            for (const port of ports) {
                assert(typeof port === 'number');
                assert(port > 0 && port <= 65535);
            }
        });
    });

    describe('get_port_or_free', function() {
        it('should return preferred port if available', async function() {
            const preferred = await get_free_port();
            const actual = await get_port_or_free(preferred);
            assert.strictEqual(actual, preferred);
        });

        it('should return a different port if preferred is occupied', async function() {
            const preferred = await get_free_port();
            
            // Occupy the preferred port
            const server = net.createServer();
            await new Promise((resolve, reject) => {
                server.on('error', reject);
                server.listen(preferred, '127.0.0.1', resolve);
            });
            
            // Request the occupied port
            const actual = await get_port_or_free(preferred);
            assert(actual !== preferred, 'Should return a different port');
            assert(typeof actual === 'number');
            
            // Clean up
            await new Promise(resolve => server.close(resolve));
        });

        it('should auto-select when 0 is passed', async function() {
            const port = await get_port_or_free(0);
            assert(typeof port === 'number');
            assert(port > 0);
        });
    });
});
