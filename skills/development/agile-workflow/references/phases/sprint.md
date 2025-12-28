# Sprint Phase Reference

Sprint boundary ceremonies: start and end sequences.

## Overview

Sprint sequences ensure proper planning at the start and thorough closure at the end of each sprint.

## Sprint Start (~60 minutes)

```
SPRINT START SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  START
    │
    ▼
┌───────────────────────┐
│ sync --all            │ ─── Full reality alignment
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ groom --all           │ ─── Comprehensive grooming
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ plan sprint-goals     │ ─── Define sprint objectives
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ status --detailed     │ ─── Establish baseline
└───────────┬───────────┘
            │
            ▼
         OUTPUT
   "Sprint Plan Ready"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 1: Full Sync

**Command**: `sync --all`

**Purpose**: Complete alignment between documentation and reality.

**Actions**:
- Review all in-progress work
- Identify any undocumented completions
- Clear out stale status entries
- Ensure backlog reflects truth

**Duration**: ~15 minutes

---

### Step 2: Comprehensive Grooming

**Command**: `groom --all`

**Purpose**: Prepare all tasks for the sprint.

**Actions**:
- Review entire backlog
- Refine vague tasks into actionable items
- Add acceptance criteria
- Estimate complexity
- Identify dependencies
- Move tasks to ready status

**Duration**: ~25 minutes

---

### Step 3: Sprint Planning

**Command**: `plan sprint-goals`

**Purpose**: Define what the sprint will accomplish.

**Actions**:
- Set sprint objective
- Select tasks for sprint
- Identify architecture needs
- Note dependencies and risks
- Create sprint plan document

**Duration**: ~15 minutes

---

### Step 4: Baseline Status

**Command**: `status --detailed`

**Purpose**: Establish metrics baseline for sprint.

**Actions**:
- Document starting velocity
- Note current tech debt
- Record test coverage
- Capture documentation state

**Duration**: ~5 minutes

---

### Sprint Start Output

After sprint start, you should have:
- Clean, aligned backlog
- Groomed, ready tasks
- Clear sprint objective
- Baseline metrics for comparison
- Sprint plan document

---

## Sprint End (~90 minutes)

```
SPRINT END SEQUENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  START
    │
    ▼
┌───────────────────────┐
│ sync --sprint         │ ─── Final sprint sync
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ retrospective         │ ─── Capture learnings
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ audit --scope sprint  │ ─── Quality review
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ status --metrics      │ ─── Sprint metrics
│ --detailed            │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ maintenance --deep    │ ─── Context network cleanup
└───────────┬───────────┘
            │
            ▼
         OUTPUT
   "Sprint Closed"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 1: Final Sync

**Command**: `sync --sprint`

**Purpose**: Ensure all sprint work is documented.

**Actions**:
- Verify all completed tasks are marked done
- Identify any work that spilled over
- Update carryover items
- Clean up in-progress that finished

**Duration**: ~10 minutes

---

### Step 2: Retrospective

**Command**: `retrospective`

**Purpose**: Capture sprint learnings.

**Actions**:
- Review accomplishments
- Document decisions made
- Capture discoveries
- Identify process improvements
- Update context network with insights
- Create retrospective record

**Duration**: ~25 minutes

---

### Step 3: Quality Audit

**Command**: `audit --scope sprint`

**Purpose**: Review sprint's code quality.

**Actions**:
- Review all code added during sprint
- Identify quality issues
- Document technical debt added
- Note patterns (good and bad)
- Generate audit report

**Duration**: ~20 minutes

---

### Step 4: Sprint Metrics

**Command**: `status --metrics --detailed`

**Purpose**: Capture sprint performance.

**Actions**:
- Calculate velocity (tasks/points completed)
- Compare to baseline
- Document coverage changes
- Note debt trends
- Record accomplishments

**Duration**: ~10 minutes

---

### Step 5: Deep Maintenance

**Command**: `maintenance --deep`

**Purpose**: Between-sprint cleanup.

**Actions**:
- Audit context network structure
- Fix broken links
- Update stale content
- Archive completed work
- Improve navigation
- Clean up temporary files

**Duration**: ~25 minutes

---

### Sprint End Output

After sprint end, you should have:
- All sprint work documented
- Learnings captured in retrospective
- Quality assessment on record
- Sprint metrics documented
- Clean context network for next sprint

---

## Quick Reference Commands

```bash
# Sprint start sequence
/agile-workflow --phase sprint-start

# Sprint end sequence
/agile-workflow --phase sprint-end

# Individual commands
sync --all
groom --all
plan sprint-goals
status --detailed
sync --sprint
retrospective
audit --scope sprint
status --metrics --detailed
maintenance --deep
```

## Cadence Recommendations

| Sequence | When | Duration | Critical? |
|----------|------|----------|-----------|
| Sprint Start | First day of sprint | 60 min | Yes |
| Sprint End | Last day of sprint | 90 min | Yes |

Both ceremonies are critical for maintaining:
- Clean handoffs between sprints
- Captured institutional knowledge
- Accurate velocity tracking
- Healthy context network

## Sprint Rhythm

```
┌─────────────────────────────────────────────────────────┐
│                    SPRINT (2 weeks)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Sprint Start (Day 1)                                   │
│       │                                                 │
│       ▼                                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Week 1                                           │ │
│  │  ├── Daily Morning Standup                        │ │
│  │  ├── Task Cycles (implementation)                 │ │
│  │  └── Daily Evening Wrap-up                        │ │
│  └───────────────────────────────────────────────────┘ │
│       │                                                 │
│       ▼                                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Week 2                                           │ │
│  │  ├── Daily Morning Standup                        │ │
│  │  ├── Task Cycles (implementation)                 │ │
│  │  └── Daily Evening Wrap-up                        │ │
│  └───────────────────────────────────────────────────┘ │
│       │                                                 │
│       ▼                                                 │
│  Sprint End (Last Day)                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Integration Notes

Sprint ceremonies nest around daily and task cycles:
- Sprint Start prepares the backlog for daily work
- Daily sequences maintain rhythm within the sprint
- Task cycles are the actual implementation work
- Sprint End closes out and prepares for next iteration
