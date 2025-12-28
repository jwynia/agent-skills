# Next Command Reference

Identify the single next best task to work on from the groomed backlog.

## Purpose

Select the highest priority ready task, providing just enough information to start implementation.

## When Used in Workflow

- **Task Cycle**: After sync, before implement
- **Ad-hoc**: When asking "what should I work on?"

## Invocation

```bash
next                      # Select next task from ready queue
```

## Selection Process

### Step 1: Load Ready Tasks

Read `context-network/backlog/by-status/ready.md` to get available tasks.

### Step 2: Selection Logic

**Priority Order:**
1. Critical Priority tasks (if any)
2. High Priority tasks
3. Medium Priority tasks
4. Low Priority tasks

**Within same priority level, prefer:**
- Tasks with no dependencies over those with dependencies
- Smaller tasks (trivial/small) over larger ones (medium)
- Tasks that unblock other work
- Tasks in sequence (e.g., TASK-004-2 before TASK-004-3)

### Step 3: Output

**If ready task found:**
```
**Next Task:** [TASK-ID] - [Task Title]

**Priority:** [Critical/High/Medium/Low]
**Size:** [trivial/small/medium]
**Branch:** [suggested-branch-name]

Start with: implement [TASK-ID]
```

**If no ready tasks:**
```
No tasks are currently ready for implementation.

Run groom to prepare tasks from the planned backlog.
```

## What NOT to Do

- Don't load or display full task details
- Don't show multiple task options
- Don't provide extensive context about the task
- Don't analyze task content in depth
- Don't check dependencies (should already be resolved for ready tasks)

## Output Format

Keep it minimal:
- Task ID
- Task title
- Priority and size
- Suggested branch name
- How to start

## Orchestration Notes

After next completes:
- **CHECKPOINT: TASK_SELECTED** - Pause for user confirmation
- User can accept the suggestion or request different task
- On acceptance, proceed to implement with the task ID
