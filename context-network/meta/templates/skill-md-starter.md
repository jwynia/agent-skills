# SKILL.md Starter Template

This template provides a starting point for creating a new SKILL.md file. Copy and customize for your specific skill.

## Basic Template

```markdown
---
name: skill-name
description: Clear description of what this skill does and when to use it. Include relevant keywords that help agents discover this skill.
license: MIT
compatibility: Designed for Claude Code and similar products
metadata:
  author: your-name
  version: "1.0"
---

# [Skill Display Name]

## When to Use This Skill

Use this skill when:
- [Scenario 1 - be specific]
- [Scenario 2 - be specific]
- [User mentions keywords like: keyword1, keyword2, keyword3]

Do NOT use this skill when:
- [Out of scope scenario 1]
- [Out of scope scenario 2]

## Prerequisites

Before using this skill, ensure:
- [Prerequisite 1 - tools, access, setup]
- [Prerequisite 2]
- [Prerequisite 3]

## Instructions

### Step 1: [First Major Step]

[Clear, actionable instructions for this step]

**Example**:
```
[Code or command example]
```

**Expected result**:
[What should happen after this step]

### Step 2: [Second Major Step]

[Clear, actionable instructions for this step]

**Options**:
- **Option A**: [When to use] - [How to do it]
- **Option B**: [When to use] - [How to do it]

### Step 3: [Third Major Step]

[Clear, actionable instructions for this step]

**Verification**:
[How to verify this step worked correctly]

## Examples

### Example 1: [Common Use Case]

**Scenario**: [Describe the scenario]

**Input**:
```
[What the user provides or starts with]
```

**Steps**:
1. [Action 1]
2. [Action 2]
3. [Action 3]

**Output**:
```
[Expected result]
```

### Example 2: [Edge Case or Alternative]

**Scenario**: [Describe the scenario]

**Input**:
```
[What the user provides or starts with]
```

**Steps**:
1. [Action 1]
2. [Action 2]

**Output**:
```
[Expected result]
```

## Common Issues and Solutions

### Issue: [Common problem]

**Symptoms**: [How you know this is the problem]

**Solution**:
1. [Step to resolve]
2. [Step to resolve]

### Issue: [Another common problem]

**Symptoms**: [How you know this is the problem]

**Solution**:
1. [Step to resolve]
2. [Step to resolve]

## Advanced Usage

[Optional section for advanced scenarios - if this gets long, move to references/ADVANCED.md]

## Reference

For more detailed information, see:
- [Reference document](references/REFERENCE.md)
- [API details](references/API.md)
- [Additional examples](references/EXAMPLES.md)

## Limitations

This skill has the following limitations:
- [Limitation 1]
- [Limitation 2]
- [Limitation 3]

## Related Skills

- **[related-skill-1]**: [When to use instead]
- **[related-skill-2]**: [How they complement each other]
```

## Frontmatter Fields

### Required Fields

- **name**: Must match folder name, 1-64 chars, lowercase with hyphens only
- **description**: 1-1024 chars, must include WHAT and WHEN

### Optional Fields

- **license**: License name or reference to LICENSE file
- **compatibility**: Only if skill has specific requirements
- **metadata**: Key-value pairs for author, version, etc.
- **allowed-tools**: Experimental - pre-approved tools list

## Best Practices

### Description

✅ Good description:
> "Extracts text and tables from PDF files using pdfplumber. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction. Handles both searchable and scanned PDFs."

❌ Bad description:
> "PDF helper tool"

### Instructions

✅ Good instruction:
> "Run the following command, replacing 'input.pdf' with your PDF file path:
> ```bash
> python scripts/extract.py input.pdf
> ```
> This will create output.txt with the extracted text."

❌ Bad instruction:
> "Use the script on your PDF"

### Examples

✅ Good example:
> **Example 1: Extract Text from Invoice**
> **Input**: invoice-2024.pdf
> **Steps**:
> 1. Run: `python scripts/extract.py invoice-2024.pdf`
> 2. Open output: `cat output.txt`
> **Output**: Plain text with all invoice content

❌ Bad example:
> Works on invoices

## Progressive Disclosure

**Keep in SKILL.md**:
- Core instructions for common use cases
- 2-3 complete examples
- Common issues and solutions
- Quick reference information

**Move to references/**:
- Detailed API documentation
- Comprehensive option lists
- In-depth tutorials
- Additional examples
- Background theory
- Advanced configuration

## Template Customization

When using this template:

1. **Remove**:
   - Sections that don't apply
   - Optional fields you're not using
   - Placeholder text and comments

2. **Keep**:
   - All required frontmatter fields
   - At least one complete example
   - Clear "When to Use" section
   - Step-by-step instructions

3. **Add**:
   - Additional examples as needed
   - Custom sections for your domain
   - Links to reference files
   - Related skills references

## Validation Reminders

Before completing:
- [ ] Frontmatter is valid YAML
- [ ] Name matches folder name exactly
- [ ] Description includes what + when + keywords
- [ ] At least one complete example
- [ ] Instructions are actionable
- [ ] File is under 500 lines (move extras to references/)
- [ ] Run: `skills-ref validate ./skills/path/to/skill`
