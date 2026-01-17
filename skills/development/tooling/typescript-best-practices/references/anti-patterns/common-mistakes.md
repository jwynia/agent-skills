# Common Mistakes Reference

Quick reference for the most frequent TypeScript errors. Each entry shows the wrong pattern and the correct fix.

## Type Safety Errors

### Using `any` Type

```typescript
// WRONG: any disables type checking
function processData(data: any): any {
  return data.value.toUpperCase();
}

// CORRECT: Use unknown and narrow
function processData(data: unknown): string {
  if (typeof data === "object" && data !== null && "value" in data) {
    const value = (data as { value: unknown }).value;
    if (typeof value === "string") {
      return value.toUpperCase();
    }
  }
  throw new Error("Invalid data format");
}

// CORRECT: Define specific type
interface DataInput {
  readonly value: string;
}

function processData(data: DataInput): string {
  return data.value.toUpperCase();
}
```

### Non-Null Assertion

```typescript
// WRONG: Non-null assertion can cause runtime errors
function getUser(id: string): User {
  const user = users.find(u => u.id === id);
  return user!;  // Crashes if user not found
}

// CORRECT: Handle the null case
function getUser(id: string): User | null {
  return users.find(u => u.id === id) ?? null;
}

// CORRECT: Throw descriptive error
function getUser(id: string): User {
  const user = users.find(u => u.id === id);
  if (!user) {
    throw new Error(`User not found: ${id}`);
  }
  return user;
}
```

### Type Assertions Instead of Guards

```typescript
// WRONG: Type assertion bypasses type checking
function handleEvent(event: unknown) {
  const mouseEvent = event as MouseEvent;
  console.log(mouseEvent.clientX);  // Crashes if not MouseEvent
}

// CORRECT: Use type guard
function isMouseEvent(event: unknown): event is MouseEvent {
  return event instanceof MouseEvent;
}

function handleEvent(event: unknown) {
  if (isMouseEvent(event)) {
    console.log(event.clientX);  // Safe
  }
}
```

### Implicit Any in Callbacks

```typescript
// WRONG: Parameter has implicit any
const doubled = numbers.map(n => n * 2);  // n is any if noImplicitAny is off

// CORRECT: Explicit parameter type
const doubled = numbers.map((n: number) => n * 2);

// CORRECT: Type the array properly
const numbers: number[] = [1, 2, 3];
const doubled = numbers.map(n => n * 2);  // n is inferred as number
```

## Object and Array Errors

### Mutable Parameters

```typescript
// WRONG: Function can mutate input
function addItem(items: string[], item: string): string[] {
  items.push(item);  // Mutates original array
  return items;
}

// CORRECT: Return new array
function addItem(items: ReadonlyArray<string>, item: string): string[] {
  return [...items, item];
}

// CORRECT: Use readonly parameter
function processItems(items: readonly string[]): void {
  // items.push("x");  // Error: cannot mutate
}
```

### Index Access Without Checks

```typescript
// WRONG: Assumes element exists
function getFirst<T>(arr: T[]): T {
  return arr[0];  // Could be undefined
}

// CORRECT: With noUncheckedIndexedAccess
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0];
}

// CORRECT: Assert non-empty
function getFirst<T>(arr: [T, ...T[]]): T {
  return arr[0];  // Tuple guarantees at least one element
}
```

### Object Spread Overwriting

```typescript
// WRONG: Later properties overwrite earlier ones
const config = {
  ...defaults,
  host: userConfig.host,  // undefined overwrites default
};

// CORRECT: Filter undefined values
const config = {
  ...defaults,
  ...(userConfig.host !== undefined && { host: userConfig.host }),
};

// CORRECT: Use nullish coalescing
const config = {
  ...defaults,
  host: userConfig.host ?? defaults.host,
};
```

## Function Errors

### Missing Return Type on Public APIs

```typescript
// WRONG: Return type is inferred (can change accidentally)
export function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// CORRECT: Explicit return type
export function calculateTotal(items: ReadonlyArray<Item>): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Async Function Without Error Handling

```typescript
// WRONG: Error silently ignored
async function fetchData() {
  const response = await fetch("/api/data");
  return response.json();  // What if fetch fails?
}

// CORRECT: Handle errors
async function fetchData(): Promise<Result<Data, FetchError>> {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) {
      return err({ type: "http", status: response.status });
    }
    return ok(await response.json());
  } catch (error) {
    return err({ type: "network", message: String(error) });
  }
}
```

### Floating Promises

```typescript
// WRONG: Promise not awaited or handled
function saveData(data: Data) {
  api.save(data);  // Fire and forget - errors lost
}

// CORRECT: Await the promise
async function saveData(data: Data): Promise<void> {
  await api.save(data);
}

// CORRECT: Handle with .catch if truly fire-and-forget
function saveData(data: Data): void {
  api.save(data).catch(error => {
    logger.error("Failed to save", error);
  });
}
```

## Null and Undefined Errors

### Loose Null Checks

```typescript
// WRONG: Doesn't distinguish null from undefined or empty
function process(value: string | null | undefined) {
  if (value) {
    return value.toUpperCase();
  }
  return "default";  // Empty string "" returns "default"
}

// CORRECT: Explicit null check
function process(value: string | null | undefined) {
  if (value !== null && value !== undefined) {
    return value.toUpperCase();
  }
  return "default";
}

// CORRECT: Use nullish coalescing
function process(value: string | null | undefined) {
  return (value ?? "default").toUpperCase();
}
```

### Optional Chaining Misuse

```typescript
// WRONG: Continues execution with undefined
const userName = user?.profile?.name;
console.log(userName.toUpperCase());  // Error if undefined

// CORRECT: Handle the undefined case
const userName = user?.profile?.name;
if (userName) {
  console.log(userName.toUpperCase());
}

// CORRECT: Provide default
const userName = user?.profile?.name ?? "Anonymous";
console.log(userName.toUpperCase());
```

## Enum and Union Errors

### Numeric Enums

```typescript
// WRONG: Numeric enums have surprising behavior
enum Status {
  Active,    // 0
  Inactive,  // 1
  Deleted,   // 2
}

const status: Status = 999;  // No error!

// CORRECT: String literal union
type Status = "active" | "inactive" | "deleted";

const status: Status = "invalid";  // Error!

// CORRECT: Const enum if you need enum-like syntax
const Status = {
  Active: "active",
  Inactive: "inactive",
  Deleted: "deleted",
} as const;

type Status = typeof Status[keyof typeof Status];
```

### Missing Exhaustive Check

```typescript
// WRONG: Missing case in switch
type Action = "create" | "update" | "delete";

function handleAction(action: Action) {
  switch (action) {
    case "create":
      return create();
    case "update":
      return update();
    // "delete" case missing - no error!
  }
}

// CORRECT: Exhaustive check
function handleAction(action: Action) {
  switch (action) {
    case "create":
      return create();
    case "update":
      return update();
    case "delete":
      return remove();
    default:
      const _exhaustive: never = action;
      throw new Error(`Unknown action: ${_exhaustive}`);
  }
}
```

## Class Errors

### Public By Default

```typescript
// WRONG: Everything is public by default
class UserService {
  db: Database;  // Exposed!
  cache: Cache;  // Exposed!

  constructor(db: Database, cache: Cache) {
    this.db = db;
    this.cache = cache;
  }
}

// CORRECT: Explicit visibility
class UserService {
  constructor(
    private readonly db: Database,
    private readonly cache: Cache
  ) {}
}
```

### Missing Override

```typescript
// WRONG: Accidental override (or not)
class Animal {
  speak() { console.log("..."); }
}

class Dog extends Animal {
  speak() { console.log("Woof"); }  // Is this intentional?
}

// CORRECT: Explicit override
class Dog extends Animal {
  override speak() { console.log("Woof"); }
}
```

## Import Errors

### Default Imports

```typescript
// WRONG: Default imports are harder to refactor
import User from "./user";
import config from "./config";

// CORRECT: Named imports
import { User } from "./user";
import { config } from "./config";

// Exception: When importing external libraries that use defaults
import React from "react";
```

### Type-Only Imports

```typescript
// WRONG: Importing types as values
import { User, createUser } from "./user";

function process(user: User) { ... }

// CORRECT: Separate type imports (tree-shaking friendly)
import type { User } from "./user";
import { createUser } from "./user";

// Or inline
import { type User, createUser } from "./user";
```

## Quick Reference Table

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| `any` type | No type checking | Use `unknown` + type guards |
| `!` non-null | Runtime crashes | Null checks or Result types |
| `as Type` | Bypasses checks | Type guards |
| Mutable params | Side effects | `readonly` / spread |
| Missing return type | Fragile API | Explicit return types |
| Floating promises | Lost errors | `await` or `.catch()` |
| `if (value)` | Excludes 0, "" | `!== null` / `!== undefined` |
| Numeric enums | Accepts any number | String unions |
| No exhaustive check | Missing cases | `never` in default |
| Default imports | Hard to refactor | Named imports |
| Type + value import | Bundle bloat | `import type` |
