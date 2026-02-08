# Checkpoint Handling Reference

Pause/resume behavior at workflow checkpoints.

## Overview

Checkpoints are moments in the workflow where human review and decision-making is valuable. The skill pauses at these points, presents information, and waits for user direction.

## Checkpoint Types

### Decision Checkpoints

Require explicit user choice between options.

**Examples**:
- TASK_SELECTED: Confirm or change task
- REVIEWS_DONE: Fix issues now or defer

### Validation Checkpoints

Verify a condition before proceeding.

**Examples**:
- IMPL_COMPLETE: All tests passing?
- MERGE_READY: All validations passing?

### Information Checkpoints

Present status for awareness.

**Examples**:
- Post-sync summary
- Review results display

## Checkpoint Definitions

### TASK_SELECTED

**Triggers after**: `next` command

**Display**:
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Task Selection                           ║
╠═══════════════════════════════════════════════════════╣
║  Selected: [TASK-ID] - [Task Title]                   ║
║  Priority: [Level]                                    ║
║  Size: [Estimate]                                     ║
║  Branch: [suggested-branch]                           ║
║                                                       ║
║  Proceed with implementation?                         ║
╚═══════════════════════════════════════════════════════╝
```

**User Options**:
- `continue` / `yes` → Proceed to implement
- `other` / `different` → Return to task selection
- `stop` / `pause` → Exit workflow

**Auto-Continue**: Never (always requires confirmation)

---

### IMPL_COMPLETE

**Triggers after**: `implement` command completes

**Display**:
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Implementation Complete                  ║
╠═══════════════════════════════════════════════════════╣
║  Tests: [X] passing, [Y] failing                      ║
║  Coverage: [Z]%                                       ║
║  Build: [PASS/FAIL]                                   ║
║  Lint: [PASS/FAIL]                                    ║
║                                                       ║
║  Ready for code review?                               ║
╚═══════════════════════════════════════════════════════╝
```

**User Options**:
- `continue` → Proceed to reviews
- `back` → Continue implementing
- `stop` → Exit workflow (save state)

**Auto-Continue Condition**:
- All tests passing AND
- Build succeeds AND
- Lint passes

If all conditions met, can auto-continue with brief countdown.

---

### REVIEWS_DONE

**Triggers after**: `review-code` and `review-tests` complete

**Display**:
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Reviews Complete                         ║
╠═══════════════════════════════════════════════════════╣
║  Code Review:                                         ║
║    Critical: [A] | High: [B] | Medium: [C] | Low: [D] ║
║  Test Review:                                         ║
║    Critical: [E] | High: [F] | Medium: [G] | Low: [H] ║
║                                                       ║
║  [If issues exist:]                                   ║
║  Top Issue: "[issue description]"                     ║
║                                                       ║
║  How to proceed?                                      ║
╚═══════════════════════════════════════════════════════╝
```

**User Options**:
- `fix all` → Apply all recommendations
- `fix critical` → Fix critical/high only, defer rest
- `defer all` → Create tasks, proceed to PR
- `stop` → Exit workflow

**Auto-Continue Condition**:
- No critical issues AND
- No high issues
- (Auto-continue to PR prep)

**Blocking Condition**:
- Critical issues present → MUST fix before PR

---

### MERGE_READY

**Triggers after**: `merge-prep` command

**Display**:
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Ready to Merge                           ║
╠═══════════════════════════════════════════════════════╣
║  Task: [TASK-ID] - [title]                            ║
║  Branch: task/[TASK-ID]-description                   ║
║                                                       ║
║  Validation:                                          ║
║  - Tests: PASSED                                      ║
║  - Lint: PASSED                                       ║
║  - Build: PASSED                                      ║
║                                                       ║
║  Ready to merge to main?                              ║
╚═══════════════════════════════════════════════════════╝
```

**User Options**:
- `merge` → Proceed to merge
- `stop` → Exit (branch remains)

**Auto-Continue Condition**:
- All validation checks passed

**Blocking Conditions**:
- Tests failed → Must fix
- Build failed → Must fix

---

### MERGED

**Triggers after**: `merge-complete` merge step

**Display**:
```
╔═══════════════════════════════════════════════════════╗
║  CHECKPOINT: Merged                                   ║
╠═══════════════════════════════════════════════════════╣
║  Task: [TASK-ID] - [Title]                            ║
║  Commit: [commit-hash]                                ║
║                                                       ║
║  Cleanup:                                             ║
║  - [x] Merged to main                                 ║
║  - [x] Branch deleted                                 ║
║  - [x] Worktree removed                               ║
║  - [x] Task marked complete                           ║
║                                                       ║
║  Task cycle complete!                                 ║
╚═══════════════════════════════════════════════════════╝
```

**User Options**:
- `next` → Start another task cycle
- `done` → Exit workflow

**Auto-Continue**: Never (natural end of cycle)

---

## Checkpoint Behavior Protocol

### Standard Flow

```
1. COMMAND COMPLETES
        │
        ▼
2. GATHER CHECKPOINT DATA
   - Collect relevant metrics
   - Determine status
   - Check auto-continue conditions
        │
        ▼
3. DISPLAY CHECKPOINT
   - Show formatted checkpoint box
   - Present options
        │
        ▼
4. WAIT FOR INPUT
   - Parse user response
   - Map to action
        │
        ▼
5. EXECUTE ACTION
   - Continue to next step
   - Loop back to previous
   - Exit with state preserved
```

### Auto-Continue Logic

```
if autoConditionsMet AND userPrefersAutoFlow:
    display "Auto-continuing in 5 seconds..."
    display "[Press any key to pause]"

    wait 5 seconds with interrupt check

    if no interrupt:
        proceed to next step
    else:
        show full checkpoint options
```

### Interrupt Handling

At any checkpoint, user can:
- Type response to take action
- Type `stop` to exit
- Press Ctrl+C to abort

State is preserved on any exit.

---

## Checkpoint Configuration

### User Preferences

Users may configure checkpoint behavior:

```yaml
# .agile-workflow/config.yaml
checkpoints:
  auto_continue: true          # Enable auto-continue when safe
  auto_continue_delay: 5       # Seconds before auto-continue
  verbose: false               # Show detailed checkpoint info
  require_confirmation:
    - TASK_SELECTED            # Always confirm these
    - MERGE_READY
```

### Per-Invocation Override

```bash
# Disable auto-continue for this run
/agile-workflow --no-auto

# Maximum verbosity
/agile-workflow --verbose

# Skip non-critical checkpoints
/agile-workflow --fast
```

---

## State Preservation

When workflow is interrupted at a checkpoint:

1. **Current State Saved**
   - Detected workflow state
   - Task context
   - Last completed step
   - Pending action

2. **Resume Information**
   - How to continue: `/agile-workflow` (auto-detects)
   - What will happen: [next step description]

3. **No Work Lost**
   - All git commits preserved
   - All files in worktree preserved
   - PR remains open if created
   - Context network updated

---

## Error at Checkpoint

When an error occurs:

```
╔═══════════════════════════════════════════════════════╗
║  ERROR: [Error Type]                                  ║
╠═══════════════════════════════════════════════════════╣
║  [Error description]                                  ║
║                                                       ║
║  Suggested Resolution:                                ║
║  1. [Step to fix]                                     ║
║  2. [Step to fix]                                     ║
║                                                       ║
║  After fixing, run: /agile-workflow                   ║
║  (State will be detected automatically)               ║
╚═══════════════════════════════════════════════════════╝
```

Errors don't lose state - workflow can resume after fixing the issue.
