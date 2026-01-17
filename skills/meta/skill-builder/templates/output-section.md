# Output Persistence Section Template

Add this section to SKILL.md files, customizing the skill-specific content.

---

## Output Persistence

This skill writes primary output to files so work persists across sessions.

### Output Discovery

**Before doing any other work:**

1. Check for `context/output-config.md` in the project
2. If found, look for this skill's entry
3. If not found or no entry for this skill, **ask the user first**:
   - "Where should I save output from this {{SKILL_NAME}} session?"
   - Suggest a sensible location for this project
4. Store the user's preference:
   - In `context/output-config.md` if context network exists
   - In `.{{SKILL_NAME}}-output.md` at project root otherwise

### Primary Output

For this skill, persist:
- {{PRIMARY_OUTPUT_1}}
- {{PRIMARY_OUTPUT_2}}
- {{PRIMARY_OUTPUT_3}}

### Conversation vs. File

| Goes to File | Stays in Conversation |
|--------------|----------------------|
| {{FILE_OUTPUT_1}} | {{CONVERSATION_1}} |
| {{FILE_OUTPUT_2}} | {{CONVERSATION_2}} |
| {{FILE_OUTPUT_3}} | {{CONVERSATION_3}} |

### File Naming

Pattern: `{{NAMING_PATTERN}}`
Example: `{{NAMING_EXAMPLE}}`

---

## Skill-Type Examples

### For Diagnostic Skills

```markdown
### Primary Output

For this skill, persist:
- Diagnosed state with evidence
- Recommended interventions
- Action items and next steps

### Conversation vs. File

| Goes to File | Stays in Conversation |
|--------------|----------------------|
| State diagnosis and evidence | Clarifying questions |
| Intervention recommendations | Discussion of options |
| Action items | Follow-up questions |

### File Naming

Pattern: `{project}-{skill}-{date}.md`
Example: `novel-draft-worldbuilding-2025-01-15.md`
```

### For Generative Skills

```markdown
### Primary Output

For this skill, persist:
- Generated ideas and alternatives
- Constraints explored and axis rotations
- Selected/promising options with rationale

### Conversation vs. File

| Goes to File | Stays in Conversation |
|--------------|----------------------|
| Final/selected ideas | Iteration process |
| Evaluation criteria used | Discarded options |
| Promising combinations | Real-time feedback |

### File Naming

Pattern: `{topic}-{date}.md`
Example: `product-naming-2025-01-15.md`
```

### For Research Skills

```markdown
### Primary Output

For this skill, persist:
- Summary of findings with confidence levels
- Vocabulary map (if built)
- Source list with assessments
- Identified gaps and next steps

### Conversation vs. File

| Goes to File | Stays in Conversation |
|--------------|----------------------|
| Synthesis document | Search refinement |
| Confidence-marked findings | Source evaluation discussion |
| Gap analysis | Follow-up questions |

### File Naming

Pattern: `{topic}-research-{date}.md`
Example: `competency-frameworks-research-2025-01-15.md`
```

### For Session-Based Skills

```markdown
### Primary Output

For this skill, persist:
- Session log and narrative events
- Character/NPC states and changes
- World state updates
- Decisions and their consequences

### Conversation vs. File

| Goes to File | Stays in Conversation |
|--------------|----------------------|
| What happened (narrative) | Active play |
| State changes | Real-time decisions |
| Important revelations | Moment-to-moment action |

### File Naming

Pattern: `session-{date}.md` or `{campaign}-session-{number}-{date}.md`
Example: `session-2025-01-15.md`
```

### For Utility Skills

```markdown
### Primary Output

For this skill, persist:
- Generated lists or data
- Configuration or settings produced
- Structured output artifacts

### Conversation vs. File

| Goes to File | Stays in Conversation |
|--------------|----------------------|
| The artifact itself | Validation discussion |
| Metadata about generation | Refinement requests |

### File Naming

Pattern: `{output-name}.{ext}` (often JSON or specialized format)
Example: `professions-unusual.json`
```
