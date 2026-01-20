#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * ea-classify.ts - Concept Classification (LLM-Assisted)
 *
 * Presents extracted concepts to the LLM for type and layer classification.
 * This script handles I/O and structure; the LLM provides judgment.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/ea-classify.ts <concepts.json>
 *   deno run --allow-read --allow-write scripts/ea-classify.ts concepts.json --output classified.json
 */

// === INTERFACES ===

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

type ConceptType = "principle" | "mechanism" | "pattern" | "strategy" | "tactic";

interface ClassifiedConcept extends ExtractedConcept {
  type: ConceptType;
  layer: number; // 0-4
  type_confidence: number; // 0-1
  layer_confidence: number; // 0-1
  classification_notes?: string;
  classification_date: string;
}

interface ClassificationResult {
  source: {
    title: string;
    author: string;
    file_path: string;
  };
  classification_date: string;
  concepts: ClassifiedConcept[];
  type_distribution: Record<ConceptType, number>;
  layer_distribution: Record<number, number>;
}

// === CLASSIFICATION PROMPT GENERATION ===

function generateClassificationPrompt(concept: ExtractedConcept, bookTitle: string): string {
  return `## Concept Classification Task

**Source:** "${bookTitle}"
**Concept ID:** ${concept.id}
**Chapter:** ${concept.chapter_title || concept.chapter_number || "Unknown"}

### Concept to Classify:

**Name:** ${concept.name}

**Exact Quote:**
"${concept.exact_quote}"

**Context Before:** ${concept.context_before || "(none)"}
**Context After:** ${concept.context_after || "(none)"}

### Classification Instructions:

Classify this concept by TYPE and LAYER.

**TYPES (choose one):**
- **principle** - Foundational truth or axiom (e.g., "Communities form around shared identity")
- **mechanism** - How something works (e.g., "Reciprocity creates social bonds by triggering obligation")
- **pattern** - Recurring structure or framework (e.g., "The community lifecycle: formation, growth, maturation")
- **strategy** - High-level approach (e.g., "Build trust before asking for contribution")
- **tactic** - Specific actionable technique (e.g., "Send welcome emails within 24 hours")

**LAYERS (choose 0-4):**
- **0** - Foundational (universal truths about human nature)
- **1** - Theoretical (domain-specific theory)
- **2** - Strategic (frameworks and approaches)
- **3** - Tactical (specific methods, tool-agnostic)
- **4** - Specific (concrete implementations, named tools)

### Output Format:

\`\`\`
TYPE: [principle|mechanism|pattern|strategy|tactic]
TYPE_CONFIDENCE: [0.0-1.0]
LAYER: [0-4]
LAYER_CONFIDENCE: [0.0-1.0]
NOTES: [Brief explanation of classification reasoning]
\`\`\`
`;
}

// === BATCH CLASSIFICATION PROMPT ===

function generateBatchClassificationPrompt(concepts: ExtractedConcept[], bookTitle: string): string {
  let prompt = `## Batch Concept Classification

**Source:** "${bookTitle}"
**Concepts to classify:** ${concepts.length}

### Classification Guide:

**TYPES:**
- principle - Foundational truth ("X is essential for Y")
- mechanism - How it works ("X causes Y by Z")
- pattern - Recurring structure (named frameworks, stages)
- strategy - High-level approach ("Focus on X before Y")
- tactic - Specific action ("Do X to achieve Y")

**LAYERS (0-4):**
- 0: Universal human truths
- 1: Domain-specific theory
- 2: Frameworks and approaches
- 3: Tool-agnostic methods
- 4: Specific implementations

### Concepts:

`;

  for (const concept of concepts) {
    prompt += `---
**ID:** ${concept.id}
**Name:** ${concept.name}
**Quote:** "${concept.exact_quote.slice(0, 200)}${concept.exact_quote.length > 200 ? "..." : ""}"

`;
  }

  prompt += `### Output Format (one block per concept):

\`\`\`
ID: [concept-id]
TYPE: [principle|mechanism|pattern|strategy|tactic]
LAYER: [0-4]
NOTES: [Brief reasoning]
\`\`\`
`;

  return prompt;
}

// === CLASSIFICATION PARSING ===

function parseClassification(
  llmResponse: string,
  concept: ExtractedConcept
): ClassifiedConcept {
  // Parse single concept classification
  const typeMatch = llmResponse.match(/TYPE:\s*(principle|mechanism|pattern|strategy|tactic)/i);
  const typeConfMatch = llmResponse.match(/TYPE_CONFIDENCE:\s*([\d.]+)/i);
  const layerMatch = llmResponse.match(/LAYER:\s*(\d)/i);
  const layerConfMatch = llmResponse.match(/LAYER_CONFIDENCE:\s*([\d.]+)/i);
  const notesMatch = llmResponse.match(/NOTES:\s*(.+?)(?:\n|$)/is);

  const type = (typeMatch?.[1]?.toLowerCase() || "principle") as ConceptType;
  const typeConfidence = typeConfMatch ? parseFloat(typeConfMatch[1]) : 0.7;
  const layer = layerMatch ? parseInt(layerMatch[1]) : 2;
  const layerConfidence = layerConfMatch ? parseFloat(layerConfMatch[1]) : 0.7;
  const notes = notesMatch?.[1]?.trim();

  return {
    ...concept,
    type,
    layer,
    type_confidence: typeConfidence,
    layer_confidence: layerConfidence,
    classification_notes: notes,
    classification_date: new Date().toISOString(),
  };
}

function parseBatchClassifications(
  llmResponse: string,
  concepts: ExtractedConcept[]
): ClassifiedConcept[] {
  const classified: ClassifiedConcept[] = [];
  const conceptMap = new Map(concepts.map((c) => [c.id, c]));

  // Parse batch response - look for ID blocks
  const blockPattern = /ID:\s*(concept-\d+)\s*\nTYPE:\s*(principle|mechanism|pattern|strategy|tactic)\s*\nLAYER:\s*(\d)\s*\nNOTES:\s*(.+?)(?=\n\nID:|$)/gis;

  let match;
  while ((match = blockPattern.exec(llmResponse)) !== null) {
    const id = match[1];
    const type = match[2].toLowerCase() as ConceptType;
    const layer = parseInt(match[3]);
    const notes = match[4].trim();

    const concept = conceptMap.get(id);
    if (concept) {
      classified.push({
        ...concept,
        type,
        layer,
        type_confidence: 0.8, // Batch mode uses default confidence
        layer_confidence: 0.8,
        classification_notes: notes,
        classification_date: new Date().toISOString(),
      });
      conceptMap.delete(id);
    }
  }

  // Handle any unclassified concepts
  for (const [, concept] of conceptMap) {
    classified.push({
      ...concept,
      type: "principle",
      layer: 2,
      type_confidence: 0.3,
      layer_confidence: 0.3,
      classification_notes: "Not classified - using defaults",
      classification_date: new Date().toISOString(),
    });
  }

  return classified;
}

// === MAIN ===

async function main(): Promise<void> {
  const args = Deno.args;

  // Help
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`ea-classify.ts - Concept Classification (LLM-Assisted)

Usage:
  deno run --allow-read --allow-write scripts/ea-classify.ts <concepts.json> [options]

Arguments:
  concepts.json        Output from ea-extract.ts

Options:
  --output <file>      Write results to file
  --batch              Output single batch prompt (faster, less accurate)
  --concept-id <id>    Classify only specific concept
  --interactive        Process concepts with manual LLM input

Examples:
  # Generate classification prompts
  deno run --allow-read scripts/ea-classify.ts concepts.json > prompts.txt

  # Batch mode (single prompt for all)
  deno run --allow-read scripts/ea-classify.ts concepts.json --batch

  # Interactive mode
  deno run --allow-read --allow-write scripts/ea-classify.ts concepts.json --interactive --output classified.json
`);
    Deno.exit(0);
  }

  // Parse arguments
  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;

  const conceptIdIdx = args.indexOf("--concept-id");
  const specificConceptId = conceptIdIdx !== -1 ? args[conceptIdIdx + 1] : null;

  const batch = args.includes("--batch");
  const interactive = args.includes("--interactive");

  // Find input file
  const skipIndices = new Set<number>();
  [outputIdx, conceptIdIdx].forEach((idx) => {
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

  // Load extracted concepts
  let extracted: ExtractionResult;
  try {
    const content = await Deno.readTextFile(inputFile);
    extracted = JSON.parse(content);
  } catch (e) {
    console.error(`Error reading input file: ${e}`);
    Deno.exit(1);
  }

  // Filter concepts
  let conceptsToClassify = extracted.concepts;

  if (specificConceptId) {
    conceptsToClassify = conceptsToClassify.filter((c) => c.id === specificConceptId);
    if (conceptsToClassify.length === 0) {
      console.error(`Concept not found: ${specificConceptId}`);
      Deno.exit(1);
    }
  }

  // Process
  if (batch) {
    // Batch mode - single prompt for all concepts
    console.log(generateBatchClassificationPrompt(conceptsToClassify, extracted.source.title));
  } else if (interactive) {
    // Interactive mode
    const classifiedConcepts: ClassifiedConcept[] = [];

    console.log("Interactive classification mode.");
    console.log("For each concept, paste LLM response and type END when done.\n");

    for (const concept of conceptsToClassify) {
      console.log("=".repeat(80));
      console.log(generateClassificationPrompt(concept, extracted.source.title));
      console.log("=".repeat(80));
      console.log("\nPaste LLM response (type END on new line when done):");

      // Read response
      const lines: string[] = [];
      const decoder = new TextDecoder();
      const buf = new Uint8Array(1024);

      while (true) {
        const n = await Deno.stdin.read(buf);
        if (n === null) break;

        const text = decoder.decode(buf.subarray(0, n));
        lines.push(text);

        if (text.trim().endsWith("END")) {
          break;
        }
      }

      const response = lines.join("");
      const classified = parseClassification(response, concept);
      classifiedConcepts.push(classified);

      console.log(`Classified: ${concept.name} as ${classified.type} (Layer ${classified.layer})\n`);
    }

    // Build result
    const typeDistribution: Record<ConceptType, number> = {
      principle: 0,
      mechanism: 0,
      pattern: 0,
      strategy: 0,
      tactic: 0,
    };
    const layerDistribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

    for (const c of classifiedConcepts) {
      typeDistribution[c.type]++;
      layerDistribution[c.layer]++;
    }

    const result: ClassificationResult = {
      source: extracted.source,
      classification_date: new Date().toISOString(),
      concepts: classifiedConcepts,
      type_distribution: typeDistribution,
      layer_distribution: layerDistribution,
    };

    const output = JSON.stringify(result, null, 2);

    if (outputFile) {
      await Deno.writeTextFile(outputFile, output);
      console.log(`\nClassification results written to: ${outputFile}`);
    } else {
      console.log("\n" + output);
    }
  } else {
    // Default: output individual prompts
    console.log(`# Classification Prompts for: ${extracted.source.title}`);
    console.log(`# Concepts: ${conceptsToClassify.length}\n`);

    for (const concept of conceptsToClassify) {
      console.log("=".repeat(80));
      console.log(generateClassificationPrompt(concept, extracted.source.title));
      console.log("");
    }
  }
}

main();
