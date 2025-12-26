# Skill Planning Worksheet

Complete this worksheet before creating a new skill. Use it to gather requirements and plan the structure.

---

## 1. Basic Information

**Proposed Name:** `_______________`
- [ ] Lowercase only
- [ ] Uses hyphens (no underscores or spaces)
- [ ] Under 64 characters
- [ ] Descriptive but concise

**Target Location:** `skills/[domain]/[category]/[name]/`

---

## 2. Purpose and Scope

### What does this skill enable?
_Describe the task or workflow in 1-2 sentences._

```
[Your answer]
```

### What problem does it solve?
_Why would someone need this skill?_

```
[Your answer]
```

### What is OUT of scope?
_What should this skill NOT try to do?_

```
[Your answer]
```

---

## 3. Usage Examples

_List 2-3 concrete examples of how this skill would be used._

### Example 1:
**User says:** "[What the user would ask]"
**Skill does:** [What actions the skill enables]
**Result:** [What the user gets]

### Example 2:
**User says:** "[What the user would ask]"
**Skill does:** [What actions the skill enables]
**Result:** [What the user gets]

### Example 3:
**User says:** "[What the user would ask]"
**Skill does:** [What actions the skill enables]
**Result:** [What the user gets]

---

## 4. Trigger Phrases

_What should a user say to activate this skill?_

List specific phrases (these go in the description):
- "_______________"
- "_______________"
- "_______________"
- "_______________"

Keywords for discovery:
- _______________
- _______________
- _______________

---

## 5. Prerequisites

_What does this skill require?_

### Required Tools/Packages:
- [ ] None
- [ ] Tool: _______________
- [ ] Package: _______________
- [ ] Other: _______________

### Environment Variables:
- [ ] None
- [ ] `_______________` - [purpose]

### Network Access:
- [ ] None required
- [ ] Requires access to: _______________

### Other Requirements:
```
[List any other requirements]
```

---

## 6. Bundled Resources

_What supporting files does this skill need?_

### Scripts (scripts/)
Will this skill include executable scripts?

- [ ] No scripts needed
- [ ] Script: `_______________` - [purpose]
- [ ] Script: `_______________` - [purpose]

### References (references/)
Will this skill include detailed documentation?

- [ ] No references needed
- [ ] Reference: `_______________` - [what it covers]
- [ ] Reference: `_______________` - [what it covers]

### Assets (assets/)
Will this skill include templates or resources?

- [ ] No assets needed
- [ ] Asset: `_______________` - [purpose]
- [ ] Asset: `_______________` - [purpose]

---

## 7. Description Draft

_Write the description field (max 1024 characters)._

```yaml
description: [What the skill does]. This skill should be used when the user asks to "[trigger 1]", "[trigger 2]", "[trigger 3]", or [scenario]. Keywords: [term1], [term2], [term3].
```

**Character count:** ___ / 1024

---

## 8. Instructions Outline

_Outline the main steps in SKILL.md._

### Step 1: _______________
- Key points: _______________

### Step 2: _______________
- Key points: _______________

### Step 3: _______________
- Key points: _______________

---

## 9. Size Estimate

Estimated SKILL.md size:
- [ ] Minimal (~100 lines) - Simple guidance, no supporting files
- [ ] Standard (~200-400 lines) - Complete instructions, may have references
- [ ] Complete (~200 lines + supporting files) - Core instructions plus references/scripts

If over 400 lines, what moves to references/?
```
[List sections to move]
```

---

## 10. Open Questions

_List anything you need to clarify or decide._

1. _______________
2. _______________
3. _______________

---

## 11. Checklist Before Creating

- [ ] Name follows conventions (lowercase, hyphens, <64 chars)
- [ ] Have 2+ concrete usage examples
- [ ] Description drafted with trigger phrases
- [ ] Prerequisites identified
- [ ] Decided on bundled resources (scripts/references/assets)
- [ ] Instructions outlined
- [ ] Open questions resolved

---

## Ready to Create

Once this worksheet is complete, create the skill:

```bash
deno run --allow-write --allow-read scripts/scaffold.ts \
  --name "[name]" \
  --description "[description]" \
  --path "./skills/[domain]/[category]/" \
  [--with-scripts] [--with-references] [--with-assets]
```
