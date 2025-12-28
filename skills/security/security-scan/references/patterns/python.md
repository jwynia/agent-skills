# Python Security Patterns

Language-specific vulnerability detection patterns.

## Injection Vulnerabilities

### SQL Injection
```regex
# String formatting in queries
cursor\.execute\s*\([^)]*%\s*\(
cursor\.execute\s*\([^)]*%\s*[a-zA-Z_]
cursor\.execute\s*\([^)]*\.format\s*\(
cursor\.execute\s*\(f['"]
cursor\.executemany\s*\([^)]*%

# ORM raw queries
\.raw\s*\([^)]*%
\.raw\s*\(f['"]
\.extra\s*\([^)]*%
RawSQL\s*\([^)]*%

# Django
objects\.raw\s*\([^)]*%
objects\.raw\s*\(f['"]
connection\.cursor\s*\(\s*\)\.execute\s*\([^)]*%
```

### Command Injection
```regex
# os module
os\.system\s*\([^)]*\+
os\.system\s*\(f['"]
os\.popen\s*\([^)]*\+
os\.popen\s*\(f['"]

# subprocess with shell
subprocess\.(call|run|Popen)\s*\([^)]*shell\s*=\s*True
subprocess\.(call|run|Popen)\s*\([^)]*\+[^)]*shell\s*=\s*True

# eval/exec
eval\s*\([^)]*request\.
exec\s*\([^)]*request\.
compile\s*\([^)]*request\.

# Python 2
commands\.getoutput\s*\(
commands\.getstatusoutput\s*\(
```

### Template Injection
```regex
# Jinja2 unsafe
render_template_string\s*\([^)]*\+
render_template_string\s*\(f['"]
Template\s*\([^)]*\+
Markup\s*\([^)]*\+

# Django templates
Template\s*\([^)]*request\.
mark_safe\s*\([^)]*request\.
```

## Cryptographic Issues

### Weak Hashing
```regex
hashlib\.md5\s*\(
hashlib\.sha1\s*\(
hashlib\.new\s*\(\s*['"]md5['"]
hashlib\.new\s*\(\s*['"]sha1['"]

# PyCrypto
MD5\.new\s*\(
SHA\.new\s*\(

# Without salt for passwords
hashlib\.\w+\s*\([^)]*password
```

### Weak Random
```regex
random\.random\s*\(
random\.randint\s*\(
random\.choice\s*\(
random\.randrange\s*\(
# When used for security (tokens, IDs, passwords)
```

### Hardcoded Secrets
```regex
# Secret keys
(SECRET_KEY|secret_key)\s*=\s*['"][^'"]+['"]
(API_KEY|api_key)\s*=\s*['"][a-zA-Z0-9]{16,}['"]

# Passwords
(PASSWORD|password|passwd)\s*=\s*['"][^'"]+['"]

# Database URIs with credentials
(DATABASE_URL|database_url)\s*=\s*['"][^'"]*:[^@]*@
```

### Insecure TLS
```regex
verify\s*=\s*False
ssl\._create_unverified_context
ssl\.CERT_NONE
urllib3\.disable_warnings\s*\(
requests\.(get|post|put|delete)\s*\([^)]*verify\s*=\s*False
```

## Deserialization

```regex
# Pickle (dangerous with untrusted data)
pickle\.loads?\s*\(
cPickle\.loads?\s*\(
_pickle\.loads?\s*\(
shelve\.open\s*\(

# YAML without safe loader
yaml\.load\s*\([^)]*\)(?!.*Loader)
yaml\.load\s*\([^)]*Loader\s*=\s*yaml\.Loader
yaml\.unsafe_load\s*\(

# Marshal
marshal\.loads?\s*\(

# Dill
dill\.loads?\s*\(
```

## Path Traversal

```regex
# File operations with user input
open\s*\([^)]*request\.(GET|POST|args|form|data)
open\s*\(f['"][^'"]*\{.*request
os\.path\.join\s*\([^)]*request\.
shutil\.(copy|move|rmtree)\s*\([^)]*request\.

# Django
FileResponse\s*\([^)]*request\.
sendfile\s*\([^)]*request\.
```

## SSRF

```regex
# Requests library
requests\.(get|post|put|delete|head|patch)\s*\([^)]*request\.(GET|POST|args|form)
requests\.(get|post|put|delete|head|patch)\s*\(f['"]

# urllib
urllib\.request\.urlopen\s*\([^)]*request\.
urllib\.request\.urlretrieve\s*\([^)]*request\.

# httpx
httpx\.(get|post|put|delete)\s*\([^)]*request\.
```

## Authentication Issues

### Weak Password Policy
```regex
len\s*\(\s*password\s*\)\s*>=?\s*[1-7]\b
if\s+len\s*\(\s*password\s*\)\s*<\s*[2-7]:
MIN_PASSWORD_LENGTH\s*=\s*[1-7]\b
```

### Session Issues
```regex
# Session in cookies without secure flag
SESSION_COOKIE_SECURE\s*=\s*False
SESSION_COOKIE_HTTPONLY\s*=\s*False

# Flask session secret
app\.secret_key\s*=\s*['"][^'"]+['"]

# Debug mode
DEBUG\s*=\s*True
app\.run\s*\([^)]*debug\s*=\s*True
```

## Django-Specific

### Security Settings
```regex
# Dangerous settings
DEBUG\s*=\s*True
ALLOWED_HOSTS\s*=\s*\[['"]?\*['"]?\]
CSRF_COOKIE_SECURE\s*=\s*False
SESSION_COOKIE_SECURE\s*=\s*False
SECURE_SSL_REDIRECT\s*=\s*False
```

### Template Issues
```regex
# Unescaped output
\{\{[^}]*\|safe\}\}
mark_safe\s*\(
format_html\s*\([^)]*\+
```

### ORM Issues
```regex
# Raw SQL
\.raw\s*\(
\.extra\s*\(
RawSQL\s*\(
cursor\.execute\s*\(
```

## Flask-Specific

### Security Issues
```regex
# Debug mode
app\.run\s*\([^)]*debug\s*=\s*True
FLASK_DEBUG\s*=\s*1

# Secret key
app\.secret_key\s*=\s*['"]

# Template injection
render_template_string\s*\([^)]*request\.
```

## FastAPI-Specific

### Security Issues
```regex
# Debug/docs in production
app\s*=\s*FastAPI\s*\([^)]*docs_url
app\s*=\s*FastAPI\s*\([^)]*redoc_url

# Missing auth on endpoints
@app\.(get|post|put|delete)\s*\([^)]*\)\s*\n(async\s+)?def\s+\w+\s*\([^)]*\)(?!.*Depends)
```

## Logging Issues

```regex
# Sensitive data in logs
(logging|logger)\.\w+\s*\([^)]*password
(logging|logger)\.\w+\s*\([^)]*secret
(logging|logger)\.\w+\s*\([^)]*token
(logging|logger)\.\w+\s*\([^)]*api_key
print\s*\([^)]*password
print\s*\([^)]*secret
```

## Regex Denial of Service

```regex
# Nested quantifiers
re\.compile\s*\([^)]*(\+|\*)[^)]*(\+|\*)
re\.(match|search|findall)\s*\([^)]*(\+|\*)[^)]*(\+|\*)
```

## Secure Patterns (False Positive Filtering)

```regex
# Parameterized queries
cursor\.execute\s*\([^)]*,\s*\[
cursor\.execute\s*\([^)]*,\s*\(
%s[^%]*,\s*\(

# Secure random
secrets\.token_
secrets\.choice\s*\(
os\.urandom\s*\(
random\.SystemRandom\s*\(

# Safe YAML
yaml\.safe_load\s*\(
yaml\.load\s*\([^)]*Loader\s*=\s*yaml\.SafeLoader

# Input sanitization
bleach\.clean\s*\(
escape\s*\(
quote\s*\(
```
