# Agent Skills Collection

**105 reusable [Agent Skills](https://agentskills.io)** for AI coding assistants. Each skill provides specialized knowledge and workflows that extend agent capabilities.

## Installing Skills

Use `npx add-skill` to install skills into your project:

### Install a Single Skill

```bash
npx add-skill https://github.com/jwynia/agent-skills/tree/main/skills/development/skill-maker
```

### Browse a Category

Point to a folder to choose from available skills:

```bash
npx add-skill https://github.com/jwynia/agent-skills/tree/main/skills/development
```

### Browse All Skills

```bash
npx add-skill https://github.com/jwynia/agent-skills/tree/main/skills
```

## Available Skills (105 total)

### AI (1)
- **mastra-hono** - Mastra AI framework with Hono integration

### Analysis (1)
- **technology-impact** - McLuhan's Tetrad analysis for technology impacts

### Communication (2)
- **presentation-design** - Design effective presentations and slides
- **speech-adaptation** - Transform written content for spoken delivery

### Creative (3)
- **joke-engineering** - Humor diagnostics and improvement
- **lyric-diagnostic** - Song lyric analysis and improvement
- **musical-dna** - Extract musical characteristics from artists

### Development (10)
- **agile-workflow** - Agile development methodology
- **architecture-decision** - ADR creation and trade-off analysis
- **code-review** - Structured code review guidance
- **devcontainer** - Development container configuration
- **github-agile** - GitHub-driven agile workflows
- **requirements-analysis** - Requirements discovery and documentation
- **skill-maker** - Create new agent skills
- **system-design** - Software architecture and design
- **task-decomposition** - Break down development tasks
- **typescript-best-practices** - TypeScript patterns and practices

### Document Processing (5)
- **docx-generator** - Word document generation
- **ebook-analysis** - Parse ebooks and extract concepts
- **pdf-generator** - PDF document generation
- **pptx-generator** - PowerPoint presentation generation
- **xlsx-generator** - Excel spreadsheet generation

### Education (2)
- **competency** - Competency framework development
- **gentle-teaching** - AI-assisted learning guidance

### Fiction (54)
Core storytelling, worldbuilding, character development, and narrative structure skills:
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

### Frontend (4)
- **frontend-design** - UI/UX design patterns
- **pwa-development** - PWA implementation (React/Svelte)
- **react-pwa** - Progressive Web Apps with React
- **shadcn-layouts** - Tailwind/shadcn layout patterns

### Game Development (3)
- **abstract-strategy** - Board game design
- **godot-asset-generator** - AI asset generation for Godot
- **godot-best-practices** - Godot engine best practices

### Ideation (2)
- **brainstorming** - Idea expansion and divergent thinking
- **naming** - Brand, product, and character naming

### Meta (3)
- **context-network** - Build and maintain context networks
- **context-retrospective** - Analyze agent interactions for improvements
- **skill-builder** - Create new agent skills

### Productivity (1)
- **task-breakdown** - Neurodivergent-friendly task decomposition

### Research (6)
- **claim-investigation** - Investigate social media claims
- **fact-check** - Verify claims against sources
- **media-meta-analysis** - Media analysis methodology
- **research** - Research quality diagnostics
- **research-workflow** - Structured research methodology
- **web-search** - Tavily web search integration

### Security (4)
- **config-scan** - Configuration security scanning
- **dependency-scan** - Dependency vulnerability scanning
- **secrets-scan** - Secrets detection
- **security-scan** - General security scanning

### Writing (4)
- **blind-spot-detective** - Identify gaps in non-fiction writing
- **non-fiction-revision** - Non-fiction book revision
- **summarization** - Effective summarization techniques
- **voice-analysis** - Extract and document writing voice

## Project Structure

```
skills/              # 105 skills organized by domain (16 domains)
reference/           # agentskills.io spec and validation tools
context-network/     # Planning and coordination docs
```

## Contributing

See `context-network/processes/creation.md` for the skill creation workflow.

Quick start:
1. Plan in `context-network/elements/skills/`
2. Create skill in `skills/[domain]/[skill-name]/`
3. Validate with `skills-ref validate ./skills/path/to/skill`

## References

- [Agent Skills Specification](https://agentskills.io)
- [skills-ref Validation Tool](reference/agentskills/skills-ref/)
