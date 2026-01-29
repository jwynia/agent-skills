# Orchestrator Skills

Orchestrator skills coordinate multiple other skills into autonomous workflows. Unlike diagnostic skills (which identify problems) or generator skills (which produce output), orchestrators manage multi-step processes with evaluation loops.

## What Makes an Orchestrator Different

| Aspect | Diagnostic Skill | Orchestrator Skill |
|--------|-----------------|-------------------|
| **Purpose** | Identify problem state | Execute multi-skill workflow |
| **Sub-skill relationship** | Routes to other skills | Invokes other skills sequentially |
| **Iteration** | Single diagnostic pass | Loops until quality criteria met |
| **Output** | Diagnosis + recommendations | Finished artifact |
| **Autonomy** | Diagnoses, human decides | Executes autonomously |

## Architecture

Orchestrators embed condensed evaluation criteria from sub-skills rather than making nested Skill tool calls. This enables:

1. **Autonomous execution** - No human approval needed between steps
2. **Context persistence** - State tracked across scenes/iterations
3. **Quality gates** - Pass/fail criteria determine when to proceed
4. **Iteration limits** - Prevents infinite loops

## Frontmatter Extensions

Orchestrator skills require additional frontmatter fields:

```yaml
metadata:
  type: orchestrator           # Required: identifies as orchestrator
  mode: generative             # Output mode
  orchestrates:                # Skills this orchestrator coordinates
    - skill-one
    - skill-two
  pass_order:                  # Execution sequence for evaluation
    - skill-one
    - skill-two
  max_iterations: 3            # Per-pass iteration limit
  global_max_iterations: 50    # Total iteration cap
```

## Evaluation Loop Pattern

All orchestrators follow this core pattern:

```
For each unit of work (scene, chapter, etc.):
    Draft initial version

    For each pass in pass_order:
        Evaluate against pass criteria
        If FAIL and iterations < max:
            Apply revision
            Re-evaluate
        Else:
            Proceed to next pass

    Accumulate context for next unit
```

## Composite Scoring

Orchestrators use weighted scoring to determine outcomes:

| Composite Score | Outcome |
|-----------------|---------|
| >= 80 | ACCEPT - Proceed to next unit |
| 60-79 | REVISE - Targeted fixes, re-evaluate |
| 40-59 | REWRITE - Significant rework needed |
| < 40 | REJECT - Full regeneration required |

## Anti-Patterns

### The Infinite Polisher
Keeps iterating forever seeking perfection.
**Fix:** Hard iteration limits, accept at threshold.

### The Pass Skipper
Jumps to later passes before earlier ones complete.
**Fix:** Enforced pass ordering.

### The Context Amnesiac
Loses track of accumulated context between units.
**Fix:** Explicit context accumulation, progress tracker.

### The Cascade Blind Spot
Fixes one skill's issues, breaks another's.
**Fix:** Re-evaluate all skills after any fix.

### The Silent Failer
Hits limits without documenting remaining issues.
**Fix:** Log all limit exits with categorized issues.

## Current Orchestrators

| Skill | Purpose | Sub-skills |
|-------|---------|------------|
| chapter-drafter | Draft polished chapters from outlines | scene-sequencing, character-arc, cliche-transcendence, dialogue, prose-style |

## Creating New Orchestrators

1. Identify the workflow (what units? what passes?)
2. Define pass ordering (structural to detail)
3. Extract pass criteria from sub-skills
4. Set iteration limits
5. Create progress tracker template
6. Document context accumulation strategy
