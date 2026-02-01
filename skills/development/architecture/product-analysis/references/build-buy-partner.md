# Build/Buy/Partner Decision Framework

## The Problem

Given competitive analysis, founders and PMs face a recurring decision: **Should we build this capability, buy/integrate an existing solution, or partner with someone who already has it?**

This decision is made poorly because of:

**The Build Default**: Technical founders assume building is always better, underestimating integration costs while overestimating their ability to catch up to established products.

**The Crowded Market Confusion**: A crowded market can mean "proven demand, room for better solution" OR "commodity space, no differentiation possible." Without a framework, you can't tell which.

**The Feature Parity Mirage**: Seeing what exists creates false confidence. "They have 20 features; we can build 20 features" ignores the invisible iteration behind each.

**The Good Enough Threshold Ignorance**: Not knowing when "good enough" is actually good enough leads to over-engineering (building for perfection) or under-engineering (shipping inadequate solutions).

**The Partner Blindness**: Partnership is often invisible because it requires a different mental model—contribution instead of control.

**The consequences**:
- Building things that already exist (wasted resources)
- Missing integration opportunities (slower time to market)
- Entering markets that can't be won (strategic failure)
- Avoiding markets that are winnable (missed opportunity)

---

## Core Principles

### 1. Strategic Value is the Denominator

Every build/buy decision divides by strategic importance.

- High strategic value + any cost = **consider building**
- Low strategic value + any cost = **consider buying**

The question isn't "can we build it?" but "should this be our build focus?"

**Strategic importance test**: Would your differentiation meaningfully depend on your implementation of this capability? If yes, consider building. If no, buy the best available.

### 2. Crowded Markets Require Narrative

A crowded market is neither good nor bad in itself. It requires a compelling answer to:

> "Why will customers switch to you despite having options?"

If you have that answer (a **switching catalyst**), crowding validates demand.
If you don't, crowding means commodity trap.

### 3. Integration Cost Reality

The "buy" option includes hidden costs:
- Implementation and customization
- Vendor management overhead
- Integration maintenance
- Lock-in and switching costs

These are often higher than sticker price but still lower than full custom development. Always calculate total cost of buying, not just license fee.

### 4. Differentiation is Positional

Differentiation opportunities exist in gaps between what current solutions provide and what customers actually need.

These gaps are found in **jobs not done well** by existing solutions, not in novel features nobody asked for.

Being different isn't valuable. Being different in ways that make customers switch is valuable.

### 5. Good Enough is Contextual

The threshold for "good enough to enter" depends on customer switching costs, not product quality alone.

- **Low switching costs**: You need to be significantly better + have switching catalyst
- **High switching costs**: You need to be merely viable + have compelling reason to move + reduce switching friction

---

## Key Vocabulary

| Term | Definition |
|------|------------|
| **Strategic Differentiator** | A capability where your implementation creates competitive advantage. Build here. |
| **Commodity Capability** | A capability that doesn't differentiate. Building here dilutes focus. Buy here. |
| **Switching Catalyst** | The specific reason customers would leave an existing solution for yours. Required for entering crowded markets. |
| **Feature Convergence Zone** | Capabilities that every product in a space eventually develops. Building first here is temporary advantage at best. |
| **Integration Debt** | The ongoing cost of maintaining connections to bought/partnered solutions. |
| **Build Tax** | The opportunity cost of allocating engineering resources to build instead of differentiate. |
| **Good Enough Threshold** | The minimum viable capability level to be considered by customers. Varies by switching costs. |
| **Crowded Market Narrative** | The story explaining why customers will choose you despite options. Required for crowded entry. |
| **Partner Contribution** | What you bring to a partnership that the partner can't easily replicate. Determines leverage. |
| **Velocity Requirement** | How fast you need the capability. Build = slow. Buy = fast. Partner = fastest (if available). |

---

## Process

### Step 1: Strategic Classification

**Input**: Capability to evaluate
**Output**: Strategic category assignment

**Classify the capability into one of four categories**:

| Category | Criteria | Default Direction |
|----------|----------|-------------------|
| **Core Differentiator** | Creates competitive advantage; customers choose you partly because of this; your implementation would be better than alternatives | Build |
| **Strategic Enabler** | Necessary for core differentiators to work; affects customer experience but doesn't differentiate alone | Evaluate carefully |
| **Necessary Infrastructure** | Must exist but doesn't differentiate; commodity capability; standard solution works fine | Buy |
| **Nice-to-Have** | Optional enhancement; not strategically critical; unclear if users value | Defer or Buy minimal |

**The 80/20 Test**: If this capability is in your differentiating 20%, bias toward build. If it's in the necessary 80%, bias toward buy.

**Warning**: Founders overclassify as "Core Differentiator."

**Substitution test**: If customers wouldn't notice or care whether this was your implementation vs. a standard one, it's not core. If "we use [standard solution] for this" would be a non-answer to prospects, it's not core.

**Output template**:

```markdown
## Strategic Classification: [Capability]

**Classification**: [Core Differentiator / Strategic Enabler / Infrastructure / Nice-to-Have]

**Rationale**:
- Does this create competitive advantage? [Yes/No - why]
- Would customers notice our implementation vs. standard? [Yes/No - why]
- Is this in our differentiating 20%? [Yes/No]

**Substitution Test**: If we said "we use [alternative] for this," would prospects:
- [ ] Not care (→ Infrastructure)
- [ ] Be slightly disappointed (→ Strategic Enabler)
- [ ] Question our differentiation (→ Core Differentiator)
```

---

### Step 2: Market Landscape Assessment

**Input**: Capability + strategic classification
**Output**: Market landscape characterization

**If the capability exists in the market, characterize it**:

| Dimension | Question | How to Assess |
|-----------|----------|---------------|
| **Crowding Level** | How many products offer this? | Count direct solutions |
| **Quality Variance** | How different are existing solutions? | Low = commodity; High = positioning opportunity |
| **Customer Satisfaction** | Are users happy with existing options? | Reviews, NPS data, churn rates |
| **Switching Costs** | How hard is it to change solutions? | Data portability, integration dependencies, learning curve |
| **Convergence Status** | Are all solutions becoming similar? | Convergence = commodity; Divergence = positioning possible |

**Crowded Market Interpretation Matrix**:

| Pattern | Interpretation | Implication |
|---------|---------------|-------------|
| Many options + High satisfaction + Low variance | Commodity | Don't build. Buy leading commodity. |
| Many options + Low satisfaction + High variance | Room for better solution | Build if you have switching catalyst |
| Few options + Low satisfaction | Underserved market | Build (first mover opportunity) |
| Few options + High satisfaction | Dominant incumbent | Buy from them or partner |
| Growing options + Mixed satisfaction | Emerging market | Assess your switching catalyst strength |

**Output template**:

```markdown
## Market Landscape: [Capability]

**Crowding**: [None / Low (1-3) / Medium (4-7) / High (8+)]
**Quality Variance**: [Low / Medium / High]
**Customer Satisfaction**: [Low / Medium / High] - Evidence: [source]
**Switching Costs**: [Low / Medium / High]
**Convergence**: [Converging / Stable / Diverging]

**Pattern Match**: [Pattern from matrix]
**Interpretation**: [What this means for our decision]
```

---

### Step 3: Switching Catalyst Identification

**Input**: Market landscape (especially for crowded markets)
**Output**: Switching catalyst (or absence of one)

**If considering entering a crowded space, you need a switching catalyst**—the specific reason customers would leave their current solution for yours.

**Catalyst Types**:

| Catalyst Type | Description | Strength | Risk |
|---------------|-------------|----------|------|
| **Price** | 10x cheaper for same value | Weak | Easily matched by incumbents |
| **Integration** | Works with their stack in ways competitors don't | Medium | Defensible but narrow |
| **Job Fit** | Solves the job better for a specific segment | Strong | Positions in niche |
| **Platform Effect** | Part of bundle delivering broader value | Strong | Creates switching costs |
| **Experience** | Dramatically simpler, faster, more pleasant | Medium | Requires significant gap |
| **Architecture** | Technical superiority enabling new capabilities | Strong | Requires validation |

**The No-Catalyst Rule**: If you can't articulate a switching catalyst that will move customers despite their existing solutions, don't build. A better product without a switching catalyst is an orphan product.

**Catalyst Validation Questions**:
- Can you name 10 potential customers who would switch for this reason?
- Does your evidence show customers actually cite this pain?
- Would incumbents struggle to match this catalyst? Why?

**Output template**:

```markdown
## Switching Catalyst Analysis: [Capability]

**Do we have a switching catalyst?** [Yes / No / Uncertain]

**If yes:**
- Type: [Price / Integration / Job Fit / Platform / Experience / Architecture]
- Specific catalyst: [Why customers would switch]
- Evidence: [What supports this]
- Defensibility: [Why competitors can't easily match]

**If no:**
- Why entry is still justified: [Rationale] OR
- Recommendation: Do not enter this market

**Validation Status**: [Validated with customers / Hypothesized / Untested]
```

---

### Step 4: Good Enough Threshold Determination

**Input**: Market landscape + switching catalyst
**Output**: Minimum viable capability specification

**Determine what "good enough to enter" actually means**:

| Market Characteristic | Good Enough Threshold |
|-----------------------|----------------------|
| Low switching costs | Only slightly better + clear switching catalyst |
| High switching costs | Dramatically better + catalyst + migration path |
| High customer satisfaction | Must solve a job they didn't know they had, or serve a subset much better |
| Low customer satisfaction | Must solve the main job adequately + catalyst |
| Converged features | Table stakes on everything + differentiation on catalyst |

**The Minimum Viable Gap**: What's the smallest implementation that clears the good enough threshold? Building beyond this is wasted effort for market entry (though may matter for retention later).

**Threshold Components**:

1. **Feature parity baseline**: What must exist to be taken seriously?
2. **Catalyst implementation**: How must your catalyst be demonstrated?
3. **Switching friction reduction**: What makes transition easier?

**Output template**:

```markdown
## Good Enough Threshold: [Capability]

**Feature Parity Baseline**:
- [ ] [Feature 1] - because: [why required]
- [ ] [Feature 2] - because: [why required]

**Catalyst Implementation**:
- [How switching catalyst must manifest]

**Switching Friction Reduction**:
- [ ] [Migration support needed]
- [ ] [Transition path needed]

**Gap Assessment**:
- Current state: [What we have / don't have]
- To reach threshold: [What's needed]
- Effort estimate: [Rough scope]
```

---

### Step 5: Build/Buy/Partner Decision

**Input**: All previous steps
**Output**: Decision with documented rationale

**Apply the decision matrix**:

| If... | And... | Then... | Because... |
|-------|--------|---------|------------|
| Core differentiator | Switching catalyst exists | **BUILD** | This is where you win |
| Core differentiator | No switching catalyst | **RETHINK** | Can't enter this market |
| Strategic enabler | Adequate solutions exist | **BUY** | Conserve engineering for core |
| Strategic enabler | No adequate solutions | **BUILD** (reluctantly) | Enables core, unavoidable |
| Necessary infrastructure | Any | **BUY** | Commodity; never build |
| Nice-to-have | Any | **DEFER** or **BUY minimal** | Not strategic |
| Speed critical | Partners exist with capability | **PARTNER** | Fastest path |
| Need capability + distribution | Partner has distribution | **PARTNER** | Distribution > control |

**If BUILD**:

- What scope? (minimum to exceed threshold)
- What timeline? (informed by trajectory from commonality analysis)
- What resources? (team, budget)
- What milestones? (how to know if it's working)

**If BUY**:

- Which solution? (top 2-3 candidates)
- What's total cost? (license + integration + maintenance + lock-in risk)
- What's integration scope? (how deeply embedded)
- What's exit strategy? (if solution fails or vendor fails)

**If PARTNER**:

- Who would partner? (realistic candidates)
- What do we contribute? (our leverage)
- What do they contribute? (their value)
- What's dependency risk? (if partnership fails)

**Output template**:

```markdown
## Build/Buy/Partner Decision: [Capability]

### Classification Summary
- Strategic category: [Core / Enabler / Infrastructure / Nice-to-have]
- Market pattern: [From Step 2]
- Switching catalyst: [Yes/No + description]
- Good enough threshold: [Summary]

### Decision: [BUILD / BUY / PARTNER / DEFER / DO NOT ENTER]

### Rationale
[2-3 sentences on why this decision]

### Key Risks
1. [Risk 1]
2. [Risk 2]

### Reversibility
[How hard to change course if wrong]

---

### If BUILD:
**Scope**: [What specifically to build]
**Timeline**: [How long to reach good enough]
**Resources**: [What it takes]
**Success criteria**: [How we know it's working]

### If BUY:
**Leading candidates**: [Options]
**Total cost estimate**: [License + integration + ongoing]
**Integration scope**: [How deeply embedded]
**Lock-in risk**: [Switching cost later]
**Exit strategy**: [If vendor/solution fails]

### If PARTNER:
**Candidates**: [Who]
**Our contribution**: [What we bring]
**Their contribution**: [What they bring]
**Dependency risk**: [What if partnership fails]
**Leverage assessment**: [Do we have negotiating power?]
```

---

## Anti-Patterns

### 1. NIH Syndrome (Not Invented Here)

**Pattern**: Defaulting to build because existing solutions aren't exactly what you want.

**Signs**:
- "We could build it better"
- Extensive customization requirements for non-differentiating features
- Dismissing buy options for minor capability gaps
- Engineering prefers building to integrating

**Why it fails**: Building everything dilutes focus. Engineering time on non-differentiators is stolen from differentiators. The "better" you build may not be better enough to matter.

**The test**: Would customers notice and value our implementation over standard? If no, buy.

**Fix**: Apply strategic classification ruthlessly. If it's not core, the bar for "build it better" should be extremely high.

---

### 2. Crowded Market Aversion

**Pattern**: Avoiding markets because competition exists.

**Signs**:
- "There are already 10 products doing this"
- Searching for empty spaces regardless of demand validation
- Fear of competition rather than analysis of it
- Equating crowded with unwinnable

**Why it fails**: Empty markets are often empty for a reason (no demand). Crowded markets prove demand. The question isn't "is there competition?" but "do we have a switching catalyst?"

**The test**: Why would customers switch to us? If you have a compelling answer, crowding validates demand.

**Fix**: Analyze the crowding. High competition + low satisfaction = opportunity. High competition + high satisfaction = commodity.

---

### 3. Infinite Differentiation Pursuit

**Pattern**: Seeking differentiators that don't matter to customers.

**Signs**:
- Novel features nobody asked for
- "Unique" positioning that doesn't drive purchase decisions
- Differentiation that doesn't connect to switching catalysts
- "We're different because..." that customers don't care about

**Why it fails**: Differentiation only matters if it creates switching. Being different isn't valuable; being different in ways that make customers switch is valuable.

**The test**: Would this differentiation appear on a buyer's decision criteria?

**Fix**: Ground differentiation in jobs not done well. Your differentiation should solve a real gap, not be a random novelty.

---

### 4. Integration Cost Blindness

**Pattern**: Choosing buy because sticker price is low, without calculating total integration cost.

**Signs**:
- Comparing build cost to license fee (not total cost of buying)
- Surprise at integration complexity
- Ongoing vendor management burden
- Hidden customization needs

**Why it fails**: Buying includes implementation, customization, training, integration maintenance, vendor management, and lock-in costs. These often approach build costs for complex capabilities.

**The test**: Have you calculated total cost of buying including integration, maintenance, and switching costs?

**Fix**: Calculate honest total cost: license + implementation + customization + ongoing integration maintenance + eventual switching cost. Compare to build cost honestly.

---

### 5. Partner Option Blindness

**Pattern**: Seeing only build and buy, missing partnership opportunities.

**Signs**:
- Binary decision framing
- No consideration of who might benefit from your success
- Slow market entry when partners could accelerate
- Controlling where contribution would work better

**Why it fails**: Partnerships can deliver capability faster than building while avoiding buy lock-in. Valuable when you have distribution or complementary capability to offer.

**The test**: Who already has this capability and would benefit from our success?

**Fix**: Before any build/buy decision, ask: Is there a partnership opportunity? Do we have something to contribute?

---

## Boundaries

### Assumes

| Assumption | If violated... |
|------------|----------------|
| Competitive niche is understood | Use [Competitive Niche Boundary Framework](competitive-niche-boundary.md) first |
| Strategic priorities are clear | Clarify what differentiates the business before applying |
| Some market evidence exists | Novel capabilities need prototype validation |
| Organization can execute on "build" | If no engineering capacity, only buy/partner remain |
| Time exists for analysis | Crisis situations need faster heuristics |

### Not For

| Context | Why it fails | Use instead |
|---------|--------------|-------------|
| Personal/hobby projects | Strategic classification doesn't apply | Personal preference |
| Imposed requirements (compliance) | No choice to make | Build what's required |
| Active crisis (production down) | No time for analysis | Buy fastest fix, reassess later |
| Internal features only you use | No competitive dynamic | Effort/value analysis |

### Degrades When

| Condition | Degradation pattern | Mitigation |
|-----------|---------------------|------------|
| Rapidly evolving market | Analysis outdated before implementation | Shorten decision horizons |
| Unclear strategy | All classifications become arbitrary | Fix strategy first |
| Partnership-hostile culture | Partner option ignored | Address cultural barrier |
| No access to market data | Landscape assessment is guesswork | Mark confidence levels |

### Complementary To

| Framework | Relationship |
|-----------|--------------|
| Competitive Niche Boundary | Provides market understanding this requires |
| Feature Commonality Analysis | Informs what's table stakes vs. differentiator |
| Feature-Persona-Use Case Mapping | Informs strategic importance of capabilities |
| Technical architecture | Build decisions cascade into architecture |

---

## Worked Example: Analytics Dashboard

### Context

A B2B SaaS startup building a customer success platform needs to decide how to handle analytics/reporting for their customers.

### Step 1: Strategic Classification

**Capability**: Analytics dashboard for customer health metrics

**Classification**: **Strategic Enabler**

**Rationale**:
- Customer success platforms are expected to show customer health data
- Our differentiation is in the predictive models and actions, not the dashboards
- Dashboards are necessary but not where we win
- Customers would accept "powered by [analytics tool]" for this component

**Substitution test**: If we said "we use Metabase/Looker for dashboards," would prospects:
- [x] Be slightly disappointed (→ Strategic Enabler)

### Step 2: Market Landscape

**Analytics Dashboard Solutions**:

| Dimension | Assessment |
|-----------|------------|
| Crowding | High (Metabase, Looker, Mode, Tableau, custom, etc.) |
| Quality Variance | Medium (broadly similar, some depth differences) |
| Satisfaction | Medium (works but complaints about flexibility) |
| Switching Costs | Medium (embedded queries, training, bookmarks) |
| Convergence | Converging (features becoming similar) |

**Pattern Match**: Many options + Medium satisfaction + Converging = **Mature commodity with room for niche improvements**

### Step 3: Switching Catalyst Analysis

**Do we have a switching catalyst?** No, and we don't need one.

We're not trying to win on dashboards. We're trying to win on customer success predictions and recommended actions. Dashboards are the canvas, not the painting.

**Implication**: We don't need to beat dashboard tools. We need dashboards good enough to display our differentiated insights.

### Step 4: Good Enough Threshold

**Feature Parity Baseline**:
- [ ] Basic visualization types (line, bar, pie, tables)
- [ ] Filtering and date ranges
- [ ] Drill-down capability
- [ ] Export (PDF, CSV)
- [ ] Scheduled reports

**Catalyst Implementation**: N/A—our catalyst is in the predictions, not the charts

**Gap Assessment**:
- Building from scratch: 3-6 months, 2 engineers
- Embedding existing: 2-4 weeks, 1 engineer + integration

### Step 5: Decision

**Decision**: **BUY** (embed analytics solution)

**Rationale**: Dashboards are strategic enabler, not differentiator. Market has mature solutions. Our engineering should focus on predictive models (our core differentiator), not charting libraries. Embedding gets us to market faster with proven UX.

**Leading candidates**:
1. Metabase (embedded) - open source, customizable
2. Cube.js - headless, flexible
3. Preset (hosted Superset) - managed, polished

**Total cost estimate**:
- License: $0-$500/mo (depending on option)
- Integration: 3-4 weeks engineering
- Ongoing: ~1 day/month maintenance
- vs. Build: 4+ months engineering + ongoing feature development

**Lock-in risk**: Medium. Data model and queries become embedded. Mitigation: use standard SQL where possible; abstract the visualization layer.

**Exit strategy**: Can migrate to different embedded tool or build custom if this becomes differentiator later. Data layer is ours; only visualization is bought.

---

## Success Indicators

### Leading Indicators

| Indicator | Healthy State | Warning Sign |
|-----------|---------------|--------------|
| Classification clarity | Clear core vs. commodity | Everything feels "core" |
| Catalyst articulation | Can state switching reason | "We're just better" without specifics |
| Cost honesty | Full cost comparison | Comparing build to sticker price |
| Partner consideration | Partnership evaluated | Only build/buy considered |

### Lagging Indicators

| Indicator | Healthy State | Warning Sign |
|-----------|---------------|--------------|
| Engineering focus | Most effort on differentiators | Building commodity features |
| Market entry speed | Fast for non-core | Slow everywhere |
| Differentiation realized | Switching catalyst works | "Better" but no switches |
| Integration quality | Buy decisions work well | Integration debt growing |

---

## Evolution

### Review Triggers

- [ ] **Strategic shift**: Core vs. commodity changes
- [ ] **Market shift**: New solutions emerge; existing solutions fail
- [ ] **Build maturity**: What we built has grown; reassess
- [ ] **Partner changes**: Partnership dynamics shift
- [ ] **Time**: Annual review of major decisions

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial framework |
