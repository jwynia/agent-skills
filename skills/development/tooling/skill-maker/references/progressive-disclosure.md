# Progressive Disclosure Guide

Skills use progressive disclosure to manage context efficiently. This guide explains how to structure content between SKILL.md and supporting files.

## The Three-Level System

Skills load content in three levels:

### Level 1: Metadata (~100 tokens)
**Always loaded** for all skills at agent startup.

Contains:
- `name` field
- `description` field

This is how agents decide which skills to activate. Make these count.

### Level 2: Instructions (<5000 tokens recommended)
**Loaded when skill activates** based on task relevance.

Contains:
- The full SKILL.md body (everything after frontmatter)
- Core concepts and essential procedures
- Quick reference information
- Pointers to additional resources

Keep under 500 lines / 5000 tokens.

### Level 3: Resources (as needed)
**Loaded only when specifically needed** during execution.

Contains:
- `scripts/` - Executable code
- `references/` - Detailed documentation
- `assets/` - Templates and files

No size limit, but smaller files = less context used.

## What Goes Where

### Keep in SKILL.md

**Essential content that's needed for most uses:**
- Purpose and overview
- When to use / when not to use
- Prerequisites
- Core step-by-step instructions
- 1-2 key examples
- Quick troubleshooting
- Pointers to references

### Move to references/

**Detailed content that's only sometimes needed:**
- Comprehensive option lists
- Detailed API documentation
- Advanced techniques
- Edge case handling
- In-depth tutorials
- Background theory
- Extended examples
- Configuration details

### Put in scripts/

**Executable code for:**
- Repetitive tasks that benefit from consistency
- Complex operations that are error-prone when written manually
- Validation and checking utilities
- Automation helpers

### Put in assets/

**Static files for:**
- Templates users will copy/modify
- Images and diagrams
- Schema files
- Sample data
- Configuration templates

## Good vs Bad Organization

### Bad: Everything in SKILL.md

```
skill-name/
└── SKILL.md    (1200 lines, 15000 words)
```

**Problems:**
- Entire file loads when skill activates
- Wastes context on rarely-needed details
- Harder to maintain
- Overwhelming to read

### Good: Progressive Structure

```
skill-name/
├── SKILL.md              (200 lines, ~2000 words)
├── references/
│   ├── api-reference.md  (500 lines)
│   ├── advanced.md       (300 lines)
│   └── troubleshooting.md (200 lines)
└── scripts/
    └── helper.py
```

**Benefits:**
- Core content loads fast
- Details available when needed
- Easier to maintain each file
- Clear organization

## Signals You Need to Split

Consider moving content to references when:

1. **SKILL.md exceeds 500 lines** - Definitely split
2. **Sections are rarely needed** - Move to references
3. **Content is reference-style** (tables, lists) - Move to references
4. **Advanced topics** separate from basics - Move to references
5. **Multiple detailed examples** - Keep 1-2, move rest to references

## How to Reference Supporting Files

In SKILL.md, clearly point to additional resources:

```markdown
## Additional Resources

### Reference Files
For detailed information:
- **`references/api-reference.md`** - Complete API documentation
- **`references/advanced.md`** - Advanced techniques and edge cases
- **`references/troubleshooting.md`** - Common issues and solutions

### Scripts
Utility scripts available:
- **`scripts/validate.py`** - Validate input format
- **`scripts/convert.sh`** - Convert between formats

### Assets
Templates and resources:
- **`assets/template.md`** - Starter template
- **`assets/config-example.json`** - Example configuration
```

## Reference File Best Practices

### Keep Files Focused
One topic per file. If a file covers multiple unrelated topics, split it.

```
# Bad
references/everything.md  (covers API, advanced use, troubleshooting)

# Good
references/api-reference.md
references/advanced.md
references/troubleshooting.md
```

### Use Clear Names
File names should indicate content:
- `api-reference.md` not `ref.md`
- `troubleshooting.md` not `help.md`
- `advanced-patterns.md` not `more.md`

### Include Context
Start each reference file with a brief explanation of what it contains and when to use it:

```markdown
# API Reference

Complete API documentation for the XYZ service. Consult this when you need
detailed information about endpoints, parameters, or response formats.

## Endpoints
...
```

## Token Budget Guidelines

**Target budget for skill activation:**
- SKILL.md body: 2000-4000 tokens
- Maximum: 5000 tokens

**Signs you're over budget:**
- SKILL.md over 500 lines
- Word count over 4000
- Multiple detailed sections
- Comprehensive examples inline

**How to reduce:**
1. Move tables to references
2. Keep only 1-2 examples inline
3. Summarize, don't detail
4. Use links to references

## Checklist

Before finalizing skill structure:

- [ ] SKILL.md under 500 lines
- [ ] Core instructions are complete without references
- [ ] Detailed content moved to references/
- [ ] Each reference file has single focus
- [ ] SKILL.md points to all supporting files
- [ ] Scripts are self-contained
- [ ] Assets are clearly named
