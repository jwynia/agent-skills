# Module Patterns

Best practices for TypeScript module organization, exports, dependency injection, and circular dependency prevention.

## Export Patterns

### Named Exports (Preferred)

```typescript
// user.ts - Named exports
export interface User {
  readonly id: string;
  readonly name: string;
}

export function createUser(name: string): User {
  return { id: generateId(), name };
}

export function validateUser(user: unknown): user is User {
  return (
    typeof user === "object" &&
    user !== null &&
    typeof (user as User).id === "string" &&
    typeof (user as User).name === "string"
  );
}

// Importing
import { User, createUser, validateUser } from "./user.ts";
```

### Re-exports

```typescript
// domain/user/index.ts - Re-export module contents
export { User, createUser } from "./user.ts";
export { UserService } from "./user-service.ts";
export { UserRepository } from "./user-repository.ts";

// types.ts - Re-export only types
export type { User } from "./user.ts";
export type { UserService } from "./user-service.ts";
```

### Barrel Files (Use Carefully)

```typescript
// Avoid wildcard re-exports (causes tree-shaking issues)
// BAD
export * from "./user.ts";
export * from "./product.ts";
export * from "./order.ts";

// BETTER: Explicit re-exports
export { User, createUser } from "./user.ts";
export { Product, createProduct } from "./product.ts";
export { Order, createOrder } from "./order.ts";

// BEST: Import from specific modules when possible
// Instead of: import { User, Product } from "./domain";
// Use: import { User } from "./domain/user";
```

## Module Organization

### Feature-Based Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── index.ts          # Public API
│   │   ├── auth.service.ts
│   │   ├── auth.types.ts
│   │   └── auth.utils.ts
│   ├── users/
│   │   ├── index.ts
│   │   ├── user.service.ts
│   │   ├── user.types.ts
│   │   └── user.repository.ts
│   └── products/
│       ├── index.ts
│       ├── product.service.ts
│       └── product.types.ts
├── shared/
│   ├── types/
│   ├── utils/
│   └── constants/
└── index.ts                   # App entry point
```

### Layer-Based Structure

```
src/
├── domain/           # Business logic, entities
│   ├── user.ts
│   └── product.ts
├── application/      # Use cases, services
│   ├── user.service.ts
│   └── product.service.ts
├── infrastructure/   # External concerns
│   ├── database/
│   ├── api/
│   └── cache/
└── presentation/     # UI, controllers
    ├── routes/
    └── controllers/
```

## Dependency Injection

### Constructor Injection

```typescript
// Interfaces for dependencies
interface Logger {
  log(message: string): void;
  error(message: string): void;
}

interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// Service with injected dependencies
class UserService {
  constructor(
    private readonly repository: UserRepository,
    private readonly logger: Logger
  ) {}

  async getUser(id: string): Promise<User | null> {
    this.logger.log(`Fetching user: ${id}`);
    return this.repository.findById(id);
  }
}

// Composition root (where dependencies are wired)
const logger = new ConsoleLogger();
const repository = new PostgresUserRepository(db);
const userService = new UserService(repository, logger);
```

### Factory Functions

```typescript
// Factory with dependencies
interface UserServiceDeps {
  readonly repository: UserRepository;
  readonly logger: Logger;
}

function createUserService(deps: UserServiceDeps) {
  return {
    async getUser(id: string): Promise<User | null> {
      deps.logger.log(`Fetching user: ${id}`);
      return deps.repository.findById(id);
    },

    async saveUser(user: User): Promise<void> {
      deps.logger.log(`Saving user: ${user.id}`);
      await deps.repository.save(user);
    },
  };
}

// Usage
const userService = createUserService({
  repository: new PostgresUserRepository(db),
  logger: new ConsoleLogger(),
});
```

### Context Pattern

```typescript
// Application context with all dependencies
interface AppContext {
  readonly config: Config;
  readonly logger: Logger;
  readonly db: Database;
  readonly cache: Cache;
}

// Services receive context
function createServices(ctx: AppContext) {
  return {
    users: createUserService({
      repository: new UserRepository(ctx.db),
      logger: ctx.logger,
    }),
    products: createProductService({
      repository: new ProductRepository(ctx.db),
      cache: ctx.cache,
      logger: ctx.logger,
    }),
  };
}

// Bootstrap
const context: AppContext = {
  config: loadConfig(),
  logger: new Logger(),
  db: new Database(config.db),
  cache: new RedisCache(config.redis),
};

const services = createServices(context);
```

## Avoiding Circular Dependencies

### Problem Example

```typescript
// user.ts
import { Order } from "./order.ts"; // Circular!

export interface User {
  id: string;
  orders: Order[];
}

// order.ts
import { User } from "./user.ts"; // Circular!

export interface Order {
  id: string;
  user: User;
}
```

### Solution 1: Extract Shared Types

```typescript
// types.ts - Shared types
export interface UserId {
  readonly userId: string;
}

export interface OrderId {
  readonly orderId: string;
}

// user.ts
import { UserId, OrderId } from "./types.ts";

export interface User extends UserId {
  name: string;
  orderIds: OrderId["orderId"][];
}

// order.ts
import { UserId, OrderId } from "./types.ts";

export interface Order extends OrderId {
  userId: UserId["userId"];
  total: number;
}
```

### Solution 2: Dependency Inversion

```typescript
// Define interfaces in a shared location
// interfaces/user-loader.ts
export interface UserLoader {
  loadUser(id: string): Promise<User>;
}

// order.service.ts - Depends on interface
export class OrderService {
  constructor(private readonly userLoader: UserLoader) {}

  async getOrderWithUser(orderId: string): Promise<OrderWithUser> {
    const order = await this.orderRepo.findById(orderId);
    const user = await this.userLoader.loadUser(order.userId);
    return { ...order, user };
  }
}

// user.service.ts - Implements interface
export class UserService implements UserLoader {
  async loadUser(id: string): Promise<User> {
    return this.userRepo.findById(id);
  }
}
```

### Solution 3: Lazy Imports

```typescript
// Only import when needed (breaks static dependency)
export class OrderService {
  async getOrderWithUser(orderId: string): Promise<OrderWithUser> {
    const order = await this.orderRepo.findById(orderId);

    // Dynamic import - only when needed
    const { UserService } = await import("./user.service.ts");
    const userService = new UserService();
    const user = await userService.getUser(order.userId);

    return { ...order, user };
  }
}
```

## Module Initialization

### Lazy Initialization

```typescript
// Lazy singleton
let instance: DatabaseConnection | null = null;

export async function getDatabase(): Promise<DatabaseConnection> {
  if (!instance) {
    instance = await createDatabaseConnection(config);
  }
  return instance;
}

// Usage
const db = await getDatabase();
```

### Module-Level Async Initialization

```typescript
// config.ts
let config: Config | null = null;

export async function initConfig(): Promise<void> {
  config = await loadConfigFromFile();
}

export function getConfig(): Config {
  if (!config) {
    throw new Error("Config not initialized. Call initConfig() first.");
  }
  return config;
}

// main.ts
await initConfig();
const config = getConfig();
```

### Initialization Order

```typescript
// init.ts - Central initialization
import { initDatabase } from "./database.ts";
import { initCache } from "./cache.ts";
import { initServices } from "./services.ts";

export async function init(): Promise<AppContext> {
  // Initialize in dependency order
  const db = await initDatabase();
  const cache = await initCache();
  const services = await initServices({ db, cache });

  return { db, cache, services };
}

// main.ts
const app = await init();
```

## Type-Only Imports

### Separate Type and Value Imports

```typescript
// Import types separately (removed at compile time)
import type { User, UserRole } from "./user.ts";
import { createUser, validateUser } from "./user.ts";

// Or use inline type imports
import { createUser, type User } from "./user.ts";
```

### Type-Only Re-exports

```typescript
// Export types only (for .d.ts generation)
export type { User, UserRole } from "./user.ts";

// Re-export values and types
export { createUser } from "./user.ts";
export type { User } from "./user.ts";
```

## Best Practices

1. **Prefer Named Exports**: Better tree-shaking and refactoring
2. **Avoid Barrel File Wildcards**: Use explicit re-exports
3. **One Concept Per File**: Keep modules focused
4. **Use Type-Only Imports**: For interfaces and types
5. **Inject Dependencies**: Don't import singletons directly
6. **Define Interfaces for Dependencies**: Enable testing and flexibility
7. **Watch for Circular Dependencies**: Use dependency inversion
8. **Initialize Explicitly**: Don't rely on import side effects
9. **Feature-Based Organization**: Group related code together
10. **Keep Public API Small**: Export only what's needed
