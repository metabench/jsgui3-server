/**
 * check.js - Verify that all text renders properly in the Observable SSE Demo control
 * 
 * This script instantiates the control server-side and checks that all expected
 * text content is present in the rendered HTML output. No server required.
 * 
 * Run with: node check.js
 */

const jsgui = require('./client');
const {Observable_Demo_UI} = jsgui.controls;

// Create a server-side page context for rendering
const Server_Page_Context = require('../../../page-context');
const context = new Server_Page_Context();

console.log('Observable SSE Demo - Text Rendering Check');
console.log('='.repeat(50));
console.log('');

// Instantiate the control (no spec.el, so compose() will run)
const demo_ui = new Observable_Demo_UI({
    context: context
});

// Render to HTML
const html = demo_ui.all_html_render();

// Define all expected text content
const expected_texts = [
    // Header
    { text: 'Observable SSE Demo - Real-Time Tick Stream', description: 'Page title (h2)' },
    
    // Status section
    { text: 'Status: Not connected', description: 'Initial status text' },
    
    // Tick display
    { text: '--', description: 'Initial tick count placeholder' },
    { text: 'Server Ticks', description: 'Tick label' },
    
    // Event log label
    { text: 'Event Log (SSE messages):', description: 'Log section label' },
    
    // Buttons
    { text: 'Connect to SSE', description: 'Connect button text' },
    { text: 'Disconnect', description: 'Disconnect button text' },
    { text: 'Clear Log', description: 'Clear Log button text' },
];

// Check each expected text
let pass_count = 0;
let fail_count = 0;

console.log('Checking rendered HTML for expected text content:');
console.log('');

for (const {text, description} of expected_texts) {
    const found = html.includes(text);
    const status = found ? '✓ PASS' : '✗ FAIL';
    const color = found ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`  ${color}${status}${reset}  "${text}"`);
    console.log(`         └─ ${description}`);
    
    if (found) {
        pass_count++;
    } else {
        fail_count++;
    }
}

console.log('');
console.log('-'.repeat(50));
console.log(`Results: ${pass_count} passed, ${fail_count} failed`);
console.log('');

// Also check for important HTML structure
console.log('Additional structural checks:');
console.log('');

const structural_checks = [
    { pattern: 'id="status-label"', description: 'Status label has ID' },
    { pattern: 'id="tick-count"', description: 'Tick count has ID' },
    { pattern: 'id="event-log"', description: 'Event log has ID' },
    { pattern: 'id="connect-btn"', description: 'Connect button has ID' },
    { pattern: 'id="disconnect-btn"', description: 'Disconnect button has ID' },
    { pattern: 'id="clear-btn"', description: 'Clear button has ID' },
    { pattern: '<button', description: 'Button elements present' },
    { pattern: '<h2', description: 'H2 heading present' },
    { pattern: 'class="sse-container"', description: 'SSE container class' },
    { pattern: 'class="tick-display"', description: 'Tick display class' },
    { pattern: 'class="button-container"', description: 'Button container class' },
];

let struct_pass = 0;
let struct_fail = 0;

for (const {pattern, description} of structural_checks) {
    const found = html.includes(pattern);
    const status = found ? '✓ PASS' : '✗ FAIL';
    const color = found ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';
    
    console.log(`  ${color}${status}${reset}  ${pattern}`);
    console.log(`         └─ ${description}`);
    
    if (found) {
        struct_pass++;
    } else {
        struct_fail++;
    }
}

console.log('');
console.log('-'.repeat(50));
console.log(`Structural: ${struct_pass} passed, ${struct_fail} failed`);
console.log('');

// Final summary
const total_pass = pass_count + struct_pass;
const total_fail = fail_count + struct_fail;
const total = total_pass + total_fail;

console.log('='.repeat(50));
if (total_fail === 0) {
    console.log('\x1b[32m✓ ALL CHECKS PASSED\x1b[0m');
    console.log(`  ${total_pass}/${total} checks successful`);
} else {
    console.log('\x1b[31m✗ SOME CHECKS FAILED\x1b[0m');
    console.log(`  ${total_pass}/${total} checks passed, ${total_fail} failed`);
}
console.log('='.repeat(50));

// Optionally output the full HTML for debugging
if (process.argv.includes('--html') || process.argv.includes('-h')) {
    console.log('');
    console.log('Rendered HTML:');
    console.log('-'.repeat(50));
    console.log(html);
}

// Exit with appropriate code
process.exit(total_fail > 0 ? 1 : 0);
