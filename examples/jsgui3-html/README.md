# JSGUI3-HTML Example Plans

This folder collects new jsgui3-html focused examples for the server repo.

## Outline plan (10 examples)

1. **01) mvvm-counter**
   - Goal: MVVM binding, computed properties, watchers, transformations, validators.
   - UI: counter display, step input, increment/decrement/reset buttons.
   - Tests: Puppeteer click flows, class toggles, validation states.

2. **02) date-transform**
   - Goal: date transformations, parsing, range validation, locale formatting.
   - UI: ISO input + locale display, min/max validation, error state.

3. **03) form-validation**
   - Goal: multi-field validation (required/email/url/length/pattern).
   - UI: registration form with per-field errors and submit state.

4. **04) data-grid**
   - Goal: collection binding, sorting, filtering, pagination.
   - UI: simple data grid with search and page controls.

5. **05) master-detail**
   - Goal: selection syncing, computed detail view, navigation.
   - UI: list + detail panel with prev/next controls.

6. **06) theming**
   - Goal: theme tokens, theme overrides, CSS variable application.
   - UI: theme toggle with token changes shown in a small layout.

7. **07) mixins**
   - Goal: dragable/resizable/selectable mixins.
   - UI: cards with drag/resize handles and selection states.

8. **08) router**
   - Goal: router contract + route switching.
   - UI: simple nav that swaps controls per route.

9. **09) resource-transform**
   - Goal: Resource + Data_Transform pipeline.
   - UI: load data, transform it, render output with status.

10. **10) binding-debugger**
   - Goal: BindingDebugger usage to inspect bindings and changes.
   - UI: inspector panel showing tracked changes over time.

Examples 01-10 are fully implemented right now.
