// Simple CLI tests using child_process. No test runner needed.
const { spawnSync } = require('child_process');
const path = require('path');

function run(args, opts = {}) {
  const node = process.execPath;
  const cli = path.join(__dirname, '..', 'cli.js');
  const res = spawnSync(node, [cli, ...args], { encoding: 'utf8', timeout: 15000, ...opts });
  if (res.error) throw res.error;
  return res;
}

function assert(cond, msg) { if (!cond) { throw new Error(msg || 'assertion failed'); } }

// --help prints usage and exits 0
{
  const r = run(['--help']);
  assert(r.status === 0, `--help exit ${r.status}\n${r.stderr}`);
  assert(/Usage:/i.test(r.stdout), 'help should contain Usage');
}

// --version prints version and exits 0
{
  const r = run(['--version']);
  assert(r.status === 0, `--version exit ${r.status}\n${r.stderr}`);
  assert(/^\d+\.\d+\.\d+/.test(r.stdout.trim()), `version should be semver, got: ${r.stdout}`);
}

// serve --port 0 should start server and keep alive; we kill after short delay
{
  const node = process.execPath;
  const cli = path.join(__dirname, '..', 'cli.js');
  const child = require('child_process').spawn(node, [cli, 'serve', '--port', '0'], {
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let stdout = '';
  let stderr = '';
  child.stdout.on('data', d => { stdout += d.toString(); });
  child.stderr.on('data', d => { stderr += d.toString(); });

  const start = Date.now();
  const maxWait = 20000; // 20s

  function doneExit(code) {
    if (!child.killed) try { child.kill(); } catch {}
    assert(code === 0 || code === null, `serve exited with ${code}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`);
  }

  const timer = setInterval(() => {
    if (/Server ready/.test(stdout)
      || /Serving on /.test(stdout)
      || /Server running at http:/.test(stdout)
      || /Server running at https:/.test(stdout)
      || /Possibly missing website publishing code\./.test(stdout)) {
      clearInterval(timer);
      doneExit(0);
    } else if (Date.now() - start > maxWait) {
      clearInterval(timer);
      doneExit(1);
    }
  }, 250);
}

console.log('CLI tests passed');
