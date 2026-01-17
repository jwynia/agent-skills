---
name: ebook-analysis
description: "Parse ebooks and extract concepts with citation traceability. This skill should be used when the user asks to 'analyze a book', 'extract concepts from an ebook', 'build a knowledge network from books', or wants to synthesize themes across multiple sources. Keywords: ebook, book analysis, knowledge extraction, concepts, citations, synthesis, non-fiction."
license: MIT
compatibility: Works with txt and epub files. Requires Deno for parsing scripts.
metadata:
  author: jwynia
  version: "1.0"
---

# Ebook Analysis

Analyze ebooks to extract concepts with full citation traceability. Guide users through parsing, extracting, classifying, and linking concepts from non-fiction books to build knowledge networks.

## When to Use This Skill

Use this skill when:
- Analyzing non-fiction books for knowledge extraction
- Building concept networks from multiple sources
- Need traceable citations from published works
- Synthesizing themes across a book collection

Do NOT use this skill when:
- Analyzing fiction (use story-analysis)
- Need summaries without citations
- Working with audio/video (transcribe first)

## Core Principle

**Every concept must be traceable to its exact source.** Citation traceability is non-negotiable. Extract less with full provenance rather than more without it.

## Diagnostic States

### EA0: No Input
**Symptoms:** User wants analysis but no file provided
**Interventions:** Guide input preparation, discuss scope

### EA1: Unparsed Input
**Symptoms:** Have raw file but no chunking done
**Interventions:** Run `scripts/ea-parse.ts` for chunking with position tracking

### EA2: Parsed, Unextracted
**Symptoms:** Book chunked but no concepts identified
**Interventions:** Present chunks to LLM for concept identification with exact quotes

### EA3: Extracted, Unclassified
**Symptoms:** Concepts exist but not typed by concept type or layer
**Interventions:** Classify by type (principle/mechanism/pattern/strategy/tactic) and layer (0-4)

### EA4: Classified, Unannotated
**Symptoms:** Concepts typed but lack thematic annotations
**Interventions:** Add theme tags and functional analysis

### EA5: Single Book Complete
**Symptoms:** Book fully analyzed with citations and classifications
**Next:** Export or proceed to multi-book synthesis

### EA6: Multi-Book Ready
**Symptoms:** Multiple books analyzed, ready for synthesis
**Interventions:** Cross-book analysis for connections, contradictions, gaps

### EA7: Analysis Complete
**Indicators:** Full network with validated citations and synthesis reports

## Concept Types (Abstract → Concrete)

| Type | Definition | Example |
|------|------------|---------|
| **Principle** | Foundational truth | "Communities form around shared identity" |
| **Mechanism** | How something works | "Reciprocity creates social bonds" |
| **Pattern** | Recurring structure | "The community lifecycle pattern" |
| **Strategy** | High-level approach | "Build trust before asking for contribution" |
| **Tactic** | Specific technique | "Send welcome emails within 24 hours" |

## Abstraction Layers

| Layer | Name | Example |
|-------|------|---------|
| 0 | Foundational | "Humans seek belonging" |
| 1 | Theoretical | "Community requires shared purpose" |
| 2 | Strategic | "The funnel model of engagement" |
| 3 | Tactical | "Onboarding sequences" |
| 4 | Specific | "Use Discourse for forums" |

## Available Scripts

| Script | Purpose |
|--------|---------|
| `ea-parse.ts` | Parse ebook into chunks with positions |
| `ea-extract.ts` | Extract concepts from chunks |
| `ea-classify.ts` | Classify concepts by type/layer |
| `ea-link.ts` | Create relationships between concepts |
| `ea-validate.ts` | Validate citation accuracy |

### Usage

```bash
# Parse book into chunks
deno run --allow-read scripts/ea-parse.ts path/to/book.txt

# With options
deno run --allow-read scripts/ea-parse.ts book.txt --chunk-size 1500 --overlap 150

# Validate analysis
deno run --allow-read scripts/ea-validate.ts analysis.json --report
```

## Anti-Patterns

### The Extraction Flood
Extracting every potentially interesting phrase.
**Fix:** Ask "Would I cite this?" before extracting.

### The Citation Black Hole
Extracting without preserving quotes and positions.
**Fix:** Always capture: exact quote, position, context, chapter.

### The Single-Book Silo
Never creating cross-book links.
**Fix:** After 2+ books, run synthesis.

## Output Persistence

Save to: `./ebook-analysis/{author}-{title}/`

Files:
- **analysis.json** - Complete analysis
- **concepts.json** - Extracted concepts
- **citations.json** - Citation records
- **report.md** - Human-readable report

## Relationship Types

| Relationship | Meaning |
|--------------|---------|
| **INFLUENCES** | A affects B |
| **SUPPORTS** | A provides evidence for B |
| **CONTRADICTS** | A conflicts with B |
| **COMPOSED_OF** | A contains B |
| **DERIVES_FROM** | A is derived from B |

## Related Skills

- **research** - Find sources for analysis
- **dna-extraction** - Deep functional analysis of extracted concepts
- **voice-analysis** - Author style fingerprinting
