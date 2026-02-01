---
name: fact-check
description: Verify claims in generated output against sources. Use as a separate pass AFTER content generation to catch hallucinations. Critical constraint - cannot be reliably combined with generation in a single pass.
license: MIT
metadata:
  author: jwynia
  version: "1.0"
  domain: research
  cluster: methodology
  type: diagnostic
  mode: evaluative
---

# Fact-Check Skill

Systematic verification of claims in generated content. Designed to catch hallucinations, confabulations, and unsupported assertions.

## Why Separate Passes Matter

**The Fundamental Problem:** LLMs generate plausible-sounding content by predicting what should come next. This same mechanism produces hallucinations—confident statements that feel true but aren't. An LLM in generation mode cannot reliably catch its own hallucinations because:

1. **Attention is on generation**, not verification
2. **Coherence pressure** makes false claims feel correct in context
3. **Same weights** that produced the error will confirm it
4. **No external grounding** to contradict the confabulation

**The Solution:** Verification must be a separate cognitive pass with:
- Fresh attention focused solely on each claim
- Explicit source checking (not memory/training data)
- Adversarial stance toward the content
- External grounding where possible

## Diagnostic States

### F1: No Verification Pass
**Symptoms:** Content generated and delivered without any fact-checking.
**Risk:** Hallucinations pass through undetected.
**Intervention:** Run verification pass before delivery. Extract claims, check each against sources.

### F2: Self-Verification (Invalid)
**Symptoms:** Same pass asked to "check your facts" while generating.
**Risk:** False confidence—errors confirmed by same process that created them.
**Intervention:** Complete generation first, then run separate verification pass with explicit source requirements.

### F3: Memory-Based Verification (Unreliable)
**Symptoms:** Claims checked against "what I know" without external sources.
**Risk:** Hallucinations verified by hallucinated knowledge.
**Intervention:** Require explicit source citation for each verified claim. If no source available, mark as unverified.

### F4: Selective Verification
**Symptoms:** Only some claims checked; others assumed correct.
**Risk:** Unchecked claims may contain errors.
**Intervention:** Systematic extraction of ALL verifiable claims. Check each, or explicitly mark unchecked items.

### F5: Verification Complete
**Symptoms:** All claims extracted, each checked against sources, confidence levels assigned.
**Indicators:** Source citations present, unverified claims marked, confidence explicit.

## The Verification Process

### Phase 1: Claim Extraction

Extract every verifiable statement from the content.

**Claim types to extract:**
- Factual assertions ("X is Y", "X causes Y")
- Statistics and numbers ("40% of...", "in 2023...")
- Attributions ("According to X...", "Research shows...")
- Definitions ("X means...", "X is defined as...")
- Historical claims ("X happened in...", "X was founded by...")
- Causal claims ("X leads to Y", "X prevents Y")
- Comparative claims ("X is better than Y", "X is the largest...")

**What to skip:**
- Opinions clearly marked as such
- Hypotheticals and speculation (if labeled)
- Logical deductions from stated premises
- Direct quotes (verify attribution, not content)

### Phase 2: Claim Categorization

Categorize each claim by verifiability:

| Category | Description | Verification Strategy |
|----------|-------------|----------------------|
| **Verifiable-Hard** | Numbers, dates, names, quotes | Must match source exactly |
| **Verifiable-Soft** | General facts, processes, mechanisms | Source should substantially support |
| **Attribution** | "X said...", "According to..." | Verify source exists and said something similar |
| **Inference** | Conclusions drawn from evidence | Verify premises, assess reasoning |
| **Opinion-as-Fact** | Subjective claim stated as objective | Flag for rewording or qualification |

### Phase 3: Source Verification

For each claim, attempt verification:

```markdown
## Claim Verification Log

### Claim 1: "[exact claim text]"
- **Category:** [Verifiable-Hard/Soft/Attribution/Inference]
- **Source checked:** [specific source]
- **Finding:** [Confirmed/Partially supported/Not found/Contradicted]
- **Confidence:** [High/Medium/Low]
- **Notes:** [discrepancies, qualifications needed]

### Claim 2: ...
```

**Verification outcomes:**

| Outcome | Meaning | Action |
|---------|---------|--------|
| **Confirmed** | Source explicitly supports claim | Keep, cite source |
| **Partially supported** | Source supports part, not all | Qualify or narrow claim |
| **Not found** | No source located | Mark unverified, consider removing |
| **Contradicted** | Source says opposite | Remove or correct |
| **Outdated** | Source is dated; current state may differ | Update or add recency caveat |

### Phase 4: Confidence Assignment

Assign overall confidence to the content:

| Level | Criteria |
|-------|----------|
| **High** | All key claims verified; no contradictions found |
| **Medium** | Most claims verified; some unverified but plausible |
| **Low** | Significant claims unverified; some corrections needed |
| **Unreliable** | Multiple contradictions found; major revision needed |

## Hallucination Patterns

Common hallucination types to watch for:

### 1. Plausible Fabrication
**Pattern:** Specific details that sound right but don't exist.
**Examples:** Fake paper citations, non-existent statistics, invented quotes.
**Detection:** Verify specific claims against primary sources.

### 2. Confident Extrapolation
**Pattern:** Reasonable inference stated as established fact.
**Examples:** "Studies show..." (no specific study), "Experts agree..." (no citation).
**Detection:** Require specific source for any claim of external support.

### 3. Temporal Confusion
**Pattern:** Mixing information from different time periods.
**Examples:** Old statistics presented as current, defunct organizations described as active.
**Detection:** Check dates on sources, verify current status.

### 4. Attribution Drift
**Pattern:** Correct information attributed to wrong source.
**Examples:** Quote assigned to wrong person, finding attributed to wrong study.
**Detection:** Verify attribution specifically, not just content.

### 5. Amalgamation
**Pattern:** Combining details from multiple sources into one fictional source.
**Examples:** Invented study that combines real findings from separate papers.
**Detection:** Verify the specific source exists and contains all attributed claims.

### 6. Precision Inflation
**Pattern:** Adding false precision to vague knowledge.
**Examples:** "Approximately 47.3%" when only "about half" is supported.
**Detection:** Check if source actually provides that level of precision.

## Verification Checklist

Before releasing fact-checked content:

- [ ] **Claims extracted?** All verifiable statements identified
- [ ] **Sources checked?** Each claim verified against external source
- [ ] **Specific, not memory?** Verification used actual sources, not LLM training data
- [ ] **Contradictions flagged?** Conflicts between claims and sources noted
- [ ] **Unverified marked?** Claims without sources explicitly identified
- [ ] **Confidence stated?** Overall reliability level communicated
- [ ] **Separate pass?** Verification done after generation, not during

## Integration with Research Skill

| Research Phase | Fact-Check Role |
|----------------|-----------------|
| **During research** | Verify claims in sources themselves |
| **After synthesis** | Verify that synthesis accurately represents sources |
| **Before delivery** | Final pass to catch hallucinations in output |

**Handoff pattern:**
1. Research skill gathers and synthesizes information
2. Content is generated based on research
3. Fact-check skill runs as separate pass
4. Corrections made, confidence assigned
5. Output delivered with verification status

## Operational Constraints

### What This Skill Cannot Do

1. **Verify during generation** — Must be separate pass
2. **Catch all hallucinations** — Some may slip through
3. **Verify without sources** — No sources = unverified, not "verified by knowledge"
4. **Replace domain expertise** — Can check sources exist, not evaluate quality

### When Verification Is Most Critical

| Context | Verification Level |
|---------|-------------------|
| Published content | Full verification required |
| Decision support | Key claims must be verified |
| Educational content | High accuracy expected |
| Casual conversation | Light verification acceptable |
| Creative fiction | N/A (different standards) |

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| "I'm confident" | Confidence ≠ accuracy | Require source citation |
| "To the best of my knowledge" | Memory is unreliable | Check external source |
| "Generally speaking" | Vagueness hides uncertainty | Be specific or mark unverified |
| "Research shows" | Which research? | Cite specific source |
| Verify-while-generating | Same pass can't catch own errors | Separate passes mandatory |
| Check one, assume rest | Partial verification | Check all or mark unchecked |

## Output Format

When delivering fact-checked content:

```markdown
## [Content Title]

[Content body with claims]

---

### Verification Status

**Overall Confidence:** [High/Medium/Low]

**Verified Claims:**
- [Claim 1] — Source: [citation]
- [Claim 2] — Source: [citation]

**Unverified Claims:**
- [Claim 3] — No source found; treat as uncertain

**Corrections Made:**
- [Original claim] → [Corrected claim] (Source: [citation])

**Caveats:**
- [Any limitations or qualifications]
```

## Output Persistence

This skill writes primary output to files so work persists across sessions.

### Output Discovery

**Before doing any other work:**

1. Check for `context/output-config.md` in the project
2. If found, look for this skill's entry
3. If not found or no entry for this skill, **ask the user first**:
   - "Where should I save output from this fact-check session?"
   - Suggest: `explorations/fact-check/` or a sensible location for this project
4. Store the user's preference:
   - In `context/output-config.md` if context network exists
   - In `.fact-check-output.md` at project root otherwise

### Primary Output

For this skill, persist:
- **Claims extracted** - all verifiable statements identified
- **Verification results** - each claim with source and status
- **Confidence assessment** - overall content reliability
- **Corrections made** - any changes from original

### Conversation vs. File

| Goes to File | Stays in Conversation |
|--------------|----------------------|
| Verification status report | Discussion of sources |
| Claim-by-claim results | Clarifying questions |
| Confidence assessment | Verification process |
| Corrections and caveats | Real-time feedback |

### File Naming

Pattern: `{content-name}-factcheck-{date}.md`
Example: `research-synthesis-factcheck-2025-01-15.md`

## Source Framework

This skill extends the research cluster with post-generation verification. Distinct from research (which gathers information) and operates as quality control on output.

Related: `skills/research/SKILL.md` (pre-generation), `references/doppelganger/` (truth hierarchies)
