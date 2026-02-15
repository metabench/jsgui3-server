'use strict';

/**
 * Admin UI v1 — client entry point.
 *
 * This file is the ESBuild entry point that the HTTP_Webpage_Publisher
 * bundles and serves. It imports the Admin_Shell control (which
 * transitively pulls in Group_Box and Stat_Card) and exports the
 * jsgui module with Admin_Shell registered on controls.
 */
const jsgui = require('./controls/admin_shell');

// The require above already registers controls.Admin_Shell,
// controls.Stat_Card, and controls.Group_Box on the jsgui
// controls namespace.

module.exports = jsgui;
