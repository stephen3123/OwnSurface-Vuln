#!/bin/bash
# Per-scan iptables firewall setup
# Usage: setup-firewall.sh <scan_id> <nats_ip> <postgres_ip> <dns_ip> [approved_ips...]
#
# Creates an iptables chain that only allows traffic to:
# - NATS (tcp/4222)
# - PostgreSQL (tcp/5432)
# - DNS (udp+tcp/53)
# - Approved target IPs (all ports)
# Everything else is DROPped and logged.

set -euo pipefail

SCAN_ID="$1"
NATS_IP="$2"
PG_IP="$3"
DNS_IP="$4"
shift 4

CHAIN="OFFENSIVE_${SCAN_ID}"

# Truncate chain name to iptables max (28 chars)
CHAIN="${CHAIN:0:28}"

# Create chain
iptables -N "$CHAIN" 2>/dev/null || iptables -F "$CHAIN"

# Allow established/related connections
iptables -A "$CHAIN" -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow loopback
iptables -A "$CHAIN" -o lo -j ACCEPT

# Allow NATS
iptables -A "$CHAIN" -d "$NATS_IP" -p tcp --dport 4222 -j ACCEPT

# Allow PostgreSQL
iptables -A "$CHAIN" -d "$PG_IP" -p tcp --dport 5432 -j ACCEPT

# Allow DNS (both UDP and TCP)
iptables -A "$CHAIN" -d "$DNS_IP" -p udp --dport 53 -j ACCEPT
iptables -A "$CHAIN" -d "$DNS_IP" -p tcp --dport 53 -j ACCEPT
# Allow Google DNS as fallback
iptables -A "$CHAIN" -d 8.8.8.8 -p udp --dport 53 -j ACCEPT
iptables -A "$CHAIN" -d 8.8.8.8 -p tcp --dport 53 -j ACCEPT
iptables -A "$CHAIN" -d 8.8.4.4 -p udp --dport 53 -j ACCEPT
iptables -A "$CHAIN" -d 8.8.4.4 -p tcp --dport 53 -j ACCEPT

# Allow approved target IPs
for IP in "$@"; do
  iptables -A "$CHAIN" -d "$IP" -j ACCEPT
done

# Log and drop everything else
iptables -A "$CHAIN" -j LOG --log-prefix "[SCOPE-BLOCKED] " --log-level 4
iptables -A "$CHAIN" -j DROP

# Insert chain into OUTPUT
iptables -I OUTPUT 1 -j "$CHAIN"

echo "Firewall chain $CHAIN created with ${#@} approved IPs"
