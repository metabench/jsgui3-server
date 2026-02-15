'use strict';

/**
 * Format a byte count into a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
function format_bytes(bytes) {
    if (bytes === 0 || bytes === null || bytes === undefined) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1024));
    const index = Math.min(i, units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return (index > 0 ? value.toFixed(1) : Math.round(value)) + ' ' + units[index];
}

/**
 * Format seconds into a human-readable uptime string.
 * @param {number} seconds
 * @returns {string}
 */
function format_uptime(seconds) {
    if (seconds === null || seconds === undefined || seconds < 0) return '—';
    seconds = Math.floor(seconds);
    if (seconds < 60) return seconds + 's';

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return days + 'd ' + hours + 'h';
    if (hours > 0) return hours + 'h ' + minutes + 'm';
    return minutes + 'm ' + secs + 's';
}

/**
 * Format a timestamp into HH:MM:SS.
 * @param {number} timestamp - Unix milliseconds
 * @returns {string}
 */
function format_time(timestamp) {
    if (!timestamp) return '--:--:--';
    const d = new Date(timestamp);
    const pad = (n) => String(n).padStart(2, '0');
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

/**
 * Format a timestamp into a relative human-readable string.
 * @param {number} timestamp - Unix milliseconds
 * @returns {string}
 */
function format_relative_time(timestamp) {
    if (!timestamp) return '—';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff / 60000) + ' minutes ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + ' hours ago';
    return new Date(timestamp).toLocaleString();
}

module.exports = {
    format_bytes,
    format_uptime,
    format_time,
    format_relative_time
};
