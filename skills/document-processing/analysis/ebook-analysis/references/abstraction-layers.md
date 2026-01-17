# Abstraction Layers (0-4)

This reference defines the five abstraction layers used to classify concepts from most abstract (Layer 0) to most concrete (Layer 4). Use these definitions to guide classification.

## Overview

| Layer | Name | Scope | Example Domain: Community Building |
|-------|------|-------|-----------------------------------|
| 0 | Foundational | Universal human truths | "Humans seek belonging" |
| 1 | Theoretical | Domain-specific theory | "Communities require shared purpose" |
| 2 | Strategic | Approaches and frameworks | "The funnel model of engagement" |
| 3 | Tactical | Specific methods | "Onboarding sequences" |
| 4 | Specific | Concrete implementations | "Use Discourse for forums" |

---

## Layer 0: Foundational

**Definition:** Universal principles that apply across domains and cultures. These are the bedrock truths about human nature, systems, or reality.

**Characteristics:**
- Domain-agnostic (applies everywhere)
- Timeless (true across eras)
- About fundamental nature
- Few in number per domain

**Questions to Identify Layer 0:**
- Would this be true in any culture or time period?
- Does this apply beyond the specific domain discussed?
- Is this about human nature or universal systems?

**Examples:**
- "Humans form groups for survival advantage"
- "Complex systems resist change"
- "Scarcity increases perceived value"
- "Trust enables cooperation"

**Not Layer 0:**
- Anything that requires specific context
- Concepts tied to modern technology or practices
- Domain-specific frameworks

---

## Layer 1: Theoretical

**Definition:** Domain-specific theory that explains how the foundational principles manifest in a particular field. These are the "laws" of the domain.

**Characteristics:**
- Specific to a domain (communities, learning, leadership, etc.)
- Explanatory (tells why things work in this domain)
- Forms basis for strategies
- Multiple theories may exist

**Questions to Identify Layer 1:**
- Is this specific to one domain but general within it?
- Does this explain how foundational principles apply here?
- Would experts in this field recognize this as theoretical foundation?

**Examples (Community Building):**
- "Communities form around shared identity"
- "Engagement follows the commitment-consistency principle"
- "Network effects drive community value"

**Examples (Learning):**
- "Memory consolidates during sleep"
- "Active recall strengthens retention"
- "Spacing improves long-term learning"

**Not Layer 1:**
- Universal truths (those are Layer 0)
- Specific practices or methods (those are Layer 3-4)
- Frameworks with multiple components (those are often Layer 2)

---

## Layer 2: Strategic

**Definition:** Approaches, frameworks, and models that translate theory into actionable direction. These provide structure for how to think about problems in the domain.

**Characteristics:**
- Has named components or phases
- Provides decision-making guidance
- Can be implemented multiple ways
- Often visualizable (diagrams, matrices)

**Questions to Identify Layer 2:**
- Is this a framework or model?
- Does it have multiple components or stages?
- Does it guide how to approach problems?

**Examples (Community Building):**
- "The community lifecycle: formation, growth, maturation, renewal"
- "The engagement ladder: lurker → participant → contributor → leader"
- "The three pillars of community: connection, content, collaboration"

**Examples (Product Development):**
- "Build-Measure-Learn cycle"
- "The MVP approach"
- "Jobs to be done framework"

**Not Layer 2:**
- Single techniques (those are Layer 3)
- Theoretical explanations (those are Layer 1)
- Tool recommendations (those are Layer 4)

---

## Layer 3: Tactical

**Definition:** Specific methods, techniques, and practices that implement strategies. These are concrete enough to be directly actionable but not tied to specific tools.

**Characteristics:**
- Directly actionable
- Can be done without specific tools
- Has clear success criteria
- Reusable across contexts

**Questions to Identify Layer 3:**
- Can someone implement this directly?
- Is it independent of specific tools?
- Would this work with various implementations?

**Examples (Community Building):**
- "Create onboarding sequences for new members"
- "Host regular events at consistent times"
- "Recognize contributions publicly"
- "Pair new members with experienced mentors"

**Examples (Writing):**
- "Outline before drafting"
- "Read your work aloud for rhythm"
- "Start with the end in mind"

**Not Layer 3:**
- Tool-specific instructions (those are Layer 4)
- High-level approaches (those are Layer 2)
- Explanations without actions (those are Layer 1)

---

## Layer 4: Specific

**Definition:** Concrete implementations tied to specific tools, platforms, time periods, or contexts. These are the most actionable but also the most likely to become outdated.

**Characteristics:**
- Names specific tools, platforms, or products
- May include specific numbers or thresholds
- Time-bound or context-bound
- Most perishable layer

**Questions to Identify Layer 4:**
- Does this name a specific tool or platform?
- Would this become outdated if technology changes?
- Is this tied to a particular time, place, or organization?

**Examples (Community Building):**
- "Use Discourse for forums"
- "Set up a #introductions channel in Slack"
- "Send the welcome email at 9am local time"
- "Aim for 30% response rate in the first week"

**Examples (Software Development):**
- "Use React for the frontend"
- "Deploy to AWS Lambda"
- "Set MAX_CONNECTIONS to 100"

**Not Layer 4:**
- Generic techniques without tool names (those are Layer 3)
- Frameworks or models (those are Layer 2)

---

## Layer Assignment Guidelines

### Default to Higher Layers

When uncertain, assign to the higher (more abstract) layer. Reasons:
- Abstract concepts are more reusable
- They're more likely to remain valid over time
- Specifics can always be derived from abstractions

### Consider the Author's Intent

The same phrase can exist at different layers depending on context:

- "Use events to build community" (Layer 3 - tactic)
- "Events create shared experiences that reinforce identity" (Layer 1 - theory)
- "Host a monthly Zoom meetup on the first Thursday" (Layer 4 - specific)

### Track Layer Distribution

A well-extracted book should have concepts across multiple layers:
- Few Layer 0 concepts (2-5 typically)
- More Layer 1-2 concepts (the book's theoretical contribution)
- Many Layer 3-4 concepts (practical advice)

If extraction is heavily weighted to one layer, review for missed concepts at other layers.

---

## Cross-Reference with Concept Types

Certain concept types cluster at certain layers:

| Layer | Common Types |
|-------|-------------|
| 0 | Principles |
| 1 | Principles, Mechanisms |
| 2 | Patterns, Strategies |
| 3 | Tactics, Strategies |
| 4 | Tactics |

This is guidance, not rule. A Layer 0 mechanism exists ("Reciprocity operates through obligation"), as does a Layer 4 pattern ("The onboarding flow: welcome email → profile setup → first action").

---

## When Layer is Unclear

1. Look at surrounding context for abstraction level
2. Consider how reusable/portable the concept is
3. Note uncertainty in the concept record
4. Prefer higher layers when genuinely ambiguous
5. Flag for human review if the distinction matters for synthesis
