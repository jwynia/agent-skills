---
name: requirements-analysis
description: "Diagnose requirements problems and guide discovery of real needs and constraints. This skill should be used when the user asks to 'analyze requirements', 'clarify what to build', 'define the problem', 'scope a project', 'prioritize features', or needs help distinguishing stated wants from underlying problems. Keywords: requirements, problem statement, scope, constraints, needs, prioritization, MoSCoW, discovery."
license: MIT
compatibility: Works with any software project. Pairs with system-design skill for handoff.
metadata:
  author: jwynia
  version: "1.0"
---

# Requirements Analysis

Diagnose requirements-level problems in software projects. Help distinguish stated wants from underlying problems, discover real constraints, and avoid premature solution thinking.

## When to Use This Skill

Use this skill when:
- Starting a new project without clear problem definition
- Requirements feel vague or untestable
- Scope keeps expanding without bounds
- Constraints are unclear or unvalidated
- Building features without understanding the underlying need

Do NOT use this skill when:
- Requirements are already validated and specific
- Working on implementation (use system-design instead)
- Doing pure technical research without building intent

## Core Principle

**Requirements are hypotheses about what will solve a problem. The goal is not to document requirements but to discover whether they address the actual problem.**

## Diagnostic States

### State RA0: No Problem Statement

**Symptoms:**
- Starting with "I want to build X" (solution, not problem)
- Can't articulate who has what problem
- Feature list without problem grounding

**Key Questions:**
- What happens if this doesn't exist? Who suffers?
- What are people doing today instead?
- What triggered thinking about this now?

**Interventions:**
- Jobs-to-be-Done self-interview: "When I [situation], I want to [motivation], so I can [outcome]"
- Problem archaeology: trace the origin back to a specific frustration
- "Five users" test: name 5 specific people who would benefit

### State RA1: Solution-First Thinking

**Symptoms:**
- Requirements describe implementation ("needs a database", "should use React")
- Can't explain requirements without referencing technology
- Technology choice before problem clarity

**Key Questions:**
- If that technology didn't exist, what would be needed?
- What outcome does this feature produce?
- What's the need behind the feature?

**Interventions:**
- Function extraction: rewrite requirements starting with "The system must [verb]..." without technology words
- Constraint vs. preference distinction: is this technology required, or just familiar?

### State RA2: Vague Needs

**Symptoms:**
- "Users should be able to..." without specifics
- Requirements that can't be tested
- Adjective requirements: "fast", "easy", "intuitive"
- Can't describe what "done" looks like

**Key Questions:**
- How would you know if this requirement is met?
- What's the minimum that would satisfy this need?
- Can you give a specific example scenario?

**Interventions:**
- Specificity ladder: who specifically? doing what specifically? when specifically?
- Acceptance scenario writing: "Given X, when Y, then Z"
- Testability check: if you can't test it, you don't understand it yet

### State RA3: Hidden Constraints

**Symptoms:**
- Discovering blockers mid-implementation
- "Oh, I forgot to mention..."
- Assumptions treated as facts
- Surprise dependencies appearing late

**Key Questions:**
- What's definitely true about this context? (Real constraints)
- What are you assuming is true? (Assumptions to validate)
- What would kill this project if it turned out to be true?
- What resources/skills/time do you actually have?

**Interventions:**
- Constraint inventory: list budget, time, skills, dependencies, integrations
- Assumption mapping: validated vs. unvalidated assumptions
- Risk pre-mortem: "It's 6 months later and this failed. Why?"

### State RA4: Scope Creep

**Symptoms:**
- Requirements expanding faster than satisfied
- "While we're at it..." additions
- Can't distinguish core from nice-to-have
- Every feature feels equally important

**Key Questions:**
- What's the smallest thing that would be useful?
- What could you cut and still solve the core problem?
- If you could only ship 3 things, what are they?

**Interventions:**
- MoSCoW prioritization: Must/Should/Could/Won't
- "Walking skeleton" identification: thinnest useful version
- Force-rank exercise: strict ordering, no ties

### State RA5: Requirements Validated

**Indicators:**
- Can articulate problem, who has it, and why current solutions fail
- Requirements are testable and specific
- Constraints are explicit (real vs. assumed)
- Scope is bounded with clear V1 definition

**Next Step:** Hand off to system-design skill with Validated Requirements Document

## Diagnostic Process

1. **Listen for state symptoms** - Which state describes the current situation?
2. **Start at the earliest problem state** - If RA0 symptoms exist, don't skip to RA2
3. **Ask key questions** - Use questions for that state to gather information
4. **Apply interventions** - Work through exercises and templates
5. **Validate before moving on** - Check indicators for each state before progressing
6. **Produce artifacts** - Use templates to capture decisions

## Anti-Patterns

### The Solution Specification
**Problem:** Writing requirements that describe implementation, not needs.
**Fix:** For each requirement, ask "could this be satisfied a different way?" If yes, you may have captured implementation, not need.

### The Stakeholder Fiction
**Problem:** Solo developer imagining requirements instead of discovering them.
**Fix:** If building for yourself, be honest about YOUR needs. Don't invent fictional users.

### The Infinite Backlog
**Problem:** Requirements that grow without prioritization.
**Fix:** Force-rank. If you could only ship ONE thing, what is it?

### The Constraint Blindness
**Problem:** Not inventorying real constraints, then hitting them mid-build.
**Fix:** Explicit constraint inventory BEFORE requirements.

### The Feature Transplant
**Problem:** Copying features from existing products without understanding why they exist.
**Fix:** For each "borrowed" feature, articulate what problem it solves in YOUR context.

## Example Interaction

**Developer:** "I want to build a static site generator."

**Approach:**
1. Identify State RA0 (No Problem Statement) - starting with solution
2. Ask: "What problem are you solving? What's frustrating about existing static site generators?"
3. Developer reveals: "I'm tired of the complexity. I just want to write markdown and get HTML."
4. Now we have a problem: "Existing tools require too much configuration for simple use cases"
5. Continue: "Who else has this problem? What do you do today instead?"
6. Work through states until requirements are validated

## Output Persistence

Persist artifacts to maintain work across sessions:

- Problem Statement Brief (`assets/problem-statement.md` template)
- Need Hierarchy (`assets/need-hierarchy.md` template)
- Constraint Inventory (`assets/constraint-inventory.md` template)
- Validated Requirements Document (handoff to system-design)

**File naming:** `requirements-{project-name}.md` or `docs/requirements/`

## Health Check Questions

1. Am I describing a problem or a solution?
2. Could I explain this to someone unfamiliar?
3. How would I test if this requirement is satisfied?
4. What assumptions am I making that I haven't validated?
5. Is this scope achievable with my actual constraints?
6. What's explicitly NOT in scope?

## Related Skills

- **system-design** - Receives validated requirements, produces architecture
- **brainstorming** - Explore multiple solutions before committing
- **research** - Fill domain knowledge gaps blocking requirements
