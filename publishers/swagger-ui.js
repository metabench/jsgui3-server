/**
 * Swagger UI HTML Page Generator for jsgui3-server.
 *
 * Produces a self-contained HTML page that loads
 * [Swagger UI](https://github.com/swagger-api/swagger-ui) from the
 * [unpkg CDN](https://unpkg.com/) and points it at the server's own
 * `/api/openapi.json` endpoint.
 *
 * ## Zero Dependencies
 *
 * No npm packages are installed.  Both the CSS and JavaScript for
 * Swagger UI are loaded at runtime from the CDN, so no build step
 * or bundling is needed.
 *
 * ## Theming
 *
 * Five built-in colour themes are available, switchable at runtime via a
 * dropdown selector in the Swagger UI topbar.  Themes are pure CSS variable
 * swaps using the `[data-theme]` selector on `<html>`.
 *
 * | Theme            | Description                      |
 * |------------------|----------------------------------|
 * | `wlilo`          | Deep obsidian/leather/gold dark  |
 * | `midnight`       | Deep blue-purple dark            |
 * | `light`          | Clean light mode                 |
 * | `nord`           | Nord-inspired muted palette      |
 * | `high-contrast`  | WCAG AAA high-contrast dark      |
 *
 * Selection is persisted in `localStorage` (key: `swagger-theme`).
 * Custom themes can be passed via `options.themes`.
 *
 * ## CSS Variables
 *
 * All themes set these core variables:
 *
 * | Variable             | Purpose            |
 * |----------------------|--------------------|
 * | `--swagger-bg`       | Page background    |
 * | `--swagger-surface`  | Card / block bg    |
 * | `--swagger-border`   | Border colour      |
 * | `--swagger-text`     | Primary text       |
 * | `--swagger-muted`    | Secondary text     |
 * | `--swagger-accent`   | Accent / links     |
 * | `--swagger-danger`   | Required / errors  |
 * | `--swagger-success`  | Success indicators |
 * | `--swagger-code-bg`  | Code block bg      |
 * | `--swagger-code-fg`  | Code block text    |
 * | `--swagger-input-bg` | Input background   |
 *
 * ## CDN Version
 *
 * The major version of Swagger UI loaded from CDN is controlled by the
 * module-level constant `SWAGGER_UI_CDN_VERSION` (currently `'5'`).
 * unpkg resolves this to the latest 5.x release automatically.
 *
 * ## Usage
 *
 * This module is used internally by
 * {@link Swagger_Publisher} and does not normally need to be called directly.
 *
 * ```js
 * const { generate_swagger_html } = require('./publishers/swagger-ui');
 * const html = generate_swagger_html({ title: 'My API' });
 * // → Complete HTML page string
 * ```
 *
 * @module publishers/swagger-ui
 * @see {@link module:openapi} — the spec generator that produces the JSON this page renders.
 * @see {@link module:publishers/swagger-publisher} — the publisher that serves this page.
 */

'use strict';

/**
 * Major version of Swagger UI to load from unpkg CDN.
 *
 * unpkg resolves `swagger-ui-dist@5` to the latest 5.x.y release.
 * Pin to a specific version (e.g. `'5.17.14'`) if reproducibility
 * is more important than auto-updates.
 *
 * @const {string}
 */
const SWAGGER_UI_CDN_VERSION = '5';

/**
 * Built-in theme presets.
 *
 * Each theme is a map of CSS custom property values used throughout
 * the Swagger UI page.  Themes are activated by setting
 * `document.documentElement.dataset.theme` at runtime.
 *
 * @const {Object<string, {label: string, vars: Object<string, string>}>}
 */
const BUILTIN_THEMES = {
    wlilo: {
        label: 'WLILO Dark',
        vars: {
            '--swagger-bg': '#0f1225',
            '--swagger-surface': '#181c35',
            '--swagger-border': '#2a2f52',
            '--swagger-text': '#e0e0f0',
            '--swagger-muted': '#9aa0c8',
            '--swagger-accent': '#c9a84c',
            '--swagger-danger': '#ff6b81',
            '--swagger-success': '#50fa7b',
            '--swagger-code-bg': '#0d0f1e',
            '--swagger-code-fg': '#c9d1d9',
            '--swagger-input-bg': '#0d0f1e',
        }
    },
    midnight: {
        label: 'Midnight',
        vars: {
            '--swagger-bg': '#0b0e1a',
            '--swagger-surface': '#131729',
            '--swagger-border': '#252a45',
            '--swagger-text': '#d4d8ef',
            '--swagger-muted': '#8b92b8',
            '--swagger-accent': '#4facfe',
            '--swagger-danger': '#ef4444',
            '--swagger-success': '#22c55e',
            '--swagger-code-bg': '#090c16',
            '--swagger-code-fg': '#a5b4d4',
            '--swagger-input-bg': '#090c16',
        }
    },
    light: {
        label: 'Light',
        vars: {
            '--swagger-bg': '#f8f9fa',
            '--swagger-surface': '#ffffff',
            '--swagger-border': '#dee2e6',
            '--swagger-text': '#212529',
            '--swagger-muted': '#6c757d',
            '--swagger-accent': '#0d6efd',
            '--swagger-danger': '#dc3545',
            '--swagger-success': '#198754',
            '--swagger-code-bg': '#f1f3f5',
            '--swagger-code-fg': '#212529',
            '--swagger-input-bg': '#ffffff',
        }
    },
    nord: {
        label: 'Nord',
        vars: {
            '--swagger-bg': '#2e3440',
            '--swagger-surface': '#3b4252',
            '--swagger-border': '#4c566a',
            '--swagger-text': '#eceff4',
            '--swagger-muted': '#d8dee9',
            '--swagger-accent': '#88c0d0',
            '--swagger-danger': '#bf616a',
            '--swagger-success': '#a3be8c',
            '--swagger-code-bg': '#2e3440',
            '--swagger-code-fg': '#e5e9f0',
            '--swagger-input-bg': '#2e3440',
        }
    },
    'high-contrast': {
        label: 'High Contrast',
        vars: {
            '--swagger-bg': '#000000',
            '--swagger-surface': '#1a1a1a',
            '--swagger-border': '#ffffff',
            '--swagger-text': '#ffffff',
            '--swagger-muted': '#e0e0e0',
            '--swagger-accent': '#ffff00',
            '--swagger-danger': '#ff4444',
            '--swagger-success': '#00ff00',
            '--swagger-code-bg': '#0a0a0a',
            '--swagger-code-fg': '#ffffff',
            '--swagger-input-bg': '#1a1a1a',
        }
    }
};

/**
 * Build CSS blocks for all themes.
 *
 * Each theme generates a `[data-theme="name"]` selector block that sets
 * the CSS custom properties for that theme.
 *
 * @param {Object} themes - Theme definitions (same shape as BUILTIN_THEMES).
 * @returns {string} CSS text.
 * @private
 */
const build_theme_css = (themes) => {
    const blocks = [];
    for (const [name, theme] of Object.entries(themes)) {
        const vars = Object.entries(theme.vars)
            .map(([k, v]) => `            ${k}: ${v};`)
            .join('\n');
        blocks.push(`        [data-theme="${name}"] {\n${vars}\n        }`);
    }
    return blocks.join('\n');
};

/**
 * Build the JavaScript for the theme selector widget.
 *
 * Injects a `<select>` into the Swagger UI topbar after it renders.
 * Persists selection to `localStorage`.
 *
 * @param {Object} themes - Theme definitions.
 * @param {string} default_theme - Default theme name.
 * @returns {string} JavaScript source.
 * @private
 */
const build_theme_js = (themes, default_theme) => {
    const options_arr = Object.entries(themes).map(([name, t]) =>
        `{ value: ${JSON.stringify(name)}, label: ${JSON.stringify(t.label)} }`
    );
    return `
            // ── Theme Selector ──
            (function() {
                var STORAGE_KEY = 'swagger-theme';
                var DEFAULT_THEME = ${JSON.stringify(default_theme)};
                var themes = [${options_arr.join(', ')}];

                function applyTheme(name) {
                    document.documentElement.setAttribute('data-theme', name);
                    try { localStorage.setItem(STORAGE_KEY, name); } catch(e) {}
                }

                // Apply saved or default theme immediately.
                var saved = null;
                try { saved = localStorage.getItem(STORAGE_KEY); } catch(e) {}
                applyTheme(saved || DEFAULT_THEME);

                // Wait for Swagger UI to render, then inject the selector.
                var attempts = 0;
                var interval = setInterval(function() {
                    attempts++;
                    var topbar = document.querySelector('.swagger-ui .topbar-wrapper');
                    if (!topbar && attempts < 50) return;
                    clearInterval(interval);
                    if (!topbar) return;

                    var wrapper = document.createElement('div');
                    wrapper.className = 'theme-selector';
                    wrapper.style.cssText = 'display:flex;align-items:center;gap:8px;margin-left:auto;padding-right:12px;';

                    var label = document.createElement('span');
                    label.textContent = 'Theme';
                    label.style.cssText = 'font-size:12px;text-transform:uppercase;letter-spacing:0.08em;opacity:0.7;color:var(--swagger-text);';

                    var select = document.createElement('select');
                    select.id = 'theme-select';
                    select.style.cssText = 'background:var(--swagger-input-bg);color:var(--swagger-text);border:1px solid var(--swagger-border);border-radius:6px;padding:6px 10px;font-size:13px;cursor:pointer;outline:none;min-width:130px;';
                    select.setAttribute('aria-label', 'Select theme');

                    themes.forEach(function(t) {
                        var opt = document.createElement('option');
                        opt.value = t.value;
                        opt.textContent = t.label;
                        if (t.value === (saved || DEFAULT_THEME)) opt.selected = true;
                        select.appendChild(opt);
                    });

                    select.addEventListener('change', function() {
                        applyTheme(this.value);
                    });

                    wrapper.appendChild(label);
                    wrapper.appendChild(select);
                    topbar.style.display = 'flex';
                    topbar.style.alignItems = 'center';
                    topbar.appendChild(wrapper);
                }, 100);
            })();`;
};

/**
 * Generate a self-contained Swagger UI HTML page with theme support.
 *
 * The returned string is a complete `<!doctype html>` document that
 * can be served directly as `text/html`.  It:
 *
 * 1. Loads Swagger UI CSS + JS from unpkg CDN.
 * 2. Initialises `SwaggerUIBundle` pointed at `spec_url`.
 * 3. Provides 5 built-in colour themes (default: WLILO dark).
 * 4. Includes a runtime theme selector in the topbar.
 * 5. Persists theme choice to `localStorage`.
 * 6. Replaces the default Swagger logo with "jsgui3 API Docs".
 *
 * @param {Object} [options] - Configuration options.
 * @param {string} [options.spec_url='/api/openapi.json'] - URL of the OpenAPI spec.
 * @param {string} [options.title='API Documentation']    - HTML page title.
 * @param {string} [options.default_theme='wlilo']        - Default theme name.
 * @param {Object} [options.themes]                       - Additional custom themes
 *   in the same `{ name: { label, vars } }` format as BUILTIN_THEMES.
 *   Custom themes are merged with (and can override) built-in themes.
 * @returns {string} Complete HTML page as a string.
 *
 * @example
 * // Default usage (WLILO dark theme, points at /api/openapi.json):
 * const html = generate_swagger_html();
 *
 * @example
 * // Custom title and light theme default:
 * const html = generate_swagger_html({
 *     title: 'My Service API',
 *     default_theme: 'light'
 * });
 *
 * @example
 * // Add a custom theme:
 * const html = generate_swagger_html({
 *     themes: {
 *         ocean: {
 *             label: 'Ocean Blue',
 *             vars: {
 *                 '--swagger-bg': '#0a192f',
 *                 '--swagger-surface': '#112240',
 *                 '--swagger-border': '#233554',
 *                 '--swagger-text': '#ccd6f6',
 *                 '--swagger-muted': '#8892b0',
 *                 '--swagger-accent': '#64ffda',
 *                 '--swagger-danger': '#ff6b6b',
 *                 '--swagger-success': '#64ffda',
 *                 '--swagger-code-bg': '#0a192f',
 *                 '--swagger-code-fg': '#a8b2d1',
 *                 '--swagger-input-bg': '#0a192f',
 *             }
 *         }
 *     }
 * });
 */
const generate_swagger_html = (options = {}) => {
    const spec_url = options.spec_url || '/api/openapi.json';
    const title = options.title || 'API Documentation';
    const default_theme = options.default_theme || 'wlilo';

    // Merge built-in themes with optional custom themes.
    const all_themes = { ...BUILTIN_THEMES };
    if (options.themes && typeof options.themes === 'object') {
        Object.assign(all_themes, options.themes);
    }

    const theme_css = build_theme_css(all_themes);
    const theme_js = build_theme_js(all_themes, default_theme);

    return `<!doctype html>
<html lang="en" data-theme="${esc(default_theme)}">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_CDN_VERSION}/swagger-ui.css" />
    <style>
        /* ── Theme Presets ──────────────────────────────────── */
${theme_css}

        /* ── Shared Layout ──────────────────────────────────── */
        html, body {
            margin: 0;
            padding: 0;
            background: var(--swagger-bg);
            color: var(--swagger-text);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                         Helvetica, Arial, sans-serif;
            transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* ── Topbar ─────────────────────────────────────────── */
        .swagger-ui .topbar {
            background: var(--swagger-surface);
            border-bottom: 1px solid var(--swagger-border);
            padding: 8px 0;
            transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        .swagger-ui .topbar .download-url-wrapper {
            display: flex;
            align-items: center;
        }
        .swagger-ui .topbar .download-url-wrapper .download-url-button {
            background: var(--swagger-accent);
            border: 1px solid var(--swagger-accent);
            color: #fff;
        }

        /* ── Branding ───────────────────────────────────────── */
        .swagger-ui .topbar-wrapper img[alt="Swagger UI"] { display: none; }
        .swagger-ui .topbar-wrapper::before {
            content: 'jsgui3 API Docs';
            color: var(--swagger-accent);
            font-size: 1.1rem;
            font-weight: 600;
            letter-spacing: 0.02em;
        }

        /* ── Info Section ───────────────────────────────────── */
        .swagger-ui .info .title { color: var(--swagger-text); }
        .swagger-ui .info p,
        .swagger-ui .info li,
        .swagger-ui .info table { color: var(--swagger-muted); }

        /* ── Scheme Container ───────────────────────────────── */
        .swagger-ui .scheme-container {
            background: var(--swagger-surface);
            box-shadow: none;
            border: 1px solid var(--swagger-border);
        }

        /* ── Operations ─────────────────────────────────────── */
        .swagger-ui .opblock-tag {
            color: var(--swagger-text);
            border-bottom-color: var(--swagger-border);
        }
        .swagger-ui .opblock {
            border-color: var(--swagger-border);
            background: var(--swagger-surface);
            transition: background-color 0.2s ease;
        }
        .swagger-ui .opblock .opblock-summary {
            border-color: var(--swagger-border);
        }
        .swagger-ui .opblock .opblock-summary-description {
            color: var(--swagger-muted);
        }
        .swagger-ui .opblock-description-wrapper p,
        .swagger-ui .opblock-external-docs-wrapper p,
        .swagger-ui .opblock-title_normal p {
            color: var(--swagger-muted);
        }
        .swagger-ui .opblock .opblock-section-header {
            background: rgba(79, 172, 254, 0.06);
            box-shadow: none;
        }
        .swagger-ui .opblock .opblock-section-header h4 {
            color: var(--swagger-text);
        }

        /* ── Deprecated strike-through + muted ──────────────── */
        .swagger-ui .opblock-deprecated {
            opacity: 0.6;
            border-color: var(--swagger-danger);
        }
        .swagger-ui .opblock-deprecated .opblock-summary-method {
            background: var(--swagger-danger);
        }

        /* ── Tables ─────────────────────────────────────────── */
        .swagger-ui table thead tr td,
        .swagger-ui table thead tr th {
            color: var(--swagger-text);
            border-bottom-color: var(--swagger-border);
        }
        .swagger-ui .parameter__name,
        .swagger-ui .parameter__type {
            color: var(--swagger-muted);
        }
        .swagger-ui .parameter__name.required::after {
            color: var(--swagger-danger);
        }

        /* ── Responses ──────────────────────────────────────── */
        .swagger-ui .response-col_status {
            color: var(--swagger-text);
        }
        .swagger-ui .response-col_description__inner p {
            color: var(--swagger-muted);
        }
        .swagger-ui .responses-inner h4,
        .swagger-ui .responses-inner h5 {
            color: var(--swagger-text);
        }

        /* ── Models ─────────────────────────────────────────── */
        .swagger-ui .model-title { color: var(--swagger-text); }
        .swagger-ui .model { color: var(--swagger-muted); }

        /* ── Form Elements ──────────────────────────────────── */
        .swagger-ui select {
            background: var(--swagger-input-bg);
            color: var(--swagger-text);
            border-color: var(--swagger-border);
        }
        .swagger-ui input[type=text],
        .swagger-ui textarea {
            background: var(--swagger-input-bg);
            color: var(--swagger-text);
            border-color: var(--swagger-border);
        }
        .swagger-ui .btn {
            color: var(--swagger-text);
            border-color: var(--swagger-border);
        }
        .swagger-ui .btn.execute {
            background: var(--swagger-accent);
            border-color: var(--swagger-accent);
            color: #fff;
        }
        .swagger-ui .btn.cancel {
            color: var(--swagger-danger);
            border-color: var(--swagger-danger);
        }

        /* ── Code Blocks ────────────────────────────────────── */
        .swagger-ui .highlight-code .microlight {
            background: var(--swagger-code-bg);
            color: var(--swagger-code-fg);
            border: 1px solid var(--swagger-border);
            border-radius: 6px;
        }
        .swagger-ui .response .renderedMarkdown code {
            background: var(--swagger-code-bg);
            color: var(--swagger-code-fg);
        }

        /* ── Layout ─────────────────────────────────────────── */
        .swagger-ui .wrapper {
            max-width: 1200px;
        }

        /* ── Smooth transitions for theme switching ──────────── */
        .swagger-ui .opblock,
        .swagger-ui .scheme-container,
        .swagger-ui .topbar,
        .swagger-ui .model-container {
            transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
        }

        /* ── Theme Selector widget ──────────────────────────── */
        .theme-selector select:hover {
            border-color: var(--swagger-accent);
        }
        .theme-selector select:focus {
            border-color: var(--swagger-accent);
            box-shadow: 0 0 0 2px rgba(79, 172, 254, 0.25);
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_CDN_VERSION}/swagger-ui-bundle.js" crossorigin></script>
    <script>
        window.onload = function () {
            SwaggerUIBundle({
                url: ${JSON.stringify(spec_url)},
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: 'BaseLayout',
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 2,
                docExpansion: 'list',
                filter: true,
                showExtensions: true,
                showCommonExtensions: true
            });
${theme_js}
        };
    </script>
</body>
</html>`;
};

/**
 * Escape a string for safe inclusion in HTML attributes and text content.
 *
 * Handles the four characters that can break HTML context:
 * `&`, `<`, `>`, and `"`.
 *
 * @param {string} str - The string to escape.
 * @returns {string} HTML-safe string.
 * @private
 */
const esc = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

module.exports = { generate_swagger_html, BUILTIN_THEMES };
