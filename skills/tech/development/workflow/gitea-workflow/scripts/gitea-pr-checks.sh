#!/bin/bash
# Check PR review and approval status via Gitea API
#
# Usage: gitea-pr-checks.sh <owner> <repo> <pr-number>
#
# Environment variables:
#   GITEA_URL   - Base URL of your Gitea instance (e.g., https://gitea.example.com)
#   GITEA_TOKEN - Personal access token for authentication
#
# Output (JSON):
#   {
#     "approved": true/false,
#     "review_count": N,
#     "approvals": N,
#     "changes_requested": N,
#     "comments": N,
#     "mergeable": true/false,
#     "state": "open/closed/merged"
#   }
#
# Exit codes:
#   0 - Success
#   1 - Error

set -e

# Check arguments
if [ $# -lt 3 ]; then
    echo "Usage: $0 <owner> <repo> <pr-number>" >&2
    echo "Example: $0 myorg myrepo 42" >&2
    exit 1
fi

OWNER="$1"
REPO="$2"
PR_NUM="$3"

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

# Fetch PR details
pr_response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: token $GITEA_TOKEN" \
    -H "Accept: application/json" \
    "$GITEA_URL/api/v1/repos/$OWNER/$REPO/pulls/$PR_NUM")

pr_http_code=$(echo "$pr_response" | tail -n1)
pr_body=$(echo "$pr_response" | sed '$d')

if [ "$pr_http_code" != "200" ]; then
    echo "Error: Failed to fetch PR details (HTTP $pr_http_code)" >&2
    echo "$pr_body" >&2
    exit 1
fi

# Extract PR state and mergeable status
pr_state=$(echo "$pr_body" | jq -r '.state // "unknown"')
mergeable=$(echo "$pr_body" | jq -r '.mergeable // false')

# Fetch PR reviews
reviews_response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: token $GITEA_TOKEN" \
    -H "Accept: application/json" \
    "$GITEA_URL/api/v1/repos/$OWNER/$REPO/pulls/$PR_NUM/reviews")

reviews_http_code=$(echo "$reviews_response" | tail -n1)
reviews_body=$(echo "$reviews_response" | sed '$d')

if [ "$reviews_http_code" != "200" ]; then
    echo "Error: Failed to fetch PR reviews (HTTP $reviews_http_code)" >&2
    echo "$reviews_body" >&2
    exit 1
fi

# Count reviews by type
# Gitea review states: PENDING, APPROVED, REQUEST_CHANGES, COMMENT
if [ "$reviews_body" = "[]" ] || [ "$reviews_body" = "null" ] || [ -z "$reviews_body" ]; then
    review_count=0
    approvals=0
    changes_requested=0
    comments=0
else
    review_count=$(echo "$reviews_body" | jq 'length')
    approvals=$(echo "$reviews_body" | jq '[.[] | select(.state == "APPROVED")] | length')
    changes_requested=$(echo "$reviews_body" | jq '[.[] | select(.state == "REQUEST_CHANGES")] | length')
    comments=$(echo "$reviews_body" | jq '[.[] | select(.state == "COMMENT")] | length')
fi

# Determine if approved (at least one approval and no changes requested)
if [ "$approvals" -gt 0 ] && [ "$changes_requested" -eq 0 ]; then
    approved="true"
else
    approved="false"
fi

# Output JSON result
cat <<EOF
{
  "approved": $approved,
  "review_count": $review_count,
  "approvals": $approvals,
  "changes_requested": $changes_requested,
  "comments": $comments,
  "mergeable": $mergeable,
  "state": "$pr_state"
}
EOF
