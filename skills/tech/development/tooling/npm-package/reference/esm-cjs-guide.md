# ESM/CJS Interoperability Guide

## The Current State (2026)

ESM-only is now the correct default for new packages. `require(esm)` is stable and unflagged in all supported Node.js LTS versions (v20.19.0+, v22.12.0+). Node.js 18 reached EOL in April 2025.

**Default to ESM-only (`"type": "module"`) unless the package has a specific, documented need to support Node.js < 20.19.0.**

## Package.json `exports` Map

### ESM-Only (Preferred)

```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist"]
}
```

### Dual CJS/ESM (When Required)

Use the `module-sync` condition (Node.js 22.10+, backported to 20.19.0) to serve ESM to both `import` and `require()` consumers, eliminating the dual package hazard:

```json
{
  "type": "module",
  "exports": {
    ".": {
      "module-sync": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./package.json": "./package.json"
  }
}
```

## Critical Rules

### `types` Must Be First

Within each condition block, `types` must appear before `default` or any other condition. TypeScript silently fails to resolve types otherwise.

```json
// CORRECT
{ "types": "./dist/index.d.ts", "default": "./dist/index.js" }

// BROKEN — TypeScript won't find types
{ "default": "./dist/index.js", "types": "./dist/index.d.ts" }
```

### `exports` Encapsulates Completely

Once you add an `exports` field, all non-exported paths become inaccessible to consumers. Always explicitly export `"./package.json": "./package.json"` — many tools need it.

### Condition Order Matters

`default` must always be last. Custom conditions go before `import`/`require`. Wrong order silently serves the wrong file to some consumers.

### Prefer Named Exports

Default exports behave differently between CJS and ESM. A CJS consumer doing `const pkg = require('your-pkg')` gets the module namespace, not the default export, unless they use `pkg.default`. Named exports avoid this entirely.

```typescript
// PREFER
export function doThing(): void { /* ... */ }
export const CONFIG = { /* ... */ };

// AVOID as primary API surface
export default class MyThing { /* ... */ }
```

### Changes to `exports` Are Semver-Major

Adding, removing, or restructuring export paths will break some consumer in some environment. Treat exports map changes as breaking.

## The Dual Package Hazard

When Node.js loads both a CJS and ESM copy of the same package (e.g., one dependency `import`s it and another `require()`s it), the package initializes twice. This causes:

- Duplicate state (singletons aren't singletons)
- `instanceof` checks fail across module boundaries
- Side effects run twice

**Solutions (in order of preference):**
1. Ship ESM-only — no hazard possible
2. Use `module-sync` condition — both `import` and `require` resolve to the same ESM file
3. Use a stateless API design where duplicate instantiation doesn't matter

## Subpath Exports

For packages that expose multiple entry points:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./utils": {
      "types": "./dist/utils.d.ts",
      "default": "./dist/utils.js"
    },
    "./package.json": "./package.json"
  }
}
```

Each subpath needs its own types + default pair. The `types` condition must be first in every subpath.

## Common Mistakes

1. **Using `main` instead of `exports`**: `main` is legacy. Use `exports` for all new packages. Only add `main` as a fallback for very old tooling.

2. **Forgetting `"type": "module"`**: Without this, `.js` files are treated as CJS by Node.js, even if they contain ESM syntax.

3. **Using `.mjs`/`.cjs` extensions when unnecessary**: With `"type": "module"`, `.js` is ESM. Only use `.cjs` for the rare CJS file in an ESM package. Avoid `.mjs` in new packages — it causes issues with some tooling.

4. **Path aliases in published code**: `tsc` does not rewrite path aliases (`"@lib/utils"`) in emitted JS or .d.ts files. Consumers can't resolve them. Use Node.js subpath imports (`"#imports"` in package.json) instead, or keep directory structures flat.
