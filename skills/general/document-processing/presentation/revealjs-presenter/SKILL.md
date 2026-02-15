---
name: revealjs-presenter
description: Generate RevealJS HTML presentations with reliable layout, professional typography, and effective visual communication. Use when creating slide decks, pitch presentations, technical talks, or any reveal.js output.
license: MIT
metadata:
  author: jwynia
  version: "1.0"
  type: generator
  mode: generative
  domain: documents
---

# RevealJS Presenter Skill

## When to Use This Skill

Use this skill when:
- Creating a RevealJS presentation from content/outline
- Converting document content into slide format
- Building a pitch deck, technical talk, or educational presentation
- User requests "slides," "presentation," "deck," or mentions RevealJS

This skill produces a single self-contained HTML file with embedded CSS and CDN references.

---

## Part 1: RevealJS Foundation

### 1.1 Required Configuration

Always initialize RevealJS with these settings:

```javascript
Reveal.initialize({
  hash: true,
  center: true,
  transition: 'fade',
  transitionSpeed: 'fast',
  backgroundTransition: 'fade',
  width: 1920,
  height: 1080,
  margin: 0.08,
  minScale: 0.2,
  maxScale: 2.0
});
```

**Why these values:**
- `center: true` — Let RevealJS handle vertical centering. Do not fight this with flexbox on sections.
- `width: 1920, height: 1080` — Standard HD ratio. Content scales automatically.
- `margin: 0.08` — Provides breathing room at viewport edges.
- `transition: 'fade'` — Professional, non-distracting. Avoid 'zoom', 'convex', etc.

### 1.2 Base HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[PRESENTATION TITLE]</title>
  
  <!-- RevealJS -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/theme/white.min.css">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap" rel="stylesheet">
  
  <style>
    /* Theme variables and styles go here */
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <!-- Slides go here -->
    </div>
  </div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      center: true,
      transition: 'fade',
      transitionSpeed: 'fast',
      backgroundTransition: 'fade',
      width: 1920,
      height: 1080,
      margin: 0.08,
      minScale: 0.2,
      maxScale: 2.0
    });
  </script>
</body>
</html>
```

### 1.3 Base CSS Reset

Apply these styles to normalize RevealJS behavior:

```css
/* === RESET & NORMALIZATION === */
.reveal {
  font-family: var(--font-body);
  font-weight: 400;
  color: var(--text-primary);
}

.reveal .slides section {
  text-align: left;
  padding: 60px;
  box-sizing: border-box;
}

.reveal .slides section.centered {
  text-align: center;
}

.reveal h1, .reveal h2, .reveal h3, .reveal h4 {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text-primary);
  text-transform: none;
  letter-spacing: -0.02em;
  line-height: 1.1;
  margin: 0 0 0.5em 0;
}

.reveal p {
  margin: 0 0 1em 0;
  line-height: 1.5;
}

.reveal ul, .reveal ol {
  margin: 0;
  padding: 0;
  list-style-position: outside;
  margin-left: 1.5em;
}

.reveal li {
  margin-bottom: 0.5em;
  line-height: 1.4;
}
```

---

## Part 2: Theme Selection

**Themes are complete specifications.** Before generating any slides, read the appropriate theme file from the `themes/` directory. Themes control both visual styling AND content strategy.

### 2.1 What Themes Control

Each theme file specifies:

1. **CSS Variables** — Colors, typography sizes, spacing, fonts
2. **Typography Application** — How CSS variables apply to elements
3. **Word Limits** — Maximum words per slide type
4. **Slide Type Preferences** — Which types to prefer, use sparingly, or avoid
5. **Content Rhythm** — Impact vs information slide ratios
6. **Structure Rules** — Max bullets, card counts, splitting guidance

### 2.2 Default Theme

Use `themes/bold.md` unless the user specifies otherwise.

### 2.3 How to Apply a Theme

1. Read the entire theme file before generating slides
2. Follow the theme's **Content Strategy** section for word limits and slide type choices
3. Include all CSS from the theme's variables and typography sections
4. Combine with the base CSS reset from Part 1.3

### 2.4 Available Themes

| Theme | File | Content Approach |
|-------|------|------------------|
| Bold | `themes/bold.md` | Minimal words, dramatic impact, simple structures, 40%+ impact slides |
| Corporate | `themes/corporate.md` | Information-dense, detailed content, complex structures allowed |

Future themes may include `minimal.md` (clean, understated design).

---

## Part 3: Core Components

### 3.1 The Bar (Accent Element)

A horizontal bar used as a visual anchor and section indicator.

```css
.bar {
  width: var(--bar-width);
  height: var(--bar-height);
  background: var(--accent-1);
  margin-bottom: var(--space-md);
}

.bar-accent-2 { background: var(--accent-2); }
.bar-accent-3 { background: var(--accent-3); }
.bar-accent-4 { background: var(--accent-4); }

.centered .bar {
  margin-left: auto;
  margin-right: auto;
}
```

**Usage:**
```html
<div class="bar"></div>
<h2>Section Title</h2>
```

### 3.2 Content Container

For slides that need width constraint:

```css
.content-wrap {
  max-width: var(--content-max-width);
  width: 100%;
}

.centered .content-wrap {
  margin: 0 auto;
}
```

### 3.3 Card Component

```css
.card {
  background: var(--bg-secondary);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  border-left: 4px solid var(--accent-1);
}

.card-accent-2 { border-left-color: var(--accent-2); }
.card-accent-3 { border-left-color: var(--accent-3); }
.card-accent-4 { border-left-color: var(--accent-4); }

.card h3 {
  font-size: var(--size-h4);
  margin-bottom: var(--space-xs);
}

.card p {
  font-size: var(--size-body);
  color: var(--text-secondary);
  margin: 0;
}
```

### 3.4 Grid Layouts

```css
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-lg);
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-md);
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-md);
}

/* For uneven splits */
.grid-2-1 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-lg);
}

.grid-1-2 {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: var(--space-lg);
}
```

### 3.5 Slide Footer

A persistent footer element for branding or context. Placed outside the slides container.

```css
.slide-footer {
  position: fixed;
  bottom: 30px;
  left: var(--slide-padding);
  font-size: var(--size-label);
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
  z-index: 1000;
}

/* Adapt for dark backgrounds */
section[data-background-color] .slide-footer,
.dark-slide .slide-footer {
  color: rgba(255, 255, 255, 0.4);
}
```

**HTML placement** (before the reveal div):
```html
<body>
  <div class="slide-footer">Company Name | Presentation Title</div>
  <div class="reveal">
    ...
  </div>
</body>
```

**When to use:** Corporate presentations, conference talks, any context where persistent branding helps.
**Mistakes:** Too much information, large font size, distracting from content.

---

## Part 4: Slide Types

Each slide type includes: HTML structure, when to use, and common mistakes.

### 4.1 Title Slide

The opening slide. Sets tone and context.

```html
<section class="centered">
  <p class="label">Category or Context</p>
  <h1>Presentation Title</h1>
  <div class="bar"></div>
  <p class="lead">Subtitle or tagline goes here</p>
</section>
```

**When to use:** Opening slide only.  
**Mistakes:** Too much text, including agenda, adding logos/footer clutter.

### 4.2 Section Break

Transitions between major sections. Creates visual pause and establishes section identity through color.

```html
<section class="centered" data-background-color="var(--bg-dark)">
  <h1 class="text-on-dark">Section Title</h1>
  <div class="bar bar-accent-2"></div>
  <p class="lead text-on-dark">Optional brief context</p>
</section>
```

**Color rotation for visual rhythm:**
Vary section break backgrounds to create distinct visual identities for each major topic. Suggested rotation:

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

**When to use:** Between major sections (3-5 per presentation typically).
**Mistakes:** Using for every topic change, adding content beyond the section name, using the same color for all section breaks.

### 4.3 Single Word / Phrase

Maximum impact. One idea, massive type.

```html
<section class="centered">
  <h1 style="font-size: var(--size-stat-hero);">Simplify.</h1>
</section>
```

**When to use:** Emphasizing a key concept, creating a moment, transitional pause.  
**Mistakes:** Overuse (more than 2-3 per presentation), using for concepts that need explanation.

### 4.4 Hero Stat

The dramatic data moment. ONE number dominates.

```html
<section class="centered">
  <p class="label">Context Label</p>
  <p class="stat-hero text-accent-1">87%</p>
  <p class="stat-label">of users completed onboarding</p>
</section>
```

**When to use:** Your most important data point. Usually only 1-2 per presentation.  
**Mistakes:** Using hero treatment for every stat, burying in other content.

### 4.5 Standard Stat

Prominent data, but not the hero moment.

```html
<section class="centered">
  <p class="label">Expected Outcome</p>
  <div class="bar"></div>
  <p class="stat text-accent-2">50%</p>
  <p class="stat-label">reduction in development time</p>
</section>
```

**When to use:** Supporting data points, secondary metrics.  
**Mistakes:** Making all stats the same size, no context labels.

### 4.6 Stat Cluster

2-3 related statistics shown together for comparison.

```html
<section>
  <h2>Key Metrics</h2>
  <div class="bar"></div>
  <div class="grid-3" style="margin-top: var(--space-lg);">
    <div class="centered">
      <p class="stat text-accent-1">50%</p>
      <p class="stat-label">faster development</p>
    </div>
    <div class="centered">
      <p class="stat text-accent-2">75%</p>
      <p class="stat-label">prototype success</p>
    </div>
    <div class="centered">
      <p class="stat text-accent-3">30%</p>
      <p class="stat-label">reduced overhead</p>
    </div>
  </div>
</section>
```

**When to use:** Comparing related metrics, showing before/after, dashboard-style summary.  
**Mistakes:** More than 3 stats, mixing unrelated data.

### 4.7 Quote

Attributed quotation with visual emphasis.

```html
<section class="centered">
  <blockquote style="font-size: var(--size-h2); font-style: italic; max-width: 900px; margin: 0 auto;">
    "The best interface is no interface."
  </blockquote>
  <p class="text-muted" style="margin-top: var(--space-md);">— Golden Krishna</p>
</section>
```

**When to use:** Expert authority, memorable phrases, user testimonials.
**Mistakes:** Long quotes (aim for under 20 words), missing attribution.

### 4.8 Single Assertion (Impact Statement)

A dramatic statement that deserves its own slide. Uses impact typography with optional inline highlights.

```html
<section class="centered">
  <p class="impact">AI agents are the <span class="highlight-2">primary developers</span>.</p>
</section>
```

**With hero treatment:**
```html
<section class="centered">
  <p class="impact-hero">Languages built for <span class="highlight-3">humans</span>
  create failure modes for <span class="highlight-1">AI</span>.</p>
</section>
```

**With context label:**
```html
<section class="centered">
  <p class="label">The Inversion</p>
  <div class="bar"></div>
  <p class="impact">Human interaction becomes the <span class="highlight-2">refinement layer</span>.</p>
</section>
```

**When to use:** Thesis statements, paradigm shifts, key assertions that define your argument. The moments where you want the audience to pause and absorb a single idea.
**Mistakes:** Overuse (2-4 per presentation max), adding supporting text, using for minor points, forgetting highlights for emphasis.

### 4.9 Assertion + Evidence

The workhorse slide. Clear claim supported by visual proof.

```html
<section>
  <h2>User engagement increased 43% after redesign</h2>
  <div class="bar"></div>
  <div class="grid-1-2">
    <div>
      <p class="lead">Key insight or context that supports the assertion goes here. Keep it brief.</p>
    </div>
    <div>
      <!-- Visual evidence: chart, diagram, image, etc. -->
      <img src="chart.svg" alt="Engagement chart showing increase">
    </div>
  </div>
</section>
```

**When to use:** Most content slides. Default choice when presenting information.  
**Mistakes:** Burying assertion in body text, no visual evidence, bullet lists instead of visuals.

### 4.10 Card Grid (2-4 items)

Multiple items with equal visual weight.

```html
<section>
  <h2>Platform Capabilities</h2>
  <div class="bar"></div>
  <div class="grid-2" style="margin-top: var(--space-lg);">
    <div class="card">
      <h3>Intelligent Agents</h3>
      <p>AI-powered assistants that reason across organizational knowledge</p>
    </div>
    <div class="card card-accent-2">
      <h3>Context Networks</h3>
      <p>Unified access to information across all systems</p>
    </div>
    <div class="card card-accent-3">
      <h3>Custom Applications</h3>
      <p>Accelerated development with built-in AI</p>
    </div>
    <div class="card card-accent-4">
      <h3>Automated Workflows</h3>
      <p>Event-driven processes without manual triggers</p>
    </div>
  </div>
</section>
```

**When to use:** Features, benefits, options, categories—items with equal importance.  
**Mistakes:** More than 4 items (split into multiple slides), walls of text in cards.

### 4.11 Timeline / Phases

Sequential progression over time.

```html
<section>
  <h2>Implementation Roadmap</h2>
  <div class="bar"></div>
  <div class="grid-4" style="margin-top: var(--space-lg);">
    <div>
      <p class="stat text-accent-1" style="font-size: var(--size-h2);">01</p>
      <h4>Foundation</h4>
      <p class="text-muted">Months 1–3</p>
      <p class="text-secondary">Core infrastructure and tooling</p>
    </div>
    <div>
      <p class="stat text-accent-2" style="font-size: var(--size-h2);">02</p>
      <h4>Integration</h4>
      <p class="text-muted">Months 4–6</p>
      <p class="text-secondary">Platform connections</p>
    </div>
    <div>
      <p class="stat text-accent-3" style="font-size: var(--size-h2);">03</p>
      <h4>Intelligence</h4>
      <p class="text-muted">Months 7–9</p>
      <p class="text-secondary">Advanced capabilities</p>
    </div>
    <div>
      <p class="stat text-accent-4" style="font-size: var(--size-h2);">04</p>
      <h4>Maturity</h4>
      <p class="text-muted">Months 10–12</p>
      <p class="text-secondary">Optimization</p>
    </div>
  </div>
</section>
```

**When to use:** Project phases, historical progression, step-by-step processes.  
**Mistakes:** More than 5 phases (simplify or split), too much detail per phase.

### 4.12 Comparison (A vs B)

Direct contrast between two options or states.

```html
<section>
  <h2>Before & After</h2>
  <div class="bar"></div>
  <div class="grid-2" style="margin-top: var(--space-lg);">
    <div class="card" style="border-left-color: var(--text-muted);">
      <p class="label text-muted">Before</p>
      <h3>Manual Process</h3>
      <p>Hours of repetitive work, prone to errors, inconsistent results</p>
    </div>
    <div class="card">
      <p class="label">After</p>
      <h3>Automated Workflow</h3>
      <p>Minutes to complete, accurate, consistent every time</p>
    </div>
  </div>
</section>
```

**When to use:** Problem/solution, old/new, us/them comparisons.  
**Mistakes:** Unfair comparisons, too much text, more than 2 items.

### 4.13 Icon Grid

Concept cluster with visual anchors. Icons provide scannable landmarks.

```html
<section>
  <h2>Core Principles</h2>
  <div class="bar"></div>
  <div class="grid-3" style="margin-top: var(--space-lg);">
    <div class="centered">
      <div class="icon-wrap">
        <!-- Inline SVG icon here -->
        <svg width="64" height="64" viewBox="0 0 24 24" fill="var(--accent-1)">
          <path d="..."/>
        </svg>
      </div>
      <h4>Security</h4>
      <p class="text-secondary">Enterprise-grade protection</p>
    </div>
    <div class="centered">
      <div class="icon-wrap">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="var(--accent-2)">
          <path d="..."/>
        </svg>
      </div>
      <h4>Scalability</h4>
      <p class="text-secondary">Grows with your needs</p>
    </div>
    <div class="centered">
      <div class="icon-wrap">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="var(--accent-3)">
          <path d="..."/>
        </svg>
      </div>
      <h4>Simplicity</h4>
      <p class="text-secondary">Easy to use and maintain</p>
    </div>
  </div>
</section>
```

**When to use:** Principles, values, feature categories—abstract concepts that benefit from visual anchors.  
**Mistakes:** Generic icons that don't aid understanding, too many items.

### 4.14 Code Block

For technical presentations. Syntax highlighting required.

```html
<section>
  <h2>API Integration</h2>
  <div class="bar"></div>
  <pre><code class="language-javascript">// Initialize the client
const client = new MagicConstructor({
  apiKey: process.env.SECRET_KEY,
  workspace: 'production'
});

// Query with context
const result = await client.query({
  prompt: "Summarize Q3 sales",
  context: ['sales-data', 'quarterly-reports']
});</code></pre>
  <p class="text-muted" style="margin-top: var(--space-sm);">Full documentation at docs.coolproject.io</p>
</section>
```

**CSS for code blocks:**
```css
.reveal pre {
  font-family: var(--font-mono);
  font-size: var(--size-small);
  background: var(--bg-dark);
  color: var(--text-on-dark);
  padding: var(--space-md);
  border-radius: var(--card-radius);
  text-align: left;
  width: 100%;
  box-sizing: border-box;
}

.reveal pre code {
  font-family: inherit;
  line-height: 1.6;
}
```

**When to use:** Technical talks, API demos, implementation examples.  
**Mistakes:** Too much code (max ~15 lines), no syntax highlighting, showing boilerplate.

### 4.15 Image with Caption

Full or large image with minimal text.

```html
<section class="centered">
  <img src="product-screenshot.png" alt="Product interface" 
       style="max-height: 70vh; border-radius: var(--card-radius); box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
  <p class="text-muted" style="margin-top: var(--space-md);">New dashboard interface</p>
</section>
```

**When to use:** Product screenshots, photos, diagrams that need to dominate.  
**Mistakes:** Small images with lots of surrounding text, poor image quality.

### 4.16 Breath Slide

Minimal content. Creates pause, lets audience process.

```html
<section class="centered" data-background-color="var(--bg-secondary)">
  <p class="label">Key Takeaway</p>
  <div class="bar"></div>
  <h2>Complexity is the enemy of execution.</h2>
</section>
```

**When to use:** After dense sections, before major transitions, emphasizing key messages.  
**Mistakes:** Adding more content, using too frequently.

### 4.17 Closing / CTA

Final slide. Clear next step.

```html
<section class="centered" data-background-color="var(--bg-dark)">
  <h1 class="text-on-dark">Ready to Begin?</h1>
  <div class="bar bar-accent-2"></div>
  <p class="lead text-on-dark">Contact us at hello@example.com</p>
  <p class="text-muted" style="margin-top: var(--space-xl);">example.com/demo</p>
</section>
```

**When to use:** Final slide.  
**Mistakes:** No clear CTA, too much contact info, "Questions?" as the only content.

---

## Part 5: Inline Visualizations

For presentation-specific diagrams that don't require external tools.

### 5.1 Process Flow (Horizontal)

```html
<div class="process-flow">
  <div class="process-step">
    <div class="process-node" style="background: var(--accent-1);"></div>
    <p class="process-label">Input</p>
  </div>
  <div class="process-arrow">→</div>
  <div class="process-step">
    <div class="process-node" style="background: var(--accent-2);"></div>
    <p class="process-label">Process</p>
  </div>
  <div class="process-arrow">→</div>
  <div class="process-step">
    <div class="process-node" style="background: var(--accent-3);"></div>
    <p class="process-label">Output</p>
  </div>
</div>
```

```css
.process-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
}

.process-step {
  text-align: center;
}

.process-node {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto var(--space-xs);
}

.process-arrow {
  font-size: 2rem;
  color: var(--text-muted);
}

.process-label {
  font-size: var(--size-body);
  font-weight: 500;
}
```

### 5.2 Simple Bar Chart (SVG)

```html
<svg viewBox="0 0 400 200" style="max-width: 600px;">
  <!-- Bars -->
  <rect x="50" y="120" width="60" height="60" fill="var(--accent-1)"/>
  <rect x="130" y="80" width="60" height="100" fill="var(--accent-2)"/>
  <rect x="210" y="40" width="60" height="140" fill="var(--accent-3)"/>
  <rect x="290" y="20" width="60" height="160" fill="var(--accent-4)"/>
  
  <!-- Labels -->
  <text x="80" y="195" text-anchor="middle" font-size="14" fill="var(--text-secondary)">Q1</text>
  <text x="160" y="195" text-anchor="middle" font-size="14" fill="var(--text-secondary)">Q2</text>
  <text x="240" y="195" text-anchor="middle" font-size="14" fill="var(--text-secondary)">Q3</text>
  <text x="320" y="195" text-anchor="middle" font-size="14" fill="var(--text-secondary)">Q4</text>
</svg>
```

### 5.3 Concept Relationship (Hub and Spoke)

```html
<svg viewBox="0 0 400 300" style="max-width: 500px;">
  <!-- Lines to spokes -->
  <line x1="200" y1="150" x2="100" y2="60" stroke="var(--text-muted)" stroke-width="2"/>
  <line x1="200" y1="150" x2="300" y2="60" stroke="var(--text-muted)" stroke-width="2"/>
  <line x1="200" y1="150" x2="100" y2="240" stroke="var(--text-muted)" stroke-width="2"/>
  <line x1="200" y1="150" x2="300" y2="240" stroke="var(--text-muted)" stroke-width="2"/>
  
  <!-- Center hub -->
  <circle cx="200" cy="150" r="50" fill="var(--accent-1)"/>
  <text x="200" y="155" text-anchor="middle" fill="white" font-weight="600">Core</text>
  
  <!-- Spokes -->
  <circle cx="100" cy="60" r="35" fill="var(--accent-2)"/>
  <text x="100" y="65" text-anchor="middle" fill="white" font-size="12">Feature A</text>
  
  <circle cx="300" cy="60" r="35" fill="var(--accent-3)"/>
  <text x="300" y="65" text-anchor="middle" fill="white" font-size="12">Feature B</text>
  
  <circle cx="100" cy="240" r="35" fill="var(--accent-4)"/>
  <text x="100" y="245" text-anchor="middle" fill="white" font-size="12">Feature C</text>
  
  <circle cx="300" cy="240" r="35" fill="var(--accent-1)"/>
  <text x="300" y="245" text-anchor="middle" fill="white" font-size="12">Feature D</text>
</svg>
```

### 5.4 When to Use External Tools

Use inline SVG/HTML for:
- Simple process flows (3-5 steps)
- Basic bar/line comparisons
- Concept diagrams (hub-spoke, venn-like)
- Icon-based illustrations

Use external tools (Chart.js, D3, Mermaid) for:
- Data with more than 5-7 points
- Interactive visualizations
- Complex relationships
- Precise data representation

---

## Part 6: Universal Content Principles

These principles apply regardless of theme. For specific word limits, slide type preferences, and rhythm rules, consult the theme file (Part 2).

### 6.1 One Concept Per Slide

Every slide should answer: **"What is the ONE thing I want them to take from this?"**

If you can't answer in one sentence, split the slide.

### 6.2 Assertion-Evidence Structure

Replace bullet points with:
1. **Assertion:** Complete sentence stating the point (as headline)
2. **Evidence:** Visual that supports the assertion

**Instead of:**
```
Benefits:
• Faster development
• Better quality
• Lower costs
```

**Use three separate slides:**
- "Development time drops 50% with automated tooling" + chart
- "Defect rates decreased after implementation" + data
- "Total cost of ownership reduced by $2M annually" + comparison

### 6.3 Slide Count Guidance

- 1 slide per minute of speaking time is a rough maximum
- 20-minute talk = 15-25 slides typical
- More slides with less content each is better than fewer dense slides
- Section breaks and breath slides count toward total

### 6.4 Progressive Disclosure

For complex information, reveal sequentially using RevealJS fragments:

```html
<section>
  <h2>Three Key Factors</h2>
  <div class="bar"></div>
  <div class="grid-3">
    <div class="fragment">
      <h4>Factor One</h4>
      <p>Explanation here</p>
    </div>
    <div class="fragment">
      <h4>Factor Two</h4>
      <p>Explanation here</p>
    </div>
    <div class="fragment">
      <h4>Factor Three</h4>
      <p>Explanation here</p>
    </div>
  </div>
</section>
```

### 6.5 Word Limits and Rhythm

**Consult the theme file** for specific word limits per slide type and content rhythm rules. These vary significantly between themes:

- **Bold theme:** Strict limits (~12 words for assertions), 40%+ impact slides
- **Corporate theme:** Generous limits (~50 words for assertion+evidence), information-dense

---

## Part 7: Anti-Patterns

### 7.1 Presentation Anti-Patterns

**The Data Dump**  
Every slide full of data without interpretation.  
*Fix:* One insight per slide. State conclusion first.

**The Script Reader**  
Slides contain the speaker's full script as bullet points.  
*Fix:* Slides show what you can't say; you say what you can't show.

**The Template Trap**  
Generic template applied without considering how design serves message.  
*Fix:* Start from communication need, not template options.

**The Animation Circus**  
Transitions and effects on everything.  
*Fix:* Animation only for progressive disclosure or emphasis. Default to none.

**Bullet Point Disease**  
Every slide is a bullet list.  
*Fix:* Use assertion-evidence structure. If you need a list, question whether it needs to be a slide.

### 7.2 RevealJS-Specific Anti-Patterns

**Fighting the Framework**  
Adding flexbox centering when `center: true` is set, or vice versa.  
*Fix:* Choose one approach. This skill uses `center: true` with section-level text alignment.

**Viewport Unit Escalation**  
Using `vw` units for font sizes without upper bounds, leading to absurdly large text.  
*Fix:* Always use `clamp()` with rem-based maximums: `clamp(4rem, 10vw, 8rem)`.

**Fixed Pixel Dimensions**  
Hardcoding pixel values for fonts and spacing that don't scale.  
*Fix:* Use CSS variables with `clamp()` for responsive sizing.

**Ignoring Slide Dimensions**  
Forgetting that RevealJS scales content to fit configured dimensions.  
*Fix:* Design for 1920×1080. Test at multiple window sizes.

**Background Color Inline Styles**
Using `style="background: color"` on sections instead of `data-background-color`.
*Fix:* Use `data-background-color="var(--bg-dark)"` for RevealJS to handle properly.

**Typography Utility Specificity**
Creating utility classes like `.stat`, `.label`, `.lead` without sufficient specificity.
*Problem:* `.reveal p` has higher specificity (class + element) than `.stat` alone (just class), so typography utilities on `<p>` elements get overridden.
*Fix:* Always prefix typography utilities with `.reveal`: use `.reveal .stat`, `.reveal .label`, `.reveal .lead`, etc. This ensures they override the base `.reveal p` styles.

**Color Utility Specificity**
Creating color utilities like `.text-on-dark` without sufficient specificity.
*Problem:* `.reveal .lead` (two classes) has higher specificity than `.text-on-dark` (one class), so `class="lead text-on-dark"` shows the lead's color instead of white.
*Fix:* Always prefix color utilities with `.reveal`: use `.reveal .text-on-dark`, `.reveal .text-muted`, `.reveal .highlight-1`, etc.

**Missing Margin Reset on Stats**
Stats and stat-hero elements inherit `margin-bottom` from `.reveal p`, creating unwanted gaps.
*Fix:* Add `margin-bottom: 0` to `.reveal .stat` and `.reveal .stat-hero` rules.

**Section Background Override**
Adding `background` to `.reveal .slides section` blocks `data-background-color` from showing.
*Problem:* RevealJS applies `data-background-color` behind the section element. If the section has an opaque background, the color is hidden behind a white/colored box.
*Fix:* Never set `background` on `.reveal .slides section`. Set overall page background on `.reveal` only. Use `data-background-color` on individual sections for colored backgrounds.

---

## Part 8: Speaker Notes

### 8.1 RevealJS Notes Syntax

Speaker notes are added inside an `<aside>` element with class `notes`:

```html
<section>
  <h2>Slide Headline</h2>
  <div class="bar"></div>
  <p class="lead">Visible content here</p>
  
  <aside class="notes">
    Speaker notes go here. These are visible in speaker view (press 'S')
    but not shown to the audience.
    
    Multiple paragraphs work fine.
  </aside>
</section>
```

Access speaker view by pressing `S` during presentation. Opens a new window with current slide, next slide, notes, and timer.

### 8.2 Notes for TTS/Video Recording

When notes will be read by TTS or recorded as voiceover, structure them for spoken delivery:

**Pacing markers:**
```html
<aside class="notes">
This is the opening statement. [PAUSE]

Now we transition to the key insight. [PAUSE]

The data speaks for itself—forty-three percent improvement.
</aside>
```

**Pronunciation hints** (for TTS or unfamiliar terms):
```html
<aside class="notes">
The API uses OAuth (OH-auth) for authentication.

Results show a 50% improvement in MTTR (mean time to recovery, 
or "em-tee-tee-arr" if using the acronym).
</aside>
```

**Emphasis markers** (for recording, stripped for TTS):
```html
<aside class="notes">
This is [EMPHASIS: critical] to understand before we proceed.

We saw not ten, not twenty, but [EMPHASIS: fifty] percent gains.
</aside>
```

### 8.3 Timing and Word Count

Speaking pace reference:
- Slow/deliberate: ~120 words per minute
- Conversational: ~150 words per minute  
- Energetic: ~170 words per minute

**Per-slide timing targets:**

| Slide Type | Target Duration | Word Count (150 wpm) |
|------------|-----------------|----------------------|
| Title | 15-30 sec | 40-75 words |
| Section Break | 10-20 sec | 25-50 words |
| Single Word/Phrase | 10-15 sec | 25-40 words |
| Hero Stat | 20-40 sec | 50-100 words |
| Standard Stat | 15-30 sec | 40-75 words |
| Assertion + Evidence | 45-90 sec | 110-225 words |
| Card Grid | 60-120 sec | 150-300 words |
| Timeline | 60-90 sec | 150-225 words |
| Closing | 30-60 sec | 75-150 words |

Total presentation timing: sum of slide durations, plus ~10% buffer for transitions.

### 8.4 Speech-to-Slides Workflow

When starting with a written speech and decomposing into slides:

**Step 1: Identify assertion boundaries**

Mark every place the speech makes a distinct claim or shifts topic. Each becomes a slide candidate.

```
[SLIDE] Our platform reduces development time significantly.
We measured teams before and after adoption. [SLIDE] The data 
showed a 50% reduction in time-to-deployment. [SLIDE] But 
speed isn't the only benefit...
```

**Step 2: Classify each segment**

For each marked segment, identify the slide type:
- Is it a single key number? → Stat slide
- Is it a claim with supporting detail? → Assertion + Evidence
- Is it a transition between topics? → Section Break or Breath Slide
- Is it listing multiple items? → Card Grid (if 2-4) or split further

**Step 3: Extract visual content**

From each segment, pull out:
- **Headline**: The core assertion (one sentence max)
- **Visual need**: What image/chart/diagram supports this?
- **Notes**: The remaining spoken content

**Step 4: Balance visual and spoken**

The slide shows what's hard to say. The notes say what's hard to show.

| On Slide | In Notes |
|----------|----------|
| "Development time dropped 50%" | "When we measured twelve teams over six months, comparing their velocity before and after platform adoption, the results were consistent..." |
| [Bar chart showing reduction] | "Notice how the improvement was immediate—within the first sprint—and sustained over the full period." |
| Key data points | Context, caveats, methodology |
| Conclusions | Reasoning process |

### 8.5 Slides-to-Speech Workflow

When generating speaker notes for existing slides:

**For each slide, answer:**
1. What context does the audience need that isn't on screen?
2. What's the transition from the previous slide?
3. What interpretation or insight accompanies the visual?
4. What's the bridge to the next slide?

**Structure for each note:**

```html
<aside class="notes">
[TRANSITION: How this connects to previous slide]

[MAIN CONTENT: The spoken explanation, context, story]

[BRIDGE: Setup for what comes next]
</aside>
```

**Example:**

```html
<section class="centered">
  <p class="label">Key Metric</p>
  <p class="stat text-accent-1">50%</p>
  <p class="stat-label">reduction in development time</p>
  
  <aside class="notes">
So what did we actually measure? [PAUSE]

We tracked twelve teams over six months—half using the platform, 
half using their existing workflows. Same project types, same 
skill levels.

The platform teams shipped in half the time. Not by cutting 
corners—their defect rates actually improved. They shipped 
faster AND better.

But speed is just one dimension. Let's look at what happened 
to those prototypes that used to die in pilot purgatory...
  </aside>
</section>
```

### 8.6 Notes Formatting for Different Outputs

**For live presentation (speaker view):**
- Full sentences, natural paragraphs
- Reminder cues: "[CHECK TIME]", "[DEMO HERE]", "[ASK AUDIENCE]"
- Key stats/names you might forget under pressure

**For TTS processing:**
- No brackets except pacing markers [PAUSE]
- Numbers written as words for correct pronunciation: "fifty percent" not "50%"
- Acronyms expanded or pronunciation-guided on first use
- Shorter sentences (easier for TTS phrasing)

**For video recording script:**
- Include all spoken content verbatim
- Mark emphasis and pacing
- Note where to look (at camera, at screen)
- Include timing targets per slide

### 8.7 Enabling Speaker Notes Plugin

Speaker notes work by default, but for the separate speaker view window:

```javascript
Reveal.initialize({
  // ... other config
  
  // Optional: configure notes behavior
  showNotes: false,  // Don't show notes in main view (default)
  
  // For speaker view keyboard shortcut
  keyboard: {
    83: function() { Reveal.toggleOverview(); }  // 'S' key
  }
});
```

To enable the separate speaker notes window with timer and preview, press `S` during presentation. This requires the presentation to be served over HTTP (not just opened as a local file) for the popup window to work in most browsers.

### 8.8 Notes Anti-Patterns

**The Script Dump**  
Pasting entire paragraphs meant to be read verbatim, creating dependency on notes.  
*Fix:* Notes should be prompts and context, not a teleprompter script (unless explicitly for TTS).

**The Bare Minimum**  
Notes that just repeat what's on the slide: "Talk about the 50% reduction."  
*Fix:* Notes add what's NOT on the slide—context, transitions, interpretation.

**The Forgetter**  
No notes at all, assuming you'll remember.  
*Fix:* At minimum, note the transition logic between slides and any stats you might misremember.

**The Novelist**  
500 words of notes for a slide you'll show for 30 seconds.  
*Fix:* Match note length to slide duration. See timing table above.

---

## Part 9: Pre-Flight Checklist

Before delivering the presentation:

### Structure
- [ ] Main message clear within first 2 slides
- [ ] One concept per slide throughout
- [ ] Section breaks between major topics
- [ ] Closing has clear call to action

### Content
- [ ] No slide exceeds word count limits
- [ ] Assertion-evidence structure used (not bullet lists)
- [ ] Stats have context (labels, comparisons)
- [ ] No orphan slides (single slide sections)

### Visual
- [ ] Consistent use of color accents
- [ ] Typography hierarchy clear
- [ ] No text smaller than `--size-small`
- [ ] Images high enough resolution

### Speaker Notes
- [ ] Every slide has notes (even if brief)
- [ ] Transitions between slides noted
- [ ] Key stats/names included as memory aids
- [ ] Total word count matches target duration
- [ ] If TTS: numbers written as words, acronyms handled
- [ ] If video: timing targets per slide noted

### Technical
- [ ] All fonts load (Google Fonts links correct)
- [ ] RevealJS initializes without errors
- [ ] Works at multiple viewport sizes
- [ ] Fragment animations work as expected
- [ ] Speaker view opens correctly (press 'S')

### Accessibility
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Alt text on meaningful images
- [ ] Text not embedded in images
- [ ] Readable without animations

---

## Complete Example: Minimal Presentation

This example shows a minimal presentation structure. For full presentations, use the complete CSS from `themes/bold.md`. This example uses a subset for brevity.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Update</title>
  
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/theme/white.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@100;200;300;400;500;600;700;800&display=swap" rel="stylesheet">
  
  <style>
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f5f5f7;
      --bg-dark: #1a1a2e;
      --text-primary: #1a1a1a;
      --text-secondary: #4a4a4a;
      --text-muted: #7a7a7a;
      --text-on-dark: #ffffff;
      --accent-1: #0066cc;
      --accent-2: #00a86b;
      --font-display: 'Space Grotesk', sans-serif;
      --font-body: 'Inter', sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
      --size-stat: clamp(4rem, 10vw, 8rem);
      --size-h1: clamp(6rem, 8vw, 9rem);
      --size-h2: clamp(4rem, 12vw, 7rem);
      --size-body: clamp(1.25rem, 2vw, 2rem);
      --size-body-lg: clamp(1.5rem, 2.5vw, 2.25rem);
      --size-label: clamp(1.5rem, 2.5vw, 2.25rem);
      --space-sm: 1rem;
      --space-md: 2rem;
      --bar-width: 120px;
      --bar-height: 8px;
    }

    .reveal { font-family: var(--font-body); color: var(--text-primary); }
    .reveal h1, .reveal h2 { font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; margin: 0 0 0.5em 0; }
    .reveal h1 { font-size: var(--size-h1); }
    .reveal h2 { font-size: var(--size-h2); }
    .reveal p { font-size: var(--size-body); line-height: 1.5; margin: 0 0 1em 0; }
    .reveal .slides section { text-align: left; padding: 60px; }
    .reveal .slides section.centered { text-align: center; }

    .reveal .label { font-family: var(--font-mono); font-size: var(--size-label); text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent-1); }
    .reveal .lead { font-size: var(--size-body-lg); color: var(--text-secondary); }
    .bar { width: var(--bar-width); height: var(--bar-height); background: var(--accent-1); margin-bottom: var(--space-md); }
    .centered .bar { margin-left: auto; margin-right: auto; }
    .reveal .stat { font-family: var(--font-mono); font-size: var(--size-stat); font-weight: 700; line-height: 1; color: var(--accent-1); margin-bottom: 0; }
    .reveal .stat-label { font-size: var(--size-body-lg); color: var(--text-secondary); margin-top: var(--space-sm); }
    .text-on-dark { color: var(--text-on-dark); }
  </style>
</head>
<body>
  <div class="reveal">
    <div class="slides">
      
      <!-- Title -->
      <section class="centered">
        <p class="label">Q3 Update</p>
        <h1>Project Alpha</h1>
        <div class="bar"></div>
        <p class="lead">Engineering Progress Report</p>
        
        <aside class="notes">
Good morning everyone. Today I'll walk you through where we stand 
on Project Alpha as we close out Q3.

We've got good news to share, and a clear path to our October 
target. Let's start with the results.
        </aside>
      </section>
      
      <!-- Section Break -->
      <section class="centered" data-background-color="#1a1a2e">
        <h1 class="text-on-dark">Results</h1>
        
        <aside class="notes">
[PAUSE for transition]

So—where do we actually stand?
        </aside>
      </section>
      
      <!-- Stat -->
      <section class="centered">
        <p class="label">Key Metric</p>
        <p class="stat">73%</p>
        <p class="stat-label">milestone completion rate</p>
        
        <aside class="notes">
Seventy-three percent of our planned milestones are complete. 
That's ahead of where we projected in the Q2 review.

More importantly, the remaining twenty-seven percent are all 
in active development—no blockers, no unknowns.
        </aside>
      </section>
      
      <!-- Content -->
      <section>
        <h2>On track for October launch</h2>
        <div class="bar"></div>
        <p class="lead">Core features complete. Final testing phase begins next week.</p>
        
        <aside class="notes">
What does this mean for the timeline? We're green for October.

Core features locked last Friday. The team is now focused 
entirely on hardening—edge cases, performance tuning, and 
the integration test suite.

Testing phase kicks off Monday. We'll have preliminary 
results by end of next week.
        </aside>
      </section>
      
      <!-- Closing -->
      <section class="centered" data-background-color="#1a1a2e">
        <h1 class="text-on-dark">Questions?</h1>
        <div class="bar" style="background: var(--accent-2);"></div>
        <p class="text-on-dark">team@example.com</p>
        
        <aside class="notes">
That's the summary. Happy to dig into any area—timeline, 
technical details, resource allocation.

What questions do you have?

[WAIT FOR QUESTIONS]

If anything comes up later, reach out to the team alias.
        </aside>
      </section>
      
    </div>
  </div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.min.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      center: true,
      transition: 'fade',
      transitionSpeed: 'fast',
      width: 1920,
      height: 1080,
      margin: 0.08
    });
  </script>
</body>
</html>
```

---

## Appendix: Creating Custom Themes

To create a custom theme:

1. Copy `themes/bold.md` to a new file (e.g., `themes/corporate.md`)
2. Modify the CSS variables to match your brand:

```css
:root {
  /* Corporate theme example */
  --bg-primary: #ffffff;
  --bg-dark: #003B5C;
  --accent-1: #00A3E0;
  --accent-2: #78BE20;
  --accent-3: #D45D00;
  --font-display: 'Libre Franklin', sans-serif;
}
```

3. Add your theme to the Available Themes table in Part 2.3
4. Reference your theme when generating presentations

Theme files should include all CSS variables and typography rules needed for a complete presentation.