# Entropy Dataset Quality Criteria

This document defines what makes a randomization dataset production-ready vs. a quick starter example.

## Maturity Levels

### Level 1: Starter (10-30 items)
**Status:** Quick example, not production
**Use case:** Demonstrating the concept, early prototyping

**Characteristics:**
- Obvious items that come to mind first
- Limited variety across dimensions
- May have gaps in coverage
- Sufficient for testing workflows

**Upgrade path:** Research to expand, analyze gaps, fill dimensions

---

### Level 2: Functional (30-75 items)
**Status:** Usable but limited
**Use case:** Personal projects, low-stakes ideation

**Characteristics:**
- Covers most obvious territory
- Some unexpected items mixed in
- May repeat patterns or clusters
- Repeated use will show limits

**Upgrade path:** Dimensional analysis, targeted research for gaps

---

### Level 3: Production (75-150 items)
**Status:** Ready for regular use
**Use case:** Client work, published tools, repeated application

**Characteristics:**
- Strong variety across all relevant dimensions
- Unexpected items outnumber obvious ones
- No significant gaps in coverage
- Can sustain repeated use without feeling stale

**Upgrade path:** Edge case research, user feedback integration

---

### Level 4: Comprehensive (150+ items)
**Status:** Reference-quality dataset
**Use case:** Definitive resource, high-frequency tools, teaching

**Characteristics:**
- Exhaustive coverage of possibility space
- Includes edge cases and rare examples
- Documented dimensions and coverage
- Can be subset for specific needs

**Maintenance:** Regular review for dated items, emerging categories

---

## Quality Metrics

### Size Thresholds

| Metric | Starter | Functional | Production | Comprehensive |
|--------|---------|------------|------------|---------------|
| Minimum items | 10 | 30 | 75 | 150 |
| Target items | 20 | 50 | 100 | 200+ |
| Unique items % | 90% | 95% | 99% | 100% |

### Variety Score

Variety is measured across dimensions relevant to the list type.

**Calculation:**
1. Define 3-5 dimensions for the category
2. For each dimension, count how many distinct values appear
3. Variety score = average coverage across dimensions

**Example for Professions:**
- Industry dimension: 8 industries represented → good
- Status dimension: entry to expert → good
- Visibility dimension: all public-facing → gap
- Era dimension: all contemporary → may be intentional

**Thresholds:**
- Starter: May cluster in 1-2 dimensions
- Functional: Covers most dimensions partially
- Production: Good coverage across all dimensions
- Comprehensive: Full coverage including edge cases

### Specificity Score

Items should be concrete enough to spark ideas.

**Measurement:**
- Average character length (target: 20-60 chars)
- Contains specific detail (place, time, condition)?
- Could generate a story question?

**Examples by specificity:**

| Too Vague | Good | Too Complex |
|-----------|------|-------------|
| "Building" | "Abandoned mall food court" | "The third floor conference room of the regional insurance claims processing center during the annual audit" |
| "Worker" | "Court stenographer" | "Person who operates the machine that tests tensile strength of aircraft cables" |
| "Problem" | "Ran out of time" | "Realized the evidence they needed was destroyed in exactly the way that would implicate them if discovered" |

### Freshness Score

How many items would surprise someone familiar with the category?

**Measurement:**
- First-thought items (would come to most people): Should be < 30%
- Second-thought items (reasonable but less obvious): ~40%
- Surprising items (research-derived, unexpected): Should be > 30%

**Test:** Show 10 random items to someone unfamiliar. How many make them say "I wouldn't have thought of that"?

---

## Dimensional Framework

Different list types have different relevant dimensions.

### Professions
1. **Industry:** Medical, legal, construction, tech, arts, service, industrial, government
2. **Status:** Entry-level, skilled, professional, expert, leadership
3. **Visibility:** Public-facing, behind-scenes, hidden
4. **Access:** Physical access (buildings, systems), information access, social access
5. **Rarity:** Common knowledge vs. "jobs most people don't know exist"

### Locations
1. **Access:** Public, semi-public, private, restricted
2. **Setting:** Urban, suburban, rural, wilderness, institutional
3. **Time:** Day vs. night vs. transitional implications
4. **Atmosphere:** Mundane, liminal, sacred, threatening, intimate
5. **Permanence:** Permanent structures, temporary, mobile

### Character Traits/Flaws
1. **Visibility:** Obvious to others vs. hidden
2. **Self-awareness:** Character knows vs. blind spot
3. **Origin:** Innate vs. developed vs. reactive
4. **Manifestation:** Behavioral, emotional, cognitive, relational
5. **Trajectory:** Static vs. can arc

### Objects
1. **Size:** Pocket, carried, furniture, vehicle, structure
2. **Commonality:** Universal, regional, professional, rare
3. **Function:** Tool, decoration, evidence, symbol
4. **Material:** Organic, manufactured, digital, ephemeral
5. **Story potential:** Can it be clue, weapon, macguffin, symbol?

---

## Validation Checklist

### Starter → Functional
- [ ] 30+ unique items
- [ ] No obvious duplicates
- [ ] At least 3 dimensions represented
- [ ] Some items that required research

### Functional → Production
- [ ] 75+ unique items
- [ ] All relevant dimensions covered
- [ ] < 30% first-thought items
- [ ] > 30% research-derived items
- [ ] Average item length 20-60 characters
- [ ] Items can stand alone (no context required)

### Production → Comprehensive
- [ ] 150+ unique items
- [ ] Edge cases included
- [ ] Documented dimensional coverage
- [ ] Tested with users/applications
- [ ] Dated items identified and flagged
- [ ] Expansion strategy documented

---

## Maintenance Guidelines

### Regular Review
- **Quarterly:** Check for dated references (trending terms, defunct companies)
- **Annually:** Reassess dimensional coverage against emerging categories
- **On feedback:** Track items that don't work in practice

### Version Control
- Tag dataset versions
- Note what changed between versions
- Maintain changelog for significant updates

### Documentation
Each production dataset should include:
- Purpose statement (what is this for?)
- Dimensional coverage map
- Known gaps (intentional exclusions)
- Last review date
- Expansion candidates (items to research)

---

## Anti-Patterns

### The Brainstorm Dump
50 items generated in one session without research.
**Problem:** Clusters around first-thoughts, misses dimensions
**Fix:** Research phase with intentional dimension-filling

### The Wikipedia Copy
Entire category list pulled without curation.
**Problem:** Includes unusable items, lacks quality control
**Fix:** Filter for story utility, check each item

### The Dated List
Items that made sense 5 years ago but now feel stale.
**Problem:** "Instagram influencer" instead of timeless roles
**Fix:** Prefer timeless over trendy; flag dated items for review

### The Insider List
Items that only make sense with specialized knowledge.
**Problem:** "FPGA verification engineer" means nothing to most writers
**Fix:** Either explain in item or reserve for specialized lists

### The Vague List
Items too general to spark specific ideas.
**Problem:** "Professional" instead of "Forensic accountant"
**Fix:** Add specificity: who, where, when, what condition?
