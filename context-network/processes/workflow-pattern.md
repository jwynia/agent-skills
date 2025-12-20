# Workflow Pattern: Intent-Before-Action

## Purpose

This document defines the core workflow pattern that ensures session resilience and maintains accurate context across interruptions and session resets.

## The Pattern

Every work session follows this three-phase pattern:

### 1. State Intent in Context Network

**Before** starting any work, document what you're about to do.

**What to Document**:
- What are you about to do?
- Why are you doing it?
- What files/sections will be affected?
- What decisions are pending?
- What approach will you take?

**Where to Document**:
- Planning documents in `context-network/elements/skills/[domain]/`
- Decision records in `context-network/decisions/`
- Process updates in relevant process files
- Updates to tracking files in `context-network/elements/skills/`

**Example**:
```
Before creating a new CSV analyzer skill:
1. Create context-network/elements/skills/data-processing/csv-analyzer-planning.md
2. Document purpose, scope, structure, decisions
3. ONLY AFTER planning is documented, create skills/data-processing/csv/csv-analyzer/
```

### 2. Execute Work

Follow the documented plan while making incremental progress.

**Guidelines**:
- Work in small, reversible steps
- Pause at decision points
- Document discoveries as you go
- Update tracking files with progress
- Run validation early and often

**Recovery Point**:
If the session resets during execution, the documented intent allows recovery:
- Intent shows what was being attempted
- Tracking shows what was completed
- Next session can continue from last known state

### 3. Update Context Network

Record what was actually done, including any deviations from the plan.

**What to Update**:
- Tracking files (status, validation results)
- Decision records (if decisions were made)
- Catalog indexes (if new skills added)
- Process documents (if process insights gained)
- Discovery records (if important findings)

**What to Note**:
- What was completed
- What remains to be done
- Any deviations from the plan and why
- New questions or uncertainties
- Lessons learned

## Why This Matters

### Session Resilience
If a session resets mid-work, the context network accurately reflects:
- What was planned
- What was completed
- What remains to be done
- Current state of all artifacts

The next session can pick up exactly where the previous one left off.

### Collaboration
Multiple agents (or the same agent in different sessions) can coordinate effectively:
- Clear record of intent
- Explicit decision trail
- No duplicate work
- Consistent understanding

### Quality
Documentation before action forces:
- Thinking through the approach
- Identifying potential issues
- Making decisions explicit
- Creating reviewable plans

## Application Examples

### Example 1: Creating a New Skill

**Wrong Approach**:
```
User: "Create a skill for extracting PDF text"
Agent: Creates skills/pdf/extract-text/SKILL.md immediately
[Session resets]
Agent: No record of what was done or why
```

**Correct Approach**:
```
User: "Create a skill for extracting PDF text"
Agent:
1. Creates context-network/elements/skills/data-processing/pdf-text-extractor-planning.md
2. Documents purpose, scope, approach, decisions
3. Creates skills/data-processing/pdf/pdf-text-extractor/SKILL.md
4. Updates context-network/elements/skills/data-processing/pdf-text-extractor.md tracking
5. Updates context-network/elements/skills/index.md catalog
[Session resets]
Agent: Can review planning, see what was completed, continue from tracking file
```

### Example 2: Modifying a Process

**Wrong Approach**:
```
User: "Update the validation process"
Agent: Edits context-network/processes/validation.md directly
[Session resets]
Agent: No record of what change was made or why
```

**Correct Approach**:
```
User: "Update the validation process"
Agent:
1. Creates context-network/decisions/validation-process-update.md
2. Documents current problem, proposed change, rationale
3. Gets user approval
4. Updates context-network/processes/validation.md
5. Updates decision record with completion
[Session resets]
Agent: Decision record shows what was done and why
```

### Example 3: Batch Skill Creation

**Wrong Approach**:
```
User: "Create 5 data processing skills"
Agent: Creates all 5 skills in parallel
[Session resets after 3]
Agent: Which 3 were completed? What were the other 2?
```

**Correct Approach**:
```
User: "Create 5 data processing skills"
Agent:
1. Creates context-network/planning/data-processing-skill-batch.md
2. Lists all 5 skills, their purposes, order
3. Creates skill 1, updates tracking
4. Creates skill 2, updates tracking
5. Creates skill 3, updates tracking
[Session resets]
Agent: Planning shows 5 total, tracking shows 3 complete, can continue with 4 & 5
```

## Anti-Patterns to Avoid

❌ **Creating without planning**
- Don't create files before documenting intent
- Don't make decisions without recording them

❌ **Batch updates at the end**
- Don't wait until completion to update context
- Don't keep state only in conversation

❌ **Assuming context persists**
- Don't rely on conversational memory alone
- Don't skip documentation because "we just talked about it"

❌ **Duplicating information**
- Don't copy full skill content into context network
- Don't duplicate spec documentation

## Checklist

Before starting work:
- [ ] Have I documented my intent in the context network?
- [ ] Is the plan clear enough for another agent to follow?
- [ ] Have I identified decision points?
- [ ] Do I know where to record progress?

During work:
- [ ] Am I updating tracking as I go?
- [ ] Am I recording decisions as they're made?
- [ ] Am I documenting discoveries?

After work:
- [ ] Have I updated all affected tracking files?
- [ ] Have I recorded completion status?
- [ ] Have I noted any follow-up items?
- [ ] Is the context network accurate?

## Metadata

- **Created**: 2025-12-19
- **Last Updated**: 2025-12-19
- **Updated By**: Claude (via Context Network Template Adjustment)

## Change History

- 2025-12-19: Initial creation of workflow pattern documentation
