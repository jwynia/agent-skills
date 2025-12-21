# Research Domain

Skills for web research, information gathering, and knowledge synthesis.

## Purpose

The research domain contains skills that help agents:
- Search the web for current information
- Conduct structured research on topics
- Evaluate source credibility
- Synthesize findings into useful outputs

## Skills in This Domain

### Search Category

| Skill | Status | Description |
|-------|--------|-------------|
| [web-search](web-search.md) | Complete | Web search using Tavily API |

### Workflow Category

| Skill | Status | Description |
|-------|--------|-------------|
| [research-workflow](research-workflow.md) | Complete | Structured research methodology |

## Quick Stats

- **Total Skills**: 2
- **Complete**: 2
- **In Progress**: 0
- **Planning**: 0

## Skill Locations

| Skill | Path |
|-------|------|
| web-search | `skills/research/search/web-search/` |
| research-workflow | `skills/research/workflow/research-workflow/` |

## Dependencies

- **web-search**: Requires `TAVILY_API_KEY` environment variable
- **research-workflow**: Uses web-search skill (or similar) for search execution

## Future Considerations

Potential future skills in this domain:
- Source archiving/caching
- Citation management
- Research organization/tagging
- Multi-source aggregation

## Metadata

- **Created**: 2025-12-20
- **Last Updated**: 2025-12-20
- **Updated By**: Claude
