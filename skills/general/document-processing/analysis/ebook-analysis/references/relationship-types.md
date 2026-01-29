# Relationship Types

This reference defines the relationship types used to link concepts. Use these definitions to guide relationship creation.

## Overview

| Relationship | Meaning | Directionality |
|--------------|---------|----------------|
| INFLUENCES | A affects B | Directed (A→B) |
| SUPPORTS | A provides evidence for B | Directed (A→B) |
| CONTRADICTS | A conflicts with B | Bidirectional |
| COMPOSED_OF | A contains B as component | Directed (A→B) |
| DERIVES_FROM | A is derived from B | Directed (A→B) |

---

## INFLUENCES

**Definition:** Concept A has a causal or correlational effect on Concept B. A change in A would affect B.

**When to Use:**
- A causes B to happen
- A enables or facilitates B
- A inhibits or prevents B
- A is a precondition for B

**Strength Values:**
- **Positive (+0.1 to +1.0):** A increases/enables B
- **Negative (-0.1 to -1.0):** A decreases/inhibits B
- **Strong (±0.7 to ±1.0):** Direct causal relationship
- **Moderate (±0.4 to ±0.6):** Significant but indirect
- **Weak (±0.1 to ±0.3):** Correlational or minor

**Examples:**
- "Trust" INFLUENCES→ "Collaboration" (strength: +0.8)
- "Fear" INFLUENCES→ "Risk-taking" (strength: -0.7)
- "Shared identity" INFLUENCES→ "Community cohesion" (strength: +0.9)

**Not INFLUENCES:**
- A simply mentions B (use context, not relationship)
- A is a component of B (use COMPOSED_OF)
- A is evidence for B (use SUPPORTS)

---

## SUPPORTS

**Definition:** Concept A provides evidence, validation, or backing for Concept B. A makes B more credible or justified.

**When to Use:**
- A is empirical evidence for B
- A is an example that demonstrates B
- A is a theoretical justification for B
- A is a citation or reference for B

**Strength Values:**
- **Strong:** Direct empirical evidence or proof
- **Moderate:** Good example or theoretical support
- **Weak:** Tangential or partial support

**Examples:**
- "Research study X" SUPPORTS→ "Spaced repetition improves retention"
- "Case study of Company Y" SUPPORTS→ "Community-led growth works"
- "Historical precedent Z" SUPPORTS→ "Revolutions follow pattern P"

**Not SUPPORTS:**
- A causes B to happen (use INFLUENCES)
- A is part of B (use COMPOSED_OF)
- B is derived from A (use DERIVES_FROM)

---

## CONTRADICTS

**Definition:** Concept A conflicts with, opposes, or is incompatible with Concept B. They cannot both be true in the same context.

**When to Use:**
- A and B make opposite claims
- A and B recommend incompatible approaches
- Evidence for A undermines B
- A and B are mutually exclusive

**Strength Values:**
- **Strong:** Direct logical contradiction
- **Moderate:** Significant tension or incompatibility
- **Weak:** Partial tension or contextual conflict

**Types of Contradiction:**
1. **Theoretical:** Different claims about how things work
2. **Practical:** Different recommendations for action
3. **Contextual:** True in different contexts but not compatible

**Examples:**
- "Move fast and break things" CONTRADICTS↔ "Measure twice, cut once"
- "Communities need strong leadership" CONTRADICTS↔ "Communities should be self-organizing"
- "Research shows X" CONTRADICTS↔ "Research shows not-X"

**Bidirectionality:**
CONTRADICTS is bidirectional - if A contradicts B, then B contradicts A.

**Not CONTRADICTS:**
- A is simply different from B (difference ≠ contradiction)
- A and B apply in different contexts (may just be contextual)
- A and B are different levels of abstraction

---

## COMPOSED_OF

**Definition:** Concept A contains Concept B as a component, element, or part. B is nested within A.

**When to Use:**
- B is a named component of framework A
- B is a step in process A
- B is a required element of A
- A explicitly includes B in its definition

**Component Types:**
- **Prerequisite:** B must exist before A
- **Component:** B is a part of A
- **Variant:** B is a subtype of A

**Examples:**
- "Hero's journey" COMPOSED_OF→ "Departure"
- "Hero's journey" COMPOSED_OF→ "Initiation"
- "Hero's journey" COMPOSED_OF→ "Return"
- "Trust" COMPOSED_OF→ "Competence trust" (variant)
- "Trust" COMPOSED_OF→ "Character trust" (variant)

**Not COMPOSED_OF:**
- B merely relates to A (use INFLUENCES or other)
- B is evidence for A (use SUPPORTS)
- B causes A (use INFLUENCES)

---

## DERIVES_FROM

**Definition:** Concept A is logically derived from, emerges from, or is a consequence of Concept B. A exists because of B.

**When to Use:**
- A is a logical conclusion from B
- A emerges from B in a system
- A is an application of B to a context
- A is a specialization of B

**Derivation Types:**
- **Logical conclusion:** A follows from B by reasoning
- **Emergent property:** A arises from B in complex systems
- **Synthesis:** A combines multiple sources including B

**Examples:**
- "Community guidelines" DERIVES_FROM→ "Shared values"
- "Specific onboarding tactics" DERIVES_FROM→ "Engagement theory"
- "Leadership practices" DERIVES_FROM→ "Trust principles"

**Not DERIVES_FROM:**
- B influences A (that's INFLUENCES)
- A is part of B (that's the reverse - B COMPOSED_OF A)
- A is evidence for B (that's the reverse - A SUPPORTS B)

---

## Creating Relationships

### When to Create a Relationship

Create a relationship when:
1. The connection is explicitly stated in the source
2. The connection is strongly implied by context
3. The connection would be useful for synthesis and querying

Do NOT create relationships:
- Based on mere co-occurrence in text
- When the connection is trivial or obvious
- When evidence for the connection is weak

### Relationship Density

Aim for:
- Every concept linked to at least 1-2 others
- Key concepts (hubs) linked to many others
- Both within-book and cross-book relationships

Avoid:
- Orphan concepts with no relationships
- Over-connected concepts (>10 relationships may indicate over-extraction)
- Circular relationships without clear semantics

### Relationship Confidence

Track confidence in relationships:
- **High (0.8-1.0):** Explicitly stated in source
- **Medium (0.5-0.7):** Strongly implied or inferred
- **Low (0.2-0.4):** Reasonable inference, less certain

Flag low-confidence relationships for human review.

---

## Cross-Book Relationships

When analyzing multiple books, additional patterns emerge:

### Agreement
Both authors say A INFLUENCES B → Stronger confidence

### Complementarity
Author 1 says A INFLUENCES B
Author 2 says B INFLUENCES C
Combined: A → B → C pathway

### Contradiction
Author 1 says A SUPPORTS claim X
Author 2 says B CONTRADICTS claim X
Flag for synthesis discussion

### Extension
Author 1 defines framework F
Author 2 applies F to new context
DERIVES_FROM relationship across books

---

## Relationship Examples by Domain

### Community Building
- "Trust" INFLUENCES→ "Participation" (+0.8)
- "Shared identity" INFLUENCES→ "Retention" (+0.7)
- "Explicit guidelines" SUPPORTS→ "Safe participation"
- "Top-down control" CONTRADICTS↔ "Self-organization"
- "Engagement ladder" COMPOSED_OF→ "Lurker stage"

### Learning
- "Active recall" INFLUENCES→ "Retention" (+0.9)
- "Spacing effect" SUPPORTS→ "Spaced repetition works"
- "Massed practice" CONTRADICTS↔ "Distributed practice"
- "Learning pyramid" COMPOSED_OF→ "Reading (10%)"
- "Retrieval practice" DERIVES_FROM→ "Testing effect research"

### Leadership
- "Psychological safety" INFLUENCES→ "Team performance" (+0.8)
- "Google Project Aristotle" SUPPORTS→ "Safety matters"
- "Servant leadership" CONTRADICTS↔ "Command-and-control"
- "Situational leadership" COMPOSED_OF→ "Directing style"
- "Specific feedback tactics" DERIVES_FROM→ "Growth mindset theory"
