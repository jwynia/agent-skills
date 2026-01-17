# Scenario Template

Use this template to design scenarios that test competencies through realistic situations requiring judgment.

## Template

```markdown
### Scenario: [Descriptive Name]

**Core decision structure:** [What judgment or trade-off is being tested]

**Interview variant:**
> [Generic situation that doesn't require knowledge of specific organization. Tests reasoning approach.]

**Assessment variant:**
> [Organization-specific version using real tools, policies, team names. Tests application of learned content.]

**Ongoing variant:** (optional)
> [Real situation that occurred, anonymized if needed. Tests continued competence.]

**Competencies assessed:** [Competency IDs this scenario tests]

**What good looks like:**
- [Key consideration a competent response would include]
- [Another consideration]
- [What distinguishes competent from strong]

**Red flags:**
- [What a weak response would miss]
- [Common mistakes]
- [Misconceptions revealed]
```

## Scenario Design Checklist

- [ ] **Realistic**: Situation people will actually encounter
- [ ] **Incomplete information**: Like real life, not everything is specified
- [ ] **Requires judgment**: Can't be answered by searching documentation
- [ ] **Gradable**: Has better and worse responses, not just right/wrong
- [ ] **Time-efficient**: Can be evaluated in reasonable time
- [ ] **Variant-ready**: Interview version doesn't require org-specific knowledge

## Testing Your Scenario

1. **Too easy**: If everyone gets the same answer quickly, add ambiguity
2. **Too hard**: If no one can engage meaningfully, provide more context
3. **Not testing competency**: If responses don't differentiate by competency level, redesign
4. **Lookup-able**: If someone could ctrl+F the answer in docs, it's testing recall not judgment

## Example: Tool Evaluation Scenario

```markdown
### Scenario: Third-Party Tool Evaluation

**Core decision structure:** Given incomplete vendor information, identify what you need to know and how to verify claims.

**Interview variant:**
> A team wants to use a third-party AI coding assistant. They've sent you the product page. What questions do you need answered before you can evaluate it? How would you find those answers?

**Assessment variant:**
> Team X wants to use [SpecificTool]. Here's their use case: [description]. Here's the vendor's security documentation: [link]. Evaluate this against our data policies and write up your recommendation.

**Competencies assessed:** DP-1 (Data classification), DP-2 (Service model differentiation), DP-4 (Vendor evaluation)

**What good looks like:**
- Asks about data retention, training data usage, processing location
- Distinguishes marketing claims from verifiable commitments
- Identifies what data the team would actually send
- Recognizes gaps in available information
- Knows when/how to escalate uncertainty

**Red flags:**
- Takes marketing claims at face value
- Doesn't ask about data flow
- Binary yes/no without nuance
- Can't articulate what would change the assessment
```

## Scoring Scenarios

| Level | Meaning | Indicators |
|-------|---------|------------|
| Not demonstrated | Didn't engage meaningfully | Missed obvious considerations, couldn't articulate approach |
| Partial | Some considerations, gaps in reasoning | Got some factors, missed important ones |
| Competent | Addressed key considerations | Sound reasoning, could do independently |
| Strong | Sophisticated judgment | Identified non-obvious factors, could teach others |
