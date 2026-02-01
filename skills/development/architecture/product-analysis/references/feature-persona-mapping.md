# Feature-Persona-Use Case Mapping Framework

## The Problem

Products fail when features don't connect to who needs them (personas) and why (use cases).

**The Feature Factory Problem**: Teams ship features without clarity on who they serve or what job they enable. Features accumulate without strategy.

**The Averaging Problem**: Priority is set by averaging across all users, which erases signal. A feature critical for one persona and irrelevant for another becomes "moderate importance" and gets deprioritized.

**The Gateway Blindness Problem**: Enabling features (authentication, basic data structures) get deprioritized because they seem low-value in isolation—ignoring that they unlock compound value.

**The Benefit Assumption Problem**: Teams assume users will understand why a feature matters. "It's obvious" masks that different personas need different benefit articulations.

**The Adjacent Ignorance Problem**: Analysis focuses on obvious use cases, missing adjacent opportunities that competitors don't serve.

**The consequences**:
- Feature lists grow without strategy
- Priorities shift with opinion, not evidence
- Gateway features get cut, blocking later value
- Market opportunities go unnoticed
- Product-market fit becomes accidental, not designed

---

## Core Principles

### 1. Features Are Means, Not Ends

Features exist to enable use cases. The use case (job-to-be-done) is the unit of value, not the feature.

A feature with no clear use case is **feature debt**—it exists, requires maintenance, but doesn't demonstrably deliver value.

**The test**: For any feature, can you complete this sentence? "[Persona] uses [feature] to accomplish [job] so they can [outcome]."

### 2. Same Feature, Different Jobs

A single feature may serve different personas in different ways. Document all mappings, not just the primary one.

**Example**: "Search" for an admin is "find any user quickly." For an end user, it's "find my content." Same feature, different jobs, different value propositions.

**Implication**: Feature value isn't scalar—it's a vector across personas.

### 3. Gateway Features Unlock Value

Some features enable other features or use cases. These have outsized strategic importance even if not directly valuable.

- Authentication enables everything multi-user
- Data import enables everything requiring existing data
- API enables all integrations

**Gateway features** should be evaluated by what they enable, not their standalone value.

### 4. Priority is Persona-Relative

"High priority" without specifying for whom is meaningless. A feature that's critical for one persona might be irrelevant for another.

**Priority matrices must be per-persona**, then weighted by strategic importance of each persona.

### 5. Adjacent Possible is Competitive Edge

Use cases competitors don't serve are your differentiation opportunity. Map the edges, not just the center.

**Adjacent use cases** are close to current offerings but not well-served. They represent:
- Underserved segments within existing markets
- Workflow steps that current tools don't cover
- Emotional jobs beyond functional ones

---

## Key Vocabulary

| Term | Definition |
|------|------------|
| **Use Case** | A specific job a user is trying to accomplish in a specific context. More concrete than persona needs, more specific than features. |
| **Gateway Feature** | A feature that enables access to other features or use cases. Prerequisite for compound value. |
| **Persona Priority Matrix** | Feature importance ranked per persona, not globally averaged. |
| **Job Hierarchy** | Structure: Core Job > Sub-Jobs > Related Jobs > Emotional Jobs. Reveals feature relevance at each level. |
| **Benefit Translation** | Converting feature description into outcome language for a specific persona. Different personas need different translations. |
| **Adjacent Possible** | Use cases close to current offerings but not served by competitors. Differentiation opportunity. |
| **Feature Debt** | Features that exist without clear persona-use case mappings. Maintenance burden without demonstrable value. |
| **Enablement Score** | Count of features/use cases a gateway feature enables. Measures compound value. |

---

## Diagnostic States

### State FP0: Feature List Without Mapping

**Symptoms**:
- Features listed without connection to who/why
- Can't answer "who needs this feature most?"
- Backlog is a list of things, not a map of value
- Features justified by "it would be cool" or "competitors have it"
- No persona ownership of features

**Key Questions**:
- For each feature: which persona needs it most?
- For each feature: what job does it help accomplish?
- Which features have no clear persona owner?
- Which features have no clear use case?

**Interventions**:
- Basic mapping exercise: feature → persona → use case
- Identify orphan features (features with no clear mapping)
- Use Feature Audit Template

**Risk**: Building features nobody needs; no strategic coherence.

---

### State FP1: One-to-One Mapping Only

**Symptoms**:
- Each feature mapped to one persona, one use case
- Missing that same feature serves multiple purposes
- Can't explain feature value to different audiences
- Marketing struggles to position for different segments
- "This is a feature for [one type] of user"

**Key Questions**:
- Could this feature serve another persona?
- What else could someone do with this feature?
- How would different personas describe this feature's value?

**Interventions**:
- Multi-persona feature analysis: for each feature, consider all personas
- Benefit translation exercise: write value proposition per persona
- Use Multi-Persona Feature Map Template

**Risk**: Missing feature value for secondary personas; narrow marketing.

---

### State FP2: Missing Use Case Hierarchy

**Symptoms**:
- Use cases are flat list without structure
- Can't distinguish core jobs from supporting jobs
- Related jobs and emotional jobs missing
- Feature decisions made without job context
- "This helps users do [vague activity]"

**Key Questions**:
- What's the core job this use case supports?
- What sub-jobs make up this use case?
- What related jobs might users also have?
- What emotional jobs are being addressed?

**Interventions**:
- Jobs-to-be-Done hierarchy mapping
- Core job identification per persona
- Emotional job surfacing through user research
- Use Job Hierarchy Template

**Risk**: Features address symptoms rather than core jobs.

---

### State FP3: No Gateway Feature Awareness

**Symptoms**:
- Dependencies between features not documented
- "Why do we need that?" questions for enabling features
- Features that unlock value seen as low priority
- MVP lacks critical enabling capabilities
- Compound value not recognized

**Key Questions**:
- What does this feature enable?
- What other features require this to function?
- What's the dependency chain?
- Which features are prerequisites for others?

**Interventions**:
- Dependency mapping: for each feature, document what it enables
- Gateway feature identification
- Enablement scoring
- Use Gateway Feature Map Template

**Risk**: Cutting features that block later value; incomplete products.

---

### State FP4: Priority Without Persona Context

**Symptoms**:
- Global priority ranking without persona breakdown
- "High priority" without "for whom"
- Persona needs averaged instead of stratified
- Different stakeholders have incompatible priorities
- Priority debates that never resolve

**Key Questions**:
- High priority for which persona?
- If personas disagree, which persona matters more?
- How do you weigh persona priorities?
- What's the strategic importance of each persona?

**Interventions**:
- Create per-persona priority matrices
- Define strategic persona weighting
- Establish priority conflict resolution protocol
- Use Persona Priority Matrix Template

**Risk**: Features prioritized for wrong personas; wrong users happy.

---

### State FP5: Missing Adjacent Opportunities

**Symptoms**:
- Only obvious use cases mapped
- Can't articulate differentiation opportunity
- "Same as competitors" positioning
- No vision for underserved needs
- Analysis stops at what exists

**Key Questions**:
- What use cases are close but not well-served?
- Where are competitors weak?
- What jobs do users attempt that current products don't support?
- What's the adjacent possible?

**Interventions**:
- Competitive gap analysis by use case
- Adjacent use case discovery from user evidence
- Edge job mapping
- Use Adjacent Opportunity Template

**Risk**: Competing on same ground as everyone else.

---

### State FP6: Complete Mapping

**Symptoms**:
- All features mapped to personas and use cases
- Multi-persona mappings documented
- Gateway features identified with enablement scores
- Priority is persona-relative with weighting
- Adjacent opportunities articulated and prioritized

**Indicators**:
- Can explain any feature's value to any persona
- Priority decisions have documented rationale
- Dependency chains are clear
- Competitive differentiation is articulated

**Next Step**: Feed into Build/Buy/Partner decisions; inform roadmap.

---

## Process

### Phase 1: Feature Inventory and Audit

**Input**: Feature list (from taxonomy or product backlog), Persona set (from Persona Construction)
**Output**: Feature inventory with initial mappings and audit flags

**Steps**:

1. **List all features** (current or proposed):
   - Use canonical names from Feature Taxonomy if available
   - Include both existing and planned features

2. **Attempt initial persona mapping**:
   - For each feature: which persona(s) would use this?
   - Mark confidence: High / Medium / Low / Unknown

3. **Identify audit flags**:
   - **Orphan features**: No clear persona owner
   - **Overloaded features**: Many personas claim (needs analysis)
   - **Assumed mappings**: Mapped without evidence

**Output template**:

```markdown
## Feature Audit: [Product]

### Feature Inventory
| Feature | Primary Persona | Use Case (initial) | Confidence |
|---------|----------------|-------------------|------------|
| [Feature] | [Persona or "Orphan"] | [Job or "TBD"] | [H/M/L/Unknown] |

### Audit Flags
**Orphan Features** (no clear owner):
- [Feature]: [Why unclear]

**Overloaded Features** (multiple personas):
- [Feature]: [Personas claiming] - needs multi-persona analysis

**Low Confidence Mappings**:
- [Feature]: [What's uncertain]
```

---

### Phase 2: Use Case Discovery

**Input**: Feature inventory, Persona set, User research evidence
**Output**: Job hierarchy per persona, Feature-job mapping

**Steps**:

1. **For each persona, list jobs they're trying to do**:
   - Start with evidence from Persona Construction
   - Add jobs implied by feature usage patterns

2. **Structure jobs hierarchically**:

| Level | Description | Example |
|-------|-------------|---------|
| **Core Job** | Primary outcome they're paying for | "Coordinate team work" |
| **Sub-Jobs** | Steps/components of core job | "Assign tasks," "Track progress" |
| **Related Jobs** | Jobs that occur alongside | "Communicate about tasks" |
| **Emotional Jobs** | How they want to feel | "Feel in control," "Appear competent" |

3. **Map features to jobs**:
   - Which features serve which jobs?
   - At which hierarchy level does the feature operate?

4. **Identify job gaps**:
   - Which jobs have no feature support?
   - Which sub-jobs are underserved?

**Output template**: See [Job Hierarchy Template](templates/job-hierarchy.md)

---

### Phase 3: Multi-Persona Analysis

**Input**: Feature-job mapping, Full persona set
**Output**: Multi-persona feature map, Benefit translations

**Steps**:

1. **For each feature, consider ALL personas**:
   - Primary persona: who needs this most?
   - Secondary personas: who else would use it?
   - Non-users: who explicitly doesn't need this?

2. **Document different use cases per persona**:
   - Same feature, different job
   - Same feature, different outcome desired

3. **Translate benefits per persona**:
   - How would you explain this feature's value to each persona?
   - What language/framing resonates?

4. **Identify persona-specific priority**:
   - Critical / Important / Nice-to-have / Irrelevant

**Output template**:

```markdown
## Multi-Persona Analysis: [Feature]

### Persona Mapping
| Persona | Use Case | Outcome Desired | Priority |
|---------|----------|-----------------|----------|
| [Persona 1] | [Their use] | [Their goal] | Critical |
| [Persona 2] | [Their use] | [Their goal] | Nice-to-have |
| [Persona 3] | — | — | Irrelevant |

### Benefit Translations
**For [Persona 1]**: "[Feature] helps you [outcome in their language]"
**For [Persona 2]**: "[Feature] lets you [different framing]"
```

---

### Phase 4: Gateway Feature Mapping

**Input**: Feature list, Use case mappings
**Output**: Feature dependency map, Gateway feature identification

**Steps**:

1. **For each feature, ask**: "What does this enable?"
   - Other features that depend on this
   - Use cases that require this first
   - Workflows that assume this exists

2. **Map dependencies**:
   - **Hard prerequisites**: Feature is impossible without
   - **Soft prerequisites**: Feature is impaired without

3. **Identify gateway features**:
   - Features that enable 3+ other features or use cases
   - Features that are prerequisites for core jobs

4. **Calculate enablement scores**:
   - Count of features/use cases enabled
   - Weight by importance of enabled features

**Output template**: See [Gateway Feature Map Template](templates/gateway-feature-map.md)

---

### Phase 5: Adjacent Opportunity Discovery

**Input**: Job hierarchies, Competitive analysis, User evidence
**Output**: Adjacent opportunity inventory, Prioritized differentiation list

**Steps**:

1. **Map competitor coverage of jobs**:
   - For each job in hierarchy: who serves it well? Partially? Not at all?
   - Identify underserved jobs

2. **Discover adjacent jobs from evidence**:
   - User research: "I wish I could also..."
   - Support tickets: requests for not-current functionality
   - Reviews: complaints about workflow gaps

3. **Assess opportunity attractiveness**:

| Factor | Question |
|--------|----------|
| Proximity | How close to current capabilities? |
| Demand | What evidence of desire for this? |
| Competition | How well-served by others? |
| Fit | Does this make sense for our product? |

4. **Prioritize opportunities**:
   - High proximity + high demand + low competition = top priority
   - Validate before committing

**Output template**: See [Adjacent Opportunity Template](templates/adjacent-opportunity.md)

---

## Anti-Patterns

### 1. The Feature Factory

**Pattern**: Adding features without mapping to personas or use cases.

**Signs**:
- "We shipped 50 features this quarter!"
- No documentation of who features are for
- Backlog grows without pruning
- Features justified by velocity, not value

**Why it fails**: Features without mappings are feature debt. They may not solve real problems. They complicate the product without adding value.

**The test**: For every feature shipped, can you cite the persona and job?

**Fix**: No feature ships without documented persona-use case mapping.

---

### 2. The Averaging Trap

**Pattern**: Averaging priorities across personas instead of maintaining persona-specific priorities.

**Signs**:
- Global priority scores
- "Everyone needs this a little"
- Features that are "moderate priority" for everyone
- Persona-specific needs lost in aggregation

**Why it fails**: Averaging erases signal. A feature critical for Persona A and irrelevant for Persona B averages to "moderate" and gets deprioritized vs. a feature that's "nice" for everyone.

**The test**: Do you have separate priority rankings per persona?

**Fix**: Maintain per-persona priority matrices. Weight by strategic importance of each persona.

---

### 3. The Gateway Blindness

**Pattern**: Deprioritizing features that enable other features because they seem low-value in isolation.

**Signs**:
- "Authentication isn't a selling point"
- "Data import can wait"
- Core enabling features pushed to later releases
- Later features blocked by missing prerequisites

**Why it fails**: Gateway features unlock compound value. Authentication isn't exciting, but every logged-in feature depends on it. Cutting enablers blocks later value.

**The test**: What does this feature enable? What's blocked without it?

**Fix**: Map dependencies explicitly. Evaluate gateway features by enablement score, not standalone value.

---

### 4. The Benefit Assumption

**Pattern**: Assuming users will understand feature value without translation.

**Signs**:
- "It's obvious why this matters"
- Same feature description for all audiences
- Marketing that lists features, not benefits
- Users not adopting clearly valuable features

**Why it fails**: Features need translation into outcomes. Different personas need different benefit articulations. What's obvious to you isn't obvious to them.

**The test**: For each feature, can you state the benefit in each persona's language?

**Fix**: Document benefit translation per persona. Test messaging with actual users.

---

### 5. The Adjacent Ignorance

**Pattern**: Mapping only obvious use cases that competitors already serve.

**Signs**:
- "We cover the same use cases as competitors"
- No vision for differentiation
- Analysis ends at current market offerings
- User requests for "other stuff" ignored

**Why it fails**: If you only serve the same use cases as competitors, you're competing on execution only. Adjacent opportunities are differentiation sources.

**The test**: What jobs do users attempt that no product serves well?

**Fix**: Actively discover adjacent use cases. Look for jobs at the edges of current coverage.

---

## Boundaries

### Assumes

| Assumption | If violated... |
|------------|----------------|
| Validated persona set exists | Use [Persona Construction Framework](persona-construction.md) first |
| Features can be listed | For pre-product exploration, use job discovery instead |
| Use cases are discoverable | Novel categories may need hypothesis-driven approach |
| Persona priorities can be determined | If all equal, simplify to behavior-based segmentation |

### Not For

| Context | Why it fails | Use instead |
|---------|--------------|-------------|
| Single-persona products | Mapping is trivial; no priority conflicts | Simple job mapping |
| Platform products (many use cases) | Combinatorial explosion | Use case family mapping |
| API products | Users define their own use cases | Capability inventory |
| Very early stage | No features to map yet | Jobs-to-be-Done research |

### Degrades When

| Condition | Degradation pattern | Mitigation |
|-----------|---------------------|------------|
| Too many personas (>5) | Mapping becomes unwieldy | Consolidate or stratify |
| High feature count (>50) | Complete mapping impractical | Focus on strategic features |
| Rapid feature velocity | Mappings become stale | Integrate into dev process |
| No user research access | Value assessment is guesswork | Proxy with market signals |

### Complementary To

| Framework | Relationship |
|-----------|--------------|
| Feature Taxonomy | Provides feature definitions for mapping |
| Persona Construction | Provides personas to map features to |
| Feature Commonality | Informs which features matter strategically |
| Build/Buy/Partner | Uses mapping output for decisions |

---

## Worked Example: Note-Taking App

### Phase 1: Feature Audit (Sample)

**Personas**: Student, Professional, Creator

| Feature | Primary Persona | Use Case | Confidence |
|---------|----------------|----------|------------|
| Rich text editing | All | Format notes | High |
| Markdown support | Creator | Write efficiently | High |
| File attachments | Professional | Store related docs | High |
| Collaboration | Professional | Work with team | Medium |
| Templates | Creator | Start quickly | Medium |
| Tags | All | Organize notes | High |
| Search | All | Find notes | High |
| Mobile app | Student | Capture on-the-go | High |
| Offline mode | Student | Study anywhere | Medium |
| Spaced repetition | Student | Learn effectively | Low |
| Version history | Professional | Track changes | Low |

**Orphan Features**: Spaced repetition (assumed student need, not validated)

### Phase 2: Job Hierarchy (Student Persona)

**Core Job**: Learn and retain information effectively

**Sub-Jobs**:
- Capture information during class/reading
- Organize notes by course/topic
- Review and study notes
- Connect related concepts

**Related Jobs**:
- Manage assignment deadlines
- Collaborate on group projects
- Track course requirements

**Emotional Jobs**:
- Feel prepared for exams
- Reduce anxiety about forgetting
- Appear organized to self and others

### Phase 3: Multi-Persona Analysis (Search Feature)

| Persona | Use Case | Outcome | Priority |
|---------|----------|---------|----------|
| Student | Find notes from specific lecture | Study the right material | Critical |
| Professional | Find decision from past meeting | Reference in current meeting | Critical |
| Creator | Find draft for continuation | Resume creative work | Important |

**Benefit Translations**:
- **Student**: "Find any note instantly so you're never hunting for last week's lecture before the exam"
- **Professional**: "Search across all notes to pull up that decision from six months ago in seconds"
- **Creator**: "Pick up any draft where you left off without losing momentum"

### Phase 4: Gateway Features

**Feature: Cloud Sync**

| Enables | Type |
|---------|------|
| Multi-device access | Hard |
| Collaboration | Hard |
| Version history | Hard |
| Offline mode (with sync) | Soft |

**Enablement Score**: 4 features enabled
**Assessment**: Gateway feature; required before collaboration roadmap

### Phase 5: Adjacent Opportunities

| Opportunity | Evidence | Competition | Proximity | Priority |
|-------------|----------|-------------|-----------|----------|
| "Study mode" with spaced repetition | Student requests; learning app success | Few note apps have this | Medium | High |
| Meeting notes with action extraction | Professional pain; manual process today | Emerging competitors | High | High |
| Writing publishing pipeline | Creator workflow; export to blog | Low competition in integrated solution | Medium | Medium |

---

## Success Indicators

### Leading Indicators

| Indicator | Healthy State | Warning Sign |
|-----------|---------------|--------------|
| Mapping coverage | >90% features mapped | Many orphan features |
| Multi-persona analysis | Top features analyzed for all personas | One-to-one mappings only |
| Gateway awareness | Dependencies documented | "Why do we need this?" questions |
| Adjacent exploration | Ongoing discovery | Only obvious use cases mapped |

### Lagging Indicators

| Indicator | Healthy State | Warning Sign |
|-----------|---------------|--------------|
| Feature adoption | High for target personas | Low despite "valuable" features |
| Priority satisfaction | Stakeholders aligned | Constant priority debates |
| Differentiation clarity | Clear unique value | "Same as competitors" |
| User feedback match | Requests align with roadmap | Surprised by user needs |

---

## Evolution

### Review Triggers

- [ ] **New persona validated**: Extend mapping to new persona
- [ ] **Major feature release**: Update mappings for new features
- [ ] **User research findings**: Incorporate new job insights
- [ ] **Competitive shift**: Reassess adjacent opportunities
- [ ] **Time**: Quarterly review minimum

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial framework |
