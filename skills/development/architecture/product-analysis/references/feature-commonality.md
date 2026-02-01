# Feature Commonality Analysis Framework

## The Problem

Knowing what features exist across competitors isn't enough. You need to know:

1. **What's table stakes?** Features every serious competitor has. Missing these disqualifies you.
2. **What's emerging?** Features gaining adoption but not yet universal. The trend line matters.
3. **What differentiates?** Features few have that create competitive advantage.
4. **What's missing everywhere?** Gaps no one has filled that might represent opportunities—or graveyards.

**Without prevalence analysis, you might**:
- Build table stakes thinking they're differentiators
- Miss emerging standards and seem dated at launch
- Overinvest in rare features that don't matter to buyers
- Chase "differentiation" in graveyards where many have tried and failed

**The cost**: Building the wrong things, with the wrong emphasis, for the wrong strategic purpose.

---

## Core Principles

### 1. Prevalence is Not Priority

That everyone has a feature doesn't mean users value it highly. That no one has it doesn't mean users want it.

**Prevalence** describes the competitive landscape.
**Value** describes user importance.
**Strategic classification** requires both.

A feature can be high-prevalence and low-value (expected noise—include but don't emphasize). A feature can be low-prevalence and high-value (opportunity—if validated).

### 2. Trajectory Matters More Than Snapshot

A feature present in 30% of products but growing rapidly differs strategically from one at 30% and shrinking.

**Questions beyond "what percent have it?"**:
- Is this percentage increasing or decreasing?
- Are market leaders adding or removing it?
- Are new entrants including it by default?
- Is there discussion/demand driving adoption?

### 3. Segment Before Generalizing

"All competitors" masks important distinctions:
- Enterprise vs. SMB products have different prevalence patterns
- Market leaders vs. followers differ
- Price tiers create different expectations

A feature that's table stakes in enterprise may be a differentiator in SMB. Analyze the relevant competitive set for your context.

### 4. Depth Affects Classification

A feature with minimal implementations across the market might be:
- Table stakes at the minimal level
- A differentiator at best-in-class depth

"Has search" at 90% prevalence with most being basic text search means advanced search is a differentiator despite "search" being table stakes.

### 5. Opportunity Requires Validation

Just because no one has built something doesn't mean it's an opportunity.

**Absence might indicate**:
- No demand (graveyard)
- Technical infeasibility
- Unprofitable at current prices
- Strategic irrelevance
- Hidden regulatory barriers

Gaps require validation before treating as opportunities.

---

## Key Vocabulary

| Term | Definition |
|------|------------|
| **Prevalence** | The percentage of analyzed competitors offering a feature. Core metric for classification. |
| **Table Stakes** | Features with ≥80% prevalence. Expected by buyers; absence is disqualifying. |
| **Emerging Standard** | Features with 50-79% prevalence and positive trajectory. Becoming expected. |
| **Contested** | Features with 30-49% prevalence. Split market; valid to have or not. Strategic choice. |
| **Differentiator** | Features with 10-29% prevalence that create competitive advantage when done well. |
| **Rare/Gap** | Features with <10% prevalence. Either opportunity or graveyard. |
| **Feature Trajectory** | Direction of prevalence change over time: growing, stable, declining. |
| **Value-Prevalence Matrix** | 2x2 mapping features by user value (high/low) and prevalence (high/low) to reveal strategic quadrants. |
| **Competitive Segment** | A subset of competitors grouped by characteristic (size tier, market position, pricing tier). |
| **Depth-Adjusted Prevalence** | Prevalence recalculated at a specific implementation depth tier. |

---

## The Classification Framework

### Prevalence Tiers

| Tier | Prevalence | Strategic Meaning |
|------|------------|-------------------|
| **Table Stakes** | ≥80% | Expected. Not having it is disqualifying. Competing on depth is difficult. |
| **Emerging Standard** | 50-79% | Becoming expected. Plan to have it. Early depth leadership still possible. |
| **Contested** | 30-49% | Split market. Valid to have or not. Requires strategic justification either way. |
| **Differentiator** | 10-29% | Rare enough to matter. Having it is notable. Absence is acceptable. |
| **Rare/Gap** | <10% | Almost no one has it. Either opportunity (validate demand) or graveyard (validate why absent). |

### Trajectory Overlays

| Trajectory | Indicators | Strategic Implication |
|------------|------------|----------------------|
| **Growing** | YoY adoption increasing; new entrants include it; market leaders adding it | Will likely move up a tier. Plan for it. |
| **Stable** | Consistent prevalence over time; no major changes | Tier is reliable for planning. |
| **Declining** | Decreasing prevalence; products removing it; no new adoptions | May become legacy. Consider dropping or not adding. |

### The Value-Prevalence Matrix

```
                    HIGH USER VALUE           LOW USER VALUE
                    ─────────────────────────────────────────
HIGH PREVALENCE  │ MUST-HAVE              │ EXPECTED NOISE     │
(Table Stakes)   │ Must match or exceed   │ Include but don't  │
                 │ market depth           │ over-invest        │
                 ├────────────────────────┼────────────────────┤
MEDIUM           │ STRATEGIC BET          │ ME-TOO TRAP        │
PREVALENCE       │ Differentiate on depth │ Low value to build │
(Emerging/       │ or adjacent value      │ despite market     │
Contested)       │                        │ presence           │
                 ├────────────────────────┼────────────────────┤
LOW PREVALENCE   │ OPPORTUNITY            │ GRAVEYARD          │
(Differentiator/ │ Potential competitive  │ No one builds it   │
Gap)             │ advantage if validated │ because no one     │
                 │                        │ wants it           │
                 └────────────────────────┴────────────────────┘
```

**Quadrant actions**:

- **Must-Have**: Match market standard at minimum. Exceeding creates minor advantage.
- **Expected Noise**: Include with minimal investment. Don't highlight in marketing.
- **Strategic Bet**: Invest if aligned with positioning. Could become differentiator.
- **Me-Too Trap**: Avoid unless trivial to add. Doesn't move the needle.
- **Opportunity**: Validate demand rigorously. If validated, invest heavily.
- **Graveyard**: Do not build. Investigate why others don't have it.

---

## Process

### Phase 1: Market Definition

**Input**: Product category, analysis purpose
**Output**: Product list with segmentation

**Steps**:

1. **Define category boundaries**:
   - What products qualify as "in this space"?
   - What are the inclusion criteria?
   - Use output from [Competitive Niche Boundary Framework](competitive-niche-boundary.md) if available

2. **List all qualifying products**:
   - Aim for 8-15 for meaningful statistical analysis
   - Include: market leaders, notable challengers, recent entrants
   - Exclude: abandoned products, extreme niches

3. **Segment the product list**:
   - By tier: Enterprise / Mid-market / SMB
   - By position: Leader / Challenger / Follower / Niche
   - By pricing: Premium / Standard / Freemium / Free

4. **Decide analysis scope**:
   - Full market? (for general positioning)
   - Your tier only? (for direct competition)
   - Leaders only? (for aspiration benchmarking)

**Output template**:

```markdown
## Market Definition: [Category]

### Inclusion Criteria
- [Criterion 1]
- [Criterion 2]

### Products Analyzed (N=[count])
| Product | Tier | Position | Pricing | Notes |
|---------|------|----------|---------|-------|
| [Name] | [Tier] | [Position] | [Price] | [Notable characteristics] |

### Segmentation Summary
| Segment | Count | Products |
|---------|-------|----------|
| Enterprise | [N] | [List] |
| Mid-market | [N] | [List] |
| SMB | [N] | [List] |
```

---

### Phase 2: Prevalence Calculation

**Input**: Feature taxonomy (from [Feature Taxonomy Framework](feature-taxonomy.md)), product list
**Output**: Feature prevalence table

**Steps**:

1. **For each canonical feature, record which products have it**:
   - Use consistent criteria for "has feature"
   - Note depth tier if available
   - Mark clearly absent vs. unknown

2. **Calculate prevalence**:
   ```
   Prevalence = (products with feature) / (total products) × 100
   ```

3. **Calculate depth-adjusted prevalence** (if using facets):
   ```
   Prevalence at [Tier] = (products at or above [Tier]) / (total products) × 100
   ```

4. **Classify each feature into prevalence tier**:
   - ≥80% = Table Stakes
   - 50-79% = Emerging Standard
   - 30-49% = Contested
   - 10-29% = Differentiator
   - <10% = Rare/Gap

**Output template**:

```markdown
## Feature Prevalence: [Category] (N=[product count])

### By Domain

#### [Domain 1]
| Feature | Has It | Prevalence | Tier |
|---------|--------|------------|------|
| [Feature 1] | [N]/[Total] | [%] | [Tier] |

### Summary by Tier
| Tier | Count | % of Features |
|------|-------|---------------|
| Table Stakes | [N] | [%] |
| Emerging Standard | [N] | [%] |
| Contested | [N] | [%] |
| Differentiator | [N] | [%] |
| Rare/Gap | [N] | [%] |
```

---

### Phase 3: Trajectory Assessment

**Input**: Current prevalence data, historical perspective
**Output**: Trajectory-annotated prevalence table

**Steps**:

1. **For each feature, assess historical direction**:

| Source | What to Look For |
|--------|------------------|
| Prior analyses | Was prevalence higher/lower 12-24 months ago? |
| Product changelogs | Recent additions/removals of this feature? |
| Industry trends | Is this feature being discussed/requested? |
| New entrants | Do new products include this by default? |
| Market leaders | Have leaders added this recently? |

2. **Assign trajectory**:
   - **Growing**: Prevalence increasing; new products include it
   - **Stable**: Consistent over time
   - **Declining**: Prevalence decreasing; products removing it

3. **Note confidence in trajectory assessment**:
   - High: Multiple data points over time
   - Medium: Some signals but limited history
   - Low: Estimated based on market trends

**Output template**:

```markdown
## Feature Trajectories

| Feature | Current Tier | Trajectory | Evidence | Confidence |
|---------|--------------|------------|----------|------------|
| [Feature] | [Tier] | [Growing/Stable/Declining] | [What indicates] | [H/M/L] |
```

---

### Phase 4: Value Overlay

**Input**: Prevalence data, user research, market signals
**Output**: Value-Prevalence classification

**Steps**:

1. **For each feature (or feature cluster), assess user value**:

| Signal | High Value Indicator | Low Value Indicator |
|--------|---------------------|---------------------|
| User mentions | Frequently discussed, praised | Rarely mentioned |
| Buyer criteria | Listed in requirements | Not in consideration |
| Usage data | Heavily used | Barely used |
| Price correlation | Premium products emphasize | Not differentiated by price |
| Churn correlation | Absence causes churn | Not a churn driver |
| Support tickets | Requested frequently | Never requested |

2. **Classify as High or Low value**:
   - Binary for simplicity
   - When in doubt, default to analyzing as "unknown"

3. **Plot features on Value-Prevalence Matrix**:
   - Identify which quadrant each feature falls into
   - Note features near boundaries

**Output template**:

```markdown
## Value-Prevalence Matrix Placement

### Must-Have (High Value, High Prevalence)
- [Feature]: [Why high value]
- [Feature]: [Why high value]

### Opportunity (High Value, Low Prevalence)
- [Feature]: [Validation status]
- [Feature]: [Validation status]

### Expected Noise (Low Value, High Prevalence)
- [Feature]: [Why still include]

### Me-Too Trap (Low Value, Medium Prevalence)
- [Feature]: [Why to avoid]

### Graveyard (Low Value, Low Prevalence)
- [Feature]: [Why absent]
```

---

### Phase 5: Strategic Classification

**Input**: All prior analysis, your specific product/situation
**Output**: Strategic feature classification for your product

**Steps**:

1. **For your specific situation, classify each feature**:

| Classification | Criteria | Action |
|---------------|----------|--------|
| **Must Match** | Table stakes + high value | Parity required; match market depth |
| **Should Match** | Emerging standards; growing trajectory | Plan to add; timeline based on trajectory |
| **Opportunity to Lead** | Gap or differentiator + high value + validated | Invest heavily if validated |
| **Can Ignore** | Low value regardless of prevalence | Do not build; explain if asked |
| **Watch** | Uncertain value or trajectory | Monitor; do not act yet |

2. **Prioritize within classifications**:
   - Must Match: by impact of absence
   - Should Match: by trajectory speed
   - Opportunity: by validation confidence

3. **Document strategic rationale** for each classification

**Output template**:

```markdown
## Strategic Classification for [Your Product]

### Must Match (Parity Required)
| Feature | Current State | Target State | Gap | Priority |
|---------|--------------|--------------|-----|----------|
| [Feature] | [Have/Don't have/Partial] | [Target depth] | [What's missing] | P0/P1/P2 |

### Should Match (Plan to Add)
| Feature | Trajectory | Timeline Implication | Priority |
|---------|------------|---------------------|----------|
| [Feature] | [Growing/fast] | [When needed] | P1/P2/P3 |

### Opportunity to Lead (Differentiation)
| Feature | Value Evidence | Validation Status | Investment Level |
|---------|---------------|-------------------|------------------|
| [Feature] | [Evidence] | [Validated/Hypothesis] | High/Medium |

### Can Ignore
| Feature | Rationale |
|---------|-----------|
| [Feature] | [Why we're not building] |

### Watch List
| Feature | Trigger for Reclassification |
|---------|------------------------------|
| [Feature] | [What would change our assessment] |
```

---

## Anti-Patterns

### 1. Prevalence Without Value

**Pattern**: Classifying features purely by how many competitors have them.

**Signs**:
- Building everything that's common
- Ignoring user priorities
- Product becomes bloated average
- No differentiation despite full feature list

**Why it fails**: Prevalence tells you the competitive landscape; value tells you where to invest. Building every common feature with equal emphasis produces mediocrity.

**The test**: For each feature you're building, can you cite user value evidence?

**Fix**: Always overlay user value. Table stakes get minimum viable depth; must-haves get investment.

---

### 2. Gap Enthusiasm

**Pattern**: Treating every market gap as an opportunity.

**Signs**:
- Excitement about features no one has built
- No investigation of why the gap exists
- "Differentiation" that users don't want
- Building for graveyards

**Why it fails**: Gaps require validation. Absence might mean no demand, technical infeasibility, or regulatory barriers. Many gaps are graveyards.

**The test**: Why don't competitors have this? Have others tried and failed?

**Fix**: Require validation evidence for any gap-based investment. Investigate why the gap exists before celebrating it.

---

### 3. Segment Blindness

**Pattern**: Treating "the market" as monolithic.

**Signs**:
- Comparing your SMB product to enterprise leaders
- Feeling behind on features your segment doesn't need
- Single prevalence calculation across all tiers
- Positioning against irrelevant competitors

**Why it fails**: Table stakes for enterprise differ from SMB. Leaders have different expectations than challengers. Analyzing irrelevant segments produces irrelevant conclusions.

**The test**: Is your competitive set segmented by tier, position, or pricing?

**Fix**: Segment analysis to your relevant competitive set. Different prevalence for different segments.

---

### 4. Depth Conflation

**Pattern**: Counting feature presence without accounting for implementation depth.

**Signs**:
- Marking yourself "have" when competitors are best-in-class
- False confidence in feature parity
- "We have search" when competitors have AI-powered semantic search
- Checkmarks hiding meaningful gaps

**Why it fails**: A minimal implementation may effectively be absent for demanding users. Depth determines competitive position within a feature.

**The test**: At what depth tier is 80% of the market? Is that your target depth?

**Fix**: Calculate depth-adjusted prevalence. A feature may be table stakes at basic depth but a differentiator at advanced depth.

---

### 5. Static Analysis

**Pattern**: Single-point-in-time analysis treated as permanent truth.

**Signs**:
- Referencing 18-month-old competitive analysis
- Missing that emerging standards have become table stakes
- Surprise at competitor moves
- No trigger for refresh

**Why it fails**: Markets evolve. What's contested today is table stakes tomorrow. Static analysis becomes progressively misleading.

**The test**: When did you last update prevalence data?

**Fix**: Build in refresh cadence. Major releases, new entrants, and funding announcements trigger review.

---

## Boundaries

### Assumes

| Assumption | If violated... |
|------------|----------------|
| Valid feature taxonomy exists | Use [Feature Taxonomy Framework](feature-taxonomy.md) first |
| Products are comparable | Prevalence across incomparable segments misleads |
| User value can be assessed | Matrix degenerates to prevalence-only analysis |
| Market is somewhat stable | Hyperdynamic markets need continuous analysis |
| Sample size is adequate (8+) | Prevalence percentages become noisy |

### Not For

| Context | Why it fails | Use instead |
|---------|--------------|-------------|
| Brand-new categories (<5 products) | Insufficient N for meaningful prevalence | Qualitative competitive analysis |
| Extreme customization (ERP) | "Feature" depends on configuration | Use-case analysis |
| Platform/ecosystem competition | Network effects > features | Platform strategy framework |
| Substitute competition | Comparing across categories incoherent | Jobs-to-be-Done analysis |

### Degrades When

| Condition | Degradation pattern | Mitigation |
|-----------|---------------------|------------|
| Uneven analysis depth | Biased prevalence | Standardize analysis protocol |
| Value is guessed, not researched | "Opportunity" = wishlist | Ground value in user evidence |
| Analysis done once | Outdated classifications | Scheduled refresh cadence |
| Too few products (<5) | Noisy percentages | Combine with qualitative signals |

### Complementary To

| Framework | Relationship |
|-----------|--------------|
| Feature Taxonomy | Use before this; provides feature definitions |
| Persona Construction | Informs value assessment |
| Feature-Persona-Use Case Mapping | Uses this output for priority decisions |
| Build/Buy/Partner | Strategic classification informs build decisions |

---

## Worked Example: Project Management Tools

### Phase 1: Market Definition

**Category**: Team project management tools
**Scope**: Mid-market focus (50-500 employee companies)

**Products Analyzed** (N=12):

| Product | Tier | Position | Pricing |
|---------|------|----------|---------|
| Asana | Mid-market | Leader | Premium |
| Monday.com | Mid-market | Leader | Premium |
| ClickUp | Mid-market | Challenger | Freemium |
| Notion | Cross-market | Challenger | Freemium |
| Teamwork | Mid-market | Follower | Standard |
| Wrike | Enterprise/Mid | Follower | Premium |
| Basecamp | SMB/Mid | Niche | Standard |
| Trello | SMB/Mid | Follower | Freemium |
| Smartsheet | Enterprise/Mid | Follower | Premium |
| Height | Mid-market | New entrant | Freemium |
| Linear | Dev-focused | Niche | Freemium |
| Airtable | Cross-market | Challenger | Freemium |

### Phase 2: Prevalence Calculation (Sample)

**Domain: Task Management**

| Feature | Has It | Prevalence | Tier |
|---------|--------|------------|------|
| Task creation | 12/12 | 100% | Table Stakes |
| Due dates | 12/12 | 100% | Table Stakes |
| Assignees | 12/12 | 100% | Table Stakes |
| Subtasks | 11/12 | 92% | Table Stakes |
| Task dependencies | 9/12 | 75% | Emerging Standard |
| Recurring tasks | 10/12 | 83% | Table Stakes |
| Custom fields | 10/12 | 83% | Table Stakes |
| Multiple views (list/board/calendar) | 11/12 | 92% | Table Stakes |
| Gantt charts | 8/12 | 67% | Emerging Standard |
| Workload management | 6/12 | 50% | Contested |
| Time tracking (native) | 5/12 | 42% | Contested |
| AI task suggestions | 3/12 | 25% | Differentiator |
| Proofing/approval workflows | 4/12 | 33% | Contested |

### Phase 3: Trajectory Assessment (Sample)

| Feature | Current Tier | Trajectory | Evidence |
|---------|--------------|------------|----------|
| AI task suggestions | Differentiator | Growing (fast) | All leaders adding; press coverage; user demand |
| Gantt charts | Emerging | Stable | Long-standing; not changing |
| Time tracking | Contested | Growing (slow) | Some additions; demand for all-in-one |
| Custom fields | Table Stakes | Stable | Universal; not changing |
| Workload management | Contested | Growing | Leaders emphasizing; resource planning trending |

### Phase 4: Value Overlay (Sample)

**Must-Have (High Value, High Prevalence)**:
- Task dependencies: Critical for real project management; blocks work
- Custom fields: Enables workflow customization; high usage
- Multiple views: Different users need different visualizations

**Opportunity (High Value, Low Prevalence)**:
- AI task suggestions: High demand in user feedback; limited implementations
- Workload management: Growing need; limited good solutions

**Expected Noise (Low Value, High Prevalence)**:
- Recurring tasks: Expected but rarely differentiates
- Subtasks: Everyone has; rarely discussed

**Graveyard**:
- Social features (activity feeds, likes): Tried by many, used by few

### Phase 5: Strategic Classification (for a new entrant)

**Must Match**:
| Feature | Gap Analysis |
|---------|-------------|
| Task creation, due dates, assignees | Table stakes; must have day 1 |
| Multiple views | At least list + board; calendar nice-to-have |
| Custom fields | Basic implementation required |
| Subtasks | Simple nesting required |

**Should Match** (6-month roadmap):
| Feature | Timeline Rationale |
|---------|-------------------|
| Task dependencies | Growing expectation; needed for serious use |
| Gantt charts | Market expects for project planning |

**Opportunity to Lead**:
| Feature | Validation Status |
|---------|------------------|
| AI task assistance | High demand; leaders investing; differentiation window |
| Workload management | Gap in intuitive solutions; team resource pain common |

**Can Ignore**:
| Feature | Rationale |
|---------|-----------|
| Native time tracking | Integrations sufficient; not buyer criteria |
| Social features | Graveyard; low value despite attempts |

---

## Success Indicators

### Leading Indicators

| Indicator | Healthy State | Warning Sign |
|-----------|---------------|--------------|
| Segmentation clarity | Analysis scoped to relevant competitors | "The market" treated as one |
| Value grounding | Value assessment based on evidence | Value assumed from prevalence |
| Trajectory confidence | Multiple signals per feature | Trajectory guessed |
| Classification freshness | Updated within 6 months | Analysis > 12 months old |

### Lagging Indicators

| Indicator | Healthy State | Warning Sign |
|-----------|---------------|--------------|
| Strategic alignment | Features built match classification | Building graveyard features |
| Market perception | Seen as competitive on expected features | "Missing basic features" feedback |
| Differentiation effectiveness | Unique features create advantage | Differentiation efforts unnoticed |
| Investment efficiency | Resources focused on high-value areas | Even distribution regardless of value |

---

## Evolution

### Review Triggers

- [ ] **Time**: Minimum every 6 months
- [ ] **Market event**: Major competitor release, acquisition
- [ ] **New entrant**: New product enters with different feature set
- [ ] **Technology shift**: New capability becomes possible (AI, etc.)
- [ ] **Strategy shift**: Your positioning or target market changes

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial framework |
