---
name: npx-cli
description: "Build and publish npx-executable CLI tools using Bun as the primary toolchain with npm-compatible output. Use when the user wants to create a new CLI tool, set up a command-line package for npx execution, configure argument parsing and terminal output, or publish a CLI to npm. Covers scaffolding, citty arg parsing, sub-commands, terminal UX, strict TypeScript, Biome + ESLint linting, Vitest testing, Bunup bundling, and publishing workflows. Keywords: npx, cli, command-line, binary, bin, tool, bun, citty, commander, terminal, publish, typescript, biome, vitest."
---

# npx CLI Tool Development (Bun-First)

Build and publish npx-executable command-line tools using Bun as the primary runtime and toolchain, producing binaries that work for all npm/npx users (Node.js runtime).

## When to Use This Skill

Use when:
- Creating a new CLI tool from scratch
- Building an npx-executable binary
- Setting up argument parsing, sub-commands, or terminal UX for a CLI
- Publishing a CLI tool to npm
- Adding a CLI to an existing library package

Do NOT use when:
- Building a library without a CLI (use the `npm-package` skill)
- Building an application (not a published package)
- Working in a monorepo (this skill targets single-package repos)

## Toolchain

| Concern | Tool | Why |
|---------|------|-----|
| Runtime / package manager | Bun | Fast install, run, transpile |
| Bundler | Bunup | Bun-native, dual entry (lib + cli), .d.ts |
| Argument parsing | citty | ~3KB, TypeScript-native, auto-help, `runMain()` |
| Terminal colors | picocolors | ~7KB, CJS+ESM, auto-detect |
| TypeScript | `module: "nodenext"`, `strict: true` + extras | Maximum correctness |
| Formatting + basic linting | Biome v2 | Fast, single tool |
| Type-aware linting | ESLint + typescript-eslint | Deep type safety |
| Testing | Vitest | Isolation, mocking, coverage |
| Versioning | Changesets | File-based, explicit |
| Publishing | `npm publish --provenance` | Trusted Publishing / OIDC |

## Scaffolding a New CLI

Run the scaffold script:

```bash
bun run <skill-path>/scripts/scaffold.ts ./my-cli \
  --name my-cli \
  --bin my-cli \
  --description "What this CLI does" \
  --author "Your Name" \
  --license MIT
```

Options:
- `--bin <name>` — Binary name for npx (defaults to package name without scope)
- `--cli-only` — No library exports, CLI binary only
- `--no-eslint` — Skip ESLint, use Biome only

Then install dependencies:

```bash
cd my-cli
bun install
bun add -d bunup typescript vitest @vitest/coverage-v8 @biomejs/biome @changesets/cli
bun add citty picocolors
bun add -d eslint typescript-eslint  # unless --no-eslint
```

## Project Structure

### Dual (Library + CLI) — Default

```
my-cli/
├── src/
│   ├── index.ts            # Library exports (programmatic API)
│   ├── index.test.ts       # Unit tests for library
│   ├── cli.ts              # CLI entry point (imports from index.ts)
│   └── cli.test.ts         # CLI integration tests
├── dist/
│   ├── index.js            # Library bundle
│   ├── index.d.ts          # Type declarations
│   └── cli.js              # CLI binary (with shebang)
├── .changeset/
│   └── config.json
├── package.json
├── tsconfig.json
├── bunup.config.ts
├── biome.json
├── eslint.config.ts
├── vitest.config.ts
├── .gitignore
├── README.md
└── LICENSE
```

### CLI-Only (No Library Exports)

Same structure minus `src/index.ts` and `src/index.test.ts`. No `exports` field in package.json, only `bin`.

## Architecture Pattern

**Separate logic from CLI wiring.** The CLI entry (`cli.ts`) is a thin wrapper that:
1. Parses arguments with citty
2. Calls into the library/core modules
3. Formats output for the terminal

All business logic lives in importable modules (`index.ts` or internal modules). This makes logic unit-testable without spawning processes.

```
cli.ts → imports from → index.ts / core modules
                              ↑
                         unit tests
```

## Key Rules (Non-Negotiable)

All rules from the npm-package skill apply here. These additional rules are specific to CLI packages:

### Binary Configuration

1. **Always use `#!/usr/bin/env node` in published bin files.** Never `#!/usr/bin/env bun`. The vast majority of npx users don't have Bun installed.

2. **Point `bin` at compiled JavaScript in `dist/`.** Never at TypeScript source. npx consumers won't have your build toolchain.

3. **Ensure the bin file is executable.** The build script includes `chmod +x dist/cli.js` after compilation.

4. **Build with Node.js as the target.** Bunup's output must run on Node.js, not require Bun runtime features.

### Package Configuration

5. **Always use `"type": "module"` in package.json.**

6. **`types` must be the first condition** in every exports block.

7. **Use `files: ["dist"]`.** Whitelist only.

8. **For dual packages (library + CLI):** The `exports` field exposes the library API. The `bin` field exposes the CLI. They are independent — `bin` is NOT part of `exports`.

### Code Quality

9. **`any` is banned.** Use `unknown` and narrow.

10. **Use `import type` for type-only imports.**

11. **Handle errors gracefully.** CLI users should never see raw stack traces. Use citty's `runMain()` which handles this automatically, plus `process.on('SIGINT', ...)` for cleanup.

12. **Exit with appropriate codes.** 0 for success, 1 for errors, 2 for bad arguments, 130 for SIGINT.

## Reference Documentation

Read these before modifying configuration:

- **[reference/cli-patterns.md](./reference/cli-patterns.md)** — bin setup, citty patterns, sub-commands, error handling, terminal UX, testing CLI binaries
- **[reference/esm-cjs-guide.md](./reference/esm-cjs-guide.md)** — `exports` map, dual package hazard, common mistakes
- **[reference/strict-typescript.md](./reference/strict-typescript.md)** — tsconfig, Biome rules, ESLint type-aware rules, Vitest config
- **[reference/publishing-workflow.md](./reference/publishing-workflow.md)** — Changesets, `files` field, Trusted Publishing, CI pipeline

## Argument Parsing with citty

### Single Command

```typescript
import { defineCommand, runMain } from 'citty';

const main = defineCommand({
  meta: { name: 'my-cli', version: '1.0.0', description: '...' },
  args: {
    input: { type: 'positional', description: 'Input file', required: true },
    output: { alias: 'o', type: 'string', description: 'Output path', default: './out' },
    verbose: { alias: 'v', type: 'boolean', description: 'Verbose output', default: false },
  },
  run({ args }) {
    // args is fully typed
  },
});

void runMain(main);
```

### Sub-Commands

```typescript
import { defineCommand, runMain } from 'citty';

const init = defineCommand({ meta: { name: 'init' }, /* ... */ });
const build = defineCommand({ meta: { name: 'build' }, /* ... */ });

const main = defineCommand({
  meta: { name: 'my-cli', version: '1.0.0' },
  subCommands: { init, build },
});

void runMain(main);
```

See [reference/cli-patterns.md](./reference/cli-patterns.md) for complete examples including error handling, colors, and spinners.

## Testing Strategy

### Unit Tests — Test the Logic

```typescript
// src/index.test.ts
import { describe, it, expect } from 'vitest';
import { processInput } from './index.js';

describe('processInput', () => {
  it('handles valid input', () => {
    expect(processInput('test')).toBe('expected');
  });
});
```

### Integration Tests — Test the Binary

Build first (`bun run build`), then spawn the compiled binary:

```typescript
// src/cli.test.ts
import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

describe('CLI', () => {
  it('prints help', async () => {
    const { stdout } = await exec('node', ['./dist/cli.js', '--help']);
    expect(stdout).toContain('my-cli');
  });
});
```

## Development Workflow

```bash
# Write code and tests
bun run test:watch    # Vitest watch mode

# Check everything
bun run lint          # Biome + ESLint
bun run typecheck     # tsc --noEmit
bun run test          # Vitest

# Build and try the CLI locally
bun run build
node ./dist/cli.js --help
node ./dist/cli.js some-input

# Prepare release
bunx changeset
bunx changeset version

# Publish
bun run release       # Build + npm publish --provenance
```

## Adding Sub-Commands Later

1. Create a new file per sub-command: `src/commands/init.ts`, `src/commands/build.ts`
2. Each exports a `defineCommand()` result
3. Import and wire into the main command's `subCommands`
4. Keep logic in testable modules, commands are thin wrappers

## Converting a CLI-Only Package to Dual (Library + CLI)

1. Create `src/index.ts` with the public API
2. Update bunup.config.ts to include both entry points
3. Add `exports` field to package.json alongside the existing `bin`
4. Add .d.ts generation: `dts: { entry: ['src/index.ts'] }`

## Bun-Specific Gotchas

- **`bun build` does not generate .d.ts files.** Use Bunup or `tsc --emitDeclarationOnly`.
- **`bun build` does not downlevel syntax.** ES2022+ ships as-is.
- **`bun publish` does not support `--provenance`.** Use `npm publish`.
- **`bun publish` uses `NPM_CONFIG_TOKEN`**, not `NODE_AUTH_TOKEN`.
- **Never use `#!/usr/bin/env bun` in published packages.** Your users don't have Bun.
- **Bunup `banner` adds the shebang to ALL output files**, including the library entry. If this is a problem, use a post-build script to add the shebang only to `dist/cli.js`.
