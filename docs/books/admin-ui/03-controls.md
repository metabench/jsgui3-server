# Chapter 3: Controls

## Control Placement Strategy

| Control | Location | Rationale |
|---------|----------|-----------|
| `Property_Viewer` | jsgui3-html | General-purpose read-only property display |
| `Property_Editor` | jsgui3-html | Already exists - editing properties |
| `Object_KVP_Viewer` | jsgui3-html | Already exists - key-value pairs |
| `Object_KVP_Editor` | jsgui3-html | Already exists - editable KVP |
| `Resource_Viewer` | jsgui3-html | General-purpose for any resource with name/type/status |
| `Tree_View` | jsgui3-html | General-purpose hierarchical display |
| `Admin_Page` | jsgui3-server | Server-specific admin shell |
| `Resource_List` | jsgui3-server | Server-specific resource listing |
| `Observables_List` | jsgui3-server | Server-specific observable listing |
| `Observable_Monitor` | jsgui3-server | Server-specific real-time monitoring |
| `Resource_Detail_Page` | jsgui3-server | Server-specific resource detail view |

---

## General-Purpose Controls (jsgui3-html)

### Existing Controls to Leverage

1. **`Property_Editor`** - Edits properties with type-specific inputs
2. **`Object_KVP_Viewer`** - Displays object as key-value pairs
3. **`Object_KVP_Editor`** - Editable key-value pairs

### New Controls Needed in jsgui3-html

#### Property_Viewer

Read-only display of an object's properties in a clean table format.

```javascript
const viewer = new controls.Property_Viewer({
    context,
    data: { name: 'MyResource', type: 'observable', status: 'active' },
    schema: {
        name: { label: 'Name', type: 'string' },
        type: { label: 'Type', type: 'badge' },
        status: { label: 'Status', type: 'status-indicator' }
    }
});
```

#### Resource_Viewer

Displays a resource with icon, name, type badge, and expandable details.

```javascript
const rv = new controls.Resource_Viewer({
    context,
    resource: {
        name: '/api/tick-stream',
        type: 'observable',
        schema: { type: 'int' },
        status: 'active',
        connections: 3
    }
});
```

#### Tree_View

Hierarchical tree with expand/collapse, icons, and selection.

```javascript
const tree = new controls.Tree_View({
    context,
    data: [
        { label: 'Publishers', icon: '📡', children: [...] },
        { label: 'Routes', icon: '🛤️', children: [...] }
    ],
    onSelect: (node) => console.log('Selected:', node)
});
```

---

## Server-Specific Controls (jsgui3-server/admin-ui)

### 1. Admin_Page

The main container control that serves as the Admin UI shell.

```javascript
class Admin_Page extends Active_HTML_Document {
    // Renders sidebar + main panel + header
}
```

**Layout:**
- Left sidebar: `Resource_List` + `Observables_List`
- Main panel: `Resource_Detail_Page` or selected content
- Header: Server name, uptime, connection count

### 2. Resource_List

Displays all registered server resources using `Tree_View`.

**Data Source:** `GET /api/admin/resources`

**Structure:**
```
├── Routes
│   ├── / (webpage)
│   ├── /admin (admin-ui)
│   └── /api/* (function)
├── Publishers
│   ├── HTTP_Website_Publisher
│   └── HTTP_Observable_Publisher
└── Resources
    ├── Server Router
    └── Resource Pool
```

### 3. Observables_List

Lists all published observables with status indicators.

**Data Source:** `GET /api/admin/observables`

**Item Display:**
- Route path
- Schema type badge
- Status indicator (active/paused/stopped)
- Connection count

### 4. Observable_Monitor

Real-time display for a single observable using `Auto_Observable_UI`.

**Features:**
- Play/Pause controls
- History buffer (last N values)
- Schema display
- Export to JSON

### 5. Resource_Detail_Page

Detail view for a selected resource.

**Sections:**
- **Header**: Name, type badge
- **Properties**: Using `Property_Viewer`
- **Actions**: Pause, resume, stop (for observables)
- **Live View**: For observables, embedded monitor

### 6. Config_Panel

Form-based configuration editor using `Property_Editor`.

**Features:**
- Read-only by default (safety)
- Unlock with confirmation for editing
- Validation before save

### 7. Metrics_Dashboard

Displays server health metrics.

**Metrics:**
- Active connections
- Requests/second
- Memory usage
- Observable subscription count

---

## Styling Approach

All controls use CSS-in-JS via the static `.css` property:

```javascript
Admin_Page.css = `
.admin-page {
    display: grid;
    grid-template-columns: 280px 1fr;
    height: 100vh;
    background: #1a1a2e;
}
.admin-sidebar { ... }
.admin-main { ... }
`;
```

## Extension Points

Custom admin panels can be registered:

```javascript
server.admin.registerPanel('MyPanel', MyPanelControl);
```
