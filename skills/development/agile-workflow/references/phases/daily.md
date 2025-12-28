# Daily Phase Reference

Morning and evening workflow sequences for daily development rhythm.

## Overview

Daily sequences maintain alignment and capture knowledge at natural workflow boundaries.

## Morning Standup (~5 minutes)

```
MORNING SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  START
    │
    ▼
┌───────────────────────┐
│ sync --last 1d        │ ─── What actually happened yesterday?
│ --dry-run             │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ status --brief        │ ─── Current sprint health
│ --sprint              │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ groom --ready-only    │ ─── What's ready to work on?
└───────────┬───────────┘
            │
            ▼
         OUTPUT
    "Today's Priorities"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 1: Sync (Reality Check)

**Command**: `sync --last 1d --dry-run`

**Purpose**: Understand what actually got done yesterday vs what was planned.

**What to look for**:
- Tasks completed but not documented
- Work in progress status
- Any drift between plan and reality

**Output**: Sync report showing yesterday's actual progress

---

### Step 2: Status (Health Check)

**Command**: `status --brief --sprint`

**Purpose**: Quick sprint health overview.

**What to look for**:
- Sprint progress percentage
- Any critical blockers
- Risk indicators
- Velocity trend

**Output**: 1-2 paragraph status summary

---

### Step 3: Groom (Ready Queue)

**Command**: `groom --ready-only`

**Purpose**: See what's immediately actionable.

**What to look for**:
- Tasks ready for implementation
- Priority ordering
- Any quick wins
- Blocked tasks that might unblock soon

**Output**: List of ready tasks with priorities

---

### Morning Output

After morning sequence, you should know:
- What was actually accomplished yesterday
- Current sprint health status
- What tasks are ready to work on today
- Any blockers to address

**Recommended next step**: Start task cycle with highest priority ready task

---

## Evening Wrap-up (~10 minutes)

```
EVENING SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  START
    │
    ▼
┌───────────────────────┐
│ checklist             │ ─── Is anything important about to be lost?
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ discovery             │ ─── Capture any learnings from today
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ sync --last 1d        │ ─── Update task statuses
└───────────┬───────────┘
            │
            ▼
         OUTPUT
   "Day Complete Summary"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 1: Checklist (Work Preservation)

**Command**: `checklist`

**Purpose**: Ensure nothing important is lost before ending the day.

**What to check**:
- Uncommitted changes that should be committed
- Notes that should be documented
- Decisions that need recording
- Work in progress that needs handoff notes

**Output**: Checklist of items to address

---

### Step 2: Discovery (Knowledge Capture)

**Command**: `discovery`

**Purpose**: Document any insights or learnings from the day.

**What to capture**:
- "Aha moments" about the codebase
- Location discoveries (where things are)
- Pattern recognitions
- Assumption corrections

**Output**: Discovery records created

---

### Step 3: Sync (Status Update)

**Command**: `sync --last 1d`

**Purpose**: Update task statuses to reflect actual work done.

**What to update**:
- Mark completed work as done
- Update in-progress estimates
- Document any partial completions
- Note blockers encountered

**Output**: Updated context network reflecting reality

---

### Evening Output

After evening sequence, you should have:
- No lost work or uncommitted important changes
- Today's learnings captured in discovery records
- Task statuses reflecting actual progress
- Clear state for tomorrow's morning standup

---

## Quick Reference Commands

```bash
# Full morning sequence
/agile-workflow --phase daily-morning

# Full evening sequence
/agile-workflow --phase daily-evening

# Individual commands
sync --last 1d --dry-run
status --brief --sprint
groom --ready-only
checklist
discovery
sync --last 1d
```

## Cadence Recommendations

| Sequence | When | Duration | Critical? |
|----------|------|----------|-----------|
| Morning Standup | Start of work day | 5 min | Yes |
| Evening Wrap-up | End of work day | 10 min | Recommended |

**Morning is critical** because it prevents duplicate work and ensures you're working on the right things.

**Evening is recommended** because knowledge capture is most effective when context is fresh.

## Integration with Task Cycle

Daily sequences wrap around task cycles:

```
┌─────────────────────────────────────────────────┐
│               WORK DAY                          │
├─────────────────────────────────────────────────┤
│                                                 │
│  Morning Standup                                │
│       │                                         │
│       ▼                                         │
│  ┌─────────────────────────────────────────┐   │
│  │  Task Cycle 1                           │   │
│  │  (implement → review → PR)              │   │
│  └─────────────────────────────────────────┘   │
│       │                                         │
│       ▼                                         │
│  ┌─────────────────────────────────────────┐   │
│  │  Task Cycle 2 (optional)                │   │
│  │  (smaller task or continuation)         │   │
│  └─────────────────────────────────────────┘   │
│       │                                         │
│       ▼                                         │
│  Evening Wrap-up                                │
│                                                 │
└─────────────────────────────────────────────────┘
```
