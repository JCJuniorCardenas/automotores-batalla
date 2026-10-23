# Web (Next.js). Contexto de build: la RAÍZ del repo.
#   docker build -f apps/web/Dockerfile -t batalla-web --build-arg API_INTERNAL_URL=http://api:3001 --build-arg NEXT_PUBLIC_SITE_URL=https://tu-dominio .
FROM node:24-slim

RUN npm install -g pnpm@12.14.0

WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter web...

COPY packages/shared packages/shared
COPY apps/web apps/web
# Solo los créditos de las fotos de ejemplo (página /creditos).
COPY seed/autos/credits.json seed/autos/credits.json

# Se usan en tiempo de BUILD: los rewrites de next.config.ts y las URLs absolutas (SEO) se fijan acá.
ARG API_INTERNAL_URL=http://localhost:3001
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG INSTAGRAM_PROFILE_URL=https://www.instagram.com/automotoresbatalla/
ENV API_INTERNAL_URL=$API_INTERNAL_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    INSTAGRAM_PROFILE_URL=$INSTAGRAM_PROFILE_URL

RUN pnpm --filter @batalla/shared build && pnpm --filter web build

ENV NODE_ENV=production
WORKDIR /app/apps/web
EXPOSE 3000
# Railway inyecta PORT.
CMD ["sh", "-c", "pnpm exec next start -p ${PORT:-3000}"]
