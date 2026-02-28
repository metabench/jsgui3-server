# Chapter 12: The Content Model

The previous chapters treated `content` as a reference to a Control constructor — a UI component that renders the page. This chapter expands the model: a **Webpage holds actual content**, not just a pointer to a renderer.

---

## 12.1 Why Content Belongs on the Page

A Webpage that only holds routing metadata (`path`, `title`) and a Control reference leaves a fundamental question unanswered: **where does the text live?**

In the current jsgui3 ecosystem, page text is typically hardcoded inside the Control's `compose()` method:

```js
class AboutPage extends Control {
    compose() {
        const h1 = new Control({ context: this.context, tagName: 'h1' });
        h1.text = 'About Our Company';  // ← text is embedded in the UI
        this.add(h1);
    }
}
```

This works for single-language sites with stable copy, but it breaks down when:

- The same page needs to render in multiple languages
- Content is authored by non-developers (CMS, markdown files, API)
- The same Control layout needs different text for different sites
- A/B testing requires swapping copy without changing the component

**The fix**: the Webpage holds the content, and the Control receives it at render time.

---

## 12.2 Content as Named Strings

The simplest content model is a flat map of named strings:

```js
const page = new Webpage({
    path: '/about',
    title: 'About Us',
    ctrl: AboutCtrl,
    strings: {
        heading: 'About Our Company',
        body: 'We build tools for developers...',
        cta: 'Get Started'
    }
});
```

### Why named strings?

| Property | Benefit |
|----------|---------|
| Explicit keys | Controls reference content by name, not position |
| Serializable | `JSON.stringify(page.strings)` just works |
| Inspectable | Admin UIs can list what content a page expects |
| Diffable | Content changes show up as key-level diffs |
| Translatable | Each key maps independently to translations |

### What counts as a "string"?

Content strings may contain:

- **Plain text**: `'About Our Company'`
- **Markdown**: `'# Welcome\n\nWe build **tools** for developers.'`
- **HTML fragments**: `'<em>Welcome</em> to our site'`

The Webpage does not interpret the content — it stores it. The Control decides how to render it (text node, innerHTML, markdown parser). This separation means the content model is format-agnostic.

---

## 12.3 Structured Content

Named strings are flat. Some pages need structured content — a blog post has a title, author, date, body, and tags. A product page has a name, price, features list, and images.

Two approaches:

### Approach A: Nested strings map

```js
strings: {
    'hero.heading': 'Build Faster',
    'hero.subheading': 'Tools for modern developers',
    'features.0.title': 'Speed',
    'features.0.body': 'Compile in seconds',
    'features.1.title': 'Safety',
    'features.1.body': 'Type-checked by default'
}
```

Flat but uses dot-notation keys. Easy to serialize and translate, but awkward to iterate over feature lists.

### Approach B: Content object

```js
content: {
    hero: {
        heading: 'Build Faster',
        subheading: 'Tools for modern developers'
    },
    features: [
        { title: 'Speed', body: 'Compile in seconds' },
        { title: 'Safety', body: 'Type-checked by default' }
    ]
}
```

Richer structure, maps naturally to component trees. But translation tools need to walk nested objects.

### Recommendation

Support **both**. The Webpage stores a `content` object that can be arbitrarily nested. A convenience `get_string(dotted.path)` method provides flat access when needed:

```js
page.content = { hero: { heading: 'Build Faster' } };
page.get_string('hero.heading');  // → 'Build Faster'
```

This gives structured data for complex pages while keeping simple pages simple.

---

## 12.4 Internationalization (i18n)

### The core model

Each content value can have translations keyed by locale:

```js
const page = new Webpage({
    path: '/about',
    title: { en: 'About Us', fr: 'À propos', de: 'Über uns' },
    ctrl: AboutCtrl,
    content: {
        heading: { en: 'About Our Company', fr: 'À propos de notre entreprise' },
        body: { en: 'We build tools...', fr: 'Nous construisons des outils...' }
    }
});
```

### Locale detection

How does the Webpage know which locale to use? It doesn't — that's a server/runtime concern. The Webpage stores all translations; the caller picks one:

```js
// At render time, the server resolves the locale
const locale = req.acceptsLanguages(['en', 'fr']) || 'en';
const heading = page.get_string('heading', locale);
```

### Fallback chains

Locales fall back through a chain:

```
'en-GB' → 'en' → default (first available)
```

The method `get_string(key, locale)` implements this:

```js
get_string(key, locale) {
    const value = this._resolve_dotted(this.content, key);
    if (value == null) return undefined;

    // Plain string (no translations)
    if (typeof value === 'string') return value;

    // Translated object
    if (typeof value === 'object') {
        // Try exact match
        if (value[locale]) return value[locale];

        // Try language-only (en-GB → en)
        const lang = locale && locale.split('-')[0];
        if (lang && value[lang]) return value[lang];

        // Fallback to first available
        const keys = Object.keys(value);
        return keys.length > 0 ? value[keys[0]] : undefined;
    }

    return String(value);
}
```

### Mixed content (some translated, some not)

A page can mix translated and untranslated strings:

```js
content: {
    heading: { en: 'About', fr: 'À propos' },  // translated
    copyright: '© 2026 JSGUI'                    // not translated
}
```

`get_string('copyright', 'fr')` returns `'© 2026 JSGUI'` — if the value is a plain string, locale is ignored.

### Available locales

```js
get locales() {
    // Walk content tree, collect all locale keys from translated values
}
```

This lets admin UIs show which languages a page supports and identify missing translations.

---

## 12.5 Content vs. Ctrl — Separation of Concerns

The Webpage now has two distinct properties:

| Property | Type | Role |
|----------|------|------|
| `ctrl` | Function (constructor) | **How** the page looks (layout, styling, interaction) |
| `content` | Object | **What** the page says (text, data, translations) |

The Control receives content at render time:

```js
// Server-side rendering
const instance = new page.ctrl({
    context,
    content: page.resolve_content(locale)
});
```

The Control accesses strings through whatever mechanism it prefers:

```js
class AboutCtrl extends Control {
    compose() {
        const spec = this.spec || {};
        const content = spec.content || {};

        const h1 = new Control({ context: this.context, tagName: 'h1' });
        h1.text = content.heading || 'About';
        this.add(h1);
    }
}
```

### What `resolve_content(locale)` returns

A flat or nested object with all strings resolved to the requested locale:

```js
page.resolve_content('fr');
// → { heading: 'À propos de notre entreprise', body: 'Nous construisons...' }
```

This means the Control never sees locale keys — it gets a plain content object. The translation layer is transparent.

---

## 12.6 Title as Content

`title` is a special string — it appears in the `<title>` tag, in navigation, in admin UIs. Under the content model, it should support translation:

```js
const page = new Webpage({
    path: '/about',
    title: { en: 'About Us', fr: 'À propos' }
});

// get_title(locale) resolves like any other string
page.get_title('en');  // → 'About Us'
page.get_title('fr');  // → 'À propos'
page.get_title();      // → first available
```

For backward compatibility, `title` can also be a plain string:

```js
const page = new Webpage({ path: '/', title: 'Home' });
page.get_title('fr');  // → 'Home' (no translation, returns as-is)
```

---

## 12.7 Content Sources

Where does content come from? The Webpage doesn't care — it stores whatever it's given. But common patterns include:

### Inline (hardcoded)

```js
new Webpage({
    path: '/',
    content: { heading: 'Welcome' }
});
```

### From JSON files

```js
const content = require('./content/about.json');
new Webpage({ path: '/about', content });
```

### From a CMS or API (at build time)

```js
const content = await cms.getPage('about');
new Webpage({ path: '/about', content });
```

### From a CMS or API (at serve time)

The server can populate content lazily:

```js
const page = new Webpage({ path: '/about', ctrl: AboutCtrl });
// Content loaded on demand per request
server.on('before-render', async (page, req) => {
    page.content = await cms.getPage('about', req.locale);
});
```

The Webpage supports all of these because it just holds data. The loading strategy is the application's concern.

---

## 12.8 Content and Validation

How does two-stage validation (Chapter 11) apply to content?

### Construction time

- `content` can be `undefined` (set later)
- If present, must be an object (not a string, number, or array)
- No requirement for specific keys

### Finalize time

- Content is **not required** — a page can be purely dynamic (Control renders everything itself)
- If content includes translation objects, warn about inconsistent locale coverage (some keys have `fr`, others don't)
- Title follows the same rules: can be string or translation object

This means content is always optional. Some pages are data-driven (need content), others are interactive (Control-only). Both are valid.

---

## 12.9 Serialization

`toJSON()` includes content for admin introspection:

```js
page.toJSON();
// {
//     path: '/about',
//     title: { en: 'About Us', fr: 'À propos' },
//     has_content: true,
//     content_keys: ['heading', 'body', 'cta'],
//     locales: ['en', 'fr'],
//     is_dynamic: true,
//     ...
// }
```

Note: `toJSON()` includes `content_keys` (what strings exist) and `locales` (what languages), but **not the content values themselves**. Full content is available via `page.content`. This keeps admin summaries lightweight while preserving access to the full data when needed.

---

## 12.10 Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Content storage | Arbitrarily nested object | Supports both flat strings and structured data |
| Translation format | Values are either strings or `{locale: string}` objects | Minimal overhead, no wrapper classes |
| Locale resolution | Fallback chain with `get_string(key, locale)` | Predictable, simple to implement |
| Content required? | No — optional at both stages | Some pages are purely interactive |
| Ctrl receives content how? | Via `spec.content` in constructor | Standard jsgui3 pattern, no new mechanism |
| Title | Supports same translation format | Consistent with content model |
| Format interpretation | None — Webpage stores, Control interprets | Format-agnostic, no coupling to markdown/HTML |

---

## 12.11 Open Questions for Review

These are intentionally left open for other agents to comment on:

1. **Should content support non-string values?** (numbers, booleans, dates) — or should everything be stringified?
2. **Should there be a content schema?** — a way to declare what keys a page expects, so missing translations or typos can be caught
3. **Should `get_string` throw or return undefined for missing keys?** — silent fallback vs. fail-fast
4. **Should the Webpage support content inheritance?** — a base page that provides defaults, overridden by child pages
5. **How should images and media be handled?** — as content values (URLs) or as a separate `assets` property?

---

*Next: [Chapter 13](13-webpage-module-spec.md) defines the complete `jsgui3-webpage` module specification.*
