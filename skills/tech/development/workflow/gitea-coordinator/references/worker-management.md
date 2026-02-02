# Worker Management

How the coordinator spawns, monitors, and manages worker agents for Gitea repositories.

## Spawning Workers

Workers are spawned using Claude Code's Task tool with the `general-purpose` subagent type.

### Task Tool Invocation

```typescript
Task({
  description: "Implement TASK-006",
  prompt: workerInstruction,
  subagent_type: "general-purpose"
})
```

### Worker Instruction Structure

Each worker receives a prompt that includes:

1. **Task Assignment**: Which task to implement
2. **Skill Invocation**: Run `gitea-workflow` for the task
3. **Progress Reporting**: Write to `.coordinator/workers/{id}/progress.json`
4. **Merge Protocol**: Don't self-merge, signal ready-to-merge instead
5. **Checkpoint Behavior**: Auto-continue at all gitea-workflow checkpoints

See [../templates/worker-instruction.md](../templates/worker-instruction.md) for the full template.

## Progress Monitoring

### File-Based Communication

Workers cannot directly communicate with the coordinator or each other. Instead, they write progress to the file system:

```
.coordinator/
├── state.json                    # Coordinator state
└── workers/
    ├── worker-1/
    │   └── progress.json         # Worker 1 progress
    └── worker-2/
        └── progress.json         # Worker 2 progress
```

### Progress File Format

```json
{
  "worker_id": "worker-1",
  "task_id": "TASK-006",
  "status": "in_progress",
  "phase": "implement",
  "pr_number": null,
  "branch": "task/TASK-006-persistence",
  "commits": 0,
  "tests_passing": null,
  "last_update": "2026-01-20T10:15:00Z",
  "milestones": [
    {
      "phase": "started",
      "timestamp": "2026-01-20T10:00:00Z"
    },
    {
      "phase": "implement",
      "timestamp": "2026-01-20T10:05:00Z"
    }
  ],
  "error": null
}
```

### Status Values

| Status | Meaning |
|--------|---------|
| `in_progress` | Worker is actively working |
| `ready-to-merge` | PR created, CI passed, awaiting merge |
| `completed` | Task fully complete (after merge) |
| `failed` | Worker encountered unrecoverable error |

### Phase Values

| Phase | Meaning |
|-------|---------|
| `started` | Worker just spawned |
| `implement` | Writing code and tests |
| `review` | Running code/test reviews |
| `pr-prep` | Creating pull request |
| `awaiting-ci` | Waiting for CI to pass |
| `ready-to-merge` | PR ready, waiting for coordinator |
| `merged` | PR has been merged |

## Polling Strategy

The coordinator polls worker progress files to track status:

### Sequential Mode

```
While current_worker not complete:
  1. Check worker progress file
  2. If status changed: log milestone
  3. If failed: handle failure
  4. If ready-to-merge: proceed to merge
  5. Sleep 5 seconds
```

### Parallel Mode

```
While any worker active:
  1. Check all worker progress files
  2. For each status change: log milestone
  3. For each failure: handle failure
  4. For each ready-to-merge: add to merge queue
  5. If workers < max and tasks remain: spawn next
  6. Sleep 5 seconds
```

## Worker Lifecycle

```
SPAWNED
   │
   ▼
IMPLEMENTING ──────┐
   │               │ (if error)
   ▼               │
REVIEWING          │
   │               │
   ▼               │
PR_CREATED         │
   │               │
   ▼               │
AWAITING_CI ───────┤
   │               │
   ▼               │
READY_TO_MERGE     │
   │               │
   ▼               ▼
COMPLETED      FAILED
```

## Handling Worker Completion

### Successful Completion

When a worker reports `ready-to-merge`:

1. Log the milestone
2. Add PR to merge queue
3. If sequential: proceed to merge phase
4. If parallel: continue monitoring others

### Worker Failure

When a worker reports `failed`:

1. Log the error details
2. Check error type (recoverable vs fatal)
3. Offer options: retry, skip, abort
4. If retry: spawn new worker with same task
5. If skip: move to next task
6. If abort: stop all workers, cleanup

## Cleanup

After all tasks complete or on abort:

1. Remove `.coordinator/workers/` directory
2. Update `.coordinator/state.json` to IDLE
3. Optionally remove `.coordinator/` entirely

## Gitea-Specific Notes

### CI Status During Awaiting-CI Phase

Workers should check CI status via the API script:

```bash
./scripts/gitea-ci-status.sh owner repo $(git rev-parse HEAD)
```

Since Gitea uses external CI, this queries the commit status API.

### PR Approval Check

Before signaling ready-to-merge, workers should verify approvals:

```bash
./scripts/gitea-pr-checks.sh owner repo $PR_NUMBER
```
