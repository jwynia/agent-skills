# A03: Injection

Detection rules for OWASP A03 - Injection.

## Overview

Injection flaws occur when untrusted data is sent to an interpreter as part of a command or query. This includes SQL, NoSQL, OS command, LDAP, and XPath injection.

## Detection Patterns

### SQL Injection

**Pattern:** User input concatenated into SQL queries.

```javascript
// VULNERABLE
const query = "SELECT * FROM users WHERE id = " + userId;
const query = `SELECT * FROM users WHERE name = '${userName}'`;
db.query("SELECT * FROM users WHERE email = '" + email + "'");

// SECURE
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId]);
```

**Regex patterns:**
```
# String concatenation in SQL
SELECT\s+.*\+\s*\$?\w+
SELECT\s+.*\$\{[^}]+\}
['"]SELECT\s+.*['"].*\+

# Template literals with SQL
`SELECT[^`]*\$\{

# ORM raw queries with user input
\.raw\s*\([^)]*\$
\.rawQuery\s*\([^)]*req\.
execute\s*\([^)]*\+
```

**Language-specific patterns:**

```python
# Python
cursor\.execute\s*\([^)]*%\s*\(
cursor\.execute\s*\([^)]*\.format\s*\(
f["']SELECT[^"']*\{

# PHP
mysql_query\s*\([^)]*\$
mysqli_query\s*\([^)]*\$_
\$wpdb->query\s*\([^)]*\$

# Java
executeQuery\s*\([^)]*\+
createQuery\s*\([^)]*\+\s*\w+
Statement\s*.*execute.*\+
```

### NoSQL Injection

**Pattern:** User input in NoSQL queries without sanitization.

```javascript
// VULNERABLE
db.users.find({ username: req.body.username });  // Object injection possible
db.users.find({ $where: `this.name == '${name}'` });

// SECURE
const username = String(req.body.username);  // Force string type
db.users.find({ username: { $eq: username } });
```

**Regex patterns:**
```
# MongoDB object injection
\.find\s*\(\s*\{\s*\w+:\s*req\.(body|query|params)
\.findOne\s*\(\s*req\.body

# $where operator with user input
\$where.*\$\{
\$where.*\+\s*\w+

# Mongoose with raw objects
Model\.find\s*\(req\.body\)
```

### Command Injection

**Pattern:** User input passed to shell commands.

```python
# VULNERABLE
os.system("ping " + ip_address)
subprocess.call("ls " + user_input, shell=True)
exec("echo " + message)

# SECURE
subprocess.run(["ping", "-c", "1", ip_address], shell=False)
```

**Regex patterns:**
```
# Python
os\.system\s*\([^)]*\+
os\.popen\s*\([^)]*\+
subprocess\.(call|run|Popen)\s*\([^)]*shell\s*=\s*True
exec\s*\([^)]*\+
eval\s*\([^)]*request

# JavaScript/Node.js
child_process\.exec\s*\([^)]*\+
child_process\.exec\s*\([^)]*\$\{
exec\s*\([^)]*req\.(body|query|params)
spawn\s*\([^)]*\{.*shell:\s*true

# PHP
system\s*\([^)]*\$
exec\s*\([^)]*\$
passthru\s*\([^)]*\$
shell_exec\s*\([^)]*\$
`[^`]*\$[^`]*`

# Ruby
system\s*\([^)]*\#\{
`[^`]*\#\{[^`]*`
exec\s*\([^)]*\+
```

### Cross-Site Scripting (XSS)

**Pattern:** User input rendered in HTML without escaping.

```javascript
// VULNERABLE
element.innerHTML = userInput;
document.write(userData);
$(element).html(userContent);
res.send("<div>" + userName + "</div>");

// SECURE
element.textContent = userInput;
const escaped = escapeHtml(userInput);
$(element).text(userContent);
```

**Regex patterns:**
```
# JavaScript DOM
\.innerHTML\s*=
document\.write\s*\(
\.outerHTML\s*=

# jQuery
\$\([^)]*\)\.html\s*\(
\$\([^)]*\)\.append\s*\([^)]*\+

# React (dangerouslySetInnerHTML)
dangerouslySetInnerHTML

# Server-side rendering
res\.(send|write)\s*\([^)]*\+
render\s*\([^)]*\+\s*req\.

# Template engines without escaping
\{\{\{\s*\w+\s*\}\}\}  # Handlebars unescaped
\{!!\s*\$\w+\s*!!\}    # Blade unescaped
\|safe\}               # Django/Jinja safe filter
```

### LDAP Injection

**Pattern:** User input in LDAP queries.

```java
// VULNERABLE
String filter = "(uid=" + username + ")";
ctx.search("ou=users", filter, controls);

// SECURE
String safeUser = LdapEncoder.filterEncode(username);
String filter = "(uid=" + safeUser + ")";
```

**Regex patterns:**
```
# LDAP filter construction
\(uid=.*\+
\(cn=.*\+
ldap_search\s*\([^)]*\$
search\s*\([^)]*\+.*uid=
```

### XPath Injection

**Pattern:** User input in XPath queries.

```java
// VULNERABLE
String xpath = "//users/user[name='" + name + "']";

// SECURE
XPathExpression expr = xpath.compile("//users/user[name=$name]");
expr.setVariable("name", sanitizedName);
```

**Regex patterns:**
```
# XPath with concatenation
xpath\.evaluate\s*\([^)]*\+
selectNodes\s*\([^)]*\+
\[@\w+=.*\+
//\w+\[.*\+
```

### Expression Language Injection

**Pattern:** User input in expression language contexts.

```java
// VULNERABLE (Spring EL)
parser.parseExpression(userInput).getValue();

// VULNERABLE (OGNL)
OgnlContext ctx = new OgnlContext();
Ognl.getValue(userInput, ctx, root);
```

**Regex patterns:**
```
# Spring EL
parseExpression\s*\([^)]*\+
parseExpression\s*\(.*request

# OGNL
Ognl\.getValue\s*\([^)]*\+
Ognl\.setValue\s*\([^)]*\+

# MVEL
MVEL\.eval\s*\([^)]*\+
```

## Severity Classification

| Finding | Severity |
|---------|----------|
| SQL injection with auth bypass | CRITICAL |
| Command injection | CRITICAL |
| Stored XSS | CRITICAL |
| SQL injection (data access) | HIGH |
| NoSQL injection | HIGH |
| Reflected XSS | HIGH |
| LDAP injection | HIGH |
| Expression language injection | HIGH |
| DOM-based XSS | MEDIUM |
| XPath injection | MEDIUM |

## Remediation Guidance

### SQL Injection Prevention
Use parameterized queries:

```javascript
// Node.js with mysql2
const [rows] = await connection.execute(
  'SELECT * FROM users WHERE id = ? AND status = ?',
  [userId, 'active']
);

// Sequelize ORM
const user = await User.findOne({
  where: { id: userId }
});
```

### Command Injection Prevention
Avoid shell execution, use arrays:

```python
# Python - use subprocess with list arguments
import subprocess
import shlex

# SECURE: No shell, arguments as list
subprocess.run(['ping', '-c', '1', ip_address], check=True)

# If shell needed, validate strictly
allowed_hosts = {'google.com', 'example.com'}
if hostname in allowed_hosts:
    subprocess.run(['ping', '-c', '1', hostname])
```

### XSS Prevention
Escape output appropriately:

```javascript
// React auto-escapes by default
function SafeComponent({ userInput }) {
  return <div>{userInput}</div>;  // Auto-escaped
}

// Manual escaping when needed
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

## References

- [OWASP A03:2021](https://owasp.org/Top10/A03_2021-Injection/)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP OS Command Injection Defense](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
