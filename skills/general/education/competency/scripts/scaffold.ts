#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * Competency Framework Scaffolding Generator
 *
 * Generates a competency framework structure from topic analysis.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/scaffold.ts "Topic Name" [options]
 *
 * Options:
 *   --output, -o    Output file path (default: stdout)
 *   --audiences     Comma-separated audience layers (default: "general,practitioner,specialist")
 *
 * Example:
 *   deno run --allow-read --allow-write scripts/scaffold.ts "Data Privacy" -o data-privacy-competency.md
 */

import { parseArgs } from "https://deno.land/std@0.224.0/cli/parse_args.ts";

interface ScaffoldOptions {
  topic: string;
  audiences: string[];
  output?: string;
}

function generateScaffold(options: ScaffoldOptions): string {
  const { topic, audiences } = options;
  const prefix = topic
    .split(" ")
    .map((w) => w[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 3);

  const audienceTable = audiences
    .map((a, i) => {
      const depth =
        i === 0
          ? "Rules, minimal why"
          : i === audiences.length - 1
            ? "Full technical detail"
            : "Principles, edge cases";
      return `| ${a.charAt(0).toUpperCase() + a.slice(1)} | [Who?] | ${depth} |`;
    })
    .join("\n");

  const layerSections = audiences
    .map((a, i) => {
      const name = a.charAt(0).toUpperCase() + a.slice(1);
      const content =
        i === 0
          ? "[Rules without extensive justification. What to do.]"
          : i === audiences.length - 1
            ? "[Full technical/legal detail. How to verify, audit, configure.]"
            : "[Enough 'why' to handle edge cases. Principles behind rules.]";
      return `### Layer ${i + 1}: ${name}\n\n${content}`;
    })
    .join("\n\n");

  return `# ${topic} Competency Framework

> Generated scaffold - fill in based on failure mode analysis

---

## Purpose

[What contexts will this framework serve? Hiring, onboarding, reference, support?]

---

## Competency Clusters

### [Cluster 1 Name] Competencies

| ID | Competency | Description |
|----|------------|-------------|
| ${prefix}-1 | [Action verb phrase] | Can [observable capability] |
| ${prefix}-2 | [Action verb phrase] | Can [observable capability] |
| ${prefix}-3 | [Action verb phrase] | Can [observable capability] |

### [Cluster 2 Name] Competencies

| ID | Competency | Description |
|----|------------|-------------|
| ${prefix}-4 | [Action verb phrase] | Can [observable capability] |
| ${prefix}-5 | [Action verb phrase] | Can [observable capability] |

---

## Failure Mode Analysis

Before defining competencies, analyze what goes wrong:

| Failure Mode | What Happens | Suggested Competency |
|--------------|--------------|---------------------|
| [Mistake 1] | [Consequence] | [Competency that would prevent it] |
| [Mistake 2] | [Consequence] | [Competency that would prevent it] |
| [Mistake 3] | [Consequence] | [Competency that would prevent it] |

---

## Audiences

| Layer | Who | Depth |
|-------|-----|-------|
${audienceTable}

---

## Scenarios

### Scenario: [Name]

**Core decision structure:** [What judgment is being tested]

**Interview variant:**
> [Generic situation requiring the competency]

**Assessment variant:**
> [Organization-specific version using real tools/policies]

**Competencies assessed:** [IDs]

**What good looks like:**
- [Consideration a strong response would include]
- [Another consideration]

**Red flags:**
- [What a weak response would miss]
- [Common mistakes]

---

### Scenario: [Name 2]

**Core decision structure:** [What judgment is being tested]

**Interview variant:**
> [Generic situation]

**Assessment variant:**
> [Organization-specific version]

**Competencies assessed:** [IDs]

**What good looks like:**
- [Consideration]

**Red flags:**
- [Weak response indicator]

---

## Explanatory Content

${layerSections}

---

## Verification Criteria

### Scoring Rubric

| Level | Description |
|-------|-------------|
| **Not demonstrated** | Didn't engage with the relevant considerations |
| **Partial** | Identified some factors but missed important ones |
| **Competent** | Addressed key considerations, sound reasoning |
| **Strong** | Identified non-obvious factors, sophisticated judgment |

### Evidence Types

| Type | Use For |
|------|---------|
| Scenario response | Interview, assessment checkpoints |
| Artifact produced | Documentation, evaluations they create |
| Observed behavior | Did the thing in real work |
| Taught others | Explained it to someone else |

---

## Progression Model

\`\`\`
Foundation (Everyone)
├── ${prefix}-1: [Name]
└── ${prefix}-2: [Name]

├─► Intermediate ([Role])
│   ├── ${prefix}-3: [Name] (requires: ${prefix}-1)
│   └── ${prefix}-4: [Name] (requires: ${prefix}-2)

└─► Specialist ([Role])
    └── ${prefix}-5: [Name] (requires: ${prefix}-3, ${prefix}-4)
\`\`\`

### Skip Logic

| If demonstrates... | Skip/modify... |
|--------------------|----------------|
| [Prior competency] | [What can be skipped] |

---

## Feedback Loop Design

### Observation Mechanism
- How questions are logged: [TBD]
- What context is captured: [TBD]
- How tagged to competencies: [TBD]

### Analysis Cadence
[Weekly? Monthly?]

### Pattern Routing
| Pattern Type | Owner |
|--------------|-------|
| Training gap | [Who] |
| Framework gap | [Who] |
| Process gap | [Who] |
| Tooling gap | [Who] |

---

## Maintenance

### Review Triggers
- [ ] Policy changes
- [ ] Incidents
- [ ] New tools
- [ ] Feedback patterns

### Ownership
- Framework owner: [Name/Role]
- Content owners: [By cluster]
- Review cadence: [Frequency]

---

## Open Questions

- [What needs clarification?]
- [What's uncertain?]
- [What should be tested first?]
`;
}

function main() {
  const args = parseArgs(Deno.args, {
    string: ["output", "audiences"],
    alias: { o: "output", a: "audiences" },
    default: {
      audiences: "general,practitioner,specialist",
    },
  });

  const topic = args._[0] as string;

  if (!topic) {
    console.error("Usage: scaffold.ts <topic> [--output file] [--audiences a,b,c]");
    console.error("Example: scaffold.ts 'Data Privacy' -o data-privacy.md");
    Deno.exit(1);
  }

  const options: ScaffoldOptions = {
    topic,
    audiences: args.audiences.split(",").map((a: string) => a.trim()),
    output: args.output,
  };

  const scaffold = generateScaffold(options);

  if (options.output) {
    Deno.writeTextFileSync(options.output, scaffold);
    console.log(`Scaffold written to: ${options.output}`);
  } else {
    console.log(scaffold);
  }
}

main();
