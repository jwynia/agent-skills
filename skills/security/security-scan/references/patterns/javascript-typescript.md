# JavaScript/TypeScript Security Patterns

Language-specific vulnerability detection patterns.

## Injection Vulnerabilities

### SQL Injection
```regex
# String concatenation in queries
['"`]SELECT\s+.*['"`]\s*\+
['"`]INSERT\s+INTO\s+.*['"`]\s*\+
['"`]UPDATE\s+.*SET\s+.*['"`]\s*\+
['"`]DELETE\s+FROM\s+.*['"`]\s*\+

# Template literals
`SELECT\s+[^`]*\$\{
`INSERT\s+[^`]*\$\{
`UPDATE\s+[^`]*\$\{

# Raw query methods
\.query\s*\([^)]*\$\{
\.query\s*\([^)]*\+
\.raw\s*\([^)]*\$\{
sequelize\.query\s*\([^)]*\$\{
knex\.raw\s*\([^)]*\$\{
```

### Command Injection
```regex
# child_process
child_process\.exec\s*\([^)]*\$\{
child_process\.exec\s*\([^)]*\+
child_process\.execSync\s*\([^)]*\$\{
require\s*\(\s*['"]child_process['"]\s*\)\.exec\s*\([^)]*\+

# shell option in spawn
spawn\s*\([^)]*\{[^}]*shell\s*:\s*true

# eval with dynamic input
eval\s*\(\s*[^'"][^)]*\)
new\s+Function\s*\([^)]*\+
```

### XSS
```regex
# DOM manipulation
\.innerHTML\s*=
\.outerHTML\s*=
document\.write\s*\(
document\.writeln\s*\(

# jQuery
\$\s*\([^)]*\)\.html\s*\(
\$\s*\([^)]*\)\.append\s*\([^)]*\$\{
\$\s*\([^)]*\)\.prepend\s*\([^)]*\+

# React dangerous
dangerouslySetInnerHTML
__html\s*:

# Response without encoding
res\.send\s*\([^)]*\+\s*req\.
res\.write\s*\([^)]*\+\s*req\.
```

### NoSQL Injection
```regex
# MongoDB with user objects
\.find\s*\(\s*req\.body\s*\)
\.findOne\s*\(\s*req\.body\s*\)
\.updateOne\s*\([^)]*req\.body
\.deleteOne\s*\([^)]*req\.body

# $where operator
\$where\s*:.*\$\{
\$where\s*:.*\+

# Mongoose
Model\.\w+\s*\(req\.body\)
```

## Cryptographic Issues

### Weak Hashing
```regex
crypto\.createHash\s*\(\s*['"]md5['"]
crypto\.createHash\s*\(\s*['"]sha1['"]
\.update\s*\(.*\)\.digest\s*\(\s*\)  # No algorithm specified
md5\s*\(
sha1\s*\(
```

### Weak Random
```regex
Math\.random\s*\(\s*\)
# When used for security purposes like tokens, IDs
```

### Hardcoded Secrets
```regex
# API keys
(api[_-]?key|apikey)\s*[=:]\s*['"][a-zA-Z0-9]{16,}['"]
(secret[_-]?key|secretkey)\s*[=:]\s*['"][a-zA-Z0-9]{16,}['"]

# JWT secrets
(jwt[_-]?secret|JWT_SECRET)\s*[=:]\s*['"][^'"]+['"]

# Database credentials
(db[_-]?password|DB_PASSWORD)\s*[=:]\s*['"][^'"]+['"]

# Encryption keys
(encryption[_-]?key|ENCRYPTION_KEY)\s*[=:]\s*['"][^'"]+['"]
```

### Insecure TLS
```regex
rejectUnauthorized\s*:\s*false
NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0
process\.env\.NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0
```

## Authentication Issues

### Session Problems
```regex
# Predictable session
sessionId\s*=\s*Date\.now
sessionId\s*=\s*Math\.random

# Session in URL
redirect\s*\([^)]*session[^)]*\)
href\s*=.*\?.*session=

# No httpOnly
cookie\s*[=:]\s*\{[^}]*\}(?!.*httpOnly)
```

### Weak Password Policy
```regex
password\.length\s*>=?\s*[1-7]\b
minLength\s*:\s*[1-7]\b
\.{4,}\s*$  # Regex allowing very short passwords
```

## Access Control

### Missing Authorization
```regex
# Express routes without middleware
app\.(get|post|put|delete|patch)\s*\(\s*['"][^'"]*(?:admin|user|api)[^'"]*['"]\s*,\s*(?:async\s*)?\(req

# Direct ID access
findById\s*\(\s*req\.params\.\w+\s*\)
findById\s*\(\s*req\.query\.\w+\s*\)
```

### CORS Issues
```regex
Access-Control-Allow-Origin\s*[=:]\s*['"]\*['"]
cors\s*\(\s*\{\s*origin\s*:\s*['"]\*['"]
cors\s*\(\s*\{\s*origin\s*:\s*true
cors\s*\(\s*\)  # Default allows all
```

## Path Traversal

```regex
# File operations with user input
fs\.readFile\s*\([^)]*req\.(params|query|body)
fs\.readFileSync\s*\([^)]*req\.
fs\.writeFile\s*\([^)]*req\.
fs\.unlink\s*\([^)]*req\.

# Path join without validation
path\.join\s*\([^)]*req\.(params|query|body)
path\.resolve\s*\([^)]*req\.
```

## SSRF

```regex
# HTTP requests with user URLs
fetch\s*\(\s*req\.(body|query|params)
axios\.(get|post|put|delete)\s*\([^)]*req\.
http\.request\s*\([^)]*req\.
https\.request\s*\([^)]*req\.
got\s*\([^)]*req\.
```

## Prototype Pollution

```regex
# Dangerous merge/extend operations
Object\.assign\s*\(\s*\{\}\s*,\s*.*req\.body
_\.merge\s*\([^)]*req\.body
_\.defaultsDeep\s*\([^)]*req\.body
\.\.\.\s*req\.body  # Spread operator
JSON\.parse\s*\(.*req\.(body|query)
```

## Denial of Service

### ReDoS
```regex
# Regex with nested quantifiers
new\s+RegExp\s*\([^)]*(\+|\*)\s*[^)]*(\+|\*)\s*\)
/[^/]*(\+|\*)[^/]*(\+|\*)[^/]*/
```

### Resource Exhaustion
```regex
# Unbounded loops with user input
for\s*\([^)]*req\.(body|query|params)
while\s*\([^)]*req\.
\.forEach\s*\([^)]*JSON\.parse\s*\(.*req\.
```

## Secure Patterns (False Positive Filtering)

These patterns indicate secure usage:

```regex
# Parameterized queries
\.query\s*\([^)]*\?\s*,\s*\[
prepared\s*statement
\.escape\s*\(

# Secure random
crypto\.randomBytes
crypto\.randomUUID
uuid\.v4\s*\(

# Input validation
validator\.
\.sanitize\(
escape\s*\(
encodeURIComponent\s*\(
```

## Framework-Specific

### Express
```regex
# Missing helmet
(?!.*helmet)app\.use
# Missing CSRF
(?!.*csrf)app\.(post|put|patch|delete)
```

### React
```regex
# Dangerous patterns
dangerouslySetInnerHTML
__html\s*:\s*(?!sanitize)
```

### Next.js
```regex
# API routes without auth
export\s+(default\s+)?async?\s+function\s+(GET|POST|PUT|DELETE|PATCH)(?!.*auth)
```
