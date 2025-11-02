# Advanced Usage Examples

## When to Read

This document provides practical examples of advanced JSGUI3 Server features. Read this when:
- You want to implement complex server configurations
- You're building multi-page applications
- You need API integration examples
- You want to understand advanced control patterns
- You're implementing production-ready features

**Note:** For basic usage, see [README.md](../README.md). For API reference, see [docs/api-reference.md](docs/api-reference.md).

## Multi-Page Application with API

### Complete E-commerce Dashboard

```javascript
// server.js - Full-featured e-commerce server
const Server = require('jsgui3-server');
const { controls } = require('./client');

// Simulated database (in real app, use actual DB)
const db = {
  products: [
    { id: 1, name: 'Widget A', price: 29.99, stock: 50 },
    { id: 2, name: 'Widget B', price: 39.99, stock: 30 }
  ],
  orders: [],
  users: [{ id: 1, name: 'Admin', role: 'admin' }]
};

Server.serve({
  pages: {
    '/': {
      content: controls.Dashboard,
      title: 'E-commerce Dashboard'
    },
    '/products': {
      content: controls.ProductManager,
      title: 'Product Management'
    },
    '/orders': {
      content: controls.OrderManager,
      title: 'Order Management'
    },
    '/analytics': {
      content: controls.Analytics,
      title: 'Sales Analytics'
    }
  },

  api: {
    // Product management
    'products': () => db.products,

    'product': ({ id }) => {
      const product = db.products.find(p => p.id === parseInt(id));
      if (!product) throw new Error('Product not found');
      return product;
    },

    'add-product': ({ name, price, stock }) => {
      const newProduct = {
        id: db.products.length + 1,
        name,
        price: parseFloat(price),
        stock: parseInt(stock)
      };
      db.products.push(newProduct);
      return { success: true, product: newProduct };
    },

    'update-product': ({ id, ...updates }) => {
      const product = db.products.find(p => p.id === parseInt(id));
      if (!product) throw new Error('Product not found');

      Object.assign(product, updates);
      return { success: true, product };
    },

    // Order management
    'orders': () => db.orders,

    'create-order': ({ productId, quantity, customerEmail }) => {
      const product = db.products.find(p => p.id === parseInt(productId));
      if (!product) throw new Error('Product not found');
      if (product.stock < quantity) throw new Error('Insufficient stock');

      const order = {
        id: db.orders.length + 1,
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        customerEmail,
        total: product.price * quantity,
        status: 'pending',
        createdAt: new Date()
      };

      db.orders.push(order);
      product.stock -= quantity;

      return { success: true, order };
    },

    // Analytics
    'analytics/summary': () => {
      const totalRevenue = db.orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.total, 0);

      const totalOrders = db.orders.length;
      const pendingOrders = db.orders.filter(o => o.status === 'pending').length;

      return {
        totalRevenue,
        totalOrders,
        pendingOrders,
        topProducts: db.products
          .map(p => ({
            ...p,
            sold: db.orders
              .filter(o => o.productId === p.id && o.status === 'completed')
              .reduce((sum, o) => sum + o.quantity, 0)
          }))
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 5)
      };
    }
  },

  port: 3000,
  debug: process.env.NODE_ENV !== 'production'
});
```

```javascript
// client.js - Client-side controls
const jsgui = require('jsgui3-client');
const { controls, Control, Data_Object, field } = jsgui;
const Active_HTML_Document = require('jsgui3-server/controls/Active_HTML_Document');

// Dashboard Control
class Dashboard extends Active_HTML_Document {
  constructor(spec = {}) {
    spec.__type_name = 'dashboard';
    super(spec);
    const { context } = this;

    if (typeof this.body.add_class === 'function') {
      this.body.add_class('dashboard');
    }

    this.compose();
  }

  compose() {
    // Navigation
    const nav = new controls.Panel({
      context: this.context,
      class: 'nav'
    });

    const navLinks = [
      { text: 'Dashboard', path: '/' },
      { text: 'Products', path: '/products' },
      { text: 'Orders', path: '/orders' },
      { text: 'Analytics', path: '/analytics' }
    ];

    navLinks.forEach(link => {
      const button = new controls.Button({
        context: this.context,
        text: link.text
      });
      button.on('click', () => {
        window.location.href = link.path;
      });
      nav.add(button);
    });

    // Summary cards
    const summaryContainer = new controls.Panel({
      context: this.context,
      class: 'summary-cards'
    });

    // Load analytics data
    fetch('/api/analytics/summary')
      .then(res => res.json())
      .then(data => {
        const cards = [
          { title: 'Total Revenue', value: `$${data.totalRevenue.toFixed(2)}` },
          { title: 'Total Orders', value: data.totalOrders },
          { title: 'Pending Orders', value: data.pendingOrders }
        ];

        cards.forEach(card => {
          const cardEl = new controls.Panel({
            context: this.context,
            class: 'summary-card'
          });

          const titleEl = new controls.Text({
            context: this.context,
            text: card.title,
            class: 'card-title'
          });

          const valueEl = new controls.Text({
            context: this.context,
            text: card.value,
            class: 'card-value'
          });

          cardEl.add(titleEl);
          cardEl.add(valueEl);
          summaryContainer.add(cardEl);
        });
      });

    this.body.add(nav);
    this.body.add(summaryContainer);
  }

  activate() {
    if (!this.__active) {
      super.activate();
      // Additional activation logic
    }
  }
}

Dashboard.css = `
.dashboard {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.nav {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 5px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.summary-card {
  padding: 20px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
`;

controls.Dashboard = Dashboard;
module.exports = jsgui;
```

## Real-time Data Synchronization

### Collaborative Document Editor

```javascript
// server.js - Real-time collaborative editing
const Server = require('jsgui3-server');
const WebSocket = require('ws');

// In-memory document store (use Redis in production)
const documents = new Map();
const clients = new Map(); // docId -> Set of WebSocket clients

Server.serve({
  ctrl: require('./client').controls.DocumentEditor,

  api: {
    'document': ({ id }) => {
      return documents.get(id) || { id, content: '', version: 0 };
    },

    'save-document': ({ id, content, version }) => {
      const doc = documents.get(id) || { id, version: 0 };
      if (version < doc.version) {
        throw new Error('Version conflict');
      }

      doc.content = content;
      doc.version = version + 1;
      doc.lastModified = new Date();
      documents.set(id, doc);

      // Broadcast to all clients
      const docClients = clients.get(id);
      if (docClients) {
        const update = { type: 'update', document: doc };
        docClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(update));
          }
        });
      }

      return { success: true, document: doc };
    }
  },

  port: 3000,

  // Custom WebSocket setup
  setup: (server) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
      const docId = new URL(req.url, 'http://localhost').searchParams.get('doc');

      if (docId) {
        if (!clients.has(docId)) {
          clients.set(docId, new Set());
        }
        clients.get(docId).add(ws);

        ws.on('close', () => {
          clients.get(docId)?.delete(ws);
          if (clients.get(docId)?.size === 0) {
            clients.delete(docId);
          }
        });
      }
    });
  }
});
```

```javascript
// client.js - Real-time document editor
const jsgui = require('jsgui3-client');
const { controls, Control, Data_Object, field } = jsgui;
const Active_HTML_Document = require('jsgui3-server/controls/Active_HTML_Document');

class DocumentEditor extends Active_HTML_Document {
  constructor(spec = {}) {
    spec.__type_name = 'document_editor';
    super(spec);
    const { context } = this;

    // Get document ID from URL
    this.docId = new URL(window.location.href).searchParams.get('doc') || 'default';

    // Create reactive document model
    this.document = new Data_Object({ context });
    field(this.document, 'content');
    field(this.document, 'version');
    context.register_control(this.document);

    this.compose();
    this.connectWebSocket();
  }

  compose() {
    const container = new controls.Panel({
      context: this.context,
      class: 'editor-container'
    });

    // Document title
    const title = new controls.Text_Input({
      context: this.context,
      placeholder: 'Document Title',
      class: 'doc-title'
    });

    // Content editor
    this.contentEditor = new controls.Text_Area({
      context: this.context,
      placeholder: 'Start writing...',
      class: 'content-editor'
    });

    // Bind to reactive model
    this.contentEditor.data = { model: this.document, field_name: 'content' };

    // Status indicator
    this.statusIndicator = new controls.Text({
      context: this.context,
      text: 'Connecting...',
      class: 'status'
    });

    // Save button
    const saveButton = new controls.Button({
      context: this.context,
      text: 'Save',
      class: 'save-btn'
    });

    saveButton.on('click', () => this.saveDocument());

    container.add(title);
    container.add(this.contentEditor);
    container.add(this.statusIndicator);
    container.add(saveButton);

    this.body.add(container);

    // Load existing document
    this.loadDocument();
  }

  async loadDocument() {
    try {
      const response = await fetch(`/api/document?id=${this.docId}`);
      const doc = await response.json();

      this.document.content = doc.content;
      this.document.version = doc.version;
      this.updateStatus('Loaded');
    } catch (error) {
      this.updateStatus('Error loading document');
      console.error('Load error:', error);
    }
  }

  async saveDocument() {
    try {
      this.updateStatus('Saving...');

      const response = await fetch('/api/save-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: this.docId,
          content: this.document.content,
          version: this.document.version
        })
      });

      const result = await response.json();
      if (result.success) {
        this.document.version = result.document.version;
        this.updateStatus('Saved');
      } else {
        this.updateStatus('Save failed');
      }
    } catch (error) {
      this.updateStatus('Save error');
      console.error('Save error:', error);
    }
  }

  connectWebSocket() {
    const ws = new WebSocket(`ws://localhost:3000?doc=${this.docId}`);

    ws.onopen = () => {
      this.updateStatus('Connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'update' && data.document.version > this.document.version) {
        this.document.content = data.document.content;
        this.document.version = data.document.version;
        this.updateStatus('Updated from server');
      }
    };

    ws.onclose = () => {
      this.updateStatus('Disconnected');
      // Attempt reconnection after delay
      setTimeout(() => this.connectWebSocket(), 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateStatus('Connection error');
    };
  }

  updateStatus(message) {
    if (this.statusIndicator) {
      this.statusIndicator.text = message;
    }
  }

  activate() {
    if (!this.__active) {
      super.activate();
      const { context } = this;

      // Auto-save on content changes (debounced)
      let saveTimeout;
      this.document.on('change', (e) => {
        if (e.field_name === 'content') {
          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            if (this.document.content) {
              this.saveDocument();
            }
          }, 2000); // Save after 2 seconds of no typing
        }
      });
    }
  }
}

DocumentEditor.css = `
.editor-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.doc-title {
  width: 100%;
  padding: 10px;
  font-size: 24px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
}

.content-editor {
  width: 100%;
  height: 400px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
  resize: vertical;
}

.status {
  margin: 10px 0;
  padding: 5px 10px;
  background: #e9ecef;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.save-btn {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.save-btn:hover {
  background: #0056b3;
}
`;

controls.DocumentEditor = DocumentEditor;
module.exports = jsgui;
```

## Advanced Control Patterns

### Custom Data-Bound Controls

```javascript
// client.js - Advanced data-bound controls
const jsgui = require('jsgui3-client');
const { controls, Control, Data_Object, field, mixins } = jsgui;
const { dragable } = mixins;
const Active_HTML_Document = require('jsgui3-server/controls/Active_HTML_Document');

// Data Table with Sorting and Filtering
class DataTable extends Control {
  constructor(spec = {}) {
    spec.__type_name = 'data_table';
    super(spec);
    const { context } = this;

    this.data = spec.data || [];
    this.columns = spec.columns || [];
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.filterText = '';

    this.compose();
  }

  compose() {
    const table = document.createElement('table');
    table.className = 'data-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    this.columns.forEach(column => {
      const th = document.createElement('th');
      th.textContent = column.title;
      th.className = 'sortable';
      th.onclick = () => this.sortBy(column.key);
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Filter input
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filter-container';

    const filterInput = document.createElement('input');
    filterInput.type = 'text';
    filterInput.placeholder = 'Filter...';
    filterInput.className = 'filter-input';
    filterInput.oninput = (e) => {
      this.filterText = e.target.value.toLowerCase();
      this.renderBody(table);
    };

    filterContainer.appendChild(filterInput);
    this.dom.el.appendChild(filterContainer);
    this.dom.el.appendChild(table);

    this.table = table;
    this.renderBody(table);
  }

  sortBy(columnKey) {
    if (this.sortColumn === columnKey) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columnKey;
      this.sortDirection = 'asc';
    }
    this.renderBody(this.table);
  }

  getFilteredAndSortedData() {
    let filtered = this.data;

    if (this.filterText) {
      filtered = this.data.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(this.filterText)
        )
      );
    }

    if (this.sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[this.sortColumn];
        const bVal = b[this.sortColumn];

        let result = 0;
        if (aVal < bVal) result = -1;
        if (aVal > bVal) result = 1;

        return this.sortDirection === 'asc' ? result : -result;
      });
    }

    return filtered;
  }

  renderBody(table) {
    // Remove existing body
    const existingBody = table.querySelector('tbody');
    if (existingBody) {
      existingBody.remove();
    }

    const tbody = document.createElement('tbody');
    const data = this.getFilteredAndSortedData();

    data.forEach(item => {
      const row = document.createElement('tr');

      this.columns.forEach(column => {
        const cell = document.createElement('td');
        const value = item[column.key];

        if (column.renderer) {
          cell.innerHTML = column.renderer(value, item);
        } else {
          cell.textContent = value;
        }

        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
  }

  setData(data) {
    this.data = data;
    this.renderBody(this.table);
  }
}

DataTable.css = `
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.data-table th,
.data-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.data-table th {
  background-color: #f8f9fa;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
}

.data-table th:hover {
  background-color: #e9ecef;
}

.data-table th.sortable::after {
  content: ' ⇅';
  opacity: 0.5;
}

.data-table th.sortable.sorted-asc::after {
  content: ' ↑';
  opacity: 1;
}

.data-table th.sortable.sorted-desc::after {
  content: ' ↓';
  opacity: 1;
}

.filter-container {
  margin-bottom: 10px;
}

.filter-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
`;

// Usage example
class ProductManager extends Active_HTML_Document {
  constructor(spec = {}) {
    spec.__type_name = 'product_manager';
    super(spec);
    const { context } = this;

    this.compose();
    this.loadProducts();
  }

  compose() {
    const container = new controls.Panel({
      context: this.context,
      class: 'product-manager'
    });

    // Add product button
    const addButton = new controls.Button({
      context: this.context,
      text: 'Add Product',
      class: 'add-btn'
    });

    addButton.on('click', () => this.showAddProductDialog());

    // Products table
    this.table = new DataTable({
      context: this.context,
      columns: [
        { key: 'id', title: 'ID' },
        { key: 'name', title: 'Name' },
        { key: 'price', title: 'Price', renderer: (value) => `$${value.toFixed(2)}` },
        { key: 'stock', title: 'Stock' },
        {
          key: 'actions',
          title: 'Actions',
          renderer: (value, item) => `
            <button onclick="editProduct(${item.id})">Edit</button>
            <button onclick="deleteProduct(${item.id})" class="delete">Delete</button>
          `
        }
      ]
    });

    container.add(addButton);
    container.add(this.table);
    this.body.add(container);
  }

  async loadProducts() {
    try {
      const response = await fetch('/api/products');
      const products = await response.json();
      this.table.setData(products);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }

  showAddProductDialog() {
    // Implementation for add product dialog
    alert('Add product functionality would be implemented here');
  }
}

ProductManager.css = `
.product-manager {
  padding: 20px;
}

.add-btn {
  padding: 10px 20px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 20px;
}

.add-btn:hover {
  background: #218838;
}
`;

// Make functions global for inline event handlers
window.editProduct = (id) => {
  alert(`Edit product ${id}`);
};

window.deleteProduct = (id) => {
  if (confirm('Are you sure you want to delete this product?')) {
    alert(`Delete product ${id}`);
  }
};

controls.DataTable = DataTable;
controls.ProductManager = ProductManager;
module.exports = jsgui;
```

## Production Configuration Examples

### Load Balancing Setup

```javascript
// server.js - Production server with clustering
const cluster = require('cluster');
const os = require('os');
const Server = require('jsgui3-server');

if (cluster.isMaster) {
  // Master process
  const numCPUs = os.cpus().length;

  console.log(`Master ${process.pid} is running`);
  console.log(`Starting ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Restart worker
    cluster.fork();
  });

} else {
  // Worker process
  Server.serve({
    ctrl: require('./client').controls.App,
    port: process.env.PORT || 3000,
    debug: false,

    // Production optimizations
    cache: {
      static: { maxAge: 86400 }, // 24 hours
      api: { maxAge: 300 }       // 5 minutes
    },

    compression: true,
    etag: true,

    // Health check endpoint
    api: {
      'health': () => ({
        status: 'ok',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        pid: process.pid
      })
    }
  }).catch(err => {
    console.error(`Worker ${process.pid} failed:`, err);
    process.exit(1);
  });
}
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

USER appuser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "
    const http = require('http');
    const options = { hostname: 'localhost', port: 3000, path: '/api/health', method: 'GET' };
    const req = http.request(options, (res) => {
      if (res.statusCode === 200) process.exit(0);
      else process.exit(1);
    });
    req.on('error', () => process.exit(1));
    req.end();
  "

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  jsgui3-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - jsgui3-app
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app_backend {
        server jsgui3-app:3000;
    }

    server {
        listen 80;
        server_name localhost;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript;

        # Static file caching
        location /css/ {
            proxy_pass http://app_backend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location /js/ {
            proxy_pass http://app_backend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API with shorter cache
        location /api/ {
            proxy_pass http://app_backend;
            expires 5m;
            add_header Cache-Control "public, must-revalidate, proxy-revalidate";
        }

        # Main app
        location / {
            proxy_pass http://app_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Authentication and Security

### JWT-Based Authentication

```javascript
// server.js - Authentication system
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Server = require('jsgui3-server');

// In-memory user store (use database in production)
const users = [
  { id: 1, username: 'admin', password: '$2b$10$...' } // hashed password
];

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

Server.serve({
  pages: {
    '/': {
      content: require('./client').controls.Dashboard,
      title: 'Dashboard'
    },
    '/login': {
      content: require('./client').controls.Login,
      title: 'Login'
    }
  },

  api: {
    'login': async ({ username, password }) => {
      const user = users.find(u => u.username === username);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return { token, user: { id: user.id, username: user.username } };
    },

    'verify-token': ({ token }) => {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { valid: true, user: decoded };
      } catch (error) {
        return { valid: false, error: error.message };
      }
    },

    'protected-data': ({ token }) => {
      const verification = jwt.verify(token, JWT_SECRET);
      if (!verification.valid) {
        throw new Error('Unauthorized');
      }

      // Return protected data
      return { secret: 'This is protected data' };
    }
  },

  // Middleware for authentication
  middleware: [
    (req, res, next) => {
      // Add CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }

      next();
    }
  ],

  port: 3000
});
```

```javascript
// client.js - Client-side authentication
const jsgui = require('jsgui3-client');
const { controls, Control } = jsgui;
const Active_HTML_Document = require('jsgui3-server/controls/Active_HTML_Document');

class Login extends Active_HTML_Document {
  constructor(spec = {}) {
    spec.__type_name = 'login';
    super(spec);
    const { context } = this;

    this.token = localStorage.getItem('authToken');
    if (this.token) {
      // Verify token and redirect if valid
      this.verifyToken();
    } else {
      this.showLoginForm();
    }
  }

  showLoginForm() {
    const form = new controls.Panel({
      context: this.context,
      class: 'login-form'
    });

    const title = new controls.Text({
      context: this.context,
      text: 'Login',
      class: 'form-title'
    });

    this.usernameInput = new controls.Text_Input({
      context: this.context,
      placeholder: 'Username',
      class: 'form-input'
    });

    this.passwordInput = new controls.Text_Input({
      context: this.context,
      placeholder: 'Password',
      type: 'password',
      class: 'form-input'
    });

    this.loginButton = new controls.Button({
      context: this.context,
      text: 'Login',
      class: 'login-btn'
    });

    this.messageDiv = new controls.Text({
      context: this.context,
      text: '',
      class: 'message'
    });

    this.loginButton.on('click', () => this.attemptLogin());

    form.add(title);
    form.add(this.usernameInput);
    form.add(this.passwordInput);
    form.add(this.loginButton);
    form.add(this.messageDiv);

    this.body.add(form);
  }

  async attemptLogin() {
    try {
      this.setMessage('Logging in...');

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.usernameInput.dom.el.value,
          password: this.passwordInput.dom.el.value
        })
      });

      const result = await response.json();

      if (result.token) {
        localStorage.setItem('authToken', result.token);
        this.setMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        this.setMessage('Login failed');
      }
    } catch (error) {
      this.setMessage('Login error: ' + error.message);
    }
  }

  async verifyToken() {
    try {
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.token })
      });

      const result = await response.json();

      if (result.valid) {
        // Token is valid, redirect to dashboard
        window.location.href = '/';
      } else {
        // Token invalid, show login form
        localStorage.removeItem('authToken');
        this.showLoginForm();
      }
    } catch (error) {
      localStorage.removeItem('authToken');
      this.showLoginForm();
    }
  }

  setMessage(text) {
    if (this.messageDiv) {
      this.messageDiv.text = text;
    }
  }
}

Login.css = `
.login-form {
  max-width: 400px;
  margin: 50px auto;
  padding: 30px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.form-title {
  font-size: 24px;
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.login-btn:hover {
  background: #0056b3;
}

.message {
  margin-top: 15px;
  text-align: center;
  min-height: 20px;
}
`;

// Global auth helper
window.Auth = {
  getToken: () => localStorage.getItem('authToken'),

  logout: () => {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  },

  // Add auth headers to fetch requests
  authenticatedFetch: (url, options = {}) => {
    const token = Auth.getToken();
    if (token) {
      options.headers = options.headers || {};
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(url, options);
  }
};

controls.Login = Login;
module.exports = jsgui;
```

These examples demonstrate advanced patterns for building complex applications with JSGUI3 Server, including real-time collaboration, custom controls, production deployment, and authentication systems.