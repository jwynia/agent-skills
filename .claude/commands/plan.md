# Planning & Architecture Mode

## 🚫 Implementation Restrictions

**THIS IS A PLANNING-ONLY COMMAND**

You are now in Planning & Architecture Mode for: $ARGUMENTS

In this mode, you MUST:
- ✅ Research and understand the problem space
- ✅ Document findings in the context network
- ✅ Design architecture and patterns
- ✅ Create task breakdowns
- ✅ Identify dependencies and risks

You MUST NOT:
- ❌ Write implementation code
- ❌ Create files outside context-network/
- ❌ Modify existing code
- ❌ Run build or deployment commands
- ❌ Make configuration changes

## Planning Process

### Phase 1: Problem Understanding 🔍

1. **Define the Problem**
   - What are we trying to solve?
   - Why does this matter?
   - Who are the stakeholders?
   - What are the success criteria?

2. **Explore the Current State**
   - Search existing codebase for related functionality
   - Check context network for prior decisions
   - Identify what already exists
   - Document current limitations

3. **Gather Requirements**
   - Functional requirements
   - Non-functional requirements (performance, security, etc.)
   - Constraints and boundaries
   - Assumptions to validate

### Phase 2: Research & Discovery 🔬

1. **Research Existing Solutions**
   - Industry patterns and best practices
   - Similar implementations in the codebase
   - External libraries or frameworks
   - Academic or theoretical foundations

2. **Technology Evaluation**
   - Available tools and technologies
   - Compatibility with existing stack
   - Learning curve and team expertise
   - Long-term maintenance implications

3. **Document Findings**
   ```
   context-network/research/$ARGUMENTS/
   ├── overview.md           # Problem and research summary
   ├── findings.md          # Detailed discoveries
   ├── alternatives.md      # Options considered
   └── recommendations.md   # Suggested approach
   ```

### Phase 3: Architecture Design 📐

1. **High-Level Design**
   - System boundaries and interfaces
   - Component relationships
   - Data flow diagrams
   - Sequence diagrams for key scenarios

2. **Detailed Design Decisions**
   - Create ADRs (Architecture Decision Records)
   - Document trade-offs
   - Specify design patterns to use
   - Define abstraction boundaries

3. **Integration Planning**
   - How this fits with existing architecture
   - API contracts and interfaces
   - Migration strategy if replacing existing functionality
   - Backward compatibility requirements

4. **Document Architecture**
   ```
   context-network/architecture/$ARGUMENTS/
   ├── overview.md          # High-level architecture
   ├── components.md        # Component descriptions
   ├── interactions.md      # How components interact
   ├── decisions/           # ADRs for key decisions
   └── diagrams/           # Visual representations
   ```

### Phase 4: Task Decomposition 📋

1. **Break Down Into Tasks**
   Each task should be:
   - **Independent**: Can be worked on in isolation
   - **Scoped**: Clear boundaries and deliverables
   - **Testable**: Defined success criteria
   - **Estimated**: Rough effort estimate (S/M/L/XL)

2. **Task Template**
   ```markdown
   ## Task: [Task Name]
   
   ### Scope
   - What this task includes
   - What this task excludes
   
   ### Dependencies
   - Prerequisites: [What must be done first]
   - Blockers: [What could prevent completion]
   
   ### Success Criteria
   - [ ] Criterion 1
   - [ ] Criterion 2
   
   ### Estimated Effort
   - Size: [S/M/L/XL]
   - Complexity: [Low/Medium/High]
   
   ### Implementation Notes
   - Key considerations
   - Suggested approach
   - Potential gotchas
   ```

3. **Create Task List**
   ```
   context-network/planning/$ARGUMENTS/
   ├── task-breakdown.md    # All tasks with details
   ├── dependencies.md      # Task dependency graph
   └── implementation-order.md  # Suggested sequence
   ```

### Phase 5: Risk Assessment ⚠️

1. **Identify Risks**
   - Technical risks (complexity, unknowns)
   - Integration risks (breaking changes)
   - Performance risks (scalability issues)
   - Security risks (vulnerabilities)
   - Operational risks (deployment, monitoring)

2. **Risk Register**
   ```markdown
   ## Risk: [Risk Name]
   
   ### Description
   [What could go wrong]
   
   ### Probability
   [Low/Medium/High]
   
   ### Impact
   [Low/Medium/High]
   
   ### Mitigation
   - Preventive measures
   - Contingency plans
   
   ### Early Warning Signs
   - What to watch for
   ```

3. **Document Risks**
   ```
   context-network/planning/$ARGUMENTS/
   └── risk-assessment.md   # All identified risks
   ```

### Phase 6: Corner-Painting Prevention 🎨

Before finalizing the plan, check:

1. **Performance Implications**
   - Will this scale?
   - Resource consumption?
   - Bottlenecks identified?

2. **Security Considerations**
   - Attack surfaces?
   - Data protection?
   - Authentication/authorization?

3. **Testing Strategy**
   - How will we test this?
   - What can be automated?
   - Edge cases considered?

4. **Migration Planning**
   - How to roll out?
   - Rollback strategy?
   - Data migration needs?

5. **Alternative Approaches**
   - Have we considered other solutions?
   - Why is this approach best?
   - What are we trading off?

6. **Integration Points**
   - Effects on other systems?
   - API compatibility?
   - Breaking changes?

## Deliverables Checklist

### Required Documentation
- [ ] Problem definition in context network
- [ ] Research findings documented
- [ ] Architecture design with diagrams
- [ ] Task breakdown with estimates
- [ ] Dependency graph
- [ ] Risk assessment
- [ ] Implementation readiness checklist

### Architecture Artifacts
- [ ] High-level design document
- [ ] Component specifications
- [ ] Interface definitions
- [ ] Data models
- [ ] Architecture Decision Records (ADRs)

### Planning Artifacts
- [ ] Scoped task list
- [ ] Implementation order
- [ ] Resource requirements
- [ ] Timeline estimates
- [ ] Success metrics

## Implementation Readiness Checklist

Before any implementation begins, ensure:

### Understanding
- [ ] Problem is clearly defined
- [ ] Requirements are documented
- [ ] Constraints are identified
- [ ] Assumptions are validated

### Design
- [ ] Architecture is documented
- [ ] Interfaces are specified
- [ ] Data models are defined
- [ ] Design patterns are chosen

### Planning
- [ ] Tasks are broken down
- [ ] Dependencies are mapped
- [ ] Risks are assessed
- [ ] Order is determined

### Preparation
- [ ] Team has necessary skills
- [ ] Tools are available
- [ ] Environment is ready
- [ ] Rollback plan exists

## Output Structure

All planning artifacts go in the context network:

```
context-network/
├── planning/
│   └── $ARGUMENTS/
│       ├── README.md              # Planning overview
│       ├── problem-definition.md  # What we're solving
│       ├── requirements.md        # What we need
│       ├── task-breakdown.md      # How we'll do it
│       ├── dependencies.md        # What depends on what
│       ├── risk-assessment.md     # What could go wrong
│       └── readiness-checklist.md # Are we ready?
├── architecture/
│   └── $ARGUMENTS/
│       ├── overview.md           # High-level design
│       ├── components.md         # Detailed components
│       └── decisions/            # ADRs
└── research/
    └── $ARGUMENTS/
        ├── findings.md           # What we learned
        └── alternatives.md       # What we considered
```

## Success Criteria

This planning session is successful when:

1. **Complete Understanding**: The problem space is thoroughly explored
2. **Clear Architecture**: Design decisions are documented and justified
3. **Actionable Tasks**: Work is broken into independent, scoped units
4. **Identified Risks**: Potential issues are documented with mitigations
5. **No Premature Code**: Zero implementation has occurred
6. **Team Alignment**: Plan can be understood by any team member

## Remember

> "Weeks of coding can save you hours of planning" - Unknown

Take the time to understand deeply, design thoughtfully, and plan comprehensively. The goal is to create a plan so clear that implementation becomes straightforward and risk-free.

**Now, let's plan: $ARGUMENTS**