#!/usr/bin/env -S deno run --allow-read

/**
 * check-conflicts.ts - Scan world bible for potential conflicts
 *
 * Identifies:
 * - Entries marked as contradicted
 * - Broken wiki-links
 * - Duplicate entry names
 * - Entries without sources
 *
 * Usage:
 *   deno run --allow-read check-conflicts.ts ./world-bible
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";

interface Issue {
  type: 'contradiction' | 'broken-link' | 'duplicate' | 'missing-source' | 'orphan';
  file: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
}

interface ScanResult {
  files: number;
  entries: Map<string, string[]>; // name -> files containing it
  links: Set<string>;
  issues: Issue[];
}

async function scanFile(path: string, result: ScanResult): Promise<void> {
  const content = await Deno.readTextFile(path);
  const lines = content.split('\n');

  // Extract entry name from first heading
  const nameMatch = content.match(/^#\s+(.+)$/m);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    if (!result.entries.has(name)) {
      result.entries.set(name, []);
    }
    result.entries.get(name)!.push(path);
  }

  // Check for contradicted status
  if (content.includes('**Canon Status:** Contradicted') ||
      content.includes('Status:** ⚠')) {
    result.issues.push({
      type: 'contradiction',
      file: path,
      description: 'Entry is marked as contradicted - needs resolution',
      severity: 'error',
    });
  }

  // Extract wiki-links
  const linkPattern = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    result.links.add(match[1].trim());
  }

  // Check for missing sources
  if (content.includes('## Sources') &&
      (content.includes('[Source work/document]') ||
       content.match(/## Sources\s*\n\s*\n/))) {
    result.issues.push({
      type: 'missing-source',
      file: path,
      description: 'Entry has no sources documented',
      severity: 'warning',
    });
  }

  // Check for unfilled template markers
  if (content.includes('[1-2 sentence overview') ||
      content.includes('[Detailed information about') ||
      content.includes('[Key fact')) {
    result.issues.push({
      type: 'orphan',
      file: path,
      description: 'Entry has unfilled template sections',
      severity: 'info',
    });
  }

  result.files++;
}

async function scanWorldBible(biblePath: string): Promise<ScanResult> {
  const result: ScanResult = {
    files: 0,
    entries: new Map(),
    links: new Set(),
    issues: [],
  };

  for await (const entry of walk(biblePath, {
    exts: ['.md'],
    skip: [/node_modules/, /\.git/],
  })) {
    if (entry.isFile && !entry.name.startsWith('_')) {
      await scanFile(entry.path, result);
    }
  }

  // Check for duplicates
  for (const [name, files] of result.entries) {
    if (files.length > 1) {
      result.issues.push({
        type: 'duplicate',
        file: files.join(', '),
        description: `Duplicate entry name "${name}" in multiple files`,
        severity: 'error',
      });
    }
  }

  // Check for broken links
  for (const link of result.links) {
    // Skip section links
    if (link.includes('#')) continue;

    // Check if link target exists
    if (!result.entries.has(link)) {
      result.issues.push({
        type: 'broken-link',
        file: 'Multiple files',
        description: `Broken link: [[${link}]] - no entry with this name`,
        severity: 'warning',
      });
    }
  }

  return result;
}

function formatReport(result: ScanResult): string {
  let report = `
WORLD BIBLE CONFLICT CHECK
==========================

Files scanned: ${result.files}
Unique entries: ${result.entries.size}
Wiki-links found: ${result.links.size}

`;

  const errors = result.issues.filter(i => i.severity === 'error');
  const warnings = result.issues.filter(i => i.severity === 'warning');
  const infos = result.issues.filter(i => i.severity === 'info');

  if (errors.length > 0) {
    report += `ERRORS (${errors.length})\n${'='.repeat(40)}\n\n`;
    for (const issue of errors) {
      report += `[${issue.type.toUpperCase()}] ${issue.description}\n`;
      report += `  File: ${issue.file}\n\n`;
    }
  }

  if (warnings.length > 0) {
    report += `WARNINGS (${warnings.length})\n${'='.repeat(40)}\n\n`;
    for (const issue of warnings) {
      report += `[${issue.type.toUpperCase()}] ${issue.description}\n`;
      report += `  File: ${issue.file}\n\n`;
    }
  }

  if (infos.length > 0) {
    report += `INFO (${infos.length})\n${'='.repeat(40)}\n\n`;
    for (const issue of infos) {
      report += `[${issue.type.toUpperCase()}] ${issue.description}\n`;
      report += `  File: ${issue.file}\n\n`;
    }
  }

  if (result.issues.length === 0) {
    report += `No issues found.\n`;
  } else {
    report += `
SUMMARY
=======
Errors: ${errors.length}
Warnings: ${warnings.length}
Info: ${infos.length}
Total: ${result.issues.length}
`;
  }

  return report;
}

function showUsage() {
  console.log(`
World Bible Conflict Check
==========================

Scans for potential conflicts and issues.

Usage:
  deno run --allow-read check-conflicts.ts <world-bible-path>

Checks for:
  - Entries marked as contradicted
  - Broken wiki-links ([[Name]] with no matching entry)
  - Duplicate entry names
  - Missing source documentation
  - Unfilled template sections

Example:
  deno run --allow-read check-conflicts.ts ./world-bible
`);
}

async function main() {
  const args = Deno.args;

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    Deno.exit(0);
  }

  const biblePath = args[0];

  try {
    await Deno.stat(biblePath);
  } catch {
    console.error(`Error: Path not found: ${biblePath}`);
    Deno.exit(1);
  }

  const result = await scanWorldBible(biblePath);
  console.log(formatReport(result));

  // Exit with error code if errors found
  const errorCount = result.issues.filter(i => i.severity === 'error').length;
  if (errorCount > 0) {
    Deno.exit(1);
  }
}

main();
