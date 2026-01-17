# SKILL.md Template

Copy this template to create a new skill. Replace all `[bracketed]` content.

---

```markdown
---
name: [skill-name]
description: [What this skill does. This skill should be used when the user asks to "[trigger phrase 1]", "[trigger phrase 2]", "[trigger phrase 3]", or [scenario]. Keywords: [relevant terms].]
license: MIT
metadata:
  author: [your-name]
  version: "1.0"
---

# [Skill Display Name]

[1-2 sentences: What this skill does and why it exists.]

## When to Use This Skill

Use this skill when:
- [Specific scenario where this skill applies]
- [Another scenario]
- [User mentions keywords like: keyword1, keyword2]

Do NOT use this skill when:
- [Out of scope scenario - what this skill doesn't handle]
- [Another out of scope scenario]

## Prerequisites

Before using this skill:
- [Required tool, package, or setup]
- [Environment variable or configuration]
- [Access or permissions needed]

## Instructions

### Step 1: [First Major Step]

[Clear, actionable instructions in imperative form.]

**Example:**
```
[Code, command, or example demonstrating this step]
```

**Expected result:** [What should happen after this step]

### Step 2: [Second Major Step]

[Clear, actionable instructions.]

**Options:**
- **Option A:** [When to use] - [How to do it]
- **Option B:** [When to use] - [How to do it]

### Step 3: [Third Major Step]

[Clear, actionable instructions.]

**Verification:** [How to verify this step succeeded]

## Examples

### Example 1: [Common Use Case]

**Scenario:** [Describe a typical situation]

**Input:**
```
[What the user provides or starts with]
```

**Steps:**
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Output:**
```
[Expected result]
```

### Example 2: [Edge Case or Variation]

**Scenario:** [Describe an alternate situation]

**Input:**
```
[Input for this scenario]
```

**Output:**
```
[Expected result]
```

## Common Issues

### Issue: [Problem description]

**Symptoms:** [How to identify this issue]

**Solution:**
1. [Step to resolve]
2. [Step to resolve]

### Issue: [Another problem]

**Symptoms:** [How to identify]

**Solution:**
1. [Resolution step]

## Additional Resources

[Only include sections that apply to your skill]

### Reference Files
- **`references/[filename].md`** - [What it contains]

### Scripts
- **`scripts/[filename]`** - [What it does]

### Assets
- **`assets/[filename]`** - [What it's for]

## Limitations

- [Limitation 1 - what this skill cannot do]
- [Limitation 2]

## Related Skills

- **[related-skill-name]** - [When to use instead or how they complement]
```

---

## Template Customization Tips

### Required Sections
Keep these in every skill:
- Frontmatter with name and description
- When to Use section
- At least one example with input/output
- Core instructions

### Optional Sections
Remove if not applicable:
- Prerequisites (if none needed)
- Common Issues (add after real issues found)
- Additional Resources (only if you have supporting files)
- Related Skills (if no related skills exist)

### Writing Style Reminders

**Description (frontmatter):** Third person
```yaml
# Good
description: This skill should be used when...

# Bad
description: Use this skill when...
```

**Body content:** Imperative form
```markdown
# Good
Run the validation script.
Configure the settings file.

# Bad
You should run the validation script.
You need to configure the settings.
```

### Size Guidelines

- Target: 200-400 lines
- Maximum: 500 lines
- If longer, move content to references/

---

## Validation Checklist

Before completing your skill:

- [ ] `name` matches directory name exactly
- [ ] `description` is under 1024 characters
- [ ] `description` includes what + when + keywords
- [ ] All referenced files exist
- [ ] At least one complete example
- [ ] No second-person language ("you should")
- [ ] Under 500 lines
- [ ] `skills-ref validate` passes
