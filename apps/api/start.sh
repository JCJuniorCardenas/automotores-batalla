#!/bin/sh
# Arranque de la API en producción: aplica migraciones, opcionalmente siembra, y levanta el servidor.
set -e

pnpm exec prisma migrate deploy

# RUN_SEED=1 carga el admin y los autos de ejemplo (idempotente). Sacar la variable una vez cargado.
if [ "$RUN_SEED" = "1" ]; then
  pnpm exec tsx prisma/seed.ts
fi

exec node dist/main.js
