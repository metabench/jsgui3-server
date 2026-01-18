# Chapter 4: Implementation Plan

## Phase 1: Foundation

### jsgui3-html (General-Purpose)
- [ ] Implement `Property_Viewer` control
- [ ] Implement `Resource_Viewer` control  
- [ ] Implement `Tree_View` control

### jsgui3-server (Admin-Specific)
- [x] Create `admin-ui/client.js` with `Admin_Page`
- [x] Create `admin-ui/server.js` with API routes
- [x] Register `/admin` route in main server

## Phase 2: Resource Browser

- [ ] Implement `Resource_List` using `Tree_View`
- [x] Add API: `GET /api/admin/resources`
- [ ] Implement `Resource_Detail_Page`
- [ ] Wire up selection → detail view

## Phase 3: Observable Visibility

- [ ] Implement `Observables_List` control
- [x] Add API: `GET /api/admin/observables`
- [ ] Implement `Observable_Monitor` with `Auto_Observable_UI`
- [ ] Add play/pause/history features

## Phase 4: Metrics & Config

- [ ] Implement `Metrics_Dashboard`
- [ ] Add API: `GET /api/admin/metrics` (SSE)
- [ ] Implement `Config_Panel` using `Property_Editor`

## Phase 5: Polish

- [ ] Responsive design
- [ ] Keyboard navigation
- [ ] Export/import config
- [ ] Documentation and examples

## File Checklist

| File | Location | Status |
|------|----------|--------|
| `Property_Viewer.js` | jsgui3-html | Planned |
| `Resource_Viewer.js` | jsgui3-html | Planned |
| `Tree_View.js` | jsgui3-html | Planned |
| `admin-ui/client.js` | jsgui3-server | ✅ Done |
| `admin-ui/server.js` | jsgui3-server | ✅ Done |
| `admin-ui/controls/Resource_List.js` | jsgui3-server | Planned |
| `admin-ui/controls/Observables_List.js` | jsgui3-server | Planned |
| `admin-ui/controls/Observable_Monitor.js` | jsgui3-server | Planned |
| `admin-ui/controls/Resource_Detail_Page.js` | jsgui3-server | Planned |

## Success Criteria

1. Navigate to `/admin` and see the Admin UI
2. Browse all server resources in tree view
3. Select a resource to see its properties
4. View live observable streams with auto-generated UIs
5. See basic metrics (connections, uptime)
