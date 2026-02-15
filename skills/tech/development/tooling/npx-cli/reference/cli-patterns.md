# CLI Package Patterns

## Bin Entry Point Configuration

### package.json `bin` Field

```json
{
  "bin": {
    "my-cli": "./dist/cli.js"
  }
}
```

For single-command CLIs where the binary name matches the package name:

```json
{
  "bin": "./dist/cli.js"
}
```

### Critical Rules

1. **Always use `#!/usr/bin/env node`** in the compiled output — never `#!/usr/bin/env bun`. Bun is not installed for the vast majority of npm/npx users. The shebang must target Node.js for universal compatibility.

2. **Point `bin` at compiled JavaScript in `dist/`**, never at TypeScript source. npx consumers won't have your build toolchain.

3. **Build with `--target node`** to ensure Node.js runtime compatibility.

4. **Ensure the bin file is executable.** The build script should `chmod +x dist/cli.js` after compilation, or the scaffold's build step should handle this.

### Bunup Configuration for CLI

```typescript
import { defineConfig } from 'bunup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',  // Library exports (if any)
    cli: 'src/cli.ts',      // CLI entry point
  },
  format: ['esm'],
  dts: true,
  clean: true,
  // Bunup adds shebang to bin entries automatically when
  // it detects them in package.json. If not, add manually:
  banner: {
    js: '#!/usr/bin/env node',
  },
});
```

**Note:** If the CLI is the only entry point (no library exports), simplify to a single entry:

```typescript
import { defineConfig } from 'bunup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  dts: false,  // No types needed for CLI-only packages
  clean: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
});
```

## Argument Parsing with citty

citty is a lightweight (~3KB), TypeScript-native argument parser from the UnJS ecosystem. It's built on Node.js's native `util.parseArgs`.

### Basic Structure

```typescript
// src/cli.ts
import { defineCommand, runMain } from 'citty';

const main = defineCommand({
  meta: {
    name: 'my-cli',
    version: '1.0.0',
    description: 'What this CLI does',
  },
  args: {
    input: {
      type: 'positional',
      description: 'Input file path',
      required: true,
    },
    output: {
      alias: 'o',
      type: 'string',
      description: 'Output file path',
      default: './output',
    },
    verbose: {
      alias: 'v',
      type: 'boolean',
      description: 'Enable verbose output',
      default: false,
    },
  },
  run({ args }) {
    // args is fully typed: { input: string; output: string; verbose: boolean }
    console.log(`Processing ${args.input} → ${args.output}`);
  },
});

runMain(main);
```

### Sub-Commands

```typescript
import { defineCommand, runMain } from 'citty';

const init = defineCommand({
  meta: { name: 'init', description: 'Initialize a new project' },
  args: {
    template: {
      alias: 't',
      type: 'string',
      description: 'Template to use',
      default: 'default',
    },
  },
  run({ args }) {
    console.log(`Initializing with template: ${args.template}`);
  },
});

const build = defineCommand({
  meta: { name: 'build', description: 'Build the project' },
  args: {
    watch: {
      alias: 'w',
      type: 'boolean',
      description: 'Watch for changes',
      default: false,
    },
  },
  run({ args }) {
    console.log(`Building${args.watch ? ' (watch mode)' : ''}...`);
  },
});

const main = defineCommand({
  meta: {
    name: 'my-cli',
    version: '1.0.0',
    description: 'My CLI tool',
  },
  subCommands: { init, build },
});

runMain(main);
```

### Why citty Over Alternatives

- **citty**: ~3KB, TypeScript-native types, built on `util.parseArgs`, auto-generated help, `runMain()` handles errors gracefully. Best for new projects.
- **commander**: Most widely used, imperative API, massive community. Better if you need extensive documentation/examples from the ecosystem.
- **yargs**: Feature-rich, ~200KB+, excellent validation. Overkill for most CLIs.

## Error Handling

### `runMain()` Pattern

citty's `runMain()` automatically:
- Catches unhandled errors and prints clean messages (no stack traces)
- Handles `--help` and `--version` flags
- Exits with appropriate codes

For custom error handling:

```typescript
import { defineCommand, runMain } from 'citty';
import process from 'node:process';

const main = defineCommand({
  meta: { name: 'my-cli', version: '1.0.0' },
  run() {
    // Your logic here
  },
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nInterrupted. Cleaning up...');
  // Cleanup logic
  process.exit(130);
});

// Unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unexpected error:', error instanceof Error ? error.message : error);
  if (process.env['DEBUG']) {
    console.error(error);
  }
  process.exit(1);
});

runMain(main);
```

### Exit Codes

- `0` — Success
- `1` — General error
- `2` — Misuse of command (bad arguments)
- `130` — SIGINT (Ctrl+C)

## Terminal Output

### Colors: picocolors

```typescript
import pc from 'picocolors';

console.log(pc.green('✓ Success'));
console.log(pc.red('✗ Error: file not found'));
console.log(pc.yellow('⚠ Warning: deprecated option'));
console.log(pc.dim('  Processing files...'));
```

picocolors is ~7KB, supports CJS and ESM, auto-detects color support. No chained API — use template literals for combinations: `` pc.bold(pc.red('Error')) ``.

For chained styles or Truecolor support, use **ansis** instead.

**Note:** Node.js v22+ includes `util.styleText()` for zero-dependency coloring. Consider it if you want to eliminate the picocolors dependency for Node.js 22+ targets.

### Spinners: nanospinner

```typescript
import { createSpinner } from 'nanospinner';

const spinner = createSpinner('Processing...').start();
// ... do work ...
spinner.success({ text: 'Done!' });
// or
spinner.error({ text: 'Failed!' });
```

## Dual Library + CLI Package

Some packages export both a programmatic API and a CLI. Structure these as:

```
src/
├── index.ts    # Library exports (public API)
├── cli.ts      # CLI entry point (imports from index.ts)
└── internal/   # Shared implementation
```

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "bin": {
    "my-cli": "./dist/cli.js"
  }
}
```

The CLI entry (`cli.ts`) imports from the library entry (`index.ts`) — never the reverse. This keeps the library tree-shakeable and the CLI as a thin wrapper.

## Testing CLI Commands

### Unit Test the Logic, Not the CLI

Separate business logic from CLI argument handling:

```typescript
// src/core.ts — pure logic, fully testable
export function processInput(input: string, options: ProcessOptions): Result {
  // ...
}

// src/cli.ts — thin CLI wrapper
import { processInput } from './core.js';

const main = defineCommand({
  // ...
  run({ args }) {
    const result = processInput(args.input, { verbose: args.verbose });
    console.log(result);
  },
});
```

### Integration Test the CLI Binary

For end-to-end CLI tests, spawn the built binary:

```typescript
import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

describe('CLI', () => {
  it('prints help', async () => {
    const { stdout } = await exec('node', ['./dist/cli.js', '--help']);
    expect(stdout).toContain('my-cli');
  });

  it('processes input', async () => {
    const { stdout } = await exec('node', ['./dist/cli.js', 'input.txt', '-o', 'output.txt']);
    expect(stdout).toContain('Processing');
  });

  it('exits with error on missing input', async () => {
    await expect(exec('node', ['./dist/cli.js'])).rejects.toThrow();
  });
});
```
