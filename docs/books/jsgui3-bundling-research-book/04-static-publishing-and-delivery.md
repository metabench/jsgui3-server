# 4. Static Publishing and Delivery

## Preparation Chain

`Static_Routes_Responses_Webpage_Bundle_Preparer.prepare(...)` runs:

1. route assignment
2. identity buffer assignment
3. compressed buffer assignment
4. response header assignment

## Route Model

`Single_Control_Webpage_Server_Static_Routes_Assigner` maps by type:

- JavaScript -> `/js/js.js`
- CSS -> `/css/css.css`
- HTML -> `/`

This is deterministic but static; no fingerprinted asset paths yet.

## Encoding Model

`Single_Control_Webpage_Server_Static_Uncompressed_Response_Buffers_Assigner` writes `response_buffers.identity`.

`Single_Control_Webpage_Server_Static_Compressed_Response_Buffers_Assigner` optionally adds:

- `response_buffers.gzip`
- `response_buffers.br`

Configurable controls include `enabled`, `algorithms`, `gzip.level`, `brotli.quality`, and `threshold`.

## Header Model

`Single_Control_Webpage_Server_Static_Headers_Assigner` writes headers per encoding variant under `item.response_headers[encoding]`, including `Content-Length`, `Content-Type`, and `Content-Encoding` where applicable.

## Practical Implication

The delivery layer is currently path-stable and content-encoding-aware but not cache-fingerprint-aware. Lightweight bundles can still be produced, but CDN/browser cache efficiency is constrained by fixed asset names.
