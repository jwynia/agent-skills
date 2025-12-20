# Context Network Retrospective Agent Prompt

## Task Context

You are conducting a retrospective analysis after completing a task. Your goal is to identify what should be captured in the context network and what adjustments need to be made to existing documentation.

## Critical Domain Boundary Reminder

Remember the distinction:
- **Context Network**: Planning documents, architecture decisions, design discussions, implementation strategies
- **Project Artifacts**: Source code, configuration files, public documentation, tests

## Retrospective Analysis Process

### Phase 1: Task Review

1. **Task Summary**
   - What was the original task objective?
   - What was actually accomplished?
   - Were there any deviations from the original plan?

2. **Decision Inventory**
   - What architectural or design decisions were made?
   - What trade-offs were considered?
   - What alternatives were rejected and why?

3. **Discovery Log**
   - What unexpected challenges emerged?
   - What new patterns or approaches were discovered?
   - What assumptions proved incorrect?
   - **What discovery records were created during this task?**
   - **What location insights should be preserved?**

### Phase 2: Context Network Gap Analysis

1. **Missing Documentation**
   - Were there planning documents that would have helped but didn't exist?
   - What design decisions were made that aren't captured anywhere?
   - Are there new patterns that should be documented?
   - **What discovery records would have saved time if they existed?**
   - **What location indexes were missing that caused repeated file searching?**

2. **Outdated Information**
   - Did you encounter documentation that was incorrect or misleading?
   - Are there nodes whose relationships have changed?
   - Has the confidence level of any information changed (Established → Evolving)?

3. **Relationship Gaps**
   - Are there connections between nodes that weren't documented?
   - Did you discover new cross-domain relationships?
   - Are there navigation paths that would have been helpful?

### Phase 3: Update Requirements

For each identified gap or update need, determine:

1. **Update Type**
   - New node creation
   - Existing node modification
   - Relationship establishment/modification
   - Navigation guide enhancement

2. **Priority Assessment**
   - **Critical**: Would cause immediate problems if not updated
   - **Important**: Would improve future work significantly
   - **Nice-to-have**: Would enhance understanding but not critical

3. **Update Scope**
   - Single node update
   - Multiple related nodes
   - Structural changes to network organization

### Phase 4: Context Network Updates

For each update, follow this process:

#### New Node Creation
```markdown
## Node: [Title]

### Classification
- Domain: [Where does this fit?]
- Stability: [How often will this change?]
- Abstraction: [What level of detail?]
- Confidence: [How certain are we?]

### Key Content
[What is the essential information?]

### Critical Relationships
- Depends on: [What must be understood first?]
- Enables: [What does this make possible?]
- Conflicts with: [What does this contradict?]

### Task Context
- Discovered during: [Task name]
- Relevance: [Why this matters for future work]
```

#### Node Modification
```markdown
## Update for: [Node Title]

### What Changed
- Previous understanding: [What we thought before]
- New understanding: [What we know now]
- Reason for change: [What led to this update]

### Impact Assessment
- Affected relationships: [Which connections need review?]
- Downstream implications: [What else might need updating?]
```

#### Relationship Documentation
```markdown
## New Relationship: [Source] → [Type] → [Target]

### Relationship Details
- Type: [depends-on, enables, conflicts-with, etc.]
- Strength: [Critical, Important, Informational]
- Discovery context: [How was this discovered?]

### Navigation Implications
- When following this path: [What should users know?]
- Common use cases: [When would someone traverse this?]
```

### Phase 5: Changelog Entry

Create a comprehensive changelog entry:

```markdown
## Retrospective: [Task Name] - [Date]

### Task Summary
- Objective: [What we set out to do]
- Outcome: [What was accomplished]
- Key learnings: [Most important discoveries]

### Context Network Updates

#### New Nodes Created
- [Node Name]: [Brief description and why it was needed]

#### Discovery Records Created
- [YYYY-MM-DD-###]: [Brief description of discovery and significance]

#### Location Indexes Updated
- [Component/Feature]: [New locations added and why they matter]

#### Learning Paths Updated
- [Concept Path]: [How understanding evolved through this task]

#### Nodes Modified  
- [Node Name]: [What changed and why]
  - Classification changes: [If any]
  - Content updates: [Summary]
  - Relationship changes: [New/modified connections]

#### New Relationships
- [Source] → [Type] → [Target]: [Why this connection matters]

#### Navigation Enhancements
- [Path or guide updated]: [What improved]

### Patterns and Insights
- Recurring themes: [What patterns emerged?]
- Process improvements: [How could future work be better?]
- Knowledge gaps identified: [What's still missing?]

### Follow-up Recommendations
1. [Recommendation]: [Rationale and priority]
2. [Recommendation]: [Rationale and priority]

### Metrics
- Nodes created: [Count]
- Nodes modified: [Count]
- Relationships added: [Count]
- Estimated future time saved: [Rough estimate]
```

## Execution Checklist

- [ ] Reviewed all decisions made during task
- [ ] Identified all planning/architecture content created
- [ ] Checked for outdated documentation encountered
- [ ] Documented new patterns or approaches discovered
- [ ] Created/updated all relevant context network nodes
- [ ] Established/updated all important relationships
- [ ] Updated navigation guides where helpful
- [ ] Created comprehensive changelog entry
- [ ] Identified follow-up improvements needed

## Quality Checks

Before completing the retrospective:

1. **Placement Verification**: Are all planning/architecture documents in the context network (not project root)?
2. **Relationship Completeness**: Are bidirectional relationships properly documented?
3. **Classification Accuracy**: Do all classifications reflect current understanding?
4. **Navigation Utility**: Would someone else be able to find this information when needed?
5. **Future Value**: Will these updates save time or prevent problems in future work?

## Output Format

Provide your retrospective analysis in the following structure:

1. Task Review Summary
2. Identified Gaps and Updates (grouped by priority)
3. Completed Updates (with file paths)
4. Changelog Entry
5. Recommendations for Future Work

When all of this is complete, be absolutely certain that you've documented this retrospective to the context network.