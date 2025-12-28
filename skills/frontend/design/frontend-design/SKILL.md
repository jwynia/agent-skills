---
name: frontend-design
description: "Create distinctive, production-grade frontend interfaces with high design quality. Provides analysis tools for auditing existing designs and generation tools for creating color palettes, typography systems, design tokens, and component templates. Supports React, Vue, Svelte, and vanilla HTML/CSS. Use when building web components, pages, or applications. Keywords: design, UI, frontend, CSS, components, palette, typography, tokens, accessibility."
license: MIT
compatibility: Requires Deno with --allow-read, --allow-write permissions
metadata:
  author: agent-skills
  version: "1.0"
---

# Frontend Design

Create distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. This skill combines design philosophy guidance with practical TypeScript tooling for analyzing existing designs and generating design system artifacts.

**Core Principle**: Choose a clear aesthetic direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

## When to Use This Skill

**Use when**:
- Building web components, pages, or applications
- Auditing existing CSS for design inconsistencies
- Extracting design tokens from legacy codebases
- Generating color palettes and typography systems
- Creating component templates across frameworks
- Checking accessibility compliance for design elements

**Don't use when**:
- Simple text content changes
- Backend-only work
- Non-visual functionality

## Prerequisites

- **Deno** runtime (for script execution)
- Optional: Existing CSS/design files for analysis
- Optional: Design tokens file for reference

## Quick Start

This skill operates in three modes:

### 1. Analyze Mode
Audit existing styles, extract tokens, check accessibility.

```bash
# Audit CSS for design patterns and inconsistencies
deno run --allow-read scripts/analyze-styles.ts styles.css

# Extract design tokens from existing CSS
deno run --allow-read scripts/extract-tokens.ts ./src --format css

# Check accessibility (contrast, focus states)
deno run --allow-read scripts/analyze-accessibility.ts component.tsx
```

### 2. Specify Mode
Create JSON specifications defining what to generate. See `assets/` for schema examples.

### 3. Generate Mode
Create palettes, typography systems, tokens, and components.

```bash
# Generate a color palette
deno run --allow-read --allow-write scripts/generate-palette.ts --seed "#2563eb" --theme warm

# Generate typography system
deno run --allow-read --allow-write scripts/generate-typography.ts --display "Playfair Display" --body "Source Sans Pro"

# Generate design tokens file
deno run --allow-read --allow-write scripts/generate-tokens.ts tokens-spec.json ./output/

# Generate a component
deno run --allow-read --allow-write scripts/generate-component.ts --name Button --framework react --styling tailwind
```

---

## Instructions

### Phase 1: Analysis (Optional but Recommended)

Before creating new designs, audit existing code to understand current patterns.

#### 1a. Style Analysis

Analyze CSS files to identify colors, typography, spacing, and inconsistencies:

```bash
deno run --allow-read scripts/analyze-styles.ts <input> [options]

Options:
  --tokens <file>    Compare against existing design tokens
  --pretty           Pretty-print JSON output
  --format <type>    Output format: json (default), summary
```

**Output includes**:
- Color usage inventory with hex normalization
- Typography patterns (fonts, sizes, weights)
- Spacing value distribution
- Inconsistencies and recommendations

#### 1b. Token Extraction

Extract design tokens from CSS files into standardized formats:

```bash
deno run --allow-read scripts/extract-tokens.ts <input> [options]

Options:
  --format <type>    Output: css, scss, tailwind, style-dictionary, tokens-studio
  --output-css       Also output CSS variables file
```

#### 1c. Accessibility Audit

Check design-related accessibility issues:

```bash
deno run --allow-read scripts/analyze-accessibility.ts <input> [options]

Options:
  --format <type>    Output: json, summary
  --level <AA|AAA>   WCAG conformance level (default: AA)
```

**Checks include**:
- Color contrast ratios
- Focus indicator presence
- Touch target sizes
- Motion preference respect

---

### Phase 2: Generation

#### 2a. Color Palette Generation

Generate cohesive color palettes from seed colors or themes:

```bash
deno run --allow-read --allow-write scripts/generate-palette.ts [options] <output>

Options:
  --seed <color>     Primary seed color (hex)
  --theme <type>     warm, cool, neutral, vibrant, muted, dark, light
  --style <type>     minimalist, bold, organic, corporate, playful
  --shades           Generate 50-950 shade scale
  --semantic         Generate success/warning/error colors
  --contrast <lvl>   Target contrast: AA (default), AAA
  --format <type>    css, scss, tailwind, tokens, json
```

**Example specification** (`palette-spec.json`):
```json
{
  "seedColors": {
    "primary": "#2563eb",
    "accent": "#f59e0b"
  },
  "theme": "cool",
  "generateShades": true,
  "generateSemantics": true,
  "contrastTarget": "AA",
  "outputFormat": "css"
}
```

#### 2b. Typography System Generation

Generate typography systems with font stacks and scales:

```bash
deno run --allow-read --allow-write scripts/generate-typography.ts [options] <output>

Options:
  --display <font>   Display/heading font family
  --body <font>      Body text font family
  --mono <font>      Monospace font family
  --scale <type>     minor-second, major-second, minor-third, major-third, perfect-fourth, golden-ratio
  --base <px>        Base font size (default: 16)
  --line-height      tight, normal, relaxed
  --responsive       Generate responsive breakpoints
  --format <type>    css, scss, tailwind, tokens
```

**Type scales**:
| Scale | Ratio | Character |
|-------|-------|-----------|
| minor-second | 1.067 | Subtle, conservative |
| major-second | 1.125 | Balanced, professional |
| minor-third | 1.200 | Clear hierarchy |
| major-third | 1.250 | Strong presence |
| perfect-fourth | 1.333 | Bold, impactful |
| golden-ratio | 1.618 | Dramatic, artistic |

#### 2c. Design Token Generation

Generate comprehensive design token files in multiple formats:

```bash
deno run --allow-read --allow-write scripts/generate-tokens.ts <spec> <output-dir>
```

**Specification structure**:
```json
{
  "name": "my-design-system",
  "tokens": {
    "color": { "primary": "#2563eb", "secondary": "#64748b" },
    "spacing": { "xs": "0.25rem", "sm": "0.5rem", "md": "1rem" },
    "typography": {
      "fontFamilies": { "display": "Playfair Display", "body": "Inter" },
      "fontSizes": { "sm": "0.875rem", "base": "1rem", "lg": "1.125rem" }
    },
    "shadow": { "sm": "0 1px 2px rgba(0,0,0,0.05)" },
    "border": { "radius": { "sm": "0.25rem", "md": "0.5rem" } },
    "animation": { "duration": { "fast": "150ms", "normal": "300ms" } }
  },
  "outputFormats": ["css", "scss", "tailwind", "ts"]
}
```

#### 2d. Component Generation

Generate component templates with design-focused styling:

```bash
deno run --allow-read --allow-write scripts/generate-component.ts [options] <output-dir>

Options:
  --name <name>      Component name (required)
  --type <type>      button, card, input, modal, navigation, hero, custom
  --framework <fw>   react, vue, svelte, html
  --styling <type>   css, tailwind, css-modules, styled-components, emotion
  --aesthetic <type> minimal, bold, organic, brutalist, glassmorphism, neumorphism
  --animation <lvl>  none, subtle, expressive
  --dark-mode        Include dark mode support
  --tokens <file>    Use design tokens file
```

**Framework output examples**:

React with Tailwind:
```tsx
export function Button({ variant = 'primary', children }: ButtonProps) {
  return (
    <button className="px-4 py-2 rounded-lg font-medium transition-all">
      {children}
    </button>
  );
}
```

Vue with scoped CSS:
```vue
<template>
  <button :class="['btn', `btn--${variant}`]"><slot /></button>
</template>
<script setup lang="ts">
defineProps<{ variant?: 'primary' | 'secondary' }>();
</script>
<style scoped>.btn { /* styles */ }</style>
```

Svelte:
```svelte
<script lang="ts">
  export let variant: 'primary' | 'secondary' = 'primary';
</script>
<button class="btn btn--{variant}"><slot /></button>
<style>.btn { /* styles */ }</style>
```

---

## Examples

### Example 1: Audit and Modernize Legacy CSS

```bash
# 1. Analyze existing styles
deno run --allow-read scripts/analyze-styles.ts ./legacy/styles.css --pretty > audit.json

# 2. Extract tokens from the analysis
deno run --allow-read scripts/extract-tokens.ts ./legacy/styles.css --format css > tokens.css

# 3. Generate improved palette from dominant color
deno run --allow-read --allow-write scripts/generate-palette.ts --seed "#336699" --shades --format css palette.css
```

### Example 2: Create Design System from Scratch

```bash
# 1. Generate color palette
deno run --allow-read --allow-write scripts/generate-palette.ts \
  --seed "#8b5cf6" --theme vibrant --shades --semantic --format css colors.css

# 2. Generate typography system
deno run --allow-read --allow-write scripts/generate-typography.ts \
  --display "Space Grotesk" --body "Inter" --scale major-third --responsive --format css typography.css

# 3. Generate comprehensive tokens
deno run --allow-read --allow-write scripts/generate-tokens.ts design-spec.json ./tokens/
```

### Example 3: Generate Component Library

```bash
# Generate button component for React with Tailwind
deno run --allow-read --allow-write scripts/generate-component.ts \
  --name Button --framework react --styling tailwind --aesthetic bold ./components/

# Generate card component for Vue with CSS modules
deno run --allow-read --allow-write scripts/generate-component.ts \
  --name Card --framework vue --styling css-modules --aesthetic glassmorphism ./components/

# Generate input for Svelte
deno run --allow-read --allow-write scripts/generate-component.ts \
  --name Input --framework svelte --styling css --aesthetic minimal ./components/
```

### Example 4: Accessibility Check Before Launch

```bash
# Audit all components
deno run --allow-read scripts/analyze-accessibility.ts ./src/components --level AAA --format summary
```

---

## Script Reference

| Script | Purpose | Permissions |
|--------|---------|-------------|
| `analyze-styles.ts` | Audit CSS for patterns and inconsistencies | `--allow-read` |
| `extract-tokens.ts` | Extract design tokens from CSS | `--allow-read` |
| `analyze-accessibility.ts` | Check design accessibility | `--allow-read` |
| `generate-palette.ts` | Generate color palettes | `--allow-read --allow-write` |
| `generate-typography.ts` | Generate typography systems | `--allow-read --allow-write` |
| `generate-tokens.ts` | Generate multi-format tokens | `--allow-read --allow-write` |
| `generate-component.ts` | Generate framework components | `--allow-read --allow-write` |

---

## Design Philosophy

Avoid generic "AI slop" aesthetics. See `references/design-philosophy.md` for detailed guidance.

**Key principles**:
- **Typography**: Choose distinctive fonts, not defaults (avoid Arial, Inter, Roboto)
- **Color**: Dominant colors with sharp accents, not timid palettes
- **Motion**: Orchestrated reveals over scattered micro-interactions
- **Composition**: Asymmetry, overlap, grid-breaking elements
- **Texture**: Gradients, noise, patterns - not flat solid colors

**Never converge on**:
- Purple gradients on white backgrounds
- System fonts or overused families
- Predictable card-based layouts
- Cookie-cutter Bootstrap aesthetics

---

## Common Issues

**"CSS parsing failed"**
- Ensure valid CSS syntax
- SCSS/PostCSS may need preprocessing first

**"Color contrast check failed"**
- Check for CSS variables that couldn't be resolved
- Provide the actual color values or tokens file

**"Unknown framework"**
- Supported: react, vue, svelte, html
- Check spelling and lowercase

**"Token format not supported"**
- Supported: css, scss, tailwind, style-dictionary, tokens-studio, json, ts

---

## Additional Resources

- `references/design-philosophy.md` - Detailed anti-slop aesthetics guide
- `references/token-formats.md` - Design token format specifications
- `references/framework-templates.md` - Framework-specific patterns
- `assets/*.json` - JSON schema files for specifications

---

## Related Skills

- `web-search` - Research design inspiration and trends
- `research-workflow` - Deep dive into design systems
