# Stack Map

This chapter gives a quick map of the JSGUI3 stack and the files you touch most often.

## Modules
| Module | Role | Typical Entry |
| --- | --- | --- |
| jsgui3-html | core controls and rendering | `controls/` |
| jsgui3-client | browser activation | `client.js` |
| jsgui3-server | bundling + publishing | `server.js` |

## Key Files
- `server.js`: main server class, publisher wiring
- `static-page-context.js`: server render context
- `controls/Active_HTML_Document.js`: HTML doc wrapper
- `resources/processors/bundlers/`: JS and CSS bundlers
- `publishers/http-webpage-publisher.js`: HTML render + static routes

## Flow Sketch
```
client.js -> JS bundler -> JS/CSS routes -> HTTP_Webpage_Publisher -> browser
   |                |
   |                +-> CSS extraction from control static css
   +-> Active_HTML_Document render on server
```
