---
name: {{SKILL_NAME}}
description: {{DESCRIPTION}}
license: MIT
metadata:
  author: jwynia
  version: "1.0"
  domain: fiction
  cluster: story-sense
  type: diagnostic         # REQUIRED: diagnostic | generator | utility
  mode: diagnostic         # REQUIRED: diagnostic | assistive | collaborative | evaluative | application | generative
  maturity: draft          # Optional: draft | developing | stable | battle-tested
  maturity_score: 0        # Optional: 0-20
---

# {{SKILL_TITLE}}: {{SUBTITLE}}

You {{ROLE_DESCRIPTION}}. Your role is to {{SPECIFIC_FUNCTION}}.

## Core Principle

**{{CORE_PRINCIPLE}}**

## Quick Reference

Use this skill when:
- {{QUICK_REFERENCE_USE_CASE_1}}
- {{QUICK_REFERENCE_USE_CASE_2}}

Key states:
- **{{PREFIX}}1:** {{STATE_1_NAME}} - {{STATE_1_BRIEF}}
- **{{PREFIX}}2:** {{STATE_2_NAME}} - {{STATE_2_BRIEF}}
- **{{PREFIX}}3:** {{STATE_3_NAME}} - {{STATE_3_BRIEF}}

## The States

### State {{PREFIX}}1: {{STATE_1_NAME}}
**Symptoms:** {{STATE_1_SYMPTOMS}}
**Key Questions:** {{STATE_1_QUESTIONS}}
**Interventions:** {{STATE_1_INTERVENTIONS}}

### State {{PREFIX}}2: {{STATE_2_NAME}}
**Symptoms:** {{STATE_2_SYMPTOMS}}
**Key Questions:** {{STATE_2_QUESTIONS}}
**Interventions:** {{STATE_2_INTERVENTIONS}}

### State {{PREFIX}}3: {{STATE_3_NAME}}
**Symptoms:** {{STATE_3_SYMPTOMS}}
**Key Questions:** {{STATE_3_QUESTIONS}}
**Interventions:** {{STATE_3_INTERVENTIONS}}

<!-- Add more states as needed (aim for 3-7 total) -->

## Diagnostic Process

When a writer presents a {{DOMAIN}} problem:

1. **Listen for symptoms** - What specifically feels wrong?
2. **Identify the state** - Match symptoms to states above
3. **Ask key questions** - Gather information needed for diagnosis
4. **Recommend intervention** - Point to specific framework/tool
5. **Suggest first step** - What's the minimal viable fix?

## Key Questions

### For {{CATEGORY_A}}
- {{QUESTION_1}}
- {{QUESTION_2}}
- {{QUESTION_3}}

### For {{CATEGORY_B}}
- {{QUESTION_4}}
- {{QUESTION_5}}
- {{QUESTION_6}}

## Anti-Patterns

<!-- Minimum 3 anti-patterns for diagnostic skills, 2 for generator/utility -->

### The {{ANTIPATTERN_1_NAME}}
**Pattern:** {{ANTIPATTERN_1_PATTERN}}
**Problem:** {{ANTIPATTERN_1_PROBLEM}}
**Fix:** {{ANTIPATTERN_1_FIX}}

### The {{ANTIPATTERN_2_NAME}}
**Pattern:** {{ANTIPATTERN_2_PATTERN}}
**Problem:** {{ANTIPATTERN_2_PROBLEM}}
**Fix:** {{ANTIPATTERN_2_FIX}}

### The {{ANTIPATTERN_3_NAME}}
**Pattern:** {{ANTIPATTERN_3_PATTERN}}
**Problem:** {{ANTIPATTERN_3_PROBLEM}}
**Fix:** {{ANTIPATTERN_3_FIX}}

## Verification (Oracle)

This section documents what this skill can reliably verify vs. what requires human judgment.
See `organization/architecture/context-packet-architecture.md` for background on oracles.

### What This Skill Can Verify
- {{VERIFIABLE_1}} - [How: symptom matching / script output / checklist]
- {{VERIFIABLE_2}}
- {{VERIFIABLE_3}}

### What Requires Human Judgment
- {{JUDGMENT_1}} - [Why: semantic quality / contextual fit / creative choice]
- {{JUDGMENT_2}}

### Available Validation Scripts
<!-- If no scripts, write: "No validation scripts yet. Diagnostic process serves as the oracle." -->
| Script | Verifies | Confidence |
|--------|----------|------------|
| {{SCRIPT_NAME}}.ts | {{WHAT_IT_CHECKS}} | {{HIGH_MEDIUM_LOW}} |

## Feedback Loop

This section documents how outputs persist and inform future sessions.
See `organization/architecture/context-packet-architecture.md` for background on feedback loops.

### Session Persistence
- **Output location:** Check `context/output-config.md` or ask user
- **What to save:** {{PRIMARY_OUTPUTS_TO_PERSIST}}
- **Naming pattern:** `{{NAMING_PATTERN}}`

### Cross-Session Learning
- **Before starting:** Check for prior outputs in configured location
- **If prior output exists:** Review previous state diagnosis, check if resolved
- **What feedback improves this skill:** {{FEEDBACK_THAT_IMPROVES}}

## Design Constraints

This section documents preconditions and boundaries.
See `organization/architecture/context-packet-architecture.md` for background on constraints.

### This Skill Assumes
- {{ASSUMPTION_1}}
- {{ASSUMPTION_2}}
- {{ASSUMPTION_3}}

### This Skill Does Not Handle
- {{NOT_HANDLED_1}} - Route to: {{ROUTE_TO_SKILL_1}}
- {{NOT_HANDLED_2}} - Route to: {{ROUTE_TO_SKILL_2}}

### Degradation Signals
Signs this skill is being misapplied:
- {{DEGRADATION_1}}
- {{DEGRADATION_2}}

## Available Tools

### {{SCRIPT_NAME}}.ts
{{SCRIPT_DESCRIPTION}}

```bash
deno run --allow-read scripts/{{SCRIPT_NAME}}.ts [args]
deno run --allow-read scripts/{{SCRIPT_NAME}}.ts --option value
```

**Output:** {{SCRIPT_OUTPUT_DESCRIPTION}}

## Example Interaction

**Writer:** "{{EXAMPLE_PROBLEM}}"

**Your approach:**
1. Identify State {{PREFIX}}{{EXAMPLE_STATE}} ({{EXAMPLE_STATE_NAME}})
2. Ask: "{{EXAMPLE_QUESTION}}"
3. {{EXAMPLE_ACTION}}
4. Suggest: "{{EXAMPLE_SUGGESTION}}"

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

### File Naming

Pattern: `{{NAMING_PATTERN}}`
Example: `{{NAMING_EXAMPLE}}`

## What You Do NOT Do

- You do not {{BOUNDARY_1}}
- You do not {{BOUNDARY_2}}
- You diagnose, recommend, and explain—the writer decides

## Reasoning Requirements

This section documents when this skill benefits from extended thinking time.

### Standard Reasoning
- {{STANDARD_TASK_1}}
- {{STANDARD_TASK_2}}

### Extended Reasoning (ultrathink)
Use extended thinking for:
- {{EXTENDED_TASK_1}} - [Why: {{EXTENDED_REASON_1}}]
- {{EXTENDED_TASK_2}} - [Why: {{EXTENDED_REASON_2}}]

**Trigger phrases:** "deep analysis", "comprehensive review", "multi-framework synthesis"

## Execution Strategy

This section documents when to parallelize work or spawn subagents.

### Sequential (Default)
- {{SEQUENTIAL_TASK}} - must complete before next step

### Parallelizable
- {{PARALLEL_TASK_1}} and {{PARALLEL_TASK_2}} can run concurrently
- Use when: {{PARALLEL_CONDITION}}

### Subagent Candidates
| Task | Agent Type | When to Spawn |
|------|------------|---------------|
| {{SUBAGENT_TASK}} | Explore | {{SUBAGENT_CONDITION}} |

## Context Management

This section documents token usage and optimization strategies.

### Approximate Token Footprint
- **Skill base:** ~{{BASE_TOKENS}}k tokens
- **With full state definitions:** ~{{FULL_TOKENS}}k tokens
- **With scripts inline:** ~{{SCRIPTS_TOKENS}}k tokens (avoid unless needed)

### Context Optimization
- Load scripts on-demand rather than including inline
- Reference framework documentation by name rather than embedding
- {{CONTEXT_TIP}}

### When Context Gets Tight
- Prioritize: {{PRIORITY_CONTENT}}
- Defer: {{DEFER_CONTENT}}
- Drop: {{DROP_CONTENT}}

## Integration Graph

### Inbound (From Other Skills)
| Source Skill | Source State | Leads to State |
|--------------|--------------|----------------|
| story-sense | SS{{SS_STATE_1}}: {{SS_STATE_1_NAME}} | {{PREFIX}}{{INTEGRATION_1}}: {{INTEGRATION_1_NAME}} |
| {{OTHER_SOURCE_SKILL}} | {{OTHER_SOURCE_STATE}} | {{PREFIX}}{{OTHER_INTEGRATION}}: {{OTHER_INTEGRATION_NAME}} |

### Outbound (To Other Skills)
| This State | Leads to Skill | Target State |
|------------|----------------|--------------|
| {{PREFIX}}{{OUTBOUND_STATE}}: {{OUTBOUND_STATE_NAME}} | {{TARGET_SKILL}} | {{TARGET_STATE}} |

### Complementary Skills
| Skill | Relationship |
|-------|--------------|
| story-sense | Parent diagnostic skill |
| {{COMPLEMENTARY_SKILL_1}} | {{COMPLEMENTARY_RELATIONSHIP_1}} |
| {{COMPLEMENTARY_SKILL_2}} | {{COMPLEMENTARY_RELATIONSHIP_2}} |
