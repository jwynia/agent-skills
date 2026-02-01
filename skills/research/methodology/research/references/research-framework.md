# Framework for Systematic Research Query Expansion

This framework provides a methodical approach to expanding basic research queries into comprehensive search strategies that capture the full context and nuance of a topic.

## Phase 1: Topic Analysis

Before generating specific search queries, analyze the topic through multiple lenses to identify key areas that need investigation.

### Core Concept Analysis
- Identify primary terminology and concepts requiring definition
- Map related concepts and terminology variants
- Note any ambiguous terms that need clarification
- Consider historical evolution of key terms

### Stakeholder Analysis
- Identify primary actors or affected groups
- Map opposing or competing interests
- Consider institutional vs individual perspectives
- Note power dynamics or hierarchies

### Temporal Context
- Determine relevant historical background needed
- Identify key transition or change points
- Consider current state documentation needs
- Map future implications or projections

### Domain Mapping
- Identify primary field(s) of study
- Map adjacent or overlapping fields
- Consider interdisciplinary connections
- Note methodological traditions of each field

### Controversy Identification
- Map major debates or disagreements
- Identify competing frameworks or approaches
- Note potential biases or assumptions
- Consider ethical implications

## Phase 1.5: Vocabulary Mapping

**This is a primary research deliverable, not a preparatory step.** The vocabulary map determines what you can find and what semantic space you activate in LLMs.

### Why Vocabulary Matters

1. **Search space determination**: Expert terms surface expert-level material. Outsider terms surface introductory material that oversimplifies for onboarding.
2. **Vector space activation**: In LLMs, precise vocabulary "lights up" different regions of semantic space than generic alternatives. Dense diction compounds this effect.
3. **Cross-domain bridging**: The same concept often has different names in different fields. Missing a term means missing an entire body of work.
4. **Research persistence**: A vocabulary map from one session enables better searches in future sessions without rebuilding from scratch.

### Vocabulary Map Structure

Build this incrementally as you research. Store it for reuse.

```markdown
# Vocabulary Map: [Topic]

## Core Terms (Must Know)
| Term | Definition | Domain | Depth Level |
|------|------------|--------|-------------|
| [expert term] | [precise definition] | [field] | Expert |
| [common term] | [how outsiders refer to this] | General | Introductory |

## Synonyms and Variants
| Concept | Terms by Domain |
|---------|-----------------|
| [concept] | Psychology: [term], Economics: [term], Practitioner: [term] |

## Historical Terms
| Current Term | Historical Variant | Era/Context |
|--------------|-------------------|-------------|
| [modern] | [archaic/obsolete] | [when used] |

## Jargon vs. Plain Language
| Expert Jargon | Plain Language Equivalent | When to Use Each |
|---------------|--------------------------|------------------|
| [technical] | [accessible] | [context] |

## Depth Indicators
| Level | Example Terms | What They Surface |
|-------|---------------|-------------------|
| Introductory | [outsider terms] | Overviews, explainers, onboarding |
| Working | [professional terms] | Practitioner material, how-to |
| Expert | [technical/academic] | Research, nuanced analysis |
| Cutting-edge | [emerging terms] | Latest developments, debates |

## Domain-Specific Terminology
| Domain | Key Terms | Notes |
|--------|-----------|-------|
| [field 1] | [terms] | [what this field emphasizes] |
| [field 2] | [terms] | [different framing] |

## Search Query Implications
- Use [expert terms] to find: [what]
- Use [outsider terms] to find: [what]
- Combine [term A] + [term B] to find: [intersection]
```

### Vocabulary Discovery Process

1. **Start with your current vocabulary** - Note which terms feel like outsider language
2. **Find the expert terms** - In early sources, watch for "also known as," "technically called," "in the literature"
3. **Map across domains** - When you find relevant work in another field, capture their terminology
4. **Note depth levels** - Which terms appear in introductions vs. deep in technical sections?
5. **Capture historical terms** - Older foundational works may use different vocabulary
6. **Test in searches** - Run parallel searches with different terms, note what surfaces

### Vocabulary Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Outsider Lock-in | Only using terms you started with | Actively hunt for expert vocabulary in early sources |
| Single-Domain Blindness | Only knowing one field's terms | Explicitly search "[concept] in [other field]" |
| Recency Vocabulary | Only modern terms | Find seminal works, capture their terminology |
| Precision Avoidance | Using vague terms for "broader" search | Precise terms find precise material; use both |

### Persistence and Reuse

**Store vocabulary maps for future use.** Research on the same topic shouldn't start from scratch.

Recommended storage:
- Topic vocabulary maps in context network or research folder
- Include sources where terms were found
- Note which terms proved most productive
- Update as new terms are discovered

This compounds: a well-developed vocabulary map makes every future search on that topic more effective, and enables better prompts for LLM assistance (activating richer semantic space).

## Phase 2: Search Query Construction

Transform the analysis into specific search queries optimized for different types of sources and evidence.

### Query Types to Generate

1. Foundational/Definition Queries
   - Include standard technical terminology
   - Target academic or professional sources
   - Use "definition" "overview" "introduction" qualifiers
   - Example: "term definition AND (field OR domain) review"

2. Historical Context Queries
   - Include specific date ranges
   - Target both primary and secondary sources
   - Use "history" "evolution" "development" qualifiers
   - Example: "topic history development 1900-1980"

3. Current State Queries
   - Focus on recent developments (last 1-5 years)
   - Include contemporary terminology
   - Target industry and academic sources
   - Example: "topic current trends analysis 2020-2024"

4. Competing Perspectives Queries
   - Include terms for opposing viewpoints
   - Target critical analyses and debates
   - Use "debate" "critique" "controversy" qualifiers
   - Example: "topic debate AND (perspective1 OR perspective2) analysis"

5. Impact/Evidence Queries
   - Focus on empirical studies or data
   - Include methodology-related terms
   - Target outcome measurements
   - Example: "topic impact measurement study data"

### Query Optimization Techniques

1. Source Type Targeting
   - Academic: Include "study" "research" "methodology"
   - Industry: Include "market" "industry" "professional"
   - Policy: Include "policy" "regulation" "framework"
   - Public Opinion: Include "survey" "perception" "attitude"

2. Boolean Operator Usage
   - Use AND to combine required concepts
   - Use OR for synonyms or alternatives
   - Use NOT to exclude irrelevant results
   - Use parentheses for complex combinations

3. Precision Enhancement
   - Include specific date ranges when relevant
   - Use exact phrases for specific concepts
   - Include domain-specific terminology
   - Specify desired source types

## Example Application: "Gentrification of Men's Blue-Collar Workwear"

### Phase 1 Analysis Results:
- Core Concepts: workwear history, fashion transformation, class signaling
- Stakeholders: traditional workers, fashion industry, luxury consumers
- Timeline: historical work clothing evolution, recent fashion trends
- Domains: fashion history, labor history, sociology, consumer culture
- Controversies: authenticity vs appropriation, pricing/accessibility

### Phase 2 Generated Queries:

1. Foundational Context:
```
"history of American workwear AND (Carhartt OR Dickies) development manufacturing"
"blue collar work clothing evolution AND (denim OR canvas) 1900-1980"
```

2. Fashion Transformation:
```
"workwear fashion luxury market transformation 2010-2024"
"streetwear workwear collaboration history supreme carhartt"
```

3. Cultural/Economic Analysis:
```
"gentrification working class fashion appropriation critique"
"workwear price inflation AND original market displacement"
```

4. Industry Perspective:
```
"workwear brands luxury market adaptation strategy"
"traditional workwear manufacturers consumer demographic shift"
```

5. Sociological Analysis:
```
"class signaling fashion workwear authenticity"
"cultural appropriation working class aesthetics fashion"
```

## Framework Adaptation

This framework can be adapted based on:

1. Research Purpose
   - Academic investigation vs practical application
   - Overview vs deep technical analysis
   - Current state assessment vs historical analysis
   - Policy development vs market analysis

2. Resource Constraints
   - Time available for research
   - Access to different types of sources
   - Required depth vs breadth
   - Output format requirements

3. Topic Characteristics
   - Technical vs social focus
   - Single domain vs interdisciplinary
   - Established vs emerging field
   - Level of controversy or debate

When adapting the framework, maintain the systematic approach while adjusting the specific dimensions and query types to match the research needs and context.

## Single-Shot Research: Scope Calibration

When research must be completed without follow-up questions—agent-executed research, time-boxed queries, or situations where the requester isn't available for clarification—scope calibration becomes critical. The goal: **do enough, but not more than necessary**.

### The Calibration Problem

Research naturally expands. Without constraints, it follows interesting tangents, seeks ever-more certainty, and delays synthesis indefinitely. Single-shot research requires explicit stopping rules.

**The core question:** What level of confidence does this decision actually require?

| Decision Type | Required Confidence | Research Depth | Time Budget |
|---------------|---------------------|----------------|-------------|
| Reversible, low-stakes | 60-70% | Quick scan | Minutes |
| Reversible, moderate stakes | 75-85% | Working knowledge | 1-2 hours |
| Irreversible, moderate stakes | 85-90% | Solid grounding | Half day |
| Irreversible, high stakes | 90-95% | Deep expertise | Days |
| Safety-critical | 95%+ | Exhaustive | Whatever it takes |

### Scope Signals

**Extract scope from the question itself:**

| Question Pattern | Implied Scope | Research Strategy |
|------------------|---------------|-------------------|
| "What is X?" | Definition | 2-3 authoritative sources, establish consensus |
| "How does X work?" | Mechanism | Technical sources, diagrams, step-by-step |
| "Should I X?" | Decision support | Pros/cons, alternatives, conditions for each |
| "What are options for X?" | Survey | Breadth over depth, categorization |
| "Why does X happen?" | Causal | Multiple hypotheses, evidence for each |
| "Is X true?" | Verification | Primary sources, counter-evidence, consensus check |
| "What's the best X?" | Evaluation | Criteria definition, comparative analysis |
| "How do I X?" | Procedural | Step-by-step, prerequisites, common pitfalls |

**Context clues that expand scope:**
- "I need to explain this to..." → Requires clearer mental model
- "We're about to commit to..." → Higher stakes, need alternatives
- "This seems wrong but..." → Verify assumptions, check counter-evidence
- "Everyone says X but..." → Seek dissenting views, check consensus quality

**Context clues that constrain scope:**
- "Quick question..." → Surface-level answer acceptable
- "Just to confirm..." → Verification only, not exploration
- "Ballpark..." → Approximation acceptable
- "For context..." → Background, not decision-critical

### Source Type Selection

Different questions require different source types. Match sources to need.

| Source Type | Strengths | Weaknesses | Best For |
|-------------|-----------|------------|----------|
| **Wikipedia/Encyclopedias** | Broad coverage, citations to follow | May lag current state, oversimplified | Orientation, terminology, citation hunting |
| **Academic papers** | Rigorous, cited, peer-reviewed | Narrow scope, may be paywalled, jargon-heavy | Mechanism, causation, methodology |
| **Textbooks** | Structured, comprehensive, pedagogical | Dated, expensive, may oversimplify | Learning fundamentals, established knowledge |
| **Industry reports** | Current, practical, data-rich | Paywalled, may have bias, specific to sector | Market size, trends, benchmarks |
| **News/journalism** | Current events, accessible | Surface-level, may be sensationalized | Recent developments, public perception |
| **Practitioner blogs/forums** | Real-world experience, tacit knowledge | Unvetted, anecdotal, may be outdated | How things actually work, edge cases |
| **Official documentation** | Authoritative for that domain, current | Narrow scope, may assume expertise | Technical specs, policy, procedures |
| **Primary sources** | Unfiltered, authoritative | Requires interpretation, may be inaccessible | Verification, original context |

**Source selection heuristics:**

1. **Start with encyclopedic sources** for orientation and terminology
2. **Follow citations** to authoritative sources on specific claims
3. **Cross-domain**: If the topic touches multiple fields, sample each
4. **Recency matters for**: Technology, policy, market data, current events
5. **Recency doesn't matter for**: Foundational concepts, historical context, established science
6. **Practitioner + Academic**: Neither alone gives the full picture

### Synthesis Under Uncertainty

Single-shot research often ends before certainty is achieved. Synthesis must communicate what was found AND what wasn't.

**The Synthesis Template:**

```markdown
## Summary
[Direct answer to the question, stated clearly]

## Confidence Level
[High/Medium/Low] - [Brief justification]

## Key Findings
1. [Finding with source type: "Academic consensus is...", "Practitioners report...", "Documentation states..."]
2. [Finding]
3. [Finding]

## Caveats and Limitations
- [What sources were NOT consulted]
- [What perspectives may be missing]
- [What assumptions were made]
- [What would change the answer]

## For Deeper Investigation
[What additional research would increase confidence, if needed]
```

**Confidence calibration:**

| Confidence Level | Criteria | Signal Phrases |
|------------------|----------|----------------|
| **High** | Multiple independent sources agree; no credible counter-evidence found; well-established domain | "Sources consistently indicate...", "There is strong consensus that..." |
| **Medium** | Majority of sources agree; some counter-evidence exists; emerging or contested domain | "Most sources suggest...", "The prevalent view is... though some argue..." |
| **Low** | Sources conflict; limited sources found; rapidly changing domain | "Evidence is mixed...", "Limited sources available suggest...", "This appears to be contested..." |
| **Insufficient** | Could not find adequate sources; question may be malformed | "Could not find reliable sources for...", "The question may need reframing..." |

**Handling conflicting sources:**

1. **Report the conflict**, don't hide it
2. **Characterize the nature** of disagreement (data vs. interpretation vs. values)
3. **Note the credentials** of each side (without appeal to authority)
4. **Identify what would resolve** the conflict (more data, different methods, etc.)

### Confidence Signaling

Communicate uncertainty explicitly, not through hedging language.

**Anti-pattern:** "X might possibly be somewhat related to Y in certain circumstances."
**Better:** "X correlates with Y. Confidence: Medium. Based on 3 observational studies; no RCTs found."

**Confidence markers to use:**

| Certainty Level | Appropriate Phrases |
|-----------------|---------------------|
| Established fact | "X is...", "X works by..." |
| Strong evidence | "Evidence strongly suggests...", "Multiple sources confirm..." |
| Moderate evidence | "Available evidence indicates...", "Most sources report..." |
| Limited evidence | "Limited evidence suggests...", "One study found..." |
| Speculation | "It's plausible that...", "One hypothesis is..." |
| Unknown | "No reliable information found on...", "This remains unclear..." |

**What to signal explicitly:**

1. **Source quality**: "Per peer-reviewed research..." vs. "Per one blog post..."
2. **Consensus status**: "This is widely accepted" vs. "This is contested"
3. **Recency**: "As of 2024..." vs. "Based on 2015 data..."
4. **Scope of evidence**: "In US contexts..." vs. "Globally..."
5. **What wasn't found**: "No information found on [specific aspect]"

### Single-Shot Research Checklist

Before concluding single-shot research:

- [ ] **Scope matched to stakes?** Depth is proportional to decision importance
- [ ] **Multiple source types consulted?** Not just one category
- [ ] **Counter-evidence sought?** Actively looked for disconfirming information
- [ ] **Confidence level explicit?** Reader knows how certain findings are
- [ ] **Gaps acknowledged?** What wasn't found is stated
- [ ] **Actionable?** Answer directly addresses the question asked
- [ ] **Vocabulary captured?** If topic will recur, terms are stored

### Time-Boxing Strategies

When research has a hard time limit:

**Minutes (quick lookup):**
1. One authoritative source for the core answer
2. One cross-check for verification
3. State confidence as "quick check" level

**1-2 hours (working knowledge):**
1. 15 min: Orientation and vocabulary (encyclopedic sources)
2. 30 min: Core sources (2-3 per major perspective)
3. 15 min: Counter-evidence search
4. 15 min: Synthesis
5. Remaining: Fill gaps in weakest areas

**Half day (solid grounding):**
1. First hour: Full Phase 0 analysis + vocabulary mapping
2. Hours 2-3: Systematic source gathering across types
3. Hour 4: Counter-evidence and alternative perspectives
4. Final time: Synthesis with explicit confidence levels

**End early if:**
- Circular references (new sources cite the same works)
- Repetitive findings (no new information emerging)
- Sufficient for stated purpose
- Diminishing returns clearly visible

## Phase 0: Analysis Template

Before generating queries, use this template to structure your topic analysis:

```markdown
# Research Analysis: [Topic]

## Core Concepts
- **Primary terms:** [List key terms requiring definition]
- **Terminology variants:** [Synonyms, jargon, historical terms]
- **Ambiguous terms:** [Terms that mean different things in different contexts]

## Stakeholders
- **Primary actors:** [Who is directly involved?]
- **Affected groups:** [Who bears consequences?]
- **Institutional players:** [Organizations, industries, governments]
- **Opposing interests:** [Who benefits from different outcomes?]

## Temporal Scope
- **Historical origins:** [When did this begin?]
- **Key transitions:** [What changed and when?]
- **Current state:** [What's happening now?]
- **Future trajectory:** [Where is this headed?]

## Domains
- **Primary field:** [Main academic/professional discipline]
- **Adjacent fields:** [Related disciplines]
- **Methodological traditions:** [How is this typically studied?]

## Controversies
- **Active debates:** [What's contested?]
- **Competing frameworks:** [Different ways of understanding this]
- **Hidden assumptions:** [What gets taken for granted?]
- **Ethical dimensions:** [What values are at stake?]

## Research Scope
- **Depth level:** [Overview / Working knowledge / Expert-level]
- **Time budget:** [Hours available]
- **Output format:** [Summary / Report / Decision brief / Literature review]
- **Decision context:** [What action depends on this research?]
```

## Completion Criteria

Research is complete when you can answer "yes" to these questions:

### Minimum Viable Research (Quick Decisions)
- [ ] Can I define the core concepts in my own words?
- [ ] Do I know the 2-3 major perspectives on this topic?
- [ ] Have I found at least one authoritative source per perspective?
- [ ] Can I identify what I don't know (known unknowns)?

### Working Knowledge (Most Decisions)
- [ ] Can I explain the historical context?
- [ ] Do I understand the major stakeholder positions?
- [ ] Have I encountered the main counterarguments?
- [ ] Can I identify the methodological approaches used?
- [ ] Do I know where the experts disagree?
- [ ] Have I checked sources from multiple domains?

### Deep Expertise (High-Stakes Decisions)
- [ ] Have I traced key claims back to primary sources?
- [ ] Can I evaluate the quality of competing evidence?
- [ ] Do I understand the limitations of current knowledge?
- [ ] Have I identified emerging research or changing consensus?
- [ ] Can I anticipate which conclusions might change?

### Diminishing Returns Signals
Stop when you encounter:
- **Circular references:** New sources cite the same foundational works
- **Repetitive findings:** New searches return familiar content
- **Marginal additions:** Each hour adds less than the previous
- **Time pressure:** Deadline requires synthesis, not more input
- **Sufficient for purpose:** You can make the decision or take the action

## Anti-Patterns

### 1. The Confirmation Trap
**Pattern:** Searching for evidence that supports an existing belief.
**Symptoms:**
- Query terms loaded toward one conclusion
- Dismissing contrary sources as "biased"
- Satisfaction when finding supporting evidence

**Fix:** Explicitly search for the strongest counterargument. Ask: "What would convince me I'm wrong?" Search for that.

### 2. The Authority Fallacy
**Pattern:** Accepting claims because of source prestige rather than evidence quality.
**Symptoms:**
- "Harvard study says..." without examining methodology
- Treating all peer-reviewed sources as equally valid
- Ignoring practitioner knowledge because it's not academic

**Fix:** Evaluate claims on their evidence, not their source. Ask: "What would this look like if it were wrong?"

### 3. The Recency Trap
**Pattern:** Over-weighting recent sources, ignoring foundational work.
**Symptoms:**
- Searching only 2020-present
- Assuming newer means better
- Missing historical context that explains current state

**Fix:** Explicitly search historical periods. Find the seminal works. Understand how the field evolved.

### 4. The Breadth Trap
**Pattern:** Gathering ever more sources without deepening understanding.
**Symptoms:**
- 50 tabs open, none read thoroughly
- Bookmark hoarding
- Unable to synthesize because there's "always more to read"

**Fix:** Apply the "3-source rule" per perspective. Read deeply before searching more. Summarize before continuing.

### 5. The Single-Source Trap
**Pattern:** Over-relying on one comprehensive source instead of triangulating.
**Symptoms:**
- Wikipedia as final answer
- One textbook as complete truth
- One expert's opinion as settled fact

**Fix:** Require minimum 3 independent sources for any important claim. Note where sources agree and disagree.

### 6. The Jargon Blind Spot
**Pattern:** Missing relevant sources because different fields use different terminology.
**Symptoms:**
- Psychology calls it "confirmation bias," economics calls it "motivated reasoning"
- Only searching in familiar domain language
- Assuming no relevant research exists

**Fix:** Map terminology variants in Phase 0. Search multiple domains. Ask: "What would [other field] call this?"

### 7. The Practitioner-Academic Gap
**Pattern:** Ignoring insights from practitioners or dismissing academic research as "ivory tower."
**Symptoms:**
- Only reading academic journals (or only reading blog posts)
- Assuming practice matches theory (or that theory is useless)
- Missing the "dark matter" knowledge that practitioners take for granted

**Fix:** Deliberately include both academic and practitioner sources. Note where they diverge. Ask: "What do people who do this every day know that researchers don't?"

### 8. The Infinite Rabbit Hole
**Pattern:** Following interesting tangents until original purpose is lost.
**Symptoms:**
- Started researching X, now deep in Y
- Can't remember why you started
- Research expands to fill available time

**Fix:** Write down the decision or action this research serves. Return to that anchor. Ask: "Does this source help me with my original question?"

### 9. The Outsider Vocabulary Trap
**Pattern:** Using introductory/outsider terminology, which surfaces only introductory material.
**Symptoms:**
- Finding only "101" level explanations
- Expert-level material seems to not exist
- Everything feels oversimplified
- LLM responses lack nuance or depth

**Fix:** Build vocabulary map. In early sources, hunt for expert terminology ("also known as," "technically called," "in the literature"). Use expert terms in subsequent searches. With LLMs, use precise vocabulary to activate richer semantic space.

### 10. The Fresh Start Fallacy
**Pattern:** Starting each research session from zero instead of building on prior work.
**Symptoms:**
- Re-discovering the same vocabulary each time
- Re-finding the same foundational sources
- Repeating searches that already failed
- No accumulation of understanding over time

**Fix:** Before researching a topic, check for prior work. Store vocabulary maps, sources, digested notes, and gaps. Start from where you left off, not from zero. See Research Persistence section.

## Success Indicators

### Leading Indicators (During Research)
- Generating queries for multiple perspectives (not just confirming)
- Encountering and recording counterarguments
- Noting gaps in your understanding
- Adjusting search strategy based on findings

### Lagging Indicators (After Research)
- Can explain topic to someone unfamiliar
- Can identify what remains uncertain
- Made a decision or took action (research led to output)
- Didn't encounter major surprises in application

### Health Check Questions
Ask periodically during research:
1. Am I searching to learn or to confirm?
2. What's the strongest argument against my current view?
3. Have I looked outside my familiar domains?
4. Can I summarize what I've learned so far?
5. Is this research still serving my original purpose?

## Research Persistence

Research shouldn't evaporate when a session ends. Store both raw materials and processed outputs for future use.

### What to Store

| Layer | Contents | Purpose |
|-------|----------|---------|
| **Vocabulary Map** | Terms, domains, depth levels, synonyms | Enables future searches without rebuilding |
| **Source Archive** | PDFs, saved pages, bookmarks with annotations | Raw material for future reference |
| **Digested Notes** | Summaries, key quotes, your synthesis | Processed understanding for quick retrieval |
| **Query Log** | Searches that worked, terms that failed | Avoid repeating failed approaches |
| **Uncertainty Map** | What you didn't find, what remains unknown | Know where gaps exist for future work |

### Storage Structure

```
research/
├── [topic]/
│   ├── vocabulary-map.md      # Terms, domains, depth levels
│   ├── sources/               # PDFs, saved pages
│   ├── notes.md               # Digested understanding
│   ├── queries.md             # What searches worked
│   └── gaps.md                # What remains unknown
```

### The Dual Storage Principle

**Store both source material AND digested results.**

- **Source material alone**: Can't quickly recall what you learned; must re-read everything
- **Digested results alone**: Lose ability to verify, quote, or go deeper
- **Both**: Quick retrieval of understanding + ability to verify and expand

### Why This Matters for LLM-Assisted Research

When you return to a topic with stored vocabulary and notes:
1. Your prompts use expert terminology → activate richer semantic space
2. You can provide context → more precise responses
3. You can verify LLM claims against your sources
4. You avoid the "starting from scratch" failure mode

### Anti-Pattern: The Fresh Start Fallacy

**Pattern:** Starting each research session with no memory of previous work.
**Symptoms:**
- Re-discovering the same vocabulary
- Re-finding the same sources
- Repeating searches that already failed
- No accumulation of understanding over time

**Fix:** Before researching a topic, check if you have prior work. Load your vocabulary map. Start from where you left off, not from zero.

### Integration with Context Networks

Research persistence maps directly to context network patterns:
- **Vocabulary map** → glossary.md for the topic
- **Sources** → references node
- **Digested notes** → understanding nodes
- **Gaps** → questions.md or open-issues.md

The research folder can BE a mini context network for that topic.