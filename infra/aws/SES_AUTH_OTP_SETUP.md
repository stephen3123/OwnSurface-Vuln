# SES auth OTP setup

This repo now uses the Amazon SES API for registration verification and password-reset OTP mail.

## 1. Request production access

Run:

```bash
cd /opt/xrayai/infra/aws
CONTACT_EMAIL=ops@ownsurface.com WEBSITE_URL=https://ownsurface.com ./request_ses_production_access.sh
```

That submits the SES production-access request in `eu-north-1` with a transactional-email use case.

## 2. Create SES resources

Run:

```bash
cd /opt/xrayai/infra/aws
OPERATOR_EMAIL=ops@ownsurface.com ./setup_ses_auth_otp.sh
```

This creates:

- the `auth-otp-prod` SES configuration set
- the `auth-otp-events` SNS topic
- the `ownsurface.com` SES domain identity
- the custom MAIL FROM domain configuration for `bounce.ownsurface.com`

The script prints the `get-email-identity` JSON. Use that output to publish the SES DKIM and verification records in the external DNS provider for `ownsurface.com`.

## 3. DNS records to publish manually

Publish the DKIM CNAME records from `aws sesv2 get-email-identity`.

Publish the MAIL FROM records for `bounce.ownsurface.com`.

Add DMARC:

```text
_dmarc.ownsurface.com TXT "v=DMARC1; p=none; adkim=s; aspf=s; rua=mailto:dmarc@ownsurface.com"
```

Leave the existing root SPF record unchanged for now.

## 4. EC2 runtime permissions

Attach an IAM role to the EC2 instance with at least:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

The app uses the AWS default credential chain. Do not place AWS access keys in `.env` for production.

## 5. Application env

Set these values in the API environment:

```env
AWS_REGION=eu-north-1
AWS_SES_FROM_EMAIL=no-reply@ownsurface.com
AWS_SES_FROM_NAME=OwnSurface
AWS_SES_CONFIGURATION_SET=auth-otp-prod
OTP_HMAC_SECRET=<long-random-secret>
OTP_TTL_SECONDS=600
OTP_RESEND_COOLDOWN_SECONDS=60
```
