FROM node:22-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json .npmrc ./
# Install all deps + missing peer deps that get hoisted in the monorepo
RUN npm install --install-strategy=nested && \
    npm install --no-save @opentelemetry/api @opentelemetry/core @opentelemetry/sdk-trace-base @opentelemetry/semantic-conventions prop-types

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Sentry is optional — skip source-map upload in Docker builds
ENV SENTRY_ORG=""
ENV SENTRY_PROJECT=""
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
