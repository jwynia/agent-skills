# Retrospective Command Reference

Post-task analysis and context network updates.

## Purpose

Conduct retrospective analysis after completing a task to identify what should be captured in the context network and what adjustments need to be made.

## When Used in Workflow

- **Sprint End**: Comprehensive sprint retrospective
- **Post-Task**: After significant task completion
- **Weekly**: End of week review

## Domain Boundary Reminder

- **Context Network**: Planning, architecture, design, strategies
- **Project Artifacts**: Source code, configuration, tests, public docs

## Retrospective Process

### Phase 1: Task Review

**Task Summary:**
- What was the original objective?
- What was actually accomplished?
- Were there deviations from plan?

**Decision Inventory:**
- What architectural decisions were made?
- What trade-offs were considered?
- What alternatives were rejected and why?

**Discovery Log:**
- What unexpected challenges emerged?
- What new patterns were discovered?
- What assumptions proved incorrect?
- What discovery records were created?

### Phase 2: Gap Analysis

**Missing Documentation:**
- Planning documents that would have helped?
- Design decisions not captured anywhere?
- New patterns that should be documented?
- Discovery records that would have saved time?

**Outdated Information:**
- Documentation that was incorrect?
- Nodes whose relationships changed?
- Confidence levels that need updating?

**Relationship Gaps:**
- Connections between nodes not documented?
- New cross-domain relationships discovered?
- Navigation paths that would help?

### Phase 3: Update Requirements

For each gap, determine:

**Update Type:**
- New node creation
- Existing node modification
- Relationship establishment
- Navigation guide enhancement

**Priority:**
- Critical: Would cause immediate problems
- Important: Would improve future work significantly
- Nice-to-have: Enhances understanding

### Phase 4: Execute Updates

**New Node Creation:**
```markdown
## Node: [Title]

### Classification
- Domain: [Where it fits]
- Stability: [Change frequency]
- Confidence: [How certain]

### Key Content
[Essential information]

### Critical Relationships
- Depends on: [Prerequisites]
- Enables: [What it makes possible]

### Task Context
- Discovered during: [Task name]
- Relevance: [Why this matters]
```

**Node Modification:**
```markdown
## Update for: [Node Title]

### What Changed
- Previous: [Old understanding]
- New: [Current understanding]
- Reason: [What led to change]

### Impact
- Affected relationships: [What needs review]
- Downstream implications: [What else needs updating]
```

### Phase 5: Changelog Entry

```markdown
## Retrospective: [Task Name] - [Date]

### Task Summary
- Objective: [Goal]
- Outcome: [Result]
- Key learnings: [Discoveries]

### Context Network Updates

#### New Nodes Created
- [Node Name]: [Brief description]

#### Discovery Records Created
- [YYYY-MM-DD-###]: [Description]

#### Nodes Modified
- [Node Name]: [What changed]

#### New Relationships
- [Source] → [Type] → [Target]: [Why it matters]

### Patterns and Insights
- Recurring themes: [What patterns emerged]
- Process improvements: [How to do better]
- Knowledge gaps: [What's still missing]

### Follow-up Recommendations
1. [Recommendation]: [Rationale]
```

## Execution Checklist

- [ ] Reviewed all decisions made during task
- [ ] Identified planning/architecture content created
- [ ] Checked for outdated documentation encountered
- [ ] Documented new patterns discovered
- [ ] Created/updated relevant context network nodes
- [ ] Established important relationships
- [ ] Updated navigation guides
- [ ] Created changelog entry
- [ ] Identified follow-up improvements

## Quality Checks

1. **Placement**: All planning docs in context network?
2. **Relationships**: Bidirectional links documented?
3. **Classification**: Accurate for all nodes?
4. **Navigation**: Would someone else find this?
5. **Future Value**: Will this save time later?

## Orchestration Notes

Retrospective is an end-of-cycle activity:
- Run after significant task completion
- Run at sprint boundaries
- Ensures learning is captured before context is lost
