# A04-A10: Additional OWASP Categories

Detection rules for OWASP categories A04 through A10.

---

## A04: Insecure Design

Design flaws that cannot be fixed by implementation alone.

### Detection Patterns

**Missing Rate Limiting:**
```
# Endpoints without rate limiting
@app\.route.*login
app\.(post|put)\s*\([^)]*password
# Look for absence of rate_limit decorators
```

**Missing CAPTCHA on Sensitive Actions:**
```
# Registration/password reset without verification
def (register|signup|reset_password|forgot_password)
```

**Unrestricted File Upload:**
```javascript
// VULNERABLE: No file type validation
multer({ dest: 'uploads/' })
app.post('/upload', upload.single('file'))

// Look for missing file type checks
```

**Regex patterns:**
```
# File upload without validation
multer\s*\(\s*\{[^}]*\}\s*\)(?!.*fileFilter)
upload\.single\s*\(.*\)(?!.*mimetype)
move_uploaded_file\s*\([^)]*\)(?!.*getimagesize)
```

### Severity: MEDIUM to HIGH

---

## A05: Security Misconfiguration

Insecure default configurations and missing security hardening.

### Detection Patterns

**Debug Mode in Production:**
```python
# VULNERABLE
DEBUG = True
app.run(debug=True)
```

**Regex patterns:**
```
DEBUG\s*=\s*True
debug\s*:\s*true
app\.run\s*\([^)]*debug\s*=\s*True
NODE_ENV.*development
```

**Default Credentials:**
```
password\s*[=:]\s*['"]?(admin|password|123456|root|test)['"]?
username\s*[=:]\s*['"]?admin['"]?
```

**Verbose Error Messages:**
```javascript
// VULNERABLE
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.stack });  // Exposes stack trace
});
```

**Regex patterns:**
```
\.stack
traceback
stacktrace
err\.message.*res\.(send|json)
```

**Missing Security Headers:**
```
# Look for absence in config
X-Frame-Options
X-Content-Type-Options
Content-Security-Policy
Strict-Transport-Security
```

### Severity: MEDIUM to HIGH

---

## A06: Vulnerable and Outdated Components

Using components with known vulnerabilities.

### Detection Patterns

**Outdated Package Versions:**
Check package manifests for known vulnerable versions:

```
# package.json, requirements.txt, pom.xml, etc.
lodash.*['"](4\.[0-9]|[0-3]\.)  # Vulnerable lodash
express.*['"]([0-3]\.|4\.[0-9]\.)  # Old express
```

**Commands to Run:**
```bash
npm audit
pip-audit
safety check
bundler-audit check
```

**Regex patterns:**
```
# Known vulnerable package patterns
jquery.*1\.[0-9]\.
bootstrap.*[0-3]\.
angular.*1\.[0-5]
moment.*2\.[0-9]\.
```

### Severity: Varies by CVE (LOW to CRITICAL)

---

## A07: Identification and Authentication Failures

Weak authentication mechanisms.

### Detection Patterns

**Weak Password Requirements:**
```javascript
// VULNERABLE
if (password.length >= 4) { ... }

// SECURE
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
```

**Regex patterns:**
```
# Weak password validation
password\.length\s*>=?\s*[1-7][^0-9]
minlength\s*[=:]\s*[1-7][^0-9]
```

**Session Issues:**
```javascript
// VULNERABLE: Predictable session ID
const sessionId = Date.now().toString();

// VULNERABLE: Session in URL
res.redirect('/dashboard?sessionId=' + session.id);
```

**Regex patterns:**
```
sessionId.*Date\.now
session.*query\.(id|token|session)
session.*url\s*\+
```

**Missing Brute Force Protection:**
```
# No lockout after failed attempts
loginAttempts(?!.*lockout)
failedAttempts(?!.*block)
```

### Severity: MEDIUM to CRITICAL

---

## A08: Software and Data Integrity Failures

Issues with code and data integrity verification.

### Detection Patterns

**Insecure Deserialization:**
```python
# VULNERABLE
pickle.loads(user_data)
yaml.load(data)  # Without Loader
```

**Regex patterns:**
```
# Python
pickle\.loads?\s*\(
yaml\.load\s*\([^)]*\)(?!.*Loader)
marshal\.loads?\s*\(

# Java
ObjectInputStream
readObject\s*\(
XStream\s*\(\s*\)

# PHP
unserialize\s*\([^)]*\$

# Node.js
node-serialize
serialize-javascript.*\(.*\)
```

**Missing Integrity Checks:**
```
# Downloads without hash verification
wget(?!.*sha256)
curl.*\|\s*sh
```

**Unsigned Updates:**
```
# Package installation without verification
pip install.*--trusted-host
npm install.*--ignore-scripts
```

### Severity: HIGH to CRITICAL

---

## A09: Security Logging and Monitoring Failures

Insufficient logging for security events.

### Detection Patterns

**Missing Security Event Logging:**
```
# Authentication without logging
def login.*:(?!.*log)
function authenticate.*{(?!.*logger)
```

**Sensitive Data in Logs:**
```
logger\.(info|debug|warn)\s*\([^)]*password
console\.log\s*\([^)]*apiKey
log\.(info|debug)\s*\([^)]*credit
```

**Log Injection:**
```python
# VULNERABLE
logger.info(f"User login: {request.GET['username']}")
```

**Regex patterns:**
```
# Unsanitized user input in logs
logger\.\w+\s*\([^)]*request\.(GET|POST|body|query)
console\.(log|info)\s*\([^)]*req\.(body|params|query)
```

### Severity: LOW to MEDIUM

---

## A10: Server-Side Request Forgery (SSRF)

User-supplied URLs used in server-side requests.

### Detection Patterns

**Direct URL Fetching:**
```python
# VULNERABLE
url = request.GET['url']
response = requests.get(url)

# VULNERABLE: PDF generation from URL
pdfkit.from_url(request.POST['url'], 'output.pdf')
```

**Regex patterns:**
```
# Python
requests\.(get|post)\s*\(\s*request\.(GET|POST|args|form)
urllib\.request\.urlopen\s*\([^)]*request
httpx\.(get|post)\s*\([^)]*request

# JavaScript
fetch\s*\(\s*req\.(body|query|params)
axios\.(get|post)\s*\([^)]*req\.
http\.request\s*\([^)]*req\.

# General URL parameter usage
(url|uri|link|href)\s*[=:]\s*req\.(body|query|params)
```

**Unsafe Redirects:**
```javascript
// VULNERABLE
res.redirect(req.query.returnUrl);
```

**Regex patterns:**
```
redirect\s*\(\s*req\.(query|body|params)
Location\s*[=:]\s*req\.
```

### SSRF Bypass Patterns to Detect
```
# Internal network access attempts
127\.0\.0\.1|localhost|0\.0\.0\.0
169\.254\.\d+\.\d+  # AWS metadata
10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[01])\.
192\.168\.\d+\.\d+
```

### Severity: HIGH to CRITICAL

---

## Quick Reference: All Categories

| Category | Key Detection Focus | Priority Patterns |
|----------|-------------------|-------------------|
| A04 | Rate limiting, file upload | Missing validation |
| A05 | Debug mode, headers | DEBUG=True, verbose errors |
| A06 | Package versions | npm audit, known CVEs |
| A07 | Password policy, sessions | Weak length checks |
| A08 | Deserialization | pickle.loads, unserialize |
| A09 | Log content, coverage | Passwords in logs |
| A10 | URL handling | requests.get(user_url) |

## References

- [OWASP Top 10:2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
