# Failure Handling

How the coordinator handles various failure scenarios in Gitea repositories.

## Failure Categories

### 1. Worker Implementation Failure

**Cause**: Tests fail, build fails, or worker encounters error during implementation.

**Detection**:
- Worker progress file shows `status: failed`
- Worker progress file shows `error: "..."` field

**Recovery Options**:

| Option | When to Use | Action |
|--------|-------------|--------|
| Retry | Transient failure, may succeed on retry | Spawn new worker for same task |
| Skip | Task blocked, other tasks can proceed | Mark task as skipped, continue |
| Abort | Critical failure, unsafe to continue | Stop all workers, cleanup |

**Retry Limits**: Max 2 retries per task before requiring human intervention.

### 2. Test Failure

**Cause**: Tests fail during worker implementation phase.

**Detection**:
- Worker logs show test failures
- `npm test` exits with non-zero code

**Recovery**:
- Worker should attempt to fix (up to 2 attempts)
- If worker cannot fix, mark as failed
- Coordinator offers retry with fresh context or skip

**Example Worker Retry**:
```
Attempt 1: 3 tests failing
Worker fixes test assertions
Attempt 2: 1 test still failing
Worker investigates root cause
Attempt 3: All tests pass
```

### 3. CI Failure

**Cause**: External CI (Drone, Woodpecker, Jenkins, etc.) fails after PR created.

**Detection**:
- CI status via API script shows failure:
  ```bash
  ./scripts/gitea-ci-status.sh owner repo $(git rev-parse HEAD)
  # Returns: "failure"
  ```
- Worker progress shows `phase: awaiting-ci` for extended time
- Manual check of CI dashboard

**Recovery**:
- Worker should return to implementation phase
- Fix the issue, push updates
- CI re-runs automatically
- If repeated failures, mark as failed

### 4. Merge Conflict

**Cause**: PR cannot merge due to conflicts with main.

**Detection**:
- `tea pulls merge` fails with conflict error
- PR shows conflict status in Gitea UI

**Recovery Options**:

| Option | Action |
|--------|--------|
| Auto-resolve | Rebase PR branch onto main, resolve simple conflicts |
| Manual | Pause for human intervention |
| Skip | Skip this PR, may break subsequent merges |

See [merge-coordination.md](merge-coordination.md) for details.

### 5. Verification Failure

**Cause**: Tests fail after all PRs merged.

**Detection**:
- `npm test` fails in verification phase
- Build fails in verification phase

**Severity**: HIGH - merged code may have regressions.

**Recovery Options**:

| Option | Action |
|--------|--------|
| Investigate | Spawn agent to debug the failures |
| Revert last | Revert the most recent merge |
| Revert all | Revert all merges from this session |
| Manual | Exit for manual investigation |

### 6. Infrastructure Failure

**Cause**: Git unavailable, network issues, disk full, etc.

**Detection**:
- Git commands fail with connection errors
- File system operations fail

**Recovery**:
- Retry with exponential backoff (1s, 2s, 4s)
- Max 3 retries before failing
- Preserve state for resume

## Failure Recovery Flowchart

```
            FAILURE DETECTED
                  │
                  ▼
         ┌───────────────┐
         │ Categorize    │
         │ Failure       │
         └───────┬───────┘
                 │
    ┌────────────┼────────────┬────────────┐
    ▼            ▼            ▼            ▼
 Worker      Merge       Verify      Infra
 Failure     Conflict    Failure     Failure
    │            │            │            │
    ▼            ▼            ▼            ▼
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│ Retry? │  │ Auto-  │  │Revert? │  │ Retry  │
│ Skip?  │  │resolve?│  │        │  │ w/back │
│ Abort? │  │Manual? │  │        │  │ off    │
└────┬───┘  └────┬───┘  └────┬───┘  └────┬───┘
     │           │           │           │
     ▼           ▼           ▼           ▼
  Continue    Continue    Continue    Continue
  or Stop     or Stop     or Stop     or Stop
```

## Graceful Degradation

### Principle

When failures occur, preserve as much progress as possible.

### Rules

1. **Complete what you can**: If one task fails, other independent tasks can continue
2. **Never leave orphans**: Clean up branches, worktrees on abort
3. **Preserve state**: Always save state before stopping
4. **Clear communication**: Tell user exactly what happened and options

### Example: Partial Completion

```
Tasks: TASK-006, TASK-007, TASK-008

TASK-006: Completed, merged
TASK-007: Failed (tests not passing)
TASK-008: Not started

Coordinator response:
"TASK-006 completed successfully.
TASK-007 failed: 3 tests not passing.

Options:
[retry TASK-007] - Try again with fresh context
[skip to TASK-008] - Continue with remaining tasks
[stop] - Stop here (TASK-006 remains merged)"
```

## Error Messages

### Standard Error Display

```
╔════════════════════════════════════════════════════════════════╗
║  ERROR: [Category]                                             ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Task: [TASK-ID] - [Title]                                     ║
║  Phase: [phase]                                                 ║
║  Error: [error message]                                         ║
║                                                                 ║
║  Details:                                                       ║
║  [relevant details, logs, file paths]                          ║
║                                                                 ║
║  Options:                                                       ║
║  [option1] - Description                                        ║
║  [option2] - Description                                        ║
║                                                                 ║
║  Progress so far:                                               ║
║  - TASK-006: completed (merged)                                 ║
║  - TASK-007: failed                                             ║
╚════════════════════════════════════════════════════════════════╝
```

## Logging

### What to Log

- Timestamp of failure
- Failure category
- Task and worker context
- Error message and stack trace (if available)
- Recovery action taken
- Outcome of recovery

### Log Location

```
.coordinator/logs/
├── session-2026-01-20.log    # Session log
└── errors/
    └── TASK-007-failure.log  # Per-task error details
```

### Log Format

```
[2026-01-20T10:25:00Z] ERROR worker-2 TASK-007 implementation
  Phase: implement
  Error: 3 tests failing in message-tools.test.ts
  Details: Expected array of 3, received array of 2
  Action: Offering retry

[2026-01-20T10:25:05Z] INFO user selected: retry

[2026-01-20T10:25:10Z] INFO spawning worker-3 for TASK-007 (retry 1)
```

## Gitea-Specific Notes

### CI Status Checking

Since Gitea uses external CI, check status via API script:

```bash
./scripts/gitea-ci-status.sh owner repo $(git rev-parse HEAD)
```

Possible returns: `pending`, `success`, `failure`, `error`, `none`

### PR Review Status

Check if PR has approvals:

```bash
./scripts/gitea-pr-checks.sh owner repo $PR_NUMBER
```

Returns JSON with `approved`, `review_count`, `mergeable` fields.
