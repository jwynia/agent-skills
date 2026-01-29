# Common Security Remediation Guide

Quick-reference fixes for common vulnerabilities.

## Injection Prevention

### SQL Injection

**Use parameterized queries:**

```javascript
// Node.js (mysql2)
const [rows] = await conn.execute(
  'SELECT * FROM users WHERE id = ? AND status = ?',
  [userId, 'active']
);

// Node.js (pg)
const result = await client.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

```python
# Python (psycopg2)
cursor.execute(
    "SELECT * FROM users WHERE id = %s AND status = %s",
    (user_id, 'active')
)

# Python (SQLAlchemy)
session.query(User).filter(User.id == user_id).first()
```

### Command Injection

**Avoid shell execution:**

```python
# VULNERABLE
os.system(f"ping {ip_address}")

# SECURE
import subprocess
subprocess.run(['ping', '-c', '1', ip_address], shell=False)
```

```javascript
// VULNERABLE
exec(`ping ${ip}`);

// SECURE
const { spawn } = require('child_process');
spawn('ping', ['-c', '1', ip]);
```

### XSS Prevention

**Escape output:**

```javascript
// React (automatic escaping)
function Safe({ userInput }) {
  return <div>{userInput}</div>;
}

// Manual escaping
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

---

## Cryptography Fixes

### Password Hashing

**Use bcrypt, Argon2, or scrypt:**

```javascript
// Node.js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12);
const valid = await bcrypt.compare(password, hash);
```

```python
# Python
import bcrypt
hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
valid = bcrypt.checkpw(password.encode(), hash)
```

### Secure Random Generation

```javascript
// Node.js
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');
const uuid = crypto.randomUUID();
```

```python
# Python
import secrets
token = secrets.token_hex(32)
safe_choice = secrets.choice(allowed_values)
```

### Secure Encryption

```javascript
// AES-256-GCM
const crypto = require('crypto');

function encrypt(text, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    encrypted,
    tag: cipher.getAuthTag().toString('hex')
  };
}
```

---

## Authentication Fixes

### Strong Password Policy

```javascript
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true
};

function validatePassword(password) {
  if (password.length < 12) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*]/.test(password)) return false;
  return true;
}
```

### Secure Session Configuration

```javascript
// Express session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,       // HTTPS only
    httpOnly: true,     // No JS access
    sameSite: 'strict', // CSRF protection
    maxAge: 3600000     // 1 hour
  }
}));
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // 5 attempts
  message: 'Too many login attempts'
});

app.post('/login', loginLimiter, loginHandler);
```

---

## Access Control Fixes

### Authorization Middleware

```javascript
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
app.get('/admin', requireAuth, requireRole('admin'), handler);
```

### Resource Ownership Verification

```javascript
async function getOrder(req, res) {
  const order = await Order.findOne({
    _id: req.params.id,
    userId: req.user.id  // Ownership check
  });

  if (!order) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(order);
}
```

### CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: ['https://app.example.com'],
  methods: ['GET', 'POST'],
  credentials: true
}));
```

---

## Path Traversal Fix

```javascript
const path = require('path');

function safePath(basePath, userInput) {
  // Remove any path separators
  const filename = path.basename(userInput);
  const fullPath = path.resolve(basePath, filename);

  // Verify still within base
  if (!fullPath.startsWith(path.resolve(basePath))) {
    throw new Error('Invalid path');
  }

  return fullPath;
}
```

---

## SSRF Prevention

```javascript
const { URL } = require('url');

function isAllowedUrl(urlString) {
  try {
    const url = new URL(urlString);

    // Block internal networks
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^0\.0\.0\.0$/
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(url.hostname)) {
        return false;
      }
    }

    // Only allow HTTPS
    if (url.protocol !== 'https:') {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
```

---

## Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet());

// Or configure individually:
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
  }
}));

app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true
}));
```

---

## Input Validation

```javascript
const Joi = require('joi');

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(12).required(),
  age: Joi.number().integer().min(0).max(150)
});

function validateInput(req, res, next) {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
}
```

---

## Secrets Management

```javascript
// Use environment variables
const apiKey = process.env.API_KEY;
const dbPassword = process.env.DB_PASSWORD;

// Never commit secrets
// Use .env files for development only
// Use secrets manager in production (AWS Secrets Manager, Vault, etc.)
```

Example `.env` (add to `.gitignore`):
```
API_KEY=your-api-key
DB_PASSWORD=your-db-password
```

---

## Quick Reference

| Vulnerability | Primary Fix |
|--------------|-------------|
| SQL Injection | Parameterized queries |
| XSS | Output encoding |
| Command Injection | Avoid shell, use arrays |
| Weak Crypto | bcrypt/Argon2, AES-GCM |
| Hardcoded Secrets | Environment variables |
| SSRF | URL allowlist |
| Path Traversal | Validate paths |
| Missing Auth | Middleware enforcement |
| Weak Sessions | Secure cookie flags |
