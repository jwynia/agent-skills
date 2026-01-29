#!/usr/bin/env -S deno run --allow-read

/**
 * Function-Form Generator
 *
 * Works with abstract story functions and setting-specific forms.
 * Select a function for story role, then instantiate with setting-appropriate form.
 *
 * Usage:
 *   deno run --allow-read functions.ts                    # Random function + form
 *   deno run --allow-read functions.ts --setting scifi    # Random function, scifi form
 *   deno run --allow-read functions.ts healer             # Specific function, random setting
 *   deno run --allow-read functions.ts healer --setting fantasy  # Specific both
 *   deno run --allow-read functions.ts --list             # List all functions
 *   deno run --allow-read functions.ts --list-settings    # List all settings
 *   deno run --allow-read functions.ts --count 3          # Multiple random results
 */

interface FunctionData {
  description: string;
  story_access: string[];
  forms: Record<string, string[]>;
}

interface FunctionsFile {
  _meta: { description: string; usage: string };
  functions: Record<string, FunctionData>;
  settings: string[];
}

function randomFrom<T>(arr: T[], count: number = 1): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

interface GeneratedResult {
  function: string;
  description: string;
  story_access: string[];
  setting: string;
  form: string;
}

function generateResult(
  data: FunctionsFile,
  functionName: string | null,
  setting: string | null
): GeneratedResult {
  // Pick function
  const funcNames = Object.keys(data.functions);
  const selectedFunc = functionName || randomFrom(funcNames, 1)[0];
  const funcData = data.functions[selectedFunc];

  if (!funcData) {
    throw new Error(`Unknown function: ${selectedFunc}`);
  }

  // Pick setting
  const selectedSetting = setting || randomFrom(data.settings, 1)[0];

  if (!data.settings.includes(selectedSetting)) {
    throw new Error(`Unknown setting: ${selectedSetting}`);
  }

  // Get forms for this setting
  const forms = funcData.forms[selectedSetting];
  if (!forms || forms.length === 0) {
    throw new Error(`No forms for ${selectedFunc} in ${selectedSetting}`);
  }

  const selectedForm = randomFrom(forms, 1)[0];

  return {
    function: selectedFunc,
    description: funcData.description,
    story_access: funcData.story_access,
    setting: selectedSetting,
    form: selectedForm,
  };
}

function formatResult(result: GeneratedResult): string {
  const lines: string[] = [];
  lines.push(`## ${result.form}`);
  lines.push(`Function: ${result.function} (${result.setting})`);
  lines.push(`Role: ${result.description}`);
  lines.push(`Story access: ${result.story_access.join(", ")}`);
  return lines.join("\n");
}

function formatBrief(result: GeneratedResult): string {
  return `${result.form} [${result.function}/${result.setting}]`;
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Function-Form Generator

Works with abstract story functions and setting-specific forms.

Usage:
  deno run --allow-read functions.ts                    # Random function + form
  deno run --allow-read functions.ts --setting scifi    # Random function, scifi form
  deno run --allow-read functions.ts healer             # Specific function
  deno run --allow-read functions.ts healer --setting fantasy
  deno run --allow-read functions.ts --list             # List all functions
  deno run --allow-read functions.ts --list-settings    # List all settings
  deno run --allow-read functions.ts --count 3          # Multiple results
  deno run --allow-read functions.ts --brief            # Short output format

Options:
  --setting S    Use specific setting (contemporary, historical, fantasy, scifi, postapoc)
  --count N      Generate N results
  --brief        Short output (just form and tags)
  --json         Output as JSON
  --list         List all available functions
  --list-settings List all settings
`);
    Deno.exit(0);
  }

  // Load data
  const scriptDir = new URL(".", import.meta.url).pathname;
  const dataPath = `${scriptDir}../data/functions-forms.json`;

  let data: FunctionsFile;
  try {
    const text = await Deno.readTextFile(dataPath);
    data = JSON.parse(text);
  } catch (e) {
    console.error(`Error loading data: ${e}`);
    Deno.exit(1);
  }

  // List modes
  if (args.includes("--list")) {
    console.log("Available functions:\n");
    for (const [name, func] of Object.entries(data.functions)) {
      console.log(`  ${name.padEnd(20)} ${func.description}`);
    }
    Deno.exit(0);
  }

  if (args.includes("--list-settings")) {
    console.log("Available settings:\n");
    for (const setting of data.settings) {
      console.log(`  ${setting}`);
    }
    Deno.exit(0);
  }

  // Parse options
  const jsonOutput = args.includes("--json");
  const briefOutput = args.includes("--brief");

  const settingIndex = args.indexOf("--setting");
  const setting = settingIndex !== -1 ? args[settingIndex + 1] : null;

  const countIndex = args.indexOf("--count");
  const count = countIndex !== -1 ? parseInt(args[countIndex + 1]) || 1 : 1;

  // Find function name (first arg that's not a flag or flag value)
  const skipIndices = new Set<number>();
  if (settingIndex !== -1) {
    skipIndices.add(settingIndex);
    skipIndices.add(settingIndex + 1);
  }
  if (countIndex !== -1) {
    skipIndices.add(countIndex);
    skipIndices.add(countIndex + 1);
  }

  let functionName: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      functionName = args[i];
      break;
    }
  }

  // Generate results
  const results: GeneratedResult[] = [];
  try {
    for (let i = 0; i < count; i++) {
      results.push(generateResult(data, functionName, setting));
    }
  } catch (e) {
    console.error(`Error: ${e}`);
    Deno.exit(1);
  }

  // Output
  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  } else if (briefOutput) {
    for (const result of results) {
      console.log(formatBrief(result));
    }
  } else {
    for (const result of results) {
      console.log(formatResult(result));
      if (results.length > 1) {
        console.log("");
      }
    }
  }
}

main();
