# JSGUI3 Server - Comprehensive Documentation

## When to Read

This document provides detailed technical documentation for the JSGUI3 Server framework. Read this when:
- You need comprehensive API references and technical specifications
**Split Recommendation:** This document (1346 lines) is very large and covers many topics. Consider splitting into focused documents:
- Core API reference and examples
- Advanced configuration and deployment
- Control development guide
- Troubleshooting and performance optimization

- You're implementing advanced features or custom integrations
- You want detailed examples of control creation and server configuration
- You're troubleshooting complex issues or performance problems
- You need to understand deployment, security, and production considerations

**Note:** Start with [README.md](../README.md) for project overview and basic usage. For server API design principles, see [docs/simple-server-api-design.md](docs/simple-server-api-design.md).

# JSGUI3 Server - Comprehensive Documentation

## Overview

JSGUI3 Server is a Node.js-based web server framework designed for serving modern JavaScript GUI applications built with the JSGUI3 library. It provides a complete runtime environment for delivering dynamic, component-based user interfaces with integrated data binding, event handling, and automatic CSS/JS bundling.

The server acts as a bridge between server-side JavaScript applications and browser clients, offering sophisticated component serving, data model management, real-time synchronization, and automatic resource bundling.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [Installation and Setup](#installation-and-setup)
5. [Configuration](#configuration)
6. [API Reference](#api-reference)
7. [Examples](#examples)
8. [Development](#development)
9. [Troubleshooting](#troubleshooting)
10. [Deployment & Production](#deployment--production)
11. [Contributing](#contributing)
12. [Code Style Guidelines](#code-style-guidelines)
13. [License](#license)
14. [Changelog](#changelog)
15. [Support](#support)
16. [Roadmap](#roadmap)

## Quick Start

### Minimal Server Setup

```javascript
// server.js
const Server = require('jsgui3-server');
const { MyControl } = require('./client').controls;

Server.serve({
    ctrl: MyControl,
    src_path_client_js: require.resolve('./client.js')
});
// Server runs at http://localhost:8080
```

### With Port Configuration

```javascript
Server.serve({
    ctrl: MyControl,
    src_path_client_js: require.resolve('./client.js'),
    port: 3000
});
```

### Multi-Page Application

```javascript
Server.serve({
    pages: {
        '/': {
            content: HomeControl,
            title: 'Home',
            src_path_client_js: require.resolve('./client.js')
        },
        '/about': {
            content: AboutControl,
            title: 'About',
            src_path_client_js: require.resolve('./client.js')
        },
        '/contact': {
            content: ContactControl,
            title: 'Contact',
            src_path_client_js: require.resolve('./client.js')
        }
    },
    port: 3000
});
```

### With API Endpoints

```javascript
Server.serve({
    ctrl: DashboardControl,
    src_path_client_js: require.resolve('./client.js'),
    api: {
        'metrics': () => ({ users: 1234, revenue: 56789 }),
        'data': async ({ range }) => await fetchAnalytics(range)
    },
    port: 3000
});
```

## Architecture Overview

### Core Architecture

JSGUI3 Server follows a modular architecture with several key components:

- **Server Core**: Main HTTP server handling requests and responses
- **Publishers**: Specialized handlers for different content types (HTML, JS, CSS, images, etc.)
- **Resources**: Abstractions for accessing data sources (file system, databases, APIs)
- **Bundlers**: Tools for processing and optimizing client-side code
- **Controls**: Reusable UI components that can be served to browsers

### Asynchronous Programming Model

JSGUI3 Server uses the `fnl` library for observable-based asynchronous programming. Unlike traditional Promises, `fnl` observables use an event-driven model:

```javascript
// Observable pattern used throughout the codebase
const observable = someAsyncOperation();
observable.on({
    next: (data) => {
        // Handle data emission
        console.log('Received:', data);
    },
    complete: (result) => {
        // Handle completion
        console.log('Operation complete:', result);
    },
    error: (err) => {
        // Handle errors
        console.error('Error:', err);
    }
});

// Observables are also thenable (compatible with async/await)
const result = await observable;
```

This pattern provides better control flow for complex asynchronous operations while maintaining compatibility with modern JavaScript async/await syntax.

### Request Flow

1. **Client Request**: Browser requests a page or resource
2. **Routing**: Server determines appropriate publisher based on URL
3. **Resource Loading**: Publisher accesses required resources (files, data, controls)
4. **Processing**: Content is processed (bundling, rendering, etc.)
5. **Response**: Formatted content is sent to client

### Data Flow

```
Client Browser ↔ HTTP Server ↔ Publishers ↔ Resources ↔ Data Sources
                      ↕
                Bundlers/Processors
```

## Core Components

### Server Class

The main server class handles HTTP requests and coordinates between publishers and resources.

**Key Methods:**
- `start(port, callback)`: Start the HTTP server
- `publish(route, handler)`: Add API endpoints
- `use(middleware)`: Add middleware functions

### Publishers

Publishers handle specific types of content:

- **HTTP_Webpage_Publisher**: Serves HTML pages with embedded controls
- **HTTP_JS_Publisher**: Serves JavaScript bundles
- **HTTP_CSS_Publisher**: Serves CSS stylesheets
- **HTTP_Image_Publisher**: Serves image files
- **HTTP_API_Publisher**: Handles API endpoints

### Resources

Resources provide access to different data sources:

- **File_System_Resource**: Local file system access
- **Database_Resource**: Database connectivity
- **API_Resource**: External API integration
- **Memory_Resource**: In-memory data storage

### Bundlers

Bundlers process and optimize client-side code:

- **JS_Bundler**: Combines and minifies JavaScript
- **CSS_Bundler**: Processes and optimizes CSS
- **HTML_Bundler**: Renders HTML templates

### Controls

JSGUI3 provides a rich set of UI controls:

- **Window**: Draggable, resizable container
- **Panel**: Basic container control
- **Button**: Interactive button control
- **Text_Input**: Text input field
- **Checkbox**: Boolean input control
- **Date_Picker**: Date selection control
- **Month_View**: Calendar display
- **Menu**: Dropdown menu control

## Installation and Setup

### Prerequisites

- Node.js >= 15.0.0
- npm or yarn package manager

### Installation

```bash
npm install jsgui3-server
```

### Basic Setup

1. Create a client-side control:

```javascript
// client.js
const jsgui = require('jsgui3-client');
const { controls, Control, mixins } = jsgui;
const Active_HTML_Document = require('jsgui3-server/controls/Active_HTML_Document');

class MyControl extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'my_control';
        super(spec);
        const { context } = this;
        
        if (typeof this.body.add_class === 'function') {
            this.body.add_class('my-control');
        }
        
        const compose = () => {
            // Your UI composition logic here
            const button = new controls.Button({
                context,
                text: 'Click Me'
            });
            this.body.add(button);
        };
        
        if (!spec.el) { compose(); }
    }
    
    activate() {
        if (!this.__active) {
            super.activate();
            const { context } = this;
            // Activation logic here
        }
    }
}

MyControl.css = `
* { margin: 0; padding: 0; }
body { 
    overflow-x: hidden; 
    overflow-y: hidden; 
    background-color: #E0E0E0; 
}
.my-control { 
    padding: 20px;
    background: #f0f0f0;
    border: 1px solid #ccc;
}
`;

controls.MyControl = MyControl;
module.exports = jsgui;
```

2. Create server:

```javascript
// server.js
const Server = require('jsgui3-server');
const { MyControl } = require('./client').controls;

Server.serve({
    ctrl: MyControl,
    src_path_client_js: require.resolve('./client.js')
});
```

3. Start the server:

```bash
node server.js
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 8080)
- `HOST`: Server host (default: all IPv4 interfaces)
- `JSGUI_DEBUG`: Enable debug mode (default: false)

### Configuration Object

```javascript
const config = {
    port: 3000,
    host: 'localhost',
    debug: true,
    pages: {
        '/': { content: HomeControl, title: 'Home' }
    },
    api: {
        'status': () => ({ uptime: process.uptime() })
    },
    static: {
        '/assets': './public'
    }
};

Server.serve(config);
```

### Configuration File

Create `jsgui.config.js`:

```javascript
module.exports = {
    port: 3000,
    pages: {
        '/': require('./controls/home'),
        '/about': require('./controls/about')
    }
};
```

## API Reference

### Server.serve(options)

Main entry point for starting the server.

**Parameters:**
- `options` (object): Server configuration object

**Options:**
- `ctrl` or `Ctrl`: Main control class constructor
- `pages`: Object defining multiple pages with routes as keys
- `api`: Object defining API endpoints
- `src_path_client_js`: Path to client-side JavaScript file
- `port`: Server port (default: 8080)
- `host`: Server host (default: all IPv4 interfaces)
- `debug`: Enable debug mode (default: false)

**Returns:** Promise that resolves to the server instance

**Examples:**

```javascript
// Simple control serving
const server = await Server.serve({
    ctrl: MyControl,
    src_path_client_js: require.resolve('./client.js'),
    port: 3000
});

// Multi-page application
const server = await Server.serve({
    pages: {
        '/': {
            content: HomeControl,
            title: 'Home Page',
            src_path_client_js: require.resolve('./client.js')
        },
        '/about': {
            content: AboutControl,
            title: 'About Page',
            src_path_client_js: require.resolve('./client.js')
        }
    },
    port: 3000
});

// With API endpoints
const server = await Server.serve({
    ctrl: DashboardControl,
    src_path_client_js: require.resolve('./client.js'),
    api: {
        'status': () => ({ uptime: process.uptime() }),
        'users': async () => await getUsers()
    },
    port: 3000
});
```

### Publishers API

#### Creating Custom Publishers

```javascript
class CustomPublisher extends Publisher {
    constructor(spec) {
        super(spec);
    }
    
    serve(request, response) {
        // Custom serving logic
    }
}
```

## Examples

### Basic Window Control

Based on the actual example in `examples/controls/8) window, checkbox/a)/`:

```javascript
// client.js
const jsgui = require('jsgui3-client');
const { controls, Control, mixins } = jsgui;
const { dragable } = mixins;
const { Checkbox } = controls;
const Active_HTML_Document = require('jsgui3-server/controls/Active_HTML_Document');

class Demo_UI extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'demo_ui';
        super(spec);
        const { context } = this;

        if (typeof this.body.add_class === 'function') {
            this.body.add_class('demo-ui');
        }

        const compose = () => {
            // Compose window with a checkbox control
            const window = new controls.Window({
                context,
                title: 'JSGUI3 Checkbox Control',
                pos: [10, 10]
            });
            const checkbox = new Checkbox({
                context,
                label: { text: 'A checkbox' }
            });
            window.inner.add(checkbox);
            this.body.add(window);
        };

        if (!spec.el) { compose(); }
    }

    activate() {
        if (!this.__active) {
            super.activate();
            const { context } = this;
            // Handle window resize events
            context.on('window-resize', e_resize => { });
        }
    }
}

Demo_UI.css = `
* { margin: 0; padding: 0; }
body {
    overflow-x: hidden;
    overflow-y: hidden;
    background-color: #E0E0E0;
}
.demo-ui {
    /* Control-specific styles */
}
`;

controls.Demo_UI = Demo_UI;
module.exports = jsgui;

// server.js - NEW SIMPLIFIED API (Recommended)
const Server = require('jsgui3-server');

// Auto-discovers client.js and control
Server.serve({ port: 52000 });

// server.js - LEGACY API (Still supported)
// Uncomment below and comment above for legacy usage
/*
const jsgui = require('./client');
const { Demo_UI } = jsgui.controls;
const Server = require('jsgui3-server');

if (require.main === module) {
    const server = new Server({
        Ctrl: Demo_UI,
        src_path_client_js: require.resolve('./client.js')
    });

    console.log('waiting for server ready event');
    server.on('ready', () => {
        console.log('server ready');
        server.start(52000, (err) => {
            if (err) throw err;
            console.log('server started');
        });
    });
}
*/
```

### Data-Bound Controls

Example with shared data models:

```javascript
class DataBindingExample extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'data_binding_example';
        super(spec);
        const { context } = this;
        
        if (typeof this.body.add_class === 'function') {
            this.body.add_class('data-binding-example');
        }
        
        // Create shared data model
        this.data = { model: new Data_Object({ context }) };
        field(this.data.model, 'name');
        field(this.data.model, 'email');
        context.register_control(this.data.model);
        
        const compose = () => {
            // Create input controls bound to shared model
            const nameInput = new controls.Text_Input({
                context,
                label: { text: 'Name:' },
                data: { model: this.data.model, field_name: 'name' }
            });
            
            const emailInput = new controls.Text_Input({
                context,
                label: { text: 'Email:' },
                data: { model: this.data.model, field_name: 'email' }
            });
            
            this.body.add(nameInput);
            this.body.add(emailInput);
        };
        
        if (!spec.el) { compose(); }
    }
    
    activate() {
        if (!this.__active) {
            super.activate();
            const { context } = this;
            // Model synchronization logic can go here
        }
    }
}

DataBindingExample.css = `
* { margin: 0; padding: 0; }
body { 
    overflow-x: hidden; 
    overflow-y: hidden; 
    background-color: #E0E0E0; 
}
.data-binding-example {
    padding: 20px;
}
`;

controls.DataBindingExample = DataBindingExample;
module.exports = jsgui;
```

### API Integration

```javascript
// server.js with API - NEW SIMPLIFIED API
const Server = require('jsgui3-server');

Server.serve({
    // Auto-discovers client.js and control
    api: {
        'users': async () => {
            return await database.getUsers();
        },
        'metrics': () => ({
            activeUsers: 1234,
            totalRevenue: 56789,
            serverUptime: process.uptime()
        }),
        'update': async ({ id, data }) => {
            return await database.updateUser(id, data);
        }
    },
    port: 3000
});

// API endpoints available at:
// GET/POST /api/users
// GET/POST /api/metrics
// GET/POST /api/update

// server.js - LEGACY API (Still supported)
// Uncomment below for legacy usage
/*
const Server = require('jsgui3-server');
const { DashboardControl } = require('./client').controls;

Server.serve({
    ctrl: DashboardControl,
    src_path_client_js: require.resolve('./client.js'),
    api: {
        'users': async () => {
            return await database.getUsers();
        },
        'metrics': () => ({
            activeUsers: 1234,
            totalRevenue: 56789,
            serverUptime: process.uptime()
        }),
        'update': async ({ id, data }) => {
            return await database.updateUser(id, data);
        }
    },
    port: 3000
});
*/
```

## Development

### Project Structure

```
jsgui3-server/
├── cli.js                 # Command-line interface
├── server.js              # Main server implementation
├── module.js              # Module exports
├── controls/              # UI control classes
├── publishers/            # Content publishers
├── resources/             # Data resource handlers
├── bundlers/              # Code bundling utilities
├── examples/              # Example applications
├── tests/                 # Test suites
└── docs/                  # Documentation
```

### Development Workflow

1. **Setup Development Environment**
   ```bash
   git clone https://github.com/metabench/jsgui3-server.git
   cd jsgui3-server
   npm install
   ```

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Start Development Server**
   ```bash
   npm run serve
   ```

4. **Run CLI**
   ```bash
   npm run cli
   ```

### CLI Commands

```bash
# Start server
node cli.js serve --port 3000

# Show help
node cli.js --help

# Show version
node cli.js --version
```

### Testing

The project uses Mocha for testing:

```bash
# Run all tests
npm test

# Run specific test file
npx mocha tests/cli.test.js

# Run with coverage
npx nyc npm test
```

### Code Style

- Use `snake_case` for variables, functions, and utilities
- Use `PascalCase` for classes and constructors
- Follow existing patterns for control creation and lifecycle
- Include comprehensive error handling
- Add JSDoc comments for public APIs

## Deployment

### Production Deployment

1. **Build Optimization**
   ```bash
   # Enable production bundling
   NODE_ENV=production node server.js
   ```

2. **Environment Configuration**
   ```bash
   PORT=80 HOST=0.0.0.0 node server.js
   ```

3. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start server.js --name jsgui3-server
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
EXPOSE 8080

CMD ["node", "server.js"]
```

### Cloud Deployment

#### Heroku

```javascript
// server.js
const port = process.env.PORT || 8080;
Server.serve({ ctrl: MyControl, port });
```

#### Vercel

```javascript
// api/server.js
const Server = require('jsgui3-server');

module.exports = (req, res) => {
    // Handle Vercel serverless function
};
```

## Troubleshooting

### Common Issues

#### Server Won't Start

**Problem:** Port already in use
**Solution:**
```bash
# Find process using port (Linux/macOS)
lsof -i :8080

# Find process using port (Windows)
netstat -ano | findstr :8080

# Kill process or use different port
PORT=3000 node server.js
```

**Problem:** Missing client.js file
**Solution:** Ensure `src_path_client_js` points to a valid file:
```javascript
Server.serve({
    ctrl: MyControl,
    src_path_client_js: require.resolve('./client.js')  // Must resolve to actual file
});
```

#### Controls Not Rendering

**Problem:** CSS or JavaScript not loading
**Solution:** 
- Check browser developer tools for 404 errors
- Ensure bundling completed successfully (look for "server ready" message)
- Verify control CSS is properly defined as static property

**Problem:** Control constructor errors
**Solution:** Check server logs for JavaScript errors in control initialization

#### API Endpoints Not Working

**Problem:** Incorrect route configuration
**Solution:** 
- API routes are automatically prefixed with `/api/`
- Verify function returns correct data type (object/array for JSON, string for text)
- Check server logs for routing errors

**Problem:** Async API functions not working
**Solution:** Ensure async functions are properly awaited:
```javascript
api: {
    'data': async () => {
        return await someAsyncOperation();  // Must return Promise
    }
}
```

#### Bundling Errors

**Problem:** ESBuild bundling fails
**Solution:**
- Check for syntax errors in client.js
- Ensure all dependencies are properly installed
- Try with `debug: true` for more detailed error messages

**Problem:** CSS extraction issues
**Solution:** Verify control classes have proper CSS static properties

### Debug Mode

Enable debug mode for detailed logging:

```bash
JSGUI_DEBUG=1 node server.js
```

Or in code:

```javascript
Server.serve({
    ctrl: MyControl,
    src_path_client_js: require.resolve('./client.js'),
    debug: true
});
```

### Logging

The server provides comprehensive logging:

- **Server startup**: Bundling progress and server initialization
- **Request handling**: HTTP requests and responses
- **Bundling**: ESBuild compilation status
- **Errors**: Detailed error messages and stack traces

### Performance Issues

**Problem:** Slow server startup
**Solution:**
- Bundling is the most time-consuming part
- Use debug mode sparingly (disables minification)
- Cache bundled assets in production

**Problem:** High memory usage
**Solution:**
- Monitor for memory leaks in controls
- Use `context.register_control()` properly for cleanup
- Avoid large data models in memory

### Development Tips

#### Hot Reloading

For development, you may need to restart the server when changing controls. The server doesn't currently support hot reloading.

#### Debugging Controls

```javascript
// Add debug logging to controls
class MyControl extends Active_HTML_Document {
    constructor(spec = {}) {
        super(spec);
        console.log('Control created:', spec);
        
        // Add debugging to activation
        this.activate = () => {
            console.log('Control activating');
            // ... rest of activation logic
        };
    }
}
```

#### Browser Developer Tools

- Use browser dev tools to inspect generated HTML/CSS/JS
- Check Network tab for failed asset requests
- Use Console tab for client-side JavaScript errors
- Source maps are available in debug mode for easier debugging

## Deployment & Production

### Production Configuration

#### Environment Variables

```bash
# Production settings
NODE_ENV=production
PORT=80
JSGUI_DEBUG=0

# SSL/TLS (if using HTTPS)
SSL_KEY_PATH=/path/to/ssl/key.pem
SSL_CERT_PATH=/path/to/ssl/cert.pem
```

#### Server Configuration

```javascript
const server = Server.serve({
    ctrl: MyControl,
    src_path_client_js: require.resolve('./client.js'),
    port: process.env.PORT || 80,
    debug: false,  // Disable for production
    // Additional production settings
    max_age: 86400,  // Cache static assets for 24 hours
    compress: true    // Enable gzip compression
});
```

### Process Management

#### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start server with PM2
pm2 start server.js --name "jsgui3-server"

# Save PM2 configuration
pm2 save

# Set up auto-restart
pm2 startup
```

#### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'jsgui3-server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 80
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 80
    }
  }]
};
```

### Docker Deployment

#### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S jsgui -u 1001

USER jsgui

EXPOSE 8080

CMD ["node", "server.js"]
```

#### Docker Compose

```yaml
version: '3.8'
services:
  jsgui3-server:
    build: .
    ports:
      - "80:8080"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### Reverse Proxy Setup

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    ProxyPass / http://localhost:8080/
    ProxyPassReverse / http://localhost:8080/
    
    # WebSocket support
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /(.*) ws://localhost:8080/$1 [P,L]
</VirtualHost>
```

### SSL/TLS Setup

#### Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --webroot -w /var/www/html -d your-domain.com

# Configure server for HTTPS
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/your-domain.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/your-domain.com/fullchain.pem')
};

const server = Server.serve({
    ctrl: MyControl,
    src_path_client_js: require.resolve('./client.js'),
    https: options
});
```

### Monitoring & Logging

#### Health Check Endpoint

```javascript
// Add health check to your control
class MyControl extends Active_HTML_Document {
    static api = {
        'health': () => ({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        })
    };
}
```

#### Log Rotation

```bash
# Using PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Performance Optimization

#### Caching Strategy

```javascript
Server.serve({
    ctrl: MyControl,
    src_path_client_js: require.resolve('./client.js'),
    // Cache static assets
    max_age: 86400,  // 24 hours
    // Enable compression
    compress: true,
    // Optimize bundling
    debug: false
});
```

#### Database Connection Pooling

If using databases, implement connection pooling:

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'user',
    password: 'password',
    database: 'mydb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Use in API functions
static api = {
    'data': async () => {
        const [rows] = await pool.execute('SELECT * FROM table');
        return rows;
    }
};
```

### Security Considerations

#### Input Validation

```javascript
static api = {
    'user': async (params) => {
        // Validate input
        if (!params.id || typeof params.id !== 'number') {
            throw new Error('Invalid user ID');
        }
        
        // Sanitize data
        const userId = Math.floor(params.id);
        
        return await getUserById(userId);
    }
};
```

#### Rate Limiting

Implement rate limiting for API endpoints:

```javascript
const rateLimit = require('express-rate-limit');

// In your server setup
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

// Apply to API routes (requires custom integration)
```

#### CORS Configuration

```javascript
Server.serve({
    ctrl: MyControl,
    src_path_client_js: require.resolve('./client.js'),
    cors: {
        origin: ['https://yourdomain.com'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});
```

## Contributing

### Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/my-feature`
5. Make your changes
6. Run tests: `npm test`
7. Submit a pull request

### Code Guidelines

- Follow existing code style and patterns
- Add tests for new features
- Update documentation as needed
- Ensure backwards compatibility
- Use meaningful commit messages

### Testing

- Write unit tests for new functionality
- Ensure all existing tests pass
- Test on multiple Node.js versions
- Include integration tests for complex features

### Documentation

- Update README for API changes
- Add JSDoc comments for new methods
- Include examples for new features
- Update changelog for releases

## Code Style Guidelines

### Naming Conventions

Following the agent guidelines in `AGENTS.md`:

- **Variables, functions, and helper utilities**: Use `snake_case`
- **Classes and constructors**: Use `PascalCase` (also called `Snake_Case` in the guidelines)

**Examples:**
```javascript
// Correct
class My_Custom_Class {
    constructor(spec = {}) {
        this.some_variable = spec.some_variable;
        this.another_helper_function();
    }
    
    some_method() {
        // method implementation
    }
}

function helper_utility_function() {
    // utility function
}

// Avoid
class my_custom_class {  // Wrong: should be PascalCase
    constructor() {
        this.SomeVariable = null;  // Wrong: should be snake_case
    }
}
```

### Control Class Patterns

When creating new controls, follow these patterns:

```javascript
const jsgui = require('jsgui3-client');
const { controls, Control, Data_Object, field } = jsgui;
const Active_HTML_Document = require('jsgui3-server/controls/Active_HTML_Document');

class My_Custom_Control extends Active_HTML_Document {
    constructor(spec = {}) {
        spec.__type_name = spec.__type_name || 'my_custom_control';
        super(spec);
        const { context } = this;
        
        // Defensive programming
        if (typeof this.body.add_class === 'function') {
            this.body.add_class('my-custom-control');
        }
        
        const compose = () => {
            // UI composition logic
        };
        
        if (!spec.el) { compose(); }
    }
    
    activate() {
        if (!this.__active) {
            super.activate();
            const { context } = this;
            // Activation logic
        }
    }
}

My_Custom_Control.css = `
/* CSS styles */
`;

controls.My_Custom_Control = My_Custom_Control;
module.exports = jsgui;
```

### Documentation Standards

- Use JSDoc comments for all public methods and classes
- Document parameters, return values, and thrown exceptions
- Include code examples where helpful
- Reference related functions and classes

### Error Handling

- Use defensive programming techniques
- Provide meaningful error messages
- Handle asynchronous errors properly
- Log errors appropriately for debugging

### Reference Materials

For comprehensive guidance on agentic workflows and development practices, see:
- [`AGENTS.md`](AGENTS.md) - Agent guidelines and naming conventions
- [`docs/GUIDE_TO_AGENTIC_WORKFLOWS_BY_GROK.md`](docs/GUIDE_TO_AGENTIC_WORKFLOWS_BY_GROK.md) - Complete guide to autonomous task execution

## License

MIT License - see LICENSE file for details.

## Changelog

### Version 0.0.138
- Enhanced server API with `Server.serve()` method
- Improved CSS extraction and bundling
- Added comprehensive CLI interface
- Fixed source map consistency issues

### Version 0.0.137
- Bug fixes and stability improvements
- Enhanced publisher system
- Improved error handling

### Version 0.0.136
- Server function publishing improvements
- Better JSON API support
- Enhanced resource management

## Support

- **Issues**: [GitHub Issues](https://github.com/metabench/jsgui3-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/metabench/jsgui3-server/discussions)
- **Documentation**: [Project Wiki](https://github.com/metabench/jsgui3-server/wiki)

## Roadmap

### Current Focus
- CLI improvements and reliability
- Admin interface development
- Enhanced control suite
- Documentation and examples

### Future Plans
- File manager interface
- Deployment workflows
- Advanced bundling options
- Performance optimizations

---

This documentation provides a comprehensive overview of JSGUI3 Server. For more detailed information about specific components, see the individual files in the `docs/` directory and the examples in `examples/`.</content>
<parameter name="filePath">c:\\Users\\james\\Documents\\repos\\jsgui3-server\\docs\\comprehensive-documentation.md