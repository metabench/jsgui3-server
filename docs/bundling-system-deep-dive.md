# Bundling System Deep Dive

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