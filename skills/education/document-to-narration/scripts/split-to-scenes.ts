#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * split-to-scenes.ts
 *
 * Parse a markdown document and analyze its structure for scene splitting.
 * This script handles the mechanical aspects - the agent determines boundaries.
 *
 * Usage:
 *   # Analyze document structure
 *   deno run --allow-read scripts/split-to-scenes.ts input.md --analyze
 *
 *   # Split using boundaries file (agent-generated)
 *   deno run --allow-read --allow-write scripts/split-to-scenes.ts input.md --boundaries boundaries.json --output ./output/
 *
 *   # Split by headings (simple heuristic fallback)
 *   deno run --allow-read --allow-write scripts/split-to-scenes.ts input.md --by-headings --output ./output/
 *
 *   # Dry run
 *   deno run --allow-read scripts/split-to-scenes.ts input.md --boundaries boundaries.json --dry-run
 */

// ============================================================================
// Types
// ============================================================================

interface DocumentSection {
  type: 'heading' | 'paragraph' | 'list' | 'blockquote' | 'code';
  level?: number; // For headings
  text: string;
  lineStart: number;
  lineEnd: number;
  wordCount: number;
}

interface DocumentAnalysis {
  filename: string;
  totalLines: number;
  totalWords: number;
  sections: DocumentSection[];
  headings: { level: number; text: string; lineNumber: number }[];
  suggestedBreakpoints: number[]; // Line numbers where breaks might occur
}

interface SceneBoundary {
  sceneNumber: number;
  slug: string;
  startLine: number;
  endLine: number;
  content?: string; // Optional: agent can provide pre-processed content
}

interface BoundariesSpec {
  source: string;
  scenes: SceneBoundary[];
}

interface ManifestScene {
  number: number;
  slug: string;
  word_count: number;
  files: {
    text: string;
  };
  source_lines: {
    start: number;
    end: number;
  };
}

interface Manifest {
  source: string;
  created_at: string;
  total_scenes: number;
  scenes: ManifestScene[];
}

// ============================================================================
// Parsing
// ============================================================================

function parseMarkdown(content: string): DocumentSection[] {
  const lines = content.split('\n');
  const sections: DocumentSection[] = [];
  let currentParagraph: string[] = [];
  let paragraphStart = 0;

  const flushParagraph = (endLine: number) => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join('\n').trim();
      if (text) {
        sections.push({
          type: 'paragraph',
          text,
          lineStart: paragraphStart,
          lineEnd: endLine - 1,
          wordCount: countWords(text),
        });
      }
      currentParagraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph(lineNum);
      sections.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
        lineStart: lineNum,
        lineEnd: lineNum,
        wordCount: countWords(headingMatch[2]),
      });
      paragraphStart = lineNum + 1;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      flushParagraph(lineNum);
      const text = line.replace(/^>\s*/, '');
      sections.push({
        type: 'blockquote',
        text,
        lineStart: lineNum,
        lineEnd: lineNum,
        wordCount: countWords(text),
      });
      paragraphStart = lineNum + 1;
      continue;
    }

    // Code block start
    if (line.startsWith('```')) {
      flushParagraph(lineNum);
      const codeStart = lineNum;
      let codeEnd = lineNum;
      const codeLines: string[] = [line];

      // Find end of code block
      for (let j = i + 1; j < lines.length; j++) {
        codeLines.push(lines[j]);
        if (lines[j].startsWith('```')) {
          codeEnd = j + 1;
          i = j;
          break;
        }
      }

      sections.push({
        type: 'code',
        text: codeLines.join('\n'),
        lineStart: codeStart,
        lineEnd: codeEnd,
        wordCount: 0, // Code blocks don't count toward word count
      });
      paragraphStart = codeEnd + 1;
      continue;
    }

    // List item
    if (line.match(/^[\-\*\+]\s/) || line.match(/^\d+\.\s/)) {
      flushParagraph(lineNum);
      const text = line.replace(/^[\-\*\+]\s/, '').replace(/^\d+\.\s/, '');
      sections.push({
        type: 'list',
        text,
        lineStart: lineNum,
        lineEnd: lineNum,
        wordCount: countWords(text),
      });
      paragraphStart = lineNum + 1;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      flushParagraph(lineNum);
      paragraphStart = lineNum + 1;
      continue;
    }

    // Regular paragraph content
    if (currentParagraph.length === 0) {
      paragraphStart = lineNum;
    }
    currentParagraph.push(line);
  }

  flushParagraph(lines.length + 1);
  return sections;
}

function countWords(text: string): number {
  return text
    .replace(/[#*_`\[\]()]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function analyzeDocument(filename: string, content: string): DocumentAnalysis {
  const sections = parseMarkdown(content);
  const lines = content.split('\n');

  const headings = sections
    .filter((s) => s.type === 'heading')
    .map((s) => ({
      level: s.level!,
      text: s.text,
      lineNumber: s.lineStart,
    }));

  // Suggest breakpoints: after each H2 heading's content
  const suggestedBreakpoints: number[] = [];
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (section.type === 'heading' && section.level === 2) {
      // Find the next H2 or end of document
      let breakLine = lines.length;
      for (let j = i + 1; j < sections.length; j++) {
        if (sections[j].type === 'heading' && sections[j].level! <= 2) {
          breakLine = sections[j].lineStart - 1;
          break;
        }
      }
      suggestedBreakpoints.push(breakLine);
    }
  }

  return {
    filename,
    totalLines: lines.length,
    totalWords: sections.reduce((sum, s) => sum + s.wordCount, 0),
    sections,
    headings,
    suggestedBreakpoints,
  };
}

// ============================================================================
// Scene Extraction
// ============================================================================

function extractSceneContent(
  content: string,
  startLine: number,
  endLine: number
): string {
  const lines = content.split('\n');
  return lines.slice(startLine - 1, endLine).join('\n').trim();
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 30)
    .replace(/-+$/, '');
}

function splitByHeadings(
  content: string,
  analysis: DocumentAnalysis
): SceneBoundary[] {
  const scenes: SceneBoundary[] = [];
  const h2Headings = analysis.headings.filter((h) => h.level === 2);

  if (h2Headings.length === 0) {
    // No H2 headings, treat entire document as one scene
    return [
      {
        sceneNumber: 1,
        slug: generateSlug(analysis.headings[0]?.text || 'document'),
        startLine: 1,
        endLine: analysis.totalLines,
      },
    ];
  }

  // Content before first H2 (if any)
  if (h2Headings[0].lineNumber > 1) {
    const firstSection = analysis.sections[0];
    const slugText =
      firstSection?.type === 'heading' ? firstSection.text : 'opening';
    scenes.push({
      sceneNumber: 1,
      slug: generateSlug(slugText),
      startLine: 1,
      endLine: h2Headings[0].lineNumber - 1,
    });
  }

  // Each H2 section
  for (let i = 0; i < h2Headings.length; i++) {
    const heading = h2Headings[i];
    const nextHeading = h2Headings[i + 1];
    const endLine = nextHeading
      ? nextHeading.lineNumber - 1
      : analysis.totalLines;

    scenes.push({
      sceneNumber: scenes.length + 1,
      slug: generateSlug(heading.text),
      startLine: heading.lineNumber,
      endLine,
    });
  }

  return scenes;
}

// ============================================================================
// Output
// ============================================================================

async function writeScenes(
  content: string,
  boundaries: SceneBoundary[],
  outputDir: string,
  dryRun: boolean
): Promise<Manifest> {
  const scenesDir = `${outputDir}/scenes`;

  if (!dryRun) {
    await Deno.mkdir(scenesDir, { recursive: true });
  }

  const manifestScenes: ManifestScene[] = [];

  for (const boundary of boundaries) {
    const paddedNum = String(boundary.sceneNumber).padStart(2, '0');
    const filename = `${paddedNum}-${boundary.slug}.txt`;
    const filepath = `${scenesDir}/${filename}`;

    const sceneContent =
      boundary.content ||
      extractSceneContent(content, boundary.startLine, boundary.endLine);

    const wordCount = countWords(sceneContent);

    if (dryRun) {
      console.log(`\n[Scene ${boundary.sceneNumber}] ${filename}`);
      console.log(`  Lines: ${boundary.startLine}-${boundary.endLine}`);
      console.log(`  Words: ${wordCount}`);
      console.log(`  Preview: ${sceneContent.slice(0, 100)}...`);
    } else {
      await Deno.writeTextFile(filepath, sceneContent);
      console.log(`Wrote: ${filepath} (${wordCount} words)`);
    }

    manifestScenes.push({
      number: boundary.sceneNumber,
      slug: boundary.slug,
      word_count: wordCount,
      files: {
        text: `scenes/${filename}`,
      },
      source_lines: {
        start: boundary.startLine,
        end: boundary.endLine,
      },
    });
  }

  const manifest: Manifest = {
    source: '',
    created_at: new Date().toISOString(),
    total_scenes: boundaries.length,
    scenes: manifestScenes,
  };

  if (!dryRun) {
    const manifestPath = `${outputDir}/manifest.json`;
    await Deno.writeTextFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`\nWrote: ${manifestPath}`);
  }

  return manifest;
}

// ============================================================================
// Main
// ============================================================================

function printHelp() {
  console.log(`
split-to-scenes.ts - Parse documents for scene splitting

USAGE:
  deno run --allow-read scripts/split-to-scenes.ts <input.md> [options]

OPTIONS:
  --analyze              Analyze document structure and output JSON
  --by-headings          Split document by H2 headings (simple heuristic)
  --boundaries <file>    Use agent-generated boundaries JSON file
  --output <dir>         Output directory for scene files
  --dry-run              Preview splits without writing files
  --help, -h             Show this help

MODES:
  1. Analyze mode: Inspect document structure
     deno run --allow-read scripts/split-to-scenes.ts doc.md --analyze

  2. Headings mode: Split by H2 headings
     deno run --allow-read --allow-write scripts/split-to-scenes.ts doc.md --by-headings --output ./out

  3. Boundaries mode: Use agent-specified boundaries
     deno run --allow-read --allow-write scripts/split-to-scenes.ts doc.md --boundaries b.json --output ./out

BOUNDARIES FILE FORMAT:
  {
    "source": "document.md",
    "scenes": [
      { "sceneNumber": 1, "slug": "opening", "startLine": 1, "endLine": 15 },
      { "sceneNumber": 2, "slug": "main-point", "startLine": 16, "endLine": 45 }
    ]
  }

  Or with pre-processed content:
  {
    "scenes": [
      { "sceneNumber": 1, "slug": "opening", "startLine": 1, "endLine": 15,
        "content": "Adapted spoken text here..." }
    ]
  }
`);
}

async function main() {
  const args = Deno.args;

  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    Deno.exit(0);
  }

  // Parse arguments
  const inputFile = args.find((a) => !a.startsWith('--'));
  const analyze = args.includes('--analyze');
  const byHeadings = args.includes('--by-headings');
  const dryRun = args.includes('--dry-run');

  const boundariesIdx = args.indexOf('--boundaries');
  const boundariesFile = boundariesIdx >= 0 ? args[boundariesIdx + 1] : null;

  const outputIdx = args.indexOf('--output');
  const outputDir = outputIdx >= 0 ? args[outputIdx + 1] : null;

  if (!inputFile) {
    console.error('Error: No input file specified');
    Deno.exit(1);
  }

  // Read input document
  let content: string;
  try {
    content = await Deno.readTextFile(inputFile);
  } catch {
    console.error(`Error: Could not read file: ${inputFile}`);
    Deno.exit(1);
  }

  const analysis = analyzeDocument(inputFile, content);

  // Mode: Analyze
  if (analyze) {
    console.log(JSON.stringify(analysis, null, 2));
    Deno.exit(0);
  }

  // Mode: Split by headings or boundaries
  if (!outputDir && !dryRun) {
    console.error('Error: --output directory required (or use --dry-run)');
    Deno.exit(1);
  }

  let boundaries: SceneBoundary[];

  if (boundariesFile) {
    // Use agent-specified boundaries
    try {
      const boundariesContent = await Deno.readTextFile(boundariesFile);
      const spec: BoundariesSpec = JSON.parse(boundariesContent);
      boundaries = spec.scenes;
    } catch (e) {
      console.error(`Error: Could not read boundaries file: ${e}`);
      Deno.exit(1);
    }
  } else if (byHeadings) {
    // Simple heuristic: split by H2 headings
    boundaries = splitByHeadings(content, analysis);
  } else {
    console.error('Error: Specify --by-headings or --boundaries <file>');
    Deno.exit(1);
  }

  // Write scenes
  const manifest = await writeScenes(
    content,
    boundaries,
    outputDir || './output',
    dryRun
  );

  if (!dryRun) {
    manifest.source = inputFile;
    const manifestPath = `${outputDir}/manifest.json`;
    await Deno.writeTextFile(manifestPath, JSON.stringify(manifest, null, 2));
  }

  console.log(`\nTotal scenes: ${boundaries.length}`);
}

main();
