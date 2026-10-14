FROM node:22-alpine AS base

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

# "Loja" no menu: fixado no build (env do next.config.ts). Abrir a loja = build com --build-arg LOJA_NO_MENU=1.
ARG LOJA_NO_MENU
ENV LOJA_NO_MENU=$LOJA_NO_MENU

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

# Configura as pastas do Standalone. data = DATA_DIR (volume): loja.db e loja/fotos/ gravam aqui.
RUN mkdir .next data
RUN chown nextjs:nodejs .next data

# Copia os arquivos necessários pro standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATA_DIR=/app/data

CMD ["node", "server.js"]
