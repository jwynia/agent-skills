# Strict TypeScript & Linting Configuration

## TypeScript: `nodenext` for Libraries

Use `module: "nodenext"` for all published packages. Not `"bundler"`.

**Why:** `"bundler"` allows extensionless imports (`import { foo } from "./utils"`) that work in bundlers but crash in Node.js with `ERR_MODULE_NOT_FOUND`. Code satisfying `nodenext` constraints works everywhere; the reverse is not true.

### Recommended tsconfig.json

```jsonc
{
  "compilerOptions": {
    // Module system
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "moduleDetection": "force",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,

    // Output
    "target": "es2022",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "rootDir": "src",
    "outDir": "dist",

    // Strict type safety — ALL of these are non-negotiable for published packages
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    // Build optimization
    "skipLibCheck": true,

    // Interop
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### Key Settings Explained

**`strict: true`** enables `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`, `alwaysStrict`, `useUnknownInCatchVariables`. This is non-negotiable for published packages — without it, your `.d.ts` files can contain types that error when consumers compile with strict mode.

**`noUncheckedIndexedAccess: true`** adds `| undefined` to all index signature access. Not part of `strict`, but catches real runtime bugs where array/object access might be undefined.

**`exactOptionalPropertyTypes: true`** distinguishes between `{ x?: string }` (property may be absent) and `{ x: string | undefined }` (property present but undefined). Catches subtle API design bugs.

**`verbatimModuleSyntax: true`** replaces `isolatedModules` conceptually. Ensures import/export statements are preserved exactly as written — critical for tree-shaking and type-only import elision. Guarantees each file can be independently transpiled (required by esbuild, SWC, Bun).

**`declarationMap: true`** generates `.d.ts.map` files enabling "Go to Definition" to navigate to your original source. Always ship these — they dramatically improve consumer DX.

**`moduleDetection: "force"`** treats every file as a module regardless of whether it has import/export statements. Prevents accidental global script files.

### What NOT to Do

**Don't use path aliases (`paths`) in published packages.** `tsc` does not rewrite path aliases in emitted JS or `.d.ts` files. Your consumers will see unresolvable `"@lib/utils"` imports. Use relative imports or Node.js subpath imports (`#imports` in package.json) instead.

**Don't set `target` lower than `es2022` unless you have a documented reason.** Bun and all supported Node.js versions support ES2022. Lower targets lose features like top-level await and cause-chained errors.

**Don't use `composite: true` for single-package repos.** It's a project-references feature for monorepos and adds unnecessary build artifacts.

## Biome Configuration

Biome handles formatting and syntax-level linting. It's 10-25x faster than ESLint for linting and 25x faster than Prettier for formatting.

### biome.json

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "organizeImports": {
    "enabled": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "useImportType": "error",
        "useConsistentArrayType": {
          "level": "error",
          "options": { "syntax": "generic" }
        },
        "noNamespace": "error"
      },
      "complexity": {
        "noBannedTypes": "error",
        "useOptionalChain": "error"
      },
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "warn",
        "useExhaustiveDependencies": "warn"
      },
      "nursery": {
        "noFloatingPromises": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  }
}
```

### Biome Key Rules for Strict TypeScript

- **`noExplicitAny: "error"`** — Bans `any` type annotations. Use `unknown` and narrow, or use `// biome-ignore suspicious/noExplicitAny: <reason>` when genuinely unavoidable.
- **`useImportType: "error"`** — Enforces `import type` for type-only imports, aligning with `verbatimModuleSyntax`.
- **`noFloatingPromises: "error"`** — Biome v2's first type-aware rule. Catches unhandled promise rejections.
- **`noUnusedImports: "error"`** — Keeps imports clean. Biome auto-fixes these.

### What Biome Cannot Do (Yet)

Biome v2 has exactly one type-aware rule (`noFloatingPromises`). ESLint + typescript-eslint provides 40+ type-aware rules. For strict library authoring, the most impactful missing rules are:

- `no-misused-promises` — Catches promises used in boolean contexts
- `await-thenable` — Catches `await` on non-Promise values
- `no-unsafe-assignment` / `no-unsafe-return` — Catches `any` propagation even from inferred types
- `strict-boolean-expressions` — Catches falsy-value bugs
- `no-unnecessary-condition` — Catches always-truthy/falsy checks

## ESLint: Type-Aware Rules Only

Use ESLint exclusively for type-aware rules that Biome cannot provide. Biome handles everything else.

### eslint.config.ts

```typescript
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', '*.config.*'],
  },
  {
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Disable rules that Biome already covers
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',

      // Keep the type-aware rules that Biome can't do
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/return-await': ['error', 'always'],
    },
  },
);
```

### Why This Hybrid Works

Biome runs in ~50ms for a medium project. ESLint with type-checking runs in 2-10 seconds. By using Biome for all syntax-level checks (fast, in-editor feedback) and ESLint only for type-aware rules (slower, CI and pre-commit), you get:

- Fast editor feedback (Biome)
- Deep type safety (ESLint)
- No rule conflicts (Biome rules disabled in ESLint config)

### Package.json Scripts

```json
{
  "scripts": {
    "lint": "biome check . && eslint src/",
    "lint:fix": "biome check --write . && eslint src/ --fix",
    "format": "biome format --write ."
  }
}
```

## Vitest Configuration

Vitest is the testing framework. It provides test isolation (each file in its own worker), mature mocking, coverage, snapshot testing, and rich IDE integration.

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    include: ['src/**/*.test.ts'],
    typecheck: {
      enabled: true,
    },
  },
});
```

### Test File Convention

Place test files next to the code they test:

```
src/
├── utils.ts
├── utils.test.ts
├── parser.ts
└── parser.test.ts
```

### Running Tests

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```
