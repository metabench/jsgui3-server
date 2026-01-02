# JSGUI3-HTML Improvement Ideas

This document outlines improvement opportunities for `jsgui3-html` controls based on inspecting the current control catalog under `node_modules/jsgui3-html/controls`.

## Control Inventory Snapshot (Observed)

Source: `node_modules/jsgui3-html/controls/controls.js` and `controls/organised/*`.

### Core (0-core)

- 0-basic / 0-native-compositional
  - button, checkbox, date-picker, dropdown-list, file-upload, icon, radio-button, Select_Options, Text_Input
- 0-basic / 1-compositional
  - calendar, combo-box, context-menu, color-grid, color-palette, grid, list, scroll-view, scrollbar
  - item, item-selector, menu-node, month-view, text-item, Text_Field
  - toggle-button, plus-minus-toggle-button, radio-button-group, timespan-selector
  - status indicators: Indicator, Status_Indicator, Validation_Status_Indicator
- 0-core / 1-advanced
  - Canvas, login, popup-menu-button, string-span

### Standard (1-standard)

- 0-viewer
  - array, object, object-kvp, number, string
- 1-editor
  - form_field / FormField, PropertyEditor / property_editor, Rich_Text_Editor
  - array/object/number/string editors
- 2-misc
  - left-right-arrows-selector, up-down-arrow-buttons
- 3-page
  - standard-web-page, message-web-page
- 4-data
  - data-item, data-row, data-filter
- 5-ui
  - tree, tree-node, file-tree, file-tree-node
  - toolbar, toolbox, horizontal-menu, horizontal-slider
  - line-chart, search-bar, audio-volume, media-scrubber
- 6-layout
  - panel, titled-panel, title-bar, window, modal
  - tabbed-panel, tile-slide, vertical-expander, single-line
  - app/multi-layout-mode

### Showcase (2-showcase)

- icon-library

### Notes / Legacy

- `controls/connected/data-grid.js` exists but is commented out in `controls.js`.
- `controls/old/*` contains historical controls (item, item-view).
- `controls/swaps/notes.md` references progressive enhancement and swapping native controls.
- Naming duplication: `FormField.js` vs `form_field.js`, `PropertyEditor.js` vs `property_editor.js`.

## Improvement Themes

### 1) Add Missing Core Controls

These should be small, reliable building blocks with strong HTML parity and predictable activation.

- Textarea
- Password, email, url, tel inputs
- Number input with stepper (native + stylized)
- Range slider (native) + stepped slider
- Progress bar, meter
- Switch/toggle (native checkbox + styled)
- Chip/tag input
- Inline validation message control
- Breadcrumbs, pagination
- Tooltip/popover
- Notification/toast, alert banner
- Badge/pill

### 2) Data & Collection Controls

The existing data controls are minimal; add richer, reusable data views.

- Data table with sorting, filtering, pagination
- Virtualized list/grid for large datasets
- Tree-table hybrid (folders with columns)
- List reordering (drag-and-drop)
- Master/detail split view
- Data grid should reconnect to `controls/connected/data-grid.js` with a modern API

### 3) Layout + Navigation Expansion

The layout set is strong but missing higher-level patterns.

- Split pane / resizable panes
- Accordion / collapsible sections
- Sidebar + responsive drawer
- Tab variants (vertical, icon tabs, overflow)
- Stepper / wizard layout
- Layout primitives: stack, cluster, center, grid-with-gap

### 4) Form & Editor Features

Existing editors need feature depth, validation, and accessibility.

- Form container with built-in validation routing
- Field-level error display + status badges
- Input masking (date, currency, phone)
- Autosize text field / textarea
- Rich text editor improvements: toolbar, markdown, paste sanitization
- Object editor: expand/collapse, add/remove key-values, schema-driven rendering

### 5) Feature Depth for Existing Controls

Concrete enhancements based on a quick control scan:

- Checkbox: fix `el_radio` typo in change handler, add `checked` sync, keyboard focus state
- Date picker: add min/max, locale formatting, keyboard navigation, week start configuration
- Dropdown/list/combobox: async options, filtering, typeahead, ARIA roles
- Window/panel: snap, dock, maximize, z-index management, resize handles
- Tree/file tree: lazy loading, multi-select, drag reparent, keyboard navigation
- Scrollbar/scroll-view: horizontal + vertical sync, scroll inertia

### 6) Accessibility + Semantics

- Standardize ARIA roles, labels, and keyboard handling
- Focus ring consistency and tab order control
- High contrast mode + reduced motion theme
- Screen reader text for icon-only buttons

### 7) Theming + Styling System

- Token-driven theme layer (color, spacing, radius, typography)
- Control style overrides via theme context
- Light/dark/system themes with CSS variables
- CSS layering: base, component, utility
- Improve `swaps` approach for progressive enhancement of native elements

### 8) Consistency + Packaging

- Normalize naming and case conventions in control filenames
- Reduce duplicate editor components (FormField vs form_field)
- Clarify which controls are core vs showcase
- Provide explicit exports for stable public API

## Suggested Roadmap

### Phase 1: Core and Reliability

- Add missing native inputs (textarea, number, range)
- Fix known control bugs (checkbox `el_radio` reference)
- Normalize control naming duplication
- Basic accessibility pass across core controls

### Phase 2: Data + Forms

- Data table + virtualized list
- Form container + validation hooks
- Object editor improvements

### Phase 3: Layout + UX Features

- Split panes, accordion, responsive drawer
- Enhanced window management
- Theme system and style tokens

## Visual Summary

See `docs/jsgui3-html-improvement-ideas.svg` for an Industrial Luxury Obsidian themed diagram of these ideas.
