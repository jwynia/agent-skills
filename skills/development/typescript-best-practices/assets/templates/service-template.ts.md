# Service Template

Starter template for a TypeScript service class with dependency injection, error handling, and proper types.

## Template

```typescript
/**
 * ${ServiceName} Service
 *
 * Handles ${domain}-related operations.
 *
 * @module ${service-name}
 */

// === Types ===

/**
 * Configuration for ${ServiceName}Service
 */
export interface ${ServiceName}Config {
  /**
   * Base URL for API requests
   */
  readonly baseUrl?: string;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  readonly timeout?: number;

  /**
   * Enable debug logging
   * @default false
   */
  readonly debug?: boolean;
}

/**
 * Entity managed by this service
 */
export interface ${EntityName} {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  // Add entity-specific fields
}

/**
 * Input for creating a new entity
 */
export type Create${EntityName}Input = Omit<${EntityName}, "id" | "createdAt" | "updatedAt">;

/**
 * Input for updating an entity
 */
export type Update${EntityName}Input = Partial<Create${EntityName}Input>;

/**
 * Query parameters for listing entities
 */
export interface ${EntityName}Query {
  readonly limit?: number;
  readonly offset?: number;
  readonly orderBy?: keyof ${EntityName};
  readonly order?: "asc" | "desc";
}

/**
 * Result type for service operations
 */
export type ${ServiceName}Result<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ${ServiceName}Error };

/**
 * Error type for service operations
 */
export class ${ServiceName}Error extends Error {
  constructor(
    message: string,
    readonly code: ${ServiceName}ErrorCode,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "${ServiceName}Error";
  }
}

/**
 * Error codes for this service
 */
export type ${ServiceName}ErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "DUPLICATE"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR";

// === Dependencies ===

/**
 * Logger interface
 */
interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

/**
 * Repository interface
 */
interface ${EntityName}Repository {
  findById(id: string): Promise<${EntityName} | null>;
  findAll(query?: ${EntityName}Query): Promise<ReadonlyArray<${EntityName}>>;
  create(input: Create${EntityName}Input): Promise<${EntityName}>;
  update(id: string, input: Update${EntityName}Input): Promise<${EntityName} | null>;
  delete(id: string): Promise<boolean>;
}

// === Constants ===

const DEFAULT_CONFIG: Required<${ServiceName}Config> = {
  baseUrl: "",
  timeout: 30000,
  debug: false,
};

// === Service Implementation ===

/**
 * Service for managing ${entityName} operations
 *
 * @example
 * ```typescript
 * const service = create${ServiceName}Service({
 *   repository,
 *   logger,
 *   config: { debug: true },
 * });
 *
 * const result = await service.getById("123");
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export class ${ServiceName}Service {
  private readonly config: Required<${ServiceName}Config>;

  constructor(
    private readonly repository: ${EntityName}Repository,
    private readonly logger: Logger,
    config: Partial<${ServiceName}Config> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<${ServiceName}Result<${EntityName}>> {
    this.log("debug", "Getting entity by ID", { id });

    try {
      const entity = await this.repository.findById(id);

      if (!entity) {
        return this.failure("NOT_FOUND", `${EntityName} not found: ${id}`);
      }

      return this.success(entity);
    } catch (error) {
      return this.handleError(error, "Failed to get entity");
    }
  }

  /**
   * Get all entities
   */
  async getAll(
    query?: ${EntityName}Query
  ): Promise<${ServiceName}Result<ReadonlyArray<${EntityName}>>> {
    this.log("debug", "Getting all entities", { query });

    try {
      const entities = await this.repository.findAll(query);
      return this.success(entities);
    } catch (error) {
      return this.handleError(error, "Failed to get entities");
    }
  }

  /**
   * Create new entity
   */
  async create(
    input: Create${EntityName}Input
  ): Promise<${ServiceName}Result<${EntityName}>> {
    this.log("debug", "Creating entity", { input });

    try {
      // TODO: Add validation
      const entity = await this.repository.create(input);
      this.log("info", "Entity created", { id: entity.id });
      return this.success(entity);
    } catch (error) {
      return this.handleError(error, "Failed to create entity");
    }
  }

  /**
   * Update existing entity
   */
  async update(
    id: string,
    input: Update${EntityName}Input
  ): Promise<${ServiceName}Result<${EntityName}>> {
    this.log("debug", "Updating entity", { id, input });

    try {
      const entity = await this.repository.update(id, input);

      if (!entity) {
        return this.failure("NOT_FOUND", `${EntityName} not found: ${id}`);
      }

      this.log("info", "Entity updated", { id });
      return this.success(entity);
    } catch (error) {
      return this.handleError(error, "Failed to update entity");
    }
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<${ServiceName}Result<void>> {
    this.log("debug", "Deleting entity", { id });

    try {
      const deleted = await this.repository.delete(id);

      if (!deleted) {
        return this.failure("NOT_FOUND", `${EntityName} not found: ${id}`);
      }

      this.log("info", "Entity deleted", { id });
      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, "Failed to delete entity");
    }
  }

  // === Private Helpers ===

  private success<T>(data: T): ${ServiceName}Result<T> {
    return { success: true, data };
  }

  private failure(
    code: ${ServiceName}ErrorCode,
    message: string,
    cause?: unknown
  ): ${ServiceName}Result<never> {
    return {
      success: false,
      error: new ${ServiceName}Error(message, code, cause),
    };
  }

  private handleError(error: unknown, message: string): ${ServiceName}Result<never> {
    this.log("error", message, { error });
    return this.failure("INTERNAL_ERROR", message, error);
  }

  private log(
    level: "debug" | "info" | "error",
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (level === "debug" && !this.config.debug) return;
    this.logger[level](`[${ServiceName}Service] ${message}`, context);
  }
}

// === Factory Function ===

interface ${ServiceName}ServiceDeps {
  readonly repository: ${EntityName}Repository;
  readonly logger: Logger;
  readonly config?: Partial<${ServiceName}Config>;
}

/**
 * Create a new ${ServiceName}Service instance
 */
export function create${ServiceName}Service(
  deps: ${ServiceName}ServiceDeps
): ${ServiceName}Service {
  return new ${ServiceName}Service(deps.repository, deps.logger, deps.config);
}
```

## Usage

1. Copy the template to your project
2. Replace placeholders:
   - `${ServiceName}` - PascalCase service name (e.g., `User`)
   - `${EntityName}` - PascalCase entity name (e.g., `User`)
   - `${entityName}` - camelCase entity name (e.g., `user`)
   - `${service-name}` - kebab-case name (e.g., `user-service`)
   - `${domain}` - Domain description (e.g., `user management`)

3. Add entity-specific fields to the interface
4. Implement repository with your data source
5. Add validation logic as needed
6. Extend error codes for your domain
