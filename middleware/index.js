'use strict';

/**
 * jsgui3-server built-in middleware.
 *
 * @example
 * const { compression } = require('jsgui3-server/middleware');
 * server.use(compression());
 */

const compression = require('./compression');

module.exports = {
    compression
};
