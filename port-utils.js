/**
 * Port utilities for jsgui3-server
 * Provides automatic free port detection and port management
 */

const net = require('net');

/**
 * Find a free port on the specified host
 * @param {Object} options - Options for port selection
 * @param {string} [options.host='127.0.0.1'] - Host to check
 * @param {number} [options.startPort=8080] - Starting port to try (0 = let OS choose)
 * @param {number} [options.endPort=65535] - Maximum port to try
 * @returns {Promise<number>} - A free port number
 */
function get_free_port(options = {}) {
    const host = options.host || '127.0.0.1';
    const start_port = options.startPort || options.start_port || 0;
    
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE' && start_port > 0) {
                // Try next port if specific port was requested
                get_free_port({ ...options, startPort: start_port + 1 })
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(err);
            }
        });
        
        server.listen(start_port, host, () => {
            const { port } = server.address();
            server.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(port);
                }
            });
        });
    });
}

/**
 * Check if a specific port is available
 * @param {number} port - Port to check
 * @param {string} [host='127.0.0.1'] - Host to check
 * @returns {Promise<boolean>} - True if port is available
 */
function is_port_available(port, host = '127.0.0.1') {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.on('error', () => {
            resolve(false);
        });
        
        server.listen(port, host, () => {
            server.close(() => {
                resolve(true);
            });
        });
    });
}

/**
 * Find multiple free ports
 * @param {number} count - Number of ports to find
 * @param {Object} options - Options for port selection
 * @returns {Promise<number[]>} - Array of free port numbers
 */
async function get_free_ports(count, options = {}) {
    const ports = [];
    for (let i = 0; i < count; i++) {
        const port = await get_free_port(options);
        ports.push(port);
    }
    return ports;
}

/**
 * Get a free port, preferring a specific port if available
 * @param {number} preferred_port - Preferred port (0 = auto-select)
 * @param {string} [host='127.0.0.1'] - Host to check
 * @returns {Promise<number>} - The preferred port if available, or a free port
 */
async function get_port_or_free(preferred_port, host = '127.0.0.1') {
    // If 0 or undefined, always auto-select
    if (!preferred_port || preferred_port === 0) {
        return get_free_port({ host });
    }
    
    // Check if preferred port is available
    const available = await is_port_available(preferred_port, host);
    if (available) {
        return preferred_port;
    }
    
    // Fall back to auto-select
    console.log(`Port ${preferred_port} is in use, selecting a free port...`);
    return get_free_port({ host });
}

module.exports = {
    get_free_port,
    is_port_available,
    get_free_ports,
    get_port_or_free
};
