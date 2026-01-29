# Research Project Scaffold

Directory structure and initial content for research projects (academic, market research, investigation).

## Directory Structure

```
context/
├── status.md              # Current research state
├── decisions.md           # Methodology decisions
├── glossary.md            # Technical vocabulary
├── questions/             # Research questions
│   ├── primary.md         # Main research questions
│   └── emerging.md        # Questions discovered during research
├── sources/               # Source tracking
│   ├── index.md           # Source catalog
│   └── [source-type]/     # e.g., papers/, interviews/, data/
├── findings/              # Research discoveries
│   ├── index.md           # Findings overview
│   └── [topic]/           # Organized by research area
└── methodology/           # Research approach
    ├── approach.md        # Overall methodology
    └── protocols/         # Specific procedures
```

## Initial File Content

### status.md

```markdown
# Research Status

## Current State

Research project initiated. Establishing scope and methodology.

## Active Work

- [ ] Define research questions
- [ ] Identify initial sources
- [ ] Establish methodology

## Research Phase

**Current Phase:** Scoping
**Next Phase:** Literature Review

## Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| {{today}} | Project initiated | Research scope being defined |

## Open Questions

{{Questions that need answering to proceed}}

## Blockers

{{Access issues, resource gaps, etc.}}

---

*Last updated: {{today}}*
```

### questions/primary.md

```markdown
# Primary Research Questions

## Purpose

Central questions driving this research. All work should connect back to these.

## Classification

- **Domain:** Research
- **Stability:** Semi-stable
- **Abstraction:** Conceptual
- **Confidence:** Evolving

## Main Questions

### RQ1: {{Primary Question}}

**Why it matters:** {{Significance}}

**Scope:** {{Boundaries of this question}}

**Success criteria:** {{How we'll know when answered}}

### RQ2: {{Secondary Question}}

...

## Question Relationships

{{How questions relate to each other, dependencies}}

## Relationships

### Related Nodes
- findings/* - answers - research discoveries address these questions
- methodology/approach.md - depends-on - methodology designed to answer these

## Navigation

**When to access:**
- Starting new research thread
- Evaluating if work is on-track
- Prioritizing next steps
```

### sources/index.md

```markdown
# Source Index

## Purpose

Catalog of all sources consulted. Enables traceability and prevents duplicate work.

## Classification

- **Domain:** Research
- **Stability:** Dynamic
- **Abstraction:** Detailed
- **Confidence:** Established

## Source Categories

### Academic Papers
| ID | Citation | Status | Relevance | Notes |
|----|----------|--------|-----------|-------|
| P001 | {{citation}} | Read | High | {{key takeaway}} |

### Books
| ID | Citation | Status | Relevance | Notes |
|----|----------|--------|-----------|-------|

### Interviews/Primary
| ID | Source | Date | Status | Notes |
|----|--------|------|--------|-------|

### Web Sources
| ID | URL | Accessed | Relevance | Notes |
|----|-----|----------|-----------|-------|

## Status Legend
- **Identified**: Found, not yet reviewed
- **Skimmed**: Quick review, relevance assessed
- **Read**: Fully reviewed
- **Extracted**: Key info captured in findings

## Relationships

### Related Nodes
- findings/* - supports - findings cite these sources
- questions/primary.md - addresses - sources selected for relevance to questions
```

## Bootstrap Questions

When setting up a research project, ask:

1. **What type of research?**
   - Academic: emphasis on citations, methodology rigor
   - Market: emphasis on data sources, competitive analysis
   - Investigative: emphasis on source tracking, evidence chain

2. **What's the output format?**
   - Paper/report: structured findings
   - Presentation: key insights extraction
   - Decision support: actionable recommendations

3. **Timeline and scope?**
   - Affects depth vs. breadth tradeoffs
   - Determines how much process documentation needed

4. **Collaboration model?**
   - Solo: lighter coordination docs
   - Team: source assignment, findings review process

## Integration Notes

- Link findings to source IDs for traceability
- Update source status as you work
- Capture emerging questions—they often lead to best insights
