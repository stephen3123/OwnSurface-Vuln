#!/bin/bash
set -euo pipefail

REGION="${AWS_REGION:-eu-north-1}"
DOMAIN="${DOMAIN:-ownsurface.com}"
MAIL_FROM_DOMAIN="${MAIL_FROM_DOMAIN:-bounce.ownsurface.com}"
CONFIG_SET="${CONFIG_SET:-auth-otp-prod}"
SNS_TOPIC_NAME="${SNS_TOPIC_NAME:-auth-otp-events}"
EVENT_DESTINATION_NAME="${EVENT_DESTINATION_NAME:-auth-otp-sns}"
OPERATOR_EMAIL="${OPERATOR_EMAIL:-}"

if ! aws sesv2 get-configuration-set --region "$REGION" --configuration-set-name "$CONFIG_SET" >/dev/null 2>&1; then
  aws sesv2 create-configuration-set --region "$REGION" --configuration-set-name "$CONFIG_SET"
fi

TOPIC_ARN=$(aws sns create-topic --region "$REGION" --name "$SNS_TOPIC_NAME" --query 'TopicArn' --output text)

if [ -n "$OPERATOR_EMAIL" ]; then
  aws sns subscribe \
    --region "$REGION" \
    --topic-arn "$TOPIC_ARN" \
    --protocol email \
    --notification-endpoint "$OPERATOR_EMAIL" >/dev/null
fi

if ! aws sesv2 get-email-identity --region "$REGION" --email-identity "$DOMAIN" >/dev/null 2>&1; then
  aws sesv2 create-email-identity --region "$REGION" --email-identity "$DOMAIN"
fi

aws sesv2 put-email-identity-mail-from-attributes \
  --region "$REGION" \
  --email-identity "$DOMAIN" \
  --mail-from-domain "$MAIL_FROM_DOMAIN" \
  --behavior-on-mx-failure REJECT_MESSAGE

aws sesv2 create-configuration-set-event-destination \
  --region "$REGION" \
  --configuration-set-name "$CONFIG_SET" \
  --event-destination-name "$EVENT_DESTINATION_NAME" \
  --event-destination "{\"Enabled\":true,\"MatchingEventTypes\":[\"BOUNCE\",\"COMPLAINT\",\"DELIVERY_DELAY\"],\"SnsDestination\":{\"TopicArn\":\"$TOPIC_ARN\"}}" >/dev/null 2>&1 || true

echo
echo "SES resources created in $REGION. Publish the external DNS records next."
echo
aws sesv2 get-email-identity --region "$REGION" --email-identity "$DOMAIN"
echo
echo "Recommended DMARC record:"
echo '_dmarc.'"$DOMAIN"' TXT "v=DMARC1; p=none; adkim=s; aspf=s; rua=mailto:dmarc@'"$DOMAIN"'"'
echo
echo "SNS topic ARN: $TOPIC_ARN"
