---
name: pptx-generator
description: "Create and manipulate PowerPoint PPTX files programmatically. Use when the user needs to generate presentations, modify PPTX templates, extract slide content, create thumbnail previews, or automate PowerPoint workflows. Supports both template-based generation (for branding compliance) and from-scratch creation. Keywords: PowerPoint, PPTX, presentation, slides, template, deck, slideshow, corporate, branding."
license: MIT
compatibility: Requires Deno with --allow-read, --allow-write permissions
metadata:
  author: agent-skills
  version: "1.0"
---

# PPTX Generator

## When to Use This Skill

Use this skill when:
- Creating presentations programmatically from data or specifications
- Populating branded templates with dynamic content while preserving corporate styling
- Extracting text and structure from existing PPTX files for analysis
- Combining slides from a library of approved templates
- Automating presentation generation workflows

Do NOT use this skill when:
- User wants to open/view presentations (use native PowerPoint or viewer)
- Complex animations or transitions are required (limited support)
- Working with older .ppt format (PPTX only)

## Prerequisites

- Deno installed (https://deno.land/)
- Input PPTX files for template-based operations
- JSON specification for scratch generation

## Quick Start

### Two Modes of Operation

1. **Template Mode**: Modify existing branded templates
   - Analyze & Replace: Find `{{PLACEHOLDERS}}` and replace with content
   - Slide Library: Select and combine slides from a template library

2. **Scratch Mode**: Create presentations from nothing using JSON specifications

## Instructions

### Mode 1: Template-Based Generation

#### Step 1a: Analyze the Template

Extract text inventory to understand what can be replaced:

```bash
deno run --allow-read scripts/analyze-template.ts corporate-template.pptx > inventory.json
```

**Output** (inventory.json):
```json
{
  "filename": "corporate-template.pptx",
  "slideCount": 10,
  "textElements": [
    {
      "slideNumber": 1,
      "shapeId": "shape-2",
      "shapeName": "Title 1",
      "placeholderType": "ctrTitle",
      "position": { "x": 1.5, "y": 2.0, "w": 7.0, "h": 1.2 },
      "paragraphs": [
        { "text": "{{TITLE}}", "fontSize": 44, "bold": true }
      ]
    }
  ]
}
```

#### Step 1b: Create Replacement Specification

Create `replacements.json`:
```json
{
  "textReplacements": [
    { "tag": "{{TITLE}}", "value": "Q4 2024 Results" },
    { "tag": "{{SUBTITLE}}", "value": "Financial Overview" },
    { "tag": "{{DATE}}", "value": "December 2024" },
    { "tag": "{{AUTHOR}}", "value": "Finance Team", "slideNumbers": [1] }
  ]
}
```

#### Step 1c: Generate Output

```bash
deno run --allow-read --allow-write scripts/generate-from-template.ts \
  corporate-template.pptx replacements.json output.pptx
```

### Mode 1 (Alternative): Slide Library

#### Step 2a: Preview Template Slides

Get information about available slides:

```bash
deno run --allow-read scripts/generate-thumbnails.ts slide-library.pptx
```

For visual preview, extract the thumbnail:
```bash
deno run --allow-read --allow-write scripts/generate-thumbnails.ts \
  slide-library.pptx --extract-thumb --output-dir ./previews
```

#### Step 2b: Select and Combine Slides

Create `selections.json`:
```json
{
  "slideSelections": [
    { "slideNumber": 1 },
    { "slideNumber": 5 },
    { "slideNumber": 12 },
    { "slideNumber": 3 }
  ],
  "textReplacements": [
    { "tag": "{{TITLE}}", "value": "Custom Presentation" }
  ]
}
```

#### Step 2c: Generate Combined Presentation

```bash
deno run --allow-read --allow-write scripts/generate-from-template.ts \
  slide-library.pptx selections.json custom-deck.pptx
```

### Mode 2: From-Scratch Generation

#### Step 3a: Create Specification

Create `spec.json`:
```json
{
  "title": "Product Launch 2025",
  "author": "Marketing Team",
  "slides": [
    {
      "background": { "color": "003366" },
      "elements": [
        {
          "type": "text",
          "x": 1, "y": 2.5, "w": 8, "h": 1.5,
          "options": {
            "text": "Product Launch 2025",
            "fontSize": 44,
            "bold": true,
            "color": "FFFFFF",
            "align": "center"
          }
        },
        {
          "type": "text",
          "x": 1, "y": 4, "w": 8, "h": 0.5,
          "options": {
            "text": "Revolutionizing the Industry",
            "fontSize": 24,
            "color": "CCCCCC",
            "align": "center"
          }
        }
      ]
    },
    {
      "elements": [
        {
          "type": "text",
          "x": 0.5, "y": 0.5, "w": 9, "h": 0.7,
          "options": {
            "text": "Key Features",
            "fontSize": 32,
            "bold": true,
            "color": "003366"
          }
        },
        {
          "type": "table",
          "x": 0.5, "y": 1.5, "w": 9, "h": 3,
          "options": {
            "rows": [
              ["Feature", "Description", "Benefit"],
              ["Speed", "2x faster processing", "Save time"],
              ["Quality", "HD output", "Better results"],
              ["Integration", "Works with existing tools", "Easy adoption"]
            ],
            "border": { "pt": 1, "color": "CCCCCC" }
          }
        }
      ]
    }
  ]
}
```

#### Step 3b: Generate Presentation

```bash
deno run --allow-read --allow-write scripts/generate-scratch.ts spec.json output.pptx
```

## Examples

### Example 1: Corporate Quarterly Report

**Scenario**: Generate quarterly report from branded template.

**Steps**:
```bash
# 1. Analyze template for replaceable content
deno run --allow-read scripts/analyze-template.ts quarterly-template.pptx --pretty

# 2. Create replacements.json with Q4 data
# 3. Generate report
deno run --allow-read --allow-write scripts/generate-from-template.ts \
  quarterly-template.pptx replacements.json Q4-2024-Report.pptx
```

### Example 2: Custom Pitch Deck from Slide Library

**Scenario**: Combine approved slides for a specific client pitch.

**Steps**:
```bash
# 1. View available slides
deno run --allow-read scripts/generate-thumbnails.ts pitch-library.pptx

# 2. Create selections.json picking slides 1, 3, 7, 12, 15
# 3. Generate custom deck
deno run --allow-read --allow-write scripts/generate-from-template.ts \
  pitch-library.pptx selections.json acme-pitch.pptx
```

### Example 3: Data-Driven Presentation

**Scenario**: Generate presentation from JSON data (e.g., API response).

**Steps**:
```bash
# 1. Transform your data into spec.json format
# 2. Generate presentation
deno run --allow-read --allow-write scripts/generate-scratch.ts data-spec.json report.pptx
```

## Script Reference

| Script | Purpose | Permissions |
|--------|---------|-------------|
| `analyze-template.ts` | Extract text inventory from PPTX | `--allow-read` |
| `generate-thumbnails.ts` | Get slide info and extract previews | `--allow-read --allow-write` |
| `generate-from-template.ts` | Modify templates (replace/combine) | `--allow-read --allow-write` |
| `generate-scratch.ts` | Create PPTX from JSON specification | `--allow-read --allow-write` |

## Element Types (Scratch Mode)

| Type | Description | Key Options |
|------|-------------|-------------|
| `text` | Text box | `text`, `fontSize`, `bold`, `color`, `align` |
| `image` | Image from file or base64 | `path`, `data`, `sizing` |
| `table` | Data table | `rows`, `colW`, `border`, `fill` |
| `shape` | Geometric shapes | `type`, `fill`, `line`, `text` |
| `chart` | Charts and graphs | `type`, `data`, `title`, `showLegend` |

## Common Issues and Solutions

### Issue: Text not being replaced

**Symptoms**: Output PPTX still contains `{{PLACEHOLDER}}` tags.

**Solution**:
1. Run `analyze-template.ts` to verify exact tag text
2. Tags may be split across XML runs - ensure your template has tags in single text runs
3. Check `slideNumbers` filter in replacements

### Issue: Slide order incorrect

**Symptoms**: Slides appear in wrong order after combining.

**Solution**:
- Slides are added in the order specified in `slideSelections`
- Verify slide numbers match original template (1-indexed)

### Issue: Images not appearing

**Symptoms**: Image elements are blank in output.

**Solution**:
1. Use absolute paths or paths relative to spec.json location
2. Verify image file exists and is readable
3. Check supported formats: PNG, JPEG, GIF

## Limitations

- **No slide rendering**: Cannot render slides to images directly (use LibreOffice for this)
- **Limited animation support**: Basic animations only in scratch mode
- **No master slide editing**: Template mode preserves but doesn't modify masters
- **PPTX only**: Does not support legacy .ppt format
- **Text run splitting**: Complex formatting in templates may split tags across XML elements

## Related Skills

- **pdf-generator**: For creating PDF documents instead of presentations
- **docx-generator**: For creating Word documents
- **xlsx-generator**: For creating Excel spreadsheets
