FROM node:20-alpine AS base

# Dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instala dependências usando npm
COPY package.json package-lock.json* ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desabilita telemetria
ENV NEXT_TELEMETRY_DISABLED=1

# Compila o projeto (usando standalone)
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/Collettaa/site-caicara"
LABEL org.opencontainers.image.description="Site institucional da Caicara, publicado em Docker Swarm com Traefik."

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Configura as pastas do Standalone
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia os arquivos necessários pro standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
