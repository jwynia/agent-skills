# Module Template

Starter template for a TypeScript utility module with proper types and structure.

## Template

```typescript
/**
 * ${ModuleName}
 *
 * ${description}
 *
 * @module ${module-name}
 */

// === Types ===

/**
 * Configuration options for ${moduleName}
 */
export interface ${ModuleName}Options {
  /**
   * Description of option
   * @default defaultValue
   */
  readonly option1?: string;

  /**
   * Another option
   */
  readonly option2?: number;
}

/**
 * Result of ${moduleName} operations
 */
export interface ${ModuleName}Result<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ${ModuleName}Error;
}

/**
 * Error information
 */
export interface ${ModuleName}Error {
  readonly code: string;
  readonly message: string;
}

// === Constants ===

/**
 * Default options
 */
const DEFAULT_OPTIONS: Required<${ModuleName}Options> = {
  option1: "default",
  option2: 0,
};

// === Implementation ===

/**
 * Main function for ${moduleName}
 *
 * @param input - The input to process
 * @param options - Configuration options
 * @returns Result containing processed data or error
 *
 * @example
 * ```typescript
 * import { ${functionName} } from "./${module-name}";
 *
 * const result = ${functionName}("input");
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
export function ${functionName}<T>(
  input: T,
  options: Partial<${ModuleName}Options> = {}
): ${ModuleName}Result<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // TODO: Implement logic
    return {
      success: true,
      data: input,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "PROCESSING_ERROR",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

/**
 * Type guard for validating input
 *
 * @param value - Value to validate
 * @returns True if value is valid input
 */
export function isValid${ModuleName}Input(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

// === Exports ===

export type {
  ${ModuleName}Options,
  ${ModuleName}Result,
  ${ModuleName}Error,
};
```

## Usage

1. Copy the template to your project
2. Replace placeholders:
   - `${ModuleName}` - PascalCase name (e.g., `StringUtils`)
   - `${moduleName}` - camelCase name (e.g., `stringUtils`)
   - `${module-name}` - kebab-case name (e.g., `string-utils`)
   - `${functionName}` - Main function name (e.g., `processString`)
   - `${description}` - Module description

3. Implement the logic in the main function
4. Add additional functions as needed
5. Update types to match your domain
