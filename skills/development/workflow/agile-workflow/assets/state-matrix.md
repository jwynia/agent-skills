# State Transition Matrix

Quick reference for workflow state transitions.

## State Definitions

| State | Description | Can Transition To |
|-------|-------------|-------------------|
| IDLE | No task in progress | IMPLEMENTING |
| IMPLEMENTING | Active coding in worktree | READY_FOR_REVIEW |
| READY_FOR_REVIEW | Code complete, not yet reviewed | IN_REVIEW |
| IN_REVIEW | Reviews complete, may have issues | READY_FOR_PR, IMPLEMENTING |
| READY_FOR_PR | All issues addressed | AWAITING_CI |
| AWAITING_CI | PR created, CI running | AWAITING_APPROVAL, CI_FAILED |
| AWAITING_APPROVAL | CI passed, needs review | READY_FOR_MERGE |
| READY_FOR_MERGE | Approved and ready | CLEANUP |
| CLEANUP | PR merged, cleanup needed | COMPLETED |
| COMPLETED | Task done | IDLE |
| CI_FAILED | CI checks failed | IMPLEMENTING |

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
READY_FOR_PR ─────────────────────────────────────────────────────────────────
  │
  │ [pr-prep: PR created]
  ▼
AWAITING_CI ──────────────────────────────────────────────────────────────────
  │
  ├──[CI failed] ──► CI_FAILED ──► IMPLEMENTING
  │
  │ [CI passed]
  ▼
AWAITING_APPROVAL ────────────────────────────────────────────────────────────
  │
  │ [approved]
  ▼
READY_FOR_MERGE ──────────────────────────────────────────────────────────────
  │
  │ [pr-complete: merge]
  ▼
CLEANUP ──────────────────────────────────────────────────────────────────────
  │
  │ [pr-complete: cleanup done]
  ▼
COMPLETED ────────────────────────────────────────────────────────────────────
  │
  │ [next task cycle]
  ▼
IDLE
```

## Detection Signals by State

| State | Worktree | Branch | Git Status | PR |
|-------|----------|--------|------------|-----|
| IDLE | None | main | clean | - |
| IMPLEMENTING | Exists | task/* | dirty | - |
| READY_FOR_REVIEW | Exists | task/* | clean | None |
| IN_REVIEW | Exists | task/* | clean | None |
| READY_FOR_PR | Exists | task/* | clean | None |
| AWAITING_CI | Exists | task/* | clean | Open, running |
| AWAITING_APPROVAL | Exists | task/* | clean | Open, passed |
| READY_FOR_MERGE | Exists | task/* | clean | Approved |
| CLEANUP | Exists | task/* | clean | Merged |
| COMPLETED | None | main | clean | - |
| CI_FAILED | Exists | task/* | clean | Failed |

## Valid Transitions Only

Transitions that should NOT happen:

- IDLE → anything except IMPLEMENTING
- IMPLEMENTING → READY_FOR_MERGE (must go through review)
- IN_REVIEW → COMPLETED (must create and merge PR)
- AWAITING_CI → IMPLEMENTING (must go through CI_FAILED first)
- Any state → COMPLETED without going through CLEANUP

## Recovery from Invalid States

If state detection finds inconsistent signals:

1. **Worktree exists but task marked complete**
   - PR was merged outside workflow
   - Action: Clean up worktree

2. **No worktree but task marked in-progress**
   - Worktree was deleted manually
   - Action: Recreate worktree or reset task status

3. **PR merged but worktree still exists**
   - pr-complete wasn't run
   - Action: Run pr-complete to cleanup

4. **Branch exists without worktree**
   - Work started on different machine
   - Action: Create worktree from branch

## Checkpoint Mapping

| State | Triggered Checkpoint |
|-------|---------------------|
| After IDLE→IMPLEMENTING | TASK_SELECTED |
| After IMPLEMENTING→READY_FOR_REVIEW | IMPL_COMPLETE |
| After IN_REVIEW→READY_FOR_PR | REVIEWS_DONE |
| After READY_FOR_PR→AWAITING_CI | PR_CREATED |
| After CLEANUP→COMPLETED | PR_MERGED |
