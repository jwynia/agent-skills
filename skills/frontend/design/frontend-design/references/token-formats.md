# Design Token Formats Reference

This document describes the various design token output formats supported by the frontend-design skill tools.

## Overview

Design tokens are the atomic values of a design system - colors, typography, spacing, etc. stored in a format that can be consumed by different platforms and tools.

## Supported Formats

### 1. CSS Custom Properties

**File extension**: `.css`

Standard CSS variables that work in any modern browser.

```css
:root {
  /* Colors */
  --color-primary-500: #2563eb;
  --color-primary-600: #1d4ed8;

  /* Spacing */
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;

  /* Typography */
  --font-body: Inter, sans-serif;
  --text-base: 1rem;
}
```

**Usage**:
```css
.button {
  background: var(--color-primary-500);
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: var(--font-body);
}
```

**Pros**:
- Native browser support
- Runtime theming (dark mode, etc.)
- No build step required

**Cons**:
- No type safety
- Limited IDE support

---

### 2. SCSS Variables

**File extension**: `.scss`

SCSS/Sass variables with maps for iteration.

```scss
// Colors
$color-primary-500: #2563eb;
$color-primary-600: #1d4ed8;

// Spacing
$spacing-sm: 0.5rem;
$spacing-md: 1rem;

// Maps for iteration
$colors: (
  'primary-500': #2563eb,
  'primary-600': #1d4ed8,
);

$spacing: (
  'sm': 0.5rem,
  'md': 1rem,
);
```

**Usage**:
```scss
.button {
  background: $color-primary-500;
  padding: $spacing-sm $spacing-md;
}

// Generate utility classes
@each $name, $value in $spacing {
  .p-#{$name} { padding: $value; }
}
```

**Pros**:
- Compile-time optimization
- Programmatic generation with loops
- Mature ecosystem

**Cons**:
- Requires build step
- No runtime theming without CSS vars

---

### 3. Tailwind Config

**File extension**: `.tailwind.js`

Extension object for Tailwind CSS configuration.

```javascript
module.exports = {
  colors: {
    primary: {
      500: '#2563eb',
      600: '#1d4ed8',
    },
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
  },
  fontFamily: {
    body: ['Inter', 'sans-serif'],
  },
};
```

**Usage** (in `tailwind.config.js`):
```javascript
const tokens = require('./tokens.tailwind.js');

module.exports = {
  theme: {
    extend: tokens,
  },
};
```

**Pros**:
- Direct Tailwind integration
- Utility class generation
- PurgeCSS optimization

**Cons**:
- Tailwind-specific
- Requires Tailwind setup

---

### 4. JSON

**File extension**: `.json`

Raw JSON format for maximum portability.

```json
{
  "name": "my-design-system",
  "tokens": {
    "color": {
      "primary": {
        "500": "#2563eb",
        "600": "#1d4ed8"
      }
    },
    "spacing": {
      "sm": "0.5rem",
      "md": "1rem"
    }
  }
}
```

**Usage**:
- Import in any language
- Transform with custom tools
- Use as source of truth

**Pros**:
- Universal format
- Easy to parse
- Platform agnostic

**Cons**:
- Requires transformation for use
- No direct runtime usage

---

### 5. JavaScript Module

**File extension**: `.js`

ES module with exports.

```javascript
export const tokens = {
  color: {
    primary: {
      500: '#2563eb',
      600: '#1d4ed8',
    },
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
  },
};

export const flatTokens = {
  'color-primary-500': '#2563eb',
  'color-primary-600': '#1d4ed8',
  'spacing-sm': '0.5rem',
  'spacing-md': '1rem',
};

export default tokens;
```

**Usage**:
```javascript
import { tokens, flatTokens } from './tokens.js';

const primaryColor = tokens.color.primary[500];
```

**Pros**:
- Direct JavaScript import
- Tree-shakeable
- Works with any bundler

**Cons**:
- JavaScript only
- No type information

---

### 6. TypeScript Module

**File extension**: `.ts`

TypeScript module with full type definitions.

```typescript
export interface DesignTokens {
  color: {
    primary: Record<string, string>;
  };
  spacing: Record<string, string>;
}

export const tokens: DesignTokens = {
  color: {
    primary: {
      500: '#2563eb',
      600: '#1d4ed8',
    },
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
  },
} as const;

export type FlatToken = string | number;
export const flatTokens: Record<string, FlatToken> = {
  'color-primary-500': '#2563eb',
  'spacing-sm': '0.5rem',
};

export default tokens;
```

**Usage**:
```typescript
import tokens, { DesignTokens } from './tokens';

// Full type safety
const color: string = tokens.color.primary[500];
```

**Pros**:
- Full type safety
- IDE autocomplete
- Compile-time validation

**Cons**:
- TypeScript only
- Requires compilation

---

### 7. Style Dictionary

**File extension**: `.tokens.json`

Format compatible with Amazon's Style Dictionary tool.

```json
{
  "color": {
    "primary": {
      "500": { "value": "#2563eb" },
      "600": { "value": "#1d4ed8" }
    }
  },
  "spacing": {
    "sm": { "value": "0.5rem" },
    "md": { "value": "1rem" }
  }
}
```

**Usage**:
Use with Style Dictionary to generate platform-specific outputs (iOS, Android, CSS, etc.).

**Pros**:
- Multi-platform support
- Powerful transformation system
- Industry standard

**Cons**:
- Requires Style Dictionary setup
- Additional tooling

---

## Format Selection Guide

| Use Case | Recommended Format |
|----------|-------------------|
| Web-only, runtime theming | CSS |
| Sass/SCSS project | SCSS |
| Tailwind CSS project | Tailwind |
| Multi-platform design system | Style Dictionary |
| React/JS application | TypeScript |
| Universal source of truth | JSON |
| Quick prototyping | CSS |

## Token Categories

All formats support these token categories:

| Category | Examples |
|----------|----------|
| `color` | Primary, secondary, semantic colors |
| `spacing` | Margins, paddings, gaps |
| `typography` | Font families, sizes, weights, line heights |
| `shadow` | Box shadows, text shadows |
| `border` | Radius, width |
| `animation` | Duration, easing functions |
| `zIndex` | Stacking layers |

## Best Practices

1. **Use semantic names** - `color-primary` not `color-blue`
2. **Maintain consistency** - Same structure across all formats
3. **Include metadata** - Name, description, version
4. **Version control** - Track token changes
5. **Single source of truth** - Generate all formats from one spec
