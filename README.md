# Agent Skills Collection

**108 reusable [Agent Skills](https://agentskills.io)** for AI coding assistants. Each skill provides specialized knowledge and workflows that extend agent capabilities.

## Installing Skills

Use `npx skills add` to install skills:

### Browse by Category

Skills are organized into three top-level categories for easy filtering:

```bash
# Creative/narrative skills (~58 skills)
npx skills add https://github.com/jwynia/agent-skills/tree/main/skills/creative

# Technical/development skills (~23 skills)
npx skills add https://github.com/jwynia/agent-skills/tree/main/skills/tech

# General utilities (~25 skills)
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

## Available Skills (108 total)

### Creative (~58 skills)
Story/narrative focused skills for fiction writing, worldbuilding, and creative work.

#### Fiction (54)
Core storytelling, worldbuilding, character development, and narrative structure:
- **story-sense** - Diagnose story problems
- **story-coach** - Assistive writing guidance
- **story-collaborator** - Active writing partnership
- **worldbuilding** - World-level story diagnostics
- **character-arc** - Character transformation design
- **dialogue** - Dialogue diagnostics
- **scene-sequencing** - Pacing and scene structure
- **prose-style** - Sentence-level craft
- **revision** - Edit pass guidance
- **endings** - Resolution diagnostics
- And 44 more specialized fiction skills...

#### Humor (1)
- **joke-engineering** - Humor diagnostics and improvement

#### Music (2)
- **lyric-diagnostic** - Song lyric analysis and improvement
- **musical-dna** - Extract musical characteristics from artists

---

### Tech (~25 skills)
Technical and development focused skills.

#### AI (1)
- **mastra-hono** - Mastra AI framework with Hono integration

#### Development (12)
- **agile-coordinator** - Multi-agent task orchestration (git-only, platform-agnostic)
- **agile-workflow** - Agile development workflow (git-only, platform-agnostic)
- **architecture-decision** - ADR creation and trade-off analysis
- **code-review** - Structured code review guidance
- **devcontainer** - Development container configuration
- **gitea-coordinator** - Multi-agent task orchestration for Gitea
- **gitea-workflow** - Agile workflow for Gitea with tea CLI
- **github-agile** - GitHub-driven agile workflows
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

### General (~25 skills)
Universal utility skills for research, documents, and productivity.

#### Analysis (1)
- **technology-impact** - McLuhan's Tetrad analysis for technology impacts

#### Communication (2)
- **presentation-design** - Design effective presentations and slides
- **speech-adaptation** - Transform written content for spoken delivery

#### Document Processing (6)
- **docx-generator** - Word document generation
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
skills/                          # 106 skills in 3 top-level categories
├── creative/                    # ~58 skills - Story/narrative focus
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
├── tech/                        # ~25 skills - Technical/development
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
└── general/                     # ~25 skills - Universal utilities
    ├── analysis/
    ├── communication/
    ├── document-processing/
    │   ├── analysis/
    │   ├── pdf/
    │   ├── presentation/
    │   ├── spreadsheet/
    │   └── word/
    ├── education/
    ├── ideation/
    ├── meta/
    ├── productivity/
    ├── research/
    │   ├── methodology/
    │   ├── tools/
    │   └── verification/
    └── writing/
        ├── analysis/
        └── revision/

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
