# A01: Broken Access Control

Detection rules for OWASP A01 - Broken Access Control.

## Overview

Access control enforces policy so users cannot act outside their intended permissions. Failures typically lead to unauthorized information disclosure, modification, or destruction of data.

## Detection Patterns

### Missing Authorization Checks

**Pattern:** Endpoints or functions without authorization verification.

```javascript
// VULNERABLE: No auth check
app.get('/api/admin/users', async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});

// SECURE: Authorization required
app.get('/api/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
  const users = await User.findAll();
  res.json(users);
});
```

**Regex patterns:**
```
# Express routes without middleware
app\.(get|post|put|delete|patch)\s*\(\s*['"][^'"]*admin[^'"]*['"]\s*,\s*async?\s*\(

# Django views without decorators
def\s+\w+\(request[^)]*\):\s*\n\s+[^@]

# Missing @authorize in .NET
\[Http(Get|Post|Put|Delete)\]\s*\n\s*public
```

### Insecure Direct Object Reference (IDOR)

**Pattern:** User-controlled IDs used without ownership verification.

```javascript
// VULNERABLE: No ownership check
app.get('/api/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.json(order);
});

// SECURE: Verify ownership
app.get('/api/orders/:id', async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user.id  // Ownership check
  });
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json(order);
});
```

**Regex patterns:**
```
# Direct ID usage without user context
findById\s*\(\s*req\.(params|query|body)\.\w+\s*\)
Model\.find\s*\(\s*\{\s*_id:\s*req\.

# Path traversal in file access
path\.join\s*\([^)]*req\.(params|query|body)
```

### Path Traversal

**Pattern:** User input used in file paths without sanitization.

```python
# VULNERABLE
def download_file(request):
    filename = request.GET['file']
    filepath = os.path.join('/uploads/', filename)
    return FileResponse(open(filepath, 'rb'))

# SECURE
def download_file(request):
    filename = os.path.basename(request.GET['file'])  # Strip path
    filepath = os.path.join('/uploads/', filename)
    # Verify within allowed directory
    if not os.path.realpath(filepath).startswith('/uploads/'):
        raise PermissionError("Invalid path")
    return FileResponse(open(filepath, 'rb'))
```

**Regex patterns:**
```
# Python file operations with user input
open\s*\(\s*.*request\.(GET|POST|args|form)
os\.path\.join\s*\([^)]*request\.

# Node.js file operations
fs\.(readFile|writeFile|unlink)\s*\([^)]*req\.(params|query|body)
path\.join\s*\([^)]*req\.
```

### Privilege Escalation

**Pattern:** Role changes or privilege modifications without proper verification.

```javascript
// VULNERABLE: User can set their own role
app.put('/api/user/profile', async (req, res) => {
  await User.update(req.user.id, req.body);  // Could include role!
});

// SECURE: Whitelist allowed fields
app.put('/api/user/profile', async (req, res) => {
  const { name, email } = req.body;  // Only allow safe fields
  await User.update(req.user.id, { name, email });
});
```

**Regex patterns:**
```
# Mass assignment risks
\.update\s*\([^)]*req\.body\s*\)
Object\.assign\s*\([^)]*req\.body
\.\.\.\s*req\.body
```

### CORS Misconfiguration

**Pattern:** Overly permissive CORS settings.

```javascript
// VULNERABLE: Allow all origins
app.use(cors({ origin: '*' }));
app.use(cors({ origin: true }));

// VULNERABLE: Reflect origin
app.use(cors({ origin: req.headers.origin }));

// SECURE: Whitelist origins
app.use(cors({
  origin: ['https://app.example.com', 'https://admin.example.com']
}));
```

**Regex patterns:**
```
Access-Control-Allow-Origin:\s*\*
cors\s*\(\s*\{\s*origin:\s*['"]\*['"]
cors\s*\(\s*\{\s*origin:\s*true
```

## Severity Classification

| Finding | Severity |
|---------|----------|
| Admin endpoint without auth | CRITICAL |
| IDOR in sensitive data | CRITICAL |
| Path traversal to system files | CRITICAL |
| Missing auth on data modification | HIGH |
| CORS allows all origins | HIGH |
| IDOR in non-sensitive data | MEDIUM |
| Missing rate limiting on auth | MEDIUM |
| Verbose access denied errors | LOW |

## Remediation Guidance

### Authorization Middleware
Implement consistent authorization at the framework level:

```javascript
// Middleware that runs on all routes
const authMiddleware = (requiredRole) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (requiredRole && req.user.role !== requiredRole) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

### Ownership Verification
Always verify resource ownership:

```javascript
const verifyOwnership = async (resourceType, resourceId, userId) => {
  const resource = await resourceType.findById(resourceId);
  if (!resource || resource.userId !== userId) {
    throw new ForbiddenError('Access denied');
  }
  return resource;
};
```

### Path Sanitization
Never trust user input in file paths:

```javascript
const safePath = (basePath, userInput) => {
  const filename = path.basename(userInput);  // Strip directory
  const fullPath = path.resolve(basePath, filename);

  // Verify still within base path
  if (!fullPath.startsWith(path.resolve(basePath))) {
    throw new Error('Invalid path');
  }
  return fullPath;
};
```

## References

- [OWASP A01:2021](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Access_Control_Cheat_Sheet.html)
