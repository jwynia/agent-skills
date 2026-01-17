# Node Template

Standard format for context network information nodes. Use for domain-specific documentation.

---

```markdown
# {{Node Title}}

## Purpose

{{Why this node exists. What question does it answer? 1-2 sentences.}}

## Classification

- **Domain:** {{Primary knowledge area: Frontend, Backend, Design, etc.}}
- **Stability:** {{Static | Semi-stable | Dynamic}}
- **Abstraction:** {{Conceptual | Structural | Detailed}}
- **Confidence:** {{Established | Evolving | Speculative}}

## Content

{{Primary information. Organize appropriately for the content type.}}

### {{Subsection if needed}}

{{Details}}

## Relationships

### Parent Nodes
- {{Link to broader context}}

### Related Nodes
- {{Link}} - {{relationship type}} - {{brief description}}
- {{Link}} - depends-on - {{what dependency exists}}
- {{Link}} - impacts - {{what this affects}}

### Child Nodes
- {{Link to more specific details}}

## Navigation

**When to access this node:**
- {{Scenario 1}}
- {{Scenario 2}}

**Common next steps:**
- {{Where to go from here}}

**Related tasks:**
- {{What work involves this node}}

---

## Metadata

- **Created:** {{date}}
- **Last Updated:** {{date}}
- **Updated By:** {{agent/person}}

## Change History

- {{date}}: {{what changed}}
```

---

## Usage Notes

### Classification Values

**Stability:**
- **Static**: Fundamental principles, unlikely to change
- **Semi-stable**: Established patterns, evolve gradually
- **Dynamic**: Frequently changing information

**Abstraction:**
- **Conceptual**: High-level ideas and principles
- **Structural**: Organizational patterns and frameworks
- **Detailed**: Specific implementations and examples

**Confidence:**
- **Established**: Verified, reliable
- **Evolving**: Partially validated, subject to refinement
- **Speculative**: Exploratory, requires validation

### Relationship Types

Use consistent vocabulary:
- `depends-on`: This node requires the target
- `implements`: Concrete implementation of target concept
- `extends`: Builds upon target
- `contradicts`: Presents opposing view
- `complements`: Works alongside target
- `impacts`: Changes here affect target
- `interfaces-with`: Connects across domain boundaries

### When to Create a Node

Create a new node when:
- Information doesn't fit existing nodes
- Topic deserves dedicated navigation entry
- Multiple other nodes reference this concept

Don't create a node when:
- Information fits as a section in existing node
- Content is too thin to stand alone
- Better as entry in glossary
