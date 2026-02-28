/**
 * Run all lab experiments in sequence.
 *
 * Usage: node labs/website-design/run-all.js
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const experiments = [
    '001-base-class-overhead',
    '002-pages-storage',
    '003-type-detection',
    '004-two-stage-validation',
    '005-normalize-input',
    '006-serve-website-spike',
];

console.log('═══════════════════════════════════════════');
console.log('  Website Design Lab — Running All Checks');
console.log('═══════════════════════════════════════════\n');

let totalPass = 0, totalFail = 0;

for (const exp of experiments) {
    const script = path.join(__dirname, exp, 'check.js');
    const result = spawnSync('node', [script], {
        encoding: 'utf8',
        cwd: path.resolve(__dirname, '../..'),
        timeout: 30000
    });

    const output = result.stdout || '';
    const resultLine = output.split('\n').find(l => l.includes('RESULTS:'));
    const match = resultLine ? resultLine.match(/(\d+) passed, (\d+) failed/) : null;

    const passed = match ? parseInt(match[1]) : 0;
    const failed = match ? parseInt(match[2]) : 1;

    totalPass += passed;
    totalFail += failed;

    const icon = failed === 0 ? '✅' : '❌';
    console.log(`${icon} ${exp}: ${passed} passed, ${failed} failed`);
}

console.log('\n═══════════════════════════════════════════');
console.log(`TOTAL: ${totalPass} passed, ${totalFail} failed`);

if (totalFail === 0) {
    console.log('\n✅ ALL EXPERIMENTS PASSED');
    console.log('   All design book recommendations confirmed by evidence.');
} else {
    console.log(`\n❌ ${totalFail} CHECKS FAILED — review individual experiments`);
}
console.log('═══════════════════════════════════════════\n');

process.exit(totalFail > 0 ? 1 : 0);
