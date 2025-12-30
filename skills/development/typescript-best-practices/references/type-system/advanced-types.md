# Advanced Types

Deep dive into TypeScript's advanced type features: generics, conditional types, mapped types, and template literal types.

## Generics

### Basic Generic Functions

```typescript
// Generic function with constraint
function first<T>(arr: ReadonlyArray<T>): T | undefined {
  return arr[0];
}

// Generic with default
function createArray<T = string>(length: number, value: T): T[] {
  return Array(length).fill(value);
}

// Multiple type parameters
function zip<T, U>(a: ReadonlyArray<T>, b: ReadonlyArray<U>): Array<[T, U]> {
  return a.map((item, i) => [item, b[i]]);
}
```

### Generic Constraints

```typescript
// Constrain to object with specific property
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Constrain to objects with certain shape
interface HasLength {
  readonly length: number;
}

function logLength<T extends HasLength>(value: T): void {
  console.log(value.length);
}

// Works with string, array, or any object with length
logLength("hello");      // 5
logLength([1, 2, 3]);    // 3
logLength({ length: 10 }); // 10
```

### Generic Classes

```typescript
class Container<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  get(index: number): T | undefined {
    return this.items[index];
  }

  getAll(): ReadonlyArray<T> {
    return this.items;
  }
}

// With constraint
class Repository<T extends { id: string }> {
  private store = new Map<string, T>();

  save(item: T): void {
    this.store.set(item.id, item);
  }

  findById(id: string): T | undefined {
    return this.store.get(id);
  }
}
```

## Conditional Types

### Basic Conditional Types

```typescript
// T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">;  // true
type B = IsString<123>;      // false

// Extract array element type
type ElementType<T> = T extends ReadonlyArray<infer E> ? E : never;

type C = ElementType<string[]>;  // string
type D = ElementType<number>;    // never
```

### Distributive Conditional Types

```typescript
// Conditional types distribute over unions
type ToArray<T> = T extends unknown ? T[] : never;

type E = ToArray<string | number>;  // string[] | number[]

// Prevent distribution with tuple
type ToArrayNonDist<T> = [T] extends [unknown] ? T[] : never;

type F = ToArrayNonDist<string | number>;  // (string | number)[]
```

### The `infer` Keyword

```typescript
// Extract return type
type ReturnOf<T> = T extends (...args: unknown[]) => infer R ? R : never;

type G = ReturnOf<() => string>;  // string
type H = ReturnOf<(x: number) => boolean>;  // boolean

// Extract promise value
type Awaited<T> = T extends Promise<infer V> ? V : T;

type I = Awaited<Promise<string>>;  // string
type J = Awaited<string>;           // string

// Extract function parameters
type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;

type K = Parameters<(a: string, b: number) => void>;  // [string, number]
```

### Practical Conditional Types

```typescript
// Non-nullable
type NonNullable<T> = T extends null | undefined ? never : T;

// Exclude types from union
type Exclude<T, U> = T extends U ? never : T;

type L = Exclude<"a" | "b" | "c", "a">;  // "b" | "c"

// Extract types from union
type Extract<T, U> = T extends U ? T : never;

type M = Extract<string | number | boolean, number>;  // number
```

## Mapped Types

### Basic Mapped Types

```typescript
// Make all properties optional
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Make all properties required
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Make all properties readonly
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Remove readonly
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};
```

### Key Remapping

```typescript
// Rename keys with template literals
type Getters<T> = {
  [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }

// Filter keys
type OnlyStrings<T> = {
  [P in keyof T as T[P] extends string ? P : never]: T[P];
};

type N = OnlyStrings<{ name: string; age: number; email: string }>;
// { name: string; email: string }
```

### Mapped Type Modifiers

```typescript
// Pick specific keys
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit specific keys
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// Record type
type Record<K extends keyof unknown, T> = {
  [P in K]: T;
};

type O = Record<"a" | "b", number>;  // { a: number; b: number }
```

## Template Literal Types

### Basic Template Literals

```typescript
// String manipulation
type Greeting = `Hello, ${string}`;

const g1: Greeting = "Hello, World";  // OK
const g2: Greeting = "Hi, World";     // Error

// Union expansion
type Color = "red" | "blue";
type Size = "small" | "large";

type ColorSize = `${Color}-${Size}`;
// "red-small" | "red-large" | "blue-small" | "blue-large"
```

### Built-in String Manipulation Types

```typescript
type Upper = Uppercase<"hello">;      // "HELLO"
type Lower = Lowercase<"HELLO">;      // "hello"
type Cap = Capitalize<"hello">;       // "Hello"
type Uncap = Uncapitalize<"Hello">;   // "hello"
```

### Event Handler Pattern

```typescript
type EventName = "click" | "focus" | "blur";
type Handler = `on${Capitalize<EventName>}`;
// "onClick" | "onFocus" | "onBlur"

type EventHandlers = {
  [E in EventName as `on${Capitalize<E>}`]: (event: Event) => void;
};
// { onClick: ..., onFocus: ..., onBlur: ... }
```

### Path Types

```typescript
// Nested property paths
type PropPath<T, Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends object
    ? PropPath<T[K], `${Prefix}${K & string}.`>
    : `${Prefix}${K & string}`;
}[keyof T];

interface Config {
  database: {
    host: string;
    port: number;
  };
  cache: {
    enabled: boolean;
  };
}

type ConfigPath = PropPath<Config>;
// "database.host" | "database.port" | "cache.enabled"
```

## Combining Advanced Types

### Builder Pattern with Types

```typescript
type Builder<T, Built = {}> = {
  set<K extends keyof T>(
    key: K,
    value: T[K]
  ): Builder<Omit<T, K>, Built & Pick<T, K>>;
  build(): Built extends T ? T : never;
};

interface User {
  id: string;
  name: string;
  email: string;
}

declare function createBuilder<T>(): Builder<T>;

const user = createBuilder<User>()
  .set("id", "123")
  .set("name", "John")
  .set("email", "john@example.com")
  .build();
```

### Deep Readonly

```typescript
type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

interface NestedConfig {
  server: {
    port: number;
    host: string;
  };
  features: string[];
}

type ImmutableConfig = DeepReadonly<NestedConfig>;
// All nested properties are readonly
```

### Type-Safe Object.keys

```typescript
// Standard Object.keys returns string[]
// Create type-safe version
function typedKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

const config = { port: 3000, host: "localhost" };
const keys = typedKeys(config);  // ("port" | "host")[]
```

## Best Practices

1. **Start Simple**: Use basic generics before reaching for conditional types
2. **Name Descriptively**: `TItem`, `TResult` better than `T`, `U`
3. **Constrain Generics**: Use `extends` to limit acceptable types
4. **Prefer Utility Types**: Use built-in `Partial`, `Required`, `Pick`, `Omit`
5. **Document Complex Types**: Add JSDoc for non-obvious type logic
6. **Test Types**: Use `@ts-expect-error` to verify type behavior
