# State Transition Matrix

Quick reference for workflow state transitions (git-only version).

## State Definitions

| State | Description | Can Transition To |
|-------|-------------|-------------------|
| IDLE | No task in progress | IMPLEMENTING |
| IMPLEMENTING | Active coding in worktree | READY_FOR_REVIEW |
| READY_FOR_REVIEW | Code complete, not yet reviewed | IN_REVIEW |
| IN_REVIEW | Reviews complete, may have issues | MERGE_READY, IMPLEMENTING |
| MERGE_READY | All issues addressed, validated | CLEANUP |
| CLEANUP | Merged, cleanup needed | COMPLETED |
| COMPLETED | Task done | IDLE |

## Transition Triggers

```
IDLE ─────────────────────────────────────────────────────────────────────────
  │
  │ [next: task selected]
  ▼
IMPLEMENTING ─────────────────────────────────────────────────────────────────
  │
  │ [implement: complete with passing tests]
  ▼
READY_FOR_REVIEW ─────────────────────────────────────────────────────────────
  │
  │ [review-code, review-tests: complete]
  ▼
IN_REVIEW ────────────────────────────────────────────────────────────────────
  │
  ├──[issues found] ──► IMPLEMENTING (loop back)
  │
  │ [no issues OR issues fixed]
  ▼
MERGE_READY ──────────────────────────────────────────────────────────────────
  │
  │ [merge-prep: validation passed]
  │ [merge-complete: merge to main]
  ▼
CLEANUP ──────────────────────────────────────────────────────────────────────
  │
  │ [merge-complete: cleanup done]
  ▼
COMPLETED ────────────────────────────────────────────────────────────────────
  │
  │ [next task cycle]
  ▼
IDLE
```

## Detection Signals by State

| State | Worktree | Branch | Git Status | Merged |
|-------|----------|--------|------------|--------|
| IDLE | None | main | clean | - |
| IMPLEMENTING | Exists | task/* | dirty | No |
| READY_FOR_REVIEW | Exists | task/* | clean | No |
| IN_REVIEW | Exists | task/* | clean | No |
| MERGE_READY | Exists | task/* | clean | No |
| CLEANUP | Exists | task/* | clean | Yes |
| COMPLETED | None | main | clean | - |

## Valid Transitions Only

Transitions that should NOT happen:

- IDLE → anything except IMPLEMENTING
- IMPLEMENTING → MERGE_READY (must go through review)
- IN_REVIEW → COMPLETED (must merge first)
- Any state → COMPLETED without going through CLEANUP

## Recovery from Invalid States

If state detection finds inconsistent signals:

1. **Worktree exists but task marked complete**
   - Branch was merged outside workflow
   - Action: Clean up worktree

2. **No worktree but task marked in-progress**
   - Worktree was deleted manually
   - Action: Recreate worktree or reset task status

3. **Branch merged but worktree still exists**
   - merge-complete wasn't run
   - Action: Run merge-complete to cleanup

4. **Branch exists without worktree**
   - Work started on different machine
   - Action: Create worktree from branch

## Checkpoint Mapping

| State | Triggered Checkpoint |
|-------|---------------------|
| After IDLE→IMPLEMENTING | TASK_SELECTED |
| After IMPLEMENTING→READY_FOR_REVIEW | IMPL_COMPLETE |
| After IN_REVIEW→MERGE_READY | REVIEWS_DONE |
| After MERGE_READY→CLEANUP | MERGE_READY |
| After CLEANUP→COMPLETED | MERGED |
