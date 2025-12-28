# Security Severity Matrix

Criteria for classifying vulnerability severity.

## Severity Levels

| Level | Score | Impact | Exploitability | Action |
|-------|-------|--------|----------------|--------|
| CRITICAL | 9.0-10.0 | System compromise | Easy, no auth | Immediate |
| HIGH | 7.0-8.9 | Data breach possible | Moderate | Before deploy |
| MEDIUM | 4.0-6.9 | Limited impact | Requires effort | Plan to fix |
| LOW | 0.1-3.9 | Minimal risk | Difficult | Consider |
| INFO | 0.0 | No direct risk | N/A | Awareness |

## Classification by Category

### Injection

| Finding | Severity |
|---------|----------|
| SQL injection with auth bypass | CRITICAL |
| SQL injection (data access) | HIGH |
| NoSQL injection (MongoDB) | HIGH |
| Stored XSS | CRITICAL |
| Reflected XSS | HIGH |
| DOM-based XSS | MEDIUM |
| Command injection | CRITICAL |
| LDAP injection | HIGH |
| Template injection (SSTI) | CRITICAL |

### Cryptography

| Finding | Severity |
|---------|----------|
| Hardcoded encryption keys | CRITICAL |
| MD5/SHA1 for passwords | CRITICAL |
| Weak encryption (DES/RC4) | HIGH |
| ECB mode encryption | HIGH |
| Math.random() for tokens | HIGH |
| Missing password salt | HIGH |
| Disabled TLS verification | CRITICAL |
| Weak TLS version (1.0/1.1) | MEDIUM |

### Secrets

| Finding | Severity |
|---------|----------|
| AWS credentials in code | CRITICAL |
| Private keys committed | CRITICAL |
| API keys in source | HIGH |
| Database passwords in code | HIGH |
| JWT secrets hardcoded | HIGH |
| Test credentials in prod | MEDIUM |
| Generic secrets in config | MEDIUM |

### Access Control

| Finding | Severity |
|---------|----------|
| Admin endpoint without auth | CRITICAL |
| IDOR on sensitive data | CRITICAL |
| Missing authorization | HIGH |
| CORS allows all origins | HIGH |
| Path traversal (system files) | CRITICAL |
| Path traversal (user files) | HIGH |
| Privilege escalation possible | CRITICAL |
| Mass assignment | MEDIUM |

### Configuration

| Finding | Severity |
|---------|----------|
| Debug mode in production | HIGH |
| Verbose error messages | MEDIUM |
| Default credentials | CRITICAL |
| Missing security headers | MEDIUM |
| Exposed admin interfaces | HIGH |
| Directory listing enabled | LOW |
| Insecure cookie flags | MEDIUM |

### Dependencies

| Finding | Severity |
|---------|----------|
| Known RCE vulnerability | CRITICAL |
| Known auth bypass CVE | CRITICAL |
| Known XSS CVE | HIGH |
| Known DoS vulnerability | MEDIUM |
| Outdated (no known CVE) | LOW |
| Deprecated package | INFO |

### SSRF

| Finding | Severity |
|---------|----------|
| SSRF to internal network | CRITICAL |
| SSRF to cloud metadata | CRITICAL |
| SSRF with protocol control | HIGH |
| Open redirect | MEDIUM |

### Deserialization

| Finding | Severity |
|---------|----------|
| pickle.loads with user data | CRITICAL |
| Unsafe YAML loading | HIGH |
| Java deserialization | CRITICAL |
| PHP unserialize | HIGH |

## Scoring Factors

### Impact Score (0-10)

| Factor | Weight |
|--------|--------|
| Confidentiality | 0-3.3 |
| Integrity | 0-3.3 |
| Availability | 0-3.3 |

### Exploitability Score (0-10)

| Factor | Weight |
|--------|--------|
| Attack complexity | 0-2.5 |
| Privileges required | 0-2.5 |
| User interaction | 0-2.5 |
| Attack vector | 0-2.5 |

### Final Score

```
Severity = (Impact * 0.6) + (Exploitability * 0.4)
```

## Adjustment Factors

### Increase Severity When:
- Public-facing application (+1 level)
- Handles financial data (+1 level)
- Handles health data (+1 level)
- No compensating controls (+1 level)
- Easily automatable exploit (+0.5 level)

### Decrease Severity When:
- Internal-only application (-0.5 level)
- Defense in depth present (-0.5 level)
- Limited data scope (-0.5 level)
- Requires physical access (-1 level)

## Response Timeframes

| Severity | Maximum Fix Time | Escalation |
|----------|-----------------|------------|
| CRITICAL | 24 hours | Immediate to leadership |
| HIGH | 7 days | Security team |
| MEDIUM | 30 days | Sprint planning |
| LOW | 90 days | Backlog |
| INFO | Optional | None |

## Report Format

```
[SEVERITY] CATEGORY: Title

File: path/to/file.ext:line
Pattern: Matched code pattern
CWE: CWE-XXX
CVSS: X.X

Risk: What could happen if exploited
Evidence: Specific code/config found
Remediation: How to fix

References:
- OWASP link
- CWE link
```
