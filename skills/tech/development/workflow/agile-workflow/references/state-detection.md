# State Detection Reference

Algorithms for detecting current workflow state using git-only signals.

## Overview

The agile-workflow skill determines current state automatically by examining multiple signals from the project environment. This enables seamless resume from any point.

## Detection Signals

### 1. Worktree Presence

**Command**: `git worktree list`

**Interpretation**:
```
/path/to/repo                  abc1234 [main]
/path/to/repo/.worktrees/TASK-042  def5678 [task/TASK-042-feature]
```

| Finding | Indicates |
|---------|-----------|
| Only main worktree | No task in progress |
| Additional worktree exists | Task in progress |
| Worktree path pattern `.worktrees/[TASK-ID]` | Extract task ID |

### 2. Current Branch

**Command**: `git branch --show-current`

**Interpretation**:
| Branch Pattern | Indicates |
|----------------|-----------|
| `main` | Not in implementation |
| `task/[TASK-ID]-*` | Active task implementation |

### 3. Git Status

**Command**: `git status --porcelain`

**Interpretation**:
| Status | Indicates |
|--------|-----------|
| Empty output | All changes committed |
| Modified files | Active coding in progress |
| Staged files | Preparing to commit |

### 4. Branch Merge Status

**Command**: `git branch --merged main`

**Interpretation**:
| Result | Indicates |
|--------|-----------|
| Branch listed | Already merged to main |
| Branch not listed | Not yet merged |

### 5. Task Status Files

**Location**: `context-network/backlog/by-status/`

**Files**:
- `ready.md` - Tasks available to start
- `in-progress.md` - Tasks being worked on
- `completed.md` - Finished tasks

**Check**: Look for current task ID in these files.

## State Matrix

```
COMBINED STATE DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Worktree   Branch      Git Status   Merged?     → Workflow State
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

None       main        clean        N/A         → IDLE
                                                  Ready to start

Exists     task/*      dirty        No          → IMPLEMENTING
                                                  Active coding

Exists     task/*      clean        No          → READY_FOR_REVIEW
                                                  Can run reviews

Exists     task/*      clean        No          → MERGE_READY
                                  (after review)  Ready to merge

Exists     task/*      any          Yes         → CLEANUP_NEEDED
                                                  Run merge-complete

None       main        clean        N/A         → COMPLETED
                                                  (with recent merge)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Detection Algorithm

```
function detectState():
  # Step 1: Check worktrees
  worktrees = gitWorktreeList()

  if no task worktree exists:
    return IDLE

  # Step 2: Extract task info
  taskId = extractTaskId(worktree.path)
  branch = worktree.branch

  # Step 3: Navigate to worktree
  cd worktree.path

  # Step 4: Check git status
  status = gitStatus()
  hasUncommitted = status.isNotEmpty()

  if hasUncommitted:
    return IMPLEMENTING

  # Step 5: Check if already merged
  mergedBranches = gitBranchMerged("main")

  if branch in mergedBranches:
    return CLEANUP_NEEDED

  # Step 6: Check task status file for review state
  taskStatus = readTaskStatusFile(taskId)

  if taskStatus == "reviewed":
    return MERGE_READY

  return READY_FOR_REVIEW
```

## State to Action Mapping

| Detected State | Next Action | Command |
|----------------|-------------|---------|
| IDLE | Start new task | `next` |
| IMPLEMENTING | Continue coding | Resume in worktree |
| READY_FOR_REVIEW | Run reviews | `review-code`, `review-tests` |
| MERGE_READY | Merge to main | `merge-complete` |
| CLEANUP_NEEDED | Complete merge | `merge-complete` |

## Edge Cases

### Multiple Worktrees

If multiple task worktrees exist:
1. Check which has most recent commits
2. Check which matches in-progress status
3. Ask user to disambiguate if unclear

### Stale Worktree

Worktree exists but task marked complete:
1. Branch was merged outside workflow
2. Clean up worktree
3. Return to IDLE

### Branch Without Worktree

Task branch exists on remote but no local worktree:
1. Task was started on different machine
2. Offer to create worktree from branch
3. Or start fresh

## Resumption Context

When resuming from detected state, gather context:

```
CONTEXT FOR RESUME
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

State: [detected state]
Task: [TASK-ID] - [Title]
Branch: [branch name]
Worktree: [path]

Progress:
- Files changed: [count]
- Tests: [passing/failing/none]
- Last commit: [message] ([time ago])

Recommended Action: [what to do next]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Verification Commands

Quick commands to check state:

```bash
# Check worktrees
git worktree list

# Check current branch
git branch --show-current

# Check for uncommitted changes
git status --short

# Check if branch is merged
git branch --merged main

# Check task status files
cat context-network/backlog/by-status/in-progress.md
```
