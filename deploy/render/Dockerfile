# Servicio ÚNICO (web + API) para Render gratis. Contexto de build: la RAÍZ del repo.
#   docker build -f deploy/render/Dockerfile -t batalla-render .
# La web escucha en $PORT (público) y proxea /api y /media a la API que corre en 127.0.0.1:3001 (interno).
FROM node:24-slim

# openssl lo necesita Prisma; ca-certificates para bajar las fotos de ejemplo y conectar a la base.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@12.14.0

WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter api... --filter web...

COPY packages/shared packages/shared
COPY apps/api apps/api
COPY apps/web apps/web
COPY seed seed
COPY deploy deploy

# Se fijan al compilar la web (Render pasa las variables de entorno como build args).
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG INSTAGRAM_PROFILE_URL=https://www.instagram.com/automotoresbatalla/
ENV API_INTERNAL_URL=http://127.0.0.1:3001 \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    INSTAGRAM_PROFILE_URL=$INSTAGRAM_PROFILE_URL

# prisma generate no se conecta a la base, pero su config exige que DATABASE_URL exista.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
    pnpm --filter @batalla/shared build \
 && DATABASE_URL=postgresql://build:build@localhost:5432/build \
    pnpm --filter api exec prisma generate \
 && pnpm --filter api build \
 && pnpm --filter web build

# Fotos de ejemplo: se bajan de Wikimedia Commons (no están en git) y se pre-generan las variantes WebP
# DENTRO de la imagen. El disco de Render gratis es efímero, pero lo que viene en la imagen se restaura
# en cada arranque; solo se pierden las fotos que se suban después desde el panel.
ENV UPLOAD_DIR=/app/uploads
RUN pnpm --filter api seed:fetch-photos \
 && DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm --filter api seed:prepare-media

ENV NODE_ENV=production \
    STORAGE_DRIVER=local \
    TRUST_PROXY=2
EXPOSE 10000
CMD ["node", "deploy/render/start.mjs"]
