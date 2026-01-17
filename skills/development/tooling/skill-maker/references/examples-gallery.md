# Skill Examples Gallery

Annotated examples of well-structured skills. Study these patterns when creating new skills.

## Example 1: Research Workflow Skill

**Location:** `skills/research/workflow/research-workflow/`

### Structure
```
research-workflow/
├── SKILL.md           (325 lines)
├── references/
│   └── methodology.md
└── assets/
    ├── research-plan-template.md
    ├── research-report-template.md
    └── source-evaluation-checklist.md
```

### What Makes It Good

**Strong description:**
```yaml
description: Guide multi-phase research projects from planning through synthesis.
  Use when conducting comprehensive research, analyzing multiple sources, or
  creating research reports. Keywords: research, analysis, synthesis, sources.
```
- Clear what it does (multi-phase research)
- Clear when to use (comprehensive research, multiple sources)
- Includes keywords for discovery

**Progressive disclosure:**
- SKILL.md contains the 4-phase workflow overview
- Detailed methodology in references/
- Templates in assets/ for users to copy

**Imperative style:**
```markdown
## Phase 1: Planning
Define the research scope and questions.
Create a research plan using the template...
```

## Example 2: Web Search Skill

**Location:** `skills/research/search/web-search/`

### Structure
```
web-search/
├── SKILL.md           (262 lines)
└── scripts/
    └── search.ts
```

### What Makes It Good

**Focused scope:**
- Does one thing well (web search via Tavily API)
- Clear prerequisites (API key requirement)
- Specific usage examples

**Self-contained script:**
- `search.ts` is fully documented
- Handles errors gracefully
- Clear help text built in

**Practical examples:**
```markdown
### Example 1: Basic Search
deno run --allow-env --allow-net scripts/search.ts "React hooks tutorial"

### Example 2: News Search
deno run --allow-env --allow-net scripts/search.ts "AI announcements" --topic news
```

## Example 3: Hook Development Skill (Claude Code Plugin)

**Location:** `.claude/plugins/.../plugin-dev/skills/hook-development/`

### Structure
```
hook-development/
├── SKILL.md           (712 lines - slightly over ideal)
├── references/
│   ├── patterns.md
│   ├── advanced.md
│   └── migration.md
├── examples/
│   ├── validate-write.sh
│   ├── validate-bash.sh
│   └── load-context.sh
└── scripts/
    ├── validate-hook-schema.sh
    ├── test-hook.sh
    └── hook-linter.sh
```

### What Makes It Good

**Comprehensive but organized:**
- Core concepts in SKILL.md
- 3 reference files for depth
- 3 working examples
- 3 utility scripts

**Utility scripts:**
- `validate-hook-schema.sh` - Validates hook JSON
- `test-hook.sh` - Tests hooks in isolation
- `hook-linter.sh` - Checks code quality

**Clear trigger phrases:**
```yaml
description: This skill should be used when the user asks to "create a hook",
  "add a PreToolUse hook", "validate tool use", "implement prompt-based hooks",
  or mentions hook events (PreToolUse, PostToolUse, Stop).
```

## Common Patterns

### Pattern: Quick Start Section

Always include a "Quick Start" that shows the fastest path:

```markdown
## Quick Start

1. Create the directory: `mkdir my-skill`
2. Copy the template: `cp template.md my-skill/SKILL.md`
3. Edit the file
4. Validate: `skills-ref validate ./my-skill`
```

### Pattern: When to Use / When Not to Use

Be explicit about scope:

```markdown
## When to Use This Skill

Use this skill when:
- [Specific scenario 1]
- [Specific scenario 2]

Do NOT use this skill when:
- [Out of scope 1]
- [Out of scope 2]
```

### Pattern: Prerequisites Section

List requirements clearly:

```markdown
## Prerequisites

Before using this skill:
- Install X: `npm install -g x`
- Set environment variable: `export API_KEY=...`
- Ensure Y is available in PATH
```

### Pattern: Example with Input/Output

Show concrete examples:

```markdown
### Example: [Scenario Name]

**Input:**
```
[What the user provides]
```

**Command:**
```bash
./scripts/tool.sh input.txt
```

**Output:**
```
[Expected result]
```
```

## Anti-Patterns to Avoid

### Anti-Pattern: Vague Description

```yaml
# Bad
description: Helps with data processing.

# Good
description: Transform CSV files to JSON format. Use when converting
  spreadsheet exports or when the user mentions CSV, data conversion,
  or JSON transformation.
```

### Anti-Pattern: No Examples

Skills without examples leave agents guessing. Always include at least one complete example with expected output.

### Anti-Pattern: Monolithic SKILL.md

Putting everything in one file wastes context. Split when over 500 lines.

### Anti-Pattern: Second-Person Writing

```markdown
# Bad
You should run the script first.
You need to configure the API key.

# Good
Run the script first.
Configure the API key before proceeding.
```

### Anti-Pattern: Missing File References

If references/ or scripts/ exist, SKILL.md must mention them:

```markdown
## Additional Resources

- See `references/detailed-guide.md` for advanced usage
- Run `scripts/helper.sh` for automated setup
```

## Skill Complexity Spectrum

### Minimal Skill (~100 lines)
```
skill-name/
└── SKILL.md
```
Best for: Simple knowledge, single-purpose guidance

### Standard Skill (~200-400 lines)
```
skill-name/
├── SKILL.md
└── references/
    └── detailed.md
```
Best for: Most skills with some detailed content

### Complete Skill (~200 lines + supporting files)
```
skill-name/
├── SKILL.md
├── scripts/
├── references/
└── assets/
```
Best for: Complex domains with tooling needs

## Checklist for New Skills

Compare your skill against these examples:

- [ ] Description includes what + when + keywords
- [ ] SKILL.md has Quick Start section
- [ ] At least one complete example with output
- [ ] Prerequisites clearly listed
- [ ] Content organized by progressive disclosure
- [ ] Scripts are documented and handle errors
- [ ] References are focused (one topic each)
- [ ] No second-person language in body
