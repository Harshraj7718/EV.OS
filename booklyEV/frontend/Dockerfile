FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM node:22-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
# Unset by default (serves the full app) — only set on a portal-scoped
# build (super-admin/admin/investor/rider/business). Vercel deployments
# don't use this Dockerfile at all; this exists so the same restriction
# can be tested/self-hosted via Docker too. See docs/vercel-deployment.md.
ARG NEXT_PUBLIC_PORTAL=
ENV NEXT_PUBLIC_PORTAL=$NEXT_PUBLIC_PORTAL
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
