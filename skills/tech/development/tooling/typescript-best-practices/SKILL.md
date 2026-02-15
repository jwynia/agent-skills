---
name: typescript-best-practices
description: "Guide AI agents through TypeScript coding best practices including type safety, error handling, code organization, and architecture patterns. This skill should be used when generating TypeScript code, reviewing TypeScript files, creating new TypeScript modules, refactoring JavaScript to TypeScript, or when the user asks about TypeScript patterns, types, or coding standards. Keywords: typescript, types, coding standards, best practices, type safety, generics, architecture, refactoring."
license: MIT
compatibility: Requires Deno for analysis scripts. Applicable to any TypeScript codebase.
metadata:
  author: agent-skills
  version: "1.0"
  type: utility
  mode: assistive
  domain: development
---

# TypeScript Best Practices

Guide AI agents in writing high-quality TypeScript code. This skill provides coding standards, architecture patterns, and tools for analysis and scaffolding.

## When to Use This Skill

Use this skill when:
- Generating new TypeScript code
- Reviewing TypeScript files for quality issues
- Creating new modules, services, or components
- Refactoring JavaScript to TypeScript
- Answering questions about TypeScript patterns or types
- Designing APIs or interfaces

Do NOT use this skill when:
- Working with pure JavaScript (no TypeScript)
- Debugging runtime errors (use debugging tools)
- Framework-specific patterns (React, Vue, etc. - use framework skills)

## Core Principles

### 1. Type Safety First

Maximize compile-time error detection:

```typescript
// Prefer unknown over any for unknown types
function processInput(data: unknown): string {
  if (typeof data === "string") return data;
  if (typeof data === "number") return String(data);
  throw new Error("Unsupported type");
}

// Explicit return types for public APIs
export function calculateTotal(items: ReadonlyArray<Item>): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Use const assertions for literal types
const CONFIG = {
  mode: "production",
  version: 1,
} as const;
```

### 2. Immutability by Default

Prevent accidental mutations:

```typescript
// Use readonly for object properties
interface User {
  readonly id: string;
  readonly email: string;
  name: string; // Only mutable if intentional
}

// Use ReadonlyArray for collections
function processItems(items: ReadonlyArray<Item>): ReadonlyArray<Result> {
  return items.map(transform);
}

// Prefer spreading over mutation
function updateUser(user: User, name: string): User {
  return { ...user, name };
}
```

### 3. Error Handling with Types

Use the type system for error handling:

```typescript
// Result type for recoverable errors
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

// Typed error classes
class ValidationError extends Error {
  constructor(
    message: string,
    readonly field: string,
    readonly code: string
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// Function with Result return type
function parseConfig(input: string): Result<Config, ValidationError> {
  try {
    const data = JSON.parse(input);
    if (!isValidConfig(data)) {
      return {
        success: false,
        error: new ValidationError("Invalid config", "root", "INVALID_FORMAT"),
      };
    }
    return { success: true, value: data };
  } catch {
    return {
      success: false,
      error: new ValidationError("Parse failed", "root", "PARSE_ERROR"),
    };
  }
}
```

### 4. Code Organization

Structure code for maintainability:

```typescript
// One concept per file
// user.ts - User type and related utilities
export interface User {
  readonly id: string;
  readonly email: string;
  readonly createdAt: Date;
}

export function createUser(email: string): User {
  return {
    id: crypto.randomUUID(),
    email,
    createdAt: new Date(),
  };
}

// Explicit exports (no barrel file wildcards)
// index.ts
export { User, createUser } from "./user.ts";
export { validateEmail } from "./validation.ts";
```

## Quick Reference

| Category | Prefer | Avoid |
|----------|--------|-------|
| Unknown types | `unknown` | `any` |
| Collections | `ReadonlyArray<T>` | `T[]` for inputs |
| Objects | `Readonly<T>` | Mutable by default |
| Null checks | Optional chaining `?.` | `!= null` |
| Type narrowing | Type guards | `as` assertions |
| Return types | Explicit on exports | Inferred on exports |
| Enums | String literal unions | Numeric enums |
| Imports | Named imports | Default imports |
| Errors | Result types | Throwing for flow control |
| Loops | `for...of`, `.map()` | `for...in` on arrays |

## Code Generation Guidelines

When generating TypeScript code, follow these patterns:

### Module Structure

```typescript
/**
 * Module description
 * @module module-name
 */

// === Types ===
export interface ModuleOptions {
  readonly setting: string;
}

export interface ModuleResult {
  readonly data: unknown;
}

// === Constants ===
const DEFAULT_OPTIONS: ModuleOptions = {
  setting: "default",
};

// === Implementation ===
export function processData(
  input: unknown,
  options: Partial<ModuleOptions> = {}
): ModuleResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  // Implementation
  return { data: input };
}
```

### Function Design

```typescript
// Pure functions preferred
function transform(input: Input): Output {
  // No side effects, same input = same output
  return { ...input, processed: true };
}

// Explicit parameter types
function fetchUser(id: string, options?: FetchOptions): Promise<User> {
  // Implementation
}

// Use function overloads for complex signatures
function parse(input: string): ParsedData;
function parse(input: Buffer): ParsedData;
function parse(input: string | Buffer): ParsedData {
  // Implementation
}
```

### Interface Design

```typescript
// Prefer interfaces for object shapes
interface UserData {
  readonly id: string;
  readonly email: string;
}

// Use type for unions and intersections
type UserRole = "admin" | "user" | "guest";
type AdminUser = UserData & { readonly role: "admin" };

// Document with JSDoc
/**
 * Configuration for the API client
 * @property baseUrl - The base URL for API requests
 * @property timeout - Request timeout in milliseconds
 */
interface ApiConfig {
  readonly baseUrl: string;
  readonly timeout?: number;
}
```

## Common Anti-Patterns

Avoid these patterns when generating code:

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| `any` type | Disables type checking | Use `unknown` and narrow |
| `as` assertions | Runtime errors | Use type guards |
| Non-null `!` | Null pointer errors | Optional chaining `?.` |
| Mutable params | Unexpected mutations | `Readonly<T>` |
| Magic strings | Typos, no autocomplete | String literal types |
| God classes | Hard to test/maintain | Single responsibility |
| Circular deps | Build/runtime issues | Dependency inversion |
| Index signatures | Lose type info | Explicit properties |

See `references/anti-patterns/common-mistakes.md` for detailed examples.

## Scripts Reference

### analyze.ts

Analyze TypeScript code for quality issues:

```bash
deno run --allow-read scripts/analyze.ts <path> [options]

Options:
  --strict        Enable all checks
  --json          Output JSON for programmatic use
  --fix-hints     Show suggested fixes

Examples:
  # Analyze a file
  deno run --allow-read scripts/analyze.ts ./src/utils.ts

  # Analyze directory with strict mode
  deno run --allow-read scripts/analyze.ts ./src --strict

  # JSON output for CI
  deno run --allow-read scripts/analyze.ts ./src --json
```

### generate-types.ts

Generate TypeScript types from JSON data:

```bash
deno run --allow-read --allow-write scripts/generate-types.ts <input> [options]

Options:
  --name <name>   Root type name (default: inferred)
  --output <path> Output file path
  --readonly      Generate readonly types
  --interface     Use interface instead of type

Examples:
  # Generate from JSON file
  deno run --allow-read scripts/generate-types.ts ./data.json --name Config

  # Generate readonly interface
  deno run --allow-read --allow-write scripts/generate-types.ts ./api-response.json \
    --interface --readonly --output ./types/api.ts
```

### scaffold-module.ts

Create properly structured TypeScript modules:

```bash
deno run --allow-read --allow-write scripts/scaffold-module.ts [options]

Options:
  --name <name>   Module name (required)
  --path <path>   Target directory (default: ./src)
  --type <type>   Type: service, util, component
  --with-tests    Include test file

Examples:
  # Create a utility module
  deno run --allow-read --allow-write scripts/scaffold-module.ts \
    --name "string-utils" --type util

  # Create a service with tests
  deno run --allow-read --allow-write scripts/scaffold-module.ts \
    --name "user-service" --type service --with-tests
```

## Additional Resources

### Type System Deep Dives
- `references/type-system/advanced-types.md` - Generics, conditional types, mapped types
- `references/type-system/type-guards.md` - Type narrowing techniques
- `references/type-system/utility-types.md` - Built-in utility types

### Pattern Guides
- `references/patterns/error-handling.md` - Result types, typed errors
- `references/patterns/async-patterns.md` - Async/await best practices
- `references/patterns/functional-patterns.md` - Immutability, composition
- `references/patterns/module-patterns.md` - Exports, dependency injection

### Architecture
- `references/architecture/project-structure.md` - Directory organization
- `references/architecture/api-design.md` - Interface design, versioning

### Templates
- `assets/templates/module-template.ts.md` - Module starter template
- `assets/templates/service-template.ts.md` - Service class template
- `assets/tsconfig-presets/strict.json` - Maximum strictness config
- `assets/tsconfig-presets/recommended.json` - Balanced defaults
