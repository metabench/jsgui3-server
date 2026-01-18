# Overview

JSGUI3 uses a shared control model across server and client. The server renders HTML, bundles JS and CSS, and the client activates controls for interactivity.

## Core Ideas
- Controls are composed on the server, activated in the browser.
- MVVM is supported via data and view models plus watchers and computed fields.
- CSS can live alongside controls and is extracted by the bundler.

## Minimal Vocabulary
- **Control**: UI building block.
- **Active_HTML_Document**: top-level page control for full HTML.
- **Server_Static_Page_Context**: server-side render context for fast validation.
- **Publisher**: serves HTML/JS/CSS to the browser.

## Quick Win
If you only need rendering verification, instantiate a control with `Server_Static_Page_Context` and call `all_html_render()`.
