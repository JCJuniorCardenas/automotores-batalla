# API (NestJS + Prisma). Contexto de build: la RAÍZ del repo.
#   docker build -f apps/api/Dockerfile -t batalla-api .
FROM node:24-slim

# openssl lo necesita Prisma; ca-certificates para conectar a R2/S3.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@12.14.0

WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter api...

COPY packages/shared packages/shared
COPY apps/api apps/api
COPY seed seed

# prisma generate no se conecta a la base, pero su config exige que DATABASE_URL exista.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
    pnpm --filter @batalla/shared build \
 && DATABASE_URL=postgresql://build:build@localhost:5432/build \
    pnpm --filter api exec prisma generate \
 && pnpm --filter api build

ENV NODE_ENV=production
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["sh", "start.sh"]
