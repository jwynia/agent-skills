# Task Cycle Phase Reference

Complete flow for implementing a single task from selection to merge (git-only version).

## Overview

The task cycle is the primary workflow for development work. It takes a task from the ready queue through implementation, review, and merge directly to main.

```
TASK CYCLE FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  START
    │
    ▼
┌─────────┐
│  sync   │ ─── Reality check: align docs with actual state
└────┬────┘
     │
     ▼
┌─────────┐
│  next   │ ─── Select highest priority ready task
└────┬────┘
     │
     ▼
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: TASK_SELECTED                            ║
║  • Display task details                               ║
║  • Confirm selection or choose different task         ║
╚═══════════════════════════════════════════════════════╝
     │
     ▼
┌─────────────┐
│  implement  │ ─── Create worktree, TDD, build
└──────┬──────┘
       │
       ▼
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: IMPL_COMPLETE                            ║
║  • Show test results and coverage                     ║
║  • Verify build status                                ║
║  • Confirm ready for review                           ║
╚═══════════════════════════════════════════════════════╝
       │
       ▼
┌─────────────┐     ┌───────────────┐
│ review-code │ ──▶ │ review-tests  │
└──────┬──────┘     └───────┬───────┘
       │                    │
       └────────┬───────────┘
                │
                ▼
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: REVIEWS_DONE                             ║
║  • Display combined review results                    ║
║  • Critical issues block progress                     ║
║  • User decides: fix now or defer                     ║
╚═══════════════════════════════════════════════════════╝
                │
       ┌───────┴───────┐
       │  Has issues?  │
       └───────┬───────┘
         Yes   │   No
          ▼    │    │
┌──────────────────┐│
│apply-recommend's ││
└────────┬─────────┘│
         │          │
         └────┬─────┘
              │
              ▼
┌─────────────┐
│ merge-prep  │ ─── Validate, prepare for merge
└──────┬──────┘
       │
       ▼
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: MERGE_READY                              ║
║  • Display validation results                         ║
║  • Confirm ready to merge to main                     ║
╚═══════════════════════════════════════════════════════╝
       │
       ▼
┌───────────────┐
│ merge-complete│ ─── Merge, cleanup worktree, update task status
└──────┬────────┘
       │
       ▼
┌───────────────────┐
│ update-backlog    │ ─── Update epic file, unblock dependents,
│ & project status  │     update project status
└──────┬────────────┘
       │
       ▼
    END

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step-by-Step Details

### Step 1: Sync (Reality Check)

**Command**: `sync --last 1d --dry-run`

**Purpose**: Ensure context network matches reality before starting work.

**Actions**:
1. Check files changed recently
2. Compare against documented task statuses
3. Identify any completed but undocumented work
4. Report sync findings

**Outputs**:
- Sync report
- Any tasks that should be marked complete
- Warning if attempting duplicate work

**Next Step**: Proceed to task selection

---

### Step 2: Next (Task Selection)

**Command**: `next`

**Purpose**: Identify the single best task to work on.

**Actions**:
1. Read ready task queue
2. Apply priority ordering
3. Select highest priority available task
4. Display task summary

**Outputs**:
- Task ID and title
- Priority and size
- Suggested branch name

**Triggers Checkpoint**: TASK_SELECTED

---

### Checkpoint: TASK_SELECTED

**Display**:
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Task Selection                           ║
╠═══════════════════════════════════════════════════════╣
║  Selected: [TASK-ID] - [Task Title]                   ║
║  Priority: [High/Medium/Low]                          ║
║  Size: [trivial/small/medium]                         ║
║  Branch: task/[TASK-ID]-[description]                 ║
║                                                       ║
║  Proceed with implementation?                         ║
║  [continue] [other task] [stop]                       ║
╚═══════════════════════════════════════════════════════╝
```

**User Responses**:
- `continue`: Proceed to implement
- `other task`: Return to task selection
- `stop`: Exit workflow

---

### Step 3: Implement (TDD Development)

**Command**: `implement [TASK-ID]`

**Purpose**: Test-driven implementation in isolated worktree.

**Actions**:
1. Create worktree at `.worktrees/[TASK-ID]/`
2. Create feature branch `task/[TASK-ID]-description`
3. Write tests FIRST (mandatory)
4. Implement to make tests pass
5. Run full test suite
6. Verify build succeeds
7. Commit all changes

**Outputs**:
- Working implementation
- Passing tests
- Coverage report
- Build status

**Triggers Checkpoint**: IMPL_COMPLETE

---

### Checkpoint: IMPL_COMPLETE

**Display**:
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Implementation Complete                  ║
╠═══════════════════════════════════════════════════════╣
║  Tests: 15 passing                                    ║
║  Coverage: 87% (+12% new code)                        ║
║  Build: SUCCESS                                       ║
║  Linting: PASS                                        ║
║                                                       ║
║  Ready for code review?                               ║
║  [continue] [back] [stop]                             ║
╚═══════════════════════════════════════════════════════╝
```

**Auto-Continue Condition**: All tests pass AND build succeeds

---

### Step 4: Review (Quality Validation)

**Commands**: `review-code --uncommitted`, `review-tests --uncommitted`

**Purpose**: Validate implementation quality.

**Actions**:
1. Run code quality review
2. Run test quality review
3. Identify issues by severity
4. Generate recommendations

**Outputs**:
- Combined review report
- Issues categorized by severity
- Specific recommendations

**Triggers Checkpoint**: REVIEWS_DONE

---

### Checkpoint: REVIEWS_DONE

**Display**:
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Reviews Complete                         ║
╠═══════════════════════════════════════════════════════╣
║  Code Review:                                         ║
║    Critical: 0 | High: 1 | Medium: 3 | Low: 5         ║
║  Test Review:                                         ║
║    Critical: 0 | High: 0 | Medium: 2 | Low: 1         ║
║                                                       ║
║  High Priority: "Missing error handling in UserAPI"   ║
║                                                       ║
║  How to proceed?                                      ║
║  [fix all] [fix critical/high] [defer all] [stop]    ║
╚═══════════════════════════════════════════════════════╝
```

**Decision Logic**:
- Critical issues: MUST fix before proceeding
- High issues: STRONGLY RECOMMENDED to fix
- Medium/Low: Can defer to follow-up tasks

---

### Step 5: Apply Recommendations (Conditional)

**Command**: `apply-recommendations [review-output]`

**Purpose**: Intelligently apply fixes and create follow-up tasks.

**Actions**:
1. Triage recommendations
2. Apply quick fixes immediately
3. Create tasks for complex issues
4. Re-run validation

**Outputs**:
- Applied fixes summary
- Created follow-up tasks
- Updated validation status

**Next Step**: Proceed to merge prep

---

### Step 6: Merge Prep (Validate for Merge)

**Command**: `merge-prep`

**Purpose**: Validate implementation and prepare for merge.

**Actions**:
1. Run full validation suite
2. Update from main branch
3. Verify no merge conflicts
4. Generate merge documentation
5. Confirm ready to merge

**Outputs**:
- Validation results
- Conflict check status
- Ready for merge confirmation

**Triggers Checkpoint**: MERGE_READY

---

### Checkpoint: MERGE_READY

**Display**:
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Ready to Merge                           ║
╠═══════════════════════════════════════════════════════╣
║  Task: [TASK-ID] - [Task Title]                       ║
║  Branch: task/[TASK-ID]-description                   ║
║                                                       ║
║  Validation:                                          ║
║  - Tests: PASSED (15/15)                              ║
║  - Lint: PASSED                                       ║
║  - Build: PASSED                                      ║
║  - Conflicts: None                                    ║
║                                                       ║
║  Ready to merge to main?                              ║
║  [merge] [stop]                                       ║
╚═══════════════════════════════════════════════════════╝
```

**Auto-Continue Condition**: All validation passes

---

### Step 7: Merge Complete (Merge and Cleanup)

**Command**: `merge-complete`

**Purpose**: Merge to main and clean up.

**Actions**:
1. Squash merge to main
2. Delete feature branch
3. Remove worktree
4. Update task status to completed
5. Update backlog indexes

**Outputs**:
- Merge confirmation
- Cleanup status
- Task completion record

**Next Step**: Update backlog and project status

---

### Step 8: Update Backlog Epic File and Project Status

**Command**: Part of `merge-complete` (Phase 6)

**Purpose**: Persist progress to the source-of-truth documentation files so future sessions see accurate state.

**Actions**:
1. Update task status in the backlog epic file (ready → complete)
2. Recalculate epic-level progress counts
3. Unblock dependent tasks (blocked → ready) if their blockers are now complete
4. Update project status file (context/status.md) with current phase, epic progress, and recent changes
5. Commit and push documentation updates

**Outputs**:
- Updated epic file with accurate task statuses
- Newly unblocked tasks moved to ready
- Current project status reflecting actual progress

**Why this step exists**: Without it, internal tracking (`.coordinator/state.json`, worker progress files) diverges from the backlog and project status files. This caused 22 merged tasks to remain marked as "ready" in one real-world project.

**Next Step**: Workflow complete

---

## Error Handling

### Test Failures
- Stop at IMPL_COMPLETE checkpoint
- Must fix tests before proceeding
- Cannot skip to review

### Merge Conflicts
- Stop at MERGE_READY checkpoint
- Pull latest main into worktree
- Resolve conflicts
- Push updates
- Continue to merge

### Review Blocks
- Stop at REVIEWS_DONE checkpoint
- Address critical issues
- Cannot proceed with critical issues unfixed

## Timing Expectations

| Step | Typical Duration |
|------|------------------|
| Sync | 1-2 minutes |
| Next | < 1 minute |
| Implement | 30 min - 4 hours |
| Reviews | 5-15 minutes |
| Apply Recommendations | 5-30 minutes |
| Merge Prep | 2-5 minutes |
| Merge Complete | 2-5 minutes |

Total: Variable based on task complexity
