---
name: system-design
description: "Diagnose design problems and guide architecture decisions for software projects. This skill should be used when the user asks to 'design the system', 'plan the architecture', 'make technology choices', 'create ADRs', 'define components', or needs help translating requirements into architecture. Keywords: architecture, design, components, ADR, walking skeleton, trade-offs, integration, YAGNI."
license: MIT
compatibility: Pairs with requirements-analysis for input and implementation for output.
metadata:
  author: jwynia
  version: "1.0"
---

# System Design

Diagnose system design problems in software projects. Help translate validated requirements into architecture decisions, component designs, and interface definitions without over-engineering or missing critical integration points.

## When to Use This Skill

Use this skill when:
- Requirements are validated and ready for architecture
- Making technology or framework choices
- Designing component boundaries and interfaces
- Planning integration points
- Documenting architectural decisions

Do NOT use this skill when:
- Requirements are unclear (use requirements-analysis first)
- Writing implementation code
- Pure research without building intent

## Core Principle

**Design emerges from constraints. Every architectural decision is a trade-off against something else. Make trade-offs explicit before they become bugs.**

## Diagnostic States

### State SD0: No Requirements Clarity

**Symptoms:**
- Starting architecture before requirements are clear
- Can't articulate what problem architecture serves
- Technology choices made before needs understood

**Interventions:**
- Return to requirements-analysis skill
- At minimum: write one paragraph describing the problem, list 3-5 must-dos, list real constraints

### State SD1: Under-Engineering

**Symptoms:**
- No separation of concerns
- "I'll refactor later" for everything
- Building without mental model of how pieces connect

**Key Questions:**
- What happens when X fails?
- Where does data come from and where does it go?
- What's the most complex operation?

**Interventions:**
- Data flow mapping: trace data from entry to exit
- Error case enumeration for critical paths
- Component identification: what are the major pieces?

### State SD2: Over-Engineering

**Symptoms:**
- Abstracting for hypothetical futures
- Microservices for a solo project
- Patterns without problems

**Key Questions:**
- What problem does this abstraction solve TODAY?
- What's the simplest thing that could work?
- Would you bet money this flexibility will be needed?

**Interventions:**
- YAGNI audit: flag anything serving hypothetical needs
- Rule of three: don't abstract until you see the pattern three times

### State SD3: Missing Integration Points

**Symptoms:**
- Building in isolation without considering connections
- "I'll figure out how to connect them later"
- External dependencies discovered late

**Key Questions:**
- What does this component need from outside itself?
- How does data enter and leave the system?
- What about auth, logging, monitoring, deployment?

**Interventions:**
- Interface-first design for critical boundaries
- Dependency inventory: what's external?
- Integration checklist: auth, config, logging, errors, deployment

### State SD4: Risky Decisions Unidentified

**Symptoms:**
- No explicit architectural decision records
- "I just went with what I know"
- Decisions made implicitly or by default

**Key Questions:**
- Which decisions would be expensive to reverse?
- Why this approach instead of alternatives?
- Where are you relying on assumptions vs. knowledge?

**Interventions:**
- ADR (Architecture Decision Record) for significant decisions
- Reversal cost assessment: easy/moderate/hard to change
- Decision audit: list every technology/pattern choice and why

### State SD5: No Walking Skeleton

**Symptoms:**
- All components designed to completion before any integration
- No end-to-end path through the system
- Integration deferred until "everything is ready"

**Key Questions:**
- What's the thinnest path through the whole system?
- Can you demo one thing working end-to-end?
- What's the riskiest integration?

**Interventions:**
- Walking skeleton definition: minimal end-to-end path
- Risk-first integration: prove risky connections early

### State SD6: Design Validated

**Indicators:**
- Architecture supports requirements without excess
- Risky decisions documented with rationale
- Integration points identified
- Walking skeleton defined
- Clear path to implementation

## Anti-Patterns

### The Architecture Astronaut
**Problem:** Designing for scale and flexibility you'll never need.
**Fix:** YAGNI audit. For every abstraction, ask "what problem does this solve TODAY?"

### The Implicit Decision
**Problem:** Architecture by accident. Decisions made by default.
**Fix:** ADRs for any decision expensive to reverse.

### The Big Bang Integration
**Problem:** Building all components in isolation, connecting at the end.
**Fix:** Walking skeleton first. Integrate early and often.

### The Golden Hammer
**Problem:** Using familiar technology regardless of fit.
**Fix:** Match technology to problem. Let constraints guide choices.

### The Premature Optimization
**Problem:** Designing for performance problems you don't have.
**Fix:** Design for clarity first. Measure before optimizing.

### The Resume-Driven Development
**Problem:** Choosing technologies to learn them, not because they fit.
**Fix:** Be honest. If learning, acknowledge the cost.

## Example Interaction

**Developer:** "I've got requirements for my static site generator. Now I need to figure out the architecture."

**Approach:**
1. Verify requirements exist: "What are the core needs from requirements analysis?"
2. Check for over-engineering: "Are you thinking about plugins, themes, or extensibility?"
3. Guide to simpler design if needed
4. Work through ADRs for key decisions
5. Define walking skeleton: "What's the thinnest path? One markdown file to one HTML file?"

## Output Persistence

Persist artifacts to `docs/design/` or `docs/architecture/`:

- Design Context Brief (`assets/design-context.md` template)
- Architecture Decision Records (`assets/adr.md` template)
- Component Map (`assets/component-map.md` template)
- Walking Skeleton Definition (`assets/walking-skeleton.md` template)

## Health Check Questions

1. Does this design serve the requirements without excess?
2. Which decisions would be expensive to reverse? Are they documented?
3. What's the simplest thing that could work?
4. Where are the integration points? What could go wrong?
5. Can I build a walking skeleton that proves the architecture?
6. Am I designing for today's problem or hypothetical futures?

## Related Skills

- **requirements-analysis** - Provides validated requirements as input
- **brainstorming** - Explore multiple architectures before committing
- **research** - Investigate technologies before ADR
