# Research Integration Context Network Agent Prompt

## Task Context

You are conducting research using the Research MCP server on the topic: $ARGUMENTS

Your goal is to perform comprehensive research and integrate all findings, analysis, and insights into the context network following proper organizational principles.

## Critical Domain Boundary

**REMEMBER**: All research outputs, analysis documents, and synthesis reports MUST be placed in the context network, NOT in the project root. Only implementation artifacts belong outside the context network.

## Research Execution Process

### Phase 1: Research Planning & Context Discovery

1. **Parse Research Scope**
   ```
   Topic: $ARGUMENTS
   ```
   - Identify key concepts and domains to explore
   - Determine research depth needed (exploratory vs. deep dive)
   - List specific questions to answer

2. **Context Network Reconnaissance**
   - Search existing context network for related research
   - **Check discovery records for related insights** (`/discoveries/records/`)
   - **Review learning paths for context evolution** (`/learning-paths/`)
   - Identify relevant domain nodes
   - Map existing knowledge to avoid duplication
   - Note gaps the research should fill

3. **Research Strategy**
   - Define search queries for Research MCP
   - Plan research phases (broad → specific)
   - Set criteria for source evaluation
   - Establish synthesis approach
   - Create a research report file named with the freshly verified current date and topic in the context network.

### Phase 2: Research Execution

1. **Initial Broad Research**
   ```
   mcp.research("$ARGUMENTS overview current state")
   mcp.research("$ARGUMENTS key concepts definitions")
   mcp.research("$ARGUMENTS major approaches methods")
   ```

2. **Domain-Specific Deep Dives**
   Based on initial findings, explore specific aspects:
   - Technical implementations
   - Theoretical foundations
   - Practical applications
   - Case studies/examples
   - Limitations/challenges

3. **Cross-Domain Connections**
   - Search for applications in adjacent fields
   - Identify analogous concepts in other domains
   - Look for contradicting viewpoints
   - Find integration opportunities

4. **Research Documentation**
   For each research session, capture:
   - Query used
   - Key findings
   - Source quality assessment
   - Relevance to research questions
   - New questions raised
   - **Create discovery records for significant insights** (`/discoveries/records/`)
   - **Update learning paths if understanding evolves** (`/learning-paths/`)

### Phase 3: Research Analysis & Synthesis

Create structured analysis documents in the context network:

#### Research Overview Node
```markdown
# Research: $ARGUMENTS

## Purpose
[Why this research was conducted and what questions it aims to answer]

## Classification
- **Domain:** [Primary domain(s)]
- **Stability:** [Dynamic - research represents current understanding]
- **Abstraction:** [Structural - synthesized findings]
- **Confidence:** [Evolving/Established based on source consensus]

## Research Scope
- **Core Topic:** $ARGUMENTS
- **Research Depth:** [Exploratory/Comprehensive/Deep-dive]
- **Time Period Covered:** [If relevant]
- **Geographic Scope:** [If relevant]

## Key Questions Addressed
1. [Question 1]
   - Finding: [Summary]
   - Confidence: [High/Medium/Low]
2. [Question 2]
   - Finding: [Summary]
   - Confidence: [High/Medium/Low]

## Executive Summary
[2-3 paragraph synthesis of the most important findings]

## Methodology
- Research tool: Research MCP Server
- Number of queries: [Count]
- Sources evaluated: [Count]
- Time period: [When research conducted]

## Navigation
- **Detailed Findings:** [[Research/$ARGUMENTS/findings]]
- **Source Analysis:** [[Research/$ARGUMENTS/sources]]
- **Implementation Guide:** [[Research/$ARGUMENTS/implementation]]
- **Open Questions:** [[Research/$ARGUMENTS/gaps]]
```

#### Detailed Findings Node
```markdown
# Research Findings: $ARGUMENTS

## Classification
- **Domain:** [Same as overview]
- **Stability:** Dynamic
- **Abstraction:** Detailed
- **Confidence:** [Varies by finding]

## Structured Findings

### Core Concepts
[For each major concept discovered]
#### [Concept Name]
- **Definition:** [Clear explanation]
- **Key Characteristics:** 
  - [Characteristic 1]
  - [Characteristic 2]
- **Variations/Schools of Thought:** [If applicable]
- **Source Consensus:** [Strong/Moderate/Disputed]

### Current State Analysis
- **Mature Aspects:** [What's well-established]
- **Emerging Trends:** [What's developing]
- **Contested Areas:** [Where experts disagree]

### Methodologies & Approaches
[For each major approach found]
#### [Approach Name]
- **Description:** [How it works]
- **Use Cases:** [When to apply]
- **Strengths:** [Key benefits]
- **Limitations:** [Known constraints]
- **Adoption Level:** [Widespread/Growing/Niche]

### Practical Applications
- **Industry Usage:** [How it's being used]
- **Success Stories:** [Notable examples]
- **Failure Patterns:** [Common pitfalls]
- **Best Practices:** [Emerging standards]

## Cross-Domain Insights
- **Similar Concepts In:** [Other domains with related ideas]
- **Contradicts:** [Conflicting approaches/theories]
- **Complements:** [Synergistic concepts]
- **Enables:** [What this makes possible]
```

#### Source Analysis Node
```markdown
# Source Analysis: $ARGUMENTS Research

## Classification
- **Domain:** Meta/Research
- **Stability:** Static
- **Abstraction:** Detailed
- **Confidence:** Established

## Source Quality Matrix

### Primary Sources
[High-quality, authoritative sources]
| Source | Type | Credibility | Key Contributions | Limitations |
|--------|------|-------------|-------------------|-------------|
| [Name] | [Academic/Industry/Official] | [High/Medium] | [What it provided] | [Any biases/gaps] |

### Secondary Sources
[Synthesis, analysis, commentary]
| Source | Type | Credibility | Perspective | Value |
|--------|------|-------------|-------------|--------|
| [Name] | [Blog/News/Report] | [Assessment] | [Viewpoint] | [What it added] |

### Source Consensus Analysis
- **Strong Agreement On:** [Topics with consensus]
- **Divergent Views On:** [Topics with disagreement]
- **Gaps in Literature:** [What wasn't found]

## Research Quality Metrics
- **Source Diversity:** [Single perspective vs. multiple]
- **Recency:** [How current is the information]
- **Depth:** [Surface-level vs. comprehensive]
- **Bias Assessment:** [Potential biases identified]
```

#### Implementation Guide Node
```markdown
# Implementation Guide: $ARGUMENTS

## Classification
- **Domain:** [Practical/Applied]
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** [Based on evidence found]

## Quick Start Paths

### For Beginners
1. Start with: [Entry point]
2. Key concepts to understand: [List]
3. First practical step: [Action]
4. Common mistakes to avoid: [List]

### For Practitioners
1. Assessment checklist: [Current state evaluation]
2. Improvement opportunities: [Based on research]
3. Advanced techniques: [From research findings]
4. Measurement approaches: [How to track progress]

## Implementation Patterns

### Pattern: [Name]
- **Context:** [When to use]
- **Solution:** [How to implement]
- **Consequences:** [What to expect]
- **Examples:** [From research]

## Decision Framework
[Based on research findings]
```
IF [Condition] THEN [Approach A]
ELSE IF [Condition] THEN [Approach B]
ELSE [Default approach]
```

## Resource Requirements
- **Knowledge Prerequisites:** [What you need to know]
- **Technical Requirements:** [Tools/systems needed]
- **Time Investment:** [Realistic estimates]
- **Skill Development:** [Learning path]
```

#### Research Gaps Node
```markdown
# Open Questions: $ARGUMENTS

## Classification
- **Domain:** Research/Meta
- **Stability:** Dynamic
- **Abstraction:** Conceptual
- **Confidence:** Speculative

## Identified Knowledge Gaps

### Unanswered Questions
1. **[Question]**
   - Why it matters: [Significance]
   - What we found: [Partial information]
   - What's missing: [Specific gap]
   - Suggested research: [Next steps]

### Conflicting Information
1. **[Topic with conflicts]**
   - Viewpoint A: [Description] - Source: [Who]
   - Viewpoint B: [Description] - Source: [Who]
   - Unable to resolve because: [Reason]
   - Impact on implementation: [Consequences]

### Emerging Areas
[Topics that appear important but lack sufficient research]
- **[Emerging topic]:** [Why it seems significant]
- **[Emerging topic]:** [Early indicators noticed]

## Future Research Recommendations
Priority-ordered list:
1. **[Research topic]** - [Rationale] - Estimated effort: [Time]
2. **[Research topic]** - [Rationale] - Estimated effort: [Time]

## Research Methodology Improvements
- **Better queries:** [Suggestions for future research]
- **Additional sources:** [Where else to look]
- **Different approaches:** [Alternative research methods]
```

### Phase 4: Context Network Integration

1. **Create Node Structure**
   ```
   context-network/
   ├── research/
   │   ├── $ARGUMENTS/
   │   │   ├── overview.md
   │   │   ├── findings.md
   │   │   ├── sources.md
   │   │   ├── implementation.md
   │   │   └── gaps.md
   │   └── research-index.md [Update with new research]
   ```

2. **Establish Relationships**
   - Link to existing domain nodes
   - Create bidirectional references
   - Update domain maps with new insights
   - Add to relevant navigation guides

3. **Update Existing Nodes**
   Where research reveals new information:
   - Update confidence levels
   - Add new relationships
   - Revise outdated information
   - Note conflicts with research findings

### Phase 5: Research Summary & Changelog

```markdown
## Research Summary: $ARGUMENTS - [Date]

### Research Metrics
- Total queries executed: [Count]
- Sources evaluated: [Count]
- New insights discovered: [Count]
- Existing knowledge validated: [Count]
- Conflicts identified: [Count]

### Key Discoveries
1. **[Most important finding]**
   - Impact: [How this changes understanding]
   - Application: [How to use this]

2. **[Second finding]**
   - Impact: [Significance]
   - Application: [Practical use]

### Context Network Updates
- New nodes created: [List with paths]
- Existing nodes modified: [List with changes]
- New relationships: [Count and examples]
- Navigation enhancements: [What was improved]

### Actionable Outcomes
Based on this research:
1. [Specific action/decision enabled]
2. [Process/approach to adopt]
3. [Risk/pitfall to avoid]

### Follow-up Research Needed
- [Topic requiring deeper investigation]
- [Conflicting information to resolve]
- [Emerging trend to monitor]
```

## Execution Checklist

- [ ] Defined clear research questions from $ARGUMENTS
- [ ] Checked context network for existing related research
- [ ] Executed comprehensive Research MCP queries
- [ ] Evaluated source quality and credibility
- [ ] Synthesized findings into structured insights
- [ ] Created all research nodes in context network
- [ ] Established relationships with existing knowledge
- [ ] Updated outdated information found
- [ ] Documented research gaps and open questions
- [ ] Created actionable implementation guidance
- [ ] Updated research index and navigation guides
- [ ] Generated comprehensive changelog entry

## Quality Criteria

1. **Comprehensiveness**: Did we explore all major aspects of $ARGUMENTS?
2. **Source Diversity**: Did we consider multiple perspectives?
3. **Practical Value**: Can someone act on these findings?
4. **Integration**: Is the research well-connected to existing knowledge?
5. **Clarity**: Can someone unfamiliar with the topic understand the findings?
6. **Traceability**: Can we trace conclusions back to sources?

## Output Instructions

1. Place ALL research documents in the context network under `research/$ARGUMENTS/`
2. Never place research documents in the project root
3. Ensure all nodes follow the classification schema
4. Create bidirectional links for all relationships
5. Update the research index with this new research
6. Generate a summary suitable for the changelog

Remember: Research without integration is just information collection. Your goal is to transform research findings into accessible, actionable knowledge within the context network.