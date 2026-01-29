---
name: brainstorming
description: "Expand seeds and escape convergent ideation. Use when you have the start of an idea and want to grow it, when brainstorming produces the same ideas every time, or when you need to explore possibility space."
license: MIT
metadata:
  author: jwynia
  version: "1.1"
  sources:
    - "Steven Johnson, Where Good Ideas Come From (2010)"
---

# Brainstorming: Ideation Skill

You help people expand ideas and escape convergent thinking across any domain—software, business, creative projects, or personal decisions.

## Core Principle

**Ideas need room to grow and things to collide with.** Sometimes you're stuck and need to escape a rut. Sometimes you have a seed and need to expand it. Both are ideation problems with different entry points.

Two modes, one goal: explore possibility space rather than settling for the first available option.

## Entry Diagnostic

Before diving in, identify where you're starting:

| Starting Point | Signals | Mode |
|----------------|---------|------|
| **Stuck** | Same ideas keep surfacing. All options feel like variations. "We've tried everything." Evaluation before exploration. | → Escape Velocity Protocol |
| **Seed** | Have the start of something. Want to see what it could become. Looking for adjacent moves or missing pieces. | → Seed Expansion Protocol |
| **Unclear** | Not sure if stuck or just early. Have something but not sure if it's good. | → Start with Seed Expansion; switch to Escape Velocity if you hit convergence |

**Key question:** Are you trying to get OUT of something (stuck) or grow INTO something (seed)?

---

## The Convergence Problem (Stuck Mode)

Ideas cluster because they match expected patterns on multiple dimensions. When your solution uses the obvious WHO doing the obvious WHAT at the obvious SCALE via the obvious METHOD—that's why it feels predictable.

**The key test:** Could three different people brainstorming independently produce the same list? If yes, you haven't diverged yet.

## The States

### State B1: Convergence Blindness

**Symptoms:**
- First ideas feel "right" immediately
- All ideas cluster around same approach
- Session produces variations on one theme
- "We already know what to do, we just need to pick"

**Key Questions:**
- What's the most obvious solution? Have you named it explicitly?
- Would three different people produce the same list?
- Are you exploring the space or confirming an intuition?
- How many fundamentally different APPROACHES (not variations) are on the table?

**Interventions:** Run Default Enumeration (Phase 1). Name the cluster before trying to escape it. You cannot escape defaults you haven't made visible.

---

### State B2: Function Lock

**Symptoms:**
- Ideas all take the same form
- Discussion assumes the solution type ("We need an app that...")
- Can't see alternatives because solution-form is assumed
- "We need X" rather than "We need to accomplish Y"

**Key Questions:**
- What must this accomplish? (Not: what should it be?)
- Could something completely different achieve the same outcome?
- What problem are you actually solving vs. what solution are you attached to?
- What constraints are real vs. assumed?

**Interventions:** Run Function Extraction (Phase 2). Separate WHAT from HOW. Generate 5 alternatives per function, not per solution.

---

### State B3: Axis Collapse

**Symptoms:**
- Ideas differ cosmetically but share underlying structure
- "Same idea wearing different clothes"
- Variations on WHO but same WHAT/WHEN/HOW
- Easy to categorize all ideas into one bucket

**Key Questions:**
- What's the obvious WHO for this? Have you tried a completely different who?
- What's the obvious WHEN? What if it was 10x slower? Instant? Recurring vs. one-time?
- What's the obvious SCALE? What about 10x bigger? 10x smaller?
- What's the obvious METHOD? What's a completely different approach?

**Interventions:** Run Axis Mapping (Phase 3). Map the default solution on four axes. Rotate at least one axis to break the pattern.

---

### State B4: Domain Imprisonment

**Symptoms:**
- All ideas come from same reference class
- "How we always do it" or "how our industry does it"
- Solutions are obvious to anyone in the field
- No ideas from adjacent or distant domains

**Key Questions:**
- What field/industry does this idea come from?
- What domain has definitely solved something similar?
- How would a completely different profession approach this?
- What industry would find this problem trivial?

**Interventions:** Run Domain Import (Phase 4). Generate ideas by applying logic from 3+ unrelated fields. Use constraint-entropy.ts with `domains` category.

---

### State B5: Productive Divergence

**Symptoms:**
- Ideas span different forms, scales, actors, and timeframes
- Evaluation problem (too many options) rather than generation problem
- Some ideas feel uncomfortable or surprising
- Hard to group all ideas into one cluster

**Key Questions:**
- Which criteria should filter these?
- What's the minimum viable experiment for top candidates?
- Which ideas can be combined?
- Which ideas serve different user segments?

**Interventions:** Move to evaluation framework. Cluster by approach, pick representative from each cluster to prototype/test.

---

## The Escape Velocity Protocol

A structured process for breaking out of convergent brainstorming. Use all five phases for stuck sessions; skip to relevant phase when the problem is clear.

### Phase 1: Default Enumeration (Mandatory)

Before generating "real" ideas, explicitly list the defaults:
- What would "anyone" suggest?
- What's the genre/industry default for this problem?
- What did you/your team suggest last time?
- What would the first search result say?

**Output:** A list of 5-10 obvious ideas, explicitly labeled as defaults.

**Purpose:** Make attractors visible. You cannot escape what you haven't named.

---

### Phase 2: Function Extraction

For each requirement, separate WHAT from HOW:
- What must be accomplished? (function)
- What are we assuming about how? (form)
- What constraints are real vs. assumed?

**Reframe:** "We need [FORM]" becomes "We need to [FUNCTION] and [FORM] is one way"

**Output:** A list of 3-5 core functions the solution must accomplish, independent of form.

**Example:**
- "We need a mobile app" → "We need users to accomplish X on the go, and a mobile app is one form"
- "We need weekly meetings" → "We need information to flow between teams, and meetings are one mechanism"

---

### Phase 3: Axis Mapping

Map the default solution on four axes:

| Axis | Question | Default | Alternatives |
|------|----------|---------|--------------|
| **Who** | Who does/uses/owns this? | [obvious actor] | 3 unlikely actors |
| **When** | What timeframe/frequency? | [obvious timing] | Different cadence/timing |
| **Scale** | What size/scope? | [obvious scale] | 10x bigger? 10x smaller? |
| **Method** | What approach/mechanism? | [obvious approach] | Completely different approach |

**The key insight:** Ideas feel predictable when they match "likely" on all four axes. Change ANY axis and the idea becomes less obvious.

**Output:** Completed axis map with at least 2 alternatives per axis.

---

### Phase 4: Entropy Injection

Introduce random constraints to force exploration:

**Types of entropy:**
- Random actor (from different domain)
- Random constraint (time, resource, capability limit)
- Random combination (solve this AND something unrelated)
- Inversion (what would PREVENT this? Now design around that)
- Domain import (how would [random field] solve this?)

**Tool:** Use `constraint-entropy.ts` to generate random constraints:
```bash
deno run --allow-read constraint-entropy.ts --combo
deno run --allow-read constraint-entropy.ts domains --count 3
deno run --allow-read constraint-entropy.ts inversions
```

**Output:** 3-5 ideas generated under unusual constraints.

**Purpose:** Force exploration of non-adjacent possibility space. Accept the constraints even if uncomfortable.

---

### Phase 5: Orthogonality Audit

For promising ideas, check:
- Does this idea "know" it's the obvious solution? (If it could articulate "I'm the expected approach," it's convergent)
- Would this surprise someone expecting the genre default?
- Which axis did we actually rotate on?
- Does this serve the function while breaking the expected form?

**The test:** An idea is orthogonal when it has its own logic that *collides* with the problem rather than *serving* it in the expected way.

**Output:** Ideas flagged as genuinely divergent vs. cosmetically different.

---

## The Seed Expansion Protocol

A structured process for growing ideas from initial seeds. Based on Steven Johnson's research on where good ideas come from. Use when you have something to expand rather than something to escape.

### The Johnson Principles

These aren't inspirational—they're diagnostic. Each describes a mechanism for how ideas actually develop:

| Principle | Mechanism | Diagnostic Question |
|-----------|-----------|---------------------|
| **Adjacent Possible** | Most "new" ideas are the next reachable step from what exists. Stairs, not teleportation. | What's one step away from this seed? What becomes possible once this exists? |
| **Liquid Networks** | Ideas form when partial thoughts collide—people, artifacts, past work, unrelated domains. | What should this seed collide with? What's in the environment that could connect? |
| **Slow Hunch** | Many good ideas start half-baked. They need time to meet their missing piece. | What's incomplete about this seed? What would finish it? |
| **Serendipity** | Luck plus recognition. You notice the useful anomaly when it appears. | What unexpected thing have you encountered recently that might connect? |
| **Error** | Failure is information. Feedback turns wandering into convergence. | What's the dumbest version of this? Where does this break? |
| **Exaptation** | Repurpose something built for one job into a different job. Reuse as invention. | Could this seed solve a completely different problem? What was built for something else that could work here? |
| **Platforms** | Stable primitives let people build faster and safer. | What stable thing could this build on? What would make this a platform for other ideas? |

---

### Seed State Diagnosis

Before expanding, understand what kind of seed you have:

#### State S1: Adjacent-Ready

**Signals:**
- Seed is concrete and specific
- Clear what it does, unclear what's next
- Feels like "step one" of something larger

**Key Questions:**
- What becomes possible once this exists that isn't possible now?
- What's the natural next step someone would want?
- What would you build on top of this?

**Expansion:** Map the adjacent possible. List 3-5 things that become reachable from this seed. Pick the most interesting and repeat.

---

#### State S2: Collision-Hungry

**Signals:**
- Seed feels incomplete on its own
- Sense that it needs "something else"
- Works in some contexts but not others

**Key Questions:**
- What domain has never seen this idea?
- What past work does this remind you of?
- Who would find this obvious? Who would find it alien?

**Expansion:** Force collisions. Throw domains, constraints, and artifacts at the seed. Use entropy injection from Escape Velocity Protocol if needed.

---

#### State S3: Half-Baked Hunch

**Signals:**
- Can't fully articulate the idea yet
- Feels important but fuzzy
- "There's something here but I can't name it"

**Key Questions:**
- What's the part you CAN articulate clearly?
- What question would this answer if it were finished?
- What's missing—a mechanism? An example? A use case?

**Expansion:** Don't force completion. Articulate what you have. Name the gap. Keep the hunch alive by writing it down, then look for collisions that might fill the gap over time.

---

#### State S4: Error-Rich

**Signals:**
- Seed has been tried and failed
- Know what doesn't work
- Failure feels informative, not terminal

**Key Questions:**
- What specifically broke? (Mechanism, context, execution?)
- What did the failure reveal about the problem structure?
- What would have to change for this to work?

**Expansion:** Mine the failure. Errors contain information about the shape of the solution. List what you learned, then look for adjacent seeds that avoid the failure modes.

---

#### State S5: Exaptation Candidate

**Signals:**
- Seed works well for its original purpose
- Sense it could do something else entirely
- "This reminds me of X" where X is unrelated

**Key Questions:**
- What job was this seed built to do?
- What other jobs share similar structure?
- Where would transplanting this seed be surprising but plausible?

**Expansion:** Transplant deliberately. List 5 completely different contexts. Try the seed in each. Note what changes, what survives.

---

### Seed Expansion Phases

Unlike Escape Velocity (which is sequential), use these phases as needed based on seed state:

#### Phase S1: Seed Articulation

Before expanding, capture what you have:
- What's the core of this seed? (One sentence)
- What's it good for? What's it not good for?
- Where did it come from? (Collision, adjacent step, hunch, failure, exaptation?)
- What's your current uncertainty about it?

**Output:** A clear statement of the seed and what kind of seed it is.

---

#### Phase S2: Adjacent Mapping

Map what's reachable from this seed:
- What's one step away?
- What becomes possible that wasn't before?
- What would naturally follow if this succeeded?
- What would someone build on top of this?

**Output:** 3-5 adjacent possibilities with one marked as "most interesting."

---

#### Phase S3: Collision Generation

Force the seed to collide with other material:
- **Domain collision:** How would [unrelated field] see this seed?
- **Artifact collision:** What past work (yours or others') connects?
- **Constraint collision:** What happens under unusual constraints?
- **Inversion collision:** What's the opposite? What breaks if inverted?

**Tool:** Use `constraint-entropy.ts domains --count 5` to generate random domains for collision.

**Output:** 3-5 collision results, noting which produced something interesting.

---

#### Phase S4: Gap Identification

For incomplete seeds, name what's missing:
- What question would this seed answer if complete?
- What's the mechanism you can't articulate?
- What example would prove this works?
- What would someone need to see to believe this?

**Output:** A clear statement of the gap. This is what you're looking for in future collisions.

---

#### Phase S5: Transplant Testing

For seeds that might work elsewhere:
- List 5 completely different contexts
- For each: What changes? What survives? What's gained?
- Does any transplant reveal something about the seed you didn't see?

**Output:** Transplant results with notes on what each revealed.

---

#### Phase S6: Stress Testing

Find where the seed breaks:
- What's the worst-case application?
- What assumption, if wrong, kills this?
- What's the dumbest possible implementation?
- Who would hate this? Why?

**Output:** Failure modes and what they reveal about the seed's actual structure.

---

### Switching Between Modes

You may start in one mode and need to switch:

**Seed → Stuck:** If seed expansion produces clustering (all expansions are variations of the same thing), switch to Escape Velocity. You've hit convergence.

**Stuck → Seed:** If Escape Velocity produces a promising divergent idea, switch to Seed Expansion to develop it. You've found a seed worth growing.

**The handoff:** Escape Velocity generates candidates. Seed Expansion develops winners. They're different phases of the same ideation process.

---

## Anti-Patterns

### The Quantity Delusion

**Problem:** Generating 50 ideas that are all variations of the same 3 approaches.

**Symptom:** High count, low spread. Ideas cluster visually when mapped. Easy to group into few buckets.

**Fix:** Stop counting. Start mapping on axes. Require at least one idea per quadrant before adding more. Measure spread, not volume.

---

### The Inversion Trap

**Problem:** "What if we did the opposite?" is lazy divergence. Opposites share the same axis—they're still convergent.

**Symptom:** "Instead of fast, make it slow." "Instead of automated, make it manual." "Instead of expensive, make it free."

**Fix:** Inversion changes magnitude, not dimension. Find a truly orthogonal axis, not the negative of the same axis. "What if speed wasn't the relevant dimension at all?"

---

### The Premature Evaluation Loop

**Problem:** Evaluating ideas while generating them. "That won't work because..." kills divergence.

**Symptom:** Ideas die mid-sentence. Group corrects toward "realistic" ideas. Discomfort with impractical suggestions.

**Fix:** Strict phase separation. Generation is not evaluation. All ideas written down before ANY filtering. Impractical ideas may contain seeds of practical ones.

---

### The Expert Anchor

**Problem:** Domain expert's first idea dominates because of authority, not quality.

**Symptom:** First speaker's idea becomes the reference point. All subsequent ideas are variants or reactions. Deference to experience.

**Fix:** Anonymous idea generation first. Or: expert speaks last. Or: explicitly enumerate expert's default in Phase 1, then exclude it from further consideration.

---

### The Novelty Chase

**Problem:** Divergence for its own sake. Pursuing weird ideas that don't serve the actual function.

**Symptom:** Ideas are surprising but useless. Clever without being functional. "That's creative but doesn't solve the problem."

**Fix:** Return to Phase 2 (Function Extraction). Does the weird idea actually accomplish the required function? If not, it's not divergent—it's irrelevant. Orthogonality must serve function.

---

### The Research Avoidance

**Problem:** Brainstorming from scratch when prior art exists. Reinventing existing solutions.

**Symptom:** "I wonder if anyone has tried..." (they have). Ideas are novel to the group but exist elsewhere.

**Fix:** Research before ideation. Find 5+ existing approaches, enumerate them as defaults in Phase 1, THEN diverge. Standing on shoulders, not reinventing wheels.

---

## Key Questions by State

### For Convergence Diagnosis (Any State)
- How many fundamentally different APPROACHES (not variations) did you generate?
- If you grouped ideas into clusters, how many clusters would there be?
- Did any idea make you uncomfortable? (Discomfort often signals actual divergence)
- Would someone from a different field produce the same list?

### For Function Lock (B2)
- What happens if the "obvious solution" doesn't exist?
- What would you do with 10x resources? 1/10th resources?
- If you couldn't use [assumed approach], what else achieves the function?
- What's the actual outcome you need, separate from how you get there?

### For Domain Expansion (B4)
- What industry has definitely solved something similar?
- What industry would find this problem trivial?
- What would someone from [random field] notice that you're missing?
- How does nature solve this problem? How does the military? How does a kindergarten teacher?

### For Axis Audit (B3)
- Who is the "obvious" user/actor? Who else could it be?
- What's the "obvious" timeframe? What if 10x slower? Instant?
- What's the "obvious" scale? What if for 1 person? 1 million people?
- What's the "obvious" method? What's a completely different method?

---

## Available Tools

### constraint-entropy.ts

Generates random constraints to force divergent exploration.

```bash
# Generate random constraints
deno run --allow-read constraint-entropy.ts --count 3

# Get domain-import prompts
deno run --allow-read constraint-entropy.ts domains --count 5

# Generate constraint combo (one from each category)
deno run --allow-read constraint-entropy.ts --combo

# Specific categories
deno run --allow-read constraint-entropy.ts actors
deno run --allow-read constraint-entropy.ts resources
deno run --allow-read constraint-entropy.ts inversions
deno run --allow-read constraint-entropy.ts combinations

# JSON output
deno run --allow-read constraint-entropy.ts --combo --json
```

**Categories:**
- `actors` - Who constraints ("A 10-year-old must use it", "Someone hostile to it")
- `resources` - Resource constraints ("1/10th budget", "Can't use obvious technology")
- `combinations` - Forced combinations ("Must also solve X", "Must NOT do expected thing")
- `inversions` - Perspective flips ("What if failure is the goal?", "What if the constraint is the feature?")
- `domains` - Domain import prompts ("How would military logistics solve this?")

**Why a script:** True randomness forces exploration that humans and LLMs would otherwise avoid. Curated constraints that actually produce useful divergence.

---

## Example Interaction

**User:** "We need ideas for improving team communication. We keep generating the same ideas—Slack channels, more meetings, documentation."

**Diagnostic approach:**

1. **Identify state:** B1 (Convergence Blindness) + B4 (Domain Imprisonment). Ideas cluster around communication tools and meeting structures—the obvious defaults for this problem space.

2. **Phase 1 - Default Enumeration:**
   Let's name the defaults explicitly:
   - Better Slack/Teams usage or new tool
   - More meetings / fewer meetings
   - Documentation wiki
   - Daily standups
   - Team-building activities
   - Office layout changes

   These are the genre defaults. Valid but predictable.

3. **Phase 2 - Function Extraction:**
   What must team communication accomplish?
   - **F1:** Information reaches people who need it
   - **F2:** Questions get answered without blocking
   - **F3:** Context preserved across time
   - **F4:** Trust enables hard conversations
   - **F5:** Signal-to-noise ratio stays manageable

4. **Phase 3 - Axis Mapping** (for "daily standup"):

   | Axis | Default | Alternatives |
   |------|---------|--------------|
   | Who | Whole team | Rotating pairs? Cross-team? Include customers? |
   | When | Daily morning | Weekly? On-demand trigger? After blockers? |
   | Scale | 15 minutes | 2-minute hard limit? 2-hour deep dive monthly? |
   | Method | Verbal sync | Async text? Video recordings? Walk-and-talk? |

5. **Phase 4 - Entropy Injection:**
   Running `constraint-entropy.ts --combo`:
   - Actor: "Someone who is hostile to it must benefit"
   - Inversion: "What if over-communication was the failure mode?"

   This forces: What if people who hate meetings still get the information? What if we designed for LESS communication that's more effective?

6. **Divergent ideas generated:**
   - **Pair rotations**: No team meetings. Rotating pairs sync daily. Information spreads through network, not broadcast. Introverts prefer.
   - **Decision records**: Every decision documented with context. Communication becomes "read the record" not "ask again." Async-first.
   - **Silence budget**: Each person has limited "interrupt" tokens per week. Forces prioritization of what's worth saying.
   - **The grandmother test**: Any announcement understandable to a non-technical family member. Catches jargon, forces clarity.
   - **Context-forward**: Every update MUST start with "what would confuse someone joining today?"

   These ideas are orthogonal—different axes, not variations of "meeting tools."

---

## What You Do

1. **Diagnose the state** - Which of B1-B5 describes the current situation?
2. **Run appropriate protocol phase** - Match intervention to state
3. **Generate random constraints** - Use entropy tool when stuck
4. **Audit for orthogonality** - Check if ideas are genuinely divergent
5. **Map spread, not count** - Measure coverage of possibility space

## Output Persistence

This skill writes primary output to files so work persists across sessions.

### Output Discovery

**Before doing any other work:**

1. Check for `context/output-config.md` in the project
2. If found, look for this skill's entry
3. If not found or no entry for this skill, **ask the user first**:
   - "Where should I save output from this brainstorming session?"
   - Suggest: `explorations/brainstorming/` or a sensible location for this project
4. Store the user's preference:
   - In `context/output-config.md` if context network exists
   - In `.brainstorming-output.md` at project root otherwise

### Primary Output

For this skill, persist:
- Defaults enumerated (Phase 1 output)
- Function extraction results (Phase 2)
- Axis mapping with alternatives explored (Phase 3)
- Entropy constraints applied and ideas generated (Phase 4)
- Orthogonality audit results - which ideas are genuinely divergent (Phase 5)
- Selected/promising ideas with rationale

### Conversation vs. File

| Goes to File | Stays in Conversation |
|--------------|----------------------|
| Enumerated defaults | Discussion of which defaults feel sticky |
| Axis map with rotations | Iteration on constraint choices |
| Generated divergent ideas | Real-time feedback on ideas |
| Orthogonality assessments | Clarifying questions |
| Promising combinations | Discarded options |

### File Naming

Pattern: `{topic}-{date}.md`
Example: `product-naming-2025-01-15.md`

## What You Do NOT Do

- Generate ideas FOR the user (provide process, not content)
- Evaluate ideas during generation (separate phases)
- Skip default enumeration (invisible defaults can't be escaped)
- Chase novelty without function (weird ≠ useful)
- Replace domain expertise (work WITH knowledge, not instead of)
- Guarantee good ideas (guarantee exploration of possibility space)
- Accept "we've tried everything" (probably variations of same approach)
