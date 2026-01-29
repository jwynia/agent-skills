---
name: research-workflow
description: "Guide agents through structured research including planning, multi-query execution, source analysis, and synthesis. Use for comprehensive topic research, deep investigation, or creating research reports. Keywords: research, investigate, deep dive, comprehensive, analysis, synthesis, report."
license: MIT
compatibility: Designed for Claude Code and similar products. Web search capability required.
metadata:
  author: agent-skills
  version: "1.0"
---

# Research Workflow

A structured methodology for conducting comprehensive research. This skill guides you through planning, executing, analyzing, and synthesizing research on any topic.

## When to Use This Skill

Use this skill when:
- The user needs comprehensive research on a topic
- Multiple search queries are needed to fully answer a question
- Source credibility and synthesis matter
- A research report or documented findings are expected
- Keywords mentioned: research, investigate, deep dive, comprehensive analysis

Do NOT use this skill when:
- A single quick search will suffice (use web-search instead)
- The user just wants a simple fact lookup
- No synthesis or analysis is needed
- Time is extremely limited

## Prerequisites

Before using this skill, ensure:
- **Web search capability** is available (web-search skill, WebSearch tool, or similar)
- Sufficient time for multi-phase research process
- Clear understanding of the research question or topic

## Research Phases Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    RESEARCH WORKFLOW                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PLANNING          2. EXECUTION                          │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │ Define       │    │ Run searches │                       │
│  │ questions    │───>│ Evaluate     │                       │
│  │ Plan queries │    │ sources      │                       │
│  └──────────────┘    └──────────────┘                       │
│         │                   │                               │
│         v                   v                               │
│  3. ANALYSIS          4. SYNTHESIS                          │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │ Organize     │    │ Create       │                       │
│  │ findings     │───>│ coherent     │                       │
│  │ Find patterns│    │ output       │                       │
│  └──────────────┘    └──────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Phase 1: Planning

Before any searches, establish a clear research plan.

### Step 1: Define the Research Question

Convert the topic into specific, answerable questions.

**Example**:
- Topic: "AI in healthcare"
- Questions:
  1. What are the current applications of AI in healthcare?
  2. What are the main benefits and challenges?
  3. What regulations govern AI in healthcare?
  4. What are the latest developments (last 6 months)?

### Step 2: Identify Sub-Topics

Break down the main topic into searchable components:
- Core concepts and definitions
- Current state and applications
- Benefits and advantages
- Challenges and limitations
- Recent developments
- Future trends

### Step 3: Plan Search Strategy

Create a search plan with query progression:

1. **Broad queries first**: Get overall landscape
   - "[topic] overview"
   - "[topic] introduction guide"

2. **Specific queries next**: Dive into details
   - "[topic] specific aspect"
   - "[topic] case study"

3. **Verification queries last**: Confirm findings
   - "[topic] criticism challenges"
   - "[topic] latest news [year]"

Use the template at [assets/research-plan-template.md](assets/research-plan-template.md) to document your plan.

## Phase 2: Execution

Execute your search plan systematically.

### Step 1: Run Searches

Execute queries in order, using appropriate search parameters:

```bash
# Broad overview
web-search "AI in healthcare overview 2024"

# Specific deep dive
web-search "AI diagnostic imaging applications" --depth advanced

# Current news
web-search "AI healthcare regulations 2024" --topic news --time month
```

### Step 2: Document Each Search

For each search, record:
- Query used
- Number of results reviewed
- Key findings (2-3 bullet points)
- Notable sources
- New questions raised

### Step 3: Evaluate Sources

Use the checklist at [assets/source-evaluation-checklist.md](assets/source-evaluation-checklist.md) to assess:

**Credibility Indicators**:
- Author/organization expertise
- Publication reputation
- Date of publication
- Citations and references

**Quality Signals**:
- Evidence-based claims
- Multiple perspectives
- Clear methodology

### Step 4: Iterate as Needed

Research is not linear. Based on findings:
- Add new queries for gaps discovered
- Verify surprising claims
- Explore unexpected connections

## Phase 3: Analysis

Organize and analyze your collected findings.

### Step 1: Group Findings by Theme

Organize results into categories:
- Core concepts
- Current state
- Benefits/opportunities
- Challenges/risks
- Recent developments
- Expert opinions

### Step 2: Identify Patterns

Look for:
- **Consensus**: Where do multiple sources agree?
- **Conflicts**: Where do sources disagree?
- **Gaps**: What questions remain unanswered?
- **Trends**: What direction is the field moving?

### Step 3: Assess Confidence

For each finding, determine confidence level:
- **High**: Multiple authoritative sources agree
- **Medium**: Some evidence, limited sources
- **Low**: Single source or conflicting information

### Step 4: Note Limitations

Document:
- What couldn't be found
- Areas needing more research
- Potential biases in sources

## Phase 4: Synthesis

Create coherent, useful output from your analysis.

### Step 1: Structure the Output

Choose appropriate format based on use case:
- **Executive summary**: Quick overview for decisions
- **Full report**: Comprehensive documentation
- **Action items**: Practical next steps

Use the template at [assets/research-report-template.md](assets/research-report-template.md).

### Step 2: Write the Synthesis

Key principles:
- Lead with most important findings
- Connect related concepts
- Note confidence levels
- Acknowledge limitations
- Cite sources

### Step 3: Include Actionable Elements

End with practical outputs:
- Key takeaways (3-5 points)
- Recommendations
- Further research suggestions
- Decision points

## Complete Example

### Scenario: Research "Best practices for API versioning"

**Phase 1 - Planning**:
```
Research Question: What are the best practices for API versioning?

Sub-questions:
1. What versioning strategies exist?
2. What are pros/cons of each?
3. What do major companies use?
4. What do experts recommend?

Search Plan:
- "API versioning strategies comparison"
- "REST API versioning best practices 2024"
- "API versioning header vs URL vs query parameter"
- "large companies API versioning approach"
```

**Phase 2 - Execution**:
```
Query 1: "API versioning strategies comparison"
- Found: URL versioning, header versioning, query parameter
- Key insight: URL versioning most common, header more "RESTful"
- Sources: REST API tutorial, Martin Fowler blog

Query 2: "REST API versioning best practices 2024"
- Found: Semantic versioning principles apply
- Key insight: Version only when breaking changes
- Sources: API design guides, Stack Overflow discussions
```

**Phase 3 - Analysis**:
```
Consensus Points:
- Version only for breaking changes
- Be consistent within an API
- Document version lifecycle

Conflicts:
- URL vs header placement (no clear winner)
- When to deprecate old versions

Gaps:
- Limited data on performance impact
- Few studies on developer experience
```

**Phase 4 - Synthesis**:
```
Key Findings:
1. Three main strategies exist (URL, header, query param)
2. URL versioning is most common and discoverable
3. Header versioning is considered more "pure" REST
4. Version only on breaking changes
5. Major companies split between approaches

Recommendations:
- Use URL versioning for public APIs (discoverability)
- Consider header versioning for internal APIs
- Document deprecation timeline clearly
- Use semantic versioning principles
```

## Quality Checklist

Before completing research, verify:

- [ ] Clear research questions were defined
- [ ] Multiple queries were executed (minimum 3-5)
- [ ] Sources were evaluated for credibility
- [ ] Findings are organized by theme
- [ ] Consensus and conflicts are noted
- [ ] Confidence levels are indicated
- [ ] Limitations are acknowledged
- [ ] Output is actionable

## Reference Materials

For detailed guidance, see:
- [Research Methodology](references/methodology.md) - In-depth methodology background
- [Output Formats](references/output-formats.md) - Detailed format specifications

## Templates

- [Research Plan Template](assets/research-plan-template.md)
- [Research Report Template](assets/research-report-template.md)
- [Source Evaluation Checklist](assets/source-evaluation-checklist.md)

## Limitations

This workflow has the following limitations:
- Quality depends on available web search capability
- Cannot access paywalled or restricted content
- Time-intensive for comprehensive research
- Synthesis quality depends on agent capabilities
- May miss very recent developments not yet indexed

## Related Skills

- **web-search**: For executing individual web searches (used within this workflow)
