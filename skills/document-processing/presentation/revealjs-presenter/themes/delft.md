# RevealJS Delft Theme

An elegant, refined visual theme inspired by traditional Dutch Delft blue and white porcelain pottery. Features classical typography, a distinctive blue palette, and warm porcelain backgrounds that evoke 17th-century craftsmanship with modern clarity.

## When to Use

- Academic and research presentations
- Cultural or heritage topics
- Presentations requiring a refined, sophisticated aesthetic
- Content where elegance and credibility matter
- Design, architecture, or art-focused talks

---

## 1. CSS Variables (Design Tokens)

Every presentation using this theme must include these variables.

```css
:root {
  /* === COLORS === */
  /* Porcelain backgrounds */
  --bg-primary: #FFFEFA;
  --bg-secondary: #F8F6EE;
  --bg-dark: #0A1A30;
  --bg-accent: #1E4D8C;

  /* Text colors */
  --text-primary: #0A1A30;
  --text-secondary: #163662;
  --text-muted: #4A87C4;
  --text-on-dark: #FFFEFA;

  /* Delft Blue palette */
  --accent-1: #1E4D8C;      /* Traditional Delft blue */
  --accent-2: #2E68A8;      /* Lighter Delft */
  --accent-3: #7FAAD8;      /* Mid blue */
  --accent-4: #B3CDE9;      /* Pale blue */

  /* Extended Delft scale */
  --delft-50:  #EEF4FB;
  --delft-100: #D9E6F5;
  --delft-200: #B3CDE9;
  --delft-300: #7FAAD8;
  --delft-400: #4A87C4;
  --delft-500: #2E68A8;
  --delft-600: #1E4D8C;
  --delft-700: #1A4178;
  --delft-800: #163662;
  --delft-900: #122B4D;
  --delft-950: #0A1A30;

  /* Porcelain scale */
  --porcelain-50:  #FFFEFA;
  --porcelain-100: #FDFCF7;
  --porcelain-200: #F8F6EE;
  --porcelain-300: #F0EDE2;
  --porcelain-400: #E5E0D1;
  --porcelain-500: #D4CDB8;

  /* === TYPOGRAPHY === */
  --font-display: 'DM Serif Display', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* === SIZE SCALE === */
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
  --bar-height: 4px;
  --card-radius: 4px;
  --card-padding: 2rem;

  /* === LAYOUT === */
  --content-max-width: 1400px;
  --slide-padding: 60px;
}
```

---

## 2. Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@100;200;300;400;500;600;700;800;900&family=DM+Serif+Display&family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap" rel="stylesheet">
```

Note: DM Serif Display only comes in weight 400, which is by design - it's a display face meant for headlines at large sizes.

---

## 3. Typography Application

```css
/* Headlines - elegant serif */
.reveal h1, .reveal h2, .reveal h3, .reveal h4 {
  font-family: var(--font-display);
  font-weight: 400;
  color: var(--text-primary);
  text-transform: none;
  letter-spacing: -0.01em;
  line-height: 1.15;
  margin: 0 0 0.5em 0;
}

.reveal h1 { font-size: var(--size-h1); }
.reveal h2 { font-size: var(--size-h2); }
.reveal h3 { font-size: var(--size-h3); }
.reveal h4 { font-size: var(--size-h4); }

/* Body text - clean sans */
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
  font-family: var(--font-display);
  font-size: var(--size-stat);
  font-weight: 400;
  line-height: 1;
  color: var(--accent-1);
  margin-bottom: 0;
}

.reveal .stat-hero {
  font-family: var(--font-display);
  font-size: var(--size-stat-hero);
  font-weight: 400;
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

/* Impact text - elegant assertions */
.reveal .impact {
  font-family: var(--font-display);
  font-size: var(--size-impact);
  font-weight: 400;
  line-height: 1.2;
}

.reveal .impact-hero {
  font-family: var(--font-display);
  font-size: var(--size-impact-hero);
  font-weight: 400;
  line-height: 1.15;
}
```

**Typography character:**
The Delft theme uses DM Serif Display for headlines, stats, and impact text. This creates an elegant, refined feel reminiscent of classical Dutch printing. The serif display face at large sizes pairs beautifully with DM Sans for body text.

---

## 4. Color Utilities

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

/* Inline highlights */
.reveal .highlight-1 { color: var(--accent-1); font-weight: 600; }
.reveal .highlight-2 { color: var(--accent-2); font-weight: 600; }
.reveal .highlight-3 { color: var(--accent-3); font-weight: 600; }
.reveal .highlight-4 { color: var(--accent-4); font-weight: 600; }

/* Background colors - applied to sections via data-background-color */
/* Use: <section data-background-color="var(--bg-dark)"> */
```

**Color usage:**
The Delft theme uses a restrained palette. Primary Delft blue (`--accent-1`) should be the dominant accent. Use lighter blues sparingly for visual interest. The warm porcelain background (`--bg-primary`) provides subtle warmth that distinguishes this theme from stark white.

---

## 5. Section Break Color Rotation

For visual rhythm while maintaining elegance, use these backgrounds:

| Section | Background | Text Class |
|---------|------------|------------|
| Opening | `var(--bg-primary)` | default |
| Section 1 | `var(--bg-dark)` | `text-on-dark` |
| Section 2 | `var(--accent-1)` | `text-on-dark` |
| Section 3 | `var(--bg-dark)` | `text-on-dark` |
| Closing | `var(--accent-1)` | `text-on-dark` |

**Example:**
```html
<section class="centered" data-background-color="#0A1A30">
  <h1 class="text-on-dark">The Challenge</h1>
  <div class="bar bar-accent-3"></div>
</section>
```

**Design note:** The Delft theme should feel like viewing pottery in a museum - moments of deep blue against warm white. Avoid overusing colored backgrounds; let the porcelain breathe.

---

## 6. Animation Settings

This theme uses subtle, refined transitions:

```javascript
{
  transition: 'fade',
  transitionSpeed: 'default',
  backgroundTransition: 'fade'
}
```

The slightly slower default speed suits the contemplative, refined nature of this theme.

---

## 7. Component Styling

### Bar Accents

The Delft theme uses a thinner, more refined bar:

```css
.bar {
  width: var(--bar-width);
  height: var(--bar-height);  /* 4px instead of 8px */
  background: var(--accent-1);
  margin-bottom: var(--space-md);
}

.bar-accent-2 { background: var(--accent-2); }
.bar-accent-3 { background: var(--accent-3); }
.bar-accent-4 { background: var(--accent-4); }
.bar-porcelain { background: var(--porcelain-400); }

.centered .bar {
  margin-left: auto;
  margin-right: auto;
}
```

### Cards

```css
.card {
  background: var(--bg-primary);
  border: 1px solid var(--delft-200);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
}

.card-dark {
  background: var(--bg-dark);
  border: 1px solid var(--delft-800);
  color: var(--text-on-dark);
}
```

---

## 8. Content Strategy

The Delft theme balances information with elegance. It supports more content than Bold while maintaining visual refinement.

### Word Limits

| Slide Type | Max Words |
|------------|-----------|
| Title | 12 |
| Section Break | 8 |
| Single Word/Phrase | 4 |
| Single Assertion | 18 |
| Hero Stat | 12 |
| Standard Stat | 12 |
| Quote | 25 |
| Assertion + Evidence | 40 |
| Card Grid | 20 per card |
| Timeline | 15 per phase |
| Closing | 20 |

### Slide Type Preferences

**Strongly Prefer:**
- Single Assertion with serif typography - elegant and impactful
- Hero Stat - the classical serif makes numbers feel significant
- Quote slides - the typography suits quotations beautifully
- Section breaks with deep blue backgrounds

**Use Freely:**
- Card Grid (2-3 cards)
- Timeline (3-4 phases)
- Assertion + Evidence

**Use Sparingly:**
- Dense bullet lists (max 4 items)
- 4-card grids
- Code blocks (use only when essential)

### Content Rhythm

- After every **3 information slides**, insert a breath slide or section break
- Section breaks should alternate between `--bg-dark` and `--accent-1`
- **30% of slides** should be transitional or impact slides
- Let the porcelain background breathe - not every slide needs color

### Structure Rules

- **Maximum 4 bullet points** per slide
- Card grids work best with **2-3 items**
- Timelines can have **3-4 phases**
- Headlines can be either assertions or elegant topic titles
- Use `.lead` for refined subtitles
- The serif display face works beautifully for pull quotes

---

## 9. Visual Identity Notes

### The Delft Aesthetic

Delft pottery is characterized by:
- **Craftsmanship** - Precise, intentional brushwork
- **Restraint** - Limited palette used masterfully
- **Warmth** - Cream porcelain, not stark white
- **Heritage** - Classical forms with timeless appeal

Apply these principles:
- Use color purposefully, not decoratively
- Let whitespace (porcelain space) do the work
- Typography should feel considered, not aggressive
- The blue should feel precious, not overwhelming

### Do
- Use the warm porcelain background as your canvas
- Let headlines in DM Serif Display speak with quiet authority
- Create contrast through the blue/porcelain relationship
- Treat section breaks as moments of visual rest

### Don't
- Overwhelm with too many blue elements
- Use harsh white backgrounds (prefer porcelain)
- Mix too many accent colors
- Make it feel cold or corporate

---

## Size Comparison: Delft vs Corporate vs Bold

| Variable | Delft | Corporate | Bold |
|----------|-------|-----------|------|
| --size-h1 | max 7rem | max 7rem | max 9rem |
| --size-h2 | max 5rem | max 5rem | max 7rem |
| --size-body | max 2rem | max 2rem | max 2rem |
| --size-impact | max 4.5rem | max 4.5rem | max 5rem |
| Display font | DM Serif Display | Space Grotesk | Space Grotesk |
| Bar height | 4px | 8px | 8px |
| Character | Elegant | Professional | Bold |

Choose Delft when elegance, heritage, or refined aesthetics matter more than high-energy impact.
