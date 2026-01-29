# glossary.md Template

Define project-specific vocabulary. Prevents agents from guessing at term meanings.

---

```markdown
# Glossary

Project-specific terms, abbreviations, and conventions.

## Terms

### {{Term}}
{{Definition. What this means in the context of this project.}}

**Also known as:** {{aliases, abbreviations}}
**Not to be confused with:** {{similar terms that mean different things}}
**See also:** {{related terms, links to context}}

---

### {{Another Term}}
{{Definition}}

---

## Abbreviations

| Abbrev | Expansion | Notes |
|--------|-----------|-------|
| {{ABC}} | {{Full Name}} | {{When/where used}} |

---

## Conventions

### Naming Conventions

- **Files:** {{pattern, e.g., kebab-case}}
- **Functions:** {{pattern}}
- **Variables:** {{pattern}}
- **Branches:** {{pattern, e.g., feature/ABC-123-description}}

### Code Conventions

- {{Convention 1: what and why}}
- {{Convention 2}}

---

## Domain-Specific Vocabulary

### {{Domain Name}}

| Term | Meaning |
|------|---------|
| {{term}} | {{meaning in this domain}} |
```

---

## Usage Notes

- **Add terms as confusion arises**: Don't pre-populate exhaustively. Add when you notice agents or humans confused.
- **Context matters**: Same term may mean different things in different domains—capture that.
- **Link to sources**: For external/standard terms, link to authoritative definitions.
- **Conventions section**: Especially important for agents—explicit patterns prevent guessing.
