# API Design

Best practices for designing TypeScript interfaces, function signatures, and module APIs.

## Interface Design Principles

### Minimal Interfaces

```typescript
// BAD: God interface with everything
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  roles: Role[];
  orders: Order[];
  notifications: Notification[];
}

// GOOD: Separate concerns
interface UserIdentity {
  readonly id: string;
  readonly email: string;
}

interface UserProfile {
  readonly name: string;
  readonly preferences: UserPreferences;
}

interface UserAuth {
  readonly passwordHash: string;
  readonly lastLoginAt: Date;
}

// Compose when needed
interface User extends UserIdentity, UserProfile {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

### Readonly by Default

```typescript
// Mark properties as readonly unless mutation is required
interface Config {
  readonly host: string;
  readonly port: number;
  readonly features: ReadonlyArray<string>;
  readonly database: Readonly<DatabaseConfig>;
}

// Only omit readonly when mutation is intentional
interface MutableState {
  count: number;  // Intentionally mutable
  items: string[]; // Intentionally mutable array
}
```

### Optional vs Required

```typescript
// Be explicit about optionality
interface CreateUserInput {
  email: string;           // Required
  name: string;            // Required
  phone?: string;          // Optional
  preferences?: Partial<UserPreferences>; // Optional partial
}

// Use undefined for "not set" vs null for "explicitly empty"
interface SearchResult {
  data: Item[];
  cursor: string | null;      // null = no more pages
  error: string | undefined;  // undefined = no error
}
```

## Function Signatures

### Parameter Design

```typescript
// Prefer objects for 3+ parameters
// BAD
function createUser(
  name: string,
  email: string,
  password: string,
  role: string,
  sendWelcomeEmail: boolean
): User;

// GOOD
interface CreateUserOptions {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role?: UserRole;
  readonly sendWelcomeEmail?: boolean;
}

function createUser(options: CreateUserOptions): User;

// Use defaults for optional parameters
function createUser({
  name,
  email,
  password,
  role = "user",
  sendWelcomeEmail = true,
}: CreateUserOptions): User;
```

### Return Types

```typescript
// Always specify return types for public APIs
function calculateTotal(items: ReadonlyArray<Item>): number;

// Use Result types for operations that can fail
function parseConfig(input: string): Result<Config, ParseError>;

// Return readonly types
function getUsers(): Promise<ReadonlyArray<User>>;

// Avoid returning undefined when null is more appropriate
function findById(id: string): User | null; // null = not found
```

### Function Overloads

```typescript
// Use overloads for different input/output type combinations
function parse(input: string): ParsedData;
function parse(input: Buffer): ParsedData;
function parse(input: ReadableStream): Promise<ParsedData>;
function parse(
  input: string | Buffer | ReadableStream
): ParsedData | Promise<ParsedData> {
  // Implementation
}

// Prefer union types for simpler cases
function format(value: string | number | Date): string;
```

## Generic API Design

### Meaningful Constraints

```typescript
// Constrain generics to what's actually needed
function findById<T extends { id: string }>(
  items: ReadonlyArray<T>,
  id: string
): T | undefined {
  return items.find(item => item.id === id);
}

// Use keyof for property access
function pluck<T, K extends keyof T>(
  items: ReadonlyArray<T>,
  key: K
): Array<T[K]> {
  return items.map(item => item[key]);
}

// Default type parameters
function createStore<T = unknown>(): Store<T>;
```

### Generic Naming

```typescript
// Use descriptive names for complex generics
function mapAsync<TInput, TOutput>(
  items: ReadonlyArray<TInput>,
  mapper: (item: TInput) => Promise<TOutput>
): Promise<TOutput[]>;

// Common conventions
// T - General type
// K - Key type
// V - Value type
// E - Error type
// R - Return type
// TItem - Element of collection
// TResult - Result of operation
```

## Builder Pattern

### Fluent Builder

```typescript
interface QueryBuilder<T> {
  where(condition: Partial<T>): QueryBuilder<T>;
  orderBy(field: keyof T, direction?: "asc" | "desc"): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  offset(count: number): QueryBuilder<T>;
  execute(): Promise<T[]>;
}

function query<T>(table: string): QueryBuilder<T>;

// Usage
const users = await query<User>("users")
  .where({ status: "active" })
  .orderBy("createdAt", "desc")
  .limit(10)
  .execute();
```

### Options Builder

```typescript
class RequestBuilder {
  private options: RequestOptions = {};

  url(url: string): this {
    this.options.url = url;
    return this;
  }

  method(method: HttpMethod): this {
    this.options.method = method;
    return this;
  }

  headers(headers: Record<string, string>): this {
    this.options.headers = { ...this.options.headers, ...headers };
    return this;
  }

  timeout(ms: number): this {
    this.options.timeout = ms;
    return this;
  }

  build(): Request {
    return new Request(this.options);
  }
}
```

## Versioning and Compatibility

### Additive Changes (Non-Breaking)

```typescript
// Adding optional properties is safe
interface UserV1 {
  id: string;
  name: string;
}

interface UserV2 extends UserV1 {
  email?: string;  // New optional property - safe
}

// Adding new methods with defaults is safe
interface ServiceV1 {
  getUser(id: string): Promise<User>;
}

interface ServiceV2 extends ServiceV1 {
  getUserByEmail?(email: string): Promise<User>; // Optional method - safe
}
```

### Breaking Changes

```typescript
// These are breaking changes:
// 1. Removing properties
// 2. Making optional properties required
// 3. Changing property types
// 4. Changing return types
// 5. Adding required parameters

// Migration strategy: Create new type
interface UserV1 {
  name: string;
}

interface UserV2 {
  firstName: string;  // Changed from name
  lastName: string;   // New required field
}

// Provide migration function
function migrateUserV1ToV2(user: UserV1): UserV2 {
  const [firstName, ...rest] = user.name.split(" ");
  return {
    firstName,
    lastName: rest.join(" ") || "Unknown",
  };
}
```

### Deprecation Pattern

```typescript
interface UserService {
  /**
   * @deprecated Use `findById` instead. Will be removed in v3.0.
   */
  getUser(id: string): Promise<User>;

  /**
   * Find user by ID
   * @since 2.0
   */
  findById(id: string): Promise<User | null>;
}

// Runtime deprecation warning
function getUser(id: string): Promise<User> {
  console.warn("getUser is deprecated. Use findById instead.");
  return this.findById(id).then(user => {
    if (!user) throw new Error("User not found");
    return user;
  });
}
```

## Error Design

### Typed Errors

```typescript
// Define error types for each failure mode
type UserError =
  | { type: "not_found"; id: string }
  | { type: "validation"; field: string; message: string }
  | { type: "duplicate"; email: string };

// Use with Result type
function createUser(input: CreateUserInput): Result<User, UserError>;

// Or custom error classes
class UserNotFoundError extends Error {
  readonly type = "not_found" as const;
  constructor(readonly id: string) {
    super(`User ${id} not found`);
  }
}
```

### Error Codes

```typescript
// Use error codes for programmatic handling
const UserErrorCodes = {
  NOT_FOUND: "USER_NOT_FOUND",
  INVALID_EMAIL: "USER_INVALID_EMAIL",
  DUPLICATE_EMAIL: "USER_DUPLICATE_EMAIL",
  UNAUTHORIZED: "USER_UNAUTHORIZED",
} as const;

type UserErrorCode = typeof UserErrorCodes[keyof typeof UserErrorCodes];

interface UserError {
  code: UserErrorCode;
  message: string;
  details?: Record<string, unknown>;
}
```

## Documentation

### JSDoc for Public APIs

```typescript
/**
 * Creates a new user account
 *
 * @param options - User creation options
 * @returns The created user
 * @throws {ValidationError} If email format is invalid
 * @throws {DuplicateError} If email already exists
 *
 * @example
 * ```typescript
 * const user = await createUser({
 *   email: "john@example.com",
 *   name: "John Doe",
 * });
 * ```
 *
 * @since 1.0.0
 * @see {@link updateUser} for updating existing users
 */
function createUser(options: CreateUserOptions): Promise<User>;

/**
 * User creation options
 *
 * @property email - Must be a valid email format
 * @property name - Display name (1-100 characters)
 * @property role - User role (defaults to "user")
 */
interface CreateUserOptions {
  readonly email: string;
  readonly name: string;
  readonly role?: UserRole;
}
```

## Best Practices

1. **Design for Consumers**: Think about how the API will be used
2. **Minimize Surface Area**: Export only what's needed
3. **Use Readonly by Default**: Mutability should be intentional
4. **Prefer Objects for Options**: Easier to extend and read
5. **Return Consistent Types**: Same operation, same return shape
6. **Document Public APIs**: JSDoc for functions and interfaces
7. **Use Result Types**: For operations that can fail
8. **Version Carefully**: Plan for backwards compatibility
9. **Constrain Generics**: Only require what's needed
10. **Name Meaningfully**: Types, functions, and parameters
