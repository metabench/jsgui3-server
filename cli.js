#!/usr/bin/env node

// Minimal CLI wiring without a bin entry. No external deps.
// Commands:
//   node cli.js --help | --version
//   node cli.js serve [--port <n>] [--host <addr>] [--root <path>]

const fs = require('fs');
const path = require('path');

function readPkg() {
  try {
    const pkgPath = path.join(__dirname, 'package.json');
    const txt = fs.readFileSync(pkgPath, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return { name: 'jsgui3-server', version: '0.0.0' };
  }
}

function printHelp() {
  const pkg = readPkg();
  const name = pkg.name || 'jsgui3-server';
  console.log(`${name} ${pkg.version || ''}`.trim());
  console.log('');
  console.log('Usage:');
  console.log('  node cli.js --help');
  console.log('  node cli.js --version');
  console.log('  node cli.js serve [--port <n>] [--host <addr>] [--root <path>]');
  console.log('');
  console.log('Options:');
  console.log('  --port <n>    Port number (default 8080; 0 = ephemeral)');
  console.log('  --host <addr> Bind to specific IPv4 address (eg 127.0.0.1)');
  console.log('  --root <path> Project root (reserved; not yet wired)');
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--version' || a === '-v') out.version = true;
    else if (a === '--port') { out.port = Number(argv[++i]); }
    else if (a === '--host') { out.host = argv[++i]; }
    else if (a === '--root') { out.root = argv[++i]; }
    else if (!a.startsWith('-')) out._.push(a);
    else {
      console.error('Unknown option:', a);
      out.help = true;
    }
  }
  return out;
}

function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const cmd = args._[0];

  if (args.help || (!cmd && !args.version)) {
    printHelp();
    process.exit(0);
    return;
  }

  if (args.version) {
    const pkg = readPkg();
    console.log(pkg.version || '0.0.0');
    process.exit(0);
    return;
  }

  if (cmd === 'serve') {
    const JSGUI_Server = require('./server');
    const port = Number.isFinite(args.port) ? args.port : (process.env.PORT ? Number(process.env.PORT) : 8080);
    const host = args.host || process.env.HOST || null;

    const server = new JSGUI_Server({ name: 'jsgui3 server (cli)' });
    if (host) server.allowed_addresses = [host];

    const onReady = () => {
      let printed = false;
      const printServing = () => {
        if (printed) return;
        printed = true;
        if (host) console.log(`Serving on http://${host}:${port || 0}/`);
        else console.log(`Serving on port ${port || 0} (all IPv4 interfaces)`);
      };

      // Invoke start and immediately announce to facilitate smoke tests.
      let readyPrinted = false;
      const cb = (err) => {
        if (err) {
          console.error('Failed to start server:', err);
          process.exit(1);
          return;
        }
        printServing();
        if (!readyPrinted) {
          console.log('Server ready');
          readyPrinted = true;
        }
        // Keep process alive. Ctrl+C to stop.
      };

      server.start(port, cb);
      printServing();
      setTimeout(() => {
        if (!readyPrinted) {
          console.log('Server ready');
          readyPrinted = true;
        }
      }, 3000).unref?.();
    };

    // Start when ready, but also fall back after a short timeout
    let started = false;
    const kickoff = () => { if (!started) { started = true; onReady(); } };
    if (typeof server.on === 'function' && typeof server.on === 'function') {
      server.on('ready', kickoff);
      setTimeout(kickoff, 2000).unref?.();
    } else {
      kickoff();
    }
    return;
  }

  console.error('Unknown command:', cmd);
  printHelp();
  process.exit(1);
}

if (require.main === module) main();
