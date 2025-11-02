# Troubleshooting Guide

## When to Read

This document provides solutions to common issues encountered when using JSGUI3 Server. Read this when:
- You're experiencing errors or unexpected behavior
- Server won't start or controls aren't rendering
- You need help debugging bundling or API issues
- You're encountering performance problems
- You want to understand error messages and their solutions

**Note:** For general usage, see [README.md](../README.md). For CLI usage, see [docs/cli-reference.md](docs/cli-reference.md).

## Quick Diagnosis

### Check Server Logs

Enable verbose logging to see what's happening:

```bash
# CLI
JSGUI_DEBUG=1 node cli.js serve

# Programmatic
Server.serve({
    ctrl: MyControl,
    debug: true
});
```

### Common Log Messages

**"waiting for server ready event"**
- Normal startup message
- Indicates bundling is in progress

**"server ready"**
- Bundling completed successfully
- Server is about to start listening

**"server started"**
- HTTP server is listening on specified port
- Application should be accessible

## Server Startup Issues

### Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::8080
```

**Solutions:**

1. **Find and kill the process:**
   ```bash
   # Linux/macOS
   lsof -i :8080
   kill -9 <PID>

   # Windows
   netstat -ano | findstr :8080
   taskkill /PID <PID> /F
   ```

2. **Use a different port:**
   ```bash
   node cli.js serve --port 3000
   ```

3. **Use ephemeral port:**
   ```javascript
   Server.serve({ port: 0 }); // Random available port
   ```

### Missing Client File

**Symptoms:**
```
Error: No client file found
Searched in: /app/client.js, /app/src/client.js, /app/app/client.js
```

**Solutions:**

1. **Create client.js in project root:**
   ```javascript
   const jsgui = require('jsgui3-client');
   const { controls } = jsgui;
   const Active_HTML_Document = require('jsgui3-server/controls/Active_HTML_Document');

   class MyControl extends Active_HTML_Document {
       // ... control implementation
   }

   controls.MyControl = MyControl;
   module.exports = jsgui;
   ```

2. **Specify explicit path:**
   ```javascript
   Server.serve({
       ctrl: MyControl,
       src_path_client_js: require.resolve('./path/to/client.js')
   });
   ```

3. **Use different directory structure:**
   - Place client.js in `src/` or `app/` directory
   - Or create symlink: `ln -s src/client.js client.js`

### Control Not Found

**Symptoms:**
```
Error: No control found in /path/to/client.js
```

**Solutions:**

1. **Check exports structure:**
   ```javascript
   // Correct - export jsgui object with controls
   controls.MyControl = MyControl;
   module.exports = jsgui;

   // Also correct - direct export
   module.exports = MyControl;

   // Also correct - default export
   module.exports.default = MyControl;
   ```

2. **Verify control class:**
   ```javascript
   class MyControl extends Active_HTML_Document {
       constructor(spec = {}) {
           spec.__type_name = 'my_control'; // Required
           super(spec);
           // ... rest of constructor
       }
   }
   ```

### ESBuild Bundling Errors

**Symptoms:**
```
Error: Build failed with 1 error:
input.js:1:0: ERROR: Expected identifier but found "}"
```

**Solutions:**

1. **Check syntax errors:**
   ```bash
   node -c client.js  # Check syntax
   ```

2. **Verify imports:**
   ```javascript
   // Correct
   const jsgui = require('jsgui3-client');

   // Incorrect - missing dependency
   // npm install jsgui3-client
   ```

3. **Check file paths:**
   ```javascript
   // Use require.resolve for reliable paths
   src_path_client_js: require.resolve('./client.js')
   ```

## Control Rendering Issues

### Controls Not Appearing

**Symptoms:**
- Page loads but shows blank or default content
- JavaScript console shows no errors
- Network tab shows 404 for CSS/JS files

**Solutions:**

1. **Check control composition:**
   ```javascript
   const compose = () => {
       // This code must run
       const button = new controls.Button({ context });
       this.body.add(button);
   };

   if (!spec.el) { compose(); } // Required condition
   ```

2. **Verify CSS definition:**
   ```javascript
   MyControl.css = `
   .my-control {
       padding: 20px;
       background: #f0f0f0;
   }
   `;
   ```

3. **Check activation:**
   ```javascript
   activate() {
       if (!this.__active) {
           super.activate(); // Must call first
           const { context } = this;
           // Event handlers here
       }
   }
   ```

### CSS Not Loading

**Symptoms:**
- Controls render but without styles
- Network tab shows 404 for `/css/css.css`

**Solutions:**

1. **Verify CSS extraction:**
   - CSS must be defined as static property: `MyControl.css = '...';`
   - Not as instance property: `this.css = '...';`

2. **Check bundling completion:**
   - Wait for "server ready" message
   - Ensure no bundling errors in logs

3. **Debug CSS content:**
   ```javascript
   console.log('CSS content:', MyControl.css);
   ```

### JavaScript Errors

**Symptoms:**
- Browser console shows JavaScript errors
- Controls fail to initialize

**Solutions:**

1. **Check browser console:**
   - Open DevTools → Console tab
   - Look for red error messages

2. **Verify control registration:**
   ```javascript
   // Must register control globally
   controls.MyControl = MyControl;
   ```

3. **Check context access:**
   ```javascript
   constructor(spec = {}) {
       super(spec);
       const { context } = this; // Must extract context
       // Use context for creating child controls
   }
   ```

## API Endpoint Issues

### API Routes Not Working

**Symptoms:**
- GET/POST to `/api/endpoint` returns 404
- API functions not being called

**Solutions:**

1. **Check route definition:**
   ```javascript
   Server.serve({
       api: {
           'endpoint': () => 'response'  // Correct
           // 'endpoint/': () => 'response'  // Incorrect - no trailing slash
       }
   });
   ```

2. **Verify function signatures:**
   ```javascript
   // Synchronous
   'sync': () => ({ data: 'value' })

   // Asynchronous
   'async': async () => {
       const result = await database.query();
       return result;
   }

   // With parameters
   'withParams': ({ id, name }) => {
       return { id, name };
   }
   ```

3. **Check response types:**
   - Objects/arrays → JSON response
   - Strings → text/plain response
   - Promises → automatically awaited

### CORS Issues

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:8080/api/data'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions:**

1. **Add CORS configuration:**
   ```javascript
   Server.serve({
       cors: {
           origin: ['http://localhost:3000'],
           methods: ['GET', 'POST'],
           credentials: true
       }
   });
   ```

2. **Or disable CORS for development:**
   ```javascript
   Server.serve({
       cors: {
           origin: true,  // Allow all origins
           credentials: true
       }
   });
   ```

## Data Binding Issues

### Models Not Syncing

**Symptoms:**
- Changes in one control don't update others
- Data models become desynchronized

**Solutions:**

1. **Verify model registration:**
   ```javascript
   this.data = { model: new Data_Object({ context }) };
   field(this.data.model, 'value');
   context.register_control(this.data.model); // Required
   ```

2. **Check control binding:**
   ```javascript
   const input = new controls.Text_Input({
       context,
       data: {
           model: this.data.model,      // Correct reference
           field_name: 'value'          // Correct field name
       }
   });
   ```

3. **Ensure field names match:**
   ```javascript
   // In model creation
   field(model, 'userName');

   // In control binding
   data: { model: model, field_name: 'userName' } // Must match exactly
   ```

### Activation Timing Issues

**Symptoms:**
- Controls work sometimes but not always
- Data binding fails intermittently

**Solutions:**

1. **Check activation order:**
   ```javascript
   activate() {
       if (!this.__active) {
           super.activate(); // Must be first
           // Then do control-specific activation
       }
   }
   ```

2. **Verify context availability:**
   ```javascript
   activate() {
       if (!this.__active) {
           super.activate();
           const { context } = this; // Re-extract after super call
           // Use context here
       }
   }
   ```

## Performance Issues

### Slow Startup

**Symptoms:**
- Long delay between "waiting for server ready" and "server ready"
- Bundling takes excessive time

**Solutions:**

1. **Disable debug mode in production:**
   ```javascript
   Server.serve({
       debug: false  // Faster bundling, smaller files
   });
   ```

2. **Check for large dependencies:**
   ```bash
   npm ls --depth=0  # See direct dependencies
   ```

3. **Optimize bundling:**
   - Remove unused imports
   - Minimize CSS content
   - Use production builds of dependencies

### Memory Leaks

**Symptoms:**
- Memory usage grows over time
- Server becomes unresponsive after hours/days

**Solutions:**

1. **Clean up event handlers:**
   ```javascript
   deactivate() {
       // Remove event listeners
       // Clear timers/intervals
       // Release resources
       super.deactivate();
   }
   ```

2. **Proper model cleanup:**
   ```javascript
   // Models are automatically cleaned up when context is destroyed
   // But ensure context.register_control() was called
   ```

3. **Monitor memory usage:**
   ```bash
   # Use PM2 or similar process manager
   pm2 monit
   ```

## Development Environment Issues

### Hot Reload Not Working

**Symptoms:**
- Changes to client.js don't appear in browser
- Need to restart server for every change

**Solutions:**

1. **Restart server:**
   ```bash
   # Kill and restart
   pkill -f "node cli.js"
   node cli.js serve
   ```

2. **Check file watching:**
   - JSGUI3 Server doesn't have built-in hot reload yet
   - Use browser refresh (F5) after server restart
   - Consider using nodemon for auto-restart

3. **Clear cache:**
   ```javascript
   // In development, clear require cache
   delete require.cache[require.resolve('./client.js')];
   ```

### Source Maps Not Working

**Symptoms:**
- JavaScript errors show minified code
- Can't debug original source

**Solutions:**

1. **Enable debug mode:**
   ```bash
   JSGUI_DEBUG=1 node cli.js serve
   ```

2. **Check browser dev tools:**
   - Ensure source maps are enabled in DevTools settings
   - Look for `.js.map` files in Network tab

## Production Deployment Issues

### Environment Variables Not Working

**Symptoms:**
- PORT, HOST, JSGUI_DEBUG ignored

**Solutions:**

1. **Check variable syntax:**
   ```bash
   # Correct
   PORT=3000 JSGUI_DEBUG=1 node cli.js serve

   # Incorrect (spaces around =)
   PORT = 3000 node cli.js serve
   ```

2. **Verify precedence:**
   - CLI options override environment variables
   - Environment variables override defaults

### Static Files Not Serving

**Symptoms:**
- 404 errors for images, CSS, or other assets

**Solutions:**

1. **Configure static file serving:**
   ```javascript
   Server.serve({
       static: {
           '/images': './public/images',
           '/assets': './public/assets'
       }
   });
   ```

2. **Check file permissions:**
   ```bash
   ls -la ./public/images/
   ```

3. **Verify paths:**
   - Use absolute paths or paths relative to server startup directory
   - Ensure files exist at specified locations

## Advanced Debugging

### Network Analysis

Use browser DevTools Network tab to check:

1. **HTTP status codes** - 200 OK, 404 Not Found, 500 Error
2. **Response times** - Slow requests indicate performance issues
3. **Request headers** - CORS, content-type, etc.
4. **Response content** - Verify API responses, HTML structure

### Console Debugging

Add temporary logging:

```javascript
class MyControl extends Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        console.log('Control constructor called', spec);

        const compose = () => {
            console.log('Composing UI');
            // ... composition logic
        };

        if (!spec.el) {
            console.log('Calling compose');
            compose();
        }
    }

    activate() {
        console.log('Activating control');
        if (!this.__active) {
            super.activate();
            console.log('Control activated successfully');
        }
    }
}
```

### Stack Trace Analysis

When errors occur:

1. **Look at the full stack trace** - shows where error originated
2. **Check file paths** - ensure correct files are being loaded
3. **Verify function calls** - trace execution flow
4. **Check variable values** - log intermediate values

### Process Monitoring

```bash
# Monitor server process
ps aux | grep "node cli.js"

# Check memory usage
ps -o pid,ppid,cmd,%mem,%cpu --sort=-%mem | head

# Monitor file descriptors
lsof -p <PID> | wc -l
```

## Getting Help

### Community Resources

1. **GitHub Issues:** Check existing issues and create new ones
2. **GitHub Discussions:** Ask questions and share solutions
3. **Project Wiki:** Additional documentation and examples

### Debug Information to Include

When reporting issues, include:

1. **Server version:** `npm list jsgui3-server`
2. **Node.js version:** `node --version`
3. **Operating system:** `uname -a` or Windows version
4. **Full error message and stack trace**
5. **Server configuration** (redact sensitive data)
6. **Steps to reproduce the issue**
7. **Expected vs actual behavior**

### Minimal Reproduction Case

Create a minimal example that demonstrates the issue:

```javascript
// minimal-server.js
const Server = require('jsgui3-server');

Server.serve({
    port: 3000,
    debug: true
}).catch(console.error);

// minimal-client.js
const jsgui = require('jsgui3-client');
const { controls } = jsgui;
const Active_HTML_Document = require('jsgui3-server/controls/Active_HTML_Document');

class MinimalControl extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = 'minimal_control';
        super(spec);
        const { context } = this;

        if (typeof this.body.add_class === 'function') {
            this.body.add_class('minimal-control');
        }

        const compose = () => {
            // Minimal UI
        };

        if (!spec.el) { compose(); }
    }

    activate() {
        if (!this.__active) {
            super.activate();
            const { context } = this;
        }
    }
}

MinimalControl.css = `
.minimal-control {
    padding: 20px;
    background: #f0f0f0;
}
`;

controls.MinimalControl = MinimalControl;
module.exports = jsgui;
```

This minimal setup helps isolate whether the issue is with your specific code or the framework itself.

---

Remember: Most issues can be resolved by carefully checking the console output, verifying file paths, and ensuring proper control lifecycle management. Start with the basics and work systematically through the possible causes.