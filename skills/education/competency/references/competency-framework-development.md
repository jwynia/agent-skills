# Competency Framework Development

A methodology for building competency-based training, assessment, and support systems that produce capability—not just completion.

---

## The Problem

Training produces completion, not competence. People pass quizzes but cannot apply knowledge. Support systems surface the same questions repeatedly. Skill updates happen without assessing current state.

The symptoms:

- People complete training but can't answer basic questions
- The same questions get asked repeatedly despite documentation existing
- Training is a document dump followed by trivia quiz
- No way to assess whether someone is ready to do the work
- New hires take a long time to become effective despite "completing onboarding"

The root cause: knowledge transmission ≠ capability development. Telling people what exists is not the same as helping them make decisions.

---

## Core Principles

### 1. Start with Decisions, Not Information

The failure mode of most training is starting with "what information exists" and presenting it. Instead, start with:

- What decisions will people need to make?
- What actions will they need to take?
- What will they need to explain to others?
- What mistakes would indicate they're not ready?

### 2. Competencies Are Observable Capabilities

Good competency statement: "Can evaluate a third-party AI tool against organizational data policies"

Weak competency statement: "Understands data policies"

The first describes something you could watch someone do. The second describes a mental state you can't observe.

### 3. Scenarios Test Judgment, Not Recall

A scenario presents a realistic situation requiring judgment. The response reveals whether someone has the underlying competency. If they can answer by searching documentation, it's not testing competency.

### 4. Layer Content by Audience Depth

Most topics have natural audience layers:

| Layer | Needs | Depth |
|-------|-------|-------|
| **General** | Follow rules correctly | What to do, minimal why |
| **Practitioner** | Make judgment calls | Enough "why" to handle edge cases |
| **Specialist** | Design/enforce/audit | Full technical and policy detail |

### 5. Verification Ties to Real Decisions

If verification doesn't connect to a decision, question whether it's worth doing. Verification should drive:

- Hiring decisions (does this person move forward?)
- Readiness decisions (is this person ready to work independently?)
- Authorization decisions (is this person qualified for this role/access?)

### 6. Feedback Loops Surface Systemic Gaps

A framework paired with an agent becomes a sensor for what's broken upstream. Question patterns reveal gaps in training, unclear policies, process friction, and tooling needs. The framework isn't static—it evolves based on what the support system learns.

---

## Key Concepts

| Concept | Definition |
|---------|------------|
| **Competency** | Observable capability—what someone can DO, not what they know |
| **Scenario** | Realistic situation requiring judgment to resolve |
| **Scenario Variant** | Same decision structure adapted for different contexts (interview/assessment/ongoing) |
| **Depth Layer** | Content tailored to audience needs (General/Practitioner/Specialist) |
| **Verification Criteria** | Evidence that competency exists, with defined quality levels |
| **Progression Model** | Dependencies between competencies and sequencing for development |
| **Skip Logic** | Personalized paths based on demonstrated prior competency |
| **Feedback Loop** | Mechanism where support patterns surface systemic gaps |

---

## Applicable Domains

This framework applies beyond compliance and policy topics. It works for any area where people need to develop judgment, not just awareness.

**Policy/Compliance**: The obvious case. Expense policies, data handling, safety procedures—anywhere rules exist that people need to apply to varied situations.

**Tool Proficiency**: Knowing a tool's features ≠ using it effectively. Vendor training typically teaches what buttons exist, not how to get good results. This is particularly acute for AI tools, where:
- The gap between "completed training" and "gets good outputs" is enormous
- Effective use requires judgment and technique, not just feature knowledge
- Most available training is either cargo-cult tips or outdated courses
- Demonstration of what's possible matters more than explanation

**Process/Workflow**: How work gets done—code review practices, incident response, customer interactions. Anywhere there's a "right way" that requires judgment to apply.

**Domain Expertise**: Specialized knowledge areas where people need to make decisions, not just recall facts. Differs from reference material in that it requires synthesis and application.

---

## Process

### Step 1: Identify Real Competencies

**Start with decisions, not information.**

Questions to answer:
- What decisions will people need to make?
- What actions will they need to take?
- What will they need to explain to others?
- What mistakes would indicate they're not ready?

**Work backward from failure modes:**
- What mistakes have you seen?
- What questions do people ask that they shouldn't need to?
- What takes too long because people don't know how to approach it?
- What has caused incidents or near-misses?

Each failure mode suggests a competency that would prevent it.

**Write competencies as observable capabilities:**

| Instead of | Write |
|------------|-------|
| "Understands data policies" | "Can classify data according to organizational categories" |
| "Knows the approval process" | "Can determine required approval level for a given expense" |
| "Familiar with the tool" | "Can configure the tool to accomplish [specific task]" |

**Check granularity:**
- Too coarse: "Can handle AI-related decisions" — not specific enough to assess
- Too fine: "Can click the data retention checkbox in Azure" — this is a task, not a competency
- Right level: Specific enough to assess, general enough to transfer across similar situations

**Test**: If you can't imagine two people disagreeing about whether someone has this competency, it's too vague. If it only applies to one exact situation, it's too specific.

**Output**: List of competencies with IDs, names, and descriptions

---

### Step 2: Identify Audiences and Depth Layers

**Map who needs what level of understanding:**

| Layer | Needs | Depth |
|-------|-------|-------|
| **General** | Follow rules correctly | What to do, minimal why |
| **Practitioner** | Make judgment calls | Enough "why" to handle edge cases |
| **Specialist** | Design/enforce/audit | Full technical and policy detail |

**Map competencies to layers:**

Not everyone needs every competency. A general employee doesn't need "Compliance verification" competency. But "Data classification" might be relevant at different depths:
- General: "Know the four categories and which one your work falls into"
- Practitioner: "Understand why categories exist and how to handle edge cases"
- Specialist: "Can define new categories and update classification criteria"

**Output**: Competency matrix showing which competencies apply to which audiences and at what depth

---

### Step 3: Design Scenarios

**Scenarios test competencies in context.**

A scenario presents a realistic situation requiring judgment. The response reveals whether someone has the underlying competency.

**Anatomy of a good scenario:**
1. Realistic context — situations people will actually encounter
2. Incomplete information — like real life, not everything is specified
3. Requires judgment — not just recall or lookup
4. Has better and worse responses — demonstrates quality of thinking

**Create variants for different contexts:**

| Context | Variant Characteristics |
|---------|------------------------|
| **Interview** | Generic situation, tests reasoning approach, candidate doesn't know your specifics |
| **Assessment** | Uses your actual tools/policies, tests application of what they should have learned |
| **Ongoing** | Real situations that arose, tests continued competence |

**Template:**

```markdown
### Scenario: [Name]

**Core decision structure:** [What judgment is being tested]

**Interview variant:**
> [Generic situation requiring the competency]

**Assessment variant:**
> [Organization-specific version using real tools/policies]

**Ongoing variant:**
> [Actual situation that occurred, anonymized if needed]

**Competencies assessed:** [IDs]

**What good looks like:**
- [Consideration a strong response would include]
- [Another consideration]
- [What distinguishes competent from exceptional]

**Red flags:**
- [What a weak response would miss]
- [Common mistakes]
```

**Output**: 2-3 scenarios per core competency with variants and rubrics

---

### Step 4: Develop Layered Explanatory Content

**Content exists to support competency, not for its own sake.**

Every piece of content should connect to a competency. If you can't explain which competency it supports, question whether it belongs.

**Layer the content:**

**Layer 1 (General):**
- Rules without extensive justification
- Clear, direct, actionable
- Answers "what do I do?"

**Layer 2 (Practitioner):**
- Enough "why" to handle edge cases
- Principles behind rules
- Answers "how do I decide when the situation is ambiguous?"

**Layer 3 (Specialist):**
- Full technical/legal/policy detail
- How to verify, audit, configure
- Answers "how do I ensure this works and prove it?"

**Make layers reference each other:**

Layer 2 should make sense to someone who read Layer 1. Layer 3 shouldn't require re-reading Layer 1 basics but should build on Layer 2 concepts.

**Content becomes multiple outputs:**

The same core content, layered properly, can generate:
- Policy documents (Layer 1)
- Training materials (Layer 1-2)
- Reference chatbot knowledge base (all layers, retrieved based on question)
- Audit documentation (Layer 3)
- Interview preparation (Layer 2-3 for interviewers)

**Output**: Content modules with L1/L2/L3 versions connected to competencies

---

### Step 5: Define Verification Criteria

**What counts as evidence?**

| Evidence Type | Strength | Use Case |
|---------------|----------|----------|
| **Scenario response** | Medium-High | Interview, assessment checkpoints |
| **Artifact produced** | High | Documentation, evaluations, designs they create |
| **Observed behavior** | Highest | Did the thing successfully in real work |
| **Taught others** | Very High | Explained it correctly to someone else |
| **Quiz/recall** | Low | Compliance checkbox only, doesn't demonstrate competence |

**Build a rubric:**

For each competency, define levels:

| Level | Meaning |
|-------|---------|
| **Not demonstrated** | Didn't engage with the relevant considerations |
| **Partial** | Identified some factors, missed important ones, or reasoning had gaps |
| **Competent** | Addressed key considerations, sound reasoning, could do independently |
| **Strong** | Identified non-obvious factors, sophisticated judgment, could teach others |

**Connect verification to decisions:**

| Verification Context | Decision It Informs |
|---------------------|---------------------|
| Interview | Does this person move forward? At what level? |
| Onboarding checkpoint | Is this person ready to work independently on this? |
| Ongoing assessment | Is this person qualified to handle this category of decision? |
| Promotion consideration | Has this person developed specialist-level competency? |

**Output**: Rubric per competency with evidence types and decision connections

---

### Step 6: Model Progression

**Identify dependencies:**

Some competencies require others as foundation:
- Can't evaluate tools against policy without understanding data classification
- Can't explain to stakeholders without understanding the technical distinctions
- Can't handle exceptions without understanding the standard process

**Map dependencies to sequence learning logically:**

```
Foundation (everyone)
├── Competency A (prerequisite for all)
└── Competency B (prerequisite for intermediate)

├─► Intermediate
│   ├── Competency C (builds on B)
│   └── Competency D (builds on A + B)

└─► Role-Specific (parallel tracks)
    ├── Role 1: Competencies E, F
    └── Role 2: Competencies G, H
```

**Enable skip logic:**

If someone demonstrates a competency (in interview or prior assessment), don't make them sit through the training for it. The framework should support:
- Assessment before training (test out)
- Conditional module requirements
- Personalized paths based on prior knowledge

**Output**: Progression diagram with dependencies and skip conditions

---

### Step 7: Connect to Existing Systems

**Map to current training:**

Identify what already exists:
- What corporate training touches this topic?
- What documentation exists?
- What institutional knowledge is undocumented?

Determine relationship:
- Replace (current training is inadequate)
- Supplement (current training covers basics, you add depth)
- Reference (your framework uses their content)

**Identify compliance constraints:**

Some training has regulatory requirements:
- Required assessment methodology
- Documentation retention
- Specific content that must be covered
- Completion tracking

Understand what's actually required vs. assumed. Often the constraints are narrower than practice suggests.

**Plan for maintenance:**

Knowledge becomes stale. Build in:
- Trigger for review (policy changes, incidents, new tools)
- Ownership (who updates what)
- Version management (people trained on V1 vs. V2)

**Output**: Integration map showing relationships to existing systems, constraints, and maintenance plan

---

### Step 8: Build Feedback Loops

**A framework paired with an agent becomes a sensor for what's broken upstream.**

The core loop:

```
Framework defines competencies
    ↓
Training materials teach toward them
    ↓
Agent answers questions using framework + content
    ↓
Question patterns reveal:
    ├── Gaps in training (topic X keeps confusing people)
    ├── Gaps in framework (questions that don't map to existing competencies)
    ├── Gaps in process (questions that shouldn't need to be asked)
    └── Gaps in tooling (manual work that should be automated)
    ↓
Improvements flow back to framework/training/process/tools
    ↓
[cycle continues]
```

**Beyond "frequently asked":**

Simple FAQ analysis counts questions. An agent with framework context can identify *what kind of confusion* is happening:

| Surface Signal | Deeper Inference | Upstream Fix |
|----------------|------------------|--------------|
| "People keep asking about thresholds" | Training mentions thresholds but doesn't make them memorable | Redesign that module, add scenario practice |
| "People ask which approval level they need" | They understand thresholds exist but not how to map to their situation | Add decision tool, or simplify approval chain |
| "People ask right after completing training" | Training didn't establish mental model, just trivia | Restructure around decision-making, not facts |
| "Questions the policy doesn't answer" | Policy has gaps or ambiguous cases | Surface to policy owners, update framework |
| "How do I do X?" (should be automated) | Process friction, not knowledge gap | Build tooling, not more training |

**The agent as instrument:**

Design for observability:
- Log questions with enough context to analyze patterns
- Tag questions by which competency/content area they map to (or "unmapped")
- Track follow-up questions (indicates first answer didn't resolve the issue)
- Note questions that required escalation or couldn't be answered

**Pattern detection:**

Periodically review question logs for:

- **Training gaps**: Questions that *should* be answered by training but aren't sticking
- **Framework gaps**: Questions that don't map to any existing competency
- **Content gaps**: Questions the agent can't answer because content doesn't exist
- **Process/tool gaps**: Questions that reveal friction beyond knowledge
- **Emerging patterns**: New question categories signaling change

**Closing the loop:**

Signal without action is just data. Build in:
- Regular review cadence for question pattern analysis
- Clear ownership: who receives the signal, who decides on fixes
- Lightweight routing process (training team, policy owner, engineering, etc.)
- Feedback visibility: when a pattern leads to a fix, note it

**Output**: Feedback loop design with observation mechanisms, analysis cadence, and routing paths

---

## Templates

### Competency Definition Template

```markdown
## [Cluster Name] Competencies

| ID | Competency | Description |
|----|------------|-------------|
| [PREFIX]-1 | [Action verb phrase] | [Observable capability starting with "Can..."] |
| [PREFIX]-2 | [Action verb phrase] | [Observable capability] |
```

### Scenario Template

```markdown
### Scenario: [Name]

**Core decision structure:** [What judgment is being tested]

**Interview variant:**
> [Generic situation]

**Assessment variant:**
> [Organization-specific situation]

**Competencies assessed:** [IDs]

**What good looks like:**
- [Consideration]
- [Consideration]

**Red flags:**
- [Weak response indicator]
```

### Content Layer Template

```markdown
## [Module Name]

### Layer 1: General
[Rules, actions, no extensive justification]

### Layer 2: Practitioner
[Why behind the rules, edge case handling]

### Layer 3: Specialist
[Full technical/legal detail, verification methods]
```

### Progression Model Template

```
Foundation (Role: Everyone)
├── [COMP-1]: [Name]
└── [COMP-2]: [Name]

├─► Intermediate (Role: [Role Name])
│   ├── [COMP-3]: [Name] (requires: COMP-1, COMP-2)
│   └── [COMP-4]: [Name] (requires: COMP-2)

└─► Specialist Track (Role: [Role Name])
    ├── [COMP-5]: [Name] (requires: COMP-3)
    └── [COMP-6]: [Name] (requires: COMP-3, COMP-4)
```

---

## Anti-Patterns

| Anti-Pattern | Symptom | Fix |
|--------------|---------|-----|
| **Starting with content** | Training covers everything but people can't do the job | Restart from "what decisions do people make?" |
| **Vague competencies** | Can't tell if someone has it or not | Rewrite as observable behaviors with "can" + action verb |
| **Simple scenarios** | People pass but fail in real situations | Add ambiguity, remove artificial clarity, require judgment |
| **Single audience** | Specialists bored, generalists overwhelmed | Layer content by depth |
| **No verification stakes** | Assessment exists but doesn't matter | Connect each verification to a real gate |
| **Static framework** | Content drifts from reality | Establish maintenance triggers and ownership |
| **Document dump** | Existing docs converted to "training" without restructuring | Identify decisions the documentation supports, build backward |
| **Quiz fallacy** | Assessing with recall questions instead of judgment scenarios | Replace with scenarios that can't be answered by ctrl+F |
| **Orphan scenarios** | Scenario doesn't map to any defined competency | Either add the competency it tests, or cut the scenario |
| **Orphan content** | Content doesn't support any competency | Either identify the competency it serves, or cut the content |

---

## Success Metrics

### Leading Indicators

- Competencies map to real decisions people make in the domain
- Scenarios require judgment, not lookup or recall
- Rubrics differentiate competent from exceptional (not just pass/fail)
- Each audience layer has appropriately scoped content
- Verification gates connect to real decisions

### Lagging Indicators

- Time to independent competence decreases
- Repeat questions decrease after training
- Correct decisions in real scenarios increase
- Support escalations decrease for trained topics
- Question patterns shift from "what do I do?" to edge cases

### Health Check Questions

- Can you name the 3 most common mistakes people make after training? Do your competencies address them?
- When someone asks a question, can you map it to a competency gap or a framework gap?
- Has the framework changed in the last 6 months based on feedback loop data?
- Do people skip parts of training based on demonstrated competency, or does everyone get the same path?

---

## Minimum Viable Framework

If you need to start small, prioritize:

1. **3-5 core competencies** — the ones that matter most for the role/topic
2. **2-3 scenarios** — covering those competencies with interview + assessment variants
3. **One layer of content** — probably Layer 2, enough for practitioners
4. **Basic rubric** — even a simple good/partial/not demonstrated scale

Expand from there based on what you learn from using it.

---

## Scope & Limits

### When to Use This Framework

- People need to DO something, not just be aware
- Multiple contexts need the same content (hiring, training, reference, support)
- Current training produces completion but not competence
- You want to understand why people keep making the same mistakes

### When NOT to Use This Framework

- Pure awareness/information sharing (use documentation)
- One-time training that won't be repeated (overhead isn't worth it)
- Topics too simple to warrant scenarios (just write clear instructions)
- When you can't define what "competent" looks like

---

## Checklist: Is Your Framework Ready?

- [ ] Competencies describe observable capabilities, not knowledge states
- [ ] Each competency connects to real decisions or actions
- [ ] Scenarios require judgment, not just recall
- [ ] Scenarios have variants for different contexts (interview/assessment/ongoing)
- [ ] Content is layered by audience depth
- [ ] Verification criteria define what "demonstrated" looks like
- [ ] Progression model shows dependencies
- [ ] Skip logic exists for prior knowledge
- [ ] Maintenance ownership is assigned
- [ ] Feedback loop mechanism is defined
- [ ] You've tested at least one scenario with a real person

---

## Cross-References

- **framework-development/framework-development.md**: Related but distinct. Framework development captures operational knowledge (how to do something). Competency development builds observable capability (verifies someone can do it). A framework explains how; a competency framework verifies someone can.

- **research/research-framework.md**: Query expansion and source evaluation apply when building competency content—especially for Layer 3 specialist content.

---

## Worked Example

See [ai-literacy-competency.md](ai-literacy-competency.md) for a complete worked example applying this methodology to AI literacy competencies.
