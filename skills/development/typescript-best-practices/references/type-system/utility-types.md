# Utility Types

TypeScript provides built-in utility types for common type transformations. Use them to avoid repetitive type definitions.

## Object Property Modifiers

### Partial<T>

Make all properties optional:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

// All properties become optional
type PartialUser = Partial<User>;
// { id?: string; name?: string; email?: string }

// Use case: Update functions
function updateUser(id: string, updates: Partial<User>): User {
  const current = getUser(id);
  return { ...current, ...updates };
}

updateUser("123", { name: "New Name" });  // Only update name
```

### Required<T>

Make all properties required:

```typescript
interface Config {
  host?: string;
  port?: number;
  ssl?: boolean;
}

// All properties become required
type RequiredConfig = Required<Config>;
// { host: string; port: number; ssl: boolean }

// Use case: Validate complete config
function validateConfig(config: Config): RequiredConfig {
  return {
    host: config.host ?? "localhost",
    port: config.port ?? 3000,
    ssl: config.ssl ?? false,
  };
}
```

### Readonly<T>

Make all properties readonly:

```typescript
interface State {
  count: number;
  items: string[];
}

type ImmutableState = Readonly<State>;
// { readonly count: number; readonly items: string[] }

// Note: Only shallow readonly
const state: ImmutableState = { count: 0, items: [] };
state.count = 1;        // Error: readonly
state.items.push("x");  // OK: array itself is mutable

// For deep readonly, create custom type (see advanced-types.md)
```

## Property Selection

### Pick<T, K>

Select specific properties:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Only include specified properties
type PublicUser = Pick<User, "id" | "name" | "email">;
// { id: string; name: string; email: string }

// Use case: API responses (exclude sensitive data)
function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
```

### Omit<T, K>

Exclude specific properties:

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Exclude specified properties
type UserWithoutPassword = Omit<User, "password">;
// { id: string; name: string; email: string }

// Use case: Create input (exclude generated fields)
type CreateUserInput = Omit<User, "id">;

function createUser(input: CreateUserInput): User {
  return {
    id: generateId(),
    ...input,
  };
}
```

## Union Type Operations

### Exclude<T, U>

Remove types from union:

```typescript
type Status = "pending" | "active" | "deleted" | "archived";

// Remove "deleted" from union
type ActiveStatus = Exclude<Status, "deleted">;
// "pending" | "active" | "archived"

// Remove multiple types
type LiveStatus = Exclude<Status, "deleted" | "archived">;
// "pending" | "active"
```

### Extract<T, U>

Keep only matching types:

```typescript
type Value = string | number | boolean | null | undefined;

// Extract only primitive types
type Primitive = Extract<Value, string | number | boolean>;
// string | number | boolean

// Extract nullable types
type Nullable = Extract<Value, null | undefined>;
// null | undefined
```

### NonNullable<T>

Remove null and undefined:

```typescript
type MaybeString = string | null | undefined;

type DefiniteString = NonNullable<MaybeString>;
// string

// Use case: After null check
function processItems(items: string[] | null): void {
  if (items === null) return;

  // items is NonNullable<string[] | null> = string[]
  items.forEach(console.log);
}
```

## Function Types

### Parameters<T>

Extract function parameter types:

```typescript
function createUser(name: string, email: string, age: number): User {
  // ...
}

type CreateUserParams = Parameters<typeof createUser>;
// [name: string, email: string, age: number]

// Use case: Wrapper functions
function logAndCreate(...args: CreateUserParams): User {
  console.log("Creating user:", args);
  return createUser(...args);
}
```

### ReturnType<T>

Extract function return type:

```typescript
function fetchData(): Promise<{ id: string; data: unknown }> {
  // ...
}

type FetchResult = ReturnType<typeof fetchData>;
// Promise<{ id: string; data: unknown }>

// Unwrap promise
type FetchData = Awaited<ReturnType<typeof fetchData>>;
// { id: string; data: unknown }
```

### ConstructorParameters<T>

Extract constructor parameter types:

```typescript
class Database {
  constructor(host: string, port: number, ssl: boolean) {
    // ...
  }
}

type DbParams = ConstructorParameters<typeof Database>;
// [host: string, port: number, ssl: boolean]
```

### InstanceType<T>

Extract instance type from class:

```typescript
class UserService {
  getUser(id: string): User {
    // ...
  }
}

type UserServiceInstance = InstanceType<typeof UserService>;
// UserService

// Use case: Dependency injection
function createController(service: InstanceType<typeof UserService>) {
  return {
    get: (id: string) => service.getUser(id),
  };
}
```

## Object Types

### Record<K, T>

Create object type with specific keys:

```typescript
// Simple key-value mapping
type StringMap = Record<string, string>;
// { [key: string]: string }

// Specific keys
type RolePermissions = Record<"admin" | "user" | "guest", string[]>;
// { admin: string[]; user: string[]; guest: string[] }

// Use case: Status messages
type StatusMessages = Record<Status, string>;
const messages: StatusMessages = {
  pending: "Waiting for approval",
  active: "Currently active",
  deleted: "Has been deleted",
  archived: "Moved to archive",
};
```

## String Manipulation

### Uppercase<S> / Lowercase<S>

```typescript
type Upper = Uppercase<"hello">;  // "HELLO"
type Lower = Lowercase<"HELLO">;  // "hello"
```

### Capitalize<S> / Uncapitalize<S>

```typescript
type Cap = Capitalize<"hello">;      // "Hello"
type Uncap = Uncapitalize<"Hello">;  // "hello"

// Use case: Event handlers
type EventName = "click" | "focus" | "blur";
type Handler = `on${Capitalize<EventName>}`;
// "onClick" | "onFocus" | "onBlur"
```

## Promise Types

### Awaited<T>

Unwrap Promise types:

```typescript
type PromiseString = Promise<string>;
type ResolvedString = Awaited<PromiseString>;  // string

// Works with nested promises
type NestedPromise = Promise<Promise<number>>;
type ResolvedNumber = Awaited<NestedPromise>;  // number

// Non-promise passes through
type PlainNumber = Awaited<number>;  // number
```

## This Types

### ThisParameterType<T>

Extract `this` parameter type:

```typescript
function greet(this: { name: string }, greeting: string): string {
  return `${greeting}, ${this.name}`;
}

type GreetThis = ThisParameterType<typeof greet>;
// { name: string }
```

### OmitThisParameter<T>

Remove `this` parameter:

```typescript
function greet(this: { name: string }, greeting: string): string {
  return `${greeting}, ${this.name}`;
}

type GreetWithoutThis = OmitThisParameter<typeof greet>;
// (greeting: string) => string

// Use case: Bind functions
const boundGreet: GreetWithoutThis = greet.bind({ name: "World" });
```

## Combining Utility Types

### Common Patterns

```typescript
// Create from existing (no id for creation)
interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface User extends Entity {
  name: string;
  email: string;
}

type CreateInput<T extends Entity> = Omit<T, keyof Entity>;
type UpdateInput<T extends Entity> = Partial<Omit<T, keyof Entity>>;

type CreateUserInput = CreateInput<User>;
// { name: string; email: string }

type UpdateUserInput = UpdateInput<User>;
// { name?: string; email?: string }
```

### Deep Partial

```typescript
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

interface Config {
  database: {
    host: string;
    port: number;
  };
  cache: {
    enabled: boolean;
    ttl: number;
  };
}

type PartialConfig = DeepPartial<Config>;
// All nested properties are also optional
```

### Mutable (Remove Readonly)

```typescript
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

interface ImmutableUser {
  readonly id: string;
  readonly name: string;
}

type MutableUser = Mutable<ImmutableUser>;
// { id: string; name: string }
```

## Best Practices

1. **Use Built-in Types First**: Before creating custom types
2. **Combine for Complex Types**: Chain utilities like `Readonly<Partial<T>>`
3. **Name Derived Types**: Create aliases for complex combinations
4. **Document Purpose**: Explain why a utility type is used
5. **Keep It Simple**: Avoid deeply nested utility types
6. **Test Edge Cases**: Verify behavior with optional/readonly properties
