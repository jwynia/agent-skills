# Merge Coordination

How the coordinator manages merges to prevent conflicts in Gitea repositories.

## Core Principle

**All merges are sequential.** Even in parallel execution mode, PRs are merged one at a time to main. This prevents merge conflicts and maintains a clean commit history.

## Why Sequential Merges

### The Problem with Parallel Merges

```
Scenario: Two PRs ready simultaneously

PR #1 (TASK-006)         PR #2 (TASK-007)
    │                         │
    ▼                         ▼
 merge to main            merge to main
    │                         │
    └─────────┬───────────────┘
              │
              ▼
        CONFLICT!

Both PRs were based on the same main.
When merged simultaneously, they may
modify the same files or have
incompatible changes.
```

### Sequential Merge Solution

```
PR #1 (TASK-006)         PR #2 (TASK-007)
    │                         │
    ▼                         │ (waits)
 merge to main                │
    │                         │
    ▼                         ▼
main updated ────────► rebase PR #2
                              │
                              ▼
                        merge to main
                              │
                              ▼
                         main updated

No conflicts because each merge
happens on the latest main.
```

## Merge Queue

The coordinator maintains a merge queue for PRs ready to merge.

### Queue Structure

```json
{
  "merge_queue": [
    {
      "pr_number": 123,
      "task_id": "TASK-006",
      "worker_id": "worker-1",
      "branch": "task/TASK-006-persistence",
      "added_at": "2026-01-20T10:15:00Z"
    },
    {
      "pr_number": 124,
      "task_id": "TASK-007",
      "worker_id": "worker-2",
      "branch": "task/TASK-007-tests",
      "added_at": "2026-01-20T10:18:00Z"
    }
  ]
}
```

### Queue Processing

```
While merge_queue not empty:
  1. Take first PR from queue
  2. git checkout main && git pull
  3. Attempt merge
  4. If success:
     - Remove from queue
     - Update worker status to completed
     - Delete feature branch
  5. If conflict:
     - Pause and alert user
     - Offer resolution options
```

## Merge Execution

### Using Gitea Tea CLI

```bash
# Squash merge (recommended)
tea pulls merge 123 --style squash

# Or merge commit
tea pulls merge 123 --style merge

# Or rebase
tea pulls merge 123 --style rebase

# Or rebase-merge
tea pulls merge 123 --style rebase-merge

# Note: tea may not auto-delete branch, do it manually:
git push origin --delete task/TASK-006-persistence
```

### Using Git Directly

```bash
# Ensure on latest main
git checkout main
git pull --rebase origin main

# Merge the PR branch
git merge --no-ff task/TASK-006-persistence

# Push to origin
git push origin main

# Delete feature branch
git branch -d task/TASK-006-persistence
git push origin --delete task/TASK-006-persistence
```

## Conflict Handling

### Detection

Conflicts are detected when:
- `tea pulls merge` fails with conflict error
- `git merge` fails with conflict markers
- PR shows conflict status in Gitea

### Resolution Options

```
╔════════════════════════════════════════════════════════════════╗
║  MERGE CONFLICT: PR #124 (TASK-007)                            ║
╠════════════════════════════════════════════════════════════════╣
║                                                                 ║
║  Conflicting files:                                             ║
║  - src/mastra/schemas/message-status.ts                        ║
║  - src/mastra/services/message-processor.ts                    ║
║                                                                 ║
║  Options:                                                       ║
║  [resolve] - Attempt automatic resolution                       ║
║  [manual] - Exit for manual conflict resolution                 ║
║  [skip] - Skip this PR, continue with others                    ║
║  [abort] - Stop merge process entirely                          ║
╚════════════════════════════════════════════════════════════════╝
```

### Automatic Resolution

For simple conflicts, the coordinator can attempt:

```bash
# Checkout the PR branch
git checkout task/TASK-007-tests

# Rebase onto latest main
git rebase origin/main

# If conflicts during rebase:
# - For auto-generated files: accept theirs/ours
# - For code: use merge tool or abort

# Force push updated branch
git push --force-with-lease

# PR will update, CI re-runs
```

### Manual Resolution

If automatic resolution fails:

1. Coordinator pauses
2. User resolves conflicts manually
3. User pushes resolved changes
4. User signals coordinator to continue
5. Coordinator verifies CI passes (via API script)
6. Coordinator completes merge

## Rollback Procedures

### Reverting a Single Merge

If verification fails after a merge:

```bash
# Find the merge commit
git log --oneline -5

# Revert the merge commit
git revert -m 1 <merge-commit-sha>

# Push the revert
git push origin main
```

### Reverting Multiple Merges

If multiple merges need to be reverted:

```bash
# Option 1: Revert each in reverse order
git revert -m 1 <latest-merge>
git revert -m 1 <previous-merge>

# Option 2: Reset to known good state
git reset --hard <last-known-good-sha>
git push --force-with-lease origin main  # DANGEROUS
```

## Best Practices

1. **Always pull before merge**: Ensure you have the latest main
2. **Use squash merge**: Creates cleaner history
3. **Delete branches after merge**: Prevents branch pollution
4. **Verify CI passes**: Check via API script or manually before merge
5. **One merge at a time**: Never attempt parallel merges
6. **Keep merge queue visible**: Log what's pending

## Gitea-Specific Notes

### Tea CLI Merge Styles

| Style | Command | Result |
|-------|---------|--------|
| Squash | `tea pulls merge --style squash` | All commits squashed into one |
| Merge | `tea pulls merge --style merge` | Merge commit preserving history |
| Rebase | `tea pulls merge --style rebase` | Commits rebased onto main |
| Rebase-merge | `tea pulls merge --style rebase-merge` | Rebase + merge commit |

### Branch Cleanup

Tea CLI may not automatically delete branches. Clean up manually:

```bash
git push origin --delete task/TASK-006-persistence
```

### CI Status Verification

Before merging, verify CI passed using the API script:

```bash
./scripts/gitea-ci-status.sh owner repo $(git rev-parse task/TASK-006-persistence)
```

Or check your CI dashboard directly.
