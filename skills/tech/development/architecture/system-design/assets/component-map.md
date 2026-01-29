# Component Map: [Project Name]

## Overview

[One paragraph: what does the system do and how is it organized?]

## Components

### [Component Name]

**Responsibility:** [Single sentence - what this component does. One responsibility only.]
**Depends on:** [Other components this needs]
**Provides to:** [What other components need from this]
**Key decisions:** [ADR references if any]

### [Component Name]

**Responsibility:**
**Depends on:**
**Provides to:**
**Key decisions:**

### [Component Name]

**Responsibility:**
**Depends on:**
**Provides to:**
**Key decisions:**

## Data Flow

[Describe how data moves through the system. Can be prose or simple diagram.]

```
[Input] → [Component A] → [Component B] → [Output]
              ↓
         [Component C]
```

**Entry points:** [Where does data enter the system?]
**Exit points:** [Where does data leave the system?]
**Persistence:** [Where is data stored, if anywhere?]

## External Integrations

| External System | What We Need From It | What We Provide | Risk/Failure Mode |
|-----------------|---------------------|-----------------|-------------------|
| [system] | [inputs we consume] | [outputs we send] | [what could go wrong] |
| [system] | [inputs] | [outputs] | [risk] |

## Boundaries

### Internal Boundaries

[Where are the seams between components? What defines a component boundary?]

### External Boundaries

[Where does your code meet the outside world?]

- [ ] User interface boundary
- [ ] API boundary (if any)
- [ ] File system boundary
- [ ] External service boundaries
- [ ] Configuration boundary

## Integration Checklist

For each external boundary, have you considered:

- [ ] **Authentication:** How are requests authenticated?
- [ ] **Configuration:** What needs to be configured?
- [ ] **Error handling:** What happens when external things fail?
- [ ] **Logging:** What do you need to observe?
- [ ] **Deployment:** How does this get deployed?

## Validation

Before proceeding:
- [ ] Each component has exactly one responsibility
- [ ] Dependencies are explicit (no hidden coupling)
- [ ] Data flow is traceable entry to exit
- [ ] External integrations have failure modes identified
- [ ] Boundaries are defined (where your code meets the world)
