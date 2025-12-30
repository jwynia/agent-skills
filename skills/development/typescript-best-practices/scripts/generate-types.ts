#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * TypeScript Type Generator
 *
 * Generate TypeScript types from JSON data or API responses.
 * Infers types from JSON structure and produces well-typed definitions.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-types.ts <input> [options]
 *
 * Options:
 *   --name <name>   Root type name (default: inferred from filename)
 *   --output <path> Output file path (default: stdout)
 *   --readonly      Generate readonly types
 *   --interface     Use interface instead of type alias
 *   --export        Add export keyword
 *   -h, --help      Show help
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-types";

// === Types ===
interface GenerateOptions {
  input: string;
  name: string;
  output?: string;
  readonly: boolean;
  useInterface: boolean;
  exportTypes: boolean;
}

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

interface TypeInfo {
  name: string;
  definition: string;
  isNested: boolean;
}

// === Type Inference ===
function inferType(value: JsonValue, propertyName: string, options: GenerateOptions): string {
  if (value === null) {
    return "null";
  }

  switch (typeof value) {
    case "string":
      // Check for date-like strings
      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value)) {
        return "string"; // Could be Date, but string is safer
      }
      // Check for URL-like strings
      if (/^https?:\/\//.test(value)) {
        return "string";
      }
      // Check for UUID-like strings
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return "string";
      }
      return "string";

    case "number":
      return Number.isInteger(value) ? "number" : "number";

    case "boolean":
      return "boolean";

    case "object":
      if (Array.isArray(value)) {
        return inferArrayType(value, propertyName, options);
      }
      return toPascalCase(propertyName);

    default:
      return "unknown";
  }
}

function inferArrayType(arr: JsonArray, propertyName: string, options: GenerateOptions): string {
  if (arr.length === 0) {
    return options.readonly ? "ReadonlyArray<unknown>" : "unknown[]";
  }

  // Get types of all elements
  const elementTypes = new Set<string>();
  for (const item of arr) {
    const itemType = inferType(item, singularize(propertyName), options);
    elementTypes.add(itemType);
  }

  const typesArray = Array.from(elementTypes);

  let elementType: string;
  if (typesArray.length === 1) {
    elementType = typesArray[0];
  } else if (typesArray.every(t => t === "string" || t === "number" || t === "boolean")) {
    elementType = typesArray.join(" | ");
  } else {
    // Complex union, use the first object type or union
    elementType = typesArray.join(" | ");
  }

  if (options.readonly) {
    return `ReadonlyArray<${elementType}>`;
  }
  return `${elementType}[]`;
}

// === Name Utilities ===
function toPascalCase(str: string): string {
  return str
    .replace(/[_-](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase());
}

function toCamelCase(str: string): string {
  return str
    .replace(/[_-](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toLowerCase());
}

function singularize(str: string): string {
  if (str.endsWith("ies")) {
    return str.slice(0, -3) + "y";
  }
  if (str.endsWith("es") && !str.endsWith("ses")) {
    return str.slice(0, -2);
  }
  if (str.endsWith("s") && !str.endsWith("ss")) {
    return str.slice(0, -1);
  }
  return str;
}

function sanitizePropertyName(name: string): string {
  // Check if it needs quoting (contains special chars or starts with number)
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(name)) {
    return name;
  }
  return `"${name}"`;
}

// === Type Generation ===
function generateTypesFromObject(
  obj: JsonObject,
  typeName: string,
  options: GenerateOptions,
  collectedTypes: Map<string, TypeInfo>
): string {
  const properties: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const propName = sanitizePropertyName(key);
    const readonlyPrefix = options.readonly ? "readonly " : "";

    if (value === null) {
      properties.push(`  ${readonlyPrefix}${propName}: null;`);
    } else if (typeof value === "object" && !Array.isArray(value)) {
      // Nested object - generate a separate type
      const nestedTypeName = toPascalCase(key);
      const fullNestedTypeName = `${typeName}${nestedTypeName}`;

      generateTypesFromObject(value as JsonObject, fullNestedTypeName, options, collectedTypes);
      properties.push(`  ${readonlyPrefix}${propName}: ${fullNestedTypeName};`);
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
      // Array of objects - generate type for array element
      const elementTypeName = toPascalCase(singularize(key));
      const fullElementTypeName = `${typeName}${elementTypeName}`;

      if (!Array.isArray(value[0])) {
        generateTypesFromObject(value[0] as JsonObject, fullElementTypeName, options, collectedTypes);
        const arrayType = options.readonly
          ? `ReadonlyArray<${fullElementTypeName}>`
          : `${fullElementTypeName}[]`;
        properties.push(`  ${readonlyPrefix}${propName}: ${arrayType};`);
      } else {
        const inferredType = inferType(value, key, options);
        properties.push(`  ${readonlyPrefix}${propName}: ${inferredType};`);
      }
    } else {
      const inferredType = inferType(value, key, options);
      properties.push(`  ${readonlyPrefix}${propName}: ${inferredType};`);
    }
  }

  const exportPrefix = options.exportTypes ? "export " : "";
  let definition: string;

  if (options.useInterface) {
    definition = `${exportPrefix}interface ${typeName} {\n${properties.join("\n")}\n}`;
  } else {
    definition = `${exportPrefix}type ${typeName} = {\n${properties.join("\n")}\n};`;
  }

  collectedTypes.set(typeName, {
    name: typeName,
    definition,
    isNested: typeName !== options.name,
  });

  return typeName;
}

function generateTypes(data: JsonValue, options: GenerateOptions): string {
  const collectedTypes = new Map<string, TypeInfo>();

  if (data === null) {
    return `${options.exportTypes ? "export " : ""}type ${options.name} = null;`;
  }

  if (typeof data !== "object") {
    const inferredType = inferType(data, options.name, options);
    return `${options.exportTypes ? "export " : ""}type ${options.name} = ${inferredType};`;
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      const arrayType = options.readonly ? "ReadonlyArray<unknown>" : "unknown[]";
      return `${options.exportTypes ? "export " : ""}type ${options.name} = ${arrayType};`;
    }

    const firstItem = data[0];
    if (typeof firstItem === "object" && firstItem !== null && !Array.isArray(firstItem)) {
      // Array of objects - generate type for element and array type
      const elementTypeName = `${options.name}Item`;
      generateTypesFromObject(firstItem as JsonObject, elementTypeName, options, collectedTypes);

      const arrayType = options.readonly
        ? `ReadonlyArray<${elementTypeName}>`
        : `${elementTypeName}[]`;

      collectedTypes.set(options.name, {
        name: options.name,
        definition: `${options.exportTypes ? "export " : ""}type ${options.name} = ${arrayType};`,
        isNested: false,
      });
    } else {
      const elementType = inferType(firstItem, "item", options);
      const arrayType = options.readonly ? `ReadonlyArray<${elementType}>` : `${elementType}[]`;
      return `${options.exportTypes ? "export " : ""}type ${options.name} = ${arrayType};`;
    }
  } else {
    generateTypesFromObject(data as JsonObject, options.name, options, collectedTypes);
  }

  // Order types: nested types first, then root type
  const nestedTypes = Array.from(collectedTypes.values())
    .filter((t) => t.isNested)
    .map((t) => t.definition);

  const rootType = collectedTypes.get(options.name)?.definition || "";

  const allTypes = [...nestedTypes, rootType].filter(Boolean);
  return allTypes.join("\n\n");
}

// === File I/O ===
async function readJsonInput(inputPath: string): Promise<JsonValue> {
  let content: string;

  if (inputPath === "-") {
    // Read from stdin
    const decoder = new TextDecoder();
    const chunks: Uint8Array[] = [];
    for await (const chunk of Deno.stdin.readable) {
      chunks.push(chunk);
    }
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    content = decoder.decode(result);
  } else {
    content = await Deno.readTextFile(inputPath);
  }

  try {
    return JSON.parse(content);
  } catch {
    console.error("Error: Invalid JSON input");
    Deno.exit(1);
  }
}

function inferTypeName(inputPath: string): string {
  if (inputPath === "-") {
    return "Data";
  }

  // Extract filename without extension
  const parts = inputPath.split("/");
  const filename = parts[parts.length - 1];
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "");

  return toPascalCase(nameWithoutExt);
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Generate TypeScript types from JSON

Usage:
  deno run --allow-read --allow-write scripts/generate-types.ts <input> [options]

Arguments:
  <input>         JSON file path, or "-" for stdin

Options:
  --name <name>   Root type name (default: inferred from filename)
  --output <path> Output file path (default: stdout)
  --readonly      Generate readonly types
  --interface     Use interface instead of type alias
  --export        Add export keyword to types
  -h, --help      Show this help

Examples:
  # Generate from JSON file
  deno run --allow-read scripts/generate-types.ts ./data.json

  # Specify type name
  deno run --allow-read scripts/generate-types.ts ./api-response.json --name ApiResponse

  # Generate readonly interfaces with export
  deno run --allow-read scripts/generate-types.ts ./config.json \\
    --interface --readonly --export

  # Write to file
  deno run --allow-read --allow-write scripts/generate-types.ts ./data.json \\
    --output ./types/data.ts --export

  # Pipe from curl
  curl -s https://api.example.com/users | \\
    deno run --allow-read scripts/generate-types.ts - --name User

Output Format:
  - Nested objects become separate types
  - Arrays of objects get element types
  - Property names are preserved (quoted if needed)
  - Null values typed as 'null'
  - Empty arrays typed as 'unknown[]'
`);
}

// === CLI Handler ===
function parseArgs(args: string[]): GenerateOptions | null {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return null;
  }

  const options: GenerateOptions = {
    input: "",
    name: "",
    output: undefined,
    readonly: false,
    useInterface: false,
    exportTypes: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--name" && args[i + 1]) {
      options.name = args[++i];
    } else if (arg === "--output" && args[i + 1]) {
      options.output = args[++i];
    } else if (arg === "--readonly") {
      options.readonly = true;
    } else if (arg === "--interface") {
      options.useInterface = true;
    } else if (arg === "--export") {
      options.exportTypes = true;
    } else if (!arg.startsWith("-")) {
      options.input = arg;
    }
  }

  if (!options.input) {
    console.error("Error: Input file is required");
    return null;
  }

  // Infer name if not provided
  if (!options.name) {
    options.name = inferTypeName(options.input);
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

  const data = await readJsonInput(options.input);
  const output = generateTypes(data, options);

  // Add header comment
  const header = `/**
 * Generated TypeScript types
 * Source: ${options.input === "-" ? "stdin" : options.input}
 * Generated: ${new Date().toISOString()}
 */

`;

  const fullOutput = header + output + "\n";

  if (options.output) {
    await Deno.writeTextFile(options.output, fullOutput);
    console.log(`Types written to: ${options.output}`);
  } else {
    console.log(fullOutput);
  }
}

if (import.meta.main) {
  main();
}
