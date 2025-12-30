# Error Handling Patterns

Type-safe error handling in TypeScript using Result types, typed errors, and discriminated unions.

## The Result Type Pattern

### Basic Result Type

```typescript
/**
 * Result type for operations that can fail
 * Success: { success: true, value: T }
 * Failure: { success: false, error: E }
 */
type Result<T, E = Error> =
  | { readonly success: true; readonly value: T }
  | { readonly success: false; readonly error: E };

// Factory functions
function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}
```

### Using Result Types

```typescript
function parseJson<T>(input: string): Result<T, SyntaxError> {
  try {
    return ok(JSON.parse(input) as T);
  } catch (error) {
    return err(error instanceof SyntaxError ? error : new SyntaxError(String(error)));
  }
}

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return err("Division by zero");
  }
  return ok(a / b);
}

// Usage
const result = divide(10, 2);
if (result.success) {
  console.log(result.value);  // 5, TypeScript knows this is number
} else {
  console.error(result.error);  // TypeScript knows this is string
}
```

### Chaining Results

```typescript
// Map: Transform success value
function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.value));
  }
  return result;
}

// FlatMap: Chain operations that return Results
function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.value);
  }
  return result;
}

// Example: Chained operations
function processData(input: string): Result<number, string> {
  const parsed = parseJson<{ value: number }>(input);

  return flatMapResult(
    mapResult(parsed, (data) => data.value),
    (value) => divide(value, 2)
  );
}
```

## Typed Error Classes

### Custom Error Classes

```typescript
// Base application error
abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = this.constructor.name;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

// Specific error types
class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;

  constructor(
    message: string,
    readonly field: string,
    readonly constraints: string[]
  ) {
    super(message);
  }
}

class NotFoundError extends AppError {
  readonly code = "NOT_FOUND";
  readonly statusCode = 404;

  constructor(readonly resource: string, readonly id: string) {
    super(`${resource} with id ${id} not found`);
  }
}

class UnauthorizedError extends AppError {
  readonly code = "UNAUTHORIZED";
  readonly statusCode = 401;

  constructor(message = "Unauthorized access") {
    super(message);
  }
}
```

### Error Handling with Custom Errors

```typescript
type UserResult = Result<User, ValidationError | NotFoundError>;

async function getUser(id: string): Promise<UserResult> {
  if (!isValidId(id)) {
    return err(new ValidationError("Invalid ID format", "id", ["Must be UUID"]));
  }

  const user = await db.findUser(id);
  if (!user) {
    return err(new NotFoundError("User", id));
  }

  return ok(user);
}

// Handle specific error types
const result = await getUser("invalid");
if (!result.success) {
  const error = result.error;

  if (error instanceof ValidationError) {
    console.log(`Field ${error.field}: ${error.constraints.join(", ")}`);
  } else if (error instanceof NotFoundError) {
    console.log(`${error.resource} ${error.id} not found`);
  }
}
```

## Error Union Types

### Discriminated Error Unions

```typescript
type ApiError =
  | { type: "network"; message: string; retryable: boolean }
  | { type: "validation"; field: string; message: string }
  | { type: "auth"; code: "expired" | "invalid" | "missing" }
  | { type: "server"; statusCode: number; message: string };

function handleApiError(error: ApiError): string {
  switch (error.type) {
    case "network":
      return error.retryable ? "Please try again" : "Network unavailable";
    case "validation":
      return `Invalid ${error.field}: ${error.message}`;
    case "auth":
      return error.code === "expired" ? "Session expired" : "Please log in";
    case "server":
      return `Server error (${error.statusCode})`;
  }
}
```

### Multiple Error Types

```typescript
type ParseError = { type: "parse"; line: number; message: string };
type ValidateError = { type: "validate"; path: string; expected: string };
type TransformError = { type: "transform"; step: string; cause: unknown };

type ProcessError = ParseError | ValidateError | TransformError;

function process(input: string): Result<Output, ProcessError> {
  const parsed = parse(input);
  if (!parsed.success) {
    return err({ type: "parse", line: parsed.line, message: parsed.message });
  }

  const validated = validate(parsed.value);
  if (!validated.success) {
    return err({ type: "validate", path: validated.path, expected: validated.expected });
  }

  try {
    return ok(transform(validated.value));
  } catch (cause) {
    return err({ type: "transform", step: "final", cause });
  }
}
```

## Try-Catch Patterns

### Typed Try-Catch Wrapper

```typescript
function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    return ok(await fn());
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

// Usage
const result = tryCatch(() => JSON.parse(input));
const asyncResult = await tryCatchAsync(() => fetch(url));
```

### Error Context

```typescript
class ContextualError extends Error {
  constructor(
    message: string,
    readonly context: Record<string, unknown>,
    readonly cause?: Error
  ) {
    super(message);
    this.name = "ContextualError";
  }
}

function wrapError(
  error: unknown,
  message: string,
  context: Record<string, unknown> = {}
): ContextualError {
  const cause = error instanceof Error ? error : new Error(String(error));
  return new ContextualError(message, context, cause);
}

// Usage
async function fetchUserData(userId: string): Promise<Result<UserData, ContextualError>> {
  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    return ok(data);
  } catch (error) {
    return err(wrapError(error, "Failed to fetch user data", { userId }));
  }
}
```

## Async Error Handling

### Promise-Based Results

```typescript
type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

async function fetchData<T>(url: string): AsyncResult<T> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return err(new Error(`HTTP ${response.status}: ${response.statusText}`));
    }

    const data = await response.json();
    return ok(data as T);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

// Chain async results
async function getUserPosts(userId: string): AsyncResult<Post[]> {
  const userResult = await fetchData<User>(`/users/${userId}`);

  if (!userResult.success) {
    return userResult;
  }

  return fetchData<Post[]>(`/users/${userId}/posts`);
}
```

### Collecting Results

```typescript
async function collectResults<T, E>(
  results: Array<Promise<Result<T, E>>>
): Promise<Result<T[], E>> {
  const settled = await Promise.all(results);

  const errors: E[] = [];
  const values: T[] = [];

  for (const result of settled) {
    if (result.success) {
      values.push(result.value);
    } else {
      errors.push(result.error);
    }
  }

  if (errors.length > 0) {
    return err(errors[0]); // Return first error
  }

  return ok(values);
}

// Collect all errors
async function collectAllResults<T, E>(
  results: Array<Promise<Result<T, E>>>
): Promise<Result<T[], E[]>> {
  const settled = await Promise.all(results);

  const errors: E[] = [];
  const values: T[] = [];

  for (const result of settled) {
    if (result.success) {
      values.push(result.value);
    } else {
      errors.push(result.error);
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors };
  }

  return ok(values);
}
```

## Best Practices

1. **Use Result Types for Expected Failures**: Network errors, validation, not found
2. **Throw for Programmer Errors**: Null pointer, type errors, invariant violations
3. **Include Error Context**: Add relevant data for debugging
4. **Use Discriminated Unions**: Enable exhaustive error handling
5. **Don't Swallow Errors**: Always handle or propagate
6. **Log at Boundaries**: Log errors at API/service boundaries
7. **Prefer Specific Error Types**: Over generic Error class
8. **Document Error Cases**: In function signatures and JSDoc
