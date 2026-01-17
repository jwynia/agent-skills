---
name: task-decomposition
description: "Transform overwhelming development tasks into manageable units. This skill should be used when the user says 'task too big', 'can't estimate', 'overwhelmed by scope', 'where do I start', 'epic needs breakdown', or has dependency problems. Keywords: decomposition, breakdown, estimate, scope, INVEST, vertical slice, spike, dependencies."
license: MIT
compatibility: Works with any project. Integrates with github-agile for tracking decomposed work.
metadata:
  author: jwynia
  version: "1.0"
---

# Task Decomposition Diagnostic

Transform overwhelming development tasks into manageable units by respecting cognitive limits, creating clear boundaries, and enabling parallel work. Tasks properly decomposed achieve 3x higher completion rates and 60% fewer defects.

## When to Use This Skill

Use this skill when:
- A task feels too big to estimate
- Unsure where to start
- Blocked by dependencies
- Task keeps growing (scope creep)
- Need to break down an epic or feature

Do NOT use this skill when:
- Task is already small and clear
- Doing implementation work
- Architecture decisions needed (use system-design)

## Core Principle

**The goal isn't more tasks—it's the right tasks.** Tasks small enough to understand completely, large enough to deliver value, independent enough to avoid blocking.

## Quick Reference: Cognitive Limits

| Limit | Threshold | Implication |
|-------|-----------|-------------|
| Working memory | 7±2 items | Max concepts per task |
| Context switch recovery | 23 minutes | Minimize task switching |
| Files examined | 15-20 max | Bound task scope |
| Days before completion drops | 2-3 days | Keep tasks under this |

## Task Duration Success Rates

| Duration | Completion Rate |
|----------|-----------------|
| < 2 hours | 95% |
| 2-4 hours | 90% |
| 4-8 hours (1 day) | 80% |
| 2-3 days | 60% |
| 1 week | 35% |
| > 2 weeks | <10% |

## Diagnostic States

### TD1: Too Big to Understand

**Symptoms:** Estimates range wildly, can't hold all requirements in mind, more than 7 concepts to track

**Interventions:**
- Apply INVEST criteria: Independent, Negotiable, Valuable, Estimable, Small, Testable
- Use vertical slicing (each slice is independently deployable)
- Apply walking skeleton (minimal end-to-end first)

### TD2: No Clear Entry Point

**Symptoms:** Multiple valid starting points, paralysis, everything seems connected

**Interventions:**
- Front-load risk: start with highest-uncertainty items
- Tracer bullet: minimal proof of concept
- Find the walking skeleton: thinnest slice through all layers

### TD3: Dependency Problems

**Symptoms:** "Blocked on X", diamond dependencies, coordination overhead

**Interventions:**
- Interface contracts: define API, mock while implementing
- Feature flags: deploy independently, enable when ready
- Branch by abstraction: create layer, swap implementations

### TD4: No Clear Done Criteria

**Symptoms:** "Almost done" forever, no way to verify completion

**Interventions:**
- Define acceptance criteria (Given/When/Then)
- Time-box to force prioritization
- Define explicit out-of-scope items

### TD5: Scope Creep

**Symptoms:** Task keeps growing, "while we're here" additions

**Interventions:**
- Freeze scope, spawn new tasks for additions
- Define minimum viable version
- Ship smallest version that solves the problem

### TD6: Need Spike First

**Symptoms:** Estimate variance > 4x, new technology, multiple approaches

**Interventions:**
- Time-boxed spike (8 hours max)
- Deliverables: options, POC, trade-offs, revised estimate
- Spike then implement pattern

## Decomposition Patterns

### Vertical Slicing (Preferred for Features)

```
Feature: User Profile Management

Slice 1: View basic profile (4h)
  - UI: Profile display
  - API: GET /profile
  - DB: Read profile

Slice 2: Edit profile name (6h)
  - UI: Edit dialog
  - API: PATCH /profile/name
  - DB: Update profile

Each slice is independently deployable
```

### Walking Skeleton (For New Systems)

```
Minimal end-to-end first:
1. Hello World page
2. One GET endpoint
3. Single table
4. Basic deploy

Then flesh out incrementally
```

### Tracer Bullet (Validate Architecture)

```
Step 1: Minimal Service A (1h) - Hardcoded response
Step 2: Minimal Service B (1h) - Simple transformation
Step 3: Integrate (2h) - Prove they communicate

Total: 4 hours to decision point
```

## Estimation Techniques

### Complexity Sizing (Fibonacci)

| Points | Meaning |
|--------|---------|
| 1 | Trivial, < 1 hour |
| 2 | Simple, 1-2 hours |
| 3 | Standard, 2-4 hours |
| 5 | Moderate, 4-8 hours |
| 8 | Complex, 1-2 days |
| 13 | Very complex, 2-3 days |
| 21 | **Too large, must decompose** |

### Three-Point Estimation

```
O = Optimistic (everything perfect)
L = Likely (normal case)
P = Pessimistic (major issues)

PERT estimate: (O + 4L + P) / 6
```

## Anti-Patterns

### Big Bang Delivery
Building complete system before any delivery.
**Fix:** Vertical slices, incremental value.

### Technical Tasks Without Value
"Set up database," "Create service layer."
**Fix:** Include in feature tasks: "User can view products (includes DB)."

### Research Forever
Unbounded investigation.
**Fix:** Time-boxed spikes with deliverables.

### Perfect Decomposition
Over-analyzing before starting.
**Fix:** Decompose next 2 weeks. Details for later work emerge.

## Decomposition Checklist

Before starting any task:

- [ ] Can hold all requirements in working memory?
- [ ] Duration under 2-3 days?
- [ ] Clear acceptance criteria exist?
- [ ] Dependencies identified and broken where possible?
- [ ] Can be completed independently?
- [ ] Delivers verifiable value?
- [ ] Estimate confidence is high?

If any "no" → further decomposition needed.

## Related Skills

- **github-agile** - Track decomposed work as issues
- **system-design** - Understand architectural boundaries
- **requirements-analysis** - Clarify unclear requirements
- **code-review** - Review after implementation
