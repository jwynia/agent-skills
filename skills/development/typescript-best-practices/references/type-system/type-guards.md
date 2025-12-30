# Type Guards

Type guards narrow types at runtime while maintaining type safety. Use them to safely handle union types, unknown values, and discriminated unions.

## Built-in Type Guards

### typeof Guards

```typescript
function processValue(value: string | number): string {
  if (typeof value === "string") {
    // value is string here
    return value.toUpperCase();
  }
  // value is number here
  return value.toFixed(2);
}

// typeof works for primitives
function handlePrimitive(value: unknown): void {
  if (typeof value === "string") {
    console.log(value.length);
  } else if (typeof value === "number") {
    console.log(value.toFixed(2));
  } else if (typeof value === "boolean") {
    console.log(value ? "yes" : "no");
  } else if (typeof value === "function") {
    console.log(value.name);
  }
}
```

### instanceof Guards

```typescript
class Dog {
  bark(): void {
    console.log("Woof!");
  }
}

class Cat {
  meow(): void {
    console.log("Meow!");
  }
}

function makeSound(animal: Dog | Cat): void {
  if (animal instanceof Dog) {
    animal.bark();  // animal is Dog
  } else {
    animal.meow();  // animal is Cat
  }
}

// Works with Error types
function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error instanceof TypeError) {
    return `Type error: ${error.message}`;
  }
  return String(error);
}
```

### in Operator

```typescript
interface Fish {
  swim(): void;
}

interface Bird {
  fly(): void;
}

function move(animal: Fish | Bird): void {
  if ("swim" in animal) {
    animal.swim();  // animal is Fish
  } else {
    animal.fly();   // animal is Bird
  }
}
```

## Custom Type Guards

### Type Predicate Functions

```typescript
// Return type is `value is Type`
function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

function isNonNull<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

// Usage
function process(value: unknown): void {
  if (isString(value)) {
    console.log(value.toUpperCase());  // value is string
  }
}

// Filter with type guard
const values = [1, null, "hello", undefined, 42];
const nonNull = values.filter(isNonNull);  // (string | number)[]
```

### Object Shape Guards

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function isUser(value: unknown): value is User {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.email === "string"
  );
}

// Usage with unknown data
function processUserData(data: unknown): User | null {
  if (isUser(data)) {
    return data;  // data is User
  }
  return null;
}
```

### Array Type Guards

```typescript
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  );
}

function isArrayOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(guard);
}

// Usage
const data: unknown = ["a", "b", "c"];
if (isArrayOf(data, isString)) {
  // data is string[]
  console.log(data.join(", "));
}
```

## Discriminated Unions

### Basic Pattern

```typescript
// Each type has a literal "type" property (discriminant)
interface LoadingState {
  type: "loading";
}

interface SuccessState<T> {
  type: "success";
  data: T;
}

interface ErrorState {
  type: "error";
  message: string;
}

type State<T> = LoadingState | SuccessState<T> | ErrorState;

function handleState<T>(state: State<T>): string {
  switch (state.type) {
    case "loading":
      return "Loading...";
    case "success":
      return `Data: ${state.data}`;  // state.data is accessible
    case "error":
      return `Error: ${state.message}`;  // state.message is accessible
  }
}
```

### Exhaustive Checking

```typescript
// Use never to ensure all cases are handled
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // If a new shape is added, TypeScript will error here
      return assertNever(shape);
  }
}
```

### Result Type Pattern

```typescript
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return { success: false, error: "Division by zero" };
  }
  return { success: true, value: a / b };
}

// Usage
const result = divide(10, 2);
if (result.success) {
  console.log(result.value);  // result.value is number
} else {
  console.error(result.error);  // result.error is string
}
```

## Assertion Functions

### Basic Assertions

```typescript
// Assertion function signature: asserts condition
function assert(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message ?? "Assertion failed");
  }
}

// Usage
function process(value: string | null): void {
  assert(value !== null, "Value must not be null");
  // value is string after assertion
  console.log(value.toUpperCase());
}
```

### Type Assertions

```typescript
// Assert that value is a specific type
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`Expected string, got ${typeof value}`);
  }
}

function assertIsUser(value: unknown): asserts value is User {
  if (!isUser(value)) {
    throw new Error("Invalid user object");
  }
}

// Usage
function processData(data: unknown): void {
  assertIsUser(data);
  // data is User after assertion
  console.log(data.name);
}
```

### Assertion with Message

```typescript
function assertDefined<T>(
  value: T,
  name: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error(`${name} must be defined`);
  }
}

// Usage
function createUser(name: string | undefined, email: string | null): void {
  assertDefined(name, "name");
  assertDefined(email, "email");
  // Both are now non-null
  console.log(name.toUpperCase(), email.toLowerCase());
}
```

## Narrowing with Control Flow

### Truthiness Narrowing

```typescript
function printLength(str: string | null | undefined): void {
  if (str) {
    // str is string (truthy check eliminates null/undefined/empty)
    console.log(str.length);
  }
}

// Note: 0 and "" are falsy
function getValue(value: string | number | null): string {
  // This incorrectly excludes 0 and ""
  if (value) {
    return String(value);
  }
  return "default";
}

// Better: explicit null check
function getValueSafe(value: string | number | null): string {
  if (value !== null) {
    return String(value);
  }
  return "default";
}
```

### Equality Narrowing

```typescript
function compare(a: string | number, b: string | boolean): void {
  if (a === b) {
    // a and b are both string (the only common type)
    console.log(a.toUpperCase(), b.toUpperCase());
  }
}

function handleValue(value: string | number | null): void {
  if (value === null) {
    return;
  }
  // value is string | number
  console.log(value);
}
```

## Best Practices

1. **Prefer Type Guards over Type Assertions**: Guards are runtime-safe
2. **Use Discriminated Unions**: Add a literal `type` or `kind` property
3. **Implement Exhaustive Checks**: Use `assertNever` in switch defaults
4. **Keep Guards Simple**: Complex logic should be in the guard function
5. **Name Guards Clearly**: `isUser`, `isValid`, `hasProperty`
6. **Test Guard Functions**: Verify they correctly identify types
7. **Use Assertions for Invariants**: Fail fast on programming errors
