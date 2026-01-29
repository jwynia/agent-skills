# RevealJS Corporate Theme

A professional, conservative visual theme suited for business presentations. Features moderate typography sizes, muted color palette, and clean aesthetics appropriate for corporate environments.

## When to Use

- Board meetings and executive presentations
- Internal business updates
- Situations where understated professionalism is preferred
- Presentations viewed on laptops or smaller screens
- Content-dense slides where readability at normal viewing distance matters

---

## 1. CSS Variables (Design Tokens)

Every presentation using this theme must include these variables.

```css
:root {
  /* === COLORS === */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f7;
  --bg-dark: #0f172a;
  --bg-accent: #1e3a5f;

  --text-primary: #1a1a1a;
  --text-secondary: #4a4a4a;
  --text-muted: #7a7a7a;
  --text-on-dark: #ffffff;

  --accent-1: #3b82f6;      /* Blue - primary */
  --accent-2: #10b981;      /* Green - success */
  --accent-3: #f59e0b;      /* Amber - warning */
  --accent-4: #8b5cf6;      /* Purple - special */
  --accent-5: #ef4444;      /* Red - problem */

  /* === TYPOGRAPHY === */
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* === SIZE SCALE (Corporate - readable at distance) === */
  /* Stats - the "big number" moments */
  --size-stat-hero: clamp(6rem, 15vw, 12rem);
  --size-stat: clamp(4rem, 10vw, 8rem);

  /* Impact text - for key assertions */
  --size-impact-hero: clamp(3.5rem, 10vw, 6rem);
  --size-impact: clamp(2.5rem, 6vw, 4.5rem);

  /* Headlines */
  --size-h1: clamp(4rem, 7vw, 7rem);
  --size-h2: clamp(3rem, 5vw, 5rem);
  --size-h3: clamp(2rem, 3.5vw, 3rem);
  --size-h4: clamp(1.5rem, 2.5vw, 2rem);

  /* Body */
  --size-body: clamp(1.25rem, 2vw, 2rem);
  --size-body-lg: clamp(1.5rem, 2.5vw, 2.25rem);
  --size-body-xl: clamp(2rem, 2.5vw, 3rem);
  --size-small: clamp(1rem, 1.25vw, 1.25rem);

  /* Labels */
  --size-label: clamp(1.25rem, 2vw, 1.75rem);

  /* === SPACING === */
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 2rem;
  --space-lg: 3rem;
  --space-xl: 4rem;

  /* === COMPONENTS === */
  --bar-width: 120px;
  --bar-height: 8px;
  --card-radius: 8px;
  --card-padding: 2rem;

  /* === LAYOUT === */
  --content-max-width: 1400px;
  --slide-padding: 60px;
}
```

---

## 2. Typography Application

```css
/* Headlines */
.reveal h1 { font-size: var(--size-h1); }
.reveal h2 { font-size: var(--size-h2); }
.reveal h3 { font-size: var(--size-h3); }
.reveal h4 { font-size: var(--size-h4); }

/* Body text */
.reveal p,
.reveal li {
  font-size: var(--size-body);
}

.reveal .lead {
  font-size: var(--size-body-lg);
  color: var(--text-secondary);
}

/* Labels and captions */
.reveal .label {
  font-family: var(--font-mono);
  font-size: var(--size-label);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-1);
}

/* Stats */
.reveal .stat {
  font-family: var(--font-mono);
  font-size: var(--size-stat);
  font-weight: 700;
  line-height: 1;
  color: var(--accent-1);
  margin-bottom: 0;
}

.reveal .stat-hero {
  font-family: var(--font-mono);
  font-size: var(--size-stat-hero);
  font-weight: 700;
  line-height: 0.9;
  color: var(--accent-1);
  margin-bottom: 0;
}

.reveal .stat-label {
  font-size: var(--size-body-lg);
  font-weight: 500;
  color: var(--text-secondary);
  margin-top: var(--space-sm);
}

/* Impact text - for key assertions (conservative weight) */
.reveal .impact {
  font-size: var(--size-impact);
  font-weight: 700;
  line-height: 1.15;
}

.reveal .impact-hero {
  font-size: var(--size-impact-hero);
  font-weight: 700;
  line-height: 1.1;
}
```

**Impact text usage:**
Use `.impact` and `.impact-hero` for key statements.

```html
<section class="centered">
  <p class="impact">Our platform reduces complexity.</p>
</section>
```

---

## 3. Color Utilities

```css
/* Text colors - use .reveal prefix for specificity */
.reveal .text-primary { color: var(--text-primary); }
.reveal .text-secondary { color: var(--text-secondary); }
.reveal .text-muted { color: var(--text-muted); }
.reveal .text-on-dark { color: var(--text-on-dark); }
.reveal .text-accent-1 { color: var(--accent-1); }
.reveal .text-accent-2 { color: var(--accent-2); }
.reveal .text-accent-3 { color: var(--accent-3); }
.reveal .text-accent-4 { color: var(--accent-4); }
.reveal .text-accent-5 { color: var(--accent-5); }

/* Inline highlights - for emphasis within sentences */
.reveal .highlight-1 { color: var(--accent-1); font-weight: 600; }
.reveal .highlight-2 { color: var(--accent-2); font-weight: 600; }
.reveal .highlight-3 { color: var(--accent-3); font-weight: 600; }
.reveal .highlight-4 { color: var(--accent-4); font-weight: 600; }
.reveal .highlight-5 { color: var(--accent-5); font-weight: 600; }

/* Background colors - applied to sections via data-background-color */
/* Use: <section data-background-color="var(--bg-dark)"> */
```

**Inline highlight usage:**
Use highlight classes sparingly in corporate presentations. Emphasize only the most critical terms.

```html
<p class="lead">We achieved a <span class="highlight-2">50% reduction</span> in processing time.</p>
```

---

## 4. Section Break Color Rotation

For corporate presentations, use more subtle color variety. Suggested rotation:

| Section | Background | Bar Accent |
|---------|------------|------------|
| 1 (Context) | `var(--bg-dark)` | default |
| 2 (Problem) | `var(--accent-5)` | `bar-accent-3` |
| 3 (Solution) | `var(--accent-1)` | `bar-accent-2` |
| 4 (Results) | `var(--bg-dark)` | `bar-accent-2` |

**Example:**
```html
<section class="centered" data-background-color="var(--bg-dark)">
  <h1 class="text-on-dark">Key Results</h1>
  <div class="bar bar-accent-2"></div>
</section>
```

---

## 5. Animation Settings

This theme uses subtle, professional transitions:

```javascript
{
  transition: 'fade',
  transitionSpeed: 'fast',
  backgroundTransition: 'fade'
}
```

Avoid dramatic transitions in corporate settings.

---

## 6. Content Strategy

The corporate theme supports information-dense presentations where detail and thoroughness matter.

### Word Limits

| Slide Type | Max Words |
|------------|-----------|
| Title | 15 |
| Section Break | 10 |
| Single Word/Phrase | 5 |
| Single Assertion | 20 |
| Hero Stat | 15 |
| Standard Stat | 15 |
| Stat Cluster | 10 per stat |
| Quote | 30 |
| Assertion + Evidence | 50 |
| Card Grid | 25 per card |
| Timeline | 20 per phase |
| Comparison | 30 per side |
| Closing | 25 |

### Slide Type Preferences

**Strongly Prefer:**
- Assertion + Evidence — The workhorse slide, supports detailed explanations
- Card Grid — 2-4 cards for features, benefits, categories
- Timeline / Phases — Up to 5 phases for roadmaps and processes
- Stat Cluster — Group related metrics

**Use Freely:**
- All slide types are appropriate
- Bullet lists where they aid clarity (up to 5 items)
- Code blocks for technical audiences

**Use Sparingly:**
- Single Word/Phrase — Reserve for truly pivotal moments
- Impact-hero — Corporate audiences expect substance

### Content Rhythm

- After every **3-4 information slides**, insert a breath slide or section break
- Section breaks provide structure but should not dominate the deck
- **20-30% of slides** should be transitional (section breaks, breath slides)
- Information density is acceptable — audiences expect detail

### Structure Rules

- **Maximum 5 bullet points** per slide
- Card grids can have **4 items**
- Timelines can have **4-5 phases**
- Support **detailed explanations** where needed
- Code blocks can be up to **15 lines**
- Headlines can be descriptive topics ("Implementation Roadmap") not just assertions
- Use `.lead` class for supporting context under headlines

---

## Size Comparison: Corporate vs Bold

| Variable | Corporate | Bold | Difference |
|----------|-----------|------|------------|
| --size-h1 | max 7rem | max 9rem | -22% |
| --size-h2 | max 5rem | max 7rem | -29% |
| --size-body | max 2rem | max 2rem | same |
| --size-impact | max 4.5rem | max 5rem | -10% |
| --size-label | max 1.75rem | max 2.25rem | -22% |

Choose Corporate when you need more information density while maintaining readability.
