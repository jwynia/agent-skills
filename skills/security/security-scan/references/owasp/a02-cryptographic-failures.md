# A02: Cryptographic Failures

Detection rules for OWASP A02 - Cryptographic Failures.

## Overview

Failures related to cryptography which often lead to exposure of sensitive data. This includes weak algorithms, poor key management, and insecure data transmission.

## Detection Patterns

### Weak Hashing Algorithms

**Pattern:** Using MD5, SHA1 for passwords or security purposes.

```python
# VULNERABLE
import hashlib
password_hash = hashlib.md5(password.encode()).hexdigest()
password_hash = hashlib.sha1(password.encode()).hexdigest()

# SECURE
import bcrypt
password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
```

**Regex patterns:**
```
# Python
hashlib\.md5\s*\(
hashlib\.sha1\s*\(
MD5\.new\s*\(

# JavaScript
crypto\.createHash\s*\(\s*['"]md5['"]
crypto\.createHash\s*\(\s*['"]sha1['"]
md5\s*\(

# Java
MessageDigest\.getInstance\s*\(\s*["']MD5["']
MessageDigest\.getInstance\s*\(\s*["']SHA-?1["']

# PHP
md5\s*\(
sha1\s*\(
```

### Weak Encryption Algorithms

**Pattern:** Using DES, 3DES, RC4, or ECB mode.

```java
// VULNERABLE
Cipher cipher = Cipher.getInstance("DES/ECB/PKCS5Padding");
Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");

// SECURE
Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
```

**Regex patterns:**
```
# DES/3DES
DES|DESede|TripleDES
Cipher\.getInstance\s*\(\s*["'][^"']*DES

# ECB Mode (any algorithm)
/ECB/
Cipher\.getInstance\s*\(\s*["'][^"']*/ECB/

# RC4
RC4|ARCFOUR
```

### Hardcoded Cryptographic Keys

**Pattern:** Encryption keys embedded in source code.

```javascript
// VULNERABLE
const encryptionKey = "MySecretKey12345";
const AES_KEY = Buffer.from('0123456789abcdef');

// SECURE
const encryptionKey = process.env.ENCRYPTION_KEY;
```

**Regex patterns:**
```
# Key variable assignments
(encryption|aes|secret|crypto)[-_]?key\s*[=:]\s*['"][^'"]+['"]

# Direct key in crypto calls
\.encrypt\s*\([^)]*['"][A-Za-z0-9+/=]{16,}['"]
createCipheriv\s*\([^)]*['"][A-Za-z0-9+/=]{16,}['"]
```

### Weak Random Number Generation

**Pattern:** Using non-cryptographic random for security purposes.

```javascript
// VULNERABLE
const token = Math.random().toString(36);
const sessionId = Math.floor(Math.random() * 1000000);

// SECURE
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');
```

**Regex patterns:**
```
# JavaScript
Math\.random\s*\(\s*\)

# Python
random\.(random|randint|choice)\s*\(

# Java (not SecureRandom)
new\s+Random\s*\(
java\.util\.Random

# PHP
rand\s*\(
mt_rand\s*\(
```

### Missing Password Salt

**Pattern:** Hashing passwords without unique salt.

```python
# VULNERABLE
password_hash = sha256(password).hexdigest()

# SECURE
salt = os.urandom(32)
password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
```

**Regex patterns:**
```
# Direct hash without salt parameter
sha256\s*\(\s*password
bcrypt\.hash\s*\([^,]+\s*\)$  # Missing salt parameter
```

### Insecure TLS Configuration

**Pattern:** Disabled certificate verification or weak TLS versions.

```python
# VULNERABLE
requests.get(url, verify=False)
ssl_context.check_hostname = False
urllib3.disable_warnings()

# SECURE
requests.get(url, verify=True)
```

**Regex patterns:**
```
# Python
verify\s*=\s*False
check_hostname\s*=\s*False
disable_warnings\s*\(
CERT_NONE

# Node.js
rejectUnauthorized\s*:\s*false
NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['"]?0

# General
SSLv2|SSLv3|TLSv1\.0|TLSv1\.1
```

### Sensitive Data in Logs

**Pattern:** Logging passwords, tokens, or keys.

```python
# VULNERABLE
logger.info(f"User login: {username}, password: {password}")
console.log("API Key:", apiKey);

# SECURE
logger.info(f"User login: {username}")
```

**Regex patterns:**
```
(log|print|console\.(log|info|debug))\s*\([^)]*password
(log|print|console\.(log|info|debug))\s*\([^)]*apiKey
(log|print|console\.(log|info|debug))\s*\([^)]*secret
(log|print|console\.(log|info|debug))\s*\([^)]*token
```

## Severity Classification

| Finding | Severity |
|---------|----------|
| Hardcoded encryption keys | CRITICAL |
| MD5/SHA1 for passwords | CRITICAL |
| Disabled TLS verification | CRITICAL |
| DES/3DES encryption | HIGH |
| ECB mode encryption | HIGH |
| Math.random() for tokens | HIGH |
| Missing password salt | HIGH |
| Sensitive data in logs | HIGH |
| Weak TLS versions | MEDIUM |
| Hardcoded IV values | MEDIUM |

## Remediation Guidance

### Password Hashing
Use bcrypt, scrypt, or Argon2:

```javascript
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

// Hash password
const hash = await bcrypt.hash(password, SALT_ROUNDS);

// Verify password
const match = await bcrypt.compare(password, hash);
```

### Encryption
Use AES-GCM with proper key management:

```javascript
const crypto = require('crypto');

function encrypt(text, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return { iv: iv.toString('hex'), encrypted, authTag: authTag.toString('hex') };
}
```

### Secure Random
Use cryptographic random sources:

```javascript
const crypto = require('crypto');

// Generate random token
const token = crypto.randomBytes(32).toString('hex');

// Generate random number in range
const randomInt = crypto.randomInt(0, 1000000);
```

## References

- [OWASP A02:2021](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
