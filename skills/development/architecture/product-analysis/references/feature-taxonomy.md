# Feature Taxonomy Framework

## The Problem

When analyzing competing products, you face a terminology babel:

1. **Different names, same capability**: Slack calls it "channels," Discord calls it "servers," Teams calls it "teams"—but they're all "persistent group chat spaces"

2. **Same names, different depths**: Everyone has "search," but implementations range from basic text matching to semantic AI with filters and operators

3. **Blurred boundaries**: Is dark mode a "feature" or a "setting"? Is mobile support a "feature" or a "platform"? Is "integrations" one feature or fifty?

4. **Invisible features**: Some capabilities are so expected they go unmentioned in marketing (undo, copy-paste, basic navigation)—but their absence would be noticed

5. **Feature inflation**: Marketing lists create artificial counts. "500+ features!" tells you nothing useful.

**Without a systematic way to identify, name, and categorize features, competitive analysis becomes a collection of incomparable lists.** You end up with feature matrices where a checkmark means different things in different columns.

**The cost**:
- Misjudging what competitors actually offer
- Missing gaps that represent opportunities
- Building features that sound differentiated but aren't
- Underestimating table stakes requirements

---

## Core Principles

### 1. Canonical over Colloquial

Establish a neutral vocabulary that describes what a feature *does*, not what any vendor *calls* it.

- "Real-time collaborative editing" is canonical
- "Google Docs-style editing" is colloquial (and biased)

Canonical names should work for a product that doesn't have the feature yet. If someone building from scratch couldn't understand the name, it's too vendor-specific.

### 2. Function before Form

Classify by the job the feature performs, not its UI surface.

A Kanban board and a Gantt chart both serve "visual work tracking" but differ in their "temporal representation model." The function is the same; the form differs.

This principle prevents you from treating every UI variation as a distinct feature while missing that they serve the same purpose.

### 3. Depth is Dimensional, Not Binary

Features exist on spectrums. "Has search" is insufficient; "search supports: filters/Boolean/semantic/cross-object" captures depth.

A feature matrix full of checkmarks tells you nothing about competitive position. A feature at "basic" depth may be effectively absent for demanding users.

### 4. Context Determines Granularity

The right level of decomposition depends on your analysis purpose:

| Purpose | Appropriate Granularity |
|---------|------------------------|
| Market positioning | High-level capability domains |
| Build vs. buy decisions | Feature-level with depth tiers |
| Engineering planning | Facet-level implementation details |
| Sales enablement | Benefit-level (outcomes, not capabilities) |

Don't create a 500-feature taxonomy when 50 will serve your purpose.

### 5. Capabilities Compound

Some features only make sense given the presence of others. Track dependencies, not just presence.

"Permission management" is meaningless without "multi-user support." "Workflow automation" requires "trigger events." Understanding these dependencies reveals which features are actually accessible vs. theoretically present.

---

## Key Vocabulary

| Term | Definition |
|------|------------|
| **Capability Domain** | A high-level area of functionality (e.g., "Collaboration," "Analytics," "Workflow Automation"). The broadest useful grouping. Aim for 5-8 domains per product category. |
| **Feature** | A distinct, nameable unit of functionality that delivers user value. The level at which marketing speaks and users make decisions. |
| **Feature Facet** | A dimension along which a feature varies (e.g., a "search" feature has facets: scope, operators, speed, results display). |
| **Implementation Depth** | How thoroughly a feature addresses its problem space. Ranges from "minimal viable" to "best-in-class." |
| **Canonical Name** | The vendor-neutral, function-describing name for a feature. Used consistently across all products in analysis. |
| **Vendor Name** | What a specific product calls the feature. Mapped to canonical name. |
| **Feature Cluster** | A group of features that commonly appear together and serve related user needs. |
| **Prerequisite Feature** | A feature that must exist for another to make sense (e.g., "multi-user" is prerequisite for "permissions"). |
| **Feature Surface** | Where and how a feature manifests to users (UI, API, CLI, background process). |
| **Depth Tier** | A standardized level for comparing implementation depth (Minimal, Basic, Advanced, Best-in-class). |

---

## The Taxonomy Structure

### Level 1: Capability Domains

Broad categories that organize the feature space. Derived from user journey stages and job-to-be-done clusters.

**Guidelines for domain definition**:
- Each domain should have a coherent "job" it serves
- Aim for 5-8 domains (fewer = too abstract; more = fragmented)
- Domains should be mutually exclusive at the feature level
- Domain names should be neutral (not vendor-specific)

**Example domains for a project management tool**:
- Planning & Organization
- Execution & Tracking
- Collaboration & Communication
- Reporting & Analytics
- Integration & Extensibility
- Administration & Security

### Level 2: Features

Specific capabilities within a domain. Named canonically.

**Guidelines for feature definition**:
- Apply the "job test": does this solve a nameable user problem?
- Settings, UI chrome, and platform basics usually aren't features
- If it would appear on a pricing comparison page, it's probably a feature
- If users specifically ask for it, it's probably a feature

**Example features within "Collaboration & Communication"**:
- Real-time co-editing
- Threaded commenting
- @-mention notifications
- Activity feeds
- Video conferencing (embedded)
- File sharing & versioning

### Level 3: Feature Facets

Dimensions that distinguish implementations of the same feature.

**Example facets for "Real-time co-editing"**:

| Facet | Description | Value Spectrum |
|-------|-------------|----------------|
| Latency | How quickly edits appear to others | <100ms → <1s → <5s → noticeable lag |
| Conflict resolution | How simultaneous edits are handled | Last-write-wins → CRDT/OT → Manual merge |
| Presence indicators | How other users are shown | None → Avatar icons → Selection → Live cursors |
| Offline support | What happens without connectivity | None → Read-only → Queue → Full offline |
| Object types | What can be co-edited | Text only → Tables → Rich content → All |

---

## Process

### Phase 1: Domain Discovery

**Input**: Product category definition, 3-5 representative products
**Output**: Domain list with job descriptions

**Steps**:

1. **List all high-level capabilities** mentioned across:
   - Product marketing pages
   - Feature comparison sites
   - User reviews (what they praise/complain about)
   - Documentation/help centers

2. **Group related capabilities** into candidate domains:
   - What job does this cluster serve?
   - Could a user complete this job with just these features?

3. **Test domain boundaries**:
   - Does each domain have a coherent "job" it serves?
   - Are features clearly assignable to one domain?
   - Could you describe the domain without listing features?

4. **Refine to 5-8 domains** (fewer = too abstract; more = fragmented)

**Output template**:

```markdown
## Capability Domains for [Category]

| Domain | Job It Serves | Example Features |
|--------|---------------|------------------|
| [Domain 1] | [What users accomplish] | [3-5 representative features] |
| [Domain 2] | ... | ... |
```

---

### Phase 2: Feature Enumeration

**Input**: Domain list, product access or detailed documentation for 3+ competitors
**Output**: Feature list with canonical names and vendor mappings

**Steps**:

1. **For each product, list every distinct capability**:
   - Ignore vendor names initially
   - Focus on what the capability does
   - Include hidden/assumed capabilities

2. **For each capability, write a canonical description**:
   - Verb + object format ("filter search results," "assign tasks to users")
   - No vendor references
   - Function before form

3. **Deduplicate across products**:
   - When different names describe the same job, choose canonical name
   - Document the mapping

4. **Assign to domains**:
   - If a feature fits multiple domains, assign to primary
   - Note cross-domain features

**Output template**:

```markdown
## Feature: [Canonical Name]
**Domain**: [Parent domain]
**Job**: [What user accomplishes]
**Description**: [2-3 sentence explanation]

### Vendor Mappings
| Vendor | Their Name | Location | Notes |
|--------|-----------|----------|-------|
| [Product A] | [Their name] | [Where in product] | [Implementation notes] |
| [Product B] | [Their name] | [Where in product] | [Implementation notes] |
| [Product C] | — (absent) | — | [Why absent or workaround] |
```

---

### Phase 3: Facet Definition

**Input**: Feature list, detailed product exploration
**Output**: Facet definitions per feature

**Steps**:

1. **For each feature, ask**: "In what ways do implementations vary?"
   - Speed/performance
   - Scope/breadth
   - Flexibility/customization
   - User experience polish
   - Edge case handling

2. **List dimensions of variation** (these become facets)

3. **For each facet, define the spectrum**:
   - What's minimal viable?
   - What's basic/standard?
   - What's advanced?
   - What's best-in-class?

4. **Order facets by strategic importance**:
   - Which variations matter most to users?
   - Which differentiate competitors?

**Output template**:

```markdown
## Feature Facets: [Canonical Name]

| Facet | Description | Minimal | Basic | Advanced | Best-in-class |
|-------|-------------|---------|-------|----------|---------------|
| [Facet 1] | [What this captures] | [Min bar] | [Standard] | [Above avg] | [Leading] |
| [Facet 2] | ... | ... | ... | ... | ... |
```

---

### Phase 4: Depth Calibration

**Input**: Feature and facet definitions, competitive analysis goals
**Output**: Depth tier definitions and assessments per feature

**Steps**:

1. **For each feature, assess implementation depth** across competitors using facet values

2. **Create depth tier definitions** with concrete criteria:

| Tier | General Definition | Criteria Pattern |
|------|-------------------|------------------|
| **Minimal** | Technically present but barely functional | Only most basic facet values |
| **Basic** | Functional for simple use cases | Standard facet values; no advanced |
| **Advanced** | Serves demanding users well | Above-standard on key facets |
| **Best-in-class** | Industry-leading implementation | Leads on most/all facets |

3. **Assess each competitor** against tier definitions

**Output template**:

```markdown
## Depth Assessment: [Canonical Name]

### Tier Definitions for This Feature
| Tier | Criteria |
|------|----------|
| Minimal | [Specific criteria for this feature] |
| Basic | [Specific criteria] |
| Advanced | [Specific criteria] |
| Best-in-class | [Specific criteria] |

### Competitor Depth Assessment
| Product | Depth Tier | Key Facet Values | Notes |
|---------|-----------|------------------|-------|
| [Product A] | Advanced | [Values] | [Why this tier] |
| [Product B] | Basic | [Values] | [Why this tier] |
```

---

### Phase 5: Dependency Mapping

**Input**: Complete feature list
**Output**: Dependency graph

**Steps**:

1. **For each feature, ask**: "What must exist for this to make sense?"
   - Technical prerequisites
   - User experience prerequisites
   - Business model prerequisites

2. **Document prerequisite relationships**:
   - Hard prerequisites (feature is impossible without)
   - Soft prerequisites (feature is impaired without)

3. **Identify feature clusters** that always appear together

4. **Note enhancement relationships**:
   - Features that multiply another's value
   - Features commonly purchased/activated together

**Output template**:

```markdown
## Feature Dependencies

### Prerequisite Map
| Feature | Hard Prerequisites | Soft Prerequisites |
|---------|-------------------|-------------------|
| [Feature A] | [Required features] | [Enhancing features] |

### Feature Clusters
| Cluster Name | Features | Why They Group |
|--------------|----------|----------------|
| [Cluster 1] | [Feature list] | [Shared job or technical basis] |

### Enhancement Relationships
| Base Feature | Enhanced By | Multiplier Effect |
|--------------|-------------|-------------------|
| [Feature] | [Enhancer] | [How value increases] |
```

---

## Anti-Patterns

### 1. Vendor Name Pollution

**Pattern**: Using one vendor's terminology as the canonical vocabulary.

**Signs**:
- Analysis reads like comparing everyone to Salesforce/Jira/Slack
- Other products described as "like [Vendor]'s X but..."
- Canonical names only make sense if you know the reference product

**Why it fails**: Biases analysis toward incumbent. Makes comparison harder for anyone unfamiliar with reference product. May not accurately describe what the feature does.

**The test**: Would a vendor without the feature understand the canonical name?

**Fix**: Create truly neutral names that describe function. "Persistent group chat spaces" instead of "Slack channels."

---

### 2. The Everything-is-a-Feature Trap

**Pattern**: Treating every UI element or setting as a feature.

**Signs**:
- Taxonomy has 200+ "features"
- Items like "Save button" alongside "AI-powered insights"
- Settings pages decomposed into individual features
- Can't distinguish major capabilities from implementation details

**Why it fails**: Creates noise. Important differences buried in trivia. Comparisons become meaningless.

**The test**: Does this unit of functionality solve a nameable user problem? Would a user specifically ask for it or notice its absence?

**Fix**: Apply the job test ruthlessly. Settings, UI chrome, and platform basics usually aren't features. If it wouldn't appear on a pricing comparison page, it probably isn't a feature.

---

### 3. Binary Blindness

**Pattern**: Recording feature presence/absence without capturing depth.

**Signs**:
- Feature matrix full of checkmarks and X's
- "Yes" for both minimal and best-in-class implementations
- Can't explain why one product's implementation is better
- False confidence in feature parity

**Why it fails**: A checkmark doesn't distinguish between a feature that barely works and one that's industry-leading. "Has search" covers both basic text matching and sophisticated semantic search.

**The test**: Could two products with the same checkmark have meaningfully different implementations?

**Fix**: Require facet assessment for every feature, or at minimum a depth tier. "Has it" is insufficient for competitive analysis.

---

### 4. Static Taxonomy Syndrome

**Pattern**: Creating taxonomy once and never updating as the category evolves.

**Signs**:
- New products introduce capabilities that don't fit existing domains
- Emerging features get shoehorned or ignored
- Taxonomy older than 12 months without revision
- AI features added as afterthought to "Other" domain

**Why it fails**: Categories evolve. What was a differentiator becomes table stakes. New capability types emerge. Static taxonomy becomes progressively less useful.

**The test**: When did you last review the taxonomy against new market entrants?

**Fix**: Build in quarterly taxonomy review. New entrants and major releases trigger review. Treat taxonomy as living document with version history.

---

### 5. Granularity Mismatch

**Pattern**: Same level of detail everywhere, regardless of strategic importance.

**Signs**:
- Equal detail on core differentiators and table stakes
- Analysis buries insights in noise
- 20 pages on commodity features, 1 page on differentiators
- Can't find what matters

**Why it fails**: Analysis resources are finite. Equal depth everywhere means insufficient depth where it matters.

**The test**: Does detail level match strategic importance?

**Fix**: Calibrate depth to decision relevance. Differentiating areas get facet-level analysis; table stakes get presence/absence or simple depth tier.

---

## Boundaries

### Assumes

| Assumption | If violated... |
|------------|----------------|
| Products in analysis serve similar user needs | Comparing apples to oranges; taxonomy won't align |
| You have sufficient access to understand capabilities | Taxonomy based on marketing, not reality |
| Features can be observed and tested | Internal/hidden features create blind spots |
| The category has some stability | Rapidly evolving categories need more frequent updates |
| Analysis is for software products | Physical products have different feature dynamics |

### Not For

| Context | Why it fails | Use instead |
|---------|--------------|-------------|
| Comparing products across different categories | No shared capability domains | Market positioning analysis |
| Evaluating non-functional requirements | Reliability, performance aren't features | Technical due diligence |
| Assessing team/support quality | Feature taxonomy is about product | Vendor evaluation framework |
| Early-stage market with few products | Insufficient N for meaningful taxonomy | Capability inventory |

### Degrades When

| Condition | Degradation pattern | Mitigation |
|-----------|---------------------|------------|
| Analyst doesn't use products | Surface-level taxonomy missing depth | Require hands-on trial for key features |
| Too many products (>15) | Maintaining consistent comparison unwieldy | Tier products; deep analysis on top 5-7 |
| Category has no clear boundaries | Taxonomy scope creeps indefinitely | Define explicit inclusion criteria first |
| Products heavily customizable | "Feature" depends on configuration | Document default vs. available configurations |

### Complementary To

| Framework | Relationship |
|-----------|--------------|
| Competitive Niche Boundary | Use before this to define which products to analyze |
| Feature Commonality Analysis | Use after this to classify features by prevalence |
| Jobs-to-be-Done | Use before this to understand what jobs features serve |
| Requirements Analysis | Taxonomy informs what to evaluate; requirements inform what matters |

---

## Worked Example: Email Marketing Tools

### Phase 1: Domain Discovery

Analyzing: Mailchimp, ConvertKit, ActiveCampaign, Klaviyo, HubSpot (email)

**Domains identified**:

| Domain | Job It Serves | Example Features |
|--------|---------------|------------------|
| **Contact Management** | Organize and understand your audience | Lists, segments, tags, contact profiles |
| **Campaign Creation** | Build and design email content | Templates, drag-drop editor, personalization |
| **Automation** | Send right message at right time without manual work | Workflows, triggers, sequences |
| **Delivery & Sending** | Get emails into inboxes | Send scheduling, deliverability tools, throttling |
| **Analytics & Reporting** | Understand what's working | Open rates, click tracking, revenue attribution |
| **Integration & Data** | Connect with other systems | API, native integrations, data sync |

### Phase 2: Feature Enumeration (Sample)

**Feature: Behavioral Trigger Automation**

**Domain**: Automation
**Job**: Automatically send emails based on what contacts do
**Description**: System monitors contact behavior (purchases, page views, email engagement) and triggers email sequences or individual messages based on defined conditions.

| Vendor | Their Name | Location | Notes |
|--------|-----------|----------|-------|
| Mailchimp | Customer Journeys | Automations | Limited triggers on free plan |
| ConvertKit | Automations | Automations tab | Visual builder, event-based |
| ActiveCampaign | Automations | Automations | Very powerful, complex |
| Klaviyo | Flows | Flows section | E-commerce focused triggers |
| HubSpot | Workflows | Automation | Enterprise features gated |

### Phase 3: Facet Definition (Sample)

**Feature Facets: Behavioral Trigger Automation**

| Facet | Description | Minimal | Basic | Advanced | Best-in-class |
|-------|-------------|---------|-------|----------|---------------|
| Trigger types | What events can start automation | Email opens only | Opens + clicks + form submits | + purchases + page views | + custom events + predictive |
| Branching logic | Conditional paths | None | Yes/No splits | Multi-branch + nested | + A/B split + scoring |
| Timing controls | When messages send | Immediate only | + fixed delay | + time windows | + optimal send time AI |
| Exit conditions | When contacts leave flow | Manual only | Single condition | Multiple conditions | + goal completion + conditional |
| Performance visibility | How you see what's working | Basic counts | + per-step metrics | + conversion tracking | + revenue attribution |

### Phase 4: Depth Calibration (Sample)

**Depth Assessment: Behavioral Trigger Automation**

| Product | Depth Tier | Key Differentiators |
|---------|-----------|---------------------|
| ActiveCampaign | Best-in-class | Deepest branching, predictive sending, extensive triggers |
| Klaviyo | Advanced | E-commerce triggers excellent, good analytics |
| ConvertKit | Basic | Simple but limited, creator-focused |
| Mailchimp | Basic | Wide but shallow, key features paywalled |
| HubSpot | Advanced | Powerful but enterprise features gated |

### Phase 5: Dependency Mapping (Sample)

**Prerequisites for Behavioral Trigger Automation**:
- **Hard**: Contact database, email sending capability
- **Soft**: Segmentation (to target automations), tracking pixels (for behavioral data)

**Enhanced by**:
- E-commerce integration (enables purchase triggers)
- Website tracking (enables browse behavior triggers)
- Lead scoring (enables score-based triggers)

---

## Success Indicators

### Leading Indicators

| Indicator | Healthy State | Warning Sign |
|-----------|---------------|--------------|
| Canonical name clarity | Anyone can understand feature names | Names require vendor context |
| Depth differentiation | Can distinguish minimal from advanced | Binary presence/absence only |
| Cross-product consistency | Same features compared same way | Ad hoc naming per product |
| Update frequency | Reviewed with major releases | Taxonomy older than 12 months |

### Lagging Indicators

| Indicator | Healthy State | Warning Sign |
|-----------|---------------|--------------|
| Analysis utility | Informs actual decisions | Produces comparisons nobody uses |
| Positioning clarity | Clear where products differ | "They're all pretty similar" |
| Feature gap identification | Reveals opportunities | Misses obvious differentiators |
| Build/buy accuracy | Correctly estimates capability gaps | Surprised by implementation depth |

---

## Evolution

### Review Triggers

- [ ] **Time**: Minimum quarterly review
- [ ] **Market event**: Major new entrant, significant release, acquisition
- [ ] **Analysis gap**: Feature doesn't fit existing taxonomy
- [ ] **Technology shift**: New capability type emerges (e.g., AI features)

### Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-31 | Initial framework |
