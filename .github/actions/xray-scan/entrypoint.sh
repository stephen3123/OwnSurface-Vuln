#!/bin/sh
set -e

URL="$1"
API_KEY="$2"
FAIL_ON="${3:-critical}"
FORMAT="${4:-sarif}"
CHECKS="$5"

export OWNSURFACE_API_KEY="$API_KEY"

echo "::group::OwnSurface Security Scan"
echo "Scanning: $URL"
echo "Fail on: $FAIL_ON"

# Run intelligence scan and capture output
SCAN_OUTPUT=$(ownsurface scan "$URL" --format json --api-key "$API_KEY" 2>&1) || true

# Parse findings counts from security_findings (intelligence scan results)
FINDINGS_COUNT=$(echo "$SCAN_OUTPUT" | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
  const findings = (data.security_findings || []);
  console.log(findings.length);
" 2>/dev/null || echo "0")

CRITICAL_COUNT=$(echo "$SCAN_OUTPUT" | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
  const findings = (data.security_findings || []);
  console.log(findings.filter(f => f.severity === 'critical').length);
" 2>/dev/null || echo "0")

HIGH_COUNT=$(echo "$SCAN_OUTPUT" | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
  const findings = (data.security_findings || []);
  console.log(findings.filter(f => f.severity === 'high').length);
" 2>/dev/null || echo "0")

echo "Findings: $FINDINGS_COUNT (Critical: $CRITICAL_COUNT, High: $HIGH_COUNT)"

# Set outputs
echo "findings-count=$FINDINGS_COUNT" >> "$GITHUB_OUTPUT"
echo "critical-count=$CRITICAL_COUNT" >> "$GITHUB_OUTPUT"
echo "high-count=$HIGH_COUNT" >> "$GITHUB_OUTPUT"

# Generate SARIF if requested
if [ "$FORMAT" = "sarif" ]; then
  SARIF_FILE="/tmp/ownsurface-results.sarif"
  ownsurface scan "$URL" --format sarif --api-key "$API_KEY" > "$SARIF_FILE" 2>/dev/null || true

  if [ -f "$SARIF_FILE" ] && [ -s "$SARIF_FILE" ]; then
    echo "sarif-file=$SARIF_FILE" >> "$GITHUB_OUTPUT"
    cp "$SARIF_FILE" "$GITHUB_WORKSPACE/ownsurface-results.sarif" 2>/dev/null || true
  fi
fi

echo "::endgroup::"

# Fail on severity threshold using the CLI's built-in --fail-on flag
ownsurface scan "$URL" --api-key "$API_KEY" --fail-on "$FAIL_ON" > /dev/null 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "::error::Security scan failed: findings at or above '$FAIL_ON' severity detected"
  exit 1
fi
