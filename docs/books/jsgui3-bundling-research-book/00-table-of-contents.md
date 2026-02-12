# 0. Table of Contents

## Part I: What the Bundler Does Today

1. [Pipeline and Runtime Semantics](01-pipeline-and-runtime-semantics.md)
2. [JavaScript Bundling Core](02-javascript-bundling-core.md)
3. [Style Extraction and CSS Compilation](03-style-extraction-and-css-compilation.md)
4. [Static Publishing and Delivery](04-static-publishing-and-delivery.md)

## Part II: Why Bundles Are Still Larger Than Needed

5. [Current Limits and Size-Bloat Vectors](05-current-limits-and-size-bloat-vectors.md)

## Part III: How to Get to Lightweight Bundles

6. [Unused Module Elimination Strategy](06-unused-module-elimination-strategy.md)
7. [jsgui3-html Control and Mixin Pruning](07-jsgui3-html-control-and-mixin-pruning.md)
8. [Test and Verification Methodology](08-test-and-verification-methodology.md)
9. [Roadmap and Rollout](09-roadmap-and-rollout.md)
10. [Further Research: Strategies and Upgrades](10-further-research-strategies-and-upgrades.md)

## Primary Code Surfaces Referenced

- `publishers/http-webpageorsite-publisher.js`
- `publishers/http-webpage-publisher.js`
- `publishers/helpers/preparers/static/bundle/Static_Routes_Responses_Webpage_Bundle_Preparer.js`
- `publishers/helpers/assigners/static-routes/Single_Control_Webpage_Server_Static_Routes_Assigner.js`
- `publishers/helpers/assigners/static-uncompressed-response-buffers/Single_Control_Webpage_Server_Static_Uncompressed_Response_Buffers_Assigner.js`
- `publishers/helpers/assigners/static-compressed-response-buffers/Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner.js`
- `publishers/helpers/assigners/static-headers/Single_Control_Webpage_Server_Static_Headers_Assigner.js`
- `resources/processors/bundlers/js/esbuild/Advanced_JS_Bundler_Using_ESBuild.js`
- `resources/processors/bundlers/js/esbuild/Core_JS_Non_Minifying_Bundler_Using_ESBuild.js`
- `resources/processors/bundlers/js/esbuild/Core_JS_Single_File_Minifying_Bundler_Using_ESBuild.js`
- `resources/processors/extractors/js/css_and_js/AST_Node/CSS_And_JS_From_JS_String_Using_AST_Node_Extractor.js`
- `resources/processors/bundlers/style-bundler.js`
