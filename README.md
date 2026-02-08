# Agent Skills Collection

**112 reusable [Agent Skills](https://agentskills.io)** for AI coding assistants. Each skill provides specialized knowledge and workflows that extend agent capabilities.

## Installing Skills

Use `npx skills add` to install skills:

### Browse by Category

Skills are organized into three top-level categories for easy filtering:

```bash
# Creative/narrative skills (~57 skills)
npx skills add https://github.com/jwynia/agent-skills/tree/main/skills/creative

# Technical/development skills (~26 skills)
npx skills add https://github.com/jwynia/agent-skills/tree/main/skills/tech

# General utilities (~29 skills)
npx skills add https://github.com/jwynia/agent-skills/tree/main/skills/general
```

### Install a Single Skill

```bash
npx skills add https://github.com/jwynia/agent-skills/tree/main/skills/general/meta/skill-builder
```

### Browse All Skills

```bash
npx skills add https://github.com/jwynia/agent-skills/tree/main/skills
```

## Available Skills (112 total)

### Creative (57 skills)
Story/narrative focused skills for fiction writing, worldbuilding, and creative work.

#### Fiction - Core & Craft (10)
Core diagnostics, writing partnerships, and sentence-level craft:
- **story-sense** - Diagnose what any story needs regardless of current state
- **story-coach** - Assistive writing guidance (guides but never writes)
- **story-collaborator** - Active writing partnership (contributes prose alongside writer)
- **story-analysis** - Systematically evaluate completed stories or chapters
- **story-idea-generator** - Genre-first story concept generation
- **prose-style** - Sentence-level craft diagnostics
- **revision** - Edit pass guidance when revision feels overwhelming
- **drafting** - First draft execution and block-breaking
- **cliche-transcendence** - Transform predictable story elements into fresh versions
- **genre-conventions** - Genre diagnostics and genre-specific element generation

#### Fiction - Character (6)
Character development, dialogue, and distinctive character creation:
- **character-arc** - Character transformation arc design and troubleshooting
- **character-naming** - Break LLM name defaults with external entropy
- **dialogue** - Dialogue diagnostics for flat or same-voice characters
- **memetic-depth** - Create perception of cultural depth through juxtaposition
- **statistical-distance** - Transform clichéd elements by pushing toward statistical edges
- **underdog-unit** - Stories about institutional outcasts given impossible mandates

#### Fiction - Structure (12)
Pacing, scene structure, outlines, and multi-level story management:
- **scene-sequencing** - Pacing and scene-sequel rhythm
- **endings** - Resolution diagnostics for weak or rushed endings
- **key-moments** - Structure stories around essential emotional moments
- **story-zoom** - Multi-level story synchronization across abstraction levels
- **outline-coach** - Assistive outline coaching through questions
- **outline-collaborator** - Active outline partnership
- **reverse-outliner** - Reverse-engineer published books into structured outlines
- **novel-revision** - Multi-level novel revision without cascade problems
- **identity-denial** - Stories about protagonists refusing self-transformation
- **moral-parallax** - Stories about systemic exploitation and moral distance
- **perspectival-constellation** - Multi-POV stories through catalyst environments
- **positional-revelation** - Stories about ordinary people becoming crucial through position

#### Fiction - Worldbuilding (11)
World-level systems, cultures, languages, and shared continuity:
- **worldbuilding** - World-level story diagnostics
- **systemic-worldbuilding** - Cascading consequences from speculative changes
- **oblique-worldbuilding** - Worldbuilding quotes and epigraphs via documentary perspectives
- **belief-systems** - Religious and belief system design
- **economic-systems** - Currencies, trade networks, and resource economies
- **governance-systems** - Political entities and governance structures
- **settlement-design** - Cities, towns, and settlement design
- **conlang** - Phonologically consistent constructed languages
- **language-evolution** - Evolving language systems and linguistic history
- **metabolic-cultures** - Cultures for closed-loop life support systems
- **world-fates** - Long-term fate and fortune across shared worlds

#### Fiction - Application (14)
Specialized generators, adaptation tools, and applied storytelling:
- **adaptation-synthesis** - Synthesize new works from extracted functional DNA
- **dna-extraction** - Extract functional DNA from existing works (TV, film, books)
- **media-adaptation** - Analyze existing media for transferable elements
- **book-marketing** - Marketing copy diagnostics and platform-optimized blurbs
- **chapter-drafter** - Autonomous chapter drafting with multi-skill editorial passes
- **flash-fiction** - Flash fiction and micro fiction diagnostics
- **interactive-fiction** - Branching narrative diagnostics
- **game-facilitator** - Narrative RPG game master for collaborative storytelling
- **table-tone** - Tonal delivery calibration for tabletop RPG sessions
- **list-builder** - Comprehensive randomization lists for creative entropy
- **multi-order-evolution** - Multi-generational societal evolution for sci-fi
- **paradox-fables** - Fables embodying paradoxical wisdom
- **sensitivity-check** - Representation evaluation and harm flagging
- **shared-world** - Wiki-style world bible for collaborative fiction
- **sleep-story** - Stories designed to help listeners fall asleep

#### Humor (1)
- **joke-engineering** - Humor diagnostics and improvement

#### Music (2)
- **lyric-diagnostic** - Song lyric analysis and improvement
- **musical-dna** - Extract musical characteristics from artists

---

### Tech (26 skills)
Technical and development focused skills.

#### AI (1)
- **mastra-hono** - Mastra AI framework with Hono integration

#### Development (14)
- **agile-coordinator** - Multi-agent task orchestration (git-only, platform-agnostic)
- **agile-workflow** - Agile development workflow (git-only, platform-agnostic)
- **architecture-decision** - ADR creation and trade-off analysis
- **code-review** - Structured code review guidance
- **devcontainer** - Development container configuration
- **electron-best-practices** - Electron + React desktop app development best practices
- **gitea-coordinator** - Multi-agent task orchestration for Gitea
- **gitea-workflow** - Agile workflow for Gitea with tea CLI
- **github-agile** - GitHub-driven agile workflows
- **product-analysis** - Competitive product analysis and market evaluation
- **requirements-analysis** - Requirements discovery and documentation
- **system-design** - Software architecture and design
- **task-decomposition** - Break down development tasks
- **typescript-best-practices** - TypeScript patterns and practices

#### Frontend (4)
- **frontend-design** - UI/UX design patterns
- **pwa-development** - PWA implementation (React/Svelte)
- **react-pwa** - Progressive Web Apps with React
- **shadcn-layouts** - Tailwind/shadcn layout patterns

#### Game Development (3)
- **abstract-strategy** - Board game design
- **godot-asset-generator** - AI asset generation for Godot
- **godot-best-practices** - Godot engine best practices

#### Security (4)
- **config-scan** - Configuration security scanning
- **dependency-scan** - Dependency vulnerability scanning
- **secrets-scan** - Secrets detection
- **security-scan** - General security scanning

---

### General (29 skills)
Universal utility skills for research, documents, and productivity.

#### Analysis (1)
- **technology-impact** - McLuhan's Tetrad analysis for technology impacts

#### Communication (2)
- **presentation-design** - Design effective presentations and slides
- **speech-adaptation** - Transform written content for spoken delivery

#### Document Processing (7)
- **docx-generator** - Word document generation
- **document-to-narration** - Convert documents to narrated video scripts with TTS audio
- **ebook-analysis** - Parse ebooks and extract concepts
- **pdf-generator** - PDF document generation
- **pptx-generator** - PowerPoint presentation generation
- **revealjs-presenter** - RevealJS presentation generation
- **xlsx-generator** - Excel spreadsheet generation

#### Education (2)
- **competency** - Competency framework development
- **gentle-teaching** - AI-assisted learning guidance

#### Ideation (2)
- **brainstorming** - Idea expansion and divergent thinking
- **naming** - Brand, product, and character naming

#### Meta (3)
- **context-network** - Build and maintain context networks
- **context-retrospective** - Analyze agent interactions for improvements
- **skill-builder** - Create new agent skills

#### Productivity (1)
- **task-breakdown** - Neurodivergent-friendly task decomposition

#### Research (7)
- **claim-investigation** - Investigate social media claims
- **fact-check** - Verify claims against sources
- **media-meta-analysis** - Media analysis methodology
- **research** - Research quality diagnostics
- **research-workflow** - Structured research methodology
- **web-search** - Built-in web search (no API key required)
- **web-search-tavily** - Advanced Tavily search with filtering and scoring

#### Writing (4)
- **blind-spot-detective** - Identify gaps in non-fiction writing
- **non-fiction-revision** - Non-fiction book revision
- **summarization** - Effective summarization techniques
- **voice-analysis** - Extract and document writing voice

## Project Structure

```
skills/                          # 112 skills in main tree
├── creative/                    # 57 skills - Story/narrative focus
│   ├── fiction/                 # 54 skills
│   │   ├── application/
│   │   ├── character/
│   │   ├── core/
│   │   ├── craft/
│   │   ├── orchestrators/
│   │   ├── structure/
│   │   └── worldbuilding/
│   ├── humor/
│   └── music/
│
├── tech/                        # 25 skills - Technical/development
│   ├── ai/
│   ├── development/
│   │   ├── architecture/
│   │   ├── quality/
│   │   ├── tooling/
│   │   └── workflow/
│   ├── frontend/
│   │   ├── design/
│   │   └── pwa/
│   ├── game-development/
│   │   ├── design/
│   │   └── godot/
│   └── security/
│
├── general/                     # 28 skills - Universal utilities
│   ├── analysis/
│   ├── communication/
│   ├── document-processing/
│   │   ├── analysis/
│   │   ├── pdf/
│   │   ├── presentation/
│   │   ├── spreadsheet/
│   │   └── word/
│   ├── education/
│   ├── ideation/
│   ├── meta/
│   ├── productivity/
│   ├── research/
│   │   ├── methodology/
│   │   ├── tools/
│   │   └── verification/
│   └── writing/
│       ├── analysis/
│       └── revision/
│
├── development/                 # 1 skill - Standalone development
│   └── architecture/
│
└── education/                   # 1 skill - Standalone education

reference/                       # agentskills.io spec and validation tools
context-network/                 # Planning and coordination docs
```

## Contributing

See `context-network/processes/creation.md` for the skill creation workflow.

Quick start:
1. Plan in `context-network/elements/skills/`
2. Create skill in `skills/[creative|tech|general]/[domain]/[skill-name]/`
3. Validate with `skills-ref validate ./skills/path/to/skill`

## References

- [Agent Skills Specification](https://agentskills.io)
- [skills-ref Validation Tool](reference/agentskills/skills-ref/)
