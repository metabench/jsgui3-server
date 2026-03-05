# Bundling System Deep Dive

## Research Track

For the active, chaptered research track on lightweight bundle strategy and unused-module elimination, use:
`docs/books/jsgui3-bundling-research-book/README.md`

## When to Read

This document provides detailed technical documentation of JSGUI3 Server's bundling system. Read this when:
- You need to understand how JavaScript and CSS bundling works internally
- You're debugging bundling issues or performance problems
- You want to extend or modify the bundling system
- You're implementing custom bundlers or build processes
- You need to optimize bundle size or loading performance

**Note:** For basic usage, see [README.md](../README.md). For configuration options, see [docs/configuration-reference.md](docs/configuration-reference.md).

## Overview

JSGUI3 Server uses a sophisticated multi-stage bundling system that:

1. **Extracts CSS** from control class definitions
2. **Bundles JavaScript** using ESBuild
3. **Combines assets** into optimized bundles
4. **Serves content** with proper caching and MIME types

The system is designed to handle the unique requirements of JSGUI3's component-based architecture where CSS is defined as static properties on control classes.

## Architecture Overview

### Key Components

```
Bundling Flow:
Control Classes → CSS Extraction → JS Bundling → Asset Serving
       ↓               ↓              ↓             ↓
   MyControl.css → extractCSS() → bundleJS() → HTTP Response
```

#### Core Classes
- **Advanced_JS_Bundler_Using_ESBuild**: Main bundler orchestrating the process
- **Core_JS_Non_Minifying_Bundler_Using_ESBuild**: Handles JS bundling without minification
- **Core_JS_Single_File_Minifying_Bundler_Using_ESBuild**: Handles minified JS bundling
- **CSS_And_JS_From_JS_String_Extractor**: Extracts CSS from bundled JavaScript

#### Process Flow
1. **Input**: Control classes with static `.css` properties
2. **Stage 1**: Non-minifying JS bundle created
3. **Stage 2**: CSS extracted from the bundle
4. **Stage 3**: Clean JS bundle (without CSS) created
5. **Stage 4**: JS optionally minified
6. **Stage 5**: Final bundles served with proper routes

## Detailed Process Flow

### Stage 1: Initial JS Bundling

```javascript
// From Advanced_JS_Bundler_Using_ESBuild.bundle()
const non_minifying_bundle = await this.non_minifying_bundler.bundle(js_file_path);
```

**What happens:**
- ESBuild processes the input JavaScript file
- Resolves all `require()` and `import` statements
- Includes CSS as string literals in the bundle
- Produces a single JavaScript file with all dependencies

**Output format:**
```javascript
// Bundle contains both JS and CSS as strings
const bundle = {
  _arr: [{
    type: 'JavaScript',
    extension: 'js',
    text: '/* bundled JS with CSS strings */'
  }]
};
```

### Stage 2: CSS Extraction

```javascript
// CSS extraction from the bundle
const extracted = await this.css_and_js_from_js_string_extractor.prepare(bundle);
```

**CSS Extraction Process:**
1. **Parse JavaScript**: AST analysis of the bundled code
2. **Find CSS Assignments**: Locate `ControlClass.css = '...'` patterns
3. **Extract Strings**: Pull CSS content from string literals
4. **Concatenate**: Combine all CSS into single stylesheet

**Technical Details:**
- Uses Babel AST parsing to analyze code structure
- Handles template literals and string concatenation
- Preserves CSS comments and formatting
- Maintains source mapping information

### Stage 3: Clean JS Bundle

```javascript
// Create JS bundle without CSS
const clean_js_bundle = await this.non_minifying_bundler.bundle(js_file_path);
// (CSS extraction logic removes CSS from this bundle)
```

**Process:**
- Re-bundle JavaScript without CSS content
- Ensures clean separation between code and styles
- Prepares for optional minification

### Stage 4: Minification (Optional)

```javascript
// Only in production/debug=false mode
if (!this.debug) {
  const minified = await this.minifying_bundler.bundle(clean_js_file);
  // Apply minification transforms
}
```

**Minification Features:**
- Variable name shortening
- Dead code elimination
- Whitespace removal
- Comment stripping
- Source map generation (in debug mode)

### Stage 5: Route Registration

```javascript
// From HTTP_Webpage_Publisher
for (const item of bundle._arr) {
  const responder = new Static_Route_HTTP_Responder(item);
  server.router.set_route(item.route, responder, responder.handle_http);
}
```

**Route Mapping:**
- `/js/js.js` → Bundled JavaScript
- `/css/css.css` → Extracted CSS
- `/` → Main HTML page

## Control Elimination and Root-Feature Pruning

The ESBuild advanced path includes a `jsgui3-html` control optimizer that:

1. scans reachable entry sources for static control usage,
2. emits a shim that only exports required controls, and
3. rewrites `require('jsgui3-html')` to that shim during bundle build.

By default, this scan also auto-selects optional root exports (`Router`, `Resource` family, `gfx`, `mixins`) when they are actually referenced.

### Static Access Patterns That Stay Optimized

- Dot access: `jsgui.controls.Button`
- Static bracket access: `jsgui.controls['Button']`, `controls['Button']`
- Direct require property access: `require('jsgui3-html').Router`
- Direct require static bracket access: `require('jsgui3-html').controls['Button']`
- Controls alias from static bracket access: `const controls = jsgui['controls']; controls['Button']`
- Resource alias access: `const resource_api = require('jsgui3-html').Resource; resource_api.Compiler`
- Resource alias from static bracket access: `const resource_api = ui['Resource']; resource_api.Compiler`
- Resource alias destructuring: `const { Data_KV } = resource_api`
- Resource alias static bracket access: `resource_api['load_compiler']`

### Dynamic Access Safety

If unresolved dynamic access is detected (for example `controls[name]` where `name` is non-literal), elimination is conservatively disabled for safety.

Manifest reason:

- `dynamic_control_access_detected`

For unresolved dynamic access on a `Resource` alias (for example `resource_api[name]`), control elimination stays enabled, but root-feature pruning conservatively retains the full `Resource` sub-feature family.

Manifest signal:

- `dynamic_resource_access_detected`

### Optional Root-Feature Pruning

Besides controls, the shim now prunes optional `jsgui3-html` root exports unless they are referenced by the entry graph.

Feature groups currently gated:

- `router`
- `resource`
- `resource_pool`
- `resource_data_kv`
- `resource_data_transform`
- `resource_compilation`
- `resource_compiler`
- `resource_load_compiler`
- `gfx`
- `mixins` (also covers `mx`)

The scan manifest includes:

- `selected_controls`
- `selected_root_features`
- `dynamic_control_access_detected`
- `dynamic_resource_access_detected`

for bundle-audit transparency.

`bundle.bundle_analysis.esbuild_warnings` also records normalized esbuild warning metadata (`id`, `text`, `location`) so tests can enforce warning allowlists without parsing console output.

### Concrete Size Example (Raw JS)

For a static-bracket app (`controls['Button']`), measured output showed:

- elimination disabled: `1,051,558` bytes
- elimination enabled: `472,415` bytes
- reduction: `579,143` bytes (`55.07%`)

This figure is raw emitted JavaScript size, not transfer-compressed size.

## Size Metrics: Raw vs Compressed

Two size classes are used in the system and tests:

- Raw bundle size: UTF-8 byte length of emitted JS/CSS text.
- Transfer size: compressed response buffers (`gzip`/`br`) generated by static response-buffer assigners.

Use raw-size metrics to evaluate pruning/minification effectiveness, and compressed-size metrics to evaluate network transfer impact.

## Regression Coverage

Bundling elimination and pruning behavior is covered by:

- `tests/small-controls-bundle-size.test.js`
- `tests/control-elimination-static-bracket-access.test.js`
- `tests/control-elimination-root-feature-pruning.test.js`
- `tests/control-scan-manifest-regression.test.js`
- `tests/bundling-default-control-elimination.puppeteer.test.js`
- `tests/project-local-controls-bundling.puppeteer.test.js`

Key root-feature regression scenarios include:

- controls-only bundle keeps `selected_root_features` empty,
- router/mixins are included only when explicitly referenced,
- aliased `Resource.load_compiler` and `Resource.Compiler` are auto-detected,
- dynamic `Resource` alias bracket access triggers conservative `Resource` family retention without disabling control elimination.

Project-local control coverage includes:

- local `Control` subclasses imported from project files (including transitive local helpers),
- project-local CSS extraction into `/css/css.css`,
- unused `Window` marker elimination in default mode for a project-local app,
- default elimination vs elimination-disabled JS size comparison while preserving project-local rendering.
- esbuild warning-policy checks based on `bundle.bundle_analysis.esbuild_warnings`, failing on unexpected warning headers (allowlisting known `different-path-case` warnings only where expected).

## CSS Extraction Deep Dive

### How CSS Extraction Works

The CSS extraction system analyzes JavaScript code to find CSS definitions:

```javascript
// Input: Control definition
class MyControl extends Active_HTML_Document {
  // ... constructor logic
}

MyControl.css = `
.my-control {
  background: #f0f0f0;
  padding: 20px;
}
`;

// Output: Extracted CSS served at /css/css.css
.my-control {
  background: #f0f0f0;
  padding: 20px;
}
```

### AST Analysis Process

1. **Parse JavaScript** using Babel parser
2. **Traverse AST** looking for assignment expressions
3. **Identify Patterns**:
   - `ClassName.css = "..."` (string literal)
   - `ClassName.css = `...`` (template literal)
   - `ClassName.css = var + "..."` (concatenation)
4. **Extract Content** from string/template literals
5. **Concatenate** all found CSS into single stylesheet

### Edge Cases Handled

- **Template Literals**: Preserves interpolation and multi-line formatting
- **String Concatenation**: Handles `css += "..."` patterns
- **Multiple Classes**: Combines CSS from all control classes
- **Inheritance**: Includes CSS from parent classes
- **Dynamic CSS**: Handles runtime CSS generation (limited)

## ESBuild Integration

### Configuration

```javascript
// Typical ESBuild config used internally
{
  entryPoints: [inputFile],
  bundle: true,
  format: 'iife',  // Immediately Invoked Function Expression
  globalName: 'jsgui',
  sourcemap: debug ? 'inline' : false,
  minify: false,  // Handled separately
  external: [],   // No externals for full bundling
  target: 'es2018'
}
```

### Why ESBuild?

- **Fast**: Written in Go, significantly faster than alternatives
- **Modern**: Native ES module support, tree shaking
- **Flexible**: Supports multiple output formats
- **Reliable**: Battle-tested in production environments
- **Small**: Minimal dependencies

### Bundle Output Format

ESBuild produces JavaScript that can run in browsers:

```javascript
// IIFE format wraps everything in a function
(function() {
  // Bundled code here
  var jsgui = {};
  // ... all dependencies included
})();

// Global assignment makes it available
window.jsgui = jsgui;
```

## Performance Characteristics

### Timing Breakdown

- **CSS Extraction**: 50-200ms (depends on code size)
- **JS Bundling**: 100-500ms (ESBuild is very fast)
- **Minification**: 50-200ms (additional pass)
- **Total**: 200-900ms for first bundle

### Caching Strategy

- **Development**: No caching, rebuild on every request
- **Production**: Cache bundles until server restart
- **Invalidation**: Manual restart required for changes

### Memory Usage

- **Base**: ~50MB for ESBuild process
- **Per Bundle**: +10-50MB depending on dependencies
- **CSS Extraction**: Additional AST parsing overhead

## Error Handling

### Common Errors

#### ESBuild Failures
```
Error: Build failed with 1 error:
input.js:1:0: ERROR: Expected identifier but found "}"
```

**Causes:**
- Syntax errors in JavaScript
- Missing dependencies
- Invalid import paths

**Solutions:**
- Check syntax with `node -c file.js`
- Verify all `require()` paths exist
- Ensure dependencies are installed

#### CSS Extraction Failures
```
Error: Cannot extract CSS from malformed JavaScript
```

**Causes:**
- Invalid JavaScript syntax
- Malformed CSS assignments
- Dynamic CSS generation not supported

**Solutions:**
- Validate JavaScript syntax first
- Check CSS property assignments
- Use static CSS definitions

#### Bundle Size Issues
```
Error: Bundle exceeds size limit
```

**Causes:**
- Large dependencies included
- Missing tree shaking
- Inefficient imports

**Solutions:**
- Use selective imports: `import { specific } from 'large-lib'`
- Exclude unnecessary dependencies
- Consider code splitting

## Extension Points

### Custom Bundlers

```javascript
class CustomBundler extends Advanced_JS_Bundler_Using_ESBuild {
  async bundle(js_file_path) {
    // Custom pre-processing
    const preprocessed = await this.preprocess(js_file_path);

    // Call parent bundling
    const bundle = await super.bundle(preprocessed);

    // Custom post-processing
    return this.postprocess(bundle);
  }
}
```

### Custom CSS Extractors

```javascript
class CustomCSSExtractor {
  async extract(jsBundle) {
    // Custom CSS extraction logic
    // Return { css: string, js: string }
  }
}
```

### Plugin System

```javascript
// Bundler plugins (conceptual)
const bundler = new Advanced_JS_Bundler_Using_ESBuild({
  plugins: [
    {
      name: 'custom-css',
      transform: (css) => transformCSS(css)
    },
    {
      name: 'asset-optimization',
      optimize: (bundle) => optimizeBundle(bundle)
    }
  ]
});
```

## Debugging Bundling Issues

### Enable Debug Mode

```bash
JSGUI_DEBUG=1 node cli.js serve
```

**What this enables:**
- Source maps in bundles
- Verbose logging of bundling steps
- Non-minified output
- Detailed error messages

### Logging Points

Key logging locations in the code:

```javascript
// In Advanced_JS_Bundler_Using_ESBuild
console.log('Starting CSS extraction...');
console.log('CSS extracted, length:', css.length);
console.log('Starting JS bundling...');
console.log('Bundle complete, items:', bundle._arr.length);
```

### Inspect Bundle Content

```javascript
// Add temporary logging
webpage_publisher.on('ready', (bundle) => {
  console.log('Bundle contents:');
  bundle._arr.forEach((item, i) => {
    console.log(`Item ${i}: ${item.type} (${item.text.length} chars)`);
    if (item.type === 'JavaScript') {
      console.log('First 200 chars:', item.text.substring(0, 200));
    }
  });
});
```

### Common Debug Scenarios

#### CSS Not Appearing
1. Check if CSS extraction completed
2. Verify `/css/css.css` route is registered
3. Inspect extracted CSS content
4. Check browser network tab for CSS request

#### JavaScript Errors
1. Enable source maps (debug mode)
2. Check browser console for errors
3. Verify bundle loaded correctly
4. Test with non-minified bundle

#### Bundle Size Issues
1. Analyze bundle content
2. Check for duplicate dependencies
3. Use ESBuild's analyze feature
4. Consider tree shaking configuration

## Optimization Techniques

### Bundle Splitting

```javascript
// Conceptual: Split large bundles
const bundler = new Advanced_JS_Bundler_Using_ESBuild({
  split: {
    vendor: ['jsgui3-client', 'jsgui3-html'],
    app: ['./client.js']
  }
});
```

### Lazy Loading

```javascript
// Dynamic imports for code splitting
const control = await import('./HeavyControl.js');
```

### Asset Optimization

- **Image optimization**: Compress images in bundles
- **Font subsetting**: Include only used characters
- **CSS purging**: Remove unused styles
- **Compression**: Gzip/Brotli compression

### Caching Headers

```javascript
// Set appropriate cache headers
res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
res.setHeader('ETag', generateETag(bundle));
```

## Migration and Compatibility

### Legacy Bundle Paths

**Issue**: Some code references old bundle paths
**Status**: Being cleaned up (see TODO items)
**Workaround**: Update references to use current paths

### ESBuild Version Compatibility

- **Current**: ESBuild v0.x
- **Future**: May upgrade to newer versions
- **Breaking Changes**: Monitor ESBuild changelog

### Browser Compatibility

- **Target**: ES2018 features
- **Polyfills**: Not included (assume modern browsers)
- **Fallback**: Consider transpilation for older browsers

## Future Enhancements

### Planned Improvements

1. **Hot Reload**: Automatic browser refresh on changes
2. **Code Splitting**: Dynamic imports and lazy loading
3. **Asset Optimization**: Image/font optimization
4. **Bundle Analysis**: Size and dependency visualization
5. **Parallel Processing**: Faster bundling with worker threads

### Research Areas

1. **Vite Integration**: Modern development server
2. **SWC Integration**: Faster alternative to ESBuild
3. **Webpack Compatibility**: Migration path for complex builds
4. **Micro-frontend Support**: Bundle splitting for MFAs

## Troubleshooting

### Quick Diagnosis

```bash
# Check if bundling completes
node -e "
const Server = require('./server');
Server.serve({debug: true}).then(() => {
  console.log('Bundling successful');
}).catch(err => {
  console.error('Bundling failed:', err);
});
"
```

### Performance Monitoring

```javascript
// Add timing to bundling
const start = Date.now();
const bundle = await bundler.bundle(file);
console.log(`Bundling took ${Date.now() - start}ms`);
```

### Memory Profiling

```bash
# Monitor Node.js memory usage
node --inspect cli.js serve
# Use Chrome DevTools Memory tab
```

## Conclusion

The JSGUI3 bundling system is a sophisticated pipeline that handles the unique challenges of component-based UI development. Understanding its architecture is crucial for debugging issues and implementing enhancements.

Key takeaways:
- **Multi-stage process**: CSS extraction → JS bundling → optimization
- **ESBuild core**: Fast, reliable JavaScript bundling
- **CSS as code**: Unique approach treating styles as static properties
- **Debugging**: Use debug mode and logging for troubleshooting
- **Performance**: Fast for development, optimizable for production

For issues not covered here, check the [troubleshooting guide](docs/troubleshooting.md) or create an issue in the repository.
