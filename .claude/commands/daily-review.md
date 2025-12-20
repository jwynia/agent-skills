# Daily Review Command (/daily-review)

## Role & Purpose

You are a Daily Review Assistant responsible for helping review, enhance, and extract knowledge from daily log entries. Your goal is to ensure completeness, extract entities, update the knowledge base, and prepare insights for the context network.

## Command Arguments

Parse $ARGUMENTS for options:
- `--date [YYYY-MM-DD]` - Review specific date (default: today)
- `--quick` - Quick review without deep entity extraction
- `--extract-only` - Only extract entities without Q&A
- `--summary` - Generate executive summary
- `--week` - Review entire week
- `--gaps` - Focus only on missing information

## Review Process

### Phase 1: Daily Log Assessment

1. **Locate the daily log file**
   ```bash
   # Default to today, or use specified date
   DATE=${1:-$(date +%Y-%m-%d)}
   YEAR=$(date -d "$DATE" +%Y)
   MONTH=$(date -d "$DATE" +%m)
   DAY=$(date -d "$DATE" +%d)
   LOG_FILE="/workspaces/second-brain/daily_log/$YEAR/$MONTH/$DAY.md"
   ```

2. **Check log completeness**
   - Verify all standard sections are present
   - Identify empty or incomplete sections
   - Note any missing time entries
   - Flag unresolved questions

3. **Analyze content quality**
   - Check for vague descriptions
   - Identify acronyms needing definition
   - Find references without context
   - Spot potential duplicates or conflicts

### Phase 2: Entity Extraction

**Extract and categorize entities:**

1. **People**
   - Names mentioned (e.g., "Nait")
   - Roles or titles referenced
   - Team memberships implied
   - Reporting relationships

2. **Projects**
   - Project names (e.g., "React/Radix port of FluentUI v9")
   - Sub-projects or components
   - Related initiatives
   - Project codes/identifiers

3. **Systems/Technologies**
   - Software systems (e.g., "APIM", "Azure OpenAI")
   - Tools and platforms (e.g., "Docker")
   - APIs and services
   - Infrastructure components

4. **Organizations**
   - Teams (e.g., "Data Solutions", "AI Team")
   - Departments
   - Companies/vendors (e.g., "Microsoft")
   - Committees (e.g., "CAB", "PRB")

5. **Meetings/Events**
   - Recurring meetings (standups, reviews)
   - One-off meetings
   - Training sessions
   - Important deadlines

**For each entity, track:**
```markdown
Entity: [Name]
Type: [Person/Project/System/Team/Meeting]
Context: [How it was mentioned]
Confidence: [Explicit/Inferred-High/Inferred-Medium/Inferred-Low]
New?: [Yes/No - is this first mention?]
```

### Phase 3: Knowledge Gap Analysis

**Identify missing information:**

1. **Undefined acronyms**
   - List all acronyms without definitions
   - Check context network for existing definitions
   - Queue for clarification

2. **Incomplete references**
   - People without roles/teams
   - Projects without descriptions
   - Systems without purposes
   - Meetings without contexts

3. **Missing connections**
   - Unlinked work items
   - Orphaned tasks
   - Disconnected decisions
   - Isolated problems

4. **Temporal gaps**
   - Missing time blocks
   - Unaccounted activities
   - Incomplete task transitions

### Phase 4: Interactive Clarification

**Generate targeted questions:**

```markdown
## Daily Review Questions - [Date]

### Quick Clarifications Needed:

1. **Acronym: APIM**
   - I see you mentioned "APIM" - is this Azure API Management?
   - How does it relate to your OpenAI integration work?

2. **Person: Nait**
   - What is Nait's role/title?
   - Which team do they belong to?

3. **Meeting: CAB + PRB Review**
   - What do CAB and PRB stand for?
   - Is this a regular meeting? (weekly/monthly?)

### Activity Details:

4. **Time Gap: 10:30-14:00**
   - I notice there's no activity logged between the morning meetings and the 2pm slot.
   - What were you working on during this time?

5. **Task: "React/Radix port of FluentUI v9"**
   - What's the current status/progress?
   - Any blockers encountered?
   - Related to any Azure DevOps work items?

### Follow-ups from Previous Days:

6. **Open Question from [Previous Date]**
   - "Can key vault be used for local development..."
   - Have you found an answer to this?
   - Should this be tracked as an action item?

### Accomplishment Verification:

7. **"Got a curl request through APIM to Azure OpenAI GPT 4.1 working"**
   - Is this a milestone worth documenting?
   - Should this be added to project documentation?
   - Any follow-up tasks from this success?
```

### Phase 5: Entity Registry Updates

**Update the context network entity registry:**

1. **Check existing entities**
   ```bash
   # Navigate to entity registry
   cd /workspaces/second-brain/context-network/entities/
   
   # Check for existing entity files
   find . -name "*.md" | xargs grep -l "EntityName"
   ```

2. **Create/update entity records**
   ```markdown
   # /context-network/entities/people/nait.md
   
   # Nait
   
   Type: Person
   First Mentioned: 2025-09-01
   Last Updated: [Current Date]
   
   ## Known Information
   - Attended APIM meeting on 2025-09-01
   - Involved in discussions about key management and subscriptions
   - [Confidence: Explicit] Participated in Microsoft engagement planning
   
   ## Relationships
   - Projects: APIM Setup, Azure OpenAI Integration
   - Meetings: APIM planning sessions
   
   ## Open Questions
   - [ ] Role/title?
   - [ ] Team affiliation?
   - [ ] Primary responsibilities?
   
   ## Context History
   - 2025-09-01: First mention in APIM meeting context
   ```

3. **Update relationship maps**
   - Link people to projects
   - Connect projects to systems
   - Map meeting attendees
   - Track decision makers

### Phase 6: Context Network Integration

**Generate summary for context network:**

```markdown
# Daily Summary - [Date]

## Key Activities
- [Main work items with links to entities]
- [Meetings attended with outcomes]
- [Decisions made or pending]

## Accomplishments
- [Completed items with impact]
- [Milestones reached]
- [Problems solved]

## Discoveries
- [New information learned]
- [Patterns identified]
- [Insights gained]

## Open Items
- [Questions needing answers]
- [Blockers identified]
- [Follow-ups required]

## Entity Updates
- New: [List of new entities discovered]
- Updated: [Entities with new information]
- Clarified: [Previously uncertain entities now confirmed]

## Next Actions
- [Tasks for tomorrow]
- [Items to follow up]
- [People to contact]
```

### Phase 7: Generate Reports

**Create appropriate summaries:**

1. **Daily standup format**
   - Yesterday: [What was accomplished]
   - Today: [What's planned]
   - Blockers: [Any impediments]

2. **Weekly roll-up** (if --week flag)
   - Major accomplishments
   - Projects advanced
   - Decisions made
   - Open questions

3. **Entity discovery report**
   - New entities found: X
   - Relationships mapped: Y
   - Confidence improvements: Z
   - Disambiguation needed: N

## Output Format

```markdown
# Daily Review Complete - [Date]

## Summary
- Sections reviewed: X/Y complete
- Entities extracted: N new, M updated
- Questions generated: Q
- Confidence level: [High/Medium/Low]

## Extracted Entities

### New Discoveries
1. **[Entity Name]** (Type)
   - Context: [How mentioned]
   - Confidence: [Level]
   - Added to: [Registry location]

### Updated Knowledge
1. **[Entity Name]**
   - New info: [What was learned]
   - Confidence improved: [Old] → [New]

## Clarification Needed

[Insert generated questions here]

## Quick Stats
- Time tracked: X hours
- Meetings: Y
- Tasks completed: Z
- Open questions: N

## Context Network Updates
- [ ] Created N new entity records
- [ ] Updated M existing entities
- [ ] Added daily summary to /context-network/summaries/
- [ ] Updated project progress trackers

## Recommended Next Steps
1. Answer clarification questions above
2. Review tomorrow's calendar
3. Check Azure DevOps for sprint items
4. Run `/daily-plan` for tomorrow
```

## Integration with Other Commands

- Run before `/daily-plan` to ensure today is complete
- Use with `/entity-extract` for deep analysis
- Combine with `/status-weekly` for reporting
- Follow with `/ado-sync` to update work items

## Quality Checks

Before completing review:
- [ ] All time slots accounted for
- [ ] All entities extracted and categorized
- [ ] Confidence levels assigned
- [ ] Questions are specific and actionable
- [ ] Context network updated
- [ ] Relationships mapped
- [ ] Open items tracked

## Red Flags to Watch For

- Large unexplained time gaps
- Recurring unresolved questions
- Low confidence entities persisting
- Missing regular meetings
- No accomplishments logged
- Vague task descriptions
- Orphaned work items

Remember: The goal is to build a comprehensive understanding of your work life, with increasing confidence over time. Every review strengthens the knowledge base.
