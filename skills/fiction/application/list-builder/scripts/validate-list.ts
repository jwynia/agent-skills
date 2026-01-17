#!/usr/bin/env -S deno run --allow-read

/**
 * List Validator
 *
 * Analyzes entropy lists for quality metrics:
 * - Size (is it large enough for good entropy?)
 * - Duplicates (any repeated items?)
 * - Item length (too short = vague, too long = unwieldy)
 * - Variety indicators
 *
 * Usage:
 *   deno run --allow-read validate-list.ts list.json
 *   deno run --allow-read validate-list.ts data.json list_name
 *   deno run --allow-read validate-list.ts list.json --json
 */

type MaturityLevel = "starter" | "functional" | "production" | "comprehensive";

interface ValidationReport {
  listName: string;
  totalItems: number;
  uniqueItems: number;
  duplicates: string[];
  avgLength: number;
  minLength: number;
  maxLength: number;
  shortItems: string[]; // Items under 10 chars (likely too vague)
  longItems: string[]; // Items over 100 chars (likely too complex)
  specificityScore: number; // 0-100, based on length distribution
  maturityLevel: MaturityLevel;
  nextLevel: MaturityLevel | null;
  itemsNeededForNext: number;
  issues: string[];
  suggestions: string[];
}

function validateList(items: string[], listName: string): ValidationReport {
  // Find duplicates
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const item of items) {
    const normalized = item.toLowerCase().trim();
    if (seen.has(normalized)) {
      duplicates.push(item);
    }
    seen.add(normalized);
  }

  // Calculate lengths
  const lengths = items.map((i) => i.length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const minLength = Math.min(...lengths);
  const maxLength = Math.max(...lengths);

  // Find problematic items
  const shortItems = items.filter((i) => i.length < 10).slice(0, 5);
  const longItems = items.filter((i) => i.length > 100).slice(0, 5);

  // Specificity score (based on ideal length range 20-60)
  const idealItems = items.filter((i) => i.length >= 20 && i.length <= 60).length;
  const specificityScore = Math.round((idealItems / items.length) * 100);

  // Maturity level assessment
  const uniqueCount = seen.size;
  let maturityLevel: MaturityLevel;
  let nextLevel: MaturityLevel | null;
  let itemsNeededForNext: number;

  if (uniqueCount < 30) {
    maturityLevel = "starter";
    nextLevel = "functional";
    itemsNeededForNext = 30 - uniqueCount;
  } else if (uniqueCount < 75) {
    maturityLevel = "functional";
    nextLevel = "production";
    itemsNeededForNext = 75 - uniqueCount;
  } else if (uniqueCount < 150) {
    maturityLevel = "production";
    nextLevel = "comprehensive";
    itemsNeededForNext = 150 - uniqueCount;
  } else {
    maturityLevel = "comprehensive";
    nextLevel = null;
    itemsNeededForNext = 0;
  }

  // Generate issues and suggestions
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (duplicates.length > 0) {
    issues.push(`${duplicates.length} duplicate(s) found`);
    suggestions.push("Remove duplicate entries");
  }

  if (maturityLevel === "starter") {
    issues.push(`Starter level (${uniqueCount} items) - not production ready`);
    suggestions.push(`Add ${itemsNeededForNext} more unique items to reach Functional level`);
  } else if (maturityLevel === "functional") {
    suggestions.push(`Add ${itemsNeededForNext} more items to reach Production level`);
  }

  if (specificityScore < 30) {
    issues.push(`Low specificity score (${specificityScore}%) - items may be too vague or too complex`);
    suggestions.push("Target item length of 20-60 characters for optimal specificity");
  }

  if (shortItems.length > items.length * 0.2) {
    issues.push("Many items are very short (< 10 chars)");
    suggestions.push("Short items may be too vague—add specificity");
  }

  if (longItems.length > items.length * 0.1) {
    issues.push("Some items are very long (> 100 chars)");
    suggestions.push("Long items may be unwieldy—consider splitting or simplifying");
  }

  if (avgLength < 15) {
    issues.push("Average item length is short");
    suggestions.push("Items may lack specificity needed to spark ideas");
  }

  return {
    listName,
    totalItems: items.length,
    uniqueItems: seen.size,
    duplicates,
    avgLength: Math.round(avgLength * 10) / 10,
    minLength,
    maxLength,
    shortItems,
    longItems,
    specificityScore,
    maturityLevel,
    nextLevel,
    itemsNeededForNext,
    issues,
    suggestions,
  };
}

function formatReport(report: ValidationReport): string {
  const lines: string[] = [];

  lines.push(`# List Validation: ${report.listName}\n`);

  // Maturity level section
  const maturityEmoji = {
    comprehensive: "★",
    production: "✓",
    functional: "~",
    starter: "⚠",
  }[report.maturityLevel];

  const maturityDesc = {
    comprehensive: "Reference quality (150+)",
    production: "Production ready (75-150)",
    functional: "Usable but limited (30-75)",
    starter: "Quick example only (< 30)",
  }[report.maturityLevel];

  lines.push("## Maturity Level");
  lines.push(`${maturityEmoji} **${report.maturityLevel.toUpperCase()}** - ${maturityDesc}`);
  lines.push(`   ${report.uniqueItems} unique items`);
  if (report.nextLevel) {
    lines.push(`   → ${report.itemsNeededForNext} more items needed for ${report.nextLevel}`);
  }
  if (report.duplicates.length > 0) {
    lines.push(`   ⚠ ${report.duplicates.length} duplicates found`);
  }
  lines.push("");

  // Specificity section
  const specEmoji = report.specificityScore >= 50 ? "✓" : report.specificityScore >= 30 ? "~" : "⚠";
  lines.push("## Specificity");
  lines.push(`${specEmoji} Score: ${report.specificityScore}% (items in ideal 20-60 char range)`);
  lines.push(`   Average length: ${report.avgLength} chars (range: ${report.minLength}-${report.maxLength})`);

  if (report.shortItems.length > 0) {
    lines.push(`   Short items (< 10 chars): ${report.shortItems.slice(0, 3).join(", ")}${report.shortItems.length > 3 ? "..." : ""}`);
  }
  if (report.longItems.length > 0) {
    lines.push(`   Long items (> 100 chars): ${report.longItems.length} found`);
  }
  lines.push("");

  // Issues
  if (report.issues.length > 0) {
    lines.push("## Issues");
    for (const issue of report.issues) {
      lines.push(`- ⚠ ${issue}`);
    }
    lines.push("");
  }

  // Suggestions
  if (report.suggestions.length > 0) {
    lines.push("## Suggestions");
    for (const suggestion of report.suggestions) {
      lines.push(`- ${suggestion}`);
    }
    lines.push("");
  }

  // Summary
  if (report.issues.length === 0) {
    lines.push("## Assessment");
    lines.push("✓ List passes validation checks\n");
  }

  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`List Validator - Check entropy list quality

Usage:
  deno run --allow-read validate-list.ts <file.json>
  deno run --allow-read validate-list.ts <file.json> <list_name>
  deno run --allow-read validate-list.ts <file.json> --json

If file contains a single array, validates that array.
If file contains an object with multiple lists, specify list_name or validate all.

Options:
  --json    Output as JSON
  --all     Validate all lists in file (default if no list_name given)
  --help    Show this help
`);
    Deno.exit(0);
  }

  const jsonOutput = args.includes("--json");
  const file = args.find((a) => a.endsWith(".json"));
  const listName = args.find((a) => !a.startsWith("--") && !a.endsWith(".json"));

  if (!file) {
    console.error("Error: No JSON file specified");
    Deno.exit(1);
  }

  let data: unknown;
  try {
    const text = await Deno.readTextFile(file);
    data = JSON.parse(text);
  } catch (e) {
    console.error(`Error reading ${file}: ${e}`);
    Deno.exit(1);
  }

  const reports: ValidationReport[] = [];

  if (Array.isArray(data)) {
    // Single array
    reports.push(validateList(data as string[], file));
  } else if (typeof data === "object" && data !== null) {
    // Object with multiple lists
    const obj = data as Record<string, string[]>;

    if (listName) {
      if (!obj[listName]) {
        console.error(`Error: List "${listName}" not found in ${file}`);
        console.error(`Available: ${Object.keys(obj).join(", ")}`);
        Deno.exit(1);
      }
      reports.push(validateList(obj[listName], listName));
    } else {
      // Validate all
      for (const [name, items] of Object.entries(obj)) {
        if (Array.isArray(items)) {
          reports.push(validateList(items, name));
        }
      }
    }
  } else {
    console.error("Error: File must contain a JSON array or object");
    Deno.exit(1);
  }

  if (jsonOutput) {
    console.log(JSON.stringify(reports, null, 2));
  } else {
    for (const report of reports) {
      console.log(formatReport(report));
      if (reports.length > 1) {
        console.log("---\n");
      }
    }
  }
}

main();
