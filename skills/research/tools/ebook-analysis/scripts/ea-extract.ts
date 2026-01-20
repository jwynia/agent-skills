#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * ea-extract.ts - Concept Extraction (LLM-Assisted)
 *
 * Presents parsed chunks to the LLM for concept extraction.
 * This script handles I/O and structure; the LLM provides judgment.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/ea-extract.ts <parsed.json>
 *   deno run --allow-read --allow-write scripts/ea-extract.ts parsed.json --output concepts.json
 *   deno run --allow-read --allow-write scripts/ea-extract.ts parsed.json --chunk-id chunk-5
 */

// === INTERFACES ===

interface TextChunk {
  id: string;
  text: string;
  start_position: number;
  end_position: number;
  chapter_number?: number;
  chapter_title?: string;
}

interface ParsedBook {
  metadata: {
    title: string;
    author: string;
    file_path: string;
  };
  chapters: Array<{
    number: number;
    title: string;
    start_position: number;
    end_position: number;
  }>;
  chunks: TextChunk[];
}

interface ExtractedConcept {
  id: string;
  name: string;
  exact_quote: string;
  context_before?: string;
  context_after?: string;
  start_position: number;
  end_position: number;
  chunk_id: string;
  chapter_number?: number;
  chapter_title?: string;
  extraction_notes?: string;
  requires_review: boolean;
  extraction_date: string;
}

interface ExtractionResult {
  source: {
    title: string;
    author: string;
    file_path: string;
  };
  extraction_date: string;
  concepts: ExtractedConcept[];
  chunks_processed: number;
  total_chunks: number;
}

// === EXTRACTION PROMPT GENERATION ===

function generateExtractionPrompt(chunk: TextChunk, bookTitle: string, bookAuthor: string): string {
  return `## Concept Extraction Task

**Source:** "${bookTitle}" by ${bookAuthor}
**Chunk ID:** ${chunk.id}
**Chapter:** ${chunk.chapter_title || chunk.chapter_number || "Unknown"}
**Position:** Characters ${chunk.start_position} to ${chunk.end_position}

### Text to Analyze:

${chunk.text}

### Instructions:

Extract significant concepts from this text. For each concept:

1. **Name:** A concise name for the concept (3-7 words)
2. **Exact Quote:** The precise text that captures this concept (copy exactly)
3. **Significance:** Why is this worth extracting?

**What to Extract:**
- Definitions ("X is defined as...")
- Principles ("The fundamental truth is...")
- Mechanisms ("X works by...")
- Frameworks ("The model consists of...")
- Strategies ("The approach is to...")
- Tactics ("Do X to achieve Y...")

**What NOT to Extract:**
- Trivial statements or common knowledge
- Mere examples without the concept they illustrate
- Transitions or filler text
- Concepts that can't be traced to a specific quote

**Citation Rule:** Every concept MUST include the exact quote from the text.

### Output Format:

For each concept, provide:

\`\`\`
CONCEPT: [Name]
QUOTE: "[Exact text from the chunk]"
SIGNIFICANCE: [Why this matters]
REVIEW: [yes/no - flag if uncertain about extraction]
\`\`\`

If no significant concepts exist in this chunk, respond with:
\`\`\`
NO_CONCEPTS: [Reason - e.g., "narrative transition" or "example without concept"]
\`\`\`
`;
}

// === CHUNK PRESENTATION ===

function presentChunkForExtraction(chunk: TextChunk, metadata: ParsedBook["metadata"]): void {
  console.log("=".repeat(80));
  console.log(generateExtractionPrompt(chunk, metadata.title, metadata.author));
  console.log("=".repeat(80));
}

// === CONCEPT PARSING (from LLM response) ===

function parseExtractedConcepts(
  llmResponse: string,
  chunk: TextChunk,
  existingConceptCount: number
): ExtractedConcept[] {
  const concepts: ExtractedConcept[] = [];

  // Check for no concepts response
  if (llmResponse.includes("NO_CONCEPTS:")) {
    return [];
  }

  // Parse concept blocks
  const conceptPattern = /CONCEPT:\s*(.+?)\nQUOTE:\s*"(.+?)"\nSIGNIFICANCE:\s*(.+?)\nREVIEW:\s*(yes|no)/gis;

  let match;
  let conceptIndex = existingConceptCount;

  while ((match = conceptPattern.exec(llmResponse)) !== null) {
    const name = match[1].trim();
    const quote = match[2].trim();
    const significance = match[3].trim();
    const requiresReview = match[4].toLowerCase() === "yes";

    // Find position of quote in chunk
    const quoteStart = chunk.text.indexOf(quote);
    let absoluteStart = chunk.start_position;
    let absoluteEnd = chunk.end_position;

    if (quoteStart !== -1) {
      absoluteStart = chunk.start_position + quoteStart;
      absoluteEnd = absoluteStart + quote.length;
    }

    // Extract context
    let contextBefore: string | undefined;
    let contextAfter: string | undefined;

    if (quoteStart > 50) {
      contextBefore = chunk.text.slice(Math.max(0, quoteStart - 100), quoteStart).trim();
    }

    const quoteEnd = quoteStart + quote.length;
    if (quoteEnd < chunk.text.length - 50) {
      contextAfter = chunk.text.slice(quoteEnd, Math.min(chunk.text.length, quoteEnd + 100)).trim();
    }

    concepts.push({
      id: `concept-${conceptIndex}`,
      name,
      exact_quote: quote,
      context_before: contextBefore,
      context_after: contextAfter,
      start_position: absoluteStart,
      end_position: absoluteEnd,
      chunk_id: chunk.id,
      chapter_number: chunk.chapter_number,
      chapter_title: chunk.chapter_title,
      extraction_notes: significance,
      requires_review: requiresReview,
      extraction_date: new Date().toISOString(),
    });

    conceptIndex++;
  }

  return concepts;
}

// === MAIN ===

async function main(): Promise<void> {
  const args = Deno.args;

  // Help
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`ea-extract.ts - Concept Extraction (LLM-Assisted)

Usage:
  deno run --allow-read --allow-write scripts/ea-extract.ts <parsed.json> [options]

Arguments:
  parsed.json          Output from ea-parse.ts

Options:
  --chunk-id <id>      Process only specific chunk (for iterative extraction)
  --start <n>          Start from chunk number n
  --limit <n>          Process only n chunks
  --output <file>      Write results to file
  --interactive        Present each chunk and wait for LLM response input

Modes:
  Default:             Outputs prompts for all chunks (pipe to LLM)
  --interactive:       Process chunks one at a time with manual LLM input

Examples:
  # Generate prompts for all chunks
  deno run --allow-read scripts/ea-extract.ts parsed.json > prompts.txt

  # Process specific chunk
  deno run --allow-read scripts/ea-extract.ts parsed.json --chunk-id chunk-5

  # Interactive mode (manual LLM entry)
  deno run --allow-read --allow-write scripts/ea-extract.ts parsed.json --interactive --output concepts.json
`);
    Deno.exit(0);
  }

  // Parse arguments
  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;

  const chunkIdIdx = args.indexOf("--chunk-id");
  const specificChunkId = chunkIdIdx !== -1 ? args[chunkIdIdx + 1] : null;

  const startIdx = args.indexOf("--start");
  const startFrom = startIdx !== -1 ? parseInt(args[startIdx + 1]) : 0;

  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1]) : Infinity;

  const interactive = args.includes("--interactive");

  // Find input file
  const skipIndices = new Set<number>();
  [outputIdx, chunkIdIdx, startIdx, limitIdx].forEach((idx) => {
    if (idx !== -1) {
      skipIndices.add(idx);
      skipIndices.add(idx + 1);
    }
  });

  let inputFile: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      inputFile = args[i];
      break;
    }
  }

  if (!inputFile) {
    console.error("Error: No input file specified");
    Deno.exit(1);
  }

  // Load parsed book
  let parsed: ParsedBook;
  try {
    const content = await Deno.readTextFile(inputFile);
    parsed = JSON.parse(content);
  } catch (e) {
    console.error(`Error reading input file: ${e}`);
    Deno.exit(1);
  }

  // Filter chunks
  let chunksToProcess = parsed.chunks;

  if (specificChunkId) {
    chunksToProcess = chunksToProcess.filter((c) => c.id === specificChunkId);
    if (chunksToProcess.length === 0) {
      console.error(`Chunk not found: ${specificChunkId}`);
      Deno.exit(1);
    }
  } else {
    chunksToProcess = chunksToProcess.slice(startFrom, startFrom + limit);
  }

  // Process
  if (interactive) {
    // Interactive mode - process chunks one at a time
    const result: ExtractionResult = {
      source: {
        title: parsed.metadata.title,
        author: parsed.metadata.author,
        file_path: parsed.metadata.file_path,
      },
      extraction_date: new Date().toISOString(),
      concepts: [],
      chunks_processed: 0,
      total_chunks: chunksToProcess.length,
    };

    console.log("Interactive extraction mode. For each chunk:");
    console.log("1. Copy the prompt to your LLM");
    console.log("2. Paste the LLM response below");
    console.log("3. Type 'END' on a new line when done");
    console.log("4. Type 'SKIP' to skip a chunk");
    console.log("");

    for (const chunk of chunksToProcess) {
      presentChunkForExtraction(chunk, parsed.metadata);

      console.log("\nPaste LLM response (type END on new line when done, or SKIP):");

      // Read multi-line input
      const lines: string[] = [];
      const decoder = new TextDecoder();
      const buf = new Uint8Array(1024);

      while (true) {
        const n = await Deno.stdin.read(buf);
        if (n === null) break;

        const text = decoder.decode(buf.subarray(0, n));
        lines.push(text);

        if (text.trim().endsWith("END") || text.trim() === "SKIP") {
          break;
        }
      }

      const response = lines.join("");

      if (response.trim() === "SKIP") {
        console.log(`Skipped chunk ${chunk.id}`);
        continue;
      }

      const concepts = parseExtractedConcepts(response, chunk, result.concepts.length);
      result.concepts.push(...concepts);
      result.chunks_processed++;

      console.log(`Extracted ${concepts.length} concepts from ${chunk.id}`);
    }

    // Output
    const output = JSON.stringify(result, null, 2);

    if (outputFile) {
      await Deno.writeTextFile(outputFile, output);
      console.log(`\nExtraction results written to: ${outputFile}`);
      console.log(`  - ${result.concepts.length} concepts extracted`);
      console.log(`  - ${result.chunks_processed} chunks processed`);
    } else {
      console.log("\n" + output);
    }
  } else {
    // Batch mode - output prompts for all chunks
    console.log(`# Extraction Prompts for: ${parsed.metadata.title}`);
    console.log(`# Author: ${parsed.metadata.author}`);
    console.log(`# Chunks: ${chunksToProcess.length}`);
    console.log("");

    for (const chunk of chunksToProcess) {
      presentChunkForExtraction(chunk, parsed.metadata);
      console.log("");
    }
  }
}

main();
