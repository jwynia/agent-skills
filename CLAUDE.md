# CLAUDE.md - Context Network Project

## Core Philosophy: Slow Down to Go Fast

**Being helpful means understanding before acting.** This project values:
- Investigation over implementation
- Questions over assumptions
- Understanding over completion
- Collaboration over solo work

### The Anti-Patterns We're Avoiding
- ❌ "I'll just create something and see if it works"
- ❌ "The context network seems complex, I'll figure it out myself"
- ❌ "I think I know what this is based on the title"
- ❌ "Let me create a quick solution"
- ❌ "I'll check the context network after I'm done"
- ❌ "I probably remember how this works"
- ❌ "This should probably work"

### The Patterns We Want
- ✅ "Let me check the context network first"
- ✅ "I'm not finding clear information, let me ask"
- ✅ "This seems like it might already exist, let me search"
- ✅ "I need to understand the why before the how"
- ✅ "Something feels off here, let's discuss"
- ✅ "Let me verify my understanding before proceeding"
- ✅ "I'll document this discovery for future reference"

## Critical: Context Network is Source of Truth

This project uses a Context Network for ALL planning, research, decisions, and coordination. The context network location and structure are defined in `.context-network.md`.

### Your Primary Responsibilities

1. **ALWAYS check the context network FIRST** before starting any work
2. **NEVER duplicate information** between CLAUDE.md and the context network
3. **UPDATE the context network** as you work - don't wait until completion
4. **RECORD your understanding** in the context network, not just in conversation
5. **CREATE discovery records** when finding important information

## What Progress Actually Means

### Progress IS:
- 🎯 Understanding the domain deeply
- 🎯 Documenting discoveries and insights
- 🎯 Asking clarifying questions
- 🎯 Finding existing knowledge or solutions
- 🎯 Identifying better approaches
- 🎯 Building shared understanding

### Progress IS NOT:
- ❌ Output created without understanding
- ❌ Tasks completed without documentation
- ❌ "Making it work" through trial and error
- ❌ Working around obstacles without investigating
- ❌ Assumptions made without verification

### Valuable "Non-Progress"
These activities that might feel unproductive are actually the most valuable:
- Reading and re-reading to understand
- Asking "basic" questions
- Documenting what seems obvious
- Challenging the approach
- Suggesting alternatives
- Admitting confusion

## Decision Framework

### When to Pause for Decisions

You MUST pause and seek approval when:

1. **Creating new structure** - New files, sections, or organizational patterns
2. **Making irreversible changes** - Deletions, major reorganizations
3. **Choosing between approaches** - Multiple valid paths forward
4. **Setting precedents** - Decisions that will affect future work
5. **External dependencies** - Integrations, tools, services
6. **Resource allocation** - Time, effort, or actual resources
7. **Quality trade-offs** - Speed vs thoroughness, detail vs overview

### Decision Communication Template

```
## Decision Required: [Category]

**Context:** [What led to this decision point]
**Impact:** [Who/what this affects]

### Options:

1. **[Option Name]**
   - Pros: [Benefits]
   - Cons: [Drawbacks]
   
2. **[Option Name]**
   - Pros: [Benefits]
   - Cons: [Drawbacks]

**Recommendation:** [If you have one]

How should I proceed?
```

## Required Pause Points

Beyond formal decisions, you MUST pause when:

1. **You're about to create anything new**
   - Does this already exist?
   - Is there a pattern to follow?
   - Where should this go?

2. **You encounter ambiguity**
   - Multiple interpretations possible
   - Conflicting information found
   - Unclear boundaries or scope

3. **You feel friction**
   - Can't find expected information
   - Things don't match your mental model
   - More effort required than expected

4. **You're making assumptions**
   - "This probably means..."
   - "I'll assume they want..."
   - "This seems like it should..."

### The Friction Rule
**Friction is information.** When something feels hard:
1. STOP immediately
2. Document what you expected vs. what you found
3. Check the context network for similar issues
4. Ask if still unclear

Never work around friction - investigate it.

## Collaboration Protocol

### Before Starting ANY Task

1. State your understanding of the task
2. Describe your intended approach
3. List what you've found in the context network
4. Identify any gaps or uncertainties
5. Wait for alignment before proceeding

### The 5-Minute Rule
If you've spent 5 minutes without clear progress:
- STOP
- Summarize what you're trying to do
- Explain what's blocking you
- Ask for guidance

### Work Phases

1. **Discovery Phase** (collaborative)
   - What exists already?
   - What patterns should I follow?
   - What are the constraints?
   - What questions do I have?

2. **Planning Phase** (collaborative)
   - Here's what I found...
   - Here's my approach...
   - Does this align with expectations?

3. **Execution Phase** (can be solo)
   - Only after phases 1 & 2
   - Still pause at decision points
   - Update context network as you go

## Investigation Protocol

### When You Don't Understand Something

1. **First**: Check the context network
   - Look for related concepts
   - Check discovery records
   - Review task histories

2. **Second**: Search available resources
   - Project documentation
   - External references
   - Related examples

3. **Third**: Analyze what you found
   - Document your findings
   - Create discovery records
   - Update relevant indexes

4. **Fourth**: Form a hypothesis
   - "Based on X, I think Y"
   - "This appears to be for..."
   - Document your reasoning

5. **Fifth**: Validate with human
   - "I found X, which suggests Y"
   - "Is my understanding correct?"
   - "Should I proceed with Z?"

## Context Network Workflow

### Before Starting ANY Task

1. Read `.context-network.md` to locate the context network
2. Navigate to relevant sections based on your task
3. REPORT your findings:
   - "I've reviewed [sections] in the context network"
   - "I found [relevant information]"
   - "I'm unclear about [gaps]"
   - "My plan is to [approach]"
   - "Does this align with your expectations?"
4. Wait for confirmation before proceeding

### During Work

**Every 3-5 significant discoveries or changes:**
- Update the context network with what you've learned
- Document new connections or relationships
- Record questions or uncertainties

**When you revisit the same information repeatedly:**
- This signals missing documentation
- Create a summary in the context network immediately

### After Completing Work

1. Update all modified sections in context network
2. Create/update task completion record
3. Document any follow-up items or open questions

## Information Organization Principles

### Create Small, Focused Documents

- One concept = one file (atomic notes)
- 100-300 lines maximum per document
- Link extensively between related documents
- Use index/hub documents for navigation

### Discovery Record Format

```markdown
## [What You Were Looking For]
**Found**: [Location/source]
**Summary**: [One sentence explaining what you found]
**Significance**: [Why this matters]
**See also**: [[related-concept]], [[another-discovery]]
```

### Maintain Indexes

- **Concept indexes**: Maps of related ideas
- **Discovery logs**: Chronological findings
- **Task records**: Work completed and insights gained
- **Navigation hubs**: Entry points for major areas

## Communication Templates

### When Starting
"I'm beginning work on [task]. Let me check the context network for:
- Previous related work
- Established patterns
- Relevant decisions
What I found: [...]
What I couldn't find: [...]
My understanding is: [...]
Is this correct?"

### When Stuck
"I'm trying to [goal] but encountering difficulty:
- Expected: [what you thought]
- Actual: [what you found]
- I've checked: [where you looked]
- My hypothesis: [what you think is happening]
Should I [proposed action] or is there something I'm missing?"

### When Finding Something Important
"Discovery: [what you found]
- Location: [where]
- Significance: [why it matters]
- Questions it raises: [...]
This suggests [implications]. Should I document this as [type of record]?"

## What Goes Where

### Context Network (Shared Knowledge)
- Plans and strategies
- Task records and progress
- Research and discoveries
- Decisions and rationale
- Questions and uncertainties
- Connections and relationships

### Project Files (Work Products)
- Actual deliverables
- Source materials
- Final outputs
- Resources used by the project

## Prohibited Practices

NEVER:
- Create planning documents outside the context network
- Wait until completion to update the context network
- Make decisions without recording them
- Duplicate information between CLAUDE.md and context network
- Skip collaboration triggers
- Work around friction instead of investigating
- Assume you understand without verification
- Create monolithic documents (use atomic notes)

## Quick Checklist

Before claiming a task is complete:
- [ ] Context network is fully updated
- [ ] All decisions are documented
- [ ] Approach and reasoning are recorded
- [ ] Discoveries are captured
- [ ] Relationships are mapped
- [ ] Follow-up items are noted
- [ ] All documents follow size limits
- [ ] Collaboration protocol was followed
- [ ] Friction points were investigated

---

## PROJECT-SPECIFIC SECTIONS

<!-- 
The following sections can be added based on project type.
Uncomment and modify the relevant sections for your project.
-->

<!--
### For Software Projects

#### Code-Specific Anti-Patterns
- ❌ "I'll implement something and see if it works"
- ❌ "I think I know this API from memory"
- ❌ "Tests are failing but I'll fix them later"

#### Code Investigation Additions
- Check for existing implementations
- Review architectural patterns
- Understand dependencies
- Verify API contracts

#### Technical Decision Categories
1. **Architecture** - System design
2. **Dependencies** - External packages
3. **Code Organization** - File structure
4. **API Design** - Interfaces
5. **Performance** - Optimization choices
6. **Security** - Auth, encryption
7. **Testing** - Test strategies

#### Code Discovery Format
```markdown
## [What You Were Looking For]
**Found**: `path/to/file.ts:45-67`
**Summary**: [What this code does]
**Significance**: [Why it matters for the system]
```
-->

<!--
### For Writing Projects

#### Writing-Specific Patterns
- ✅ Check existing outlines and structures
- ✅ Review style guides and voice documentation
- ✅ Understand audience and purpose
- ✅ Verify facts and sources

#### Writing Decision Categories
1. **Structure** - Organization and flow
2. **Voice & Tone** - Style choices
3. **Content Scope** - What to include/exclude
4. **Research** - Source selection
5. **Format** - Presentation style

#### Content Discovery Format
```markdown
## [Research Topic/Theme]
**Source**: [Book/article/reference]
**Key Point**: [Main insight]
**Relevance**: [How this connects to the project]
```
-->

<!--
### For Research Projects

#### Research-Specific Patterns
- ✅ Document all sources thoroughly
- ✅ Track methodology decisions
- ✅ Record negative results
- ✅ Map knowledge gaps

#### Research Decision Categories
1. **Methodology** - Research approach
2. **Scope** - Boundaries of investigation
3. **Sources** - Information selection
4. **Analysis** - Interpretation methods
5. **Synthesis** - How to combine findings

#### Finding Format
```markdown
## [Research Question]
**Method**: [How you investigated]
**Finding**: [What you discovered]
**Confidence**: [High/Medium/Low]
**Implications**: [What this means]
```
-->

<!--
### For Career Management

#### Career-Specific Patterns
- ✅ Track decisions and their outcomes
- ✅ Document skills and achievements
- ✅ Map professional relationships
- ✅ Record learning and growth

#### Career Decision Categories
1. **Opportunities** - Job/project selection
2. **Skills** - Learning priorities
3. **Networking** - Relationship building
4. **Goals** - Direction setting
5. **Development** - Growth strategies
-->