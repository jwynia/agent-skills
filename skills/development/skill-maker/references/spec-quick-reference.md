# Agent Skills Specification Quick Reference

Condensed reference for the agentskills.io specification. For the complete specification, see [agentskills.io/specification](https://agentskills.io/specification).

## Directory Structure

Minimum requirement:
```
skill-name/
└── SKILL.md          # Required
```

Full structure:
```
skill-name/
├── SKILL.md          # Required - frontmatter + instructions
├── scripts/          # Optional - executable code
├── references/       # Optional - documentation loaded as needed
└── assets/           # Optional - templates, images, data files
```

## SKILL.md Format

```yaml
---
name: skill-name
description: Description of what this skill does and when to use it.
license: MIT
compatibility: Requires specific tools or environments.
metadata:
  author: your-name
  version: "1.0"
allowed-tools: Bash(git:*) Read
---

# Markdown instructions here...
```

## Frontmatter Fields

### Required Fields

| Field | Constraints |
|-------|-------------|
| `name` | 1-64 chars. Lowercase letters, numbers, hyphens only. No leading/trailing hyphens. No consecutive hyphens. Must match directory name. |
| `description` | 1-1024 chars. Non-empty. Should describe what AND when. |

### Optional Fields

| Field | Constraints |
|-------|-------------|
| `license` | License name or reference to bundled file |
| `compatibility` | Max 500 chars. Environment requirements |
| `metadata` | Key-value pairs (strings only) |
| `allowed-tools` | Space-delimited tool patterns (experimental) |

## Name Rules

**Valid names:**
- `pdf-processing`
- `data-analysis`
- `code-review`
- `my-skill-v2`

**Invalid names:**
- `PDF-Processing` (uppercase)
- `-pdf` (starts with hyphen)
- `pdf-` (ends with hyphen)
- `pdf--processing` (consecutive hyphens)
- `my_skill` (underscore not allowed)
- `skill name` (spaces not allowed)

## Description Best Practices

**Good description:**
```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
```

**Poor description:**
```yaml
description: Helps with PDFs.
```

Include:
- What the skill does
- When to use it (trigger scenarios)
- Keywords for discovery

## File Size Guidelines

| Content | Recommendation |
|---------|---------------|
| SKILL.md | Under 500 lines |
| Body content | Under 5000 tokens |
| Metadata (name + desc) | ~100 tokens |

## Validation

```bash
# Using skills-ref
skills-ref validate ./my-skill

# Using validate-skill.ts
deno run --allow-read --allow-run scripts/validate-skill.ts ./my-skill
```

## Optional Directories

### scripts/

Executable code for agents to run.
- Should be self-contained or document dependencies
- Include helpful error messages
- Handle edge cases gracefully
- Common: Python, Bash, JavaScript/TypeScript

### references/

Additional documentation loaded on demand.
- `REFERENCE.md` - Detailed technical reference
- Domain-specific files (`finance.md`, `legal.md`)
- Keep files focused for efficient context use

### assets/

Static resources.
- Templates (document, config)
- Images (diagrams, examples)
- Data files (lookup tables, schemas)

## File References

Use relative paths from skill root:
```markdown
See [the reference guide](references/REFERENCE.md) for details.

Run the script:
scripts/extract.py
```

Keep references one level deep. Avoid nested reference chains.
