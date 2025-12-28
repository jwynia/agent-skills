# Groom Command Reference

Transform context network's task list into actionable backlog.

## Purpose

Refine tasks from "planned" status to "ready" status by ensuring they have clear acceptance criteria, proper scoping, and all dependencies resolved.

## When Used in Workflow

- **Sprint Start**: Comprehensive grooming of all tasks
- **Daily Morning**: Check what's ready for today
- **Task Selection**: Before `/next` to ensure tasks are properly prepared

## Common Invocation Patterns

```bash
groom                     # Groom all tasks
groom --ready-only       # Only show tasks that are ready
groom --blocked          # Focus on identifying/unblocking blocked tasks
groom --stale 7          # Re-groom tasks older than 7 days
groom --generate-sprint  # Create sprint plan from groomed tasks
```

## Grooming Process

### Phase 1: Task Inventory

Scan task sources:
- `/planning/sprint-*.md`
- `/planning/backlog.md`
- `/tasks/**/*.md`
- `/decisions/**/*.md` (for follow-up actions)
- Files with "TODO:", "NEXT:", "PLANNED:" markers

### Phase 2: Task Classification

Classify each task as:
- **A: Claimed Complete** - Marked done but needs follow-up
- **B: Ready to Execute** - Clear criteria, no blockers
- **C: Needs Grooming** - Vague requirements or missing context
- **D: Blocked** - Waiting on dependencies or decisions
- **E: Obsolete** - No longer relevant or duplicate

### Phase 3: Reality Check

For each task, assess:
- Still needed? (Check against current project state)
- Prerequisites met? (Identify missing dependencies)
- Implementation clear? (Flag ambiguities)
- Success criteria defined? (Note what's missing)
- Complexity estimate: Trivial/Small/Medium/Large/Unknown

### Phase 4: Task Enhancement

Transform vague tasks into actionable items with:
- Specific, measurable title
- Clear context and rationale
- Input/output specifications
- Acceptance criteria checklist
- Implementation notes
- Identified dependencies
- Effort estimate

### Phase 5: Priority Scoring

Score tasks based on:
- User value (High/Medium/Low)
- Technical risk (High/Medium/Low)
- Effort (Trivial/Small/Medium/Large)
- Dependencies (None/Few/Many)

## Output Format

```markdown
# Groomed Task Backlog

## Ready for Implementation

### 1. [Specific Task Title]
**One-liner**: [What this achieves]
**Effort**: [Estimate]
**Files to modify**: [Key files]

<details>
<summary>Full Details</summary>

**Context**: [Why needed]
**Acceptance Criteria**:
- [ ] [Specific criterion]
- [ ] [Another criterion]

**Implementation Guide**:
1. [First step]
2. [Second step]

**Watch Out For**: [Pitfalls]
</details>

## Ready Soon (Blocked)

### [Task Title]
**Blocker**: [What's blocking]
**Prep work possible**: [What can be done now]

## Needs Decisions

### [Task Title]
**Decision needed**: [Specific question]
**Options**: [List with pros/cons]

## Summary Statistics
- Ready for work: Y
- Blocked: Z
- Archived: N
```

## Red Flags to Identify

- Task has been "almost ready" for multiple sprints
- No one can explain what "done" looks like
- "Just refactor X" - usually hides complexity
- Task title contains "and" - should be split
- "Investigate/Research X" without concrete output

## Orchestration Notes

Grooming updates happen on main branch (not feature branches) because:
- Backlog state is shared across all work
- Tasks need to be visible to all developers
- Status changes aren't implementation changes
