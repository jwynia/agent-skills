# State Detection Reference

Algorithms for detecting current workflow state.

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

### 4. PR Status

**Commands**:
```bash
# Check if PR exists for current branch
gh pr list --head $(git branch --show-current)

# Get PR state if exists
gh pr view --json state,mergeable,reviews
```

**Interpretation**:
| PR State | Indicates |
|----------|-----------|
| No PR found | Pre-PR (implementing or ready for prep) |
| PR open, checks pending | Awaiting CI |
| PR open, checks passed | Ready for review/merge |
| PR merged | Ready for cleanup |
| PR closed (not merged) | Abandoned or needs rework |

### 5. Task Status Files

**Location**: `context-network/backlog/by-status/`

**Files**:
- `ready.md` - Tasks available to start
- `in-progress.md` - Tasks being worked on
- `in-review.md` - Tasks with open PRs
- `completed.md` - Finished tasks

**Check**: Look for current task ID in these files.

## State Matrix

```
COMBINED STATE DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Worktree   Branch      Git Status   PR State    → Workflow State
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

None       main        clean        N/A         → IDLE
                                                  Ready to start

Exists     task/*      dirty        None        → IMPLEMENTING
                                                  Active coding

Exists     task/*      clean        None        → READY_FOR_REVIEW
                                                  Can run reviews

Exists     task/*      clean        Open/Run    → AWAITING_CI
                                                  Wait for checks

Exists     task/*      clean        Open/Pass   → READY_FOR_MERGE
                                                  Can merge PR

Exists     task/*      any          Merged      → CLEANUP_NEEDED
                                                  Run pr-complete

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

  # Step 5: Check PR status
  prInfo = ghPrList(branch)

  if no PR exists:
    return READY_FOR_REVIEW

  if prInfo.merged:
    return CLEANUP_NEEDED

  if prInfo.checksRunning:
    return AWAITING_CI

  if prInfo.checksPassed and prInfo.approved:
    return READY_FOR_MERGE

  if prInfo.checksPassed:
    return AWAITING_APPROVAL

  if prInfo.checksFailed:
    return CI_FAILED

  return IN_REVIEW
```

## State to Action Mapping

| Detected State | Next Action | Command |
|----------------|-------------|---------|
| IDLE | Start new task | `next` |
| IMPLEMENTING | Continue coding | Resume in worktree |
| READY_FOR_REVIEW | Run reviews | `review-code`, `review-tests` |
| AWAITING_CI | Wait or check | `gh pr checks` |
| READY_FOR_MERGE | Merge PR | `pr-complete` |
| CLEANUP_NEEDED | Complete merge | `pr-complete` |
| CI_FAILED | Fix issues | Return to worktree |

## Edge Cases

### Multiple Worktrees

If multiple task worktrees exist:
1. Check which has most recent commits
2. Check which matches in-progress status
3. Ask user to disambiguate if unclear

### Stale Worktree

Worktree exists but task marked complete:
1. PR was merged outside workflow
2. Clean up worktree
3. Return to IDLE

### Branch Without Worktree

Task branch exists on remote but no local worktree:
1. Task was started on different machine
2. Offer to create worktree from branch
3. Or start fresh

### PR Closed Without Merge

PR exists but was closed (not merged):
1. Task may have been abandoned
2. Check task status file
3. Offer to reopen or start fresh

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

PR Status: [if exists]
- Number: #[number]
- CI: [status]
- Reviews: [count]

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

# Check PR status
gh pr status

# Check task status files
cat context-network/backlog/by-status/in-progress.md
```
