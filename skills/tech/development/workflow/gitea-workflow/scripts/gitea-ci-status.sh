#!/bin/bash
# Check CI status for a commit via Gitea API
#
# Usage: gitea-ci-status.sh <owner> <repo> <commit-sha>
#
# Environment variables:
#   GITEA_URL   - Base URL of your Gitea instance (e.g., https://gitea.example.com)
#   GITEA_TOKEN - Personal access token for authentication
#
# Returns:
#   pending  - CI is still running
#   success  - All checks passed
#   failure  - One or more checks failed
#   error    - An error occurred
#   none     - No CI status found (no external CI configured or not yet run)
#
# Exit codes:
#   0 - Success (status retrieved)
#   1 - Error (missing arguments or API failure)

set -e

# Check arguments
if [ $# -lt 3 ]; then
    echo "Usage: $0 <owner> <repo> <commit-sha>" >&2
    echo "Example: $0 myorg myrepo abc123def" >&2
    exit 1
fi

OWNER="$1"
REPO="$2"
REF="$3"

# Check environment variables
if [ -z "$GITEA_URL" ]; then
    echo "Error: GITEA_URL environment variable not set" >&2
    exit 1
fi

if [ -z "$GITEA_TOKEN" ]; then
    echo "Error: GITEA_TOKEN environment variable not set" >&2
    exit 1
fi

# Remove trailing slash from GITEA_URL if present
GITEA_URL="${GITEA_URL%/}"

# Fetch commit statuses from Gitea API
response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: token $GITEA_TOKEN" \
    -H "Accept: application/json" \
    "$GITEA_URL/api/v1/repos/$OWNER/$REPO/commits/$REF/statuses")

# Extract HTTP status code (last line) and body (everything else)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

# Check for HTTP errors
if [ "$http_code" != "200" ]; then
    echo "Error: API returned HTTP $http_code" >&2
    echo "$body" >&2
    exit 1
fi

# Check if response is empty array (no statuses)
if [ "$body" = "[]" ] || [ "$body" = "null" ] || [ -z "$body" ]; then
    echo "none"
    exit 0
fi

# Parse the statuses using jq
# Gitea returns statuses in reverse chronological order
# We look at the most recent status for each context
# Overall state is determined by:
#   - "failure" or "error" if any status has these
#   - "pending" if any status is pending and no failures
#   - "success" if all statuses are success

# Check for any failures first
has_failure=$(echo "$body" | jq -r '[.[] | select(.state == "failure" or .state == "error")] | length > 0')
if [ "$has_failure" = "true" ]; then
    echo "failure"
    exit 0
fi

# Check for any pending
has_pending=$(echo "$body" | jq -r '[.[] | select(.state == "pending")] | length > 0')
if [ "$has_pending" = "true" ]; then
    echo "pending"
    exit 0
fi

# Check if all are success
all_success=$(echo "$body" | jq -r '[.[] | select(.state == "success")] | length > 0')
if [ "$all_success" = "true" ]; then
    echo "success"
    exit 0
fi

# Unknown state
echo "pending"
exit 0
