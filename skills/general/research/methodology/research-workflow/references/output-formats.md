# Output Formats

Detailed specifications for research output formats.

## Choosing the Right Format

| Format | Best For | Length | Time |
|--------|----------|--------|------|
| Executive Summary | Quick decisions | 1-2 paragraphs | 5 min |
| Key Findings | Status updates | 5-10 bullet points | 10 min |
| Full Report | Documentation | 1-5 pages | 30+ min |
| Comparison Table | Option evaluation | 1 page | 15 min |
| Action Plan | Implementation | 1-2 pages | 20 min |

## Executive Summary Format

**When to use**: Stakeholders need quick overview for decisions

**Structure**:
```markdown
## Executive Summary: [Topic]

**Key Finding**: [One sentence main conclusion]

**Supporting Points**:
- [Point 1]
- [Point 2]
- [Point 3]

**Recommendation**: [What to do next]

**Confidence**: [High/Medium/Low]
```

**Example**:
```markdown
## Executive Summary: API Rate Limiting Approaches

**Key Finding**: Token bucket algorithm is the industry standard
for its balance of simplicity and fairness.

**Supporting Points**:
- Used by major providers (Stripe, GitHub, AWS)
- Handles burst traffic gracefully
- Easy to implement and explain to users

**Recommendation**: Implement token bucket with per-user quotas

**Confidence**: High (strong consensus across sources)
```

## Key Findings Format

**When to use**: Quick communication of research results

**Structure**:
```markdown
## Key Findings: [Topic]

### Summary
[2-3 sentence overview]

### Findings

1. **[Finding Title]**
   [Brief explanation]
   *Source: [Attribution]*

2. **[Finding Title]**
   [Brief explanation]
   *Source: [Attribution]*

### Gaps/Uncertainties
- [What couldn't be determined]
```

## Full Report Format

**When to use**: Comprehensive documentation needed

**Structure**:
```markdown
# Research Report: [Topic]

## Executive Summary
[Condensed version for quick reading]

## Research Question
[What you set out to discover]

## Methodology
- Queries executed: [count]
- Sources reviewed: [count]
- Time period: [dates]
- Search tools used: [tools]

## Findings

### [Theme 1]
[Detailed findings with evidence]

**Source Analysis**:
| Source | Type | Credibility | Key Contribution |
|--------|------|-------------|------------------|
| [Name] | [Type] | [Level] | [What it added] |

### [Theme 2]
[Repeat structure]

## Analysis

### Consensus Points
[Where sources agree]

### Conflicts
[Where sources disagree]

### Patterns
[Trends or relationships observed]

## Limitations
[What this research couldn't cover]

## Recommendations
1. [Recommendation with rationale]
2. [Recommendation with rationale]

## Further Research
[Questions that remain unanswered]

## Sources
[Complete list of sources consulted]
```

## Comparison Table Format

**When to use**: Evaluating multiple options

**Structure**:
```markdown
## Comparison: [Options Being Compared]

### Quick Summary
[1 paragraph overview of conclusion]

### Comparison Matrix

| Criteria | [Option A] | [Option B] | [Option C] |
|----------|------------|------------|------------|
| [Criterion 1] | [Rating/Value] | [Rating/Value] | [Rating/Value] |
| [Criterion 2] | [Rating/Value] | [Rating/Value] | [Rating/Value] |
| [Criterion 3] | [Rating/Value] | [Rating/Value] | [Rating/Value] |

### Detailed Analysis

#### [Option A]
**Pros**: [List]
**Cons**: [List]
**Best for**: [Use case]

#### [Option B]
[Repeat structure]

### Recommendation
[Which option and why, with caveats]
```

## Action Plan Format

**When to use**: Research needs to lead to implementation

**Structure**:
```markdown
## Action Plan: [Topic/Goal]

### Background
[Brief context from research]

### Objective
[What this plan aims to achieve]

### Recommended Actions

#### Phase 1: [Name] (Immediate)
- [ ] Action item 1
- [ ] Action item 2
- [ ] Action item 3

**Dependencies**: [What's needed]
**Risks**: [What could go wrong]

#### Phase 2: [Name] (Short-term)
[Repeat structure]

### Success Metrics
- [How to measure success]

### Resources Required
- [What's needed to execute]

### Decision Points
- [When to reassess]
```

## Markdown Formatting Tips

### Headers
Use consistent hierarchy:
- `#` for report title (once)
- `##` for major sections
- `###` for subsections
- `####` sparingly for details

### Emphasis
- **Bold** for key terms and findings
- *Italic* for sources and asides
- `Code` for technical terms

### Lists
- Use bullet points for unordered items
- Use numbered lists for sequences/priorities
- Use task lists `- [ ]` for action items

### Tables
- Keep columns under 50 characters
- Align numbers right when possible
- Use for comparisons and structured data

### Quotes
Use blockquotes for:
- Direct quotes from sources
- Key statistics
- Important callouts

```markdown
> "85% of developers prefer URL-based API versioning"
> — Developer Survey 2024
```

## Quality Checklist for Outputs

Before delivering any output:

- [ ] Format matches the purpose
- [ ] Structure is consistent throughout
- [ ] Key findings are prominent
- [ ] Evidence is cited
- [ ] Confidence levels are indicated
- [ ] Limitations are acknowledged
- [ ] Next steps are clear
- [ ] Formatting is clean and readable
