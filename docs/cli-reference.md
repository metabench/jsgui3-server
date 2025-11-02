# CLI Reference

## When to Read

This document provides comprehensive reference for the JSGUI3 Server command-line interface. Read this when:
- You need detailed information about CLI commands and options
- You're automating server startup in scripts or CI/CD pipelines
- You want to understand all available CLI configuration options
- You're troubleshooting CLI-related issues
- You need to integrate JSGUI3 Server with other tools

**Note:** For basic usage, see [README.md](../README.md). For programmatic server usage, see [docs/comprehensive-documentation.md](docs/comprehensive-documentation.md).

## Overview

The JSGUI3 Server CLI provides a simple command-line interface for starting and managing servers. It's designed for development, testing, and simple deployment scenarios.

## Command Syntax

```bash
node cli.js [command] [options]
```

## Commands

### serve (Default Command)

Starts a JSGUI3 Server instance with automatic client discovery.

```bash
# Basic usage - auto-discovers client.js
node cli.js serve

# With port specification
node cli.js serve --port 3000

# With host binding
node cli.js serve --host 127.0.0.1 --port 8080

# With root directory override
node cli.js serve --root ./my-app --port 3000
```

**Options:**
- `--port <n>`: Server port number (default: 8080, 0 = ephemeral/random port)
- `--host <addr>`: IPv4 address to bind to (default: all interfaces)
- `--root <path>`: Project root directory (default: current working directory)

### help

Displays help information and available commands.

```bash
node cli.js --help
node cli.js help
```

### version

Displays the version information.

```bash
node cli.js --version
node cli.js version
```

## Environment Variables

The CLI respects the following environment variables:

### PORT
Server port number. Takes precedence over `--port` option.

```bash
PORT=3000 node cli.js serve
```

### HOST
Server host binding. Takes precedence over `--host` option.

```bash
HOST=127.0.0.1 node cli.js serve
```

### JSGUI_DEBUG
Enables debug mode with verbose logging and source maps.

```bash
JSGUI_DEBUG=1 node cli.js serve
```

**Values:**
- `1`, `true`, `yes` → Enable debug mode
- `0`, `false`, `no` → Disable debug mode (default)

## Client Discovery

The CLI automatically discovers client files in the following order:

1. **Explicit path**: If specified in server configuration
2. **Current directory**: `./client.js`
3. **Source directory**: `./src/client.js`
4. **App directory**: `./app/client.js`

## Configuration Resolution

The CLI resolves configuration in this order (later sources override earlier ones):

1. **Default values**: Built-in defaults
2. **Environment variables**: `PORT`, `HOST`, `JSGUI_DEBUG`
3. **Command-line options**: `--port`, `--host`, `--root`
4. **Configuration files**: `jsgui.config.js` (if present)

## Examples

### Development Server

```bash
# Start development server with debug logging
JSGUI_DEBUG=1 node cli.js serve --port 3000
```

### Production Server

```bash
# Start production server on specific port
PORT=80 HOST=0.0.0.0 node cli.js serve
```

### Ephemeral Port

```bash
# Use random available port (useful for testing)
node cli.js serve --port 0
```

### Custom Root Directory

```bash
# Serve from different directory
node cli.js serve --root ../other-project --port 3000
```

## Error Handling

### Common Exit Codes

- **0**: Success
- **1**: General error (configuration, startup failure)
- **2**: Invalid arguments

### Error Messages

The CLI provides clear, actionable error messages:

```
jsgui3-server: Control not found

Looking for a control to serve but none was specified.

Did you mean to:
  - Create a client.js file in the current directory
  - Specify a different root directory with --root
  - Check that your client.js exports a control

Current directory: /path/to/project
Searched for: client.js, src/client.js, app/client.js
```

## Integration Examples

### NPM Scripts

```json
{
  "scripts": {
    "dev": "JSGUI_DEBUG=1 node cli.js serve --port 3000",
    "start": "node cli.js serve --port 80",
    "test": "node cli.js serve --port 0"
  }
}
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["node", "cli.js", "serve", "--host", "0.0.0.0"]
```

### Systemd Service

```ini
[Unit]
Description=JSGUI3 Server
After=network.target

[Service]
Type=simple
User=jsgui
WorkingDirectory=/opt/jsgui3-server
ExecStart=/usr/bin/node cli.js serve --host 0.0.0.0 --port 80
Restart=always

[Install]
WantedBy=multi-user.target
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Start JSGUI3 Server
  run: |
    npm install
    node cli.js serve --port 3000 &
    sleep 5
    curl http://localhost:3000
```

## Troubleshooting

### Server Won't Start

**Check port availability:**
```bash
# Find process using port
lsof -i :8080
netstat -ano | findstr :8080

# Use different port
node cli.js serve --port 3000
```

**Check permissions:**
```bash
# Low ports require root on Unix
sudo node cli.js serve --port 80
```

### Client Not Found

**Verify file structure:**
```bash
ls -la client.js
# or
ls -la src/client.js
```

**Check exports:**
```javascript
// client.js should export controls
const jsgui = require('jsgui3-client');
// ... control definitions
module.exports = jsgui; // Must export jsgui object
```

### Debug Mode Issues

**Enable verbose logging:**
```bash
JSGUI_DEBUG=1 node cli.js serve
```

**Check for missing dependencies:**
```bash
npm ls jsgui3-client
npm ls jsgui3-html
```

## Advanced Usage

### Custom Configuration File

Create `jsgui.config.js`:

```javascript
module.exports = {
  port: 3000,
  host: 'localhost',
  debug: process.env.NODE_ENV === 'development',
  // Additional server options
};
```

### Programmatic Usage

```javascript
const { spawn } = require('child_process');

function startServer(options = {}) {
  const args = ['cli.js', 'serve'];

  if (options.port) args.push('--port', options.port);
  if (options.host) args.push('--host', options.host);

  const server = spawn('node', args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      JSGUI_DEBUG: options.debug ? '1' : '0'
    }
  });

  return server;
}
```

## Performance Tuning

### Memory Usage

```bash
# Monitor memory usage
node --max-old-space-size=512 cli.js serve
```

### Connection Limits

```bash
# Limit concurrent connections (system dependent)
ulimit -n 1024
node cli.js serve
```

## Security Considerations

### Host Binding

```bash
# Bind only to localhost for development
node cli.js serve --host 127.0.0.1

# Bind to all interfaces for production (use firewall)
node cli.js serve --host 0.0.0.0
```

### Environment Variables

Avoid hardcoding sensitive information:

```bash
# Use environment variables for sensitive config
DATABASE_URL=postgres://... node cli.js serve
```

## Migration from Direct Server Usage

### Before (Direct Server)

```javascript
const Server = require('jsgui3-server');
const { MyControl } = require('./client').controls;

Server.serve({ ctrl: MyControl, port: 3000 });
```

### After (CLI)

```bash
# Same functionality via CLI
node cli.js serve --port 3000
```

### Benefits of CLI Migration

- **Standardization**: Consistent startup across environments
- **Scripting**: Easy integration with other tools
- **Monitoring**: Standard process management
- **Deployment**: Simplified containerization and orchestration

## Future Enhancements

### Planned Features

- **Hot Reload**: Automatic restart on file changes
- **Multi-Instance**: Load balancing across multiple processes
- **Health Checks**: Built-in health monitoring endpoints
- **Configuration Validation**: Automatic config file validation
- **Plugin System**: Extensible command system

### Backward Compatibility

All current CLI functionality will remain available. New features will be additive, ensuring existing scripts and automation continue to work.

---

This CLI reference provides comprehensive information for using JSGUI3 Server from the command line. For programmatic server control, see the Server API documentation.