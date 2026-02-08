# Frontend Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --production=false

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
# Using properly formatted dummy keys for build (real keys provided at runtime via k8s secrets)
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YnVpbGRfdGltZV9wbGFjZWhvbGRlcl9rZXlfZm9yX2RvY2tlcl9idWlsZA==
ARG CLERK_SECRET_KEY=sk_test_YnVpbGRfdGltZV9zZWNyZXRfa2V5X3BsYWNlaG9sZGVyX2Zvcl9kb2NrZXJfYnVpbGQ=

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV CLERK_SECRET_KEY=$CLERK_SECRET_KEY

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

CMD ["node", "server.js"]
