# MuAPI Provider Extension for `godot-asset-generator`

## Intent

Extend the existing Godot asset-generation skill with an opt-in MuAPI image provider while
preserving every current provider and the existing CLI/batch interfaces. This is a provider
extension, not a new skill.

## Context

The skill already provides a Deno/TypeScript `generate-image.ts` CLI, a `batch-generate.ts` batch
format, provider-specific documentation, and focused Deno tests in the Atlas Cloud reference PR.
MuAPI is a relevant additional hosted image backend for the same asset-generation workflow.

## Scope

In scope:

- Add `muapi` to the existing single-image and batch provider unions.
- Use the documented MuAPI `flux-dev-image` submit → poll → HTTPS output flow.
- Preserve the existing default behavior and output metadata contract.
- Add provider setup, size, billing, and batch examples to the existing skill documentation.
- Add mocked tests for request construction, polling, output download, and missing credentials.

Out of scope:

- A new skill or new runtime dependency.
- Live generation or API credentials in tests.
- Image editing, reference-image upload, or a second MuAPI model contract.

## Key decisions

- Provider identifier: `muapi`, with `MUAPI_API_KEY` authentication.
- Default endpoint/model: `https://api.muapi.ai/api/v1/flux-dev-image` and Flux Dev.
- Keep the single generation POST non-retryable; bound polling and avoid forwarding the API key to
  the returned CDN URL.
- Convert the existing `WxH` CLI size to MuAPI's documented `W*H` form and validate Flux Dev's
  512–1536 per-side range.
- Keep Codex/other provider defaults unchanged and return the same base64-to-file result shape.

## Validation plan

- Run the focused Deno test file with mocked `fetch`.
- Run `deno check`, `deno lint`, and `deno fmt --check` on changed TypeScript files.
- Run `skills-ref validate` on the existing skill.
- Run `git diff --check`; do not make a live billable generation request.

## Validation Results

- Focused Deno test file: 4 passed.
- Focused `deno check`, `deno lint`, and `deno fmt --check`: passed.
- `git diff --check`: passed.
- Repository-wide `deno task check`, `deno task lint`, and `deno task fmt:check` report existing
  unrelated syntax, lint, and formatting failures outside this skill.
- `skills-ref` is not present in this shallow clone, so skill validation could not run locally.
- No live or billable generation request was made.

## Status

Ready for review — implementation and focused validation completed on 2026-08-20.
