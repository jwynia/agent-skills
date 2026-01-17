#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * ea-link.ts - Concept Relationship Building (LLM-Assisted)
 *
 * Presents concept pairs to the LLM for relationship determination.
 * This script handles I/O and structure; the LLM provides judgment.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/ea-link.ts <classified.json>
 *   deno run --allow-read --allow-write scripts/ea-link.ts classified.json --output linked.json
 */

// === INTERFACES ===

type ConceptType = "principle" | "mechanism" | "pattern" | "strategy" | "tactic";
type RelationshipType = "INFLUENCES" | "SUPPORTS" | "CONTRADICTS" | "COMPOSED_OF" | "DERIVES_FROM";

interface ClassifiedConcept {
  id: string;
  name: string;
  exact_quote: string;
  type: ConceptType;
  layer: number;
  chapter_title?: string;
}

interface ClassificationResult {
  source: {
    title: string;
    author: string;
    file_path: string;
  };
  concepts: ClassifiedConcept[];
}

interface ConceptRelationship {
  id: string;
  source_id: string;
  target_id: string;
  type: RelationshipType;
  strength: number; // -1 to 1 for INFLUENCES, 0-1 for others
  confidence: number; // 0-1
  evidence?: string;
  notes?: string;
  created_date: string;
}

interface LinkedResult {
  source: {
    title: string;
    author: string;
    file_path: string;
  };
  linking_date: string;
  concepts: ClassifiedConcept[];
  relationships: ConceptRelationship[];
  relationship_stats: {
    total: number;
    by_type: Record<RelationshipType, number>;
    orphan_concepts: string[];
  };
}

// === RELATIONSHIP PROMPT GENERATION ===

function generatePairAnalysisPrompt(
  conceptA: ClassifiedConcept,
  conceptB: ClassifiedConcept,
  bookTitle: string
): string {
  return `## Relationship Analysis Task

**Source:** "${bookTitle}"

### Concept A: ${conceptA.name}
- **ID:** ${conceptA.id}
- **Type:** ${conceptA.type}
- **Layer:** ${conceptA.layer}
- **Quote:** "${conceptA.exact_quote.slice(0, 300)}${conceptA.exact_quote.length > 300 ? "..." : ""}"

### Concept B: ${conceptB.name}
- **ID:** ${conceptB.id}
- **Type:** ${conceptB.type}
- **Layer:** ${conceptB.layer}
- **Quote:** "${conceptB.exact_quote.slice(0, 300)}${conceptB.exact_quote.length > 300 ? "..." : ""}"

### Instructions:

Determine if there is a meaningful relationship between these concepts.

**Relationship Types:**
- **INFLUENCES** - A affects B (strength: -1 to +1, negative = inhibits)
- **SUPPORTS** - A provides evidence for B (strength: 0-1)
- **CONTRADICTS** - A conflicts with B (strength: 0-1)
- **COMPOSED_OF** - A contains B as component (strength: 0-1)
- **DERIVES_FROM** - A is derived from B (strength: 0-1)

**Decision Criteria:**
- Is there a causal, evidential, or structural connection?
- Would understanding one help understand the other?
- Is the relationship explicitly stated or strongly implied?

### Output Format:

If relationship exists:
\`\`\`
RELATIONSHIP: yes
TYPE: [INFLUENCES|SUPPORTS|CONTRADICTS|COMPOSED_OF|DERIVES_FROM]
DIRECTION: [A_TO_B|B_TO_A|BIDIRECTIONAL]
STRENGTH: [number]
CONFIDENCE: [0.0-1.0]
EVIDENCE: [Brief explanation]
\`\`\`

If no meaningful relationship:
\`\`\`
RELATIONSHIP: no
REASON: [Brief explanation]
\`\`\`
`;
}

// === BATCH LINKING PROMPT ===

function generateBatchLinkingPrompt(
  concepts: ClassifiedConcept[],
  bookTitle: string
): string {
  let prompt = `## Batch Relationship Analysis

**Source:** "${bookTitle}"
**Concepts:** ${concepts.length}

### Concept Summary:

`;

  for (const concept of concepts) {
    prompt += `- **${concept.id}**: ${concept.name} (${concept.type}, L${concept.layer})\n`;
  }

  prompt += `
### Instructions:

Identify meaningful relationships between these concepts. For each relationship found, specify:
- Source concept ID
- Target concept ID
- Relationship type (INFLUENCES, SUPPORTS, CONTRADICTS, COMPOSED_OF, DERIVES_FROM)
- Direction and strength
- Brief evidence

**Relationship Types:**
- INFLUENCES: A affects B (strength -1 to +1)
- SUPPORTS: A provides evidence for B
- CONTRADICTS: A conflicts with B
- COMPOSED_OF: A contains B as component
- DERIVES_FROM: A is derived from B

### Output Format (one block per relationship):

\`\`\`
FROM: [concept-id]
TO: [concept-id]
TYPE: [relationship type]
STRENGTH: [number]
EVIDENCE: [brief explanation]
\`\`\`

List all meaningful relationships. Skip pairs with no significant connection.
`;

  return prompt;
}

// === RELATIONSHIP PARSING ===

function parsePairRelationship(
  llmResponse: string,
  conceptA: ClassifiedConcept,
  conceptB: ClassifiedConcept,
  existingCount: number
): ConceptRelationship | null {
  const hasRelationship = /RELATIONSHIP:\s*yes/i.test(llmResponse);

  if (!hasRelationship) {
    return null;
  }

  const typeMatch = llmResponse.match(/TYPE:\s*(INFLUENCES|SUPPORTS|CONTRADICTS|COMPOSED_OF|DERIVES_FROM)/i);
  const directionMatch = llmResponse.match(/DIRECTION:\s*(A_TO_B|B_TO_A|BIDIRECTIONAL)/i);
  const strengthMatch = llmResponse.match(/STRENGTH:\s*([-\d.]+)/i);
  const confidenceMatch = llmResponse.match(/CONFIDENCE:\s*([\d.]+)/i);
  const evidenceMatch = llmResponse.match(/EVIDENCE:\s*(.+?)(?:\n|$)/is);

  const type = (typeMatch?.[1]?.toUpperCase() || "INFLUENCES") as RelationshipType;
  const direction = directionMatch?.[1]?.toUpperCase() || "A_TO_B";
  const strength = strengthMatch ? parseFloat(strengthMatch[1]) : 0.5;
  const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.7;
  const evidence = evidenceMatch?.[1]?.trim();

  // Determine source and target based on direction
  let sourceId = conceptA.id;
  let targetId = conceptB.id;

  if (direction === "B_TO_A") {
    sourceId = conceptB.id;
    targetId = conceptA.id;
  }

  return {
    id: `rel-${existingCount}`,
    source_id: sourceId,
    target_id: targetId,
    type,
    strength,
    confidence,
    evidence,
    created_date: new Date().toISOString(),
  };
}

function parseBatchRelationships(
  llmResponse: string,
  existingCount: number
): ConceptRelationship[] {
  const relationships: ConceptRelationship[] = [];

  const blockPattern = /FROM:\s*(concept-\d+)\s*\nTO:\s*(concept-\d+)\s*\nTYPE:\s*(INFLUENCES|SUPPORTS|CONTRADICTS|COMPOSED_OF|DERIVES_FROM)\s*\nSTRENGTH:\s*([-\d.]+)\s*\nEVIDENCE:\s*(.+?)(?=\n\nFROM:|$)/gis;

  let match;
  let relIndex = existingCount;

  while ((match = blockPattern.exec(llmResponse)) !== null) {
    relationships.push({
      id: `rel-${relIndex}`,
      source_id: match[1],
      target_id: match[2],
      type: match[3].toUpperCase() as RelationshipType,
      strength: parseFloat(match[4]),
      confidence: 0.8,
      evidence: match[5].trim(),
      created_date: new Date().toISOString(),
    });
    relIndex++;
  }

  return relationships;
}

// === PAIR GENERATION ===

function generateConceptPairs(concepts: ClassifiedConcept[]): Array<[ClassifiedConcept, ClassifiedConcept]> {
  const pairs: Array<[ClassifiedConcept, ClassifiedConcept]> = [];

  // Prioritize pairs that are likely to have relationships:
  // 1. Same chapter
  // 2. Adjacent layers
  // 3. Related types (principle-mechanism, strategy-tactic)

  for (let i = 0; i < concepts.length; i++) {
    for (let j = i + 1; j < concepts.length; j++) {
      const a = concepts[i];
      const b = concepts[j];

      // Score this pair for likelihood of relationship
      let score = 0;

      // Same chapter
      if (a.chapter_title && a.chapter_title === b.chapter_title) {
        score += 3;
      }

      // Adjacent layers
      if (Math.abs(a.layer - b.layer) <= 1) {
        score += 2;
      }

      // Related types
      const relatedTypes: Record<ConceptType, ConceptType[]> = {
        principle: ["mechanism", "strategy"],
        mechanism: ["principle", "pattern"],
        pattern: ["mechanism", "strategy"],
        strategy: ["principle", "pattern", "tactic"],
        tactic: ["strategy"],
      };

      if (relatedTypes[a.type]?.includes(b.type) || relatedTypes[b.type]?.includes(a.type)) {
        score += 2;
      }

      // Add pairs with non-zero score
      if (score > 0) {
        pairs.push([a, b]);
      }
    }
  }

  // Sort by score (highest first) and limit
  return pairs.slice(0, Math.min(pairs.length, concepts.length * 3));
}

// === MAIN ===

async function main(): Promise<void> {
  const args = Deno.args;

  // Help
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`ea-link.ts - Concept Relationship Building (LLM-Assisted)

Usage:
  deno run --allow-read --allow-write scripts/ea-link.ts <classified.json> [options]

Arguments:
  classified.json      Output from ea-classify.ts

Options:
  --output <file>      Write results to file
  --batch              Output single batch prompt
  --max-pairs <n>      Maximum pairs to analyze (default: concepts * 3)
  --interactive        Process pairs with manual LLM input

Examples:
  # Generate pair analysis prompts
  deno run --allow-read scripts/ea-link.ts classified.json > prompts.txt

  # Batch mode
  deno run --allow-read scripts/ea-link.ts classified.json --batch

  # Interactive mode
  deno run --allow-read --allow-write scripts/ea-link.ts classified.json --interactive --output linked.json
`);
    Deno.exit(0);
  }

  // Parse arguments
  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;

  const maxPairsIdx = args.indexOf("--max-pairs");
  const maxPairs = maxPairsIdx !== -1 ? parseInt(args[maxPairsIdx + 1]) : Infinity;

  const batch = args.includes("--batch");
  const interactive = args.includes("--interactive");

  // Find input file
  const skipIndices = new Set<number>();
  [outputIdx, maxPairsIdx].forEach((idx) => {
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

  // Load classified concepts
  let classified: ClassificationResult;
  try {
    const content = await Deno.readTextFile(inputFile);
    classified = JSON.parse(content);
  } catch (e) {
    console.error(`Error reading input file: ${e}`);
    Deno.exit(1);
  }

  // Generate pairs
  let pairs = generateConceptPairs(classified.concepts);
  if (maxPairs < pairs.length) {
    pairs = pairs.slice(0, maxPairs);
  }

  // Process
  if (batch) {
    console.log(generateBatchLinkingPrompt(classified.concepts, classified.source.title));
  } else if (interactive) {
    const relationships: ConceptRelationship[] = [];

    console.log("Interactive relationship analysis mode.");
    console.log(`Analyzing ${pairs.length} concept pairs.\n`);

    for (const [conceptA, conceptB] of pairs) {
      console.log("=".repeat(80));
      console.log(generatePairAnalysisPrompt(conceptA, conceptB, classified.source.title));
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
      const relationship = parsePairRelationship(response, conceptA, conceptB, relationships.length);

      if (relationship) {
        relationships.push(relationship);
        console.log(`Added: ${conceptA.name} --[${relationship.type}]--> ${conceptB.name}\n`);
      } else {
        console.log("No relationship found.\n");
      }
    }

    // Find orphan concepts
    const linkedIds = new Set<string>();
    for (const rel of relationships) {
      linkedIds.add(rel.source_id);
      linkedIds.add(rel.target_id);
    }
    const orphans = classified.concepts
      .filter((c) => !linkedIds.has(c.id))
      .map((c) => c.id);

    // Build stats
    const byType: Record<RelationshipType, number> = {
      INFLUENCES: 0,
      SUPPORTS: 0,
      CONTRADICTS: 0,
      COMPOSED_OF: 0,
      DERIVES_FROM: 0,
    };
    for (const rel of relationships) {
      byType[rel.type]++;
    }

    const result: LinkedResult = {
      source: classified.source,
      linking_date: new Date().toISOString(),
      concepts: classified.concepts,
      relationships,
      relationship_stats: {
        total: relationships.length,
        by_type: byType,
        orphan_concepts: orphans,
      },
    };

    const output = JSON.stringify(result, null, 2);

    if (outputFile) {
      await Deno.writeTextFile(outputFile, output);
      console.log(`\nLinking results written to: ${outputFile}`);
      console.log(`  - ${relationships.length} relationships created`);
      console.log(`  - ${orphans.length} orphan concepts`);
    } else {
      console.log("\n" + output);
    }
  } else {
    // Default: output pair prompts
    console.log(`# Relationship Analysis Prompts for: ${classified.source.title}`);
    console.log(`# Pairs to analyze: ${pairs.length}\n`);

    for (const [conceptA, conceptB] of pairs) {
      console.log("=".repeat(80));
      console.log(generatePairAnalysisPrompt(conceptA, conceptB, classified.source.title));
      console.log("");
    }
  }
}

main();
