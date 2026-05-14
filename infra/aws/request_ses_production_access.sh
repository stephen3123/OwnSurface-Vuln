#!/bin/bash
set -euo pipefail

REGION="${AWS_REGION:-eu-north-1}"
WEBSITE_URL="${WEBSITE_URL:-https://ownsurface.com}"
CONTACT_EMAIL="${CONTACT_EMAIL:-}"

if [ -z "$CONTACT_EMAIL" ]; then
  echo "Set CONTACT_EMAIL to the operator mailbox that should receive SES account notices."
  exit 1
fi

aws sesv2 put-account-details \
  --region "$REGION" \
  --production-access-enabled \
  --mail-type TRANSACTIONAL \
  --website-url "$WEBSITE_URL" \
  --contact-language EN \
  --use-case-description "OwnSurface sends transactional one-time verification codes and password reset codes for account security workflows." \
  --additional-contact-email-addresses "$CONTACT_EMAIL"

aws sesv2 get-account --region "$REGION"
