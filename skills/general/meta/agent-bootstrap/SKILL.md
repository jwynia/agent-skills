---
name: agent-bootstrap
description: Bootstrap agentic development environment from agent.toml manifest
license: MIT
metadata:
  author: jwynia
  version: "1.0"
  domain: infrastructure
  type: operational
  mode: operational
  maturity: stable
---

# Agent Bootstrap: Declarative Environment Setup

You bootstrap the agentic development environment by reading `agent.toml` and configuring the current tool (Claude Code, OpenCode, etc.) accordingly.

## Usage

```
/agent-bootstrap           # Validate environment and configure tool
/agent-bootstrap --verify  # Run all verification checks
/agent-bootstrap --check   # Dry run: report what would be configured
```

## Core Principle

**Self-bootstrap without external dependencies.** The manifest (`agent.toml`) + this skill = complete environment setup. No `curl|bash`, no package managers, no external tools.

## Quick Reference

Use this skill when:
- Starting work in a new repository
- Environment feels misconfigured
- Checks are failing unexpectedly
- Setting up a new machine

What this skill does:
1. Reads `agent.toml` from repository root
2. Validates environment (required vars, commands, runtimes)
3. Configures plugins for the current tool
4. Generates MCP server config
5. Reports status (or runs verification checks with `--verify`)

## The States

### State AB0: No Manifest

**Symptoms:**
- No `agent.toml` in repository root
- User asks to bootstrap but no manifest exists

**Key Questions:**
- Should we create a starter `agent.toml`?
- What environment requirements does this project have?

**Interventions:**
- Offer to create a minimal `agent.toml` based on detected project type
- Check for common patterns (Cargo.toml → Rust, package.json → Node, etc.)
- Link to docs/agent-toml-spec.md if it exists

---

### State AB1: Manifest Found, Validation Needed

**Symptoms:**
- `agent.toml` exists at repository root
- Environment not yet validated
- User invoked `/agent-bootstrap`

**Key Questions:**
- Are all required environment variables set?
- Are all required commands in PATH?
- Do runtime versions meet constraints?

**Interventions:**
- Parse `agent.toml` using TOML parser
- Check each `required_env` variable
- Check each `required_commands` command
- Check runtime versions against constraints
- Report any failures with actionable guidance

---

### State AB2: Environment Valid, Configuration Needed

**Symptoms:**
- Environment validation passed
- Tool configuration not yet applied
- Plugins, MCP servers, or hooks need setup

**Key Questions:**
- Which plugins need to be enabled?
- What MCP servers should be configured?
- Which hooks should be applied?

**Interventions:**
- For Claude Code:
  - Update `.claude/settings.json` with enabled plugins
  - Generate `.mcp.json` from MCP server definitions
  - Note: Hooks require user to copy to their settings (tool-specific)
- Report configuration changes made

---

### State AB3: Configured, Verification Mode

**Symptoms:**
- User invoked `/agent-bootstrap --verify`
- Need to run verification checks

**Key Questions:**
- Which checks should run (based on trigger)?
- Did all checks pass?

**Interventions:**
- Run all `[[verification.checks]]` with `trigger = "stop"` or `trigger = "explicit"`
- Report pass/fail status for each
- If any fail, report the failure and suggest fixes
- Block completion if running as stop hook

---

## Execution Process

### Phase 1: Parse Manifest

```bash
# Read agent.toml from repository root
```

Parse the TOML file and extract:
- `[manifest]` - version check (1.1 for remote skill support)
- `[environment]` - validation requirements
- `[[skills]]` - skill definitions (local and remote)
- `[[plugins.*]]` - plugin configuration
- `[[mcp.servers]]` - MCP server definitions
- `[[hooks.*]]` - hook definitions
- `[[verification.checks]]` - verification checks

### Phase 1.5: Install Remote Skills

For each skill with a `source` field (rather than `path`), install from remote:

**Source Format Detection:**

| Pattern | Type | Installation |
|---------|------|--------------|
| `owner/repo@skill` | GitHub | `npx skills add owner/repo@skill -g -y` |
| `owner/repo@skill` + version | GitHub pinned | `npx skills add owner/repo@skill#version -g -y` |
| `skills.sh/name` | Registry | `npx skills add name -g -y` |
| `https://.../raw/.../skill` | Raw URL | Fetch SKILL.md directly to ~/.claude/skills/ |
| `https://....git@skill` | Git URL | `npx skills add <url> -g -y` |

**Installation Process:**

1. Check if skill already installed: `ls ~/.claude/skills/skill-name/SKILL.md`
2. If not installed, determine source type and run appropriate command
3. Verify installation succeeded

**Report Format:**
```
Installing remote skills...

[1/34] gitea-workflow
  Source: jwynia/agent-skills@gitea-workflow
  ✓ Installed

[2/34] code-review
  Source: jwynia/agent-skills@code-review
  ✓ Already installed

[3/34] custom-skill
  Source: https://gitea.example.com/.../raw/.../custom-skill
  ✗ Failed: Connection refused

Remote skills: 32/34 installed, 1 already present, 1 failed
```

**Raw URL Installation (for Gitea/GitLab):**

When source starts with `https://` and contains `/raw/`:
```bash
# Create skill directory
mkdir -p ~/.claude/skills/skill-name

# Fetch SKILL.md directly
curl -sSL "https://gitea.example.com/.../raw/.../skill-name/SKILL.md" \
  -o ~/.claude/skills/skill-name/SKILL.md

# Verify file was created
test -f ~/.claude/skills/skill-name/SKILL.md
```

**Skills with version field:**

When a skill has both `source` and `version`:
```toml
[[skills]]
name = "code-review"
source = "jwynia/agent-skills@code-review"
version = "v1.2.0"
```

Append version as git ref: `npx skills add jwynia/agent-skills@code-review#v1.2.0 -g -y`

### Phase 2: Validate Environment

For each requirement, check and report:

**Environment Variables:**
```
✓ GITHUB_TOKEN is set
✗ TAVILY_API_KEY is not set
  → Set this variable for web search functionality
```

**Commands:**
```
✓ git (found at /usr/bin/git)
✓ cargo (found at /home/user/.cargo/bin/cargo)
✗ node not found in PATH
  → Install Node.js: https://nodejs.org/
```

**Runtimes:**
```
✓ rust 1.78.0 >= 1.75.0
✗ python 3.9.7 does not satisfy >=3.10
  → Upgrade Python to 3.10 or later
```

### Phase 3: Configure Tool

**Detect Current Tool:**
- Look for `.claude/` → Claude Code
- Look for `.opencode/` → OpenCode
- Look for `.cline/` → Cline
- Look for `.cursor/` → Cursor

**For Claude Code:**

1. **Plugins** - Update `.claude/settings.json`:
   ```json
   {
     "enabledPlugins": {
       "plugin-name@marketplace": true
     }
   }
   ```

2. **MCP Servers** - Generate `.mcp.json`:
   ```json
   {
     "server-name": {
       "type": "http",
       "url": "https://...",
       "headers": {
         "Authorization": "Bearer ${ENV_VAR}"
       }
     }
   }
   ```

3. **Hooks** - Report hook configuration (requires manual setup):
   ```
   Hooks defined in agent.toml:
   - post_tool_use: rustfmt on *.rs files
   - stop: verification script

   To enable hooks, add to your Claude Code settings.
   ```

### Phase 4: Report Status

```
Bootstrap complete for delft-core

Environment:
  ✓ All required commands found (git, cargo, rustfmt, npx)
  ✓ All runtime versions satisfied (rust 1.78.0, node 20.11.0)
  ⚠ 1 optional env var not set (TAVILY_API_KEY)

Remote Skills:
  ✓ 34 remote skills installed
  ⚠ 1 skill failed to install (see above)

Configuration:
  ✓ Enabled plugin: rust-analyzer-lsp
  ✓ Generated .mcp.json with 1 server
  ⚠ Hooks require manual configuration

Skills: 40 skills available (6 local, 34 remote)

Next steps:
  - Set TAVILY_API_KEY for enhanced web search
  - Review hooks configuration in agent.toml
  - Retry failed remote skill installs: npx skills add <source> -g -y
```

### Phase 5: Verification (--verify mode)

Run each verification check:

```
Running verification checks...

[1/4] fmt
  Command: cd src && cargo fmt --check
  ✓ PASSED (0.8s)

[2/4] build
  Command: cd src && cargo build
  ✓ PASSED (12.3s)

[3/4] clippy
  Command: cd src && cargo clippy --workspace -- -D warnings
  ✗ FAILED (8.2s)

  error: unused variable `x`
   --> src/crates/delft-cli/src/main.rs:42:9

[4/4] tests
  Command: cd src && cargo test
  ⏭ SKIPPED (trigger = explicit, use --verify to run)

Verification: 2/3 passed, 1 failed
```

## Environment Variable Checking

Check if variable is set (not its value):

```bash
# Bash approach
if [ -z "${VAR_NAME+x}" ]; then
  echo "VAR_NAME is not set"
fi
```

For Claude Code, use the Bash tool to check:
```bash
printenv | grep -q "^VAR_NAME=" && echo "set" || echo "not set"
```

## Command Checking

```bash
command -v git >/dev/null 2>&1 && echo "found" || echo "not found"
```

## Runtime Version Checking

```bash
# Rust
rustc --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+'

# Node
node --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+'

# Python
python3 --version | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?'
```

## File Operations

### Read agent.toml
Use the Read tool to read `agent.toml` from repository root.

### Update settings.json
Use the Edit tool to update `.claude/settings.json` with plugin configuration.

### Generate .mcp.json
Use the Write tool to create `.mcp.json` with MCP server configuration.

## Anti-Patterns

### The Assumption Trap
**Pattern:** Assuming environment is correct without validation.
**Problem:** Leads to confusing errors later.
**Fix:** Always validate. Report clearly what's missing.

### The Secret Leak
**Pattern:** Writing environment variable values to files.
**Problem:** Secrets in version control.
**Fix:** Only write `${VAR_NAME}` references, never values.

### The Implicit Bootstrap
**Pattern:** Auto-running bootstrap without user consent.
**Problem:** Security risk; unexpected changes.
**Fix:** Always require explicit `/agent-bootstrap` invocation.

### The Over-Configuration
**Pattern:** Configuring everything even when not needed.
**Problem:** Confusing state; hard to debug.
**Fix:** Only configure what's declared in manifest.

## Example Interactions

### Example 1: Fresh Start

**User:** `/agent-bootstrap`

**Your approach:**
1. Read `agent.toml` from repository root
2. Validate environment requirements
3. Configure Claude Code settings
4. Generate MCP config if servers defined
5. Report status and next steps

---

### Example 2: Verification

**User:** `/agent-bootstrap --verify`

**Your approach:**
1. Read verification checks from `agent.toml`
2. Run each check with `trigger = "stop"` or `trigger = "explicit"`
3. Report pass/fail for each
4. Summarize results

---

### Example 3: Check Mode

**User:** `/agent-bootstrap --check`

**Your approach:**
1. Parse `agent.toml`
2. Report what would be validated and configured
3. Do not make any changes
4. List any issues found

---

### Example 4: No Manifest

**User:** `/agent-bootstrap` (no agent.toml exists)

**Your approach:**
1. Report that no manifest found
2. Offer to create a starter manifest based on project detection
3. If user agrees, create minimal `agent.toml`
4. Link to specification documentation

## Integration Graph

### Inbound (From Other Skills)
| Source Skill | Source State | Leads to State |
|--------------|--------------|----------------|
| (none) | - | AB0 or AB1 |

### Outbound (To Other Skills)
| This State | Leads to Skill | Target State |
|------------|----------------|--------------|
| AB2 (configured) | gitea-workflow | (ready to work) |
| AB3 (verified) | (any) | (environment confirmed) |

### Complementary Skills
| Skill | Relationship |
|-------|--------------|
| find-skills | Discover skills listed in manifest |
| context-network | May be bootstrapped after environment setup |

## Manifest Schema Reference

See `docs/agent-toml-spec.md` for the complete schema specification.

Key sections:
- `[manifest]` - version (1.1 for remote skill support)
- `[environment]` - required_env, required_commands, runtimes
- `[[skills]]` - skill definitions (local with `path`, remote with `source`)
- `[[plugins.{tool}]]` - plugin configuration
- `[[mcp.servers]]` - MCP server definitions
- `[[hooks.{tool}]]` - hook configuration
- `[[verification.checks]]` - verification checks

### Skills Schema (v1.1)

```toml
# Local skill
[[skills]]
name = "delft-authoring"
path = ".claude/skills/delft-authoring"

# Remote skill (GitHub)
[[skills]]
name = "code-review"
source = "jwynia/agent-skills@code-review"

# Remote skill with version pin
[[skills]]
name = "gitea-workflow"
source = "jwynia/agent-skills@gitea-workflow"
version = "v1.0.0"
```
