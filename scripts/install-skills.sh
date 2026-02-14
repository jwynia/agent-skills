#!/usr/bin/env bash
# install-skills.sh — Install agent skills into .claude/skills/ for slash command access
#
# Flattens the nested skills/ development structure into a flat .claude/skills/ directory.
# Each skill directory (containing SKILL.md + optional scripts/, data/, etc.) is copied as-is.
#
# Usage: bash scripts/install-skills.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DST="$REPO_ROOT/.claude/skills"
SKILLS_SRC="$REPO_ROOT/skills"

# Clean previous install (idempotent)
if [ -d "$SKILLS_DST" ]; then
  rm -rf "$SKILLS_DST"
fi

mkdir -p "$SKILLS_DST"

installed=0
skipped=0

while IFS= read -r skill_md; do
  skill_dir="$(dirname "$skill_md")"
  skill_name="$(basename "$skill_dir")"

  # Check for name collision
  if [ -d "$SKILLS_DST/$skill_name" ]; then
    echo "  Warning: duplicate skill name '$skill_name', skipping $skill_dir"
    skipped=$((skipped + 1))
    continue
  fi

  # Copy the entire skill directory
  cp -r "$skill_dir" "$SKILLS_DST/$skill_name"
  installed=$((installed + 1))
done < <(find "$SKILLS_SRC" -name "SKILL.md" -type f | sort)

echo "Installed $installed skills to .claude/skills/"
if [ "$skipped" -gt 0 ]; then
  echo "Skipped $skipped duplicates"
fi
