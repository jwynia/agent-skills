---
name: npm-package
description: "Build and publish npm packages using Bun as the primary toolchain with npm-compatible output. Use when the user wants to create a new npm library, set up a TypeScript package for publishing, configure build/test/lint tooling for a package, fix CJS/ESM interop issues, or publish to npm. Covers scaffolding, strict TypeScript, Biome + ESLint linting, Vitest testing, Bunup bundling, and publishing workflows. Keywords: npm, package, library, publish, bun, bunup, esm, cjs, exports, typescript, biome, vitest, changesets."
---

# npm Package Development (Bun-First)

Build and publish npm packages using Bun as the primary runtime and toolchain, producing output that works everywhere npm packages are consumed.

## When to Use This Skill

Use when:
- Creating a new npm library package from scratch
- Setting up build/test/lint tooling for an existing package
- Fixing CJS/ESM interop, exports map, or TypeScript declaration issues
- Publishing a package to npm
- Reviewing or improving package configuration

Do NOT use when:
- Building an npx-executable CLI tool (use the `npx-cli` skill)
- Building an application (not a published package)
- Working in a monorepo (this skill targets single-package repos)

## Toolchain

| Concern | Tool | Why |
|---------|------|-----|
| Runtime / package manager | Bun | Fast install, run, transpile |
| Bundler | Bunup | Bun-native, dual output, .d.ts generation |
| Type declarations | Bunup (via tsc) | Integrated with build |
| TypeScript | `module: "nodenext"`, `strict: true` + extras | Maximum correctness for published code |
| Formatting + basic linting | Biome v2 | 10-25x faster than ESLint, single tool |
| Type-aware linting | ESLint + typescript-eslint | 40+ type-aware rules Biome can't do |
| Testing | Vitest | Test isolation, mature mocking, coverage |
| Versioning | Changesets | File-based, explicit, monorepo-ready |
| Publishing | `npm publish --provenance` | Trusted Publishing / OIDC |

## Scaffolding a New Package

Run the scaffold script to generate a complete project:

```bash
bun run <skill-path>/scripts/scaffold.ts ./my-package \
  --name my-package \
  --description "What this package does" \
  --author "Your Name" \
  --license MIT
```

Options:
- `--dual` — Generate dual CJS/ESM output (default: ESM-only)
- `--no-eslint` — Skip ESLint, use Biome only

Then install dependencies:

```bash
cd my-package
bun install
bun add -d bunup typescript vitest @vitest/coverage-v8 @biomejs/biome @changesets/cli
bun add -d eslint typescript-eslint  # unless --no-eslint
```

## Project Structure

```
my-package/
├── src/
│   ├── index.ts            # Package entry point — all public API exports here
│   └── index.test.ts       # Tests co-located with source
├── dist/                   # Built output (gitignored, included in published tarball)
├── .changeset/
│   └── config.json
├── package.json
├── tsconfig.json
├── bunup.config.ts
├── biome.json
├── eslint.config.ts        # Type-aware rules only
├── vitest.config.ts
├── .gitignore
├── README.md
└── LICENSE
```

## Critical Configuration Details

Read these reference docs before modifying any configuration. They contain the reasoning behind each decision and the sharp edges that cause subtle breakage:

- **[reference/esm-cjs-guide.md](./reference/esm-cjs-guide.md)** — `exports` map configuration, dual package hazard, `module-sync`, common mistakes
- **[reference/strict-typescript.md](./reference/strict-typescript.md)** — tsconfig rationale, Biome rules, ESLint type-aware rules, Vitest config
- **[reference/publishing-workflow.md](./reference/publishing-workflow.md)** — Changesets, `files` field, Trusted Publishing, CI pipeline

## Key Rules (Non-Negotiable)

These are the rules that, when violated, cause the most common and painful bugs in published packages. Follow these without exception.

### Package Configuration

1. **Always use `"type": "module"` in package.json.** ESM-only is the correct default. `require(esm)` works in all supported Node.js versions.

2. **Always use `exports` field, not `main`.** `main` is legacy. `exports` gives precise control over what consumers can access.

3. **`types` must be the first condition** in every exports block. TypeScript silently fails to resolve types if it isn't.

4. **Always export `"./package.json": "./package.json"`.** Many tools need access to the package.json and `exports` encapsulates completely.

5. **Use `files: ["dist"]` in package.json.** Whitelist approach prevents shipping secrets. Never use `.npmignore`.

6. **Run `npm pack --dry-run` before every publish.** Verify the tarball contains exactly what you intend.

### TypeScript

7. **Use `module: "nodenext"` for published packages.** Not `"bundler"`. Code satisfying nodenext works everywhere; the reverse is not true.

8. **`strict: true` is non-negotiable.** Without it, your .d.ts files can contain types that error for consumers using strict mode.

9. **Enable `noUncheckedIndexedAccess`.** Catches real runtime bugs from unguarded array/object access.

10. **Ship `declarationMap: true`.** Enables "Go to Definition" to reach original source for consumers.

11. **Do not use path aliases (`paths`) in published packages.** tsc does not rewrite them in emitted code. Consumers can't resolve them.

### Code Quality

12. **`any` is banned.** Use `unknown` and narrow. Suppress with `// biome-ignore suspicious/noExplicitAny: <reason>` only when genuinely unavoidable, and always include the reason.

13. **Prefer named exports over default exports.** Default exports behave differently across CJS/ESM boundaries.

14. **Always use `import type` for type-only imports.** Enforced by both `verbatimModuleSyntax` and Biome's `useImportType` rule.

### Build

15. **Build with Bunup** using `format: ['esm']` (or `['esm', 'cjs']` for dual). Bunup handles .d.ts generation, external detection, and correct file extensions.

16. **Set `engines.node` to `>=20.19.0`** in package.json. This documents the minimum supported Node.js version (first LTS with stable `require(esm)`).

### Testing

17. **Use Vitest, not bun:test.** bun:test lacks test isolation — module mocks leak between files. Vitest runs each test file in its own worker.

18. **Set coverage thresholds** (branches, functions, lines, statements all ≥ 80%). Enforced in vitest.config.ts.

## Development Workflow

```bash
# Write code and tests
bun run test:watch    # Vitest watch mode

# Check everything
bun run lint          # Biome + ESLint
bun run typecheck     # tsc --noEmit
bun run test          # Vitest run

# Build
bun run build         # Bunup → dist/

# Prepare release
bunx changeset        # Create changeset describing changes
bunx changeset version  # Bump version, update CHANGELOG

# Publish
bun run release       # Build + npm publish --provenance
```

## Adding Subpath Exports

When the package needs to expose multiple entry points:

1. Add the source file: `src/utils.ts`
2. Add to bunup.config.ts entry: `entry: ['src/index.ts', 'src/utils.ts']`
3. Add to package.json exports:

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

**Reminder:** Adding or removing export paths is a semver-major change.

## Switching to Dual CJS/ESM Output

If consumers require CJS support for Node.js < 20.19.0:

1. Update bunup.config.ts: `format: ['esm', 'cjs']`
2. Update package.json exports to include `module-sync`, `import`, and `require` conditions
3. See [reference/esm-cjs-guide.md](./reference/esm-cjs-guide.md) for the exact exports map structure

## Bun-Specific Gotchas

- **`bun build` does not generate .d.ts files.** Use Bunup (which delegates to tsc) or run `tsc --emitDeclarationOnly` separately.
- **`bun build` CJS output is experimental.** Always use `target: "node"` for npm-publishable CJS. `target: "bun"` produces Bun-specific wrappers.
- **`bun build` does not downlevel syntax.** Modern ES2022+ syntax ships as-is. If targeting older runtimes, additional transpilation is needed.
- **`bun publish` does not support `--provenance`.** Use `npm publish` for provenance signing.
- **`bun publish` uses `NPM_CONFIG_TOKEN`**, not `NODE_AUTH_TOKEN`. CI pipelines may need adjustment.
