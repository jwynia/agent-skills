# Project Structure

Best practices for organizing TypeScript projects, directory structure, and configuration.

## Directory Structures

### Small Project

```
my-app/
├── src/
│   ├── index.ts          # Entry point
│   ├── types.ts          # Shared types
│   ├── utils.ts          # Utility functions
│   └── config.ts         # Configuration
├── tests/
│   └── index.test.ts
├── package.json
└── tsconfig.json
```

### Medium Project (Feature-Based)

```
my-app/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── index.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.types.ts
│   │   │   └── auth.test.ts
│   │   ├── users/
│   │   │   ├── index.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.types.ts
│   │   │   └── user.test.ts
│   │   └── products/
│   │       └── ...
│   ├── shared/
│   │   ├── types/
│   │   │   └── common.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   └── formatting.ts
│   │   └── constants.ts
│   ├── config/
│   │   ├── index.ts
│   │   └── env.ts
│   └── index.ts
├── tests/
│   └── integration/
├── package.json
└── tsconfig.json
```

### Large Project (Layer-Based)

```
my-app/
├── src/
│   ├── domain/                 # Business logic, entities
│   │   ├── user/
│   │   │   ├── user.entity.ts
│   │   │   ├── user.types.ts
│   │   │   └── user.errors.ts
│   │   └── order/
│   │       └── ...
│   ├── application/            # Use cases, services
│   │   ├── user/
│   │   │   ├── user.service.ts
│   │   │   ├── user.commands.ts
│   │   │   └── user.queries.ts
│   │   └── order/
│   │       └── ...
│   ├── infrastructure/         # External concerns
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   └── repositories/
│   │   ├── api/
│   │   │   └── clients/
│   │   ├── cache/
│   │   │   └── redis.ts
│   │   └── messaging/
│   │       └── queue.ts
│   ├── presentation/           # UI, controllers, routes
│   │   ├── http/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── controllers/
│   │   └── graphql/
│   │       └── resolvers/
│   ├── shared/                 # Cross-cutting concerns
│   │   ├── types/
│   │   ├── utils/
│   │   └── errors/
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── tsconfig.json
```

## File Naming Conventions

### Consistent Naming

```
# Kebab-case for files (recommended)
user-service.ts
user-repository.ts
http-client.ts

# Or dot notation for type indication
user.service.ts
user.repository.ts
user.types.ts
user.test.ts

# Index files for public API
feature/
├── index.ts           # Re-exports public API
├── internal.ts        # Internal helpers (not exported)
└── feature.ts         # Implementation
```

### Type File Organization

```typescript
// user.types.ts - All types for user feature

// Entities
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
}

// DTOs
export interface CreateUserDto {
  readonly email: string;
  readonly name: string;
}

export interface UpdateUserDto {
  readonly name?: string;
}

// Query/Filter types
export interface UserQuery {
  readonly email?: string;
  readonly name?: string;
  readonly limit?: number;
  readonly offset?: number;
}

// Result types
export type UserResult = Result<User, UserError>;
```

## TypeScript Configuration

### Base tsconfig.json

```json
{
  "compilerOptions": {
    // Language and Environment
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",

    // Strict Type Checking
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,

    // Module Handling
    "esModuleInterop": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    // Output
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    // Other
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Recommended Strict Options

```json
{
  "compilerOptions": {
    // All strict checks
    "strict": true,

    // Additional strict checks
    "noUncheckedIndexedAccess": true,    // arr[0] is T | undefined
    "noImplicitOverride": true,           // Require 'override' keyword
    "noPropertyAccessFromIndexSignature": true,  // Require bracket notation
    "exactOptionalPropertyTypes": true,   // undefined !== optional

    // Error prevention
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Project References (Monorepo)

```json
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "strict": true
  }
}

// packages/shared/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}

// packages/app/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../shared" }
  ],
  "include": ["src/**/*"]
}
```

## Path Aliases

### Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/features/*": ["src/features/*"],
      "@/shared/*": ["src/shared/*"],
      "@/config": ["src/config/index.ts"]
    }
  }
}
```

### Usage

```typescript
// Instead of relative imports
import { User } from "../../../shared/types/user";

// Use path aliases
import { User } from "@/shared/types/user";
import { UserService } from "@/features/users";
import { config } from "@/config";
```

## Test Organization

### Co-located Tests

```
src/
├── features/
│   └── users/
│       ├── user.service.ts
│       ├── user.service.test.ts  # Unit tests next to source
│       └── user.types.ts
```

### Separate Test Directory

```
src/
├── features/
│   └── users/
│       └── user.service.ts
tests/
├── unit/
│   └── features/
│       └── users/
│           └── user.service.test.ts
├── integration/
│   └── users.test.ts
└── e2e/
    └── api.test.ts
```

### Test Utilities

```
tests/
├── fixtures/           # Test data
│   ├── users.ts
│   └── products.ts
├── mocks/              # Mock implementations
│   ├── database.ts
│   └── api.ts
├── helpers/            # Test utilities
│   ├── setup.ts
│   └── factories.ts
└── ...
```

## Build Configuration

### Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc --build",
    "build:watch": "tsc --build --watch",
    "clean": "rm -rf dist",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts"
  }
}
```

### Build Outputs

```
dist/
├── index.js            # Compiled JavaScript
├── index.js.map        # Source maps
├── index.d.ts          # Type declarations
└── index.d.ts.map      # Declaration maps
```

## Environment Configuration

### Environment Files

```
.env                    # Default/development
.env.local              # Local overrides (gitignored)
.env.production         # Production settings
.env.test               # Test environment
```

### Type-Safe Config

```typescript
// config/env.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
  DEBUG: z.coerce.boolean().default(false),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Invalid environment variables:");
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}

// config/index.ts
import { loadEnv } from "./env";

const env = loadEnv();

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  database: {
    url: env.DATABASE_URL,
  },
  api: {
    key: env.API_KEY,
  },
  debug: env.DEBUG,
} as const;
```

## Best Practices

1. **Group by Feature**: Keep related code together
2. **Limit Nesting Depth**: Max 3-4 levels deep
3. **One Concept Per File**: Small, focused modules
4. **Use Index Files Sparingly**: Only for public APIs
5. **Co-locate Tests**: Near the code they test
6. **Type-Safe Configuration**: Validate at startup
7. **Use Path Aliases**: Avoid long relative imports
8. **Separate Source and Output**: src/ and dist/
9. **Enable Strict Mode**: Maximum type safety
10. **Document Structure**: README in each major directory
