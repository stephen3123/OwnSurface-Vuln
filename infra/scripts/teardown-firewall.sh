#!/bin/bash
# Per-scan iptables firewall teardown
# Usage: teardown-firewall.sh <scan_id>

set -euo pipefail

SCAN_ID="$1"
CHAIN="OFFENSIVE_${SCAN_ID}"
CHAIN="${CHAIN:0:28}"

# Remove from OUTPUT chain
iptables -D OUTPUT -j "$CHAIN" 2>/dev/null || true

# Flush and delete chain
iptables -F "$CHAIN" 2>/dev/null || true
iptables -X "$CHAIN" 2>/dev/null || true

echo "Firewall chain $CHAIN removed"
