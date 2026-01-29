# State Tracking

How the coordinator maintains and persists its state.

## State Machine

```
┌──────────┐
│   IDLE   │ ◄─────────────────────────────┐
└────┬─────┘                               │
     │ /agile-coordinator                  │
     ▼                                     │
┌────────────┐                             │
│ DISCOVERING│                             │
└────┬───────┘                             │
     │ tasks found                         │
     ▼                                     │
┌──────────┐                               │
│ PLANNING │                               │
└────┬─────┘                               │
     │ plan confirmed                      │
     ▼                                     │
┌───────────┐      ┌─────────┐            │
│ EXECUTING │─────►│ MERGING │            │
└────┬──────┘      └────┬────┘            │
     │ all complete     │ all merged      │
     │◄─────────────────┘                 │
     ▼                                     │
┌───────────┐                              │
│ VERIFYING │                              │
└────┬──────┘                              │
     │ verified                            │
     ▼                                     │
┌────────────┐                             │
│ SUMMARIZING│─────────────────────────────┘
└────────────┘
```

## State File

Location: `.coordinator/state.json`

### Full Schema

```json
{
  "session_id": "coord-2026-01-20-abc123",
  "state": "EXECUTING",
  "started_at": "2026-01-20T10:00:00Z",
  "updated_at": "2026-01-20T10:25:00Z",

  "config": {
    "execution_mode": "sequential",
    "max_workers": 2,
    "autonomy_level": "autonomous",
    "reporting": "summary-only"
  },

  "tasks": {
    "queued": ["TASK-008"],
    "in_progress": ["TASK-007"],
    "completed": ["TASK-006"],
    "failed": []
  },

  "workers": [
    {
      "id": "worker-1",
      "task_id": "TASK-006",
      "status": "completed",
      "pr_number": 123,
      "commit": "abc123",
      "merged": true,
      "started_at": "2026-01-20T10:01:00Z",
      "completed_at": "2026-01-20T10:20:00Z"
    },
    {
      "id": "worker-2",
      "task_id": "TASK-007",
      "status": "in_progress",
      "pr_number": null,
      "commit": null,
      "merged": false,
      "started_at": "2026-01-20T10:21:00Z",
      "completed_at": null
    }
  ],

  "merge_queue": [123],

  "verification": {
    "status": null,
    "tests_total": null,
    "tests_passed": null,
    "build_status": null,
    "completed_at": null
  },

  "summary": null
}
```

## State Transitions

### IDLE → DISCOVERING

Triggered by: `/agile-coordinator` invocation

Actions:
1. Create `.coordinator/` directory
2. Generate session_id
3. Initialize state.json
4. Read backlog for ready tasks

### DISCOVERING → PLANNING

Triggered by: Tasks found in backlog

Actions:
1. Parse task metadata
2. Sort by priority
3. Check dependencies
4. Generate execution plan
5. Display checkpoint for confirmation

### PLANNING → EXECUTING

Triggered by: User confirms plan (or auto-continue)

Actions:
1. Update config with flags
2. Initialize task queues
3. Spawn first worker(s)

### EXECUTING → MERGING

Triggered by: Worker reports `ready-to-merge`

Actions:
1. Add PR to merge_queue
2. Execute merge
3. Update worker status
4. Return to EXECUTING if tasks remain

### EXECUTING → VERIFYING

Triggered by: All tasks completed or in merge_queue empty

Actions:
1. Pull latest main
2. Run build
3. Run tests
4. Record results

### VERIFYING → SUMMARIZING

Triggered by: Verification complete

Actions:
1. Generate summary report
2. Display to user
3. Cleanup state

### SUMMARIZING → IDLE

Triggered by: Summary displayed

Actions:
1. Archive or remove `.coordinator/`
2. Return to idle state

## Resume from Interrupted Session

If the coordinator is interrupted, it can resume:

### Detection

On `/agile-coordinator` invocation:
1. Check if `.coordinator/state.json` exists
2. If exists and state != IDLE: offer resume

### Resume Prompt

```
Found interrupted session:
- Session: coord-2026-01-20-abc123
- State: EXECUTING
- Completed: TASK-006
- In Progress: TASK-007

Options:
[resume] Continue from where you left off
[restart] Start fresh (clears progress)
[abort] Stop and cleanup
```

### Resume Actions

By state:
- **DISCOVERING**: Re-run discovery
- **PLANNING**: Show plan again for confirmation
- **EXECUTING**: Check worker progress, continue monitoring
- **MERGING**: Check merge status, continue queue
- **VERIFYING**: Re-run verification
- **SUMMARIZING**: Generate summary again

## Cleanup

### On Successful Completion

```bash
# Option 1: Archive
mv .coordinator .coordinator.archive.$(date +%s)

# Option 2: Remove
rm -rf .coordinator
```

### On Abort

```bash
# Clean up any orphaned branches
git branch -D task/TASK-* 2>/dev/null || true

# Remove coordinator state
rm -rf .coordinator
```
