---
name: research
description: Diagnose research quality and guide systematic query expansion. Use when starting research on any topic, when stuck in research, or when unsure if research is complete.
license: MIT
metadata:
  author: jwynia
  version: "2.0"
  domain: research
  cluster: methodology
  type: diagnostic
  mode: assistive
---

# Research Skill

Tool-assisted research with Tavily integration. Transforms basic questions into comprehensive search strategies using AI-optimized web search.

## Setup

This skill includes a bundled Tavily CLI script at `scripts/tavily-cli.ts`.

### Requirements

1. **Deno** - Install from https://deno.land
2. **Tavily API Key** - Get one at https://tavily.com (free tier available)

### Configuration

Set your API key:
```bash
export TAVILY_API_KEY="your-key-here"
```

Create an alias for convenience (add to your shell profile):
```bash
# Adjust path to where this skill is installed
alias tavily='deno run --allow-net --allow-env /path/to/skills/research/scripts/tavily-cli.ts'
```

Or run directly:
```bash
deno run --allow-net --allow-env ./scripts/tavily-cli.ts "your query"
```

Commands below use `tavily` assuming the alias is configured.

---

## Quick Reference

### Common Commands

```bash
# Basic search
tavily "your query"

# With AI answer summary
tavily "your query" --answer

# Deep search with more results
tavily "your query" --depth advanced --results 10 --answer

# News/recent content
tavily "your query" --topic news --time week

# Exclude familiar sources to find new perspectives
tavily "your query" --exclude wikipedia.org,reddit.com
```

### Phase Summary

| Phase | Type | Purpose |
|-------|------|---------|
| 0 | Manual | Analyze topic, set scope |
| 1 | Tavily | Discover expert terminology |
| 2 | Tavily | Foundational search |
| 3 | Tavily | Counter-perspectives |
| 4 | Manual | Synthesize findings |

### Scope → Tavily Depth

| Decision Stakes | Tavily Settings |
|-----------------|-----------------|
| Low, reversible | `--depth basic --results 3` |
| Moderate | `--depth basic --results 5 --answer` |
| High, irreversible | `--depth advanced --results 10 --answer` |

---

## Phase 0: Analysis

**Goal**: Structure topic before searching. Prevents unfocused searches and scope mismatch.

### Scope Calibration

Before searching, assess stakes:

| Decision Type | Confidence Needed | Research Depth |
|---------------|-------------------|----------------|
| Reversible, low-stakes | 60-70% | Quick scan (minutes) |
| Reversible, moderate | 75-85% | Working knowledge |
| Irreversible, moderate | 85-90% | Solid grounding |
| Irreversible, high | 90-95% | Deep expertise |

### Analysis Template

```markdown
# Research Analysis: [Topic]

## Core Concepts
- **Primary terms:** [Key terms requiring definition]
- **Terminology variants:** [Synonyms, jargon, historical terms]
- **Ambiguous terms:** [Terms with multiple meanings]

## Stakeholders
- **Primary actors:** [Who is directly involved?]
- **Affected groups:** [Who bears consequences?]
- **Opposing interests:** [Who benefits from different outcomes?]

## Temporal Scope
- **Historical origins:** [When did this begin?]
- **Key transitions:** [What changed and when?]
- **Current state:** [What's happening now?]

## Domains
- **Primary field:** [Main discipline]
- **Adjacent fields:** [Related disciplines]

## Controversies
- **Active debates:** [What's contested?]
- **Competing frameworks:** [Different ways of understanding]
```

### Phase 0 Checklist

- [ ] Identified primary terms
- [ ] Listed potential stakeholders
- [ ] Assessed decision stakes
- [ ] Determined appropriate research depth

---

## Phase 1: Vocabulary Discovery

**Goal**: Discover expert terminology to unlock deeper search results.

### Why Vocabulary Matters

- Outsider terms → introductory material
- Expert terms → research, nuanced analysis
- Cross-domain terms → bridge bodies of work

### Tavily Commands for Vocabulary Discovery

| Discovery Need | Command |
|----------------|---------|
| Expert terminology | `tavily "[topic] terminology experts" --answer` |
| Academic terms | `tavily "[topic] academic research terminology" --answer` |
| Cross-domain synonyms | `tavily "[topic] also known as called" --answer` |
| Historical terms | `tavily "[topic] history original term" --answer` |

### Vocabulary Discovery Process

1. Run initial terminology search:
   ```bash
   tavily "[topic] terminology" --answer --results 5
   ```

2. From results, note:
   - Expert terms (technical vocabulary)
   - Outsider terms (popular/introductory language)
   - Cross-domain equivalents

3. Update vocabulary map (template below)

4. Re-run searches with expert terms:
   ```bash
   tavily "[expert-term]" --answer
   ```

5. Compare result quality - expert terms should surface deeper content

### Vocabulary Map Template

```markdown
## Core Terms
| Term | Domain | Depth Level |
|------|--------|-------------|
| [expert term] | [field] | Expert |
| [outsider term] | General | Introductory |

## Cross-Domain Synonyms
| Concept | Terms by Domain |
|---------|-----------------|
| [concept] | Field A: [term], Field B: [term] |

## Depth Indicators
| Level | Terms | What They Surface |
|-------|-------|-------------------|
| Introductory | [terms] | Overviews, explainers |
| Expert | [terms] | Research, nuanced analysis |
```

### Phase 1 Checklist

- [ ] Ran terminology discovery search
- [ ] Identified expert vs. outsider terms
- [ ] Mapped cross-domain synonyms
- [ ] Created vocabulary map

---

## Phase 2: Foundational Search

**Goal**: Build foundational understanding with authoritative sources.

### Question Pattern → Tavily Command

| Question Pattern | Strategy | Command |
|------------------|----------|---------|
| "What is X?" | Consensus from authorities | `tavily "[expert-term] definition" --answer --depth advanced` |
| "Should I X?" | Pros/cons, alternatives | `tavily "[expert-term] pros cons comparison" --answer` |
| "Is X true?" | Evidence, counter-evidence | `tavily "[claim] evidence research" --answer --depth advanced` |
| "How do I X?" | Step-by-step, pitfalls | `tavily "[expert-term] guide tutorial" --answer` |
| Historical context | Origins and evolution | `tavily "[topic] history origins development" --answer` |

### Source Type Selection

| Source Type | Best For | Tavily Approach |
|-------------|----------|-----------------|
| Academic/Research | Mechanism, causation | `--depth advanced --results 10` |
| Practitioner content | How things work, edge cases | `--topic general --answer` |
| News/Current | Recent developments | `--topic news --time week` |
| Official docs | Technical specs, policy | `--include [official-domain]` |

### Foundational Search Process

1. Start with expert terminology from Phase 1

2. Run foundational queries:
   ```bash
   # Definition/overview
   tavily "[expert-term] comprehensive overview" --answer --depth advanced

   # Key perspectives
   tavily "[expert-term] major approaches" --answer --results 7
   ```

3. For each major perspective found, get 2-3 authoritative sources:
   ```bash
   tavily "[perspective-name] [expert-term]" --answer --results 5
   ```

4. Track sources in research notes

### Phase 2 Checklist

- [ ] Used expert terminology from Phase 1
- [ ] Searched for foundational overview
- [ ] Identified 2-3 major perspectives
- [ ] Found authoritative sources per perspective
- [ ] Tracked sources

---

## Phase 3: Counter-Perspective Search

**Goal**: Explicitly find opposing viewpoints to avoid confirmation bias.

### Why Counter-Perspectives Matter

Single-perspective research:
- All sources support one viewpoint
- Missing counterarguments
- Echo chamber risk

### Tavily Commands for Counter-Perspectives

| Need | Command |
|------|---------|
| General criticism | `tavily "[topic] criticism problems" --answer` |
| Opposing viewpoint | `tavily "[topic] skeptics critique" --answer` |
| Alternative approaches | `tavily "[topic] alternatives instead of" --answer` |
| Failure cases | `tavily "[topic] failures when wrong" --answer` |
| Avoid echo chamber | `tavily "[topic] debate" --exclude [familiar-sources]` |

### Counter-Perspective Process

1. Identify your current understanding/lean

2. Search for strongest counterargument:
   ```bash
   tavily "[topic] strongest argument against" --answer --depth advanced
   ```

3. Exclude sources you've already seen:
   ```bash
   tavily "[topic]" --exclude [domains-already-searched]
   ```

4. Search for failure modes:
   ```bash
   tavily "[topic] when fails problems limitations" --answer
   ```

5. Document opposing perspectives in research notes

### Phase 3 Checklist

- [ ] Identified current understanding/position
- [ ] Searched for strongest counterargument
- [ ] Used --exclude to find new sources
- [ ] Searched for limitations/failure cases
- [ ] Documented opposing perspectives

---

## Phase 4: Synthesis

**Goal**: Synthesize findings with explicit confidence markers.

### Completion Criteria

#### Minimum Viable (Quick Decisions)
- [ ] Can define core concepts in own words
- [ ] Know 2-3 major perspectives
- [ ] Found authoritative source per perspective
- [ ] Identified known unknowns

#### Working Knowledge (Most Decisions)
- [ ] Can explain historical context
- [ ] Understand stakeholder positions
- [ ] Encountered counterarguments
- [ ] Checked multiple domains

#### Deep Expertise (High-Stakes)
- [ ] Traced claims to primary sources
- [ ] Can evaluate competing evidence
- [ ] Understand knowledge limitations

### Diminishing Returns Signals

Stop when:
- New sources cite same foundational works (circular)
- New searches return familiar content (repetitive)
- Each hour adds less than previous (marginal)
- Can make decision or take action (sufficient)

### Confidence Markers

| Level | Phrases to Use |
|-------|----------------|
| Established | "X is...", "X works by..." |
| Strong evidence | "Evidence strongly suggests..." |
| Moderate evidence | "Most sources report..." |
| Limited evidence | "One study found..." |
| Unknown | "No reliable information found..." |

### Synthesis Template

```markdown
## Summary
[Direct answer to question]

## Confidence Level
[High/Medium/Low] - [Justification]

## Key Findings
1. [Finding with source type]

## Perspectives
| Perspective | Key Argument | Source Quality |
|-------------|--------------|----------------|
| [view] | [argument] | [assessment] |

## Counter-Evidence
- [What argues against the main conclusion]

## Caveats
- [What wasn't consulted]
- [What assumptions were made]

## For Deeper Investigation
[What would increase confidence]
```

### Phase 4 Checklist

- [ ] Met completion criteria for stakes level
- [ ] Checked diminishing returns signals
- [ ] Applied confidence markers
- [ ] Completed synthesis template
- [ ] Stored findings for future reference

---

## Tavily Command Reference

### Basic Usage

```bash
tavily "search query" [options]
```

### Options

| Option | Description | Values |
|--------|-------------|--------|
| `--answer` | Include AI-generated answer summary | flag |
| `--depth` | Search depth | `basic` (default), `advanced` |
| `--results` | Number of results | 1-20 (default: 5) |
| `--topic` | Topic category | `general` (default), `news`, `finance` |
| `--time` | Time filter | `day`, `week`, `month`, `year` |
| `--include` | Only include domains | comma-separated |
| `--exclude` | Exclude domains | comma-separated |
| `--raw` | Include raw page content | flag |
| `--json` | Output as JSON | flag |

### Scenario → Command Mapping

| Research Scenario | Command |
|-------------------|---------|
| Quick overview | `tavily "query" --answer` |
| Deep dive | `tavily "query" --depth advanced --results 10 --answer` |
| Recent news | `tavily "query" --topic news --time week` |
| Academic focus | `tavily "query" --depth advanced --include scholar.google.com,arxiv.org` |
| Avoid Wikipedia | `tavily "query" --exclude wikipedia.org` |
| Fresh perspectives | `tavily "query" --exclude [already-seen-domains]` |
| Financial data | `tavily "query" --topic finance --answer` |
| Raw content for analysis | `tavily "query" --raw --json` |

---

## Diagnostic States

Use these to identify where research is stuck and which phase to revisit.

| State | Symptom | Phase to Revisit |
|-------|---------|------------------|
| **R0: No Analysis** | Searching without structuring topic | Phase 0 |
| **R1: No Vocabulary** | Using outsider terms, finding only surface content | Phase 1 |
| **R2: Single-Perspective** | All sources support one view | Phase 3 |
| **R3: Domain Blindness** | Searching only in familiar field | Phase 1 (cross-domain terms) |
| **R4: Recency Bias** | Only recent sources | Phase 2 (historical queries) |
| **R5: Breadth Without Depth** | Many tabs, no synthesis | Phase 4 |
| **R6: Completion Uncertainty** | Unsure when to stop | Phase 4 (completion criteria) |
| **R7: Complete** | Can explain, identify uncertainties, act | Done |

### Quick Diagnostic

1. Can you explain the topic in expert terminology? → If no, Phase 1
2. Have you found opposing viewpoints? → If no, Phase 3
3. Can you state your confidence level with justification? → If no, Phase 4
4. Is your research depth proportional to stakes? → If no, Phase 0

---

## Anti-Patterns

| Pattern | Symptom | Fix |
|---------|---------|-----|
| Confirmation Trap | Searching to confirm, not learn | Phase 3: Search for strongest counterargument |
| Authority Fallacy | Accepting claims by source prestige | Evaluate evidence, not source |
| Recency Trap | Only recent sources | Phase 2: Historical context queries |
| Breadth Trap | 50 tabs, none read | Phase 4: 3-source rule, synthesize before continuing |
| Single-Source | One source as final answer | Require 3 independent sources |
| Jargon Blind Spot | Missing other fields' terminology | Phase 1: Cross-domain vocabulary |
| Infinite Rabbit Hole | Lost original purpose | Phase 0: Return to scope/stakes |
| Echo Chamber | Same sources repeatedly | Phase 3: Use --exclude flag |

---

## Output Persistence

### Output Discovery

**Before doing any other work:**

1. Check for `context/output-config.md` in the project
2. If found, look for this skill's entry
3. If not found or no entry for this skill, **ask the user first**:
   - "Where should I save output from this research session?"
   - Suggest: `explorations/research/` or a sensible location for this project
4. Store the user's preference

### What to Store

| Layer | Contents |
|-------|----------|
| Vocabulary Map | Terms, domains, depth levels |
| Sources | URLs, relevance scores, quality notes |
| Synthesis | Summary, confidence, findings, caveats |
| Query Log | Tavily commands that worked/failed |
| Gaps | What remains unknown |

### File Naming

Pattern: `{topic}-research-{date}.md`
Example: `competency-frameworks-research-2025-01-15.md`

---

## Integration Points

| Skill | Connection |
|-------|------------|
| **doppelganger** | Research informs decisions; apply /truth-check to findings |
| **context-networks** | Store research findings in appropriate network node |
| **boundary-critique** | Apply to advice and recommendations encountered |

---

## Health Check Questions

During research, ask:

1. Am I searching to learn or to confirm?
2. What's the strongest argument against my current view?
3. Have I looked outside my familiar domains?
4. Am I using expert or outsider vocabulary?
5. Is my depth proportional to the stakes?
6. Have I stored what I've learned for future use?

---

## Source Framework

Derived from: `references/research-framework.md`
