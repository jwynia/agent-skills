# Functional Patterns

Functional programming patterns in TypeScript: immutability, pure functions, composition, and higher-order functions.

## Immutability

### Readonly Types

```typescript
// Immutable object
interface User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

// Immutable array
type UserList = ReadonlyArray<User>;

// Deep readonly
type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

// Const assertion for literals
const CONFIG = {
  host: "localhost",
  port: 3000,
  features: ["auth", "logging"],
} as const;
// typeof CONFIG = { readonly host: "localhost"; readonly port: 3000; readonly features: readonly ["auth", "logging"] }
```

### Immutable Updates

```typescript
// Object updates with spread
function updateUser(user: User, name: string): User {
  return { ...user, name };
}

// Nested updates
interface State {
  readonly user: User;
  readonly settings: {
    readonly theme: string;
    readonly notifications: boolean;
  };
}

function updateTheme(state: State, theme: string): State {
  return {
    ...state,
    settings: {
      ...state.settings,
      theme,
    },
  };
}

// Array updates
function addItem<T>(items: ReadonlyArray<T>, item: T): ReadonlyArray<T> {
  return [...items, item];
}

function removeItem<T>(items: ReadonlyArray<T>, index: number): ReadonlyArray<T> {
  return [...items.slice(0, index), ...items.slice(index + 1)];
}

function updateItem<T>(
  items: ReadonlyArray<T>,
  index: number,
  updater: (item: T) => T
): ReadonlyArray<T> {
  return items.map((item, i) => (i === index ? updater(item) : item));
}
```

## Pure Functions

### Characteristics of Pure Functions

```typescript
// Pure: Same input always produces same output, no side effects
function add(a: number, b: number): number {
  return a + b;
}

function formatUser(user: User): string {
  return `${user.name} <${user.email}>`;
}

// Impure: Uses external state
let counter = 0;
function increment(): number {
  return ++counter; // Side effect: modifies external state
}

// Impure: Non-deterministic
function getTimestamp(): number {
  return Date.now(); // Different result each call
}

// Impure: Side effects
function logUser(user: User): User {
  console.log(user); // Side effect: I/O
  return user;
}
```

### Converting Impure to Pure

```typescript
// Impure: Random selection
function pickRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Pure: Inject randomness
function pickItem<T>(items: ReadonlyArray<T>, randomValue: number): T {
  const index = Math.floor(randomValue * items.length);
  return items[index];
}

// Impure: Uses current time
function isExpired(expiresAt: Date): boolean {
  return expiresAt < new Date();
}

// Pure: Inject current time
function isExpiredAt(expiresAt: Date, now: Date): boolean {
  return expiresAt < now;
}
```

## Function Composition

### Basic Composition

```typescript
// Compose two functions
function compose<A, B, C>(
  f: (b: B) => C,
  g: (a: A) => B
): (a: A) => C {
  return (a: A) => f(g(a));
}

// Compose multiple functions (right to left)
function composeAll<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduceRight((acc, fn) => fn(acc), arg);
}

// Pipe (left to right, more readable)
function pipe<T>(...fns: Array<(arg: T) => T>): (arg: T) => T {
  return (arg: T) => fns.reduce((acc, fn) => fn(acc), arg);
}

// Usage
const processString = pipe(
  (s: string) => s.trim(),
  (s: string) => s.toLowerCase(),
  (s: string) => s.replace(/\s+/g, "-")
);

processString("  Hello World  "); // "hello-world"
```

### Typed Pipe

```typescript
// Type-safe pipe for different types
function pipe2<A, B, C>(
  ab: (a: A) => B,
  bc: (b: B) => C
): (a: A) => C {
  return (a: A) => bc(ab(a));
}

function pipe3<A, B, C, D>(
  ab: (a: A) => B,
  bc: (b: B) => C,
  cd: (c: C) => D
): (a: A) => D {
  return (a: A) => cd(bc(ab(a)));
}

// Usage with different types
const parseAndDouble = pipe2(
  (s: string) => parseInt(s, 10),
  (n: number) => n * 2
);

parseAndDouble("21"); // 42
```

## Higher-Order Functions

### Functions That Return Functions

```typescript
// Factory function
function createMultiplier(factor: number): (value: number) => number {
  return (value: number) => value * factor;
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

double(5); // 10
triple(5); // 15

// Predicate factory
function createMatcher<T>(
  key: keyof T,
  value: T[keyof T]
): (item: T) => boolean {
  return (item: T) => item[key] === value;
}

const isActive = createMatcher<User>("status", "active");
const activeUsers = users.filter(isActive);
```

### Functions That Accept Functions

```typescript
// Map with index
function mapWithIndex<T, U>(
  items: ReadonlyArray<T>,
  fn: (item: T, index: number) => U
): U[] {
  return items.map(fn);
}

// Filter and map in one pass
function filterMap<T, U>(
  items: ReadonlyArray<T>,
  predicate: (item: T) => boolean,
  mapper: (item: T) => U
): U[] {
  const result: U[] = [];
  for (const item of items) {
    if (predicate(item)) {
      result.push(mapper(item));
    }
  }
  return result;
}

// Group by key
function groupBy<T, K extends string | number>(
  items: ReadonlyArray<T>,
  getKey: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;

  for (const item of items) {
    const key = getKey(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }

  return result;
}
```

## Currying and Partial Application

### Currying

```typescript
// Curried function
function curriedAdd(a: number): (b: number) => (c: number) => number {
  return (b: number) => (c: number) => a + b + c;
}

curriedAdd(1)(2)(3); // 6

// Generic curry helper (for 2 args)
function curry2<A, B, R>(fn: (a: A, b: B) => R): (a: A) => (b: B) => R {
  return (a: A) => (b: B) => fn(a, b);
}

// Usage
const curriedConcat = curry2((a: string, b: string) => a + b);
const greet = curriedConcat("Hello, ");
greet("World"); // "Hello, World"
```

### Partial Application

```typescript
// Partial application helper
function partial<T, U extends unknown[], R>(
  fn: (arg: T, ...rest: U) => R,
  arg: T
): (...rest: U) => R {
  return (...rest: U) => fn(arg, ...rest);
}

// Usage
function greet(greeting: string, name: string): string {
  return `${greeting}, ${name}!`;
}

const sayHello = partial(greet, "Hello");
sayHello("World"); // "Hello, World!"

// Partial with multiple args
function partialRight<T extends unknown[], U, R>(
  fn: (...args: [...T, U]) => R,
  arg: U
): (...args: T) => R {
  return (...args: T) => fn(...args, arg);
}
```

## Option/Maybe Pattern

### Option Type

```typescript
type Some<T> = { readonly _tag: "some"; readonly value: T };
type None = { readonly _tag: "none" };
type Option<T> = Some<T> | None;

// Constructors
function some<T>(value: T): Option<T> {
  return { _tag: "some", value };
}

function none<T = never>(): Option<T> {
  return { _tag: "none" };
}

// Type guards
function isSome<T>(option: Option<T>): option is Some<T> {
  return option._tag === "some";
}

function isNone<T>(option: Option<T>): option is None {
  return option._tag === "none";
}
```

### Option Operations

```typescript
// Map
function mapOption<T, U>(
  option: Option<T>,
  fn: (value: T) => U
): Option<U> {
  return isSome(option) ? some(fn(option.value)) : none();
}

// FlatMap
function flatMapOption<T, U>(
  option: Option<T>,
  fn: (value: T) => Option<U>
): Option<U> {
  return isSome(option) ? fn(option.value) : none();
}

// Get with default
function getOrElse<T>(option: Option<T>, defaultValue: T): T {
  return isSome(option) ? option.value : defaultValue;
}

// Usage
function findUser(id: string): Option<User> {
  const user = users.get(id);
  return user ? some(user) : none();
}

const userName = pipe(
  findUser("123"),
  opt => mapOption(opt, user => user.name),
  opt => getOrElse(opt, "Unknown")
);
```

## Lens Pattern

### Simple Lens

```typescript
interface Lens<S, A> {
  get: (s: S) => A;
  set: (a: A) => (s: S) => S;
}

// Create lens for a property
function lens<S, K extends keyof S>(key: K): Lens<S, S[K]> {
  return {
    get: (s: S) => s[key],
    set: (a: S[K]) => (s: S) => ({ ...s, [key]: a }),
  };
}

// Modify through lens
function over<S, A>(
  l: Lens<S, A>,
  fn: (a: A) => A
): (s: S) => S {
  return (s: S) => l.set(fn(l.get(s)))(s);
}

// Compose lenses
function composeLens<S, A, B>(
  outer: Lens<S, A>,
  inner: Lens<A, B>
): Lens<S, B> {
  return {
    get: (s: S) => inner.get(outer.get(s)),
    set: (b: B) => (s: S) => outer.set(inner.set(b)(outer.get(s)))(s),
  };
}

// Usage
interface Address {
  street: string;
  city: string;
}

interface Person {
  name: string;
  address: Address;
}

const addressLens = lens<Person, "address">("address");
const cityLens = lens<Address, "city">("city");
const personCityLens = composeLens(addressLens, cityLens);

const person: Person = { name: "John", address: { street: "Main", city: "NYC" } };
const updatedPerson = personCityLens.set("LA")(person);
```

## Best Practices

1. **Prefer Immutability**: Use readonly and spread operators
2. **Keep Functions Pure**: Same input, same output, no side effects
3. **Use Small, Focused Functions**: Each function does one thing
4. **Compose Functions**: Build complex logic from simple pieces
5. **Use Higher-Order Functions**: For reusable patterns
6. **Type Everything**: Explicit types for function signatures
7. **Use Option for Missing Values**: Instead of null/undefined
8. **Document Side Effects**: When they're unavoidable
