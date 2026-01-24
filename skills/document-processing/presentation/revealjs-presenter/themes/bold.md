# RevealJS Bold Theme

A high-impact visual theme optimized for maximum readability and dramatic presentation moments. Features large typography, bold weights, and strong color contrasts.

## When to Use

- Conference presentations on large screens
- Talks where audience is far from the display
- High-energy, persuasive presentations
- Content with key statistics and dramatic assertions

---

## 1. CSS Variables (Design Tokens)

Every presentation using this theme must include these variables.

```css
:root {
  /* === COLORS === */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f7;
  --bg-dark: #1a1a2e;
  --bg-accent: #003366;

  --text-primary: #1a1a1a;
  --text-secondary: #4a4a4a;
  --text-muted: #7a7a7a;
  --text-on-dark: #ffffff;

  --accent-1: #0066cc;      /* Primary accent */
  --accent-2: #00a86b;      /* Secondary accent */
  --accent-3: #ff6b35;      /* Tertiary accent */
  --accent-4: #7c3aed;      /* Quaternary accent */

  /* === TYPOGRAPHY === */
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* === SIZE SCALE === */
  /* Stats - the "big number" moments */
  --size-stat-hero: clamp(6rem, 15vw, 14rem);   /* The ONE dramatic stat */
  --size-stat: clamp(4rem, 10vw, 8rem);         /* Standard stat */

  /* Impact text - for dramatic assertions */
  --size-impact-hero: clamp(4rem, 12vw, 7rem);  /* The paradigm-shifting statement */
  --size-impact: clamp(3rem, 8vw, 5rem);        /* Key assertions */

  /* Headlines */
  --size-h1: clamp(6rem, 8vw, 9rem);
  --size-h2: clamp(4rem, 12vw, 7rem);
  --size-h3: clamp(1.75rem, 3.5vw, 3rem);
  --size-h4: clamp(1.5rem, 2.5vw, 2rem);

  /* Body */
  --size-body: clamp(1.25rem, 2vw, 2rem);
  --size-body-lg: clamp(1.5rem, 2.5vw, 2.25rem);
  --size-body-xl: clamp(2.5rem, 3vw, 3.5rem);   /* Lead text, subtitles */
  --size-small: clamp(1rem, 1.25vw, 1.25rem);

  /* Labels */
  --size-label: clamp(1.5rem, 2.5vw, 2.25rem);

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
  font-size: var(--size-body-xl);
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

/* Impact text - for dramatic assertions */
.reveal .impact {
  font-size: var(--size-impact);
  font-weight: 700;
  line-height: 1.1;
}

.reveal .impact-hero {
  font-size: var(--size-impact-hero);
  font-weight: 700;
  line-height: 1.05;
}
```

**Impact text usage:**
Use `.impact` and `.impact-hero` for dramatic statements that need more presence than body text but aren't headlines. These work best as standalone assertions on their own slides.

```html
<section class="centered">
  <p class="impact">AI agents are the primary developers.</p>
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

/* Inline highlights - for emphasis within sentences */
.reveal .highlight-1 { color: var(--accent-1); font-weight: 600; }
.reveal .highlight-2 { color: var(--accent-2); font-weight: 600; }
.reveal .highlight-3 { color: var(--accent-3); font-weight: 600; }
.reveal .highlight-4 { color: var(--accent-4); font-weight: 600; }

/* Background colors - applied to sections via data-background-color */
/* Use: <section data-background-color="var(--bg-dark)"> */
```

**Inline highlight usage:**
Use highlight classes within text to emphasize specific words or phrases. This creates visual interest and guides the audience's attention to key terms.

```html
<p class="impact">Languages built for <span class="highlight-3">humans</span>
create failure modes for <span class="highlight-1">AI</span>.</p>
```

---

## 4. Section Break Color Rotation

For visual rhythm, vary section break backgrounds. Suggested rotation:

| Section | Background | Bar Accent |
|---------|------------|------------|
| 1 (Problem/Context) | `var(--bg-dark)` | `bar-accent-3` |
| 2 (Solution) | `var(--accent-1)` | `bar-accent-2` |
| 3 (Details) | `var(--accent-2)` | default |
| 4 (Future/CTA) | `var(--bg-dark)` | `bar-accent-2` |

**Example with accent background:**
```html
<section class="centered" data-background-color="#D45D00">
  <h1 class="text-on-dark">The Problem</h1>
  <p class="text-on-dark" style="opacity: 0.8;">Why the current paradigm is broken.</p>
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

Avoid `zoom`, `convex`, or other distracting transitions.

---

## 6. Content Strategy

The bold theme prioritizes dramatic impact over information density. Every slide should land with force.

### Word Limits (Strict)

| Slide Type | Max Words |
|------------|-----------|
| Title | 10 |
| Section Break | 6 |
| Single Word/Phrase | 3 |
| Single Assertion | 12 |
| Hero Stat | 8 |
| Standard Stat | 10 |
| Quote | 20 |
| Assertion + Evidence | 25 |
| Card Grid | 10 per card, **max 2 cards** |
| Timeline | 8 per phase, **max 3 phases** |
| Closing | 12 |

### Slide Type Preferences

**Strongly Prefer:**
- Single Assertion (`.impact`, `.impact-hero`) — The workhorse of bold presentations
- Hero Stat — One number dominates the slide
- Section Break — Bold color backgrounds create rhythm
- Single Word/Phrase — Maximum impact moments

**Use Sparingly:**
- Card Grid — Maximum 2 cards, never 4
- Timeline — Maximum 3 phases
- Assertion + Evidence — Only when visual proof is essential

**Avoid:**
- 4-card grids
- Dense bullet lists (max 2 bullets ever)
- Stat clusters (use separate slides instead)
- Code blocks longer than 8 lines

### Content Rhythm

- After every **2 information slides**, insert an impact slide
- Section breaks should use **different bold accent colors** (rotate through accent-1, accent-2, accent-3)
- **40%+ of slides** should be "impact" type (Single Assertion, Hero Stat, Section Break, Single Word)
- Never have 3 information slides in a row without a visual break

### Structure Rules

- **Maximum 2 bullet points** per slide — if you need more, split the slide
- **One idea per slide** — split aggressively
- Prefer `.impact-hero` for thesis statements and paradigm shifts
- Use `.impact` for supporting assertions
- Headlines should be assertions, not topics ("AI agents are primary developers" not "The Role of AI")
- Every section break needs a different background color
