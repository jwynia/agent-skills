# Agent Skills Collection

Reusable [Agent Skills](https://agentskills.io) for AI coding assistants. Each skill provides specialized knowledge and workflows that extend agent capabilities.

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

## Available Skills

### AI
- **mastra-hono** - Mastra AI framework with Hono integration

### Development
- **agile-workflow** - Agile development methodology
- **skill-maker** - Create new agent skills
- **typescript-best-practices** - TypeScript patterns and practices

### Document Processing
- **docx-generator** - Word document generation
- **pdf-generator** - PDF document generation
- **pptx-generator** - PowerPoint presentation generation
- **xlsx-generator** - Excel spreadsheet generation

### Frontend
- **frontend-design** - UI/UX design patterns
- **react-pwa** - Progressive Web Apps with React

### Game Development
- **godot-asset-generator** - AI asset generation for Godot
- **godot-best-practices** - Godot engine best practices

### Research
- **research-workflow** - Structured research methodology
- **web-search** - Web search integration

### Security
- **config-scan** - Configuration security scanning
- **dependency-scan** - Dependency vulnerability scanning
- **secrets-scan** - Secrets detection
- **security-scan** - General security scanning

## Project Structure

- **skills/** - Skill folders organized by domain
- **reference/agentskills/** - Official specification and validation tools
- **context-network/** - Planning and coordination docs

## Contributing

See `context-network/processes/creation.md` for the skill creation workflow.

Quick start:
1. Plan in `context-network/elements/skills/`
2. Create skill in `skills/[domain]/[category]/[skill-name]/`
3. Validate with `skills-ref validate ./skills/path/to/skill`

## References

- [Agent Skills Specification](https://agentskills.io)
- [skills-ref Validation Tool](reference/agentskills/skills-ref/)
