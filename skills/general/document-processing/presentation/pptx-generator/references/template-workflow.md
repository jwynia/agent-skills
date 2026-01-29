# Template-Based PPTX Generation Workflow

This document provides detailed guidance for working with existing PPTX templates.

## Overview

Template mode enables you to:
1. Preserve corporate branding and design standards
2. Replace placeholder content while maintaining formatting
3. Combine pre-approved slides into new presentations

## Preparing Templates

### Best Practices for Template Design

1. **Use Clear Placeholder Tags**: Use consistent format like `{{PLACEHOLDER_NAME}}`
   - Keep tags in single text runs (don't format parts of the tag differently)
   - Use uppercase for clarity: `{{TITLE}}`, `{{AUTHOR}}`, `{{DATE}}`

2. **Name Your Shapes**: In PowerPoint, select a shape and use Selection Pane to give it a meaningful name
   - This helps with debugging and targeted replacements

3. **Use Placeholder Types**: When possible, use PowerPoint's built-in placeholder types (Title, Subtitle, Content)
   - These are easier to identify programmatically

## Analyze & Replace Workflow

### Step 1: Analyze the Template

```bash
deno run --allow-read scripts/analyze-template.ts template.pptx --pretty > inventory.json
```

The inventory JSON contains:
- `filename`: Original template name
- `slideCount`: Total number of slides
- `slideWidth`/`slideHeight`: Dimensions in inches
- `textElements`: Array of all text shapes with:
  - `slideNumber`: Which slide (1-indexed)
  - `shapeId`: Unique identifier
  - `shapeName`: PowerPoint shape name
  - `placeholderType`: "title", "ctrTitle", "subTitle", "body", or null
  - `position`: { x, y, width, height } in inches
  - `paragraphs`: Array of paragraph objects with text and formatting

### Step 2: Create Replacement Specification

```json
{
  "textReplacements": [
    {
      "tag": "{{TITLE}}",
      "value": "Replacement Text"
    },
    {
      "tag": "{{DATE}}",
      "value": "January 2025",
      "slideNumbers": [1, 2]
    }
  ]
}
```

**Fields**:
- `tag`: The text to find and replace (include `{{}}` if used in template)
- `value`: The replacement text
- `slideNumbers` (optional): Limit replacement to specific slides

### Step 3: Generate Output

```bash
deno run --allow-read --allow-write scripts/generate-from-template.ts \
  template.pptx replacements.json output.pptx
```

## Slide Library Workflow

### Step 1: Preview Available Slides

```bash
# Get slide information
deno run --allow-read scripts/generate-thumbnails.ts library.pptx

# Extract presentation thumbnail
deno run --allow-read --allow-write scripts/generate-thumbnails.ts \
  library.pptx --extract-thumb --output-dir ./previews
```

### Step 2: Select Slides

Create a selection specification:

```json
{
  "slideSelections": [
    { "slideNumber": 1 },
    { "slideNumber": 5 },
    { "slideNumber": 3 },
    { "slideNumber": 12 }
  ]
}
```

**Notes**:
- Slides are added to output in the order specified
- Same slide can be included multiple times
- Original slide numbers are preserved for reference

### Step 3: Combine with Text Replacements

```json
{
  "slideSelections": [
    { "slideNumber": 1 },
    { "slideNumber": 5 }
  ],
  "textReplacements": [
    { "tag": "{{CLIENT}}", "value": "Acme Corp" }
  ]
}
```

## Including/Excluding Slides

Instead of selecting specific slides, you can filter:

### Include Only Specific Slides

```json
{
  "includeSlides": [1, 2, 5, 10]
}
```

### Exclude Specific Slides

```json
{
  "excludeSlides": [3, 4, 7]
}
```

## Troubleshooting

### Tags Not Being Replaced

**Cause**: Text is split across multiple XML runs

PowerPoint may internally split text like:
```xml
<a:r><a:t>{{TI</a:t></a:r>
<a:r><a:t>TLE}}</a:t></a:r>
```

**Solutions**:
1. Re-create the placeholder in PowerPoint by typing it fresh
2. Select all text in the shape and apply uniform formatting
3. Use simpler tag names without special characters

### Formatting Lost After Replacement

**Cause**: The replacement process preserves paragraph-level formatting but may not preserve character-level formatting within runs.

**Solution**: Apply formatting at the paragraph level in your template, not to individual characters within the placeholder.

### Wrong Slides Selected

**Cause**: Slide numbering mismatch

**Solution**:
1. Run `generate-thumbnails.ts` to verify slide numbers
2. Remember slides are 1-indexed
3. Hidden slides are still counted

## Advanced: Multiple Source Templates

For combining slides from different templates:

```json
{
  "slideSelections": [
    { "slideNumber": 1 },
    { "sourceTemplate": "./other-template.pptx", "slideNumber": 3 }
  ]
}
```

**Note**: This feature requires slides to have compatible layouts and masters. Cross-template slide combination works best with templates from the same design family.
