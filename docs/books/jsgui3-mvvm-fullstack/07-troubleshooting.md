# Troubleshooting

## Render Errors
- Use `Server_Static_Page_Context` to reproduce server-side render failures.
- Ensure controls are composed only when `!spec.el`.
- Check that `jsgui.controls` exports your control.

## Bundler Errors
- Verify bundlers call `complete(...)` on both success and error paths.
- Confirm `src_path_client_js` points to `client.js`.
- Review `docs/troubleshooting.md` for known issues.

## Missing Controls
- Confirm the control is exported from `jsgui3-html/controls/controls.js`.
- Verify `jsgui3-client` is using the linked `jsgui3-html`.

## MVVM Binding Not Updating
- Ensure `this.data.model` and `this.view.data.model` are present.
- Confirm `watch` and `computed` are wired after composition.
- Check that input controls use `set_value` and `get_value`.
