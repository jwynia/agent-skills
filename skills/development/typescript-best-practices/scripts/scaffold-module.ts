#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * TypeScript Module Scaffolder
 *
 * Create properly structured TypeScript modules with types,
 * implementation, and optional test files.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/scaffold-module.ts [options]
 *
 * Options:
 *   --name <name>   Module name (required)
 *   --path <path>   Target directory (default: ./src)
 *   --type <type>   Type: service, util, component, hook
 *   --with-tests    Include test file
 *   -h, --help      Show help
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "scaffold-module";

// === Types ===
type ModuleType = "service" | "util" | "component" | "hook";

interface ScaffoldOptions {
  name: string;
  path: string;
  type: ModuleType;
  withTests: boolean;
}

// === Name Utilities ===
function toPascalCase(str: string): string {
  return str
    .replace(/[_-](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase());
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

// === Templates ===
function generateUtilTemplate(name: string): string {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);

  return `/**
 * ${pascalName} Utilities
 *
 * @module ${toKebabCase(name)}
 */

// === Types ===

/**
 * Options for ${camelName} operations
 */
export interface ${pascalName}Options {
  readonly strict?: boolean;
}

/**
 * Result of ${camelName} operations
 */
export interface ${pascalName}Result<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
}

// === Constants ===

const DEFAULT_OPTIONS: ${pascalName}Options = {
  strict: false,
};

// === Implementation ===

/**
 * Process input using ${camelName} logic
 *
 * @param input - The input to process
 * @param options - Processing options
 * @returns Processing result
 *
 * @example
 * \`\`\`typescript
 * const result = ${camelName}("input");
 * if (result.success) {
 *   console.log(result.data);
 * }
 * \`\`\`
 */
export function ${camelName}<T>(
  input: T,
  options: Partial<${pascalName}Options> = {}
): ${pascalName}Result<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // TODO: Implement ${camelName} logic
    return {
      success: true,
      data: input,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if value is valid for ${camelName} processing
 *
 * @param value - Value to validate
 * @returns True if valid
 */
export function isValid${pascalName}Input(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
`;
}

function generateServiceTemplate(name: string): string {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);

  return `/**
 * ${pascalName} Service
 *
 * Handles ${camelName}-related operations.
 *
 * @module ${toKebabCase(name)}
 */

// === Types ===

/**
 * Configuration for ${pascalName}Service
 */
export interface ${pascalName}Config {
  readonly baseUrl?: string;
  readonly timeout?: number;
}

/**
 * Entity managed by this service
 */
export interface ${pascalName}Entity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Result type for service operations
 */
export type ${pascalName}Result<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: ${pascalName}Error };

/**
 * Error type for service operations
 */
export class ${pascalName}Error extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "${pascalName}Error";
  }
}

// === Constants ===

const DEFAULT_CONFIG: ${pascalName}Config = {
  timeout: 30000,
};

// === Service Implementation ===

/**
 * Service for managing ${camelName} operations
 *
 * @example
 * \`\`\`typescript
 * const service = new ${pascalName}Service({ baseUrl: "https://api.example.com" });
 * const result = await service.getById("123");
 * if (result.success) {
 *   console.log(result.data);
 * }
 * \`\`\`
 */
export class ${pascalName}Service {
  private readonly config: ${pascalName}Config;

  constructor(config: Partial<${pascalName}Config> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get entity by ID
   */
  async getById(id: string): Promise<${pascalName}Result<${pascalName}Entity>> {
    try {
      // TODO: Implement getById
      const entity: ${pascalName}Entity = {
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { success: true, data: entity };
    } catch (error) {
      return {
        success: false,
        error: new ${pascalName}Error(
          "Failed to get entity",
          "GET_FAILED",
          error
        ),
      };
    }
  }

  /**
   * Get all entities
   */
  async getAll(): Promise<${pascalName}Result<ReadonlyArray<${pascalName}Entity>>> {
    try {
      // TODO: Implement getAll
      return { success: true, data: [] };
    } catch (error) {
      return {
        success: false,
        error: new ${pascalName}Error(
          "Failed to get entities",
          "GET_ALL_FAILED",
          error
        ),
      };
    }
  }

  /**
   * Create new entity
   */
  async create(
    data: Omit<${pascalName}Entity, "id" | "createdAt" | "updatedAt">
  ): Promise<${pascalName}Result<${pascalName}Entity>> {
    try {
      // TODO: Implement create
      const entity: ${pascalName}Entity = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { success: true, data: entity };
    } catch (error) {
      return {
        success: false,
        error: new ${pascalName}Error(
          "Failed to create entity",
          "CREATE_FAILED",
          error
        ),
      };
    }
  }

  /**
   * Delete entity by ID
   */
  async delete(id: string): Promise<${pascalName}Result<void>> {
    try {
      // TODO: Implement delete
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: new ${pascalName}Error(
          "Failed to delete entity",
          "DELETE_FAILED",
          error
        ),
      };
    }
  }
}

// === Factory Function ===

/**
 * Create a new ${pascalName}Service instance
 */
export function create${pascalName}Service(
  config?: Partial<${pascalName}Config>
): ${pascalName}Service {
  return new ${pascalName}Service(config);
}
`;
}

function generateComponentTemplate(name: string): string {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);

  return `/**
 * ${pascalName} Component
 *
 * @module ${toKebabCase(name)}
 */

// === Types ===

/**
 * Props for ${pascalName} component
 */
export interface ${pascalName}Props {
  readonly id?: string;
  readonly className?: string;
  readonly children?: unknown;
  readonly onAction?: (event: ${pascalName}Event) => void;
}

/**
 * Event emitted by ${pascalName}
 */
export interface ${pascalName}Event {
  readonly type: string;
  readonly target: ${pascalName}State;
  readonly timestamp: number;
}

/**
 * Internal state for ${pascalName}
 */
export interface ${pascalName}State {
  readonly isActive: boolean;
  readonly isLoading: boolean;
  readonly error?: string;
}

// === Constants ===

const INITIAL_STATE: ${pascalName}State = {
  isActive: false,
  isLoading: false,
};

// === Component Implementation ===

/**
 * ${pascalName} component class
 *
 * @example
 * \`\`\`typescript
 * const component = new ${pascalName}({
 *   onAction: (event) => console.log(event),
 * });
 * component.activate();
 * \`\`\`
 */
export class ${pascalName} {
  private readonly props: ${pascalName}Props;
  private state: ${pascalName}State;

  constructor(props: ${pascalName}Props = {}) {
    this.props = props;
    this.state = { ...INITIAL_STATE };
  }

  /**
   * Get current state
   */
  getState(): Readonly<${pascalName}State> {
    return this.state;
  }

  /**
   * Activate the component
   */
  activate(): void {
    this.setState({ isActive: true });
    this.emitEvent("activate");
  }

  /**
   * Deactivate the component
   */
  deactivate(): void {
    this.setState({ isActive: false });
    this.emitEvent("deactivate");
  }

  /**
   * Set loading state
   */
  setLoading(isLoading: boolean): void {
    this.setState({ isLoading });
  }

  /**
   * Set error state
   */
  setError(error: string | undefined): void {
    this.setState({ error });
  }

  /**
   * Update internal state
   */
  private setState(partial: Partial<${pascalName}State>): void {
    this.state = { ...this.state, ...partial };
  }

  /**
   * Emit event to handler
   */
  private emitEvent(type: string): void {
    if (this.props.onAction) {
      this.props.onAction({
        type,
        target: this.state,
        timestamp: Date.now(),
      });
    }
  }
}

// === Factory Function ===

/**
 * Create a new ${pascalName} instance
 */
export function create${pascalName}(props?: ${pascalName}Props): ${pascalName} {
  return new ${pascalName}(props);
}
`;
}

function generateHookTemplate(name: string): string {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  const hookName = name.startsWith("use") ? camelName : `use${pascalName}`;

  return `/**
 * ${hookName} Hook
 *
 * Custom hook for ${camelName} functionality.
 *
 * @module ${toKebabCase(name)}
 */

// === Types ===

/**
 * Options for ${hookName}
 */
export interface ${pascalName}Options {
  readonly initialValue?: string;
  readonly enabled?: boolean;
}

/**
 * State returned by ${hookName}
 */
export interface ${pascalName}State {
  readonly value: string;
  readonly isLoading: boolean;
  readonly error: string | null;
}

/**
 * Actions returned by ${hookName}
 */
export interface ${pascalName}Actions {
  readonly setValue: (value: string) => void;
  readonly reset: () => void;
  readonly refresh: () => Promise<void>;
}

/**
 * Return type of ${hookName}
 */
export type ${pascalName}Return = readonly [${pascalName}State, ${pascalName}Actions];

// === Constants ===

const DEFAULT_OPTIONS: ${pascalName}Options = {
  initialValue: "",
  enabled: true,
};

// === Hook Implementation ===

/**
 * Custom hook for ${camelName} functionality
 *
 * @param options - Hook options
 * @returns State and actions tuple
 *
 * @example
 * \`\`\`typescript
 * // In a React component:
 * const [state, actions] = ${hookName}({ initialValue: "hello" });
 *
 * if (state.isLoading) return <Loading />;
 * if (state.error) return <Error message={state.error} />;
 *
 * return (
 *   <div>
 *     <span>{state.value}</span>
 *     <button onClick={() => actions.setValue("new value")}>Update</button>
 *     <button onClick={actions.reset}>Reset</button>
 *   </div>
 * );
 * \`\`\`
 */
export function ${hookName}(
  options: Partial<${pascalName}Options> = {}
): ${pascalName}Return {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State management (framework-agnostic placeholder)
  let state: ${pascalName}State = {
    value: opts.initialValue ?? "",
    isLoading: false,
    error: null,
  };

  const setState = (partial: Partial<${pascalName}State>): void => {
    state = { ...state, ...partial };
    // In React, this would trigger a re-render
  };

  // Actions
  const setValue = (value: string): void => {
    setState({ value, error: null });
  };

  const reset = (): void => {
    setState({
      value: opts.initialValue ?? "",
      isLoading: false,
      error: null,
    });
  };

  const refresh = async (): Promise<void> => {
    if (!opts.enabled) return;

    setState({ isLoading: true, error: null });

    try {
      // TODO: Implement refresh logic
      await new Promise((resolve) => setTimeout(resolve, 100));
      setState({ isLoading: false });
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const actions: ${pascalName}Actions = {
    setValue,
    reset,
    refresh,
  };

  return [state, actions] as const;
}

// === Utility Types ===

/**
 * Extract state type from hook return
 */
export type ${pascalName}StateType = ${pascalName}Return[0];

/**
 * Extract actions type from hook return
 */
export type ${pascalName}ActionsType = ${pascalName}Return[1];
`;
}

function generateTestTemplate(name: string, moduleType: ModuleType): string {
  const pascalName = toPascalCase(name);
  const camelName = toCamelCase(name);
  const fileName = toKebabCase(name);

  let importStatement: string;
  let testCases: string;

  switch (moduleType) {
    case "service":
      importStatement = `import { ${pascalName}Service, create${pascalName}Service } from "./${fileName}.ts";`;
      testCases = `
describe("${pascalName}Service", () => {
  let service: ${pascalName}Service;

  beforeEach(() => {
    service = create${pascalName}Service();
  });

  describe("getById", () => {
    it("should return entity by id", async () => {
      const result = await service.getById("test-id");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("test-id");
      }
    });
  });

  describe("getAll", () => {
    it("should return empty array initially", async () => {
      const result = await service.getAll();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe("create", () => {
    it("should create new entity", async () => {
      const result = await service.create({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBeDefined();
        expect(result.data.createdAt).toBeInstanceOf(Date);
      }
    });
  });

  describe("delete", () => {
    it("should delete entity", async () => {
      const result = await service.delete("test-id");

      expect(result.success).toBe(true);
    });
  });
});`;
      break;

    case "util":
      importStatement = `import { ${camelName}, isValid${pascalName}Input } from "./${fileName}.ts";`;
      testCases = `
describe("${camelName}", () => {
  it("should process valid input", () => {
    const result = ${camelName}("test input");

    expect(result.success).toBe(true);
    expect(result.data).toBe("test input");
  });

  it("should handle errors gracefully", () => {
    // TODO: Add error case tests
  });
});

describe("isValid${pascalName}Input", () => {
  it("should return true for valid string", () => {
    expect(isValid${pascalName}Input("valid")).toBe(true);
  });

  it("should return false for empty string", () => {
    expect(isValid${pascalName}Input("")).toBe(false);
  });

  it("should return false for non-string", () => {
    expect(isValid${pascalName}Input(123)).toBe(false);
    expect(isValid${pascalName}Input(null)).toBe(false);
    expect(isValid${pascalName}Input(undefined)).toBe(false);
  });
});`;
      break;

    case "component":
      importStatement = `import { ${pascalName}, create${pascalName} } from "./${fileName}.ts";`;
      testCases = `
describe("${pascalName}", () => {
  let component: ${pascalName};

  beforeEach(() => {
    component = create${pascalName}();
  });

  it("should initialize with default state", () => {
    const state = component.getState();

    expect(state.isActive).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeUndefined();
  });

  it("should activate", () => {
    component.activate();

    expect(component.getState().isActive).toBe(true);
  });

  it("should deactivate", () => {
    component.activate();
    component.deactivate();

    expect(component.getState().isActive).toBe(false);
  });

  it("should emit events on action", () => {
    const events: string[] = [];
    const component = create${pascalName}({
      onAction: (event) => events.push(event.type),
    });

    component.activate();
    component.deactivate();

    expect(events).toEqual(["activate", "deactivate"]);
  });
});`;
      break;

    case "hook":
      const hookName = name.startsWith("use") ? camelName : `use${pascalName}`;
      importStatement = `import { ${hookName} } from "./${fileName}.ts";`;
      testCases = `
describe("${hookName}", () => {
  it("should initialize with default state", () => {
    const [state] = ${hookName}();

    expect(state.value).toBe("");
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("should initialize with custom initial value", () => {
    const [state] = ${hookName}({ initialValue: "custom" });

    expect(state.value).toBe("custom");
  });

  it("should update value", () => {
    const [, actions] = ${hookName}();

    actions.setValue("new value");

    // Note: In React, this would trigger a re-render
    // This is a simplified test for the hook logic
  });

  it("should reset to initial value", () => {
    const [, actions] = ${hookName}({ initialValue: "initial" });

    actions.setValue("changed");
    actions.reset();

    // Note: Verify reset behavior
  });
});`;
      break;
  }

  return `/**
 * Tests for ${pascalName}
 */

${importStatement}

// Test utilities
const describe = (name: string, fn: () => void) => {
  console.log(\`\\n\${name}\`);
  fn();
};

const it = (name: string, fn: () => void | Promise<void>) => {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => console.log(\`  ✓ \${name}\`))
            .catch((e) => console.error(\`  ✗ \${name}: \${e}\`));
    } else {
      console.log(\`  ✓ \${name}\`);
    }
  } catch (e) {
    console.error(\`  ✗ \${name}: \${e}\`);
  }
};

const beforeEach = (fn: () => void) => {
  // Simplified: just call before each test
  fn();
};

const expect = <T>(value: T) => ({
  toBe: (expected: T) => {
    if (value !== expected) throw new Error(\`Expected \${expected} but got \${value}\`);
  },
  toEqual: (expected: T) => {
    if (JSON.stringify(value) !== JSON.stringify(expected)) {
      throw new Error(\`Expected \${JSON.stringify(expected)} but got \${JSON.stringify(value)}\`);
    }
  },
  toBeDefined: () => {
    if (value === undefined) throw new Error("Expected value to be defined");
  },
  toBeUndefined: () => {
    if (value !== undefined) throw new Error(\`Expected undefined but got \${value}\`);
  },
  toBeNull: () => {
    if (value !== null) throw new Error(\`Expected null but got \${value}\`);
  },
  toBeInstanceOf: (type: new (...args: unknown[]) => unknown) => {
    if (!(value instanceof type)) throw new Error(\`Expected instance of \${type.name}\`);
  },
});
${testCases}

// Run tests
console.log("Running tests...");
`;
}

// === File Operations ===
async function scaffold(options: ScaffoldOptions): Promise<void> {
  const kebabName = toKebabCase(options.name);
  const modulePath = `${options.path}/${kebabName}`;
  const filePath = `${modulePath}/${kebabName}.ts`;
  const testPath = `${modulePath}/${kebabName}.test.ts`;

  // Check if directory already exists
  try {
    const stat = await Deno.stat(modulePath);
    if (stat.isDirectory) {
      console.error(`Error: Directory already exists: ${modulePath}`);
      Deno.exit(1);
    }
  } catch {
    // Directory doesn't exist, which is what we want
  }

  // Create directory
  await Deno.mkdir(modulePath, { recursive: true });
  console.log(`Created: ${modulePath}/`);

  // Generate and write module file
  let template: string;
  switch (options.type) {
    case "service":
      template = generateServiceTemplate(options.name);
      break;
    case "util":
      template = generateUtilTemplate(options.name);
      break;
    case "component":
      template = generateComponentTemplate(options.name);
      break;
    case "hook":
      template = generateHookTemplate(options.name);
      break;
  }

  await Deno.writeTextFile(filePath, template);
  console.log(`Created: ${filePath}`);

  // Generate and write test file if requested
  if (options.withTests) {
    const testTemplate = generateTestTemplate(options.name, options.type);
    await Deno.writeTextFile(testPath, testTemplate);
    console.log(`Created: ${testPath}`);
  }

  // Create index.ts for re-exports
  const indexPath = `${modulePath}/index.ts`;
  const indexContent = `/**
 * ${toPascalCase(options.name)} Module
 *
 * @module ${kebabName}
 */

export * from "./${kebabName}.ts";
`;
  await Deno.writeTextFile(indexPath, indexContent);
  console.log(`Created: ${indexPath}`);

  console.log("\nDone! Next steps:");
  console.log(`  1. Implement TODO items in ${filePath}`);
  if (options.withTests) {
    console.log(`  2. Run tests: deno test ${testPath}`);
  }
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - TypeScript Module Scaffolder

Usage:
  deno run --allow-read --allow-write scripts/scaffold-module.ts [options]

Required Options:
  --name <name>   Module name (kebab-case or camelCase)

Optional Options:
  --path <path>   Target directory (default: ./src)
  --type <type>   Module type: service, util, component, hook (default: util)
  --with-tests    Include test file
  -h, --help      Show this help

Module Types:
  service     Class-based service with CRUD operations and Result types
  util        Utility functions with options and validation
  component   Component class with state and event handling
  hook        Custom hook pattern (React-style, framework-agnostic)

Examples:
  # Create a utility module
  deno run --allow-read --allow-write scripts/scaffold-module.ts \\
    --name "string-utils" --type util

  # Create a service with tests
  deno run --allow-read --allow-write scripts/scaffold-module.ts \\
    --name "user-service" --type service --with-tests

  # Create a hook in custom directory
  deno run --allow-read --allow-write scripts/scaffold-module.ts \\
    --name "use-auth" --type hook --path ./src/hooks

Output Structure:
  <module-name>/
  ├── <module-name>.ts       # Main module file
  ├── <module-name>.test.ts  # Test file (if --with-tests)
  └── index.ts               # Re-exports
`);
}

// === CLI Handler ===
function parseArgs(args: string[]): ScaffoldOptions | null {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return null;
  }

  const options: ScaffoldOptions = {
    name: "",
    path: "./src",
    type: "util",
    withTests: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--name" && args[i + 1]) {
      options.name = args[++i];
    } else if (arg === "--path" && args[i + 1]) {
      options.path = args[++i];
    } else if (arg === "--type" && args[i + 1]) {
      const type = args[++i] as ModuleType;
      if (!["service", "util", "component", "hook"].includes(type)) {
        console.error(`Error: Invalid type "${type}". Use: service, util, component, hook`);
        Deno.exit(1);
      }
      options.type = type;
    } else if (arg === "--with-tests") {
      options.withTests = true;
    }
  }

  if (!options.name) {
    console.error("Error: --name is required");
    return null;
  }

  return options;
}

// === Entry Point ===
async function main(): Promise<void> {
  const options = parseArgs(Deno.args);

  if (!options) {
    printHelp();
    Deno.exit(0);
  }

  await scaffold(options);
}

if (import.meta.main) {
  main();
}
